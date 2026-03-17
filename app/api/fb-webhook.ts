/**
 * Facebook Messenger Webhook
 * 
 * GET  — Webhook verification (Facebook sends hub.mode, hub.verify_token, hub.challenge)
 * POST — Receive inbound messages from Facebook Messenger
 * 
 * Stores messages in Firestore: businesses/{bizId}/fbConversations/{senderId}/messages/{msgId}
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
            // Look up the verify token for this business
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

            // Fallback: check env-level verify token
            const envToken = process.env.FB_VERIFY_TOKEN || 'liscord_fb_verify_2026';
            if (token === envToken) {
                console.log('FB Webhook verified via env token');
                return res.status(200).send(challenge);
            }

            return res.status(403).send('Verification failed');
        }

        return res.status(400).send('Invalid request');
    }

    // ═══ POST: Receive Messages ═══
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

                for (const event of entry.messaging || []) {
                    const senderId = event.sender?.id;
                    if (!senderId || senderId === pageId) continue; // Skip messages from the page itself

                    const timestamp = event.timestamp || Date.now();

                    // Get sender profile from Facebook
                    let senderName = senderId;
                    let senderProfilePic = '';
                    const pageAccessToken = bizQuery.docs[0].data()?.pageAccessToken;

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
                            // Non-critical — use senderId as fallback
                        }
                    }

                    // Handle text message
                    if (event.message) {
                        const msg = event.message;
                        const messageData: Record<string, unknown> = {
                            text: msg.text || '',
                            direction: 'inbound',
                            senderId,
                            senderName,
                            timestamp: admin.firestore.Timestamp.fromMillis(timestamp),
                            fbMessageId: msg.mid || '',
                            readAt: null,
                        };

                        // Handle attachments
                        if (msg.attachments?.length) {
                            messageData.attachments = msg.attachments.map((att: { type: string; payload?: { url?: string } }) => ({
                                type: att.type,
                                url: att.payload?.url || '',
                            }));
                        }

                        // Save message
                        const convRef = db.doc(`businesses/${bizId}/fbConversations/${senderId}`);
                        await convRef.set({
                            senderId,
                            senderName,
                            senderProfilePic,
                            lastMessage: msg.text || '[Хавсралт]',
                            lastMessageAt: admin.firestore.Timestamp.fromMillis(timestamp),
                            unreadCount: admin.firestore.FieldValue.increment(1),
                            status: 'open',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });

                        await convRef.collection('messages').add(messageData);
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
