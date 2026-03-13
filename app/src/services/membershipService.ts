/**
 * Membership Service
 * 
 * Онцгой ангилалд хандах гишүүнчлэл.
 * Firestore: businesses/{bizId}/memberships/{docId}
 */

import { db } from './firebase';
import {
    collection, query, where, getDocs, addDoc, serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface Membership {
    id: string;
    categoryId: string;
    customerPhone: string;
    purchasedAt: Date;
    expiresAt: Date;
    amountPaid: number;
    status: 'active' | 'expired';
}

export const membershipService = {
    getMembershipsRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'memberships');
    },

    /**
     * Check if a customer has active membership for a category
     */
    async checkMembership(bizId: string, categoryId: string, customerPhone: string): Promise<boolean> {
        const q = query(
            this.getMembershipsRef(bizId),
            where('categoryId', '==', categoryId),
            where('customerPhone', '==', customerPhone),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (snap.empty) return false;

        // Check if any membership is still valid (not expired)
        const now = new Date();
        return snap.docs.some(doc => {
            const data = doc.data();
            const expiresAt = data.expiresAt instanceof Timestamp
                ? data.expiresAt.toDate()
                : new Date(data.expiresAt);
            return expiresAt > now;
        });
    },

    /**
     * Get all active memberships for a customer
     */
    async getCustomerMemberships(bizId: string, customerPhone: string): Promise<string[]> {
        const q = query(
            this.getMembershipsRef(bizId),
            where('customerPhone', '==', customerPhone),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const now = new Date();
        const activeCategoryIds: string[] = [];

        snap.docs.forEach(doc => {
            const data = doc.data();
            const expiresAt = data.expiresAt instanceof Timestamp
                ? data.expiresAt.toDate()
                : new Date(data.expiresAt);
            if (expiresAt > now) {
                activeCategoryIds.push(data.categoryId);
            }
        });

        return activeCategoryIds;
    },

    /**
     * Grant membership (admin action)
     */
    async grantMembership(bizId: string, categoryId: string, customerPhone: string, amountPaid: number, durationDays: number): Promise<string> {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const docRef = await addDoc(this.getMembershipsRef(bizId), {
            categoryId,
            customerPhone,
            amountPaid,
            purchasedAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
            status: 'active',
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }
};
