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
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { auditService } from './audit';
import type { Business, User, Employee, Order, Customer, Product, Position, Category, CargoType, OrderSource, SocialAccount } from '../types';

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

    async updateActiveBusiness(uid: string, businessId: string): Promise<void> {
        await updateDoc(doc(db, 'users', uid), { activeBusiness: businessId });
    }
};

// ============ BUSINESS SERVICES ============

export const businessService = {
    async getBusiness(bizId: string): Promise<Business | null> {
        const docRef = doc(db, 'businesses', bizId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? convertTimestamps(docSnap.data()) as Business : null;
    },

    async createBusiness(business: Partial<Business>, ownerUid: string): Promise<string> {
        const bizRef = doc(collection(db, 'businesses'));
        const bizId = bizRef.id;

        const fullBusiness = {
            ...business,
            id: bizId,
            ownerId: ownerUid,
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
        return convertTimestamps(querySnapshot.docs[0].data()) as Employee;
    },

    async updateBusiness(bizId: string, data: Partial<Business>) {
        await updateDoc(doc(db, 'businesses', bizId), {
            ...data,
            updatedAt: serverTimestamp()
        });
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
            where('isDeleted', '==', false),
            limit(50)
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

        return docRef.id;
    },

    async updateOrderStatus(bizId: string, orderId: string, status: string, historyItem: any, employeeProfile?: any): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
            statusHistory: historyItem
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
    },

    async deleteOrder(bizId: string, orderId: string): Promise<void> {
        const docRef = doc(db, 'businesses', bizId, 'orders', orderId);
        await updateDoc(docRef, {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
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

    async getDashboardStats(bizId: string) {
        const bizDoc = await getDoc(doc(db, 'businesses', bizId));
        if (!bizDoc.exists()) return null;

        const data = bizDoc.data() as Business;
        return {
            totalOrders: data.stats.totalOrders,
            totalRevenue: data.stats.totalRevenue,
            totalCustomers: data.stats.totalCustomers,
            totalProducts: data.stats.totalProducts,
        };
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
