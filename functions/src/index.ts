import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as https from "https";

admin.initializeApp();

const db = admin.firestore();

// ═══════════════════════════════════════════
// QPay V2 Configuration
// ═══════════════════════════════════════════
const QPAY_CONFIG = {
    baseUrl: "https://merchant.qpay.mn",
    username: "GATE_SIM",
    password: "8r3bvsa3",
    invoiceCode: "GATE_SIM_INVOICE",
};

// Token cache
let qpayTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Make HTTPS request (no external deps needed)
 */
function httpsRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string
): Promise<{ status: number; data: string }> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options: https.RequestOptions = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method,
            headers: {
                ...headers,
                ...(body ? { "Content-Length": Buffer.byteLength(body).toString() } : {}),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
            res.on("end", () => resolve({ status: res.statusCode || 0, data }));
        });

        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

/**
 * Get QPay auth token (with caching)
 */
async function getQPayToken(): Promise<string> {
    // Return cached token if still valid (5 min buffer)
    if (qpayTokenCache && qpayTokenCache.expiresAt > Date.now() + 300000) {
        return qpayTokenCache.token;
    }

    const credentials = Buffer.from(`${QPAY_CONFIG.username}:${QPAY_CONFIG.password}`).toString("base64");
    const resp = await httpsRequest(
        `${QPAY_CONFIG.baseUrl}/v2/auth/token`,
        "POST",
        {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/json",
        },
        ""
    );

    if (resp.status !== 200) {
        console.error("QPay auth failed:", resp.status, resp.data);
        throw new functions.https.HttpsError("internal", "QPay auth failed");
    }

    const result = JSON.parse(resp.data);
    qpayTokenCache = {
        token: result.access_token,
        expiresAt: Date.now() + (result.expires_in || 3600) * 1000,
    };

    return result.access_token;
}

// ═══════════════════════════════════════════
// Grant membership helper
// ═══════════════════════════════════════════
async function grantMembershipFromOrder(
    bizId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderData: any,
    orderId: string
): Promise<void> {
    const categoryId = orderData.membershipCategoryId;
    const customerPhone = (orderData.customer?.phone || "").replace(/[^\d]/g, "");
    const durationDays = orderData.membershipDurationDays || 30;
    const amountPaid = orderData.financials?.totalAmount || 0;

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
 * Creates in-app notification + sends FCM push to owner AND employees with orders.* permission
 */
export const sendOrderNotification = functions
    .firestore
    .document("businesses/{bizId}/orders/{orderId}")
    .onCreate(async (snap, context) => {
        const orderData = snap.data();
        const bizId = context.params.bizId;
        if (!orderData || orderData.isDeleted) return null;

        try {
            const bizSnap = await db.doc(`businesses/${bizId}`).get();
            const bizData = bizSnap.data();
            if (!bizData) return null;

            const customerName = orderData.customer?.name || 'Зочин';
            const totalAmount = orderData.financials?.totalAmount || 0;
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
            const tokensToSend: { token: string; userId: string }[] = [];

            // Owner tokens
            const ownerId = bizData.ownerId;
            if (ownerId) {
                const ownerSnap = await db.doc(`users/${ownerId}`).get();
                const ownerTokens: string[] = ownerSnap.data()?.fcmTokens || [];
                ownerTokens.forEach(t => tokensToSend.push({ token: t, userId: ownerId }));
            }

            // Employee tokens — find employees with orders.* permission via their Position
            try {
                const empsSnap = await db.collection(`businesses/${bizId}/employees`).get();
                for (const empDoc of empsSnap.docs) {
                    const empData = empDoc.data();
                    if (!empData.userId || empData.userId === ownerId) continue;

                    // Check position permissions
                    if (empData.positionId) {
                        const posSnap = await db.doc(`businesses/${bizId}/positions/${empData.positionId}`).get();
                        const perms: string[] = posSnap.data()?.permissions || [];
                        const hasOrderPerm = perms.some(p => p.startsWith('orders.'));
                        if (!hasOrderPerm) continue;
                    } else {
                        continue; // No position = no order permission
                    }

                    const userSnap = await db.doc(`users/${empData.userId}`).get();
                    const userTokens: string[] = userSnap.data()?.fcmTokens || [];
                    userTokens.forEach(t => tokensToSend.push({ token: t, userId: empData.userId }));
                }
            } catch (empErr) {
                console.warn("Employee token fetch failed (non-critical):", empErr);
            }

            if (tokensToSend.length === 0) return null;

            // 3. Send FCM push
            const uniqueTokens = [...new Set(tokensToSend.map(t => t.token))];
            const message: admin.messaging.MulticastMessage = {
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
            const tokensToRemove: { token: string; userId: string }[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                    const orig = tokensToSend.find(t => t.token === uniqueTokens[idx]);
                    if (orig) tokensToRemove.push(orig);
                }
            });

            for (const { token, userId } of tokensToRemove) {
                await db.doc(`users/${userId}`).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
                });
            }

            console.log(`📬 Order notification sent to ${uniqueTokens.length} devices`);
            return null;
        } catch (err) {
            console.error("Failed to send order notification:", err);
            return null;
        }
    });

/**
 * Low Stock Alert
 * Creates in-app notification + sends FCM push to owner when stock drops below threshold
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
                const ownerId = bizSnap.data()?.ownerId;
                if (ownerId) {
                    const userSnap = await db.doc(`users/${ownerId}`).get();
                    const tokens: string[] = userSnap.data()?.fcmTokens || [];
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
export const onSmsIncome = functions
    .firestore
    .document("sms_inbox/{smsId}")
    .onCreate(async (snap) => {
        const smsData = snap.data();
        if (!smsData) return null;

        const pairingKey = smsData.pairingKey;
        const smsAmount = smsData.amount || 0;
        const smsBody = (smsData.body || '').toLowerCase();
        const smsNote = (smsData.utga || '').toLowerCase();

        if (smsAmount <= 0 || !pairingKey) return null;

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
            let matchedOrderDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

            for (const orderDoc of ordersSnap.docs) {
                const order = orderDoc.data();

                // Skip deleted/cancelled
                if (order.isDeleted || order.status === 'cancelled') continue;

                // Amount must match exactly (±1₮ tolerance)
                const orderTotal = order.financials?.totalAmount || 0;
                if (Math.abs(smsAmount - orderTotal) > 1) continue;

                // Check if searchText contains refCode or phone
                const refCode = (order.paymentRefCode || '').toLowerCase();
                const phone = (order.customer?.phone || '');

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
                    link: '/app/sms-income-sync',
                    referenceId: snap.id,
                    readBy: {},
                    priority: 'normal',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'system',
                });

                // FCM push to owner
                try {
                    const ownerId = bizDoc.data()?.ownerId;
                    if (ownerId) {
                        const userSnap = await db.doc(`users/${ownerId}`).get();
                        const tokens: string[] = userSnap.data()?.fcmTokens || [];
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
                } catch (pushErr) {
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

            // 5.5 AUTO-GRANT MEMBERSHIP if this is a membership order
            const matchedOrder = matchedOrderDoc.data();
            if (matchedOrder.orderType === 'membership' && matchedOrder.membershipCategoryId) {
                try {
                    await grantMembershipFromOrder(bizId, matchedOrder, matchedOrderDoc.id);
                } catch (memberErr) {
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
                body: `₮${smsAmount.toLocaleString()} — ${matchedOrder.customer?.name || 'Зочин'} — ${smsData.bank || 'Банк'}`,
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
                const ownerId = bizDoc.data()?.ownerId;
                if (ownerId) {
                    const userSnap = await db.doc(`users/${ownerId}`).get();
                    const tokens: string[] = userSnap.data()?.fcmTokens || [];
                    if (tokens.length > 0) {
                        await admin.messaging().sendEachForMulticast({
                            notification: {
                                title: notifTitle,
                                body: `₮${smsAmount.toLocaleString()} — ${matchedOrder.customer?.name || 'Зочин'}`,
                            },
                            data: { type: 'sms_income', bizId, link: '/app/orders' },
                            tokens,
                        });
                    }
                }
            } catch (pushErr) {
                console.warn('FCM push failed (non-critical):', pushErr);
            }

            console.log(`✅ AUTO-MATCHED: SMS ${snap.id} → Order ${matchedOrderDoc.id} (₮${smsAmount})`);
            return null;

        } catch (err) {
            console.error("SMS auto-matching failed:", err);
            return null;
        }
    });

// ═══════════════════════════════════════════
// QPay V2 Cloud Functions
// ═══════════════════════════════════════════

// CORS helper
function setCors(res: functions.Response): void {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
}

/**
 * QPay Create Invoice (HTTP with CORS)
 * Frontend calls this to generate a QR code for payment
 */
export const qpayCreateInvoice = functions.https.onRequest(async (req, res) => {
    setCors(res);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { bizId, orderId, amount, description, customerPhone } = req.body;

    if (!bizId || !orderId || !amount) {
        res.status(400).json({ error: "Missing required fields: bizId, orderId, amount" });
        return;
    }

    try {
        const token = await getQPayToken();

        // Build callback URL pointing to our qpayCallback function
        const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "liscord-pro";
        const callbackUrl = `https://us-central1-${projectId}.cloudfunctions.net/qpayCallback?bizId=${bizId}&orderId=${orderId}`;

        const invoiceBody = JSON.stringify({
            invoice_code: QPAY_CONFIG.invoiceCode,
            sender_invoice_no: orderId,
            invoice_receiver_code: customerPhone || "guest",
            invoice_description: description || `Liscord #${orderId.slice(-6)}`,
            amount: amount,
            callback_url: callbackUrl,
        });

        const resp = await httpsRequest(
            `${QPAY_CONFIG.baseUrl}/v2/invoice`,
            "POST",
            {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            invoiceBody
        );

        if (resp.status !== 200) {
            console.error("QPay invoice creation failed:", resp.status, resp.data);
            res.status(500).json({ error: "QPay invoice creation failed" });
            return;
        }

        const result = JSON.parse(resp.data);

        // Save invoice_id to the order
        await db.doc(`businesses/${bizId}/orders/${orderId}`).update({
            qpayInvoiceId: result.invoice_id,
        });

        res.status(200).json({
            invoice_id: result.invoice_id,
            qr_text: result.qr_text,
            qr_image: result.qr_image,
            qPay_shortUrl: result.qPay_shortUrl,
            urls: result.urls || [],
        });

    } catch (err) {
        console.error("qpayCreateInvoice error:", err);
        res.status(500).json({ error: "Failed to create QPay invoice" });
    }
});

/**
 * QPay Callback (HTTP)
 * QPay hits this URL when payment is made
 */
export const qpayCallback = functions.https.onRequest(async (req, res) => {
    const bizId = req.query.bizId as string;
    const orderId = req.query.orderId as string;

    console.log(`QPay callback received: bizId=${bizId}, orderId=${orderId}`);

    if (!bizId || !orderId) {
        res.status(400).json({ error: "Missing bizId or orderId" });
        return;
    }

    try {
        // 1. Get order
        const orderRef = db.doc(`businesses/${bizId}/orders/${orderId}`);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        const orderData = orderSnap.data()!;
        if (orderData.paymentStatus === 'paid') {
            res.status(200).json({ message: "Already paid" });
            return;
        }

        // 2. Verify payment with QPay
        const invoiceId = orderData.qpayInvoiceId;
        if (!invoiceId) {
            res.status(400).json({ error: "No QPay invoice ID on order" });
            return;
        }

        const token = await getQPayToken();
        const checkBody = JSON.stringify({
            object_type: "INVOICE",
            object_id: invoiceId,
            offset: { page_number: 1, page_limit: 100 },
        });

        const checkResp = await httpsRequest(
            `${QPAY_CONFIG.baseUrl}/v2/payment/check`,
            "POST",
            {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            checkBody
        );

        const checkResult = JSON.parse(checkResp.data);
        const payments = checkResult.rows || [];
        const paidPayment = payments.find((p: { payment_status: string }) => p.payment_status === "PAID");

        if (!paidPayment) {
            console.log("QPay callback: payment not confirmed yet");
            res.status(200).json({ message: "Payment not confirmed yet" });
            return;
        }

        // 3. Update order as paid
        const now = admin.firestore.FieldValue.serverTimestamp();
        const totalAmount = orderData.financials?.totalAmount || 0;

        await orderRef.update({
            paymentStatus: 'paid',
            paymentVerifiedAt: now,
            paymentVerifiedBy: 'qpay',
            'financials.paidAmount': totalAmount,
            'financials.balanceDue': 0,
            'financials.payments': admin.firestore.FieldValue.arrayUnion({
                id: `qpay_${paidPayment.payment_id || Date.now()}`,
                amount: totalAmount,
                method: 'qpay',
                note: `QPay төлбөр`,
                paidAt: now,
                recordedBy: 'qpay_auto',
            }),
            updatedAt: now,
        });

        // 4. Grant membership if applicable
        if (orderData.orderType === 'membership' && orderData.membershipCategoryId) {
            await grantMembershipFromOrder(bizId, orderData, orderId);
        }

        // 5. Create notification
        const orderNumber = orderData.orderNumber || orderId.slice(0, 6);
        const notifTitle = orderData.orderType === 'membership'
            ? `✅ VIP гишүүнчлэл − QPay төлбөр баталгаажлаа`
            : `✅ QPay төлбөр баталгаажлаа #${orderNumber}`;

        await db.collection(`businesses/${bizId}/notifications`).add({
            templateId: 'payment.received',
            type: 'qpay_payment',
            title: notifTitle,
            body: `₮${totalAmount.toLocaleString()} — ${orderData.customer?.name || 'Зочин'}`,
            icon: '✅',
            link: '/app/orders',
            referenceId: orderId,
            readBy: {},
            priority: 'high',
            createdAt: now,
            createdBy: 'system',
        });

        console.log(`✅ QPay payment confirmed: Order ${orderId} (₮${totalAmount})`);
        res.status(200).json({ message: "Payment confirmed" });

    } catch (err) {
        console.error("QPay callback error:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

