import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

/**
 * QPay V2 Payment Check — Vercel Serverless Function
 * 
 * Frontend polls this endpoint to check if payment has been made.
 * Reads credentials from Firestore per-business.
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';

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

// Token cache per business
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getAccessToken(username: string, password: string): Promise<string> {
    const cacheKey = `${username}:${password}`;
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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { invoiceId, bizId } = req.body;

    if (!invoiceId || !bizId) {
        return res.status(400).json({ error: 'Missing invoiceId or bizId' });
    }

    try {
        // Read credentials from Firestore
        const bizDoc = await db.doc(`businesses/${bizId}`).get();
        if (!bizDoc.exists) return res.status(404).json({ error: 'Business not found' });

        const qpay = bizDoc.data()!.settings?.qpay;
        if (!qpay?.username || !qpay?.password) {
            return res.status(400).json({ error: 'QPay credentials not configured' });
        }

        const token = await getAccessToken(qpay.username, qpay.password);

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
