"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onQrLoginUpdate = exports.onOrderCreate = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
/**
 * Trigger: On Order Create (v1 - Default Region)
 */
exports.onOrderCreate = functions
    .firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const bizId = context.params.bizId;
    if (!orderData)
        return null;
    const isActive = !orderData.isDeleted && orderData.status !== 'cancelled';
    return db.runTransaction(async (transaction) => {
        var _a, _b, _c, _d;
        if (isActive) {
            const bizRef = db.doc(`businesses/${bizId}`);
            transaction.update(bizRef, {
                "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                "stats.totalRevenue": admin.firestore.FieldValue.increment(((_a = orderData.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0),
                "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });
            if ((_b = orderData.customer) === null || _b === void 0 ? void 0 : _b.id) {
                const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
                transaction.update(customerRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                    "stats.totalSpent": admin.firestore.FieldValue.increment(((_c = orderData.financials) === null || _c === void 0 ? void 0 : _c.totalAmount) || 0),
                    "stats.lastOrderAt": admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
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
 * QR Code Login Trigger (v1 - Default Region)
 */
exports.onQrLoginUpdate = functions
    .firestore
    .document("qr_logins/{sessionId}")
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== 'authorizing' && after.status === 'authorizing') {
        const uid = after.uid;
        const sessionId = context.params.sessionId;
        if (!uid) {
            console.error("Missing UID in session:", sessionId);
            return change.after.ref.update({
                status: 'error',
                error: "Хэрэглэгчийн мэдээлэл олдсонгүй (UID missing)"
            });
        }
        try {
            console.log(`Generating custom token for UID: ${uid}`);
            const customToken = await admin.auth().createCustomToken(uid);
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