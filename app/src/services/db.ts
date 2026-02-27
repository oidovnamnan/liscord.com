import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    addDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch,
    increment
} from 'firebase/firestore';
import { db } from './firebase';
import { eventBus, EVENTS } from './eventBus';
import { auditService } from './audit';
import type {
    Business, User, Employee, Order, Customer, Product, Position, Category, CargoType, OrderSource, SocialAccount, OrderStatusConfig, BusinessStats,
    PayrollEntry, BusinessCategoryConfig, PlatformPayment, BusinessRequest, AppModulePricingPlan
} from '../types';
import { getFeatures } from '../config/features';

// ============ GENERIC HELPERS ============

/**
 * Converts Firestore timestamps in an object to Dates
 */
export function convertTimestamps(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map(item => convertTimestamps(item));

    const result = { ...data };
    for (const key in result) {
        result[key] = convertTimestamps(result[key]);
    }
    return result;
}

// ============ USER SERVICES ============

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

// ============ SYSTEM SETTINGS ============

export const systemSettingsService = {
    async getModuleDefaults(): Promise<Record<string, Record<string, 'core' | 'addon'>>> {
        const docRef = doc(db, 'system_settings', 'modules');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Record<string, Record<string, 'core' | 'addon'>>;
        }
        return {};
    },

    async updateModuleDefaults(defaults: Record<string, Record<string, 'core' | 'addon'>>): Promise<void> {
        await setDoc(doc(db, 'system_settings', 'modules'), defaults);
    },

    async getAppStoreConfig(): Promise<Record<string, { isFree: boolean; plans: AppModulePricingPlan[] }>> {
        const docRef = doc(db, 'system_settings', 'app_store');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const config: Record<string, { isFree: boolean; plans: AppModulePricingPlan[] }> = {};

            Object.keys(data).forEach(key => {
                const item = data[key];
                if (item.plans) {
                    config[key] = item;
                } else {
                    // Migration fallback: Convert old structure to plans
                    config[key] = {
                        isFree: item.isFree ?? false,
                        plans: [
                            { id: 'monthly', name: '30 хоног', price: item.price || 0, durationDays: item.durationDays || 30 },
                            { id: 'yearly', name: '1 жил', price: (item.price || 0) * 10, durationDays: 365 }
                        ]
                    };
                }
            });
            return config;
        }
        return {};
    },

    async updateAppStoreConfig(config: Record<string, { isFree: boolean; plans: AppModulePricingPlan[] }>): Promise<void> {
        await setDoc(doc(db, 'system_settings', 'app_store'), config);
    },

    /**
     * One-time migration script. Looks for businesses without `activeModules` and populates
     * the array based on their old hardcoded `category` feature flags.
     */
    async migrateLegacyBusinesses(): Promise<{ migratedCount: number }> {
        const q = query(collection(db, 'businesses'));
        const snap = await getDocs(q);

        let migratedCount = 0;
        const batch = writeBatch(db);

        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            // Skip already migrated businesses
            if (data.activeModules && Array.isArray(data.activeModules)) {
                continue;
            }

            const category = data.category;
            const features = getFeatures(category);

            // Core apps that everyone had on the old system
            const modules = new Set(['dashboard', 'reports', 'chat']);

            // Map old boolean flags to new installable App Store modules
            if (features.hasOrders) {
                modules.add('orders');
                modules.add('finance');
                modules.add('payments');
            }
            if (features.hasProducts) modules.add('products');
            if (features.hasInventory) modules.add('inventory');
            if (features.hasDelivery) modules.add('delivery');
            if (features.hasPackages) modules.add('cargo');
            if (features.hasAppointments) modules.add('appointments');
            if (features.hasContracts) modules.add('contracts');
            if (features.hasVehicles) modules.add('vehicles');
            if (features.hasRooms) modules.add('rooms');
            if (features.hasTickets) modules.add('tickets');
            if (features.hasProjects) modules.add('projects');

            // B2B provider logic mapping
            if (data.serviceProfile?.isProvider) {
                modules.add('b2b-provider');
            }

            batch.update(docSnap.ref, {
                activeModules: Array.from(modules)
            });
            migratedCount++;

            // Firestore batch limit is 500 operations, this ensures safety if there are >500 businesses.
            // Since this is a simple local command, we'll just run it in memory for now.
            // For thousands, we'd need chunked batches. Assuming under 500 for beta phase.
        }

        if (migratedCount > 0) {
            await batch.commit();
        }

        return { migratedCount };
    },

    /**
     * Migration for V5: Moves settings from business document to module_settings subcollection
     */
    async migrateToSubcollections(): Promise<{ migratedCount: number }> {
        const q = query(collection(db, 'businesses'));
        const snap = await getDocs(q);
        let migratedCount = 0;

        for (const docSnap of snap.docs) {
            const bizId = docSnap.id;
            const data = docSnap.data();
            const settings = data.settings || {};

            // 1. Migrate Storefront settings
            if (settings.storefront) {
                const storefrontRef = doc(db, 'businesses', bizId, 'module_settings', 'storefront');
                await setDoc(storefrontRef, {
                    ...settings.storefront,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                migratedCount++;
            }

            // 2. Migrate Notifications (if they were there)
            if (settings.notifications) {
                const notifyRef = doc(db, 'businesses', bizId, 'module_settings', 'notifications');
                await setDoc(notifyRef, {
                    ...settings.notifications,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }

            // Clean up the business document (optional - for now we just mark as migrated)
            // await updateDoc(docSnap.ref, { 'settings.migratedToV5': true });
        }

        return { migratedCount };
    }
};

// ============ BUSINESS SERVICES ============

export const businessService = {
    async getBusiness(bizId: string): Promise<Business | null> {
        const docRef = doc(db, 'businesses', bizId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? convertTimestamps(docSnap.data()) as Business : null;
    },

    async getSystemBusinesses(): Promise<Business[]> {
        const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }) as Business);
    },

    async getBusinessBySlug(slug: string): Promise<Business | null> {
        const q = query(collection(db, 'businesses'), where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const doc = querySnapshot.docs[0];
        return convertTimestamps({ id: doc.id, ...doc.data() }) as Business;
    },

    async toggleBusinessStatus(bizId: string, isDisabled: boolean): Promise<void> {
        await updateDoc(doc(db, 'businesses', bizId), {
            isDisabled,
            updatedAt: serverTimestamp()
        });
    },

    async bulkToggleBusinesses(ids: string[], isDisabled: boolean): Promise<void> {
        const batch = writeBatch(db);
        ids.forEach(id => {
            batch.update(doc(db, 'businesses', id), {
                isDisabled,
                updatedAt: serverTimestamp()
            });
        });
        await batch.commit();
    },

    async createBusiness(business: Partial<Business>, ownerUid: string): Promise<string> {
        const bizRef = doc(collection(db, 'businesses'));
        const bizId = bizRef.id;

        // Fetch dynamic defaults from Super Admin config
        const defaultsConfig = await systemSettingsService.getModuleDefaults();

        // Auto-enable basic sensible defaults
        let defaultModules = ['orders', 'products', 'customers', 'inventory'];

        if (business.category && defaultsConfig[business.category]) {
            // New structure: defaultsConfig[cat] is { moduleId: 'core' | 'addon' }
            const configuredModules = Object.keys(defaultsConfig[business.category]);
            defaultModules = Array.from(new Set([...defaultModules, ...configuredModules]));
        } else {
            // Hardcoded fallbacks if DB is empty for this category
            if (business.category === 'cargo') defaultModules.push('packages', 'delivery');
            if (business.category === 'hotel') defaultModules.push('rooms');
            if (business.category === 'car_rental') defaultModules.push('vehicles');
            if (business.category === 'beauty_salon' || business.category === 'car_wash') defaultModules.push('queue', 'appointments');
        }

        const fullBusiness = {
            ...business,
            id: bizId,
            ownerId: ownerUid,
            activeModules: business.activeModules || defaultModules,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(bizRef, fullBusiness);
        return bizId;
    },


    async getEmployeeProfile(bizId: string, uid: string): Promise<Employee | null> {
        const q = query(
            collection(db, 'businesses', bizId, 'employees'),
            where('userId', '==', uid),
            where('status', '==', 'active'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return convertTimestamps({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }) as Employee;
    },

    async getEmployees(bizId: string): Promise<Employee[]> {
        const q = query(
            collection(db, 'businesses', bizId, 'employees'),
            where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() })) as Employee[];
    },

    async updateBusiness(bizId: string, data: Partial<Business>) {
        await updateDoc(doc(db, 'businesses', bizId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ MODULE SETTINGS SERVICES ============

export const moduleSettingsService = {
    getSettingsRef(bizId: string, moduleId: string) {
        return doc(db, 'businesses', bizId, 'module_settings', moduleId);
    },

    async getSettings(bizId: string, moduleId: string): Promise<any | null> {
        const docRef = this.getSettingsRef(bizId, moduleId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? convertTimestamps(docSnap.data()) : null;
    },

    async updateSettings(bizId: string, moduleId: string, settings: any): Promise<void> {
        const docRef = this.getSettingsRef(bizId, moduleId);
        await setDoc(docRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    subscribeSettings(bizId: string, moduleId: string, callback: (settings: any) => void) {
        const docRef = this.getSettingsRef(bizId, moduleId);
        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(convertTimestamps(snapshot.data()));
            } else {
                callback(null);
            }
        });
    }
};

// ============ BUSINESS REQUEST SERVICES ============

export const businessRequestService = {
    async requestStorefrontChange(
        businessId: string,
        businessName: string,
        requestedData: { name?: string; slug?: string },
        reason: string
    ): Promise<string> {
        const reqRef = collection(db, 'business_requests');
        const docRef = await addDoc(reqRef, {
            businessId,
            businessName,
            type: 'storefront_change',
            requestedData,
            reason,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async getPendingRequest(businessId: string): Promise<BusinessRequest | null> {
        const q = query(
            collection(db, 'business_requests'),
            where('businessId', '==', businessId),
            where('type', '==', 'storefront_change'),
            where('status', '==', 'pending'),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const docSnap = snap.docs[0];
        return convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as BusinessRequest;
    },

    async getPendingRequests(): Promise<BusinessRequest[]> {
        const q = query(
            collection(db, 'business_requests'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }) as BusinessRequest);
    },

    async approveRequest(requestId: string, businessId: string, requestedData: { name?: string; slug?: string }): Promise<void> {
        const batch = writeBatch(db);

        // Update the request document
        const reqRef = doc(db, 'business_requests', requestId);
        batch.update(reqRef, {
            status: 'approved',
            resolvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Update the business document
        const bizRef = doc(db, 'businesses', businessId);
        const businessUpdate: any = {
            lastStorefrontChangeAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (requestedData.slug) {
            businessUpdate.slug = requestedData.slug;
        }

        // Settings name update requires reading the document first to preserve other settings usually,
        // but since settings is a nested map, we can use dot notation in firestore
        if (requestedData.name !== undefined) {
            businessUpdate['settings.storefront.name'] = requestedData.name;
        }

        batch.update(bizRef, businessUpdate);

        await batch.commit();
    },

    async rejectRequest(requestId: string): Promise<void> {
        await updateDoc(doc(db, 'business_requests', requestId), {
            status: 'rejected',
            resolvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
};

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

            // Merge with defaults: system defaults always exist, but DB overrides them (if they have same ID)
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
        await deleteDoc(doc(this.getStatusesRef(bizId), statusId));
    }
};

// ============ ORDER SERVICES ============

export const orderService = {
    getOrdersRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'orders');
    },

    subscribeOrders(bizId: string, callback: (orders: Order[]) => void) {
        const q = query(
            this.getOrdersRef(bizId),
            limit(100)
        );
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Order));
            // Sort by createdAt desc in-memory
            orders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            callback(orders);
        });
    },

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

    async updateOrderStatus(bizId: string, orderId: string, status: string, historyItem: any, employeeProfile?: any): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);

        const orderSnap = await getDoc(docRef);
        let updatedHistory = [historyItem];
        if (orderSnap.exists()) {
            const data = orderSnap.data();
            if (Array.isArray(data.statusHistory)) {
                updatedHistory = [...data.statusHistory, historyItem];
            } else if (data.statusHistory) {
                // Convert previous singular object to array format
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

    async batchUpdateOrdersStatus(bizId: string, orderIds: string[], status: string, historyItem: any, employeeProfile?: any): Promise<void> {
        if (!orderIds.length) return;
        const batch = writeBatch(db);

        // We fetch current order docs to append timeline
        // Note: Firestore batched reads (in this simple way) requires fetching them first
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

// ============ CUSTOMER SERVICES ============

export const customerService = {
    getCustomersRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'customers');
    },

    async getCustomers(bizId: string): Promise<Customer[]> {
        const q = query(this.getCustomersRef(bizId), where('isDeleted', '==', false), orderBy('name'));
        const snap = await getDocs(q);
        return snap.docs.map(d => convertTimestamps(d.data()) as Customer);
    },

    subscribeCustomers(bizId: string, callback: (customers: Customer[]) => void) {
        const q = query(
            this.getCustomersRef(bizId),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Customer));
            // Sort by name in-memory
            customers.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            callback(customers);
        });
    },

    async createCustomer(bizId: string, customer: Partial<Customer>, employeeProfile?: any): Promise<string> {
        const docRef = await addDoc(this.getCustomersRef(bizId), {
            ...customer,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false
        });

        await auditService.writeLog(bizId, {
            action: 'customer.create',
            module: 'customers',
            targetType: 'customer',
            targetId: docRef.id,
            targetLabel: customer.name || 'Шинэ харилцагч',
            severity: 'normal'
        }, employeeProfile);

        return docRef.id;
    },

    async updateCustomer(bizId: string, customerId: string, updates: Partial<Customer>): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'customers', customerId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ PRODUCT SERVICES ============

export const productService = {
    getProductsRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'products');
    },

    async getProducts(bizId: string): Promise<Product[]> {
        const q = query(this.getProductsRef(bizId), where('isDeleted', '==', false));
        const snap = await getDocs(q);
        return snap.docs.map(d => convertTimestamps(d.data()) as Product);
    },

    subscribeProducts(bizId: string, callback: (products: Product[]) => void) {
        const q = query(
            this.getProductsRef(bizId),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Product));
            // Sort by name in-memory
            products.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            callback(products);
        });
    },

    async createProduct(bizId: string, product: Partial<Product>, employeeProfile?: any): Promise<string> {
        const docRef = await addDoc(this.getProductsRef(bizId), {
            ...product,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isDeleted: false
        });

        await auditService.writeLog(bizId, {
            action: 'product.create',
            module: 'products',
            targetType: 'product',
            targetId: docRef.id,
            targetLabel: product.name || 'Шинэ бараа',
            severity: 'normal'
        }, employeeProfile);

        return docRef.id;
    },

    async updateProduct(bizId: string, productId: string, updates: Partial<Product>): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'products', productId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ CATEGORY SERVICES ============

export const categoryService = {
    getCategoriesRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'categories');
    },

    subscribeCategories(bizId: string, callback: (categories: Category[]) => void) {
        const q = query(this.getCategoriesRef(bizId), where('isDeleted', '==', false));
        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Category));
            // Sort by name
            categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            callback(categories);
        });
    },

    async createCategory(bizId: string, category: Partial<Category>): Promise<string> {
        const docRef = await addDoc(this.getCategoriesRef(bizId), {
            ...category,
            productCount: 0,
            isDeleted: false,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }
};

export const cargoService = {
    getCargoTypesRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'cargo_types');
    },

    subscribeCargoTypes(bizId: string, callback: (types: CargoType[]) => void) {
        const q = query(this.getCargoTypesRef(bizId), where('isDeleted', '==', false));
        return onSnapshot(q, (snapshot) => {
            const types = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as CargoType));
            types.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            callback(types);
        });
    },

    async createCargoType(bizId: string, data: Partial<CargoType>): Promise<string> {
        const docRef = await addDoc(this.getCargoTypesRef(bizId), {
            ...data,
            isDeleted: false,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateCargoType(bizId: string, id: string, data: Partial<CargoType>) {
        const docRef = doc(this.getCargoTypesRef(bizId), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ DASHBOARD SERVICES ============

export const dashboardService = {
    subscribeRecentOrders(bizId: string, callback: (orders: Order[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'orders'),
            where('isDeleted', '==', false),
            limit(10) // Get a bit more for safe in-memory sorting
        );
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Order));
            // Sort desc
            orders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            callback(orders.slice(0, 5));
        });
    },

    async getDashboardStats(bizId: string): Promise<BusinessStats | null> {
        const bizDoc = await getDoc(doc(db, 'businesses', bizId));
        if (!bizDoc.exists()) return null;

        const data = bizDoc.data() as Business;
        const stats: BusinessStats = {
            totalOrders: data.stats.totalOrders || 0,
            totalRevenue: data.stats.totalRevenue || 0,
            totalCustomers: data.stats.totalCustomers || 0,
            totalProducts: data.stats.totalProducts || 0,
            totalEmployees: data.stats.totalEmployees || 0,
        };

        // If cargo, fetch extra metrics
        if (data.category === 'cargo') {
            try {
                const packagesSnap = await getDocs(collection(db, 'businesses', bizId, 'packages'));
                const batches = packagesSnap.docs.map(d => d.data());

                stats.totalBatches = batches.length;
                stats.packagesInTransit = batches.filter(b => b.status === 'shipping' || b.status === 'processing').length;
                stats.packagesArrived = batches.filter(b => b.status === 'received' || b.status === 'arrived').length;

                // For total packages, we sum up the items array in each batch
                stats.totalPackages = batches.reduce((sum: number, b: any) => sum + (b.items?.length || 0), 0);
            } catch (error) {
                console.error('Error fetching cargo stats:', error);
            }
        }

        return stats;
    }
};

// ============ CHAT SERVICES ============

export const chatService = {
    getChannelsRef(bizId: string) {
        return collection(db, 'businesses', bizId, 'channels');
    },

    subscribeChannels(bizId: string, callback: (channels: any[]) => void) {
        const q = query(this.getChannelsRef(bizId), orderBy('name'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    },

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

    async sendMessage(bizId: string, channelId: string, message: { text: string; senderId: string; senderName: string; avatar: string }) {
        await addDoc(collection(db, 'businesses', bizId, 'channels', channelId, 'messages'), {
            ...message,
            createdAt: serverTimestamp()
        });

        // Update last message in channel
        await updateDoc(doc(db, 'businesses', bizId, 'channels', channelId), {
            lastMessage: `${message.senderName}: ${message.text}`,
            lastMessageAt: serverTimestamp()
        });
    }
};

// ============ TEAM SERVICES ============

export const teamService = {
    // POSITIONS
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

    // EMPLOYEES
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

// ============ SHELF & PACKAGE SERVICES ============

export const shelfService = {
    subscribeShelves(bizId: string, callback: (shelves: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'shelves'), orderBy('locationCode'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createShelf(bizId: string, data: { locationCode: string; level: 'top' | 'middle' | 'bottom'; isFull: boolean; createdBy: string }) {
        const newRef = doc(collection(db, 'businesses', bizId, 'shelves'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            createdAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateShelf(bizId: string, shelfId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'shelves', shelfId), data);
    },

    async deleteShelf(bizId: string, shelfId: string) {
        await deleteDoc(doc(db, 'businesses', bizId, 'shelves', shelfId));
    },

    // Quick lookup for inline creation
    async getShelfByCode(bizId: string, code: string) {
        const q = query(collection(db, 'businesses', bizId, 'shelves'), where('locationCode', '==', code.toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return convertTimestamps({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
};

export const packageService = {
    subscribeBatches(bizId: string, callback: (batches: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'packages'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createBatch(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'packages'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            status: 'processing',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },
};

// ============ APPOINTMENT SERVICES ============

export const serviceCatalogService = {
    subscribeServices(bizId: string, callback: (services: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'services'), where('isDeleted', '==', false));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createService(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'services'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            isActive: true,
            isDeleted: false,
            createdAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateService(bizId: string, serviceId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'services', serviceId), data);
    },

    async deleteService(bizId: string, serviceId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'services', serviceId), {
            isDeleted: true,
            isActive: false
        });
    }
};

export const appointmentService = {
    subscribeAppointments(bizId: string, startDate: Date, endDate: Date, callback: (appointments: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'appointments'),
            where('isDeleted', '==', false),
            where('startTime', '>=', startDate),
            where('startTime', '<=', endDate),
            orderBy('startTime', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createAppointment(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'appointments'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'scheduled',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateAppointment(bizId: string, appId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'appointments', appId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteAppointment(bizId: string, appId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'appointments', appId), {
            isDeleted: true,
            status: 'cancelled',
            updatedAt: serverTimestamp()
        });
    }
};

// ============ PROJECT SERVICES ============

export const projectService = {
    subscribeProjects(bizId: string, callback: (projects: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'projects'),
            where('isDeleted', '==', false),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createProject(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'projects'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'planning',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateProject(bizId: string, projectId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'projects', projectId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteProject(bizId: string, projectId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'projects', projectId), {
            isDeleted: true,
            status: 'cancelled',
            updatedAt: serverTimestamp()
        });
    }
};

export const taskService = {
    subscribeTasks(bizId: string, projectId: string, callback: (tasks: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'tasks'),
            where('projectId', '==', projectId),
            where('isDeleted', '==', false),
            orderBy('orderIndex', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createTask(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'tasks'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateTask(bizId: string, taskId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'tasks', taskId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async updateTaskOrder(bizId: string, tasks: { id: string, status: string, orderIndex: number }[]) {
        const batch = writeBatch(db);
        tasks.forEach(task => {
            const docRef = doc(db, 'businesses', bizId, 'tasks', task.id);
            batch.update(docRef, { status: task.status, orderIndex: task.orderIndex, updatedAt: serverTimestamp() });
        });
        await batch.commit();
    },

    async deleteTask(bizId: string, taskId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'tasks', taskId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ ROOMS & BOOKINGS SERVICES ============

export const roomService = {
    subscribeRooms(bizId: string, callback: (rooms: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'rooms'),
            where('isDeleted', '==', false),
            orderBy('name', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createRoom(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'rooms'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'available',
            isDeleted: false,
        });
        return newRef.id;
    },

    async updateRoom(bizId: string, roomId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'rooms', roomId), data);
    },

    async deleteRoom(bizId: string, roomId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'rooms', roomId), {
            isDeleted: true
        });
    }
};

export const bookingService = {
    subscribeBookings(bizId: string, startDate: Date, endDate: Date, callback: (bookings: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'bookings'),
            where('isDeleted', '==', false),
            where('checkInTime', '>=', startDate),
            where('checkInTime', '<=', endDate),
            orderBy('checkInTime', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createBooking(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'bookings'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'reserved',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Also update room status if checking in immediately
        if (data.status === 'checked_in') {
            await updateDoc(doc(db, 'businesses', bizId, 'rooms', data.roomId), { status: 'occupied' });
        }

        return newRef.id;
    },

    async updateBooking(bizId: string, bookingId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'bookings', bookingId), {
            ...data,
            updatedAt: serverTimestamp()
        });

        if (data.status === 'checked_out' || data.status === 'cancelled') {
            const bookingRef = await getDoc(doc(db, 'businesses', bizId, 'bookings', bookingId));
            if (bookingRef.exists()) {
                const room = bookingRef.data().roomId;
                await updateDoc(doc(db, 'businesses', bizId, 'rooms', room), { status: data.status === 'checked_out' ? 'cleaning' : 'available' });
            }
        }
    }
};

// ============ VEHICLES & TRIPS SERVICES ============

export const vehicleService = {
    subscribeVehicles(bizId: string, callback: (vehicles: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'vehicles'),
            where('isDeleted', '==', false),
            orderBy('make', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createVehicle(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'vehicles'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'available',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateVehicle(bizId: string, vehicleId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicleId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteVehicle(bizId: string, vehicleId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicleId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

export const tripService = {
    subscribeTrips(bizId: string, startDate: Date, endDate: Date, callback: (trips: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'trips'),
            where('isDeleted', '==', false),
            where('startDate', '>=', startDate),
            where('startDate', '<=', endDate),
            orderBy('startDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createTrip(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'trips'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'reserved',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (data.status === 'active') {
            await updateDoc(doc(db, 'businesses', bizId, 'vehicles', data.vehicleId), { status: 'rented' });
        }

        return newRef.id;
    },

    async updateTrip(bizId: string, tripId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'trips', tripId), {
            ...data,
            updatedAt: serverTimestamp()
        });

        if (data.status === 'completed' || data.status === 'cancelled') {
            const tripRef = await getDoc(doc(db, 'businesses', bizId, 'trips', tripId));
            if (tripRef.exists()) {
                const vehicle = tripRef.data().vehicleId;
                await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicle), { status: 'available' });
            }
        }
    }
};

// ============ EVENTS & TICKETS SERVICES ============

export const eventService = {
    subscribeEvents(bizId: string, callback: (events: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'events'),
            where('isDeleted', '==', false),
            orderBy('startDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createEvent(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'events'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'draft',
            ticketsSold: 0,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateEvent(bizId: string, eventId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'events', eventId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteEvent(bizId: string, eventId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'events', eventId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

export const ticketService = {
    subscribeTickets(bizId: string, eventId: string, callback: (tickets: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'tickets'),
            where('eventId', '==', eventId),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createTicket(bizId: string, eventId: string, data: any) {
        const batch = writeBatch(db);

        const ticketRef = doc(collection(db, 'businesses', bizId, 'tickets'));
        batch.set(ticketRef, {
            ...data,
            id: ticketRef.id,
            businessId: bizId,
            eventId,
            status: 'paid', // default assumption for direct sale
            checkedInAt: null,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Increment event sold count
        batch.update(doc(db, 'businesses', bizId, 'events', eventId), {
            ticketsSold: increment(1)
        });

        await batch.commit();
        return ticketRef.id;
    },

    async checkInTicket(bizId: string, ticketId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'tickets', ticketId), {
            status: 'checked_in',
            checkedInAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
};

// ============ FINANCE & PAWNSHOP SERVICES ============

export const pawnItemService = {
    subscribePawnItems(bizId: string, callback: (items: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'pawnItems'),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

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

    async updatePawnItem(bizId: string, itemId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'pawnItems', itemId), data);
    }
};

export const loanService = {
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

    async createLoan(bizId: string, data: any) {
        const batch = writeBatch(db);

        // 1. Create the loan record
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

        // 2. If it's secured by a pawn item, update the item's status just in case
        if (data.pawnItemId) {
            batch.update(doc(db, 'businesses', bizId, 'pawnItems', data.pawnItemId), {
                status: 'vault'
            });
        }

        await batch.commit();
        return loanRef.id;
    },

    async updateLoan(bizId: string, loanId: string, data: any) {
        const updateData: any = {
            ...data,
            updatedAt: serverTimestamp()
        };
        await updateDoc(doc(db, 'businesses', bizId, 'loans', loanId), updateData);

        // Auto-release pawn item if loan is closed
        if (data.status === 'closed') {
            const loanRef = await getDoc(doc(db, 'businesses', bizId, 'loans', loanId));
            if (loanRef.exists() && loanRef.data().pawnItemId) {
                await updateDoc(doc(db, 'businesses', bizId, 'pawnItems', loanRef.data().pawnItemId), {
                    status: 'returned'
                });
            }
        }

        // Auto-move to "for_sale" if loan is foreclosed
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
    subscribeQueue(bizId: string, callback: (tickets: any[]) => void) {
        // Fetch only active queue items (not done/cancelled for today)
        // For a full app, you'd filter by today's date, but this is a broad active subscription
        const q = query(
            collection(db, 'businesses', bizId, 'serviceQueue'),
            where('isDeleted', '==', false),
            where('status', 'in', ['waiting', 'in_progress'])
            // Note: Cloud Firestore requires a composite index if combining 'in' with orderBy time
        );
        return onSnapshot(q, (snapshot) => {
            // Sort client-side if missing index
            const tickets = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
            tickets.sort((a, b) => (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime());
            callback(tickets);
        });
    },

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
        let updates: any = { updatedAt: serverTimestamp() };

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

    async updateTicket(bizId: string, ticketId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'serviceQueue', ticketId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ ATTENDANCE & HR SERVICES ============

export const attendanceService = {
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
        // Use YYYY-MM-DD format for today's local date
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

    subscribePayrollRules(bizId: string, callback: (rules: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'payrollRules'),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

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

export const businessCategoryService = {
    async getCategories(): Promise<BusinessCategoryConfig[]> {
        const q = query(collection(db, 'system_categories'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessCategoryConfig));
    },

    async createCategory(category: BusinessCategoryConfig): Promise<void> {
        await setDoc(doc(db, 'system_categories', category.id), category);
    },

    async updateCategory(id: string, updates: Partial<BusinessCategoryConfig>): Promise<void> {
        await updateDoc(doc(db, 'system_categories', id), updates);
    },

    async bulkUpdateCategories(ids: string[], updates: Partial<BusinessCategoryConfig>): Promise<void> {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'system_categories', id);
            batch.update(docRef, updates);
        });
        await batch.commit();
    },

    async deleteCategory(id: string): Promise<void> {
        await deleteDoc(doc(db, 'system_categories', id));
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

        // If expired, start from today
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
}

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
    banner: {
        isActive: false,
        message: '',
        type: 'info'
    },
    maintenanceMode: false,
    registrationEnabled: true
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
        const docRef = doc(db, 'system_settings', 'global');
        await setDoc(docRef, updates, { merge: true });
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
