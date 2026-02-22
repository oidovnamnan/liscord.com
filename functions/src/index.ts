import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Trigger: On Order Create
 * 1. Increment order counter for the business
 * 2. Update business stats (totalOrders, totalRevenue)
 */
export const onOrderCreate = functions.firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
        const bizId = context.params.bizId;
        const orderData = snap.data();
        const batch = db.batch();

        // 1. Business Stats Reference
        const bizRef = db.doc(`businesses/${bizId}`);
        batch.update(bizRef, {
            "stats.totalOrders": admin.firestore.FieldValue.increment(1),
            "stats.totalRevenue": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
            "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Customer Stats Reference
        if (orderData.customer?.id) {
            const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
            batch.update(customerRef, {
                "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                "stats.totalSpent": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
                "stats.lastOrderAt": admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        return batch.commit();
    });

/**
 * Trigger: On Order Delete (Soft Delete)
 */
export const onOrderDelete = functions.firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const bizId = context.params.bizId;

        // Check if isDeleted changed from false to true
        if (!before.isDeleted && after.isDeleted) {
            const bizRef = db.doc(`businesses/${bizId}`);
            return bizRef.update({
                "stats.totalOrders": admin.firestore.FieldValue.increment(-1),
                "stats.totalRevenue": admin.firestore.FieldValue.increment(-(after.financials?.totalAmount || 0)),
            });
        }
        return null;
    });

/**
 * Trigger: On Customer Create
 */
export const onCustomerCreate = functions.firestore
    .document("businesses/{bizId}/customers/{custId}")
    .onCreate(async (snap, context) => {
        const bizId = context.params.bizId;
        const bizRef = db.doc(`businesses/${bizId}`);
        return bizRef.update({
            "stats.totalCustomers": admin.firestore.FieldValue.increment(1),
        });
    });
