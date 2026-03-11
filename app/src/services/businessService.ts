import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy,
    serverTimestamp, writeBatch, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Business, Employee, AppModulePricingPlan } from '../types';
import { convertTimestamps } from './helpers';
import { getFeatures } from '../config/features';

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

    async migrateLegacyBusinesses(): Promise<{ migratedCount: number }> {
        const q = query(collection(db, 'businesses'));
        const snap = await getDocs(q);

        let migratedCount = 0;
        const batch = writeBatch(db);

        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            if (data.activeModules && Array.isArray(data.activeModules)) {
                continue;
            }

            const category = data.category;
            const features = getFeatures(category);

            const modules = new Set(['dashboard', 'reports', 'chat']);

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

            if (data.serviceProfile?.isProvider) {
                modules.add('b2b-provider');
            }

            batch.update(docSnap.ref, {
                activeModules: Array.from(modules)
            });
            migratedCount++;
        }

        if (migratedCount > 0) {
            await batch.commit();
        }

        return { migratedCount };
    },

    async migrateToSubcollections(): Promise<{ migratedCount: number }> {
        const q = query(collection(db, 'businesses'));
        const snap = await getDocs(q);
        let migratedCount = 0;

        for (const docSnap of snap.docs) {
            const bizId = docSnap.id;
            const data = docSnap.data();
            const settings = data.settings || {};

            if (settings.storefront) {
                const storefrontRef = doc(db, 'businesses', bizId, 'module_settings', 'storefront');
                await setDoc(storefrontRef, {
                    ...settings.storefront,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                migratedCount++;
            }

            if (settings.notifications) {
                const notifyRef = doc(db, 'businesses', bizId, 'module_settings', 'notifications');
                await setDoc(notifyRef, {
                    ...settings.notifications,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
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
        const q = query(collection(db, 'businesses'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const d = querySnapshot.docs[0];
        return convertTimestamps({ id: d.id, ...d.data() }) as Business;
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

        const defaultsConfig = await systemSettingsService.getModuleDefaults();

        let defaultModules = ['orders', 'products', 'customers', 'inventory'];

        if (business.category && defaultsConfig[business.category]) {
            // Use SuperAdmin-configured defaults: include both 'core' and 'addon' modules
            const configuredModules = Object.keys(defaultsConfig[business.category]);
            defaultModules = Array.from(new Set([...defaultModules, ...configuredModules]));
        } else if (business.category) {
            // No SuperAdmin defaults configured for this category — warn but continue with base modules
            console.warn(`[createBusiness] No module defaults configured for category: "${business.category}". Using base modules only. Configure defaults in SuperAdmin → Модуль Тохиргоо.`);
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
            where('status', '==', 'active')
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

    async getAllEmployees(bizId: string): Promise<Employee[]> {
        const q = query(collection(db, 'businesses', bizId, 'employees'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => convertTimestamps({ id: doc.id, ...doc.data() }) as Employee)
            .filter(e => !e.isDeleted);
    },

    async updateBusiness(bizId: string, data: Partial<Business>) {
        await updateDoc(doc(db, 'businesses', bizId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async getLinkedEmployees(bizId: string, employeeIds: string[]): Promise<Employee[]> {
        if (!employeeIds.length) return [];
        const results: Employee[] = [];
        for (const empId of employeeIds) {
            const docRef = doc(db, 'businesses', bizId, 'employees', empId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const emp = convertTimestamps({ id: docSnap.id, ...docSnap.data() }) as Employee;
                if (emp.status === 'active' && !emp.isDeleted) {
                    results.push(emp);
                }
            }
        }
        return results;
    }
};

// ============ MODULE SETTINGS SERVICES ============

export const moduleSettingsService = {
    getSettingsRef(bizId: string, moduleId: string) {
        return doc(db, 'businesses', bizId, 'module_settings', moduleId);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getSettings(bizId: string, moduleId: string): Promise<any | null> {
        const docRef = this.getSettingsRef(bizId, moduleId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? convertTimestamps(docSnap.data()) : null;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateSettings(bizId: string, moduleId: string, settings: any): Promise<void> {
        const docRef = this.getSettingsRef(bizId, moduleId);
        await setDoc(docRef, {
            ...settings,
            updatedAt: serverTimestamp()
        }, { merge: true });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const { addDoc } = await import('firebase/firestore');
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

    async getPendingRequest(businessId: string) {
        const q = query(
            collection(db, 'business_requests'),
            where('businessId', '==', businessId),
            where('type', '==', 'storefront_change'),
            where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const docSnap = snap.docs[0];
        return convertTimestamps({ id: docSnap.id, ...docSnap.data() });
    },

    async getPendingRequests() {
        const q = query(
            collection(db, 'business_requests'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
    },

    async approveRequest(requestId: string, businessId: string, requestedData: { name?: string; slug?: string }): Promise<void> {
        const batch = writeBatch(db);

        const reqRef = doc(db, 'business_requests', requestId);
        batch.update(reqRef, {
            status: 'approved',
            resolvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        const bizRef = doc(db, 'businesses', businessId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const businessUpdate: any = {
            lastStorefrontChangeAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (requestedData.slug) {
            businessUpdate.slug = requestedData.slug;
        }

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
