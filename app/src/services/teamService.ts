import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp, writeBatch, arrayUnion, arrayRemove, startAfter, Timestamp,
    QueryDocumentSnapshot, deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import type { Employee, Position, OrderSource, SocialAccount } from '../types';
import { convertTimestamps } from './helpers';

// ============ CHAT TYPES ============
export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    avatar: string;
    type: 'text' | 'image' | 'file' | 'system' | 'entity_link';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: any;
    // Reply
    replyTo?: { messageId: string; senderName: string; text: string } | null;
    // Edit/Delete
    isEdited?: boolean;
    editedAt?: Date | null;
    isDeleted?: boolean;
    // Pin
    isPinned?: boolean;
    // Reactions: { "👍": ["userId1"], "❤️": ["userId2", "userId3"] }
    reactions?: Record<string, string[]>;
    // Attachments
    attachments?: Array<{ type: string; url: string; name?: string; size?: number; thumbnail?: string }>;
    // Entity links (system integration)
    entityLink?: { type: 'order' | 'product' | 'customer'; id: string; label: string; number?: string } | null;
    // Mentions
    mentions?: string[];
}

export interface ChatChannel {
    id: string;
    name: string;
    type: 'general' | 'team' | 'dm' | 'announcement';
    icon: string;
    description?: string;
    members?: string[];
    dmParticipants?: { id: string; name: string; avatar: string }[];
    lastMessage?: string;
    lastMessageAt?: Timestamp;
    pinnedMessageIds?: string[];
    createdBy?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt?: any;
    isDefault?: boolean;
}

// ============ CHAT SERVICE ============

export const chatService = {
    getChannelsRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'channels');
    },

    getMessagesRef(bizId: string, channelId: string) {
        return collection(db, 'businesses', bizId, 'channels', channelId, 'messages');
    },

    // ──── CHANNELS ────

    subscribeChannels(bizId: string, callback: (channels: ChatChannel[]) => void) {
        const q = query(this.getChannelsRef(bizId), orderBy('name'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatChannel)));
        });
    },

    async createChannel(bizId: string, data: {
        name: string;
        type: 'general' | 'team' | 'dm' | 'announcement';
        icon: string;
        description?: string;
        members?: string[];
        createdBy?: string;
    }) {
        const docRef = await addDoc(this.getChannelsRef(bizId), {
            ...data,
            pinnedMessageIds: [],
            createdAt: serverTimestamp(),
            lastMessage: 'Суваг үүсгэгдлээ',
            lastMessageAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateChannel(bizId: string, channelId: string, data: Partial<ChatChannel>) {
        await updateDoc(doc(db, 'businesses', bizId, 'channels', channelId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteChannel(bizId: string, channelId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'channels', channelId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    },

    // ──── MESSAGES ────

    subscribeMessages(bizId: string, channelId: string, callback: (messages: ChatMessage[]) => void, msgLimit = 50) {
        const q = query(
            this.getMessagesRef(bizId, channelId),
            orderBy('createdAt', 'asc'),
            limit(msgLimit)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as ChatMessage)));
        });
    },

    // Cursor-based pagination — load older messages
    async loadMoreMessages(bizId: string, channelId: string, beforeDoc: QueryDocumentSnapshot, count = 30): Promise<{ messages: ChatMessage[]; lastDoc: QueryDocumentSnapshot | null }> {
        const q = query(
            this.getMessagesRef(bizId, channelId),
            orderBy('createdAt', 'desc'),
            startAfter(beforeDoc),
            limit(count)
        );
        const snap = await getDocs(q);
        const messages = snap.docs.reverse().map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as ChatMessage));
        return { messages, lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null };
    },

    // ──── SEND MESSAGE (atomic: message + channel lastMessage) ────

    async sendMessage(bizId: string, channelId: string, message: {
        text: string;
        senderId: string;
        senderName: string;
        avatar: string;
        type?: ChatMessage['type'];
        replyTo?: ChatMessage['replyTo'];
        attachments?: ChatMessage['attachments'];
        entityLink?: ChatMessage['entityLink'];
        mentions?: string[];
    }) {
        const batch = writeBatch(db);

        // 1. Add message
        const msgRef = doc(this.getMessagesRef(bizId, channelId));
        batch.set(msgRef, {
            ...message,
            type: message.type || 'text',
            reactions: {},
            isPinned: false,
            isDeleted: false,
            isEdited: false,
            createdAt: serverTimestamp()
        });

        // 2. Update channel preview (atomic with message)
        const channelRef = doc(db, 'businesses', bizId, 'channels', channelId);
        const previewText = message.type === 'image' ? '📸 Зураг' :
            message.type === 'file' ? '📎 Файл' :
            message.type === 'entity_link' ? `🔗 ${message.entityLink?.label || 'Линк'}` :
            message.text;
        batch.update(channelRef, {
            lastMessage: `${message.senderName}: ${previewText}`.slice(0, 100),
            lastMessageAt: serverTimestamp()
        });

        await batch.commit();
        return msgRef.id;
    },

    // ──── EDIT MESSAGE (5 min window) ────

    async editMessage(bizId: string, channelId: string, msgId: string, newText: string, userId: string) {
        const msgRef = doc(db, 'businesses', bizId, 'channels', channelId, 'messages', msgId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) throw new Error('Message not found');

        const data = snap.data();
        if (data.senderId !== userId) throw new Error('Can only edit own messages');

        // 5 minute limit
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
        const minutesSince = (Date.now() - createdAt.getTime()) / 60000;
        if (minutesSince > 5) throw new Error('Edit window expired (5 min)');

        await updateDoc(msgRef, {
            text: newText,
            isEdited: true,
            editedAt: serverTimestamp()
        });
    },

    // ──── DELETE MESSAGE (soft delete) ────

    async deleteMessage(bizId: string, channelId: string, msgId: string, userId: string, isAdmin = false) {
        const msgRef = doc(db, 'businesses', bizId, 'channels', channelId, 'messages', msgId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) throw new Error('Message not found');

        const data = snap.data();
        if (data.senderId !== userId && !isAdmin) throw new Error('Can only delete own messages');

        await updateDoc(msgRef, {
            isDeleted: true,
            text: 'Энэ зурвас устгагдсан',
            attachments: [],
            deletedAt: serverTimestamp(),
            deletedBy: userId
        });
    },

    // ──── REACTIONS ────

    async addReaction(bizId: string, channelId: string, msgId: string, emoji: string, userId: string) {
        const msgRef = doc(db, 'businesses', bizId, 'channels', channelId, 'messages', msgId);
        await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayUnion(userId)
        });
    },

    async removeReaction(bizId: string, channelId: string, msgId: string, emoji: string, userId: string) {
        const msgRef = doc(db, 'businesses', bizId, 'channels', channelId, 'messages', msgId);
        await updateDoc(msgRef, {
            [`reactions.${emoji}`]: arrayRemove(userId)
        });
    },

    // ──── PIN / UNPIN ────

    async togglePin(bizId: string, channelId: string, msgId: string) {
        const msgRef = doc(db, 'businesses', bizId, 'channels', channelId, 'messages', msgId);
        const channelRef = doc(db, 'businesses', bizId, 'channels', channelId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;

        const isPinned = snap.data().isPinned || false;
        const batch = writeBatch(db);

        batch.update(msgRef, { isPinned: !isPinned });
        if (isPinned) {
            batch.update(channelRef, { pinnedMessageIds: arrayRemove(msgId) });
        } else {
            batch.update(channelRef, { pinnedMessageIds: arrayUnion(msgId) });
        }

        await batch.commit();
    },

    // Subscribe to pinned messages
    subscribePinnedMessages(bizId: string, channelId: string, callback: (messages: ChatMessage[]) => void) {
        const q = query(
            this.getMessagesRef(bizId, channelId),
            where('isPinned', '==', true),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as ChatMessage)));
        });
    },

    // ──── UNREAD TRACKING ────

    async markChannelRead(bizId: string, channelId: string, userId: string) {
        const readRef = doc(db, 'businesses', bizId, 'chatReadState', `${userId}_${channelId}`);
        await setDoc(readRef, {
            userId,
            channelId,
            lastReadAt: serverTimestamp()
        }, { merge: true });
    },

    subscribeReadStates(bizId: string, userId: string, callback: (states: Record<string, Date>) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'chatReadState'),
            where('userId', '==', userId)
        );
        return onSnapshot(q, (snap) => {
            const states: Record<string, Date> = {};
            snap.docs.forEach(d => {
                const data = d.data();
                states[data.channelId] = data.lastReadAt?.toDate?.() || new Date(0);
            });
            callback(states);
        });
    },

    // ──── DIRECT MESSAGES ────

    getDMChannelId(userId1: string, userId2: string): string {
        return [userId1, userId2].sort().join('_dm_');
    },

    async getOrCreateDM(bizId: string, user1: { id: string; name: string; avatar: string }, user2: { id: string; name: string; avatar: string }): Promise<string> {
        const dmId = this.getDMChannelId(user1.id, user2.id);
        const channelRef = doc(db, 'businesses', bizId, 'channels', dmId);
        const snap = await getDoc(channelRef);

        if (snap.exists()) return dmId;

        // Create DM channel with explicit ID
        await setDoc(channelRef, {
            name: `${user1.name}`,
            type: 'dm',
            icon: user2.name.charAt(0),
            dmParticipants: [
                { id: user1.id, name: user1.name, avatar: user1.avatar },
                { id: user2.id, name: user2.name, avatar: user2.avatar }
            ],
            members: [user1.id, user2.id],
            pinnedMessageIds: [],
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageAt: serverTimestamp()
        });

        return dmId;
    },

    // ──── SEARCH ────

    async searchMessages(bizId: string, searchQuery: string, channelId?: string): Promise<ChatMessage[]> {
        // Client-side search within loaded messages (Firestore doesn't support full-text)
        // For better search, we query recent messages and filter
        const searchLower = searchQuery.toLowerCase();
        const colRef = channelId
            ? this.getMessagesRef(bizId, channelId)
            : null;

        if (!colRef) {
            // Search across all channels — get channels first, then search each
            const channelsSnap = await getDocs(this.getChannelsRef(bizId));
            const results: ChatMessage[] = [];
            for (const ch of channelsSnap.docs) {
                const q = query(
                    this.getMessagesRef(bizId, ch.id),
                    orderBy('createdAt', 'desc'),
                    limit(200)
                );
                const snap = await getDocs(q);
                snap.docs.forEach(d => {
                    const data = d.data();
                    if (data.text?.toLowerCase().includes(searchLower) && !data.isDeleted) {
                        results.push({ id: d.id, ...convertTimestamps(data), _channelId: ch.id, _channelName: ch.data().name } as ChatMessage & { _channelId: string; _channelName: string });
                    }
                });
            }
            return results.slice(0, 20);
        }

        const q = query(colRef, orderBy('createdAt', 'desc'), limit(200));
        const snap = await getDocs(q);
        return snap.docs
            .filter(d => d.data().text?.toLowerCase().includes(searchLower) && !d.data().isDeleted)
            .map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as ChatMessage))
            .slice(0, 20);
    }
};

// ============ PHONE MAP HELPERS (for employee auto-login) ============

function normalizePhone(phone: string): string {
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-()]/g, '');
    // Ensure +976 prefix for Mongolian numbers
    if (/^\d{8}$/.test(cleaned)) {
        cleaned = `+976${cleaned}`;
    }
    return cleaned;
}

async function writePhoneMap(phone: string, bizId: string, empId: string) {
    try {
        const normalized = normalizePhone(phone);
        await setDoc(doc(db, 'employee_phone_map', normalized), {
            businessId: bizId,
            employeeId: empId,
            phone: normalized,
            updatedAt: serverTimestamp(),
        });
    } catch (e) {
        console.warn('[teamService] writePhoneMap failed (non-critical):', e);
    }
}

async function removePhoneMap(phone: string) {
    try {
        const { deleteDoc: firebaseDeleteDoc } = await import('firebase/firestore');
        const normalized = normalizePhone(phone);
        await firebaseDeleteDoc(doc(db, 'employee_phone_map', normalized));
    } catch (e) {
        console.warn('[teamService] removePhoneMap failed (non-critical):', e);
    }
}
/**
 * Duplicate check for phone and email — scoped to same business's employees only.
 * Each business manages its own employee uniqueness independently.
 * Storefront customers and other businesses are NOT checked.
 * @param excludeEmpId - skip this employee ID (for edit form)
 */
async function checkDuplicateContact(
    bizId: string,
    phone?: string | null,
    email?: string | null,
    excludeEmpId?: string
) {
    const errors: string[] = [];

    if (phone) {
        const empByPhone = query(
            collection(db, 'businesses', bizId, 'employees'),
            where('phone', '==', phone.trim()),
            where('status', '==', 'active'),
            limit(1)
        );
        const empSnap = await getDocs(empByPhone);
        if (!empSnap.empty && empSnap.docs[0].id !== excludeEmpId) {
            errors.push(`Утас (${phone}) энэ бизнесийн ажилтанд бүртгэлтэй`);
        }
    }

    if (email && email.trim()) {
        const trimmedEmail = email.trim().toLowerCase();
        const empByEmail = query(
            collection(db, 'businesses', bizId, 'employees'),
            where('email', '==', trimmedEmail),
            where('status', '==', 'active'),
            limit(1)
        );
        const empEmailSnap = await getDocs(empByEmail);
        if (!empEmailSnap.empty && empEmailSnap.docs[0].id !== excludeEmpId) {
            errors.push(`Имэйл (${trimmedEmail}) энэ бизнесийн ажилтанд бүртгэлтэй`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join('. '));
    }
}

// ============ TEAM SERVICES ============

export const teamService = {
    subscribePositions(bizId: string, callback: (positions: Position[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'positions'), orderBy('order'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Position)));
        });
    },

    async createPosition(bizId: string, data: Partial<Position>) {
        await addDoc(collection(db, 'businesses', bizId, 'positions'), {
            ...data,
            createdAt: serverTimestamp()
        });
    },

    async updatePosition(bizId: string, posId: string, data: Partial<Position>) {
        await updateDoc(doc(db, 'businesses', bizId, 'positions', posId), data);
    },

    subscribeEmployees(bizId: string, callback: (employees: Employee[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'employees'), orderBy('joinedAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Employee));
        });
    },

    async inviteEmployee(bizId: string, employeeData: Partial<Employee>) {
        // Comprehensive duplicate check: phone + email across employees, owners, superadmins
        await checkDuplicateContact(bizId, employeeData.phone, employeeData.email);

        const docRef = await addDoc(collection(db, 'businesses', bizId, 'employees'), {
            ...employeeData,
            status: 'active',
            joinedAt: serverTimestamp(),
            stats: { totalOrdersCreated: 0, totalOrdersHandled: 0 }
        });
        // Write phone→business mapping for auto-login
        if (employeeData.phone) {
            await writePhoneMap(employeeData.phone, bizId, docRef.id);
        }
    },

    async updateEmployee(bizId: string, empId: string, data: Partial<Employee>) {
        // If phone or email is changing, check for duplicates
        if (data.phone || data.email) {
            await checkDuplicateContact(bizId, data.phone, data.email, empId);
        }

        // If phone changed, remove old phone→business mapping
        if (data.phone) {
            try {
                const empSnap = await getDoc(doc(db, 'businesses', bizId, 'employees', empId));
                const oldPhone = empSnap.exists() ? empSnap.data()?.phone : null;
                if (oldPhone && oldPhone !== data.phone) {
                    await removePhoneMap(oldPhone);
                }
            } catch (e) {
                console.warn('[teamService] read old phone failed (non-critical):', e);
            }
        }
        await updateDoc(doc(db, 'businesses', bizId, 'employees', empId), {
            ...data,
            updatedAt: serverTimestamp()
        });
        // Write new phone→business mapping
        if (data.phone) {
            await writePhoneMap(data.phone, bizId, empId);
        }
    },

    async deleteEmployee(bizId: string, empId: string) {
        // Read the employee doc first to get phone for cleanup
        const empSnap = await getDoc(doc(db, 'businesses', bizId, 'employees', empId));
        const empPhone = empSnap.exists() ? empSnap.data()?.phone : null;

        await updateDoc(doc(db, 'businesses', bizId, 'employees', empId), {
            isDeleted: true,
            status: 'inactive',
            updatedAt: serverTimestamp()
        });
        // Remove phone→business mapping
        if (empPhone) {
            await removePhoneMap(empPhone);
        }
    },

    async linkEmployee(bizId: string, sourceEmpId: string, targetEmpId: string) {
        const { writeBatch, arrayUnion } = await import('firebase/firestore');
        const batch = writeBatch(db);
        const sourceRef = doc(db, 'businesses', bizId, 'employees', sourceEmpId);
        const targetRef = doc(db, 'businesses', bizId, 'employees', targetEmpId);
        // Bidirectional link
        batch.update(sourceRef, { linkedEmployeeIds: arrayUnion(targetEmpId), updatedAt: serverTimestamp() });
        batch.update(targetRef, { linkedEmployeeIds: arrayUnion(sourceEmpId), updatedAt: serverTimestamp() });
        await batch.commit();
    },

    async sendSmsViaBridge(bizId: string, phone: string, message: string): Promise<boolean> {
        try {
            const bizDoc = await getDoc(doc(db, 'businesses', bizId));
            const smsBridgeKey = bizDoc.data()?.smsBridgeKey;
            if (!smsBridgeKey) {
                throw new Error('SMS Bridge холбогдоогүй байна. Тохиргоо хэсгээс QR холболт хийнэ үү.');
            }
            await addDoc(collection(db, 'sms_outbox'), {
                pairingKey: smsBridgeKey,
                to: phone,
                message,
                status: 'pending',
                type: 'employee_invite',
                businessId: bizId,
                createdAt: serverTimestamp(),
            });
            return true;
        } catch (error) {
            console.error('SMS outbox write failed:', error);
            throw error;
        }
    },

    async unlinkEmployee(bizId: string, sourceEmpId: string, targetEmpId: string) {
        const { writeBatch, arrayRemove } = await import('firebase/firestore');
        const batch = writeBatch(db);
        const sourceRef = doc(db, 'businesses', bizId, 'employees', sourceEmpId);
        const targetRef = doc(db, 'businesses', bizId, 'employees', targetEmpId);
        // Remove bidirectional link
        batch.update(sourceRef, { linkedEmployeeIds: arrayRemove(targetEmpId), updatedAt: serverTimestamp() });
        batch.update(targetRef, { linkedEmployeeIds: arrayRemove(sourceEmpId), updatedAt: serverTimestamp() });
        await batch.commit();
    }
};

// ============ SOURCE & ACCOUNT SERVICES ============

export const sourceService = {
    async createSource(bizId: string, source: Partial<OrderSource>): Promise<string> {
        const ref = doc(collection(db, 'businesses', bizId, 'orderSources'));
        await setDoc(ref, {
            ...source,
            id: ref.id,
            businessId: bizId,
            isDeleted: false,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async updateSource(bizId: string, sourceId: string, data: Partial<OrderSource>) {
        await updateDoc(doc(db, 'businesses', bizId, 'orderSources', sourceId), data);
    },

    subscribeSources(bizId: string, callback: (sources: OrderSource[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'orderSources'),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => convertTimestamps(d.data()) as OrderSource));
        });
    },

    async createAccount(bizId: string, account: Partial<SocialAccount>): Promise<string> {
        const ref = doc(collection(db, 'businesses', bizId, 'socialAccounts'));
        await setDoc(ref, {
            ...account,
            id: ref.id,
            businessId: bizId,
            isDeleted: false,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    },

    async updateAccount(bizId: string, accountId: string, data: Partial<SocialAccount>) {
        await updateDoc(doc(db, 'businesses', bizId, 'socialAccounts', accountId), data);
    },

    subscribeAccounts(bizId: string, sourceId: string | null, callback: (accounts: SocialAccount[]) => void) {
        let q = query(
            collection(db, 'businesses', bizId, 'socialAccounts'),
            where('isDeleted', '==', false)
        );
        if (sourceId) {
            q = query(q, where('sourceId', '==', sourceId));
        }
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => convertTimestamps(d.data()) as SocialAccount));
        });
    },

    async getAllAccounts(bizId: string): Promise<SocialAccount[]> {
        const q = query(collection(db, 'businesses', bizId, 'socialAccounts'), where('isDeleted', '==', false));
        const snap = await getDocs(q);
        return snap.docs.map(d => convertTimestamps(d.data()) as SocialAccount);
    }
};
