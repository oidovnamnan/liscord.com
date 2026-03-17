/**
 * Facebook Messenger Send API
 * 
 * POST — Send a message from Liscord to a Facebook user via Messenger
 * 
 * Body: { bizId, recipientId, message, senderName? }
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bizId, recipientId, message, senderName } = req.body;

    if (!bizId || !recipientId || !message) {
        return res.status(400).json({ error: 'Missing bizId, recipientId, or message' });
    }

    try {
        // 1. Get Page Access Token from business settings
        const settingsSnap = await db.doc(`businesses/${bizId}/fbSettings/config`).get();
        const settings = settingsSnap.data();

        if (!settings?.pageAccessToken) {
            return res.status(400).json({ error: 'Facebook Page Access Token not configured' });
        }

        // 2. Send message via Facebook Send API
        const fbResponse = await fetch('https://graph.facebook.com/v21.0/me/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: message },
                access_token: settings.pageAccessToken,
            }),
        });

        const fbResult = await fbResponse.json();

        if (!fbResponse.ok) {
            console.error('FB Send API error:', fbResult);
            return res.status(502).json({ error: 'Facebook Send API failed', details: fbResult.error?.message });
        }

        // 3. Save outbound message to Firestore
        const convRef = db.doc(`businesses/${bizId}/fbConversations/${recipientId}`);
        
        // Update conversation metadata
        await convRef.set({
            lastMessage: message,
            lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Add message to subcollection
        await convRef.collection('messages').add({
            text: message,
            direction: 'outbound',
            senderId: 'page',
            senderName: senderName || 'Оператор',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            fbMessageId: fbResult.message_id || '',
            readAt: null,
        });

        return res.status(200).json({ success: true, messageId: fbResult.message_id });

    } catch (err) {
        console.error('FB send error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
