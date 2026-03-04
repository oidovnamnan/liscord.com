import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Trigger: On Order Create
 * 1. Increment order counter for the business
 * 2. Update business stats (totalOrders, totalRevenue)
 * 3. EXCLUSIVE: ADJUST STOCK for each item
 */
export const onOrderCreate = onDocumentCreated(
    "businesses/{bizId}/orders/{orderId}",
    async (event: any) => {
        const snap = event.data;
        if (!snap) return;

        const bizId = event.params.bizId;
        const orderData = snap.data();

        const isActive = !orderData.isDeleted && orderData.status !== 'cancelled';

        return db.runTransaction(async (transaction) => {
            // 1. Business & Customer Stats Reference (Only increment if ACTIVE)
            if (isActive) {
                const bizRef = db.doc(`businesses/${bizId}`);
                transaction.update(bizRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                    "stats.totalRevenue": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
                    "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
                });

                // 2. Customer Stats Reference
                if (orderData.customer?.id) {
                    const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
                    transaction.update(customerRef, {
                        "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                        "stats.totalSpent": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
                        "stats.lastOrderAt": admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }

            // 3. STOCK ADJUSTMENT (CRITICAL - Only if ACTIVE)
            if (isActive && Array.isArray(orderData.items)) {
                for (const item of orderData.items) {
                    if (item.productId) {
                        const productRef = db.doc(`businesses/${bizId}/products/${item.productId}`);
                        const productSnap = await transaction.get(productRef);

                        if (productSnap.exists) {
                            const productData = productSnap.data();
                            // Only decrement if it's NOT a 'preorder' type (unless user wants to track that too)
                            // But usually we only track 'ready' products.
                            if (productData?.productType !== 'preorder' && productData?.stock?.trackInventory !== false) {
                                transaction.update(productRef, {
                                    "stock.quantity": admin.firestore.FieldValue.increment(-(item.quantity || 0)),
                                    "stats.totalSold": admin.firestore.FieldValue.increment(item.quantity || 0),
                                    "stats.totalRevenue": admin.firestore.FieldValue.increment(item.totalPrice || 0),
                                    "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
                                });

                                // Log stock movement
                                const movementRef = db.collection(`businesses/${bizId}/stock_movements`).doc();
                                transaction.set(movementRef, {
                                    productId: item.productId,
                                    productName: item.name,
                                    type: 'out',
                                    quantity: item.quantity,
                                    reason: `Захиалга #${orderData.orderNumber || event.params.orderId}`,
                                    createdBy: 'system.orders',
                                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                                });
                            }
                        }
                    }
                }
            }
        });
    });

/**
 * Trigger: On Order Update (Handle deletion, cancellation, and un-deletion)
 */
export const onOrderUpdate = onDocumentUpdated(
    "businesses/{bizId}/orders/{orderId}",
    async (event: any) => {
        const change = event.data;
        if (!change) return;

        const before = change.before.data();
        const after = change.after.data();
        const bizId = event.params.bizId;

        const wasActive = !before.isDeleted && before.status !== 'cancelled';
        const isActiveNow = !after.isDeleted && after.status !== 'cancelled';

        // 1. If it was active and now is NOT active (deleted or cancelled) -> Restore Stock
        if (wasActive && !isActiveNow) {
            return db.runTransaction(async (transaction) => {
                // Adjust Business Stats
                const bizRef = db.doc(`businesses/${bizId}`);
                transaction.update(bizRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(-1),
                    "stats.totalRevenue": admin.firestore.FieldValue.increment(-(after.financials?.totalAmount || 0)),
                });

                // Restore Stock for each product
                if (Array.isArray(after.items)) {
                    for (const item of after.items) {
                        if (item.productId) {
                            const productRef = db.doc(`businesses/${bizId}/products/${item.productId}`);
                            transaction.update(productRef, {
                                "stock.quantity": admin.firestore.FieldValue.increment(item.quantity || 0),
                                "stats.totalSold": admin.firestore.FieldValue.increment(-(item.quantity || 0)),
                                "stats.totalRevenue": admin.firestore.FieldValue.increment(-(item.totalPrice || 0)),
                            });

                            // Log restoration
                            const movRef = db.collection(`businesses/${bizId}/stock_movements`).doc();
                            transaction.set(movRef, {
                                productId: item.productId,
                                productName: item.name,
                                type: 'in',
                                quantity: item.quantity,
                                reason: after.isDeleted ? `Захиалга устгасан (#${after.orderNumber})` : `Захиалга цуцалсан (#${after.orderNumber})`,
                                createdBy: 'system.orders',
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }
            });
        }

        // 2. If it was NOT active and now IS active (un-deleted or un-cancelled) -> Decrement Stock again
        if (!wasActive && isActiveNow) {
            return db.runTransaction(async (transaction) => {
                // Adjust Business Stats
                const bizRef = db.doc(`businesses/${bizId}`);
                transaction.update(bizRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                    "stats.totalRevenue": admin.firestore.FieldValue.increment(after.financials?.totalAmount || 0),
                });

                // Re-decrement Stock
                if (Array.isArray(after.items)) {
                    for (const item of after.items) {
                        if (item.productId) {
                            const productRef = db.doc(`businesses/${bizId}/products/${item.productId}`);
                            transaction.update(productRef, {
                                "stock.quantity": admin.firestore.FieldValue.increment(-(item.quantity || 0)),
                                "stats.totalSold": admin.firestore.FieldValue.increment(item.quantity || 0),
                                "stats.totalRevenue": admin.firestore.FieldValue.increment(item.totalPrice || 0),
                            });

                            // Log re-deduction
                            const movRef = db.collection(`businesses/${bizId}/stock_movements`).doc();
                            transaction.set(movRef, {
                                productId: item.productId,
                                productName: item.name,
                                type: 'out',
                                quantity: item.quantity,
                                reason: `Захиалга сэргээсэн (#${after.orderNumber})`,
                                createdBy: 'system.orders',
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }
            });
        }

        return null;
    });

/**
 * Trigger: On Customer Create
 */
export const onCustomerCreate = onDocumentCreated(
    "businesses/{bizId}/customers/{custId}",
    async (event: any) => {
        const bizId = event.params.bizId;
        const bizRef = db.doc(`businesses/${bizId}`);
        return bizRef.update({
            "stats.totalCustomers": admin.firestore.FieldValue.increment(1),
        });
    });
