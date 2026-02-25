"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onCustomerCreate = exports.onOrderDelete = exports.onOrderCreate = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
/**
 * Trigger: On Order Create
 * 1. Increment order counter for the business
 * 2. Update business stats (totalOrders, totalRevenue)
 */
exports.onOrderCreate = (0, firestore_1.onDocumentCreated)("businesses/{bizId}/orders/{orderId}", async (event) => {
    var _a, _b, _c;
    const snap = event.data;
    if (!snap)
        return;
    const bizId = event.params.bizId;
    const orderData = snap.data();
    const batch = db.batch();
    // 1. Business Stats Reference
    const bizRef = db.doc(`businesses/${bizId}`);
    batch.update(bizRef, {
        "stats.totalOrders": admin.firestore.FieldValue.increment(1),
        "stats.totalRevenue": admin.firestore.FieldValue.increment(((_a = orderData.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0),
        "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });
    // 2. Customer Stats Reference
    if ((_b = orderData.customer) === null || _b === void 0 ? void 0 : _b.id) {
        const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
        batch.update(customerRef, {
            "stats.totalOrders": admin.firestore.FieldValue.increment(1),
            "stats.totalSpent": admin.firestore.FieldValue.increment(((_c = orderData.financials) === null || _c === void 0 ? void 0 : _c.totalAmount) || 0),
            "stats.lastOrderAt": admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    return batch.commit();
});
/**
 * Trigger: On Order Delete (Soft Delete)
 */
exports.onOrderDelete = (0, firestore_1.onDocumentUpdated)("businesses/{bizId}/orders/{orderId}", async (event) => {
    var _a;
    const change = event.data;
    if (!change)
        return;
    const before = change.before.data();
    const after = change.after.data();
    const bizId = event.params.bizId;
    // Check if isDeleted changed from false to true
    if (!before.isDeleted && after.isDeleted) {
        const bizRef = db.doc(`businesses/${bizId}`);
        return bizRef.update({
            "stats.totalOrders": admin.firestore.FieldValue.increment(-1),
            "stats.totalRevenue": admin.firestore.FieldValue.increment(-(((_a = after.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0)),
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
//# sourceMappingURL=index.js.map