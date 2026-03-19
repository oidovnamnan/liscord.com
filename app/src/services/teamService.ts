import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Employee, Position, OrderSource, SocialAccount } from '../types';
import { convertTimestamps } from './helpers';

// ============ CHAT SERVICES ============

export const chatService = {
    getChannelsRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'channels');
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeChannels(bizId: string, callback: (channels: any[]) => void) {
        const q = query(this.getChannelsRef(bizId), orderBy('name'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeMessages(bizId: string, channelId: string, callback: (messages: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'channels', channelId, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) })));
        });
    },

    async createChannel(bizId: string, data: { name: string, type: 'general' | 'team' | 'dm', icon: string }) {
        const docRef = await addDoc(this.getChannelsRef(bizId), {
            ...data,
            createdAt: serverTimestamp(),
            lastMessage: 'Суваг үүсгэгдлээ',
            lastMessageAt: serverTimestamp()
        });
        return docRef.id;
    },

    async sendMessage(bizId: string, channelId: string, message: { text: string; senderId: string; senderName: string; avatar: string }) {
        await addDoc(collection(db, 'businesses', bizId, 'channels', channelId, 'messages'), {
            ...message,
            createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'businesses', bizId, 'channels', channelId), {
            lastMessage: `${message.senderName}: ${message.text}`,
            lastMessageAt: serverTimestamp()
        });
    }
};

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
        await addDoc(collection(db, 'businesses', bizId, 'employees'), {
            ...employeeData,
            status: 'pending_invite',
            joinedAt: serverTimestamp(),
            stats: { totalOrdersCreated: 0, totalOrdersHandled: 0 }
        });
    },

    async updateEmployee(bizId: string, empId: string, data: Partial<Employee>) {
        await updateDoc(doc(db, 'businesses', bizId, 'employees', empId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteEmployee(bizId: string, empId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'employees', empId), {
            isDeleted: true,
            status: 'inactive',
            updatedAt: serverTimestamp()
        });
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
