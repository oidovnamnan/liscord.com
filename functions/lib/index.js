"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSmsIncome = exports.scheduledCleanup = exports.lowStockAlert = exports.sendOrderNotification = exports.onQrLoginUpdate = exports.onOrderCreate = void 0;
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
        catch (err) {
            const error = err;
            console.error("Error generating custom token:", error);
            return change.after.ref.update({
                status: 'error',
                error: `Token generation failed: ${error.message}`
            });
        }
    }
    return null;
});
/**
 * Push Notification on New Order
 * Creates in-app notification + sends FCM push to owner AND employees with orders.* permission
 */
exports.sendOrderNotification = functions
    .firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e;
    const orderData = snap.data();
    const bizId = context.params.bizId;
    if (!orderData || orderData.isDeleted)
        return null;
    try {
        const bizSnap = await db.doc(`businesses/${bizId}`).get();
        const bizData = bizSnap.data();
        if (!bizData)
            return null;
        const customerName = ((_a = orderData.customer) === null || _a === void 0 ? void 0 : _a.name) || 'Зочин';
        const totalAmount = ((_b = orderData.financials) === null || _b === void 0 ? void 0 : _b.totalAmount) || 0;
        const orderNumber = orderData.orderNumber || snap.id.slice(0, 6);
        // 1. Create in-app notification document
        await db.collection(`businesses/${bizId}/notifications`).add({
            templateId: 'order.new',
            type: 'order',
            title: `Шинэ захиалга #${orderNumber}`,
            body: `${customerName} — ₮${totalAmount.toLocaleString()}`,
            icon: '📥',
            link: `/app/orders`,
            referenceId: snap.id,
            readBy: {},
            priority: 'high',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'system',
        });
        // 2. Collect FCM tokens from owner + employees with orders.* permission
        const tokensToSend = [];
        // Owner tokens
        const ownerId = bizData.ownerId;
        if (ownerId) {
            const ownerSnap = await db.doc(`users/${ownerId}`).get();
            const ownerTokens = ((_c = ownerSnap.data()) === null || _c === void 0 ? void 0 : _c.fcmTokens) || [];
            ownerTokens.forEach(t => tokensToSend.push({ token: t, userId: ownerId }));
        }
        // Employee tokens — find employees with orders.* permission via their Position
        try {
            const empsSnap = await db.collection(`businesses/${bizId}/employees`).get();
            for (const empDoc of empsSnap.docs) {
                const empData = empDoc.data();
                if (!empData.userId || empData.userId === ownerId)
                    continue;
                // Check position permissions
                if (empData.positionId) {
                    const posSnap = await db.doc(`businesses/${bizId}/positions/${empData.positionId}`).get();
                    const perms = ((_d = posSnap.data()) === null || _d === void 0 ? void 0 : _d.permissions) || [];
                    const hasOrderPerm = perms.some(p => p.startsWith('orders.'));
                    if (!hasOrderPerm)
                        continue;
                }
                else {
                    continue; // No position = no order permission
                }
                const userSnap = await db.doc(`users/${empData.userId}`).get();
                const userTokens = ((_e = userSnap.data()) === null || _e === void 0 ? void 0 : _e.fcmTokens) || [];
                userTokens.forEach(t => tokensToSend.push({ token: t, userId: empData.userId }));
            }
        }
        catch (empErr) {
            console.warn("Employee token fetch failed (non-critical):", empErr);
        }
        if (tokensToSend.length === 0)
            return null;
        // 3. Send FCM push
        const uniqueTokens = [...new Set(tokensToSend.map(t => t.token))];
        const message = {
            notification: {
                title: `🛒 Шинэ захиалга #${orderNumber}`,
                body: `${customerName} - ₮${totalAmount.toLocaleString()}`,
            },
            data: {
                type: 'new_order',
                orderId: snap.id,
                bizId: bizId,
                link: `/app/orders`,
            },
            tokens: uniqueTokens,
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        // Clean up invalid tokens
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
            var _a;
            if (!resp.success && ((_a = resp.error) === null || _a === void 0 ? void 0 : _a.code) === 'messaging/registration-token-not-registered') {
                const orig = tokensToSend.find(t => t.token === uniqueTokens[idx]);
                if (orig)
                    tokensToRemove.push(orig);
            }
        });
        for (const { token, userId } of tokensToRemove) {
            await db.doc(`users/${userId}`).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
            });
        }
        console.log(`📬 Order notification sent to ${uniqueTokens.length} devices`);
        return null;
    }
    catch (err) {
        console.error("Failed to send order notification:", err);
        return null;
    }
});
/**
 * Low Stock Alert
 * Creates in-app notification + sends FCM push to owner when stock drops below threshold
 */
exports.lowStockAlert = functions
    .firestore
    .document("businesses/{bizId}/products/{productId}")
    .onUpdate(async (change, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const after = change.after.data();
    const before = change.before.data();
    const bizId = context.params.bizId;
    if (!after || !((_a = after.stock) === null || _a === void 0 ? void 0 : _a.trackInventory))
        return null;
    const currentQty = (_c = (_b = after.stock) === null || _b === void 0 ? void 0 : _b.quantity) !== null && _c !== void 0 ? _c : 0;
    const previousQty = (_e = (_d = before === null || before === void 0 ? void 0 : before.stock) === null || _d === void 0 ? void 0 : _d.quantity) !== null && _e !== void 0 ? _e : 0;
    const lowStockThreshold = (_g = (_f = after.stock) === null || _f === void 0 ? void 0 : _f.lowStockThreshold) !== null && _g !== void 0 ? _g : 5;
    if (currentQty < lowStockThreshold && previousQty >= lowStockThreshold) {
        try {
            // 1. Create notification doc
            await db.collection(`businesses/${bizId}/notifications`).add({
                templateId: 'stock.low',
                type: 'low_stock',
                title: `⚠️ ${after.name} нөөц бага`,
                body: `Үлдэгдэл ${currentQty} ширхэг (босго: ${lowStockThreshold})`,
                icon: '⚠️',
                link: '/app/products',
                referenceId: context.params.productId,
                readBy: {},
                priority: 'high',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
            });
            // 2. Send FCM push to owner
            const bizSnap = await db.doc(`businesses/${bizId}`).get();
            const ownerId = (_h = bizSnap.data()) === null || _h === void 0 ? void 0 : _h.ownerId;
            if (ownerId) {
                const userSnap = await db.doc(`users/${ownerId}`).get();
                const tokens = ((_j = userSnap.data()) === null || _j === void 0 ? void 0 : _j.fcmTokens) || [];
                if (tokens.length > 0) {
                    await admin.messaging().sendEachForMulticast({
                        notification: {
                            title: `⚠️ ${after.name} нөөц бага`,
                            body: `Үлдэгдэл: ${currentQty} ширхэг`,
                        },
                        data: { type: 'low_stock', bizId, link: '/app/products' },
                        tokens,
                    });
                }
            }
        }
        catch (err) {
            console.error("Failed to create low stock notification:", err);
        }
    }
    return null;
});
/**
 * Scheduled Cleanup - Runs daily at 3:00 AM UTC
 * Archives old soft-deleted records (older than 30 days)
 */
exports.scheduledCleanup = functions
    .pubsub
    .schedule("every 24 hours")
    .timeZone("Asia/Ulaanbaatar")
    .onRun(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const collectionsToClean = ['orders', 'products', 'invoices', 'expenses'];
    let totalCleaned = 0;
    try {
        // Get all businesses
        const bizsSnap = await db.collection('businesses').get();
        for (const bizDoc of bizsSnap.docs) {
            for (const colName of collectionsToClean) {
                const deletedDocs = await db
                    .collection(`businesses/${bizDoc.id}/${colName}`)
                    .where('isDeleted', '==', true)
                    .where('deletedAt', '<=', thirtyDaysAgo)
                    .limit(100)
                    .get();
                if (deletedDocs.empty)
                    continue;
                const batch = db.batch();
                deletedDocs.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        isArchived: true,
                        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                });
                await batch.commit();
                totalCleaned += deletedDocs.size;
            }
        }
        console.log(`Scheduled cleanup completed. Archived ${totalCleaned} records.`);
    }
    catch (err) {
        console.error("Scheduled cleanup failed:", err);
    }
    return null;
});
/**
 * SMS Income Auto-Matching (REALTIME)
 * Triggers server-side when a new SMS arrives — no page needs to be open.
 *
 * Matching rules:
 * 1. Amount must match exactly (±1₮ tolerance)
 * 2. SMS утга/body must CONTAIN either:
 *    - The order's paymentRefCode (case-insensitive), OR
 *    - The customer's phone number
 * 3. Only matches unpaid orders
 */
exports.onSmsIncome = functions
    .firestore
    .document("sms_inbox/{smsId}")
    .onCreate(async (snap) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const smsData = snap.data();
    if (!smsData)
        return null;
    const pairingKey = smsData.pairingKey;
    const smsAmount = smsData.amount || 0;
    const smsBody = (smsData.body || '').toLowerCase();
    const smsNote = (smsData.utga || '').toLowerCase();
    if (smsAmount <= 0 || !pairingKey)
        return null;
    // Combine note + body for searching
    const searchText = `${smsNote} ${smsBody}`;
    try {
        // 1. Find business by pairingKey (smsBridgeKey)
        const bizQuery = await db.collection('businesses')
            .where('smsBridgeKey', '==', pairingKey)
            .limit(1)
            .get();
        if (bizQuery.empty) {
            console.log(`No business found for pairingKey: ${pairingKey}`);
            return null;
        }
        const bizDoc = bizQuery.docs[0];
        const bizId = bizDoc.id;
        // 2. Load all unpaid orders for this business
        const ordersSnap = await db.collection(`businesses/${bizId}/orders`)
            .where('paymentStatus', '==', 'unpaid')
            .get();
        if (ordersSnap.empty) {
            console.log(`No unpaid orders for business: ${bizId}`);
            return null;
        }
        // 3. Find matching order: amount + (refCode OR phone) in утга
        let matchedOrderDoc = null;
        for (const orderDoc of ordersSnap.docs) {
            const order = orderDoc.data();
            // Skip deleted/cancelled
            if (order.isDeleted || order.status === 'cancelled')
                continue;
            // Amount must match exactly (±1₮ tolerance)
            const orderTotal = ((_a = order.financials) === null || _a === void 0 ? void 0 : _a.totalAmount) || 0;
            if (Math.abs(smsAmount - orderTotal) > 1)
                continue;
            // Check if searchText contains refCode or phone
            const refCode = (order.paymentRefCode || '').toLowerCase();
            const phone = (((_b = order.customer) === null || _b === void 0 ? void 0 : _b.phone) || '');
            const hasRefCode = refCode && refCode.length >= 4 && searchText.includes(refCode);
            const hasPhone = phone && phone.length >= 8 && searchText.includes(phone);
            if (hasRefCode || hasPhone) {
                matchedOrderDoc = orderDoc;
                console.log(`Match found: refCode=${hasRefCode}, phone=${hasPhone}, order=${orderDoc.id}`);
                break;
            }
        }
        if (!matchedOrderDoc) {
            console.log(`No matching order: amount=${smsAmount}, note=${smsNote || smsBody.substring(0, 50)}`);
            // Create "new income" notification (unmatched)
            await db.collection(`businesses/${bizId}/notifications`).add({
                templateId: 'payment.received',
                type: 'sms_income',
                title: `💰 Шинэ орлого ₮${smsAmount.toLocaleString()}`,
                body: `${smsData.bank || smsData.sender || 'Банк'} — ${smsData.utga || 'Утга байхгүй'}`,
                icon: '💰',
                link: '/app/sms-income',
                referenceId: snap.id,
                readBy: {},
                priority: 'normal',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'system',
            });
            // FCM push to owner
            try {
                const ownerId = (_c = bizDoc.data()) === null || _c === void 0 ? void 0 : _c.ownerId;
                if (ownerId) {
                    const userSnap = await db.doc(`users/${ownerId}`).get();
                    const tokens = ((_d = userSnap.data()) === null || _d === void 0 ? void 0 : _d.fcmTokens) || [];
                    if (tokens.length > 0) {
                        await admin.messaging().sendEachForMulticast({
                            notification: {
                                title: `💰 Шинэ орлого ₮${smsAmount.toLocaleString()}`,
                                body: `${smsData.bank || 'Банк'} — Холбогдоогүй`,
                            },
                            data: { type: 'sms_income', bizId, link: '/app/sms-income' },
                            tokens,
                        });
                    }
                }
            }
            catch (pushErr) {
                console.warn('FCM push failed (non-critical):', pushErr);
            }
            return null;
        }
        // 4. Auto-match: Update order as paid
        const now = admin.firestore.FieldValue.serverTimestamp();
        const paymentEntry = {
            id: `sms_${snap.id}`,
            amount: smsAmount,
            method: 'bank',
            note: `Банкны шилжүүлэг (автомат) - ${smsData.bank || smsData.sender || 'Unknown'}`,
            paidAt: now,
            recordedBy: 'system_auto',
        };
        await matchedOrderDoc.ref.update({
            paymentStatus: 'paid',
            paymentVerifiedAt: now,
            paymentVerifiedBy: 'auto-match',
            paymentSmsId: snap.id,
            'financials.paidAmount': smsAmount,
            'financials.balanceDue': 0,
            'financials.payments': admin.firestore.FieldValue.arrayUnion(paymentEntry),
            updatedAt: now,
        });
        // 5. Update SMS doc as matched
        await snap.ref.update({
            status: 'matched',
            orderId: matchedOrderDoc.id,
            matchedAt: now,
            autoMatched: true,
        });
        // 6. Create notification for successful auto-match
        const matchedOrder = matchedOrderDoc.data();
        const orderNumber = matchedOrder.orderNumber || matchedOrderDoc.id.slice(0, 6);
        await db.collection(`businesses/${bizId}/notifications`).add({
            templateId: 'payment.received',
            type: 'sms_income',
            title: `✅ Төлбөр автомат холбогдлоо #${orderNumber}`,
            body: `₮${smsAmount.toLocaleString()} — ${((_e = matchedOrder.customer) === null || _e === void 0 ? void 0 : _e.name) || 'Зочин'} — ${smsData.bank || 'Банк'}`,
            icon: '✅',
            link: '/app/orders',
            referenceId: matchedOrderDoc.id,
            readBy: {},
            priority: 'high',
            createdAt: now,
            createdBy: 'system',
        });
        // FCM push for successful match
        try {
            const ownerId = (_f = bizDoc.data()) === null || _f === void 0 ? void 0 : _f.ownerId;
            if (ownerId) {
                const userSnap = await db.doc(`users/${ownerId}`).get();
                const tokens = ((_g = userSnap.data()) === null || _g === void 0 ? void 0 : _g.fcmTokens) || [];
                if (tokens.length > 0) {
                    await admin.messaging().sendEachForMulticast({
                        notification: {
                            title: `✅ Төлбөр автомат холбогдлоо #${orderNumber}`,
                            body: `₮${smsAmount.toLocaleString()} — ${((_h = matchedOrder.customer) === null || _h === void 0 ? void 0 : _h.name) || 'Зочин'}`,
                        },
                        data: { type: 'sms_income', bizId, link: '/app/orders' },
                        tokens,
                    });
                }
            }
        }
        catch (pushErr) {
            console.warn('FCM push failed (non-critical):', pushErr);
        }
        console.log(`✅ AUTO-MATCHED: SMS ${snap.id} → Order ${matchedOrderDoc.id} (₮${smsAmount})`);
        return null;
    }
    catch (err) {
        console.error("SMS auto-matching failed:", err);
        return null;
    }
});
//# sourceMappingURL=index.js.map