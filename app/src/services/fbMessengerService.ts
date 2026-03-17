/**
 * Facebook Messenger Service
 * 
 * Client-side Firestore operations for the Facebook Messenger module.
 * Handles conversations, messages, and settings.
 */
import {
    collection, doc, getDoc, setDoc, query, orderBy, limit,
    onSnapshot, serverTimestamp, where
} from 'firebase/firestore';
import { db } from './firebase';

export interface FbConversation {
    id: string;              // senderId (Facebook PSID)
    senderName: string;
    senderProfilePic: string;
    lastMessage: string;
    lastMessageAt: Date | null;
    unreadCount: number;
    status: 'open' | 'closed';
}

export interface FbMessage {
    id: string;
    text: string;
    direction: 'inbound' | 'outbound';
    senderId: string;
    senderName: string;
    timestamp: Date | null;
    fbMessageId?: string;
    attachments?: Array<{ type: string; url: string }>;
    readAt?: Date | null;
}

export interface FbSettings {
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    verifyToken: string;
    isConnected: boolean;
    connectedAt?: Date;
}

function convertTimestamp(val: unknown): Date | null {
    if (!val) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((val as any).toDate) return (val as any).toDate();
    if (val instanceof Date) return val;
    return new Date(val as string);
}

export const fbMessengerService = {
    // ═══ Settings ═══
    async getSettings(bizId: string): Promise<FbSettings | null> {
        const snap = await getDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            pageId: data.pageId || '',
            pageName: data.pageName || '',
            pageAccessToken: data.pageAccessToken || '',
            verifyToken: data.verifyToken || '',
            isConnected: data.isConnected || false,
            connectedAt: convertTimestamp(data.connectedAt) || undefined,
        };
    },

    async saveSettings(bizId: string, settings: Partial<FbSettings>): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
            ...settings,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    // ═══ Conversations ═══
    subscribeConversations(bizId: string, callback: (convs: FbConversation[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'fbConversations'),
            orderBy('lastMessageAt', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    senderName: data.senderName || d.id,
                    senderProfilePic: data.senderProfilePic || '',
                    lastMessage: data.lastMessage || '',
                    lastMessageAt: convertTimestamp(data.lastMessageAt),
                    unreadCount: data.unreadCount || 0,
                    status: data.status || 'open',
                } as FbConversation;
            });
            callback(convs);
        });
    },

    // ═══ Messages ═══
    subscribeMessages(bizId: string, senderId: string, callback: (msgs: FbMessage[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'fbConversations', senderId, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(200)
        );

        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    text: data.text || '',
                    direction: data.direction || 'inbound',
                    senderId: data.senderId || '',
                    senderName: data.senderName || '',
                    timestamp: convertTimestamp(data.timestamp),
                    fbMessageId: data.fbMessageId,
                    attachments: data.attachments,
                    readAt: convertTimestamp(data.readAt),
                } as FbMessage;
            });
            callback(msgs);
        });
    },

    // ═══ Send Message ═══
    async sendMessage(bizId: string, recipientId: string, message: string, senderName?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const resp = await fetch('/api/fb-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bizId, recipientId, message, senderName }),
            });
            return resp.json();
        } catch {
            return { success: false, error: 'Network error' };
        }
    },

    // ═══ Mark as read ═══
    async markConversationRead(bizId: string, senderId: string): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            unreadCount: 0,
        }, { merge: true });

        // Mark all unread messages as read
        const q = query(
            collection(db, 'businesses', bizId, 'fbConversations', senderId, 'messages'),
            where('readAt', '==', null),
            where('direction', '==', 'inbound'),
            limit(50)
        );

        const { getDocs, updateDoc } = await import('firebase/firestore');
        const snap = await getDocs(q);
        const now = serverTimestamp();
        await Promise.all(snap.docs.map(d => updateDoc(d.ref, { readAt: now })));
    },
};
