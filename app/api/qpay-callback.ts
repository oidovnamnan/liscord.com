import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

/**
 * QPay V2 Callback — Vercel Serverless Function
 * 
 * QPay hits this URL when payment is completed.
 * Verifies payment with QPay API using per-business credentials,
 * updates order status in Firestore.
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';

// Initialize Firebase Admin (only once)
let adminInitError: string | null = null;
if (!admin.apps.length) {
    try {
        // Try FIREBASE_SERVICE_ACCOUNT JSON first (most reliable), then individual env vars
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountJson) {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } else {
            const projectId = process.env.FIREBASE_PROJECT_ID || 'liscord-2b529';
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
            // Handle various escape formats
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            if (!clientEmail || !privateKey) {
                adminInitError = `Missing Firebase credentials: clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`;
                console.error(adminInitError);
            } else {
                admin.initializeApp({
                    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
                });
            }
        }
    } catch (initErr: any) {
        adminInitError = `Firebase Admin init failed: ${initErr.message}`;
        console.error(adminInitError);
    }
}

const db = admin.apps.length ? admin.firestore() : null;

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
    // QPay sends GET or POST callbacks
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!db) {
        console.error('Firebase Admin not initialized:', adminInitError);
        return res.status(500).json({ error: `Firebase Admin not initialized: ${adminInitError}` });
    }

    const bizId = req.query.bizId as string;
    const orderId = req.query.orderId as string;

    console.log(`QPay callback received: bizId=${bizId}, orderId=${orderId}`);

    if (!bizId || !orderId) {
        return res.status(400).json({ error: 'Missing bizId or orderId' });
    }

    try {
        // 1. Get order first to determine type
        const orderRef = db.doc(`businesses/${bizId}/orders/${orderId}`);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = orderSnap.data()!;
        if (orderData.paymentStatus === 'paid') {
            return res.status(200).json({ message: 'Already paid' });
        }

        // 2. Determine credentials — VIP uses server-side, product uses business QPay
        let username: string;
        let password: string;

        const bizDoc = await db.doc(`businesses/${bizId}`).get();
        if (!bizDoc.exists) return res.status(404).json({ error: 'Business not found' });
        const bizData = bizDoc.data()!;

        if (orderData.orderType === 'membership') {
            // VIP/membership invoices — try server-side env credentials first,
            // fallback to business QPay credentials (invoice may have been created with either)
            if (process.env.QPAY_VIP_USERNAME && process.env.QPAY_VIP_PASSWORD) {
                username = process.env.QPAY_VIP_USERNAME;
                password = process.env.QPAY_VIP_PASSWORD;
            } else {
                // Fallback: use business's own QPay credentials
                const qpay = bizData.settings?.qpay;
                if (!qpay?.username || !qpay?.password) {
                    return res.status(400).json({ error: 'QPay credentials not configured (no VIP env + no business QPay)' });
                }
                username = qpay.username;
                password = qpay.password;
            }
        } else {
            // Product orders use business's own QPay credentials
            const qpay = bizData.settings?.qpay;
            if (!qpay?.username || !qpay?.password) {
                return res.status(400).json({ error: 'QPay credentials not configured' });
            }
            username = qpay.username;
            password = qpay.password;
        }

        // 3. Verify payment with QPay
        const invoiceId = orderData.qpayInvoiceId;
        if (!invoiceId) {
            return res.status(400).json({ error: 'No QPay invoice ID on order' });
        }

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

        const checkResult = await checkResp.json();
        const payments = checkResult.rows || [];
        const paidPayment = payments.find((p: any) => p.payment_status === 'PAID');

        if (!paidPayment) {
            return res.status(200).json({ message: 'Payment not confirmed yet' });
        }

        // 4. Update order as paid
        const now = admin.firestore.FieldValue.serverTimestamp();
        const totalAmount = orderData.financials?.totalAmount || 0;

        await orderRef.update({
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentVerifiedAt: now,
            paymentVerifiedBy: 'qpay',
            'financials.paidAmount': totalAmount,
            'financials.balanceDue': 0,
            'financials.payments': admin.firestore.FieldValue.arrayUnion({
                id: `qpay_${paidPayment.payment_id || Date.now()}`,
                amount: totalAmount,
                method: 'qpay',
                note: 'QPay төлбөр',
                paidAt: now,
                recordedBy: 'qpay_auto',
            }),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
                status: 'confirmed',
                at: new Date(),
                by: 'qpay_auto',
                byName: 'QPay Систем',
                note: `QPay төлбөр баталгаажлаа — ₮${totalAmount.toLocaleString()}`
            }),
            updatedAt: now,
        });

        // 4.5. Record QPay income in business-specific collection (no SMS bridge dependency)
        try {
            const orderNumber = orderData.orderNumber || orderId.slice(0, 6);
            const isMembership = orderData.orderType === 'membership';
            await db.collection(`businesses/${bizId}/qpay_income`).add({
                orderId,
                orderNumber,
                amount: totalAmount,
                customerName: orderData.customer?.name || 'Зочин',
                customerPhone: orderData.customer?.phone || '',
                type: isMembership ? 'membership' : 'product',
                bank: isMembership ? 'QPay VIP' : 'QPay',
                description: isMembership
                    ? `VIP гишүүнчлэл — ${orderData.customer?.name || 'Зочин'}`
                    : `Захиалга #${orderNumber}`,
                qpayPaymentId: paidPayment.payment_id || '',
                status: 'confirmed',
                createdAt: now,
            });
        } catch (incomeErr) {
            console.error('QPay income recording error (non-critical):', incomeErr);
        }

        // 5. Grant membership if applicable
        if (orderData.orderType === 'membership' && orderData.membershipCategoryId) {
            const phone = orderData.customer?.phone || '';
            const durationDays = orderData.membershipDurationDays || 30;
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + durationDays);

            await db.collection(`businesses/${bizId}/memberships`).add({
                customerPhone: phone,
                categoryId: orderData.membershipCategoryId,
                orderId,
                purchasedAt: now,
                grantedAt: now,
                expiresAt: admin.firestore.Timestamp.fromDate(expDate),
                amountPaid: totalAmount,
                status: 'active',
                createdBy: 'qpay_auto',
            });
        }

        // 6. Create notification
        const orderNumber = orderData.orderNumber || orderId.slice(0, 6);
        await db.collection(`businesses/${bizId}/notifications`).add({
            templateId: 'payment.received',
            type: 'qpay_payment',
            title: orderData.orderType === 'membership'
                ? '✅ VIP гишүүнчлэл − QPay төлбөр баталгаажлаа'
                : `✅ QPay төлбөр баталгаажлаа #${orderNumber}`,
            body: `₮${totalAmount.toLocaleString()} — ${orderData.customer?.name || 'Зочин'}`,
            icon: '✅',
            link: '/app/orders',
            referenceId: orderId,
            readBy: {},
            priority: 'high',
            createdAt: now,
            createdBy: 'system',
        });

        console.log(`✅ QPay payment confirmed: Order ${orderId} (₮${totalAmount})`);

        // 7. Send Messenger confirmation if order came from chat
        if (orderData.messengerPsid) {
            try {
                const psid = orderData.messengerPsid;
                // Get page access token
                const fbSettingsSnap = await db.collection('businesses').doc(bizId)
                    .collection('fbSettings').doc('config').get();
                const pageToken = fbSettingsSnap.data()?.pageAccessToken;

                if (pageToken) {
                    const confirmText = `✅ Баярлалаа! Захиалга #${orderNumber} — ₮${totalAmount.toLocaleString()} төлбөр амжилттай баталгаажлаа! 🎉`;

                    // Send via Facebook
                    await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipient: { id: psid },
                            message: { text: confirmText },
                        }),
                    });

                    // Save to chat
                    const convRef = db.doc(`businesses/${bizId}/fbConversations/${psid}`);
                    await convRef.set({
                        lastMessage: `✅ Төлбөр баталгаажлаа #${orderNumber}`,
                        lastMessageAt: now,
                        updatedAt: now,
                    }, { merge: true });
                    await convRef.collection('messages').add({
                        text: confirmText,
                        direction: 'outbound',
                        senderId: 'page',
                        senderName: 'Систем',
                        timestamp: now,
                        isAI: true,
                        isPaymentConfirmation: true,
                        orderId,
                        deliveredAt: null,
                        readAt: null,
                    });
                }
            } catch (msgErr) {
                console.error('Messenger confirmation error:', msgErr);
            }
        }

        return res.status(200).json({ message: 'Payment confirmed' });

    } catch (err: any) {
        console.error('QPay callback error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
