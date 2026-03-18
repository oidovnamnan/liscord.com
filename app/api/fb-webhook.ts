/**
 * Facebook Messenger Webhook
 * 
 * GET  — Webhook verification (Facebook sends hub.mode, hub.verify_token, hub.challenge)
 * POST — Receive inbound events from Facebook Messenger:
 *        - messages (text, attachments)
 *        - message_deliveries
 *        - message_reads
 *        - messaging_postbacks
 * 
 * Uses Firestore REST API (no firebase-admin SDK needed — org policy blocks service account keys)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';
console.log(`[fb-webhook] API_KEY length: ${API_KEY.length}`);

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

async function fsSet(path: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        // Add server timestamp
        data.updatedAt = new Date();
        const url = `${FIRESTORE_BASE}/${path}?key=${API_KEY}`;
        const resp = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`[fsSet] FAILED ${path}: HTTP ${resp.status} - ${errText}`);
        }
        return resp.ok;
    } catch (err) { console.error(`[fsSet] ERROR ${path}:`, err); return false; }
}

async function fsAdd(collectionPath: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        const url = `${FIRESTORE_BASE}/${collectionPath}?key=${API_KEY}`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`[fsAdd] FAILED ${collectionPath}: HTTP ${resp.status} - ${errText}`);
        }
        return resp.ok;
    } catch (err) { console.error(`[fsAdd] ERROR ${collectionPath}:`, err); return false; }
}

async function fsMerge(path: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        // For merge, we need to specify update mask
        data.updatedAt = new Date();
        const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        return resp.ok;
    } catch { return false; }
}

// For unread increment, we need to read-then-write since REST API doesn't support FieldValue.increment
async function fsIncrementUnread(path: string, data: Record<string, unknown>): Promise<boolean> {
    try {
        // Read current unreadCount
        const existing = await fsGet(path);
        const currentUnread = (existing?.unreadCount as number) || 0;
        data.unreadCount = currentUnread + 1;
        return await fsSet(path, data);
    } catch { return false; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ═══ GET: Webhook Verification ═══
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;
        const bizId = req.query.bizId as string;

        if (mode === 'subscribe') {
            // Check env/default token first (no Firestore needed)
            const envToken = process.env.FB_VERIFY_TOKEN || 'liscord_fb_verify_2026';
            if (token === envToken) {
                console.log('FB Webhook verified via env token');
                return res.status(200).send(challenge);
            }

            // Then try Firestore-stored token
            if (bizId) {
                try {
                    const settings = await fsGet(`businesses/${bizId}/fbSettings/config`);
                    if (settings?.verifyToken === token) {
                        console.log(`FB Webhook verified for bizId=${bizId}`);
                        return res.status(200).send(challenge);
                    }
                } catch (err) {
                    console.error('FB webhook verify error:', err);
                }
            }

            return res.status(403).send('Verification failed');
        }

        return res.status(400).send('Invalid request');
    }

    // ═══ POST: Receive Events ═══
    if (req.method === 'POST') {
        const body = req.body;

        if (body.object !== 'page') {
            return res.status(404).send('Not a page event');
        }

        try {
            for (const entry of body.entry || []) {
                const pageId = entry.id;

                // Find the business and page token
                const bizId: string | undefined = req.query.bizId as string;
                let pageAccessToken: string | undefined;
                let pageName: string = '';

                if (bizId) {
                    try {
                        const settingsData = await fsGet(`businesses/${bizId}/fbSettings/config`);
                        if (settingsData) {
                            // Check pages array first
                            const pagesArr = (settingsData.pages as Array<{ pageId: string; pageName: string; pageAccessToken: string }>) || [];
                            const matchedPage = pagesArr.find(p => p.pageId === pageId);
                            if (matchedPage) {
                                pageAccessToken = matchedPage.pageAccessToken;
                                pageName = matchedPage.pageName || '';
                            } else if (settingsData.pageId === pageId) {
                                pageAccessToken = settingsData.pageAccessToken as string;
                                pageName = (settingsData.pageName as string) || '';
                            }
                        }
                    } catch (err) {
                        console.error(`Error fetching settings for bizId=${bizId}:`, err);
                    }
                }

                if (!bizId) {
                    console.warn(`No business found for pageId=${pageId}`);
                    continue;
                }

                for (const event of entry.messaging || []) {
                    const senderId = event.sender?.id;
                    if (!senderId || senderId === pageId) continue;

                    const timestamp = event.timestamp || Date.now();
                    const tsDate = new Date(timestamp);

                    // ── 1. MESSAGE EVENT ──
                    if (event.message) {
                        const msg = event.message;

                        // Get sender profile from Facebook
                        let senderName = senderId;
                        let senderProfilePic = '';

                        if (pageAccessToken) {
                            try {
                                const profileResp = await fetch(
                                    `https://graph.facebook.com/v21.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`
                                );
                                if (profileResp.ok) {
                                    const profile = await profileResp.json();
                                    senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || senderId;
                                    senderProfilePic = profile.profile_pic || '';
                                }
                            } catch {
                                // Non-critical
                            }
                        }

                        let messageText = msg.text || '';

                        const messageData: Record<string, unknown> = {
                            text: messageText,
                            direction: 'inbound',
                            senderId,
                            senderName,
                            timestamp: tsDate,
                            fbMessageId: msg.mid || '',
                            readAt: null,
                            deliveredAt: null,
                        };

                        // Handle attachments (image, video, audio, file, sticker)
                        if (msg.attachments?.length) {
                            messageData.attachments = msg.attachments.map((att: { type: string; payload?: { url?: string; sticker_id?: number } }) => ({
                                type: att.type,
                                url: att.payload?.url || '',
                                stickerId: att.payload?.sticker_id || null,
                            }));

                            // If no text but has attachments, set preview text
                            if (!msg.text) {
                                const firstType = msg.attachments[0].type;
                                const typeMap: Record<string, string> = {
                                    image: '📷 Зураг',
                                    video: '🎬 Видео',
                                    audio: '🎤 Дуут мессеж',
                                    file: '📄 Файл',
                                    fallback: '📎 Хавсралт',
                                };
                                messageText = typeMap[firstType] || '📎 Хавсралт';
                                messageData.text = messageText;
                            }
                        }

                        // Quick reply payload
                        if (msg.quick_reply?.payload) {
                            messageData.quickReplyPayload = msg.quick_reply.payload;
                        }

                        // Save conversation (merge/upsert)
                        const convPath = `businesses/${bizId}/fbConversations/${senderId}`;
                        await fsIncrementUnread(convPath, {
                            senderId,
                            senderName,
                            senderProfilePic,
                            lastMessage: messageText,
                            lastMessageAt: tsDate,
                            status: 'open',
                            pageId,
                            pageName,
                        });

                        // Add message
                        await fsAdd(`${convPath}/messages`, messageData);

                        // ── AI MODE ROUTING ──
                        const settingsData = await fsGet(`businesses/${bizId}/fbSettings/config`);
                        const aiMode = (settingsData?.aiMode as string) || 'manual';

                        if (aiMode !== 'manual' && msg.text) {
                            try {
                                // Call AI reply endpoint
                                const host = req.headers.host || 'www.liscord.com';
                                const protocol = host.includes('localhost') ? 'http' : 'https';
                                const aiResp = await fetch(`${protocol}://${host}/api/fb-ai-reply`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ bizId, senderId, senderName, messageText: msg.text }),
                                });
                                const aiResult = await aiResp.json();

                                if (aiMode === 'auto' && aiResult.text) {
                                    // AUTO: Send AI response directly via Facebook
                                    const sendBody: Record<string, unknown> = {
                                        bizId, recipientId: senderId,
                                        action: 'send_text', message: aiResult.text,
                                        senderName: 'AI Туслах',
                                    };

                                    // If AI wants to create an order
                                    if (aiResult.action?.type === 'create_order') {
                                        sendBody.action = 'create_order_and_pay';
                                        sendBody.productIds = aiResult.action.productIds;
                                        sendBody.quantities = aiResult.action.quantities;
                                        sendBody.customerName = senderName;
                                        sendBody.customerPsid = senderId;
                                    }

                                    await fetch(`${protocol}://${host}/api/fb-send`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(sendBody),
                                    });

                                    // Send product carousel if AI suggested products with images
                                    if (aiResult.suggestedProducts?.length) {
                                        const carouselElements = aiResult.suggestedProducts
                                            .filter((p: Record<string, unknown>) => p.image_url)
                                            .map((p: Record<string, unknown>) => ({
                                                title: p.title,
                                                subtitle: p.subtitle,
                                                image_url: p.image_url,
                                                default_url: p.default_url,
                                                buttons: (p.buttons as Array<{ title: string; payload: string }>) || [{ title: '🛒 Захиалах', payload: `ORDER:${p.id}:1` }],
                                            }));

                                        if (carouselElements.length > 0) {
                                            await fetch(`${protocol}://${host}/api/fb-send`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    bizId, recipientId: senderId,
                                                    action: 'send_carousel',
                                                    elements: carouselElements,
                                                    senderName: 'AI Туслах',
                                                }),
                                            });
                                        }
                                    }

                                    // If there was an order action AND a text message, send text too
                                    if (aiResult.action?.type === 'create_order' && aiResult.text) {
                                        await fetch(`${protocol}://${host}/api/fb-send`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                bizId, recipientId: senderId,
                                                action: 'send_text', message: aiResult.text,
                                                senderName: 'AI Туслах',
                                            }),
                                        });
                                    }
                                } else if (aiMode === 'assist' && aiResult.text) {
                                    // ASSIST: Save suggestion + products to conversation doc
                                    await fsMerge(convPath, {
                                        aiSuggestion: aiResult.text,
                                        aiAction: aiResult.action || null,
                                        aiSuggestedProducts: aiResult.suggestedProducts || null,
                                    });
                                }
                            } catch (aiErr) {
                                console.error('AI reply error:', aiErr);
                            }
                        }
                    }

                    // ── 2. DELIVERY EVENT ──
                    // Note: delivery/read tracking via REST API is complex (no batch queries)
                    // Skipping for now — these are non-critical nice-to-haves

                    // ── 3. POSTBACK EVENT ──
                    if (event.postback) {
                        const payload = event.postback.payload as string;
                        const title = event.postback.title;

                        // Get sender name for postback
                        let postbackSenderName = senderId;
                        if (pageAccessToken) {
                            try {
                                const profileResp = await fetch(
                                    `https://graph.facebook.com/v21.0/${senderId}?fields=first_name,last_name&access_token=${pageAccessToken}`
                                );
                                if (profileResp.ok) {
                                    const profile = await profileResp.json();
                                    postbackSenderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || senderId;
                                }
                            } catch { /* non-critical */ }
                        }

                        const convPath = `businesses/${bizId}/fbConversations/${senderId}`;
                        await fsAdd(`${convPath}/messages`, {
                            text: `[Товч дарсан] ${title || payload}`,
                            direction: 'inbound',
                            senderId,
                            senderName: postbackSenderName,
                            timestamp: tsDate,
                            isPostback: true,
                            postbackPayload: payload,
                        });

                        await fsIncrementUnread(convPath, {
                            lastMessage: `[Товч] ${title || payload}`,
                            lastMessageAt: tsDate,
                            status: 'open',
                            pageId,
                            pageName,
                        });

                        // Handle ORDER postback from carousel buttons
                        if (payload.startsWith('ORDER:')) {
                            const host = req.headers.host || 'www.liscord.com';
                            const protocol = host.includes('localhost') ? 'http' : 'https';
                            try {
                                // Parse ORDER:productId:qty or ORDER:id1:qty1,id2:qty2
                                const orderStr = payload.replace('ORDER:', '');
                                const parts = orderStr.split(',');
                                const productIds: string[] = [];
                                const quantities: number[] = [];
                                for (const part of parts) {
                                    const [id, qtyStr] = part.split(':');
                                    if (id) {
                                        productIds.push(id);
                                        quantities.push(parseInt(qtyStr) || 1);
                                    }
                                }

                                if (productIds.length > 0) {
                                    const orderResp = await fetch(`${protocol}://${host}/api/fb-send`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            bizId,
                                            action: 'create_order_and_pay',
                                            recipientId: senderId,
                                            productIds,
                                            quantities,
                                            customerName: postbackSenderName,
                                            customerPsid: senderId,
                                            senderName: postbackSenderName,
                                        }),
                                    });
                                    const orderResult = await orderResp.json();
                                    console.log(`[Postback ORDER] Result:`, orderResult);
                                }
                            } catch (orderErr) {
                                console.error('[Postback ORDER] Error:', orderErr);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('FB webhook processing error:', err);
        }

        // Facebook expects 200 within 20 seconds
        return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(405).send('Method not allowed');
}
