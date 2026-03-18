/**
 * Facebook Messenger Service — Extended
 * 
 * Client-side Firestore operations + API calls for the Facebook Messenger module.
 * Handles conversations, messages, settings, tags, notes, canned responses, and payments.
 */
import {
    collection, doc, getDoc, setDoc, query, orderBy, limit,
    onSnapshot, serverTimestamp, where, updateDoc
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
    tags?: string[];
    notes?: string;
    assignedTo?: string;
    aiSuggestion?: string | null;
    aiAction?: { type: string; productIds: string[]; quantities: number[] } | null;
    pageId?: string;         // Which FB Page this conversation belongs to
    pageName?: string;
}

export interface FbMessage {
    id: string;
    text: string;
    direction: 'inbound' | 'outbound';
    senderId: string;
    senderName: string;
    timestamp: Date | null;
    fbMessageId?: string;
    attachments?: Array<{ type: string; url: string; stickerId?: number }>;
    readAt?: Date | null;
    deliveredAt?: Date | null;
    isPayment?: boolean;
    paymentAmount?: number;
    paymentInvoiceId?: string;
    paymentUrl?: string;
    paymentQr?: string;
    isTemplate?: boolean;
    isPostback?: boolean;
    isAI?: boolean;
    orderId?: string;
}

export type AiMode = 'manual' | 'assist' | 'auto';

export interface FbPageConfig {
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    isActive: boolean;
    aiMode?: AiMode;
}

export interface FbSettings {
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    verifyToken: string;
    isConnected: boolean;
    connectedAt?: Date;
    aiMode?: AiMode;
    aiGreeting?: string;
    pages?: FbPageConfig[];
}

export interface FbCannedResponse {
    key: string;   // e.g. "/баярлалаа"
    text: string;
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
        // Build pages array: merge legacy single-page + pages array
        let pages: FbPageConfig[] = data.pages || [];
        // If legacy pageId exists and not already in pages, add it
        if (data.pageId && !pages.find((p: FbPageConfig) => p.pageId === data.pageId)) {
            pages = [{ pageId: data.pageId, pageName: data.pageName || '', pageAccessToken: data.pageAccessToken || '', isActive: true }, ...pages];
        }
        return {
            pageId: data.pageId || '',
            pageName: data.pageName || '',
            pageAccessToken: data.pageAccessToken || '',
            verifyToken: data.verifyToken || '',
            isConnected: data.isConnected || false,
            connectedAt: convertTimestamp(data.connectedAt) || undefined,
            aiMode: data.aiMode,
            aiGreeting: data.aiGreeting,
            pages,
        };
    },

    async saveSettings(bizId: string, settings: Partial<FbSettings>): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
            ...settings,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    // ═══ Conversations ═══
    subscribeConversations(bizId: string, callback: (convs: FbConversation[]) => void, pageIdFilter?: string) {
        const colRef = collection(db, 'businesses', bizId, 'fbConversations');
        const q = pageIdFilter
            ? query(colRef, where('pageId', '==', pageIdFilter), orderBy('lastMessageAt', 'desc'), limit(100))
            : query(colRef, orderBy('lastMessageAt', 'desc'), limit(100));

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
                    tags: data.tags || [],
                    notes: data.notes || '',
                    assignedTo: data.assignedTo || '',
                    aiSuggestion: data.aiSuggestion || null,
                    aiAction: data.aiAction || null,
                    pageId: data.pageId || '',
                    pageName: data.pageName || '',
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
                    deliveredAt: convertTimestamp(data.deliveredAt),
                    isPayment: data.isPayment || false,
                    paymentAmount: data.paymentAmount,
                    paymentInvoiceId: data.paymentInvoiceId,
                    paymentUrl: data.paymentUrl,
                    paymentQr: data.paymentQr,
                    isTemplate: data.isTemplate || false,
                    isPostback: data.isPostback || false,
                } as FbMessage;
            });
            callback(msgs);
        });
    },

    // ═══ Send Actions (via API) ═══
    async sendMessage(bizId: string, recipientId: string, message: string, senderName?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const resp = await fetch('/api/fb-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bizId, recipientId, action: 'send_text', message, senderName }),
            });
            return resp.json();
        } catch {
            return { success: false, error: 'Network error' };
        }
    },

    async sendImage(bizId: string, recipientId: string, imageUrl: string, senderName?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const resp = await fetch('/api/fb-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bizId, recipientId, action: 'send_image', imageUrl, senderName }),
            });
            return resp.json();
        } catch {
            return { success: false, error: 'Network error' };
        }
    },

    async sendPayment(bizId: string, recipientId: string, amount: number, description?: string, senderName?: string): Promise<{ success: boolean; invoiceId?: string; shortUrl?: string; qrImage?: string; error?: string }> {
        try {
            const resp = await fetch('/api/fb-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bizId, recipientId, action: 'send_payment', amount, description, senderName }),
            });
            return resp.json();
        } catch {
            return { success: false, error: 'Network error' };
        }
    },

    async setTyping(bizId: string, recipientId: string): Promise<void> {
        await fetch('/api/fb-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bizId, recipientId, action: 'typing_on' }),
        }).catch(() => {});
    },

    async markSeen(bizId: string, recipientId: string): Promise<void> {
        await fetch('/api/fb-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bizId, recipientId, action: 'mark_seen' }),
        }).catch(() => {});
    },

    // ═══ Mark as read ═══
    async markConversationRead(bizId: string, senderId: string): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            unreadCount: 0,
        }, { merge: true });

        const q = query(
            collection(db, 'businesses', bizId, 'fbConversations', senderId, 'messages'),
            where('readAt', '==', null),
            where('direction', '==', 'inbound'),
            limit(50)
        );

        const { getDocs, updateDoc: firestoreUpdateDoc } = await import('firebase/firestore');
        const snap = await getDocs(q);
        const now = serverTimestamp();
        await Promise.all(snap.docs.map(d => firestoreUpdateDoc(d.ref, { readAt: now })));

        // Also send mark_seen to Facebook
        this.markSeen(bizId, senderId);
    },

    // ═══ Conversation Management ═══
    async updateConversationStatus(bizId: string, senderId: string, status: 'open' | 'closed'): Promise<void> {
        await updateDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            status,
            updatedAt: serverTimestamp(),
        });
    },

    async updateConversationTags(bizId: string, senderId: string, tags: string[]): Promise<void> {
        await updateDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            tags,
            updatedAt: serverTimestamp(),
        });
    },

    async updateConversationNotes(bizId: string, senderId: string, notes: string): Promise<void> {
        await updateDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            notes,
            updatedAt: serverTimestamp(),
        });
    },

    // ═══ Canned Responses ═══
    async getCannedResponses(bizId: string): Promise<FbCannedResponse[]> {
        const snap = await getDoc(doc(db, 'businesses', bizId, 'fbSettings', 'canned'));
        if (!snap.exists()) return [];
        return snap.data().responses || [];
    },

    async saveCannedResponses(bizId: string, responses: FbCannedResponse[]): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'canned'), {
            responses,
            updatedAt: serverTimestamp(),
        });
    },

    // ── AI Mode ──
    async updateAIMode(bizId: string, mode: AiMode): Promise<void> {
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
            aiMode: mode,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    async updatePageAIMode(bizId: string, pageId: string, mode: AiMode): Promise<void> {
        const settings = await this.getSettings(bizId);
        const pages = settings?.pages || [];
        const idx = pages.findIndex(p => p.pageId === pageId);
        if (idx >= 0) {
            pages[idx] = { ...pages[idx], aiMode: mode };
            await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
                pages,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
    },

    // ═══ Multi-Page Management ═══
    async addPage(bizId: string, page: FbPageConfig): Promise<void> {
        const settings = await this.getSettings(bizId);
        const pages = settings?.pages || [];
        if (pages.find(p => p.pageId === page.pageId)) return; // already exists
        pages.push(page);
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
            pages,
            isConnected: true,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    async removePage(bizId: string, pageId: string): Promise<void> {
        const settings = await this.getSettings(bizId);
        const pages = (settings?.pages || []).filter(p => p.pageId !== pageId);
        await setDoc(doc(db, 'businesses', bizId, 'fbSettings', 'config'), {
            pages,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    async clearAISuggestion(bizId: string, senderId: string): Promise<void> {
        await updateDoc(doc(db, 'businesses', bizId, 'fbConversations', senderId), {
            aiSuggestion: null,
            aiAction: null,
        });
    },

    async sendAISuggestion(bizId: string, senderId: string, text: string): Promise<void> {
        const resp = await fetch('/api/fb-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bizId, recipientId: senderId,
                action: 'send_text', message: text,
                senderName: 'AI Туслах',
            }),
        });
        if (!resp.ok) throw new Error('Failed to send AI suggestion');
        await this.clearAISuggestion(bizId, senderId);
    },
};
