import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy,
    onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
    PayrollEntry, BusinessCategoryConfig, PlatformPayment,
    Warehouse, WarehouseZone, Shelf
} from '../types';
import { convertTimestamps } from './helpers';

// ============ FINANCE & PAWNSHOP SERVICES ============

export const pawnItemService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribePawnItems(bizId: string, callback: (items: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'pawnItems'),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createPawnItem(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'pawnItems'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'vault',
            isDeleted: false
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updatePawnItem(bizId: string, itemId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'pawnItems', itemId), data);
    }
};

export const loanService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeLoans(bizId: string, callback: (loans: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'loans'),
            where('isDeleted', '==', false),
            orderBy('dueDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createLoan(bizId: string, data: any) {
        const batch = writeBatch(db);

        const loanRef = doc(collection(db, 'businesses', bizId, 'loans'));
        batch.set(loanRef, {
            ...data,
            id: loanRef.id,
            businessId: bizId,
            totalPaid: 0,
            currentBalance: data.principalAmount,
            status: 'active',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (data.pawnItemId) {
            batch.update(doc(db, 'businesses', bizId, 'pawnItems', data.pawnItemId), {
                status: 'vault'
            });
        }

        await batch.commit();
        return loanRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateLoan(bizId: string, loanId: string, data: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
            ...data,
            updatedAt: serverTimestamp()
        };
        await updateDoc(doc(db, 'businesses', bizId, 'loans', loanId), updateData);

        if (data.status === 'closed') {
            const loanRef = await getDoc(doc(db, 'businesses', bizId, 'loans', loanId));
            if (loanRef.exists() && loanRef.data().pawnItemId) {
                await updateDoc(doc(db, 'businesses', bizId, 'pawnItems', loanRef.data().pawnItemId), {
                    status: 'returned'
                });
            }
        }

        if (data.status === 'foreclosed') {
            const loanRef = await getDoc(doc(db, 'businesses', bizId, 'loans', loanId));
            if (loanRef.exists() && loanRef.data().pawnItemId) {
                await updateDoc(doc(db, 'businesses', bizId, 'pawnItems', loanRef.data().pawnItemId), {
                    status: 'for_sale'
                });
            }
        }
    }
};

// ============ SERVICE QUEUE SERVICES ============

export const serviceQueueService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeQueue(bizId: string, callback: (tickets: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'serviceQueue'),
            where('isDeleted', '==', false),
            where('status', 'in', ['waiting', 'in_progress'])
        );
        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
            tickets.sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());
            callback(tickets);
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createTicket(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'serviceQueue'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'waiting',
            startTime: null,
            endTime: null,
            assignedWorkerId: null,
            assignedWorkerName: null,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async nextStatus(bizId: string, ticketId: string, currentStatus: string, workerName?: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = { updatedAt: serverTimestamp() };

        if (currentStatus === 'waiting') {
            updates.status = 'in_progress';
            updates.startTime = serverTimestamp();
            if (workerName) Object.assign(updates, { assignedWorkerName: workerName });
        } else if (currentStatus === 'in_progress') {
            updates.status = 'done';
            updates.endTime = serverTimestamp();
        }

        await updateDoc(doc(db, 'businesses', bizId, 'serviceQueue', ticketId), updates);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateTicket(bizId: string, ticketId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'serviceQueue', ticketId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ ATTENDANCE & HR SERVICES ============

export const attendanceService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeDailyAttendance(bizId: string, dateString: string, callback: (records: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'attendance'),
            where('isDeleted', '==', false),
            where('dateString', '==', dateString)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async clockIn(bizId: string, employeeId: string, employeeName: string) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;

        const newRef = doc(collection(db, 'businesses', bizId, 'attendance'));
        await setDoc(newRef, {
            id: newRef.id,
            businessId: bizId,
            employeeId,
            employeeName,
            dateString,
            clockInTime: serverTimestamp(),
            clockOutTime: null,
            breakStartTime: null,
            breakEndTime: null,
            totalWorkedMinutes: 0,
            notes: '',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async clockOut(bizId: string, attendanceId: string, totalWorkedMinutes: number) {
        await updateDoc(doc(db, 'businesses', bizId, 'attendance', attendanceId), {
            clockOutTime: serverTimestamp(),
            totalWorkedMinutes,
            updatedAt: serverTimestamp()
        });
    },

    async startBreak(bizId: string, attendanceId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'attendance', attendanceId), {
            breakStartTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },

    async endBreak(bizId: string, attendanceId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'attendance', attendanceId), {
            breakEndTime: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
};

// ============ PAYROLL SERVICES ============

export const payrollService = {
    getEntriesByMonth: async (businessId: string, month: string): Promise<PayrollEntry[]> => {
        try {
            const q = query(
                collection(db, 'businesses', businessId, 'payroll'),
                where('month', '==', month),
                orderBy('employeeName')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollEntry));
        } catch (error) {
            console.error('Error fetching payroll entries:', error);
            return [];
        }
    },

    saveEntry: async (businessId: string, entryData: Partial<PayrollEntry>): Promise<string> => {
        try {
            if (entryData.id) {
                const docRef = doc(db, 'businesses', businessId, 'payroll', entryData.id);
                await updateDoc(docRef, entryData);
                return entryData.id;
            } else {
                const docRef = doc(collection(db, 'businesses', businessId, 'payroll'));
                await setDoc(docRef, { ...entryData, createdAt: new Date() });
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving payroll entry:', error);
            throw error;
        }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribePayrollRules(bizId: string, callback: (rules: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'payrollRules'),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async savePayrollRule(bizId: string, ruleId: string, data: any) {
        const docRef = doc(db, 'businesses', bizId, 'payrollRules', ruleId);
        await setDoc(docRef, {
            ...data,
            id: ruleId,
            businessId: bizId,
            isDeleted: false,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribePayrollRecords(bizId: string, periodStart: string, periodEnd: string, callback: (records: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'payrollRecords'),
            where('isDeleted', '==', false),
            where('periodStart', '>=', periodStart),
            where('periodEnd', '<=', periodEnd)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async savePayrollRecord(bizId: string, data: any) {
        const collectionRef = collection(db, 'businesses', bizId, 'payrollRecords');
        const docRef = data.id ? doc(collectionRef, data.id) : doc(collectionRef);

        await setDoc(docRef, {
            ...data,
            id: docRef.id,
            businessId: bizId,
            isDeleted: false,
            updatedAt: serverTimestamp(),
            createdAt: data.id ? data.createdAt : serverTimestamp()
        }, { merge: true });

        return docRef.id;
    }
};

// ============ ADMIN / PLATFORM SERVICES ============

export const businessCategoryService = {
    async getCategories(): Promise<BusinessCategoryConfig[]> {
        const q = query(collection(db, 'system_categories'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessCategoryConfig));
    },

    async createCategory(category: BusinessCategoryConfig): Promise<void> {
        const functions = getFunctions();
        const updateFn = httpsCallable(functions, 'updateSystemCategory');
        await updateFn({ categoryId: category.id, value: category });
    },

    async updateCategory(id: string, updates: Partial<BusinessCategoryConfig>): Promise<void> {
        const functions = getFunctions();
        const updateFn = httpsCallable(functions, 'updateSystemCategory');
        await updateFn({ categoryId: id, value: updates });
    },

    async bulkUpdateCategories(ids: string[], updates: Partial<BusinessCategoryConfig>): Promise<void> {
        const functions = getFunctions();
        const bulkFn = httpsCallable(functions, 'bulkUpdateSystemCategories');
        await bulkFn({ ids, updates });
    },

    async deleteCategory(id: string): Promise<void> {
        const functions = getFunctions();
        const deleteFn = httpsCallable(functions, 'updateSystemCategory');
        await deleteFn({ categoryId: id, isDelete: true });
    }
};

export const platformFinanceService = {
    async getPayments(): Promise<PlatformPayment[]> {
        const q = query(collection(db, 'platform_payments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as PlatformPayment));
    },

    async recordPayment(payment: Omit<PlatformPayment, 'id' | 'createdAt'>): Promise<string> {
        const docRef = doc(collection(db, 'platform_payments'));
        const newPayment: PlatformPayment = {
            ...payment,
            id: docRef.id,
            createdAt: new Date(),
        };
        await setDoc(docRef, newPayment);
        return docRef.id;
    },

    async extendBusinessSubscription(businessId: string, plan: 'free' | 'pro' | 'business', monthsToAdd: number): Promise<void> {
        const docRef = doc(db, 'businesses', businessId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error('Business not found');

        const data = snap.data();
        let currentExpiresAt = data.subscription?.expiresAt?.toDate() || new Date();

        if (currentExpiresAt < new Date()) {
            currentExpiresAt = new Date();
        }

        const newExpiresAt = new Date(currentExpiresAt);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + monthsToAdd);

        await updateDoc(docRef, {
            'subscription.plan': plan,
            'subscription.expiresAt': newExpiresAt
        });
    }
};

export interface GlobalSettings {
    banner: {
        isActive: boolean;
        message: string;
        type: 'info' | 'warning' | 'danger' | 'success';
        link?: string;
    };
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    geminiApiKey?: string;
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
    banner: {
        isActive: false,
        message: '',
        type: 'info'
    },
    maintenanceMode: false,
    registrationEnabled: true,
    geminiApiKey: ''
};

export const globalSettingsService = {
    async getSettings(): Promise<GlobalSettings> {
        const docRef = doc(db, 'system_settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return {
                ...DEFAULT_GLOBAL_SETTINGS,
                ...snap.data()
            } as GlobalSettings;
        }
        return DEFAULT_GLOBAL_SETTINGS;
    },

    async updateSettings(updates: Partial<GlobalSettings>): Promise<void> {
        const functions = getFunctions();
        const updateFn = httpsCallable(functions, 'updateSystemSettings');
        await updateFn({ docId: 'global', value: updates });
    },

    subscribeToSettings(callback: (settings: GlobalSettings) => void) {
        const docRef = doc(db, 'system_settings', 'global');
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({
                    ...DEFAULT_GLOBAL_SETTINGS,
                    ...docSnap.data()
                } as GlobalSettings);
            } else {
                callback(DEFAULT_GLOBAL_SETTINGS);
            }
        });
    }
};

// ============ WAREHOUSE SERVICES ============

export const warehouseService = {
    getWarehousesRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'warehouses');
    },

    subscribeWarehouses(bizId: string, callback: (data: Warehouse[]) => void) {
        const q = query(this.getWarehousesRef(bizId), where('isDeleted', '==', false));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Warehouse)));
        });
    },

    async createWarehouse(bizId: string, data: Partial<Warehouse>) {
        const docRef = await addDoc(this.getWarehousesRef(bizId), {
            ...data,
            isActive: true,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    },

    async updateWarehouse(bizId: string, id: string, data: Partial<Warehouse>) {
        const docRef = doc(db, 'businesses', bizId, 'warehouses', id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    },

    async deleteWarehouse(bizId: string, id: string) {
        const docRef = doc(db, 'businesses', bizId, 'warehouses', id);
        await updateDoc(docRef, { isDeleted: true, updatedAt: serverTimestamp() });
    },

    getZonesRef(bizId: string, warehouseId: string) {
        return collection(db, 'businesses', bizId, 'warehouses', warehouseId, 'zones');
    },

    subscribeZones(bizId: string, warehouseId: string, callback: (data: WarehouseZone[]) => void) {
        const q = query(this.getZonesRef(bizId, warehouseId), where('isDeleted', '==', false));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as WarehouseZone)));
        });
    },

    async createZone(bizId: string, warehouseId: string, data: Partial<WarehouseZone>) {
        const docRef = await addDoc(this.getZonesRef(bizId, warehouseId), {
            ...data,
            warehouseId,
            isDeleted: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    },

    getShelvesRef(bizId: string, warehouseId: string) {
        return collection(db, 'businesses', bizId, 'warehouses', warehouseId, 'shelves');
    },

    subscribeShelves(bizId: string, warehouseId: string, callback: (data: Shelf[]) => void) {
        const q = query(this.getShelvesRef(bizId, warehouseId), where('isDeleted', '==', false));
        return onSnapshot(q, (snap) => {
            callback(snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Shelf)));
        });
    },

    async createShelf(bizId: string, warehouseId: string, data: Partial<Shelf>) {
        const docRef = await addDoc(this.getShelvesRef(bizId, warehouseId), {
            ...data,
            warehouseId,
            isDeleted: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    }
};
