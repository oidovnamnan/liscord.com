/**
 * Facebook Messenger Webhook
 * 
 * GET  — Webhook verification (Facebook sends hub.mode, hub.verify_token, hub.challenge)
 * POST — Receive inbound events from Facebook Messenger:
 *        - messages (text, attachments)
 *        - message_deliveries
 *        - message_reads
 *        - messaging_postbacks
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ═══ GET: Webhook Verification ═══
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;
        const bizId = req.query.bizId as string;

        if (mode === 'subscribe') {
            if (bizId) {
                try {
                    const settingsSnap = await db.doc(`businesses/${bizId}/fbSettings/config`).get();
                    const settings = settingsSnap.data();
                    if (settings?.verifyToken === token) {
                        console.log(`FB Webhook verified for bizId=${bizId}`);
                        return res.status(200).send(challenge);
                    }
                } catch (err) {
                    console.error('FB webhook verify error:', err);
                }
            }

            const envToken = process.env.FB_VERIFY_TOKEN || 'liscord_fb_verify_2026';
            if (token === envToken) {
                console.log('FB Webhook verified via env token');
                return res.status(200).send(challenge);
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

                // Find the business that has this pageId
                const bizQuery = await db.collectionGroup('fbSettings')
                    .where('pageId', '==', pageId)
                    .limit(1)
                    .get();

                if (bizQuery.empty) {
                    console.warn(`No business found for pageId=${pageId}`);
                    continue;
                }

                const bizId = bizQuery.docs[0].ref.parent.parent?.id;
                if (!bizId) continue;

                const pageAccessToken = bizQuery.docs[0].data()?.pageAccessToken;

                for (const event of entry.messaging || []) {
                    const senderId = event.sender?.id;
                    if (!senderId || senderId === pageId) continue;

                    const timestamp = event.timestamp || Date.now();

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

                        const messageData: Record<string, unknown> = {
                            text: msg.text || '',
                            direction: 'inbound',
                            senderId,
                            senderName,
                            timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
                            fbMessageId: msg.mid || '',
                            readAt: null,
                            deliveredAt: null,
                        };

                        // Handle attachments (image, video, audio, file, sticker)
                        if (msg.attachments?.length) {
                            messageData.attachments = msg.attachments.map((att: { type: string; payload?: { url?: string; sticker_id?: number } }) => ({
                                type: att.type, // 'image' | 'video' | 'audio' | 'file' | 'fallback'
                                url: att.payload?.url || '',
                                stickerId: att.payload?.sticker_id,
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
                                messageData.text = typeMap[firstType] || '📎 Хавсралт';
                            }
                        }

                        // Quick reply payload
                        if (msg.quick_reply?.payload) {
                            messageData.quickReplyPayload = msg.quick_reply.payload;
                        }

                        // Save conversation + message
                        const convRef = db.doc(`businesses/${bizId}/fbConversations/${senderId}`);
                        await convRef.set({
                            senderId,
                            senderName,
                            senderProfilePic,
                            lastMessage: messageData.text,
                            lastMessageAt: admin.firestore.Timestamp.fromMillis(timestamp),
                            unreadCount: admin.firestore.FieldValue.increment(1),
                            status: 'open',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });

                        await convRef.collection('messages').add(messageData);

                        // ── AI MODE ROUTING ──
                        const settings = bizQuery.docs[0].data();
                        const aiMode = settings?.aiMode || 'manual';

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
                                    let actionType = 'send_text';
                                    const sendBody: Record<string, unknown> = {
                                        bizId, recipientId: senderId,
                                        action: actionType, message: aiResult.text,
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
                                    // ASSIST: Save suggestion to conversation doc
                                    await convRef.update({
                                        aiSuggestion: aiResult.text,
                                        aiAction: aiResult.action || null,
                                    });
                                }
                            } catch (aiErr) {
                                console.error('AI reply error:', aiErr);
                            }
                        }
                    }

                    // ── 2. DELIVERY EVENT ──
                    if (event.delivery) {
                        const watermark = event.delivery.watermark;
                        if (watermark) {
                            // Mark all outbound messages before watermark as delivered
                            const convRef = db.collection(`businesses/${bizId}/fbConversations/${senderId}/messages`);
                            const q = convRef
                                .where('direction', '==', 'outbound')
                                .where('deliveredAt', '==', null)
                                .limit(20);

                            const snap = await q.get();
                            const batch = db.batch();
                            snap.docs.forEach(d => {
                                const ts = d.data().timestamp;
                                if (ts && ts.toMillis() <= watermark) {
                                    batch.update(d.ref, { deliveredAt: admin.firestore.Timestamp.fromMillis(watermark) });
                                }
                            });
                            if (snap.docs.length > 0) await batch.commit();
                        }
                    }

                    // ── 3. READ EVENT ──
                    if (event.read) {
                        const watermark = event.read.watermark;
                        if (watermark) {
                            // Mark all outbound messages before watermark as read
                            const convRef = db.collection(`businesses/${bizId}/fbConversations/${senderId}/messages`);
                            const q = convRef
                                .where('direction', '==', 'outbound')
                                .where('readAt', '==', null)
                                .limit(20);

                            const snap = await q.get();
                            const batch = db.batch();
                            snap.docs.forEach(d => {
                                const ts = d.data().timestamp;
                                if (ts && ts.toMillis() <= watermark) {
                                    batch.update(d.ref, {
                                        readAt: admin.firestore.Timestamp.fromMillis(watermark),
                                        deliveredAt: d.data().deliveredAt || admin.firestore.Timestamp.fromMillis(watermark),
                                    });
                                }
                            });
                            if (snap.docs.length > 0) await batch.commit();
                        }
                    }

                    // ── 4. POSTBACK EVENT ──
                    if (event.postback) {
                        const payload = event.postback.payload;
                        const title = event.postback.title;

                        // Save as a system message
                        const convRef = db.doc(`businesses/${bizId}/fbConversations/${senderId}`);
                        await convRef.collection('messages').add({
                            text: `[Товч дарсан] ${title || payload}`,
                            direction: 'inbound',
                            senderId,
                            senderName: senderId,
                            timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
                            isPostback: true,
                            postbackPayload: payload,
                        });

                        await convRef.set({
                            lastMessage: `[Товч] ${title || payload}`,
                            lastMessageAt: admin.firestore.Timestamp.fromMillis(timestamp),
                            unreadCount: admin.firestore.FieldValue.increment(1),
                            status: 'open',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });
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
