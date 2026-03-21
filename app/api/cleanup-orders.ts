import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

/**
 * Cron: Auto-cleanup unpaid orders
 * 
 * Runs every hour via Vercel Cron.
 * Soft-deletes (isDeleted: true) orders that are 'unpaid' and older than
 * the business's configured unpaidOrderExpiryHours (default: 24h).
 */

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'liscord-2b529',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET (Vercel Cron sends GET)
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron secret (required — set CRON_SECRET in Vercel env vars)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Get all active businesses
        const bizSnap = await db.collection('businesses').get();
        let totalDeleted = 0;

        for (const bizDoc of bizSnap.docs) {
            const bizData = bizDoc.data();
            const bizId = bizDoc.id;
            const expiryHours = bizData.settings?.unpaidOrderExpiryHours ?? 24;

            if (expiryHours <= 0) continue; // 0 = disabled

            const expiryDate = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

            // Query unpaid, non-deleted orders older than expiry
            const ordersSnap = await db
                .collection(`businesses/${bizId}/orders`)
                .where('paymentStatus', '==', 'unpaid')
                .where('isDeleted', '==', false)
                .where('createdAt', '<', admin.firestore.Timestamp.fromDate(expiryDate))
                .limit(50)
                .get();

            if (ordersSnap.empty) continue;

            const batch = db.batch();
            let count = 0;

            for (const orderDoc of ordersSnap.docs) {
                batch.update(orderDoc.ref, {
                    isDeleted: true,
                    cancelReason: `Төлбөр төлөгдөөгүй ${expiryHours}ц — автомат устгагдсан`,
                    deletedReason: 'auto_expired_unpaid',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                count++;
            }

            if (count > 0) {
                await batch.commit();
                totalDeleted += count;
                console.log(`[Cron] ${bizData.name || bizId}: ${count} unpaid orders auto-deleted`);
            }
        }

        return res.status(200).json({
            success: true,
            deleted: totalDeleted,
            timestamp: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('[Cron] cleanup-orders error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
}
