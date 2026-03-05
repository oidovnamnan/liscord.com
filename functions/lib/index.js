"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onQrLoginUpdate = exports.onCustomerCreate = exports.onOrderUpdate = exports.onOrderCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
/**
 * Trigger: On Order Create
 * 1. Increment order counter for the business
 * 2. Update business stats (totalOrders, totalRevenue)
 * 3. EXCLUSIVE: ADJUST STOCK for each item
 */
exports.onOrderCreate = (0, firestore_1.onDocumentCreated)("businesses/{bizId}/orders/{orderId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const bizId = event.params.bizId;
    const orderData = snap.data();
    const isActive = !orderData.isDeleted && orderData.status !== 'cancelled';
    return db.runTransaction(async (transaction) => {
        var _a, _b, _c, _d;
        // 1. Business & Customer Stats Reference (Only increment if ACTIVE)
        if (isActive) {
            const bizRef = db.doc(`businesses/${bizId}`);
            transaction.update(bizRef, {
                "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                "stats.totalRevenue": admin.firestore.FieldValue.increment(((_a = orderData.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0),
                "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });
            // 2. Customer Stats Reference
            if ((_b = orderData.customer) === null || _b === void 0 ? void 0 : _b.id) {
                const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
                transaction.update(customerRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                    "stats.totalSpent": admin.firestore.FieldValue.increment(((_c = orderData.financials) === null || _c === void 0 ? void 0 : _c.totalAmount) || 0),
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
                        if ((productData === null || productData === void 0 ? void 0 : productData.productType) !== 'preorder' && ((_d = productData === null || productData === void 0 ? void 0 : productData.stock) === null || _d === void 0 ? void 0 : _d.trackInventory) !== false) {
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
exports.onOrderUpdate = (0, firestore_1.onDocumentUpdated)("businesses/{bizId}/orders/{orderId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    const bizId = event.params.bizId;
    const wasActive = !before.isDeleted && before.status !== 'cancelled';
    const isActiveNow = !after.isDeleted && after.status !== 'cancelled';
    // 1. If it was active and now is NOT active (deleted or cancelled) -> Restore Stock
    if (wasActive && !isActiveNow) {
        return db.runTransaction(async (transaction) => {
            var _a;
            // Adjust Business Stats
            const bizRef = db.doc(`businesses/${bizId}`);
            transaction.update(bizRef, {
                "stats.totalOrders": admin.firestore.FieldValue.increment(-1),
                "stats.totalRevenue": admin.firestore.FieldValue.increment(-(((_a = after.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0)),
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
            var _a;
            // Adjust Business Stats
            const bizRef = db.doc(`businesses/${bizId}`);
            transaction.update(bizRef, {
                "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                "stats.totalRevenue": admin.firestore.FieldValue.increment(((_a = after.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0),
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
exports.onCustomerCreate = (0, firestore_1.onDocumentCreated)("businesses/{bizId}/customers/{custId}", async (event) => {
    const bizId = event.params.bizId;
    const bizRef = db.doc(`businesses/${bizId}`);
    return bizRef.update({
        "stats.totalCustomers": admin.firestore.FieldValue.increment(1),
    });
});
/**
 * QR Code Login Trigger
 * 1. Mobile app updates status to 'authorizing' and provides its UID
 * 2. Cloud Function generates a custom token for that UID
 * 3. Frontend on the laptop uses this custom token to sign in
 */
exports.onQrLoginUpdate = (0, firestore_1.onDocumentUpdated)("qr_logins/{sessionId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    // Only act if status changed to 'authorizing'
    if (before.status !== 'authorizing' && after.status === 'authorizing' && after.uid) {
        try {
            // Generate Firebase Custom Token
            const customToken = await admin.auth().createCustomToken(after.uid);
            // Update doc with token and status
            return change.after.ref.update({
                status: 'authenticated',
                customToken: customToken,
                authenticatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        catch (error) {
            console.error("Error generating custom token:", error);
            return change.after.ref.update({
                status: 'error',
                error: "Token generation failed"
            });
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map