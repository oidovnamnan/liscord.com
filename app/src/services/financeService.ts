import {
    collection, doc, getDoc, getDocs, updateDoc, addDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Invoice, Expense, BankAccount, PettyCashTransaction, Order, Business, BusinessStats } from '../types';
import { convertTimestamps } from './helpers';

// ============ FINANCE / INVOICE SERVICES ============

export const invoiceService = {
    subscribeInvoices(bizId: string, callback: (invoices: Invoice[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'invoices'),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Invoice)));
        });
    },

    async createInvoice(bizId: string, data: Partial<Invoice>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'invoices'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: data.status || 'unpaid'
        });
        return docRef.id;
    },

    async updateInvoiceStatus(bizId: string, invoiceId: string, status: Invoice['status']) {
        await updateDoc(doc(db, 'businesses', bizId, 'invoices', invoiceId), {
            status,
            updatedAt: serverTimestamp()
        });
    }
};

export const expenseService = {
    subscribeExpenses(bizId: string, callback: (expenses: Expense[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'expenses'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Expense)));
        });
    },

    async createExpense(bizId: string, data: Partial<Expense>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'expenses'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isApproved: data.isApproved || false
        });
        return docRef.id;
    }
};

export const bankService = {
    subscribeAccounts(bizId: string, callback: (accounts: BankAccount[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'bankAccounts'),
            orderBy('accountName', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as BankAccount)));
        });
    },

    async createAccount(bizId: string, data: Partial<BankAccount>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'bankAccounts'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            balance: data.balance || 0,
            isSyncEnabled: data.isSyncEnabled || false
        });
        return docRef.id;
    }
};

export const pettyCashService = {
    subscribeTransactions(bizId: string, callback: (tx: PettyCashTransaction[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'pettyCash'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as PettyCashTransaction)));
        });
    },

    async addTransaction(bizId: string, data: Partial<PettyCashTransaction>) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'pettyCash'), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }
};

// ============ DASHBOARD SERVICES ============

export const dashboardService = {
    subscribeRecentOrders(bizId: string, callback: (orders: Order[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'orders'),
            where('isDeleted', '==', false),
            limit(10)
        );
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Order));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            callback(orders.slice(0, 5));
        });
    },

    async getDashboardStats(bizId: string): Promise<BusinessStats | null> {
        const bizDoc = await getDoc(doc(db, 'businesses', bizId));
        if (!bizDoc.exists()) return null;

        const data = bizDoc.data() as Business;

        // Count directly from collections for accuracy
        const [ordersSnap, productsSnap, customersSnap] = await Promise.all([
            getDocs(query(collection(db, 'businesses', bizId, 'orders'), where('isDeleted', '==', false))),
            getDocs(collection(db, 'businesses', bizId, 'products')),
            getDocs(collection(db, 'businesses', bizId, 'customers')),
        ]);

        // Sum revenue from orders
        let totalRevenue = 0;
        ordersSnap.docs.forEach(d => {
            const order = d.data();
            if (order.status !== 'cancelled') {
                totalRevenue += order.financials?.totalAmount || order.totalAmount || 0;
            }
        });

        const stats: BusinessStats = {
            totalOrders: ordersSnap.size,
            totalRevenue,
            totalCustomers: customersSnap.size,
            totalProducts: productsSnap.size,
            totalEmployees: data.stats?.totalEmployees || 0,
        };

        if (data.category === 'cargo') {
            try {
                const packagesSnap = await getDocs(collection(db, 'businesses', bizId, 'packages'));
                const batches = packagesSnap.docs.map(d => d.data());

                stats.totalBatches = batches.length;
                stats.packagesInTransit = batches.filter(b => b.status === 'shipping' || b.status === 'processing').length;
                stats.packagesArrived = batches.filter(b => b.status === 'received' || b.status === 'arrived').length;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stats.totalPackages = batches.reduce((sum: number, b: any) => sum + (b.items?.length || 0), 0);
            } catch (error) {
                console.error('Error fetching cargo stats:', error);
            }
        }

        return stats;
    }
};
