import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp, writeBatch, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { auditService } from './audit';
import type { Customer, Product, Category, CargoType } from '../types';
import { convertTimestamps, chunkedBatch } from './helpers';

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

    subscribeCustomers(bizId: string, callback: (customers: Customer[]) => void, limitCount: number = 200) {
        const q = query(
            this.getCustomersRef(bizId),
            where('isDeleted', '==', false),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Customer));
            // Sort in memory instead of Firestore complex index
            customers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            callback(customers);
        }, (error) => {
            console.error("Firestore subscribeCustomers error:", error);
            callback([]);
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Product));
    },

    subscribeProducts(bizId: string, callback: (products: Product[]) => void, limitCount: number = 200) {
        const q = query(
            this.getProductsRef(bizId),
            where('isDeleted', '==', false),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Product));
            // Sort in memory to avoid needing a composite index
            products.sort((a, b) => {
                const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return timeB - timeA;
            });
            callback(products);
        }, (error) => {
            console.error("Firestore subscribeProducts error:", error);
            callback([]); // Return empty list on error to stop loading state
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    },

    async bulkUpdateProducts(bizId: string, productIds: string[], updates: Partial<Product>): Promise<void> {
        await chunkedBatch(productIds, (batch, id) => {
            const docRef = doc(db, 'businesses', bizId, 'products', id);
            batch.update(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        });
    }
};

// ============ STOCK MOVEMENT SERVICES ============

export const stockMovementService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeMovements(bizId: string, callback: (movements: any[]) => void, limitCount: number = 50) {
        const q = query(
            collection(db, 'businesses', bizId, 'stock_movements'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createMovement(bizId: string, data: {
        productId: string;
        productName: string;
        type: 'in' | 'out' | 'adjustment';
        quantity: number;
        reason: string;
        createdBy: string;
        warehouseId?: string;
        shelfId?: string;
    }): Promise<void> {
        const productRef = doc(db, 'businesses', bizId, 'products', data.productId);

        await runTransaction(db, async (transaction) => {
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) throw new Error('Product not found');

            const productData = productSnap.data();
            const currentTotalStock = productData.stock?.quantity || 0;
            const currentBalances = productData.stockBalances || {};

            let newTotalStock = currentTotalStock;
            let newWarehouseBalance = 0;

            if (data.warehouseId) {
                const currentWHBalance = currentBalances[data.warehouseId] || 0;
                if (data.type === 'in') {
                    newWarehouseBalance = currentWHBalance + data.quantity;
                    newTotalStock = currentTotalStock + data.quantity;
                } else if (data.type === 'out') {
                    newWarehouseBalance = Math.max(0, currentWHBalance - data.quantity);
                    const actualShipment = currentWHBalance - newWarehouseBalance;
                    newTotalStock = Math.max(0, currentTotalStock - actualShipment);
                } else {
                    const diff = data.quantity - currentWHBalance;
                    newWarehouseBalance = data.quantity;
                    newTotalStock = currentTotalStock + diff;
                }
            } else {
                if (data.type === 'in') newTotalStock = currentTotalStock + data.quantity;
                else if (data.type === 'out') newTotalStock = Math.max(0, currentTotalStock - data.quantity);
                else newTotalStock = data.quantity;
            }

            // Record the stock movement
            const movRef = doc(collection(db, 'businesses', bizId, 'stock_movements'));
            transaction.set(movRef, {
                ...data,
                previousStock: currentTotalStock,
                newStock: newTotalStock,
                createdAt: serverTimestamp(),
            });

            // Update product stock atomically
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: any = {
                'stock.quantity': newTotalStock,
                updatedAt: serverTimestamp(),
            };

            if (data.warehouseId) {
                updates[`stockBalances.${data.warehouseId}`] = newWarehouseBalance;
            }

            transaction.update(productRef, updates);
        });
    },
};

// ============ PROCUREMENT SERVICES ============

export const procurementService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeOrders(bizId: string, callback: (orders: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'procurement_orders'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createOrder(bizId: string, data: any) {
        const docRef = await addDoc(collection(db, 'businesses', bizId, 'procurement_orders'), {
            ...data,
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateStatus(bizId: string, orderId: string, status: string) {
        const docRef = doc(db, 'businesses', bizId, 'procurement_orders', orderId);
        await updateDoc(docRef, {
            status,
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
            categories.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || (a.name || '').localeCompare(b.name || ''));
            callback(categories);
        });
    },

    async createCategory(bizId: string, category: Partial<Category>): Promise<string> {
        const docRef = await addDoc(this.getCategoriesRef(bizId), {
            ...category,
            categoryType: category.categoryType || 'normal',
            productCount: 0,
            isDeleted: false,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateCategory(bizId: string, id: string, data: Partial<Category>) {
        const docRef = doc(this.getCategoriesRef(bizId), id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteCategory(bizId: string, id: string) {
        const docRef = doc(this.getCategoriesRef(bizId), id);
        await updateDoc(docRef, {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
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
