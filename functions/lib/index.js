"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSmsIncome = exports.cleanupUnpaidOrders = exports.scheduledCleanup = exports.lowStockAlert = exports.sendOrderNotification = exports.onQrLoginUpdate = exports.onOrderCreate = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// ═══════════════════════════════════════════
// Grant membership helper
// ═══════════════════════════════════════════
async function grantMembershipFromOrder(bizId, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
orderData, orderId) {
    var _a, _b;
    const categoryId = orderData.membershipCategoryId;
    const customerPhone = (((_a = orderData.customer) === null || _a === void 0 ? void 0 : _a.phone) || "").replace(/[^\d]/g, "");
    const durationDays = orderData.membershipDurationDays || 30;
    const amountPaid = ((_b = orderData.financials) === null || _b === void 0 ? void 0 : _b.totalAmount) || 0;
    if (!categoryId || !customerPhone) {
        console.error("Missing categoryId or phone for membership grant:", orderId);
        return;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await db.collection(`businesses/${bizId}/memberships`).add({
        categoryId,
        customerPhone,
        amountPaid,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        durationDays,
        status: "active",
        grantedBy: "payment_auto",
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ MEMBERSHIP GRANTED: ${customerPhone} → cat:${categoryId} for ${durationDays} days (order:${orderId})`);
}
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
            }).then(() => {
                // Auto-delete customToken after 10 seconds (security: minimize exposure window)
                setTimeout(async () => {
                    try {
                        await change.after.ref.update({
                            customToken: admin.firestore.FieldValue.delete()
                        });
                        console.log(`QR token cleaned for session: ${sessionId}`);
                    }
                    catch (e) {
                        console.warn('QR token cleanup failed (non-critical):', e);
                    }
                }, 10000);
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
    var _a, _b, _c, _d, _f;
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
                const userTokens = ((_f = userSnap.data()) === null || _f === void 0 ? void 0 : _f.fcmTokens) || [];
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
    var _a, _b, _c, _d, _f, _g, _h, _j, _k;
    const after = change.after.data();
    const before = change.before.data();
    const bizId = context.params.bizId;
    if (!after || !((_a = after.stock) === null || _a === void 0 ? void 0 : _a.trackInventory))
        return null;
    const currentQty = (_c = (_b = after.stock) === null || _b === void 0 ? void 0 : _b.quantity) !== null && _c !== void 0 ? _c : 0;
    const previousQty = (_f = (_d = before === null || before === void 0 ? void 0 : before.stock) === null || _d === void 0 ? void 0 : _d.quantity) !== null && _f !== void 0 ? _f : 0;
    const lowStockThreshold = (_h = (_g = after.stock) === null || _g === void 0 ? void 0 : _g.lowStockThreshold) !== null && _h !== void 0 ? _h : 5;
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
            const ownerId = (_j = bizSnap.data()) === null || _j === void 0 ? void 0 : _j.ownerId;
            if (ownerId) {
                const userSnap = await db.doc(`users/${ownerId}`).get();
                const tokens = ((_k = userSnap.data()) === null || _k === void 0 ? void 0 : _k.fcmTokens) || [];
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
 * Scheduled Cleanup: Unpaid Orders
 * Runs every hour. Soft-deletes unpaid orders older than configured expiry (default 24h).
 * Each business can set `settings.unpaidOrderExpiryHours` (0 = disabled).
 */
exports.cleanupUnpaidOrders = functions
    .pubsub
    .schedule("every 1 hours")
    .timeZone("Asia/Ulaanbaatar")
    .onRun(async () => {
    var _a, _b;
    const DEFAULT_EXPIRY_HOURS = 24;
    let totalDeleted = 0;
    try {
        const bizsSnap = await db.collection('businesses').get();
        for (const bizDoc of bizsSnap.docs) {
            const bizData = bizDoc.data();
            const expiryHours = (_b = (_a = bizData.settings) === null || _a === void 0 ? void 0 : _a.unpaidOrderExpiryHours) !== null && _b !== void 0 ? _b : DEFAULT_EXPIRY_HOURS;
            // 0 means disabled
            if (expiryHours <= 0)
                continue;
            const cutoff = new Date();
            cutoff.setHours(cutoff.getHours() - expiryHours);
            const unpaidSnap = await db
                .collection(`businesses/${bizDoc.id}/orders`)
                .where('paymentStatus', '==', 'unpaid')
                .where('createdAt', '<=', cutoff)
                .limit(50)
                .get();
            if (unpaidSnap.empty)
                continue;
            const now = admin.firestore.FieldValue.serverTimestamp();
            const batch = db.batch();
            let count = 0;
            for (const orderDoc of unpaidSnap.docs) {
                const order = orderDoc.data();
                if (order.isDeleted)
                    continue;
                batch.update(orderDoc.ref, {
                    isDeleted: true,
                    deletedAt: now,
                    deletedBy: 'system_auto',
                    deletionReason: `Төлбөр ${expiryHours} цагийн дотор хийгдээгүй`,
                });
                count++;
            }
            if (count > 0) {
                await batch.commit();
                totalDeleted += count;
                // Notify business
                await db.collection(`businesses/${bizDoc.id}/notifications`).add({
                    type: 'system',
                    title: `🗑️ ${count} захиалга автомат устгагдлаа`,
                    body: `Төлбөр ${expiryHours} цагийн дотор хийгдээгүй захиалгууд устгагдлаа.`,
                    icon: '🗑️',
                    link: '/app/orders',
                    readBy: {},
                    priority: 'low',
                    createdAt: now,
                    createdBy: 'system',
                });
            }
        }
        console.log(`Unpaid order cleanup: ${totalDeleted} orders deleted.`);
    }
    catch (err) {
        console.error("Unpaid order cleanup failed:", err);
    }
    return null;
});
// Helper: create notification for unmatched SMS income
async function createUnmatchedNotification(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
bizDoc, bizId, snap, smsData, smsAmount, smsNote) {
    var _a, _b;
    console.log(`No matching order: amount=${smsAmount}, note=${smsNote || 'empty'}`);
    await db.collection(`businesses/${bizId}/notifications`).add({
        templateId: 'payment.received',
        type: 'sms_income',
        title: `💰 Шинэ орлого ₮${smsAmount.toLocaleString()}`,
        body: `${smsData.bank || smsData.sender || 'Банк'} — ${smsNote || 'Утга байхгүй'}`,
        icon: '💰',
        link: '/app/sms-income-sync',
        referenceId: snap.id,
        readBy: {},
        priority: 'normal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'system',
    });
    try {
        const ownerId = (_a = bizDoc.data()) === null || _a === void 0 ? void 0 : _a.ownerId;
        if (ownerId) {
            const userSnap = await db.doc(`users/${ownerId}`).get();
            const tokens = ((_b = userSnap.data()) === null || _b === void 0 ? void 0 : _b.fcmTokens) || [];
            if (tokens.length > 0) {
                await admin.messaging().sendEachForMulticast({
                    notification: {
                        title: `💰 Шинэ орлого ₮${smsAmount.toLocaleString()}`,
                        body: `${smsData.bank || 'Банк'} — Холбогдоогүй`,
                    },
                    data: { type: 'sms_income', bizId, link: '/app/sms-income-sync' },
                    tokens,
                });
            }
        }
    }
    catch (pushErr) {
        console.warn('FCM push failed (non-critical):', pushErr);
    }
}
/**
 * Parse text between prefix and suffix markers.
 * Case-insensitive prefix/suffix search.
 */
function parseWithMarkers(text, prefix, suffix) {
    if (!prefix)
        return '';
    const lower = text.toLowerCase();
    const prefixLower = prefix.toLowerCase();
    const prefixIdx = lower.indexOf(prefixLower);
    if (prefixIdx === -1)
        return '';
    const startIdx = prefixIdx + prefix.length;
    if (!suffix) {
        // No suffix: take until newline, ", " or ". "
        const rest = text.substring(startIdx);
        const endMatch = rest.match(/[\n]|,\s|\.\s\s/);
        return endMatch ? rest.substring(0, endMatch.index).trim() : rest.trim();
    }
    const suffixLower = suffix.toLowerCase();
    const suffixIdx = lower.indexOf(suffixLower, startIdx);
    if (suffixIdx === -1) {
        const rest = text.substring(startIdx);
        const nlIdx = rest.indexOf('\n');
        return nlIdx > -1 ? rest.substring(0, nlIdx).trim() : rest.trim();
    }
    return text.substring(startIdx, suffixIdx).trim();
}
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
    var _a, _b, _c, _d, _f, _g, _h;
    const smsData = snap.data();
    const pairingKey = smsData.pairingKey;
    let smsAmount = smsData.amount || 0;
    const smsBody = (smsData.body || '');
    let smsNote = (smsData.utga || '');
    if (!pairingKey)
        return null;
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
        // 2. Load SMS templates and try parsing with them
        const templatesSnap = await db.collection(`businesses/${bizId}/smsTemplates`)
            .where('isActive', '==', true)
            .get();
        let parsedByTemplate = false;
        for (const tmplDoc of templatesSnap.docs) {
            const tmpl = tmplDoc.data();
            if (!((_a = tmpl.incomeKeywords) === null || _a === void 0 ? void 0 : _a.length))
                continue;
            // Check if any income keyword exists in SMS body
            const bodyLower = smsBody.toLowerCase();
            const hasKeyword = tmpl.incomeKeywords.some((kw) => bodyLower.includes(kw.toLowerCase()));
            if (!hasKeyword)
                continue;
            // Parse amount by prefix/suffix markers (new approach)
            if (tmpl.amountPrefix && !smsAmount) {
                const amountStr = parseWithMarkers(smsBody, tmpl.amountPrefix, tmpl.amountSuffix || '');
                if (amountStr) {
                    const parsed = parseFloat(amountStr.replace(/[,\s]/g, ''));
                    if (!isNaN(parsed) && parsed > 0) {
                        smsAmount = parsed;
                    }
                }
            }
            // Parse utga by prefix/suffix markers (new approach)
            if (tmpl.utgaPrefix && !smsNote) {
                const utga = parseWithMarkers(smsBody, tmpl.utgaPrefix, tmpl.utgaSuffix || '');
                if (utga)
                    smsNote = utga;
            }
            // Fallback: old regex patterns
            if (!smsAmount && tmpl.amountPattern) {
                try {
                    if (tmpl.amountPattern.length > 200)
                        throw new Error('Pattern too long');
                    const amountRegex = new RegExp(tmpl.amountPattern, 'i');
                    const amountMatch = smsBody.match(amountRegex);
                    if (amountMatch === null || amountMatch === void 0 ? void 0 : amountMatch[1]) {
                        smsAmount = parseFloat(amountMatch[1].replace(/[,\s]/g, ''));
                    }
                }
                catch (_e) { /* invalid regex */ }
            }
            if (!smsNote && tmpl.utgaPattern) {
                try {
                    if (tmpl.utgaPattern.length > 200)
                        throw new Error('Pattern too long');
                    const utgaRegex = new RegExp(tmpl.utgaPattern, 'i');
                    const utgaMatch = smsBody.match(utgaRegex);
                    if (utgaMatch === null || utgaMatch === void 0 ? void 0 : utgaMatch[1]) {
                        smsNote = utgaMatch[1].trim();
                    }
                }
                catch (_e) { /* invalid regex */ }
            }
            if (smsAmount > 0) {
                parsedByTemplate = true;
                console.log(`Parsed with template "${tmpl.bankName}": amount=${smsAmount}, utga=${smsNote}`);
                break;
            }
        }
        // Fallback parsing if templates didn't parse
        if (!smsAmount) {
            const mntMatch = smsBody.match(/(\d[\d,]*(?:\.\d{1,2})?)\s*(?:MNT|₮|mnt)/i);
            if (mntMatch) {
                smsAmount = parseFloat(mntMatch[1].replace(/,/g, ''));
            }
        }
        if (!smsNote) {
            const utgaMatch = smsBody.match(/(?:guilgeenii\s*)?(?:utga|Utga|UTGA|утга|Утга)[:\s]*([^\n]+)/i);
            if (utgaMatch) {
                smsNote = utgaMatch[1].trim();
            }
        }
        // Update the sms_inbox doc with parsed values if we found better ones
        if (parsedByTemplate || (!smsData.amount && smsAmount > 0)) {
            await snap.ref.update({
                amount: smsAmount,
                utga: smsNote,
                parsedByTemplate: parsedByTemplate,
            });
        }
        if (smsAmount <= 0) {
            console.log(`No amount found in SMS: ${smsBody.substring(0, 80)}`);
            await snap.ref.update({ status: 'no_amount' });
            return null;
        }
        // Combine note + body for searching, lowercase
        const searchText = `${smsNote} ${smsBody}`.toLowerCase();
        // 3. Load unpaid orders for this business
        const ordersSnap = await db.collection(`businesses/${bizId}/orders`)
            .where('paymentStatus', '==', 'unpaid')
            .limit(200)
            .get();
        if (ordersSnap.empty) {
            console.log(`No orders for business: ${bizId}`);
            await createUnmatchedNotification(bizDoc, bizId, snap, smsData, smsAmount, smsNote);
            await snap.ref.update({ status: 'unmatched' });
            return null;
        }
        // 4. Find matching order
        // Extract all potential 4-digit ref codes from utga text
        const refCodesInUtga = smsNote.match(/\b(\d{4})\b/g) || [];
        let matchedOrderDoc = null;
        for (const orderDoc of ordersSnap.docs) {
            const order = orderDoc.data();
            if (order.isDeleted || order.status === 'cancelled')
                continue;
            // Amount must match exactly (±1₮ tolerance)
            const orderTotal = ((_b = order.financials) === null || _b === void 0 ? void 0 : _b.totalAmount) || 0;
            if (Math.abs(smsAmount - orderTotal) > 1)
                continue;
            // Check refCode match
            const refCode = (order.paymentRefCode || '').toLowerCase();
            const phone = (((_c = order.customer) === null || _c === void 0 ? void 0 : _c.phone) || '');
            // Method 1: searchText contains exact refCode
            const hasRefCode = refCode && refCode.length >= 3 && searchText.includes(refCode);
            // Method 2: 4-digit ref codes found in utga match order's refCode
            const hasRefCodeInDigits = refCode && refCodesInUtga.some((rc) => rc === refCode);
            // Method 3: phone number match
            const hasPhone = phone && phone.length >= 8 && searchText.includes(phone);
            if (hasRefCode || hasRefCodeInDigits || hasPhone) {
                matchedOrderDoc = orderDoc;
                console.log(`Match: refCode=${hasRefCode || hasRefCodeInDigits}, phone=${hasPhone}, order=${orderDoc.id}`);
                break;
            }
        }
        if (!matchedOrderDoc) {
            await createUnmatchedNotification(bizDoc, bizId, snap, smsData, smsAmount, smsNote);
            await snap.ref.update({ status: 'unmatched' });
            return null;
        }
        // 4. Auto-match: Update order as paid (only if still unpaid)
        const now = admin.firestore.FieldValue.serverTimestamp();
        const matchedOrder = matchedOrderDoc.data();
        if (matchedOrder.paymentStatus === 'unpaid') {
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
        }
        // 5. Update SMS doc as matched
        await snap.ref.update({
            status: 'matched',
            orderId: matchedOrderDoc.id,
            matchedAt: now,
            autoMatched: true,
        });
        // 5.5 AUTO-GRANT MEMBERSHIP if this is a membership order
        if (matchedOrder.orderType === 'membership' && matchedOrder.membershipCategoryId) {
            try {
                await grantMembershipFromOrder(bizId, matchedOrder, matchedOrderDoc.id);
            }
            catch (memberErr) {
                console.error("Membership grant failed (non-critical):", memberErr);
            }
        }
        // 6. Create notification for successful auto-match
        const orderNumber = matchedOrder.orderNumber || matchedOrderDoc.id.slice(0, 6);
        const notifTitle = matchedOrder.orderType === 'membership'
            ? `✅ VIP гишүүнчлэл − төлбөр баталгаажлаа`
            : `✅ Төлбөр автомат холбогдлоо #${orderNumber}`;
        await db.collection(`businesses/${bizId}/notifications`).add({
            templateId: 'payment.received',
            type: 'sms_income',
            title: notifTitle,
            body: `₮${smsAmount.toLocaleString()} — ${((_d = matchedOrder.customer) === null || _d === void 0 ? void 0 : _d.name) || 'Зочин'} — ${smsData.bank || 'Банк'}`,
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
                            title: notifTitle,
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
        try {
            await snap.ref.update({ status: 'error' });
        }
        catch (_) { }
        return null;
    }
});
// ═══════════════════════════════════════════
// SuperAdmin Proxy Functions
// Firestore rules block direct client writes to system_settings/system_categories.
// These callable functions verify isSuperAdmin before writing via Admin SDK.
// ═══════════════════════════════════════════
async function verifySuperAdmin(uid) {
    var _a;
    const userSnap = await db.doc(`users/${uid}`).get();
    return userSnap.exists && ((_a = userSnap.data()) === null || _a === void 0 ? void 0 : _a.isSuperAdmin) === true;
}
exports.updateSystemSettings = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await verifySuperAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'SuperAdmin only');
    }
    const { docId, value } = data;
    if (!docId || !value)
        throw new functions.https.HttpsError('invalid-argument', 'docId and value required');
    await db.doc(`system_settings/${docId}`).set(value, { merge: true });
    return { success: true };
});
exports.updateSystemCategory = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await verifySuperAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'SuperAdmin only');
    }
    const { categoryId, value, isDelete } = data;
    if (!categoryId)
        throw new functions.https.HttpsError('invalid-argument', 'categoryId required');
    if (isDelete) {
        await db.doc(`system_categories/${categoryId}`).delete();
    }
    else {
        await db.doc(`system_categories/${categoryId}`).set(value, { merge: true });
    }
    return { success: true };
});
exports.bulkUpdateSystemCategories = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    if (!(await verifySuperAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError('permission-denied', 'SuperAdmin only');
    }
    const { ids, updates } = data;
    if (!(ids === null || ids === void 0 ? void 0 : ids.length) || !updates)
        throw new functions.https.HttpsError('invalid-argument', 'ids and updates required');
    const batch = db.batch();
    for (const id of ids) {
        batch.update(db.doc(`system_categories/${id}`), updates);
    }
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=index.js.map