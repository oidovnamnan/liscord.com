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
 * 
 * Uses Firestore REST API (no firebase-admin SDK needed)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';

// ═══ Firestore REST API Helpers ═══

function toFirestoreValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    if (typeof val === 'object') {
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function buildFirestoreDoc(data: Record<string, unknown>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        fields[k] = toFirestoreValue(v);
    }
    return { fields };
}

function fromFirestoreValue(val: Record<string, unknown>): unknown {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        const arr = val.arrayValue as { values?: Record<string, unknown>[] };
        return (arr.values || []).map(v => fromFirestoreValue(v));
    }
    if ('mapValue' in val) {
        const map = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(map.fields || {})) {
            result[k] = fromFirestoreValue(v);
        }
        return result;
    }
    return null;
}

function fromFirestoreDoc(doc: { fields?: Record<string, Record<string, unknown>> }): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc.fields || {})) {
        result[k] = fromFirestoreValue(v);
    }
    return result;
}

async function fsGet(path: string): Promise<Record<string, unknown> | null> {
    try {
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}`);
        if (!resp.ok) return null;
        const doc = await resp.json();
        return fromFirestoreDoc(doc);
    } catch { return null; }
}

async function fsMerge(path: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        data.updatedAt = new Date();
        const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        if (!resp.ok) console.error(`[fsMerge] FAILED ${path}: ${resp.status}`);
        return resp.ok;
    } catch (err) { console.error(`[fsMerge] ERROR:`, err); return false; }
}

async function fsAdd(collectionPath: string, data: Record<string, unknown>): Promise<string | null> {
    try {
        const resp = await fetch(`${FIRESTORE_BASE}/${collectionPath}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        if (!resp.ok) { console.error(`[fsAdd] FAILED ${collectionPath}: ${resp.status}`); return null; }
        const result = await resp.json();
        // Extract doc ID from name
        const name = result.name as string;
        return name.split('/').pop() || null;
    } catch (err) { console.error(`[fsAdd] ERROR:`, err); return null; }
}

async function fsUpdate(path: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        return resp.ok;
    } catch { return false; }
}

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
    const tokenPreview = pageAccessToken ? `${pageAccessToken.substring(0, 10)}...${pageAccessToken.slice(-6)}` : 'EMPTY';
    console.log(`[fb-send] Sending to Facebook with token: ${tokenPreview}`);
    const resp = await fetch('https://graph.facebook.com/v21.0/me/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: pageAccessToken }),
    });
    const result = await resp.json();
    if (!resp.ok || result.error) {
        console.error('[fb-send] Facebook API error:', JSON.stringify(result.error || result));
    } else {
        console.log('[fb-send] ✅ Message sent successfully, message_id:', result.message_id);
    }
    return result;
}

// Try sending with multiple tokens (fallback on error #100)
async function sendWithFallback(
    primaryToken: string,
    allTokens: Array<{ pageId: string; pageName?: string; token: string }>,
    payload: Record<string, unknown>,
    recipientId: string
): Promise<Record<string, unknown>> {
    // Try primary token first
    const result = await sendToFacebook(primaryToken, payload);
    
    // If success, return
    if (!result.error) return result;
    
    // If error #100 "No matching user", try other tokens
    const errorCode = (result.error as Record<string, unknown>)?.code;
    if (errorCode === 100 && allTokens.length > 1) {
        console.log(`[fb-send] Token mismatch for recipient ${recipientId}, trying other page tokens...`);
        for (const page of allTokens) {
            if (page.token === primaryToken) continue; // skip already tried
            console.log(`[fb-send] Trying token for page: ${page.pageName || page.pageId}...`);
            const retryResult = await sendToFacebook(page.token, payload);
            if (!retryResult.error) {
                // This token worked! Update the conversation's pageId in Firestore
                console.log(`[fb-send] ✅ Token for page ${page.pageName || page.pageId} worked! Updating conversation pageId.`);
                return retryResult;
            }
        }
    }
    
    return result; // return original error if all failed
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bizId, recipientId, action = 'send_text', message, senderName, imageUrl, buttons, title, description, amount } = req.body;

    if (!bizId || !recipientId) {
        return res.status(400).json({ error: 'Missing bizId or recipientId' });
    }

    try {
        // 1. Get Page Access Token
        const settings = await fsGet(`businesses/${bizId}/fbSettings/config`);
        if (!settings) {
            return res.status(400).json({ error: 'Settings not found' });
        }

        // Multi-page support: Find the correct page token based on conversation's pageId
        let token = settings.pageAccessToken as string;
        const pagesArr = (settings.pages as Array<{ pageId: string; pageName?: string; pageAccessToken: string }>) || [];
        
        // Build all tokens list for fallback
        const allTokens: Array<{ pageId: string; pageName?: string; token: string }> = [];
        for (const p of pagesArr) {
            if (p.pageAccessToken) {
                allTokens.push({ pageId: p.pageId, pageName: (p as Record<string, unknown>).pageName as string, token: p.pageAccessToken });
            }
        }
        
        console.log(`[fb-send] Action: ${action}, Recipient: ${recipientId}, Pages: ${allTokens.length}`);
        
        if (pagesArr.length > 0) {
            // Try to find which page this conversation belongs to
            const conv = await fsGet(`businesses/${bizId}/fbConversations/${recipientId}`);
            const convPageId = conv?.pageId as string;
            console.log(`[fb-send] Conversation pageId: ${convPageId || 'NOT SET'}`);
            
            if (convPageId) {
                const matchedPage = pagesArr.find(p => p.pageId === convPageId);
                if (matchedPage?.pageAccessToken) {
                    token = matchedPage.pageAccessToken;
                    console.log(`[fb-send] Matched page: ${(matchedPage as Record<string, unknown>).pageName || convPageId}`);
                } else {
                    console.log(`[fb-send] ⚠️ No token found for pageId: ${convPageId}`);
                }
            }
            // Fallback to first page if no match
            if (!token && pagesArr[0]?.pageAccessToken) {
                token = pagesArr[0].pageAccessToken;
                console.log(`[fb-send] Using fallback token from first page`);
            }
        }

        if (!token) {
            return res.status(400).json({ error: 'Facebook Page Access Token not configured' });
        }

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

        // ── RESOLVE NAME — Fetch real FB name from Graph API ──
        if (action === 'resolve_name') {
            // Try all available tokens (primary first, then others)
            const tokensToTry = [token, ...allTokens.filter(t => t.token !== token).map(t => t.token)];
            
            for (const tryToken of tokensToTry) {
                try {
                    const tokenPreview = tryToken ? `${tryToken.substring(0, 8)}...` : 'EMPTY';
                    console.log(`[resolve_name] Trying token ${tokenPreview} for PSID ${recipientId}`);
                    
                    const profileResp = await fetch(
                        `https://graph.facebook.com/v22.0/${recipientId}?fields=first_name,last_name,profile_pic&access_token=${tryToken}`
                    );
                    if (profileResp.ok) {
                        const profile = await profileResp.json();
                        const realName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                        if (realName) {
                            console.log(`[resolve_name] ✅ Resolved: ${realName}`);
                            await fsUpdate(`businesses/${bizId}/fbConversations/${recipientId}`, {
                                senderName: realName,
                                senderProfilePic: profile.profile_pic || '',
                            });
                            return res.status(200).json({ success: true, name: realName });
                        }
                    } else {
                        const errBody = await profileResp.text();
                        console.log(`[resolve_name] Token failed (${profileResp.status}): ${errBody.substring(0, 100)}`);
                    }
                } catch (err) {
                    console.error('[resolve_name] Error:', err);
                }
            }
            
            console.log(`[resolve_name] ❌ Could not resolve name for ${recipientId} with any token`);
            return res.status(200).json({ success: false, error: 'Could not resolve name' });
        }

        // Show typing before any message
        await sendToFacebook(token, { recipient: { id: recipientId }, sender_action: 'typing_on' });

        const now = new Date();

        // ── SEND TEXT ──
        if (action === 'send_text') {
            if (!message) return res.status(400).json({ error: 'Missing message' });

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: { text: message },
            });

            // Save to Firestore
            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: message,
                lastMessageAt: now,
            });

            await fsAdd(`${convPath}/messages`, {
                text: message,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as Record<string, unknown>).message_id });
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

            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: '📷 Зураг',
                lastMessageAt: now,
            });

            await fsAdd(`${convPath}/messages`, {
                text: '📷 Зураг',
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
                attachments: [{ type: 'image', url: imageUrl }],
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as Record<string, unknown>).message_id });
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

            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: `📋 ${title}`,
                lastMessageAt: now,
            });

            await fsAdd(`${convPath}/messages`, {
                text: `📋 ${title}`,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
                isTemplate: true,
                templateType: 'button',
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as Record<string, unknown>).message_id });
        }

        // ── SEND CAROUSEL (Generic Template — Product Cards) ──
        if (action === 'send_carousel') {
            const { elements } = req.body;
            if (!elements?.length) return res.status(400).json({ error: 'Missing elements' });

            // Facebook Generic Template: max 10 elements
            const templateElements = (elements as Array<{
                title: string; subtitle?: string; image_url?: string;
                default_url?: string; buttons?: Array<{ title: string; url?: string; payload?: string }>;
            }>).slice(0, 10).map(el => {
                const item: Record<string, unknown> = {
                    title: el.title.substring(0, 80),
                };
                if (el.subtitle) item.subtitle = el.subtitle.substring(0, 80);
                if (el.image_url) item.image_url = el.image_url;
                if (el.default_url) item.default_action = { type: 'web_url', url: el.default_url };
                if (el.buttons?.length) {
                    item.buttons = el.buttons.slice(0, 3).map(b =>
                        b.url
                            ? { type: 'web_url', url: b.url, title: b.title }
                            : { type: 'postback', title: b.title, payload: b.payload || b.title }
                    );
                }
                return item;
            });

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'generic',
                            elements: templateElements,
                        },
                    },
                },
            });

            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: `🛍️ ${templateElements.length} бараа`,
                lastMessageAt: now,
            });

            await fsAdd(`${convPath}/messages`, {
                text: `🛍️ ${templateElements.length} бараа санал болгож байна`,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'AI Туслах',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
                isTemplate: true,
                isAI: true,
                deliveredAt: null,
                readAt: null,
            });

            return res.status(200).json({ success: true, messageId: (fbResult as Record<string, unknown>).message_id });
        }

        // ── SEND PAYMENT (QPay Invoice + Button Template) ──
        if (action === 'send_payment') {
            if (!amount) return res.status(400).json({ error: 'Missing amount' });

            // Get business QPay credentials
            const paySettings = await fsGet(`businesses/${bizId}/payment_settings/qpay`);

            const qpayUsername = (paySettings?.username as string) || process.env.QPAY_VIP_USERNAME;
            const qpayPassword = (paySettings?.password as string) || process.env.QPAY_VIP_PASSWORD;
            const invoiceCode = (paySettings?.invoiceCode as string) || process.env.QPAY_VIP_INVOICE_CODE || 'GATE_SIM_INVOICE';

            if (!qpayUsername || !qpayPassword) {
                return res.status(400).json({ error: 'QPay credentials not configured' });
            }

            const qpayToken = await getQPayToken(qpayUsername, qpayPassword);
            const invoiceId = `fb_${recipientId.slice(-6)}_${Date.now().toString(36)}`;

            const host = req.headers.host || 'www.liscord.com';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const callbackUrl = `${protocol}://${host}/api/qpay-callback?bizId=${bizId}&orderId=${invoiceId}`;

            const invoiceResp = await fetch(`${QPAY_API_URL}/invoice`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${qpayToken}`, 'Content-Type': 'application/json' },
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

            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: `💳 Төлбөр: ${Number(amount).toLocaleString()}₮`,
                lastMessageAt: now,
            });

            await fsAdd(`${convPath}/messages`, {
                text: paymentText,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'Оператор',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
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
                messageId: (fbResult as Record<string, unknown>).message_id,
                invoiceId: invoice.invoice_id,
                qrImage: invoice.qr_image,
                shortUrl: invoice.qPay_shortUrl,
            });
        }

        // ── CREATE ORDER + SEND PAYMENT (AI Flow) ──
        if (action === 'create_order_and_pay') {
            const { productIds, quantities, customerName, customerPsid } = req.body;
            if (!productIds?.length) return res.status(400).json({ error: 'Missing productIds' });

            // 1. Fetch products
            const items: Array<{ productId: string; name: string; variant: string; quantity: number; unitPrice: number; costPrice: number; totalPrice: number; image: string | null }> = [];
            let subtotal = 0;

            for (let i = 0; i < productIds.length; i++) {
                const p = await fsGet(`businesses/${bizId}/products/${productIds[i]}`);
                if (!p) continue;
                const qty = quantities?.[i] || 1;
                const pricing = p.pricing as Record<string, number> | undefined;
                const price = pricing?.salePrice || 0;
                const cost = pricing?.costPrice || 0;
                const total = price * qty;

                items.push({
                    productId: productIds[i],
                    name: (p.name as string) || 'Бараа',
                    variant: '',
                    quantity: qty,
                    unitPrice: price,
                    costPrice: cost,
                    totalPrice: total,
                    image: ((p.images as string[]) || [])[0] || null,
                });
                subtotal += total;
            }

            if (items.length === 0) {
                return res.status(400).json({ error: 'No valid products found' });
            }

            // 2. Generate order number
            const bizData = await fsGet(`businesses/${bizId}`);
            const bizSettings = bizData?.settings as Record<string, unknown> | undefined;
            const prefix = (bizSettings?.orderPrefix as string) || 'ORD';
            const counter = ((bizSettings?.orderCounter as number) || 0) + 1;
            const orderNumber = `${prefix}-${String(counter).padStart(4, '0')}`;

            // Update counter
            await fsUpdate(`businesses/${bizId}`, { 'settings.orderCounter': counter });

            // 3. Create Order
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
                    at: now,
                    by: 'ai_messenger',
                    byName: 'AI Туслах',
                }],
                tags: ['messenger', 'ai'],
                createdBy: 'ai_messenger',
                createdByName: 'AI Туслах',
                createdAt: now,
                updatedAt: now,
                isDeleted: false,
                orderType: 'standard',
                messengerPsid: customerPsid,
            };

            const orderId = await fsAdd(`businesses/${bizId}/orders`, orderData);

            // 4. Get bank transfer info from business settings
            const bankInfo = bizData?.bankInfo as Record<string, string> | undefined;
            const bankName = bankInfo?.bankName || process.env.BANK_NAME || '';
            const bankAccount = bankInfo?.bankAccount || process.env.BANK_ACCOUNT || '';
            const bankAccountName = bankInfo?.bankAccountName || process.env.BANK_ACCOUNT_NAME || '';
            const hasBankInfo = bankName && bankAccount;

            // 5. Send confirmation with bank transfer details
            let confirmText = `🛒 Захиалга #${orderNumber} үүслээ!\n\n${items.map(it => `• ${it.name} x${it.quantity} — ₮${it.totalPrice.toLocaleString()}`).join('\n')}\n\nНийт: ₮${subtotal.toLocaleString()}`;

            if (hasBankInfo) {
                confirmText += `\n\n💳 Төлбөрийн мэдээлэл:\n${bankName}, ${bankAccount}\nДансны нэр: ${bankAccountName}\nГүйлгээний утга: ${orderNumber}\n\nШилжүүлсний дараа хэлнэ үү 🙏`;
            }

            const fbResult = await sendToFacebook(token, {
                recipient: { id: recipientId },
                message: { text: confirmText },
            });

            const convPath = `businesses/${bizId}/fbConversations/${recipientId}`;
            await fsMerge(convPath, {
                lastMessage: `🛒 Захиалга #${orderNumber}`,
                lastMessageAt: now,
            });
            await fsAdd(`${convPath}/messages`, {
                text: confirmText,
                direction: 'outbound',
                senderId: 'page',
                senderName: senderName || 'AI Туслах',
                timestamp: now,
                fbMessageId: (fbResult as Record<string, unknown>).message_id || '',
                isAI: true,
                orderId,
                deliveredAt: null,
                readAt: null,
            });

            // 5. Auto QPay Invoice — send payment link if QPay configured
            let paymentResult: Record<string, unknown> | null = null;
            try {
                const paySettings = await fsGet(`businesses/${bizId}/payment_settings/qpay`);
                const qpayUsername = (paySettings?.username as string) || process.env.QPAY_VIP_USERNAME;
                const qpayPassword = (paySettings?.password as string) || process.env.QPAY_VIP_PASSWORD;
                const invoiceCode = (paySettings?.invoiceCode as string) || process.env.QPAY_VIP_INVOICE_CODE || 'GATE_SIM_INVOICE';

                if (qpayUsername && qpayPassword && subtotal > 0) {
                    const qpayToken = await getQPayToken(qpayUsername, qpayPassword);
                    const payInvoiceId = `ai_${orderNumber}_${Date.now().toString(36)}`;

                    const host = req.headers.host || 'www.liscord.com';
                    const protocol = host.includes('localhost') ? 'http' : 'https';
                    const callbackUrl = `${protocol}://${host}/api/qpay-callback?bizId=${bizId}&orderId=${orderId}`;

                    const invoiceResp = await fetch(`${QPAY_API_URL}/invoice`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${qpayToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            invoice_code: invoiceCode,
                            sender_invoice_no: payInvoiceId,
                            invoice_receiver_code: recipientId,
                            invoice_description: `Захиалга #${orderNumber} — ${items.map(it => it.name).join(', ')}`,
                            amount: subtotal,
                            callback_url: callbackUrl,
                        }),
                    });

                    if (invoiceResp.ok) {
                        const invoice = await invoiceResp.json();
                        const paymentText = `💳 Төлбөр: ₮${subtotal.toLocaleString()}\nЗахиалга #${orderNumber}`;

                        const payFbResult = await sendToFacebook(token, {
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

                        await fsAdd(`${convPath}/messages`, {
                            text: paymentText,
                            direction: 'outbound',
                            senderId: 'page',
                            senderName: 'AI Туслах',
                            timestamp: new Date(),
                            fbMessageId: (payFbResult as Record<string, unknown>).message_id || '',
                            isPayment: true,
                            isAI: true,
                            paymentAmount: subtotal,
                            paymentInvoiceId: invoice.invoice_id,
                            paymentUrl: invoice.qPay_shortUrl,
                            paymentQr: invoice.qr_image,
                            orderId,
                            deliveredAt: null,
                            readAt: null,
                        });

                        // Update order with payment info
                        if (orderId) {
                            await fsUpdate(`businesses/${bizId}/orders/${orderId}`, {
                                qpayInvoiceId: invoice.invoice_id,
                                qpayShortUrl: invoice.qPay_shortUrl,
                            });
                        }

                        paymentResult = {
                            invoiceId: invoice.invoice_id,
                            shortUrl: invoice.qPay_shortUrl,
                            qrImage: invoice.qr_image,
                        };
                    }
                }
            } catch (payErr) {
                console.error('Auto QPay invoice error (non-fatal):', payErr);
            }

            return res.status(200).json({ success: true, orderId, orderNumber, payment: paymentResult });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal server error';
        console.error('FB send error:', err);
        return res.status(500).json({ error: errMsg });
    }
}
