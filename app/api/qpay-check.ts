import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

/**
 * QPay V2 Payment Check — Vercel Serverless Function
 * 
 * For VIP: uses server-side env credentials
 * For Product: credentials from frontend (or resolved from Firestore via bizId)
 * 
 * When payment is confirmed, updates order status server-side using Admin SDK
 * (guest users can't update orders via client Firestore)
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';
const ALLOWED_ORIGINS = ['https://www.liscord.com', 'https://liscord.com', 'http://localhost:5173', 'http://localhost:3000'];

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'liscord-2b529',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

// Token cache
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getAccessToken(username: string, password: string): Promise<string> {
    const cacheKey = `${username}`;
    const cached = tokenCache[cacheKey];
    if (cached && Date.now() < cached.expiresAt - 300000) {
        return cached.token;
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const response = await fetch(`${QPAY_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) throw new Error(`QPay auth failed: ${response.status}`);

    const data = await response.json();
    tokenCache[cacheKey] = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };
    return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — restricted origins
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { invoiceId, qpayUsername, qpayPassword, purpose, bizId, orderId } = req.body;

    if (!invoiceId) {
        return res.status(400).json({ error: 'Missing invoiceId' });
    }

    // Resolve credentials based on purpose
    let username: string;
    let password: string;

    if (purpose === 'vip') {
        // VIP → server-side env credentials
        username = process.env.QPAY_VIP_USERNAME || 'GATE_SIM';
        password = process.env.QPAY_VIP_PASSWORD || '8r3bvsa3';
    } else {
        // Product → credentials from frontend
        if (!qpayUsername || !qpayPassword) {
            return res.status(400).json({ error: 'Missing QPay credentials' });
        }
        username = qpayUsername;
        password = qpayPassword;
    }

    try {
        const token = await getAccessToken(username, password);

        const checkResp = await fetch(`${QPAY_API_URL}/payment/check`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                object_type: 'INVOICE',
                object_id: invoiceId,
                offset: { page_number: 1, page_limit: 100 },
            }),
        });

        if (!checkResp.ok) {
            return res.status(500).json({ error: 'QPay check failed' });
        }

        const result = await checkResp.json();
        const payments = result.rows || [];
        const paidPayment = payments.find((p: any) => p.payment_status === 'PAID');

        // If payment confirmed AND we have order reference, update server-side
        if (paidPayment && bizId && orderId) {
            try {
                const orderRef = db.doc(`businesses/${bizId}/orders/${orderId}`);
                const orderSnap = await orderRef.get();
                
                if (orderSnap.exists && orderSnap.data()?.paymentStatus !== 'paid') {
                    const orderData = orderSnap.data()!;
                    const totalAmount = orderData.financials?.totalAmount || 0;
                    const now = admin.firestore.FieldValue.serverTimestamp();

                    await orderRef.update({
                        paymentStatus: 'paid',
                        paymentVerifiedAt: now,
                        paymentVerifiedBy: 'qpay_poll',
                        'financials.paidAmount': totalAmount,
                        'financials.balanceDue': 0,
                        'financials.payments': admin.firestore.FieldValue.arrayUnion({
                            id: `qpay_${paidPayment.payment_id || Date.now()}`,
                            amount: totalAmount,
                            method: 'qpay',
                            note: 'QPay төлбөр',
                            paidAt: now,
                            recordedBy: 'qpay_poll',
                        }),
                        updatedAt: now,
                    });

                    // Grant membership if applicable
                    if (orderData.orderType === 'membership' && orderData.membershipCategoryId) {
                        const phone = orderData.customer?.phone || '';
                        const durationDays = orderData.membershipDurationDays || 30;
                        const expDate = new Date();
                        expDate.setDate(expDate.getDate() + durationDays);

                        await db.collection(`businesses/${bizId}/memberships`).add({
                            phone,
                            categoryId: orderData.membershipCategoryId,
                            orderId,
                            grantedAt: now,
                            expiresAt: admin.firestore.Timestamp.fromDate(expDate),
                            status: 'active',
                            createdBy: 'qpay_poll',
                        });
                    }

                    console.log(`✅ QPay poll confirmed payment: Order ${orderId}`);
                }
            } catch (updateErr) {
                console.error('Failed to update order via poll:', updateErr);
                // Don't fail the response — frontend still gets paid=true
            }
        }

        return res.status(200).json({
            paid: !!paidPayment,
            payment: paidPayment || null,
            count: result.count || 0,
        });

    } catch (err: any) {
        console.error('QPay check error:', err);
        return res.status(500).json({ error: err.message || 'Check failed' });
    }
}
