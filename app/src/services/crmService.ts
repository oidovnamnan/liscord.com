import {
    collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy,
    onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Lead, Quote, Campaign, Customer, LoyaltyConfig } from '../types';
import { convertTimestamps } from './helpers';

// ============ LEAD / CRM SERVICES ============

export const leadService = {
    subscribeLeads(bizId: string, callback: (leads: Lead[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'leads'),
            where('isDeleted', '==', false),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Lead)));
        });
    },

    async createLead(bizId: string, data: Partial<Lead>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'leads'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false,
            status: data.status || 'new'
        });
        return docRef.id;
    },

    async updateLead(bizId: string, leadId: string, data: Partial<Lead>) {
        await updateDoc(doc(db, 'businesses', bizId, 'leads', leadId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ CRM / MARKETING SERVICES ============

export const campaignService = {
    subscribeCampaigns(bizId: string, callback: (campaigns: Campaign[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'campaigns'),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Campaign)));
        });
    },

    async createCampaign(bizId: string, data: Partial<Campaign>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'campaigns'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false,
            status: data.status || 'draft',
            stats: { reach: 0, clicks: 0, conversions: 0, revenue: 0 }
        });
        return docRef.id;
    }
};

export const loyaltyService = {
    subscribeCustomers(bizId: string, callback: (customers: Customer[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'customers'), orderBy('updatedAt', 'desc'));
        return onSnapshot(q, snapshot => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Customer)));
        });
    },

    subscribeConfig(bizId: string, callback: (config: LoyaltyConfig | null) => void) {
        return onSnapshot(doc(db, 'businesses', bizId, 'settings', 'loyalty'), (snap) => {
            if (snap.exists()) callback(snap.data() as LoyaltyConfig);
            else callback(null);
        });
    },

    async updateConfig(bizId: string, config: Partial<LoyaltyConfig>) {
        await setDoc(doc(db, 'businesses', bizId, 'settings', 'loyalty'), {
            ...config,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    async getLoyaltyConfig(bizId: string): Promise<LoyaltyConfig | null> {
        const snap = await getDoc(doc(db, 'businesses', bizId, 'settings', 'loyalty'));
        return snap.exists() ? (snap.data() as LoyaltyConfig) : null;
    }
};

export const quoteService = {
    subscribeQuotes(bizId: string, callback: (quotes: Quote[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'quotes'),
            where('isDeleted', '==', false),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Quote)));
        });
    },

    async createQuote(bizId: string, data: Partial<Quote>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'quotes'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false,
            status: data.status || 'draft'
        });
        return docRef.id;
    }
};
