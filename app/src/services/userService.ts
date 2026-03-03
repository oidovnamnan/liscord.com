import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '../types';
import { convertTimestamps } from './helpers';

export const userService = {
    async getUser(uid: string): Promise<User | null> {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? convertTimestamps(docSnap.data()) as User : null;
    },

    async createUser(user: User): Promise<void> {
        await setDoc(doc(db, 'users', user.uid), {
            ...user,
            createdAt: serverTimestamp(),
        });
    },

    async updateProfile(uid: string, updates: Partial<User>): Promise<void> {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, { ...updates });
    },

    async updateActiveBusiness(uid: string, businessId: string): Promise<void> {
        await updateDoc(doc(db, 'users', uid), { activeBusiness: businessId });
    },

    async toggleSuperAdmin(uid: string, isSuperAdmin: boolean): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            isSuperAdmin,
            updatedAt: serverTimestamp()
        });
    },

    async toggleUserStatus(uid: string, isDisabled: boolean): Promise<void> {
        await updateDoc(doc(db, 'users', uid), {
            isDisabled,
            updatedAt: serverTimestamp()
        });
    }
};
