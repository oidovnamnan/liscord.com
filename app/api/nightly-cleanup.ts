import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

/**
 * Nightly System Cleanup — Vercel Cron
 * 
 * Runs daily at 04:00 AM Mongolia time (UTC 20:00).
 * Reads each business's `module_settings/cleanup` config and executes enabled tasks.
 * 
 * Tasks:
 * 1. unpaidOrders     — soft-delete unpaid orders older than X hours
 * 2. archiveDeleted   — archive soft-deleted records older than X days
 * 3. staleVisitors    — delete old visitor heartbeat docs
 * 4. qrSessions       — delete old QR login sessions (global)
 * 5. oldNotifications — delete old notification docs
 * 6. oldDailyStats   — delete old daily_stats docs
 */

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
const now = admin.firestore.FieldValue.serverTimestamp();

interface CleanupTask {
    enabled: boolean;
    value: number;
    unit: 'hours' | 'days';
}

interface CleanupConfig {
    unpaidOrders?: CleanupTask;
    archiveDeleted?: CleanupTask;
    staleVisitors?: CleanupTask;
    qrSessions?: CleanupTask;
    oldNotifications?: CleanupTask;
    oldDailyStats?: CleanupTask;
}

const DEFAULTS: Required<CleanupConfig> = {
    unpaidOrders: { enabled: true, value: 24, unit: 'hours' },
    archiveDeleted: { enabled: true, value: 30, unit: 'days' },
    staleVisitors: { enabled: true, value: 24, unit: 'hours' },
    qrSessions: { enabled: true, value: 24, unit: 'hours' },
    oldNotifications: { enabled: true, value: 90, unit: 'days' },
    oldDailyStats: { enabled: false, value: 365, unit: 'days' },
};

function getCutoffDate(task: CleanupTask): Date {
    const d = new Date();
    if (task.unit === 'hours') {
        d.setHours(d.getHours() - task.value);
    } else {
        d.setDate(d.getDate() - task.value);
    }
    return d;
}

async function batchDelete(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<number> {
    if (docs.length === 0) return 0;
    const batch = db.batch();
    docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return docs.length;
}

async function batchUpdate(docs: FirebaseFirestore.QueryDocumentSnapshot[], data: Record<string, unknown>): Promise<number> {
    if (docs.length === 0) return 0;
    const batch = db.batch();
    docs.forEach(d => batch.update(d.ref, data));
    await batch.commit();
    return docs.length;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const results: Record<string, { cleaned: number; errors: string[] }> = {};
    let globalQrCleaned = 0;

    try {
        // ── 1. Global: QR Sessions cleanup ──
        // (qr_logins is not per-business, clean it once)
        try {
            const cutoff24h = new Date();
            cutoff24h.setHours(cutoff24h.getHours() - 24);

            const qrSnap = await db.collection('qr_logins')
                .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoff24h))
                .limit(200)
                .get();

            globalQrCleaned = await batchDelete(qrSnap.docs);
        } catch (e: any) {
            console.error('[Cleanup] QR sessions error:', e.message);
        }

        // ── 2. Per-business cleanup ──
        const bizSnap = await db.collection('businesses').get();

        for (const bizDoc of bizSnap.docs) {
            const bizId = bizDoc.id;
            const bizName = bizDoc.data().name || bizId;
            const bizResults = { cleaned: 0, errors: [] as string[] };

            try {
                // Load cleanup config
                const cfgDoc = await db.doc(`businesses/${bizId}/module_settings/cleanup`).get();
                const rawCfg = (cfgDoc.exists ? cfgDoc.data() : {}) as CleanupConfig;
                const cfg: Required<CleanupConfig> = {
                    unpaidOrders: { ...DEFAULTS.unpaidOrders, ...rawCfg.unpaidOrders },
                    archiveDeleted: { ...DEFAULTS.archiveDeleted, ...rawCfg.archiveDeleted },
                    staleVisitors: { ...DEFAULTS.staleVisitors, ...rawCfg.staleVisitors },
                    qrSessions: { ...DEFAULTS.qrSessions, ...rawCfg.qrSessions },
                    oldNotifications: { ...DEFAULTS.oldNotifications, ...rawCfg.oldNotifications },
                    oldDailyStats: { ...DEFAULTS.oldDailyStats, ...rawCfg.oldDailyStats },
                };

                // ── Task 1: Unpaid Orders ──
                if (cfg.unpaidOrders.enabled) {
                    try {
                        const cutoff = getCutoffDate(cfg.unpaidOrders);
                        const snap = await db.collection(`businesses/${bizId}/orders`)
                            .where('paymentStatus', '==', 'unpaid')
                            .where('isDeleted', '==', false)
                            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
                            .limit(100)
                            .get();

                        const count = await batchUpdate(snap.docs, {
                            isDeleted: true,
                            deletedAt: now,
                            deletedBy: 'system_cleanup',
                            deletedReason: 'auto_expired_unpaid',
                            cancelReason: `Төлбөр ${cfg.unpaidOrders.value}${cfg.unpaidOrders.unit === 'hours' ? 'ц' : ' хоног'}ийн дотор хийгдээгүй`,
                            updatedAt: now,
                        });
                        bizResults.cleaned += count;
                    } catch (e: any) {
                        bizResults.errors.push(`unpaidOrders: ${e.message}`);
                    }
                }

                // ── Task 2: Archive Deleted Records ──
                if (cfg.archiveDeleted.enabled) {
                    const collections = ['orders', 'products', 'invoices', 'expenses'];
                    for (const col of collections) {
                        try {
                            const cutoff = getCutoffDate(cfg.archiveDeleted);
                            const snap = await db.collection(`businesses/${bizId}/${col}`)
                                .where('isDeleted', '==', true)
                                .where('deletedAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
                                .limit(100)
                                .get();

                            // Filter out already archived
                            const toArchive = snap.docs.filter(d => !d.data().isArchived);
                            const count = await batchUpdate(toArchive, {
                                isArchived: true,
                                archivedAt: now,
                            });
                            bizResults.cleaned += count;
                        } catch (e: any) {
                            bizResults.errors.push(`archive(${col}): ${e.message}`);
                        }
                    }
                }

                // ── Task 3: Stale Visitors ──
                if (cfg.staleVisitors.enabled) {
                    try {
                        const cutoff = getCutoffDate(cfg.staleVisitors);
                        const snap = await db.collection(`businesses/${bizId}/visitors`)
                            .where('lastActiveAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
                            .limit(200)
                            .get();

                        const count = await batchDelete(snap.docs);
                        bizResults.cleaned += count;
                    } catch (e: any) {
                        bizResults.errors.push(`visitors: ${e.message}`);
                    }
                }

                // ── Task 4: Old Notifications ──
                if (cfg.oldNotifications.enabled) {
                    try {
                        const cutoff = getCutoffDate(cfg.oldNotifications);
                        const snap = await db.collection(`businesses/${bizId}/notifications`)
                            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
                            .limit(200)
                            .get();

                        const count = await batchDelete(snap.docs);
                        bizResults.cleaned += count;
                    } catch (e: any) {
                        bizResults.errors.push(`notifications: ${e.message}`);
                    }
                }

                // ── Task 5: Old Daily Stats ──
                if (cfg.oldDailyStats.enabled) {
                    try {
                        const cutoff = getCutoffDate(cfg.oldDailyStats);
                        const snap = await db.collection(`businesses/${bizId}/daily_stats`)
                            .where('date', '<', admin.firestore.Timestamp.fromDate(cutoff))
                            .limit(200)
                            .get();

                        const count = await batchDelete(snap.docs);
                        bizResults.cleaned += count;
                    } catch (e: any) {
                        bizResults.errors.push(`dailyStats: ${e.message}`);
                    }
                }

                // ── Send summary notification ──
                if (bizResults.cleaned > 0) {
                    await db.collection(`businesses/${bizId}/notifications`).add({
                        type: 'system',
                        title: `🧹 Шөнийн цэвэрлэгээ: ${bizResults.cleaned} бичлэг`,
                        body: `Систем цэвэрлэгээ амжилттай хийгдлээ.`,
                        icon: '🧹',
                        link: '/app/settings?tab=cleanup',
                        readBy: {},
                        priority: 'low',
                        createdAt: now,
                        createdBy: 'system',
                    });
                }

            } catch (e: any) {
                bizResults.errors.push(`general: ${e.message}`);
            }

            results[bizName] = bizResults;
        }

        const totalCleaned = Object.values(results).reduce((s, r) => s + r.cleaned, 0) + globalQrCleaned;

        console.log(`[NightlyCleanup] Done. Total: ${totalCleaned} (QR: ${globalQrCleaned})`);

        return res.status(200).json({
            success: true,
            totalCleaned,
            globalQrCleaned,
            businesses: results,
            timestamp: new Date().toISOString(),
        });

    } catch (err: any) {
        console.error('[NightlyCleanup] Fatal error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
}
