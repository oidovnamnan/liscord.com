"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onQrLoginUpdate = exports.onOrderCreate = void 0;
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
                        const productData = productSnap.data() || {};
                        if ((_d = productData.stock) === null || _d === void 0 ? void 0 : _d.trackInventory) {
                            transaction.update(productRef, {
                                "stock.quantity": admin.firestore.FieldValue.increment(-(item.quantity || 0)),
                                "updatedAt": admin.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    }
                }
            }
        }
        return null;
    });
});
/**
 * QR Code Login Trigger
 *
 * 1. Mobile app updates status to 'scanned'
 * 2. Laptop updates status to 'authorizing'
 * 3. This Cloud Function generates a custom token for the laptop's UID
 * 4. Mobile app uses this token to sign in
 */
exports.onQrLoginUpdate = (0, firestore_1.onDocumentUpdated)("qr_logins/{sessionId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    // Only act if status changed to 'authorizing'
    // Note: we check for 'after.uid' which should be present from the initial setDoc
    if (before.status !== 'authorizing' && after.status === 'authorizing') {
        const uid = after.uid;
        if (!uid) {
            console.error("Missing UID in session:", event.params.sessionId);
            return change.after.ref.update({
                status: 'error',
                error: "Хэрэглэгчийн мэдээлэл олдсонгүй (UID missing)"
            });
        }
        try {
            // Generate Firebase Custom Token
            console.log(`Generating custom token for UID: ${uid}`);
            const customToken = await admin.auth().createCustomToken(uid);
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
                error: `Token generation failed: ${error.message}`
            });
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map