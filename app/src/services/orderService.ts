import {
    collection, doc, getDoc, setDoc, updateDoc, addDoc, query, orderBy, limit,
    onSnapshot, serverTimestamp, writeBatch, where, startAfter, getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { eventBus, EVENTS } from './eventBus';
import { auditService } from './audit';
import type { Order, OrderStatusConfig } from '../types';
import { convertTimestamps } from './helpers';

// ============ ORDER STATUS SERVICES ============

export const DEFAULT_STATUSES: Partial<OrderStatusConfig>[] = [
    { id: 'all', label: 'Бүгд', color: '#64748b', order: 0, isSystem: true, isActive: true },
    { id: 'new', label: 'Шинэ', color: '#3b82f6', order: 1, isSystem: true, isActive: true },
    { id: 'completed', label: 'Биелсэн', color: '#10b981', order: 2, isSystem: true, isActive: true },
    { id: 'returned', label: 'Буцаасан', color: '#f59e0b', order: 3, isSystem: true, isActive: true },
    { id: 'cancelled', label: 'Цуцлагдсан', color: '#ef4444', order: 4, isSystem: true, isActive: true },
];

export const orderStatusService = {
    getStatusesRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'orderStatuses');
    },

    subscribeStatuses(bizId: string, callback: (statuses: OrderStatusConfig[]) => void) {
        const q = query(this.getStatusesRef(bizId), orderBy('order', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const dbStatuses = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as OrderStatusConfig));

            const combined = [...DEFAULT_STATUSES] as OrderStatusConfig[];

            dbStatuses.forEach(dbS => {
                const idx = combined.findIndex(s => s.id === dbS.id);
                if (idx > -1) {
                    combined[idx] = { ...combined[idx], ...dbS };
                } else {
                    combined.push(dbS);
                }
            });

            callback(combined.sort((a, b) => {
                if (a.order !== b.order) return a.order - b.order;
                return a.id.localeCompare(b.id);
            }));
        });
    },

    async addStatus(bizId: string, status: Partial<OrderStatusConfig>): Promise<void> {
        const docRef = doc(this.getStatusesRef(bizId), status.id || undefined);
        await setDoc(docRef, {
            ...status,
            id: docRef.id,
            isSystem: false,
            isActive: status.isActive ?? true,
            createdAt: serverTimestamp()
        }, { merge: true });
    },

    async updateStatus(bizId: string, statusId: string, status: Partial<OrderStatusConfig>): Promise<void> {
        await setDoc(doc(this.getStatusesRef(bizId), statusId), {
            ...status,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    async deleteStatus(bizId: string, statusId: string): Promise<void> {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(this.getStatusesRef(bizId), statusId));
    }
};

// ============ ORDER SERVICES ============

export const orderService = {
    getOrdersRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'orders');
    },

    subscribeOrders(bizId: string, callback: (orders: Order[], lastDoc: any) => void, statusFilter?: string, limitCount: number = 50, startDate?: Date) {
        let q = query(
            this.getOrdersRef(bizId),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        if (statusFilter && statusFilter !== 'all' && statusFilter !== 'cancelled') {
            q = query(q, where('status', '==', statusFilter));
        }

        if (startDate) {
            q = query(q, where('createdAt', '>=', startDate));
        }

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Order));
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];
            callback(orders, lastDoc);
        });
    },

    async getOrdersPaginated(bizId: string, lastVisible: any, statusFilter?: string): Promise<{ orders: Order[], lastDoc: any }> {
        let q = query(
            this.getOrdersRef(bizId),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        if (statusFilter && statusFilter !== 'all' && statusFilter !== 'cancelled') {
            q = query(q, where('status', '==', statusFilter));
        }

        if (lastVisible) {
            q = query(q, startAfter(lastVisible));
        }

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Order));
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];

        return { orders, lastDoc };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createOrder(bizId: string, order: Partial<Order>, employeeProfile?: any): Promise<string> {
        const docRef = await addDoc(this.getOrdersRef(bizId), {
            ...order,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false
        });

        await auditService.writeLog(bizId, {
            action: 'order.create',
            module: 'orders',
            targetType: 'order',
            targetId: docRef.id,
            targetLabel: `#${order.orderNumber || 'Шинэ'}`,
            severity: 'normal'
        }, employeeProfile);

        eventBus.emit(EVENTS.ORDER_CREATED, { bizId, orderId: docRef.id, order });

        return docRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateOrderStatus(bizId: string, orderId: string, status: string, historyItem: any, employeeProfile?: any): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);

        const orderSnap = await getDoc(docRef);
        let updatedHistory = [historyItem];
        if (orderSnap.exists()) {
            const data = orderSnap.data();
            if (Array.isArray(data.statusHistory)) {
                updatedHistory = [...data.statusHistory, historyItem];
            } else if (data.statusHistory) {
                updatedHistory = [data.statusHistory, historyItem];
            }
        }

        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
            statusHistory: updatedHistory
        });

        await auditService.writeLog(bizId, {
            action: 'order.status_change',
            module: 'orders',
            targetType: 'order',
            targetId: orderId,
            targetLabel: `#${orderId}`,
            severity: 'normal',
            changes: [{ field: 'status', oldValue: '?', newValue: status }]
        }, employeeProfile);

        eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, { bizId, orderId, status });
    },

    async updateOrderRaw(bizId: string, orderId: string, updates: Partial<Order>): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    async addTimelineEvent(bizId: string, orderId: string, event: { statusId: string, note: string, createdBy: string }): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);
        const orderSnap = await getDoc(docRef);

        let updatedHistory = [{ ...event, at: new Date() }];

        if (orderSnap.exists()) {
            const data = orderSnap.data();
            if (Array.isArray(data.statusHistory)) {
                updatedHistory = [...data.statusHistory, ...updatedHistory];
            } else if (data.statusHistory) {
                updatedHistory = [data.statusHistory, ...updatedHistory];
            }
        }

        await updateDoc(docRef, {
            statusHistory: updatedHistory,
            updatedAt: serverTimestamp()
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async deleteOrder(bizId: string, orderId: string, reason: string, employeeProfile?: any): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);
        await updateDoc(docRef, {
            isDeleted: true,
            cancelReason: reason,
            updatedAt: serverTimestamp()
        });

        await auditService.writeLog(bizId, {
            action: 'order.delete',
            module: 'orders',
            targetType: 'order',
            targetId: orderId,
            targetLabel: `#${orderId}`,
            severity: 'warning',
            changes: [{ field: 'isDeleted', oldValue: false, newValue: true }],
            metadata: { reason }
        }, employeeProfile);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async batchUpdateOrdersStatus(bizId: string, orderIds: string[], status: string, historyItem: any, employeeProfile?: any): Promise<void> {
        if (!orderIds.length) return;
        const batch = writeBatch(db);

        const promises = orderIds.map(id => getDoc(doc(db, 'businesses', bizId, 'orders', id)));
        const snaps = await Promise.all(promises);

        snaps.forEach(snap => {
            if (snap.exists()) {
                const data = snap.data();
                let updatedHistory = [historyItem];
                if (Array.isArray(data.statusHistory)) {
                    updatedHistory = [...data.statusHistory, historyItem];
                } else if (data.statusHistory) {
                    updatedHistory = [data.statusHistory, historyItem];
                }

                batch.update(snap.ref, {
                    status,
                    updatedAt: serverTimestamp(),
                    statusHistory: updatedHistory
                });
            }
        });

        await batch.commit();

        await auditService.writeLog(bizId, {
            action: 'orders.batch_status_change',
            module: 'orders',
            targetType: 'orders',
            targetId: orderIds.join(','),
            targetLabel: `${orderIds.length} захиалгуудын төлөв: ${status}`,
            severity: 'normal'
        }, employeeProfile);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async batchDeleteOrders(bizId: string, orderIds: string[], reason: string, employeeProfile?: any): Promise<void> {
        if (!orderIds.length) return;
        const batch = writeBatch(db);

        orderIds.forEach(id => {
            batch.update(doc(db, 'businesses', bizId, 'orders', id), {
                isDeleted: true,
                updatedAt: serverTimestamp()
            });
        });

        await batch.commit();

        await auditService.writeLog(bizId, {
            action: 'orders.batch_delete',
            module: 'orders',
            targetType: 'orders',
            targetId: orderIds.join(','),
            targetLabel: `${orderIds.length} захиалгуудыг устгасан`,
            severity: 'warning',
            metadata: { reason }
        }, employeeProfile);
    }
};
