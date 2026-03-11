import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Trigger: On Order Create (v1 - Default Region)
 */
export const onOrderCreate = functions
    .firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
        const orderData = snap.data();
        const bizId = context.params.bizId;
        if (!orderData) return null;

        const isActive = !orderData.isDeleted && orderData.status !== 'cancelled';

        return db.runTransaction(async (transaction) => {
            if (isActive) {
                const bizRef = db.doc(`businesses/${bizId}`);
                transaction.update(bizRef, {
                    "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                    "stats.totalRevenue": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
                    "updatedAt": admin.firestore.FieldValue.serverTimestamp(),
                });

                if (orderData.customer?.id) {
                    const customerRef = db.doc(`businesses/${bizId}/customers/${orderData.customer.id}`);
                    transaction.update(customerRef, {
                        "stats.totalOrders": admin.firestore.FieldValue.increment(1),
                        "stats.totalSpent": admin.firestore.FieldValue.increment(orderData.financials?.totalAmount || 0),
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
                            if (productData.stock?.trackInventory) {
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
export const onQrLoginUpdate = functions
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
            } catch (err: unknown) {
                const error = err as Error;
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
 * Sends FCM notification to business owner when a new order is created
 */
export const sendOrderNotification = functions
    .firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
        const orderData = snap.data();
        const bizId = context.params.bizId;
        if (!orderData || orderData.isDeleted) return null;

        try {
            // Get business info
            const bizSnap = await db.doc(`businesses/${bizId}`).get();
            const bizData = bizSnap.data();
            if (!bizData) return null;

            // Get owner's FCM tokens
            const ownerId = bizData.ownerId;
            if (!ownerId) return null;

            const userSnap = await db.doc(`users/${ownerId}`).get();
            const userData = userSnap.data();
            const fcmTokens: string[] = userData?.fcmTokens || [];

            if (fcmTokens.length === 0) return null;

            const customerName = orderData.customer?.name || 'Зочин';
            const totalAmount = orderData.financials?.totalAmount || 0;
            const orderNumber = orderData.orderNumber || snap.id.slice(0, 6);

            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: `🛒 Шинэ захиалга #${orderNumber}`,
                    body: `${customerName} - ₮${totalAmount.toLocaleString()}`,
                },
                data: {
                    type: 'new_order',
                    orderId: snap.id,
                    bizId: bizId,
                },
                tokens: fcmTokens,
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            // Clean up invalid tokens
            const tokensToRemove: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(fcmTokens[idx]);
                }
            });

            if (tokensToRemove.length > 0) {
                await db.doc(`users/${ownerId}`).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
                });
            }

            return null;
        } catch (err) {
            console.error("Failed to send order notification:", err);
            return null;
        }
    });

/**
 * Low Stock Alert
 * Checks for low stock products when stock is updated
 */
export const lowStockAlert = functions
    .firestore
    .document("businesses/{bizId}/products/{productId}")
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();
        const bizId = context.params.bizId;

        if (!after || !after.stock?.trackInventory) return null;

        const currentQty = after.stock?.quantity ?? 0;
        const previousQty = before?.stock?.quantity ?? 0;
        const lowStockThreshold = after.stock?.lowStockThreshold ?? 5;

        // Only trigger when stock drops below threshold (not on every update)
        if (currentQty < lowStockThreshold && previousQty >= lowStockThreshold) {
            try {
                // Create a notification record
                await db.collection(`businesses/${bizId}/notifications`).add({
                    type: 'low_stock',
                    title: 'Бараа дуусах дөхлөө',
                    message: `"${after.name}" барааны үлдэгдэл ${currentQty} болж буурлаа (босго: ${lowStockThreshold})`,
                    productId: context.params.productId,
                    productName: after.name,
                    currentStock: currentQty,
                    threshold: lowStockThreshold,
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } catch (err) {
                console.error("Failed to create low stock notification:", err);
            }
        }

        return null;
    });

/**
 * Scheduled Cleanup - Runs daily at 3:00 AM UTC
 * Archives old soft-deleted records (older than 30 days)
 */
export const scheduledCleanup = functions
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

                    if (deletedDocs.empty) continue;

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
        } catch (err) {
            console.error("Scheduled cleanup failed:", err);
        }

        return null;
    });

/**
 * SMS Income Auto-Matching
 * When a new bank SMS arrives via the bridge app, check if the transaction
 * note contains a payment reference code. If it matches an unpaid order
 * with the same amount, auto-mark the order as paid.
 */
export const onSmsIncome = functions
    .firestore
    .document("sms_inbox/{smsId}")
    .onCreate(async (snap) => {
        const smsData = snap.data();
        if (!smsData) return null;

        const pairingKey = smsData.pairingKey;
        const smsAmount = smsData.amount || 0;
        const smsBody = smsData.body || '';
        const smsNote = smsData.utga || '';

        if (smsAmount <= 0 || !pairingKey) return null;

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

            // 2. Extract reference code (5 uppercase alphanumeric chars) from note or body
            const textToSearch = `${smsNote} ${smsBody}`;
            const refCodeMatch = textToSearch.match(/\b([A-HJ-NP-Z2-9]{5})\b/);

            if (!refCodeMatch) {
                console.log(`No ref code found in SMS: ${smsNote || smsBody.substring(0, 50)}`);
                return null;
            }

            const refCode = refCodeMatch[1];
            console.log(`Found ref code: ${refCode}, amount: ${smsAmount}, bizId: ${bizId}`);

            // 3. Find matching unpaid order
            const ordersQuery = await db.collection(`businesses/${bizId}/orders`)
                .where('paymentRefCode', '==', refCode)
                .where('paymentStatus', '==', 'unpaid')
                .where('isDeleted', '==', false)
                .limit(1)
                .get();

            if (ordersQuery.empty) {
                console.log(`No unpaid order found with refCode: ${refCode}`);
                return null;
            }

            const orderDoc = ordersQuery.docs[0];
            const orderData = orderDoc.data();
            const orderTotal = orderData.financials?.totalAmount || 0;

            // 4. Verify amount matches (allow small tolerance for bank fees)
            if (Math.abs(smsAmount - orderTotal) > 1) {
                console.log(`Amount mismatch: SMS=${smsAmount}, Order=${orderTotal}, refCode=${refCode}`);
                return null;
            }

            // 5. Auto-match: Update order as paid
            const now = admin.firestore.FieldValue.serverTimestamp();
            const paymentEntry = {
                id: `sms_${snap.id}`,
                amount: smsAmount,
                method: 'bank',
                note: `Банкны шилжүүлэг (автомат) - ${smsData.bank || 'Unknown'}`,
                paidAt: now,
                recordedBy: 'system_auto',
            };

            await orderDoc.ref.update({
                paymentStatus: 'paid',
                'financials.paidAmount': smsAmount,
                'financials.balanceDue': 0,
                'financials.payments': admin.firestore.FieldValue.arrayUnion(paymentEntry),
                updatedAt: now,
            });

            // 6. Update SMS doc as matched
            await snap.ref.update({
                status: 'matched',
                orderId: orderDoc.id,
                matchedAt: now,
            });

            console.log(`AUTO-MATCHED: SMS ${snap.id} → Order ${orderDoc.id} (${refCode}, ${smsAmount}₮)`);
            return null;

        } catch (err) {
            console.error("SMS auto-matching failed:", err);
            return null;
        }
    });
