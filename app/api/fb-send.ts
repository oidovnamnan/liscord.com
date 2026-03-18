/**
 * Facebook Messenger Send API — Extended
 * 
 * POST actions:
 *   action=send_text    — Send text message
 *   action=send_image   — Send image via URL
 *   action=send_button  — Send button template (product card, payment link)
 *   action=send_payment — Create QPay invoice + send payment button
 *   action=typing_on    — Show typing indicator
 *   action=mark_seen    — Mark message as seen
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'liscord-2b529';
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch {
        admin.initializeApp({ projectId });
    }
}

const db = admin.firestore();
const QPAY_API_URL = 'https://merchant.qpay.mn/v2';

// QPay token cache
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getQPayToken(username: string, password: string): Promise<string> {
    const cached = tokenCache[username];
    if (cached && Date.now() < cached.expiresAt - 300000) return cached.token;

    const resp = await fetch(`${QPAY_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
    });

    if (!resp.ok) throw new Error(`QPay auth failed: ${resp.status}`);
    const data = await resp.json();
    tokenCache[username] = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
    return data.access_token;
}

async function sendToFacebook(pageAccessToken: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const resp = await fetch('https://graph.facebook.com/v21.0/me/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: pageAccessToken }),
    });
    return resp.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bizId, recipientId, action = 'send_text', message, senderName, imageUrl, buttons, title, subtitle, amount, description } = req.body;

    if (!bizId || !recipientId) {
        return res.status(400).json({ error: 'Missing bizId or recipientId' });
    }

    try {
        // 1. Get Page Access Token
        const settingsSnap = await db.doc(`businesses/${bizId}/fbSettings/config`).get();
        const settings = settingsSnap.data();
        if (!settings?.pageAccessToken) {
            return res.status(400).json({ error: 'Facebook Page Access Token not configured' });
        }
        const token = settings.pageAccessToken;

        // ── TYPING ON ──
        if (action === 'typing_on') {
            await sendToFacebook(token, { recipient: { id: recipientId }, sender_action: 'typing_on' });
            return res.status(200).json({ success: true });
        }

        // ── MARK SEEN ──
        if (action === 'mark_seen') {
            await sendToFacebook(token, { recipient: { id: recipientId }, sender_action: 'mark_seen' });
            return res.status(200).json({ success: true });
        }

        // Show typing before any message
        await sendToFacebook(token, { recipient: { id: recipientId }, sender_action: 'typing_on' });

        // ── SEND TEXT ──
        if (action === 'send_text') {
            if (!message) return res.status(400).json({ error: 'Missing message' });

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: { text: message },
            });

            // Save to Firestore
            const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
            await convRef.set({
                lastMessage: message,
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await convRef.collection('messages').add({
                text: message,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                fbMessageId: (fbResult as any).message_id || '',
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as any).message_id });
        }

        // ── SEND IMAGE ──
        if (action === 'send_image') {
            if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: {
                    attachment: { type: 'image', payload: { url: imageUrl, is_reusable: true } },
                },
            });

            const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
            await convRef.set({
                lastMessage: '📷 Зураг',
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await convRef.collection('messages').add({
                text: '📷 Зураг',
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                fbMessageId: (fbResult as any).message_id || '',
                attachments: [{ type: 'image', url: imageUrl }],
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as any).message_id });
        }

        // ── SEND BUTTON TEMPLATE ──
        if (action === 'send_button') {
            if (!title || !buttons?.length) return res.status(400).json({ error: 'Missing title or buttons' });

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'button',
                            text: title,
                            buttons: buttons.map((b: { title: string; url?: string; payload?: string }) => (
                                b.url
                                    ? { type: 'web_url', url: b.url, title: b.title }
                                    : { type: 'postback', title: b.title, payload: b.payload || b.title }
                            )),
                        },
                    },
                },
            });

            const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
            await convRef.set({
                lastMessage: `📋 ${title}`,
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await convRef.collection('messages').add({
                text: `📋 ${title}`,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                fbMessageId: (fbResult as any).message_id || '',
                isTemplate: true,
                templateType: 'button',
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as any).message_id });
        }

        // ── SEND PAYMENT (QPay Invoice + Button Template) ──
        if (action === 'send_payment') {
            if (!amount) return res.status(400).json({ error: 'Missing amount' });

            // Get business QPay credentials
            const paymentSnap = await db.doc(`businesses/${bizId}/payment_settings/qpay`).get();
            const paySettings = paymentSnap.data();

            const qpayUsername = paySettings?.username || process.env.QPAY_VIP_USERNAME;
            const qpayPassword = paySettings?.password || process.env.QPAY_VIP_PASSWORD;
            const invoiceCode = paySettings?.invoiceCode || process.env.QPAY_VIP_INVOICE_CODE || 'GATE_SIM_INVOICE';

            if (!qpayUsername || !qpayPassword) {
                return res.status(400).json({ error: 'QPay credentials not configured' });
            }

            // Create QPay invoice
            const qpayToken = await getQPayToken(qpayUsername, qpayPassword);
            const invoiceId = `fb_${recipientId.slice(-6)}_${Date.now().toString(36)}`;

            const host = req.headers.host || 'www.liscord.com';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const callbackUrl = `${protocol}://${host}/api/qpay-callback?bizId=${bizId}&orderId=${invoiceId}`;

            const invoiceResp = await fetch(`${QPAY_API_URL}/invoice`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${qpayToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoice_code: invoiceCode,
                    sender_invoice_no: invoiceId,
                    invoice_receiver_code: recipientId,
                    invoice_description: description || `Messenger төлбөр — ${amount}₮`,
                    amount: amount,
                    callback_url: callbackUrl,
                }),
            });

            if (!invoiceResp.ok) {
                const err = await invoiceResp.json().catch(() => ({}));
                console.error('QPay invoice error:', err);
                return res.status(500).json({ error: 'QPay invoice creation failed', details: err });
            }

            const invoice = await invoiceResp.json();

            // Send button template with payment link
            const paymentText = `💳 Төлбөр: ${Number(amount).toLocaleString()}₮\n${description || 'Messenger-ээр илгээсэн нэхэмжлэх'}`;

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'button',
                            text: paymentText,
                            buttons: [
                                { type: 'web_url', url: invoice.qPay_shortUrl || `https://qpay.mn/payment/${invoice.invoice_id}`, title: '💳 Төлбөр төлөх' },
                            ],
                        },
                    },
                },
            });

            // Save to Firestore
            const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
            await convRef.set({
                lastMessage: `💳 Төлбөр: ${Number(amount).toLocaleString()}₮`,
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            await convRef.collection('messages').add({
                text: paymentText,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                fbMessageId: (fbResult as any).message_id || '',
                isPayment: true,
                paymentAmount: amount,
                paymentInvoiceId: invoice.invoice_id,
                paymentUrl: invoice.qPay_shortUrl,
                paymentQr: invoice.qr_image,
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({
                success: true,
                messageId: (fbResult as any).message_id,
                invoiceId: invoice.invoice_id,
                qrImage: invoice.qr_image,
                shortUrl: invoice.qPay_shortUrl,
            });
        }

        // ── CREATE ORDER + SEND PAYMENT (AI Flow) ──
        if (action === 'create_order_and_pay') {
            const { productIds, quantities, customerName, customerPsid } = req.body;
            if (!productIds?.length) return res.status(400).json({ error: 'Missing productIds' });

            // 1. Fetch products from Firestore
            const items: Array<{ productId: string; name: string; variant: string; quantity: number; unitPrice: number; costPrice: number; totalPrice: number; image: string | null }> = [];
            let subtotal = 0;

            for (let i = 0; i < productIds.length; i++) {
                const prodSnap = await db.doc(`businesses/${bizId}/products/${productIds[i]}`).get();
                if (!prodSnap.exists) continue;
                const p = prodSnap.data()!;
                const qty = quantities?.[i] || 1;
                const price = p.pricing?.salePrice || 0;
                const cost = p.pricing?.costPrice || 0;
                const total = price * qty;

                items.push({
                    productId: prodSnap.id,
                    name: p.name || 'Бараа',
                    variant: '',
                    quantity: qty,
                    unitPrice: price,
                    costPrice: cost,
                    totalPrice: total,
                    image: p.images?.[0] || null,
                });
                subtotal += total;
            }

            if (items.length === 0) {
                return res.status(400).json({ error: 'No valid products found' });
            }

            // 2. Generate order number
            const bizSnap = await db.doc(`businesses/${bizId}`).get();
            const bizData = bizSnap.data();
            const prefix = bizData?.settings?.orderPrefix || 'ORD';
            const counter = (bizData?.settings?.orderCounter || 0) + 1;
            const orderNumber = `${prefix}-${String(counter).padStart(4, '0')}`;

            // Update counter
            await db.doc(`businesses/${bizId}`).update({ 'settings.orderCounter': counter });

            // 3. Create Order in Firestore
            const orderData = {
                orderNumber,
                status: 'new',
                paymentStatus: 'unpaid',
                customer: {
                    id: null,
                    name: customerName || customerPsid || 'Messenger',
                    phone: '',
                    socialHandle: `FB:${customerPsid}`,
                },
                source: 'facebook',
                items,
                financials: {
                    subtotal,
                    discountType: 'fixed',
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: 0,
                    cargoFee: 0,
                    cargoIncluded: false,
                    totalAmount: subtotal,
                    payments: [],
                    paidAmount: 0,
                    balanceDue: subtotal,
                },
                assignedTo: null,
                assignedToName: null,
                notes: `Messenger-ээр AI захиалга (PSID: ${customerPsid})`,
                internalNotes: '',
                deliveryAddress: '',
                statusHistory: [{
                    status: 'new',
                    at: new Date(),
                    by: 'ai_messenger',
                    byName: 'AI Туслах',
                }],
                tags: ['messenger', 'ai'],
                createdBy: 'ai_messenger',
                createdByName: 'AI Туслах',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                isDeleted: false,
                orderType: 'standard',
                messengerPsid: customerPsid,
            };

            const orderRef = await db.collection(`businesses/${bizId}/orders`).add(orderData);
            const orderId = orderRef.id;

            // 4. Create QPay Invoice
            const qpay = bizData?.settings?.qpay;
            const qpayUsername = qpay?.username || process.env.QPAY_VIP_USERNAME;
            const qpayPassword = qpay?.password || process.env.QPAY_VIP_PASSWORD;
            const invoiceCode = qpay?.invoiceCode || process.env.QPAY_VIP_INVOICE_CODE || 'GATE_SIM_INVOICE';

            if (!qpayUsername || !qpayPassword) {
                // No QPay — just send order confirmation without payment
                const confirmText = `🛒 Захиалга #${orderNumber} үүслээ!\n\n${items.map(it => `• ${it.name} x${it.quantity} — ₮${it.totalPrice.toLocaleString()}`).join('\n')}\n\nНийт: ₮${subtotal.toLocaleString()}\n\nТөлбөрийн мэдээллийг оператор илгээнэ.`;

                const fbResult = await sendToFacebook(token, {
                    recipient: { id: recipientId },
                    message: { text: confirmText },
                });

                const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
                await convRef.set({ lastMessage: `🛒 Захиалга #${orderNumber}`, lastMessageAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
                await convRef.collection('messages').add({
                    text: confirmText, direction: 'outbound', senderId: 'page', senderName: senderName || 'AI Туслах',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(), fbMessageId: (fbResult as any).message_id || '',
                    isAI: true, orderId, deliveredAt: null, readAt: null,
                });

                return res.status(200).json({ success: true, orderId, orderNumber });
            }

            // QPay invoice
            const qpayToken = await getQPayToken(qpayUsername, qpayPassword);
            const host = req.headers.host || 'www.liscord.com';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const callbackUrl = `${protocol}://${host}/api/qpay-callback?bizId=${bizId}&orderId=${orderId}`;

            const invoiceResp = await fetch(`${QPAY_API_URL}/invoice`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${qpayToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice_code: invoiceCode,
                    sender_invoice_no: orderId,
                    invoice_receiver_code: customerPsid || 'messenger',
                    invoice_description: `Захиалга #${orderNumber} — ₮${subtotal.toLocaleString()}`,
                    amount: subtotal,
                    callback_url: callbackUrl,
                }),
            });

            if (!invoiceResp.ok) {
                return res.status(500).json({ error: 'QPay invoice failed' });
            }

            const invoice = await invoiceResp.json();

            // Save qpayInvoiceId to order
            await orderRef.update({ qpayInvoiceId: invoice.invoice_id });

            // 5. Send payment button via Messenger
            const payText = `🛒 Захиалга #${orderNumber}\n\n${items.map(it => `• ${it.name} x${it.quantity} — ₮${it.totalPrice.toLocaleString()}`).join('\n')}\n\nНийт: ₮${subtotal.toLocaleString()}`;

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'button',
                            text: payText,
                            buttons: [
                                { type: 'web_url', url: invoice.qPay_shortUrl || `https://qpay.mn/payment/${invoice.invoice_id}`, title: '💳 Төлбөр төлөх' },
                            ],
                        },
                    },
                },
            });

            // Save to chat
            const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
            await convRef.set({ lastMessage: `🛒 #${orderNumber} — ₮${subtotal.toLocaleString()}`, lastMessageAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            await convRef.collection('messages').add({
                text: payText, direction: 'outbound', senderId: 'page', senderName: senderName || 'AI Туслах',
                timestamp: admin.firestore.FieldValue.serverTimestamp(), fbMessageId: (fbResult as any).message_id || '',
                isAI: true, isPayment: true, paymentAmount: subtotal, paymentInvoiceId: invoice.invoice_id,
                paymentUrl: invoice.qPay_shortUrl, orderId, deliveredAt: null, readAt: null,
            });

            return res.status(200).json({
                success: true, orderId, orderNumber,
                invoiceId: invoice.invoice_id, shortUrl: invoice.qPay_shortUrl,
            });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });

    } catch (err: any) {
        console.error('FB send error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
