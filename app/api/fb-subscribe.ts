/**
 * Facebook Page Subscription API
 * 
 * Subscribes Facebook Pages to webhook events (messages, postbacks, deliveries, reads).
 * This is REQUIRED by the Messenger Platform — each Page must be subscribed via API.
 * 
 * POST: { bizId } — Subscribe all connected pages
 * GET:  { bizId } — Check subscription status
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';

// Webhook fields to subscribe to
const SUBSCRIBED_FIELDS = [
    'messages',
    'messaging_postbacks',
    'message_deliveries',
    'message_reads',
    'messaging_optins',
].join(',');

// ═══ Firestore helpers ═══
function fromFirestoreValue(val: Record<string, unknown>): unknown {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        const arr = val.arrayValue as { values?: Record<string, unknown>[] };
        return (arr.values || []).map(v => fromFirestoreValue(v));
    }
    if ('mapValue' in val) {
        const map = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(map.fields || {})) {
            result[k] = fromFirestoreValue(v);
        }
        return result;
    }
    return null;
}

async function fsGet(path: string): Promise<Record<string, unknown> | null> {
    try {
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}`);
        if (!resp.ok) return null;
        const doc = await resp.json();
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(doc.fields || {} as Record<string, Record<string, unknown>>)) {
            result[k] = fromFirestoreValue(v as Record<string, unknown>);
        }
        return result;
    } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const bizId = (req.query.bizId || req.body?.bizId) as string;
    
    if (!bizId) {
        return res.status(400).json({ error: 'Missing bizId parameter' });
    }

    // Get settings from Firestore
    const settings = await fsGet(`businesses/${bizId}/fbSettings/config`);
    if (!settings) {
        return res.status(400).json({ error: 'Facebook settings not found for this business' });
    }

    const pagesArr = (settings.pages as Array<{ pageId: string; pageName?: string; pageAccessToken: string }>) || [];
    
    if (pagesArr.length === 0) {
        return res.status(400).json({ error: 'No pages configured' });
    }

    // ═══ GET: Check subscription status ═══
    if (req.method === 'GET') {
        const results = [];
        for (const page of pagesArr) {
            try {
                const resp = await fetch(
                    `https://graph.facebook.com/v22.0/${page.pageId}/subscribed_apps?access_token=${page.pageAccessToken}`
                );
                const data = await resp.json();
                results.push({
                    pageId: page.pageId,
                    pageName: page.pageName,
                    status: resp.ok ? 'ok' : 'error',
                    subscriptions: data.data || [],
                    error: data.error || null,
                });
            } catch (err) {
                results.push({
                    pageId: page.pageId,
                    pageName: page.pageName,
                    status: 'error',
                    error: String(err),
                });
            }
        }
        return res.status(200).json({ pages: results });
    }

    // ═══ POST: Subscribe pages ═══
    if (req.method === 'POST') {
        const results = [];
        for (const page of pagesArr) {
            console.log(`[fb-subscribe] Subscribing page ${page.pageName || page.pageId} to webhook events...`);
            try {
                const resp = await fetch(
                    `https://graph.facebook.com/v22.0/${page.pageId}/subscribed_apps`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            subscribed_fields: SUBSCRIBED_FIELDS,
                            access_token: page.pageAccessToken,
                        }),
                    }
                );
                const data = await resp.json();
                
                if (data.success) {
                    console.log(`[fb-subscribe] ✅ ${page.pageName || page.pageId} subscribed successfully`);
                } else {
                    console.error(`[fb-subscribe] ❌ ${page.pageName || page.pageId} failed:`, data.error);
                }

                results.push({
                    pageId: page.pageId,
                    pageName: page.pageName,
                    success: !!data.success,
                    subscribedFields: SUBSCRIBED_FIELDS,
                    error: data.error || null,
                });
            } catch (err) {
                console.error(`[fb-subscribe] Error for ${page.pageName}:`, err);
                results.push({
                    pageId: page.pageId,
                    pageName: page.pageName,
                    success: false,
                    error: String(err),
                });
            }
        }

        const allSuccess = results.every(r => r.success);
        return res.status(allSuccess ? 200 : 207).json({
            success: allSuccess,
            message: allSuccess 
                ? `All ${results.length} pages subscribed successfully!` 
                : `Some pages failed to subscribe`,
            pages: results,
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
