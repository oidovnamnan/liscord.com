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

const APP_ID = process.env.FB_APP_ID || '';
const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';

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

function toFirestoreValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    if (typeof val === 'object') {
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) fields[k] = toFirestoreValue(v);
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function buildFirestoreDoc(data: Record<string, unknown>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
    return { fields };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const bizId = (req.query.bizId || req.body?.bizId) as string;
    const userToken = req.body?.userToken as string; // Direct user token (bypasses Firestore)
    
    // ═══ POST with userToken: Get pages from Facebook directly & subscribe ═══
    if (req.method === 'POST' && userToken) {
        console.log('[fb-subscribe] Using direct user token to fetch pages and subscribe...');
        
        try {
            // Step 1: Get pages from Facebook using user token
            const pagesResp = await fetch(
                `https://graph.facebook.com/v22.0/me/accounts?access_token=${userToken}&fields=id,name,access_token`
            );
            const pagesData = await pagesResp.json();
            
            if (!pagesData.data?.length) {
                return res.status(400).json({ error: 'No pages found', details: pagesData.error || null });
            }
            
            console.log(`[fb-subscribe] Found ${pagesData.data.length} pages`);
            
            // Step 2: Subscribe each page
            const results = [];
            for (const page of pagesData.data) {
                console.log(`[fb-subscribe] Subscribing ${page.name} (${page.id})...`);
                try {
                    const subResp = await fetch(
                        `https://graph.facebook.com/v22.0/${page.id}/subscribed_apps`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subscribed_fields: SUBSCRIBED_FIELDS,
                                access_token: page.access_token,
                            }),
                        }
                    );
                    const subData = await subResp.json();
                    
                    if (subData.success) {
                        console.log(`[fb-subscribe] ✅ ${page.name} subscribed!`);
                    } else {
                        console.error(`[fb-subscribe] ❌ ${page.name} failed:`, subData.error);
                    }
                    
                    results.push({
                        pageId: page.id,
                        pageName: page.name,
                        success: !!subData.success,
                        subscribedFields: SUBSCRIBED_FIELDS,
                        error: subData.error || null,
                    });
                } catch (err) {
                    results.push({
                        pageId: page.id,
                        pageName: page.name,
                        success: false,
                        error: String(err),
                    });
                }
            }
            
            // Step 3: Also try to save tokens to Firestore (best effort)
            const APP_SECRET = process.env.FB_APP_SECRET;
            let longLivedTokens = false;
            
            if (APP_SECRET) {
                try {
                    // Exchange for long-lived user token first
                    const exchangeResp = await fetch(
                        `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`
                    );
                    if (exchangeResp.ok) {
                        const exchangeData = await exchangeResp.json();
                        // Get page tokens with long-lived user token
                        const llPagesResp = await fetch(
                            `https://graph.facebook.com/v22.0/me/accounts?access_token=${exchangeData.access_token}&fields=id,name,access_token`
                        );
                        const llPagesData = await llPagesResp.json();
                         if (llPagesData.data?.length) {
                            // Read existing page config to preserve aiMode/schedule settings
                            let existingPages: Array<{ pageId: string; aiMode?: string; schedule?: unknown[] }> = [];
                            if (bizId) {
                                const existing = await fsGet(`businesses/${bizId}/fbSettings/config`);
                                existingPages = (existing?.pages as typeof existingPages) || [];
                            }
                            
                            // Merge: update tokens but PRESERVE aiMode/schedule from existing pages
                            const pagesConfig = llPagesData.data.map((p: { id: string; name: string; access_token: string }) => {
                                const existingPage = existingPages.find(ep => ep.pageId === p.id);
                                return {
                                    ...(existingPage || {}), // preserve aiMode, schedule, etc.
                                    pageId: p.id,
                                    pageName: p.name,
                                    pageAccessToken: p.access_token,
                                    isActive: true,
                                };
                            });
                            
                            if (bizId) {
                                const path = `businesses/${bizId}/fbSettings/config`;
                                const saveData = {
                                    pages: pagesConfig,
                                    pageAccessToken: llPagesData.data[0].access_token,
                                    pageId: llPagesData.data[0].id,
                                    pageName: llPagesData.data[0].name,
                                    isConnected: true,
                                    updatedAt: new Date(),
                                };
                                
                                const fieldPaths = Object.keys(saveData).map(k => `updateMask.fieldPaths=${k}`).join('&');
                                const saveResp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(buildFirestoreDoc(saveData)),
                                });
                                longLivedTokens = saveResp.ok;
                                if (saveResp.ok) {
                                    console.log('[fb-subscribe] ✅ Long-lived tokens saved to Firestore');
                                } else {
                                    console.log('[fb-subscribe] ⚠️ Could not save to Firestore (non-critical)');
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.log('[fb-subscribe] Token exchange skipped:', err);
                }
            }
            
            const allSuccess = results.every(r => r.success);
            return res.status(allSuccess ? 200 : 207).json({
                success: allSuccess,
                longLivedTokensSaved: longLivedTokens,
                message: allSuccess 
                    ? `All ${results.length} pages subscribed successfully!` 
                    : `Some pages failed to subscribe`,
                pages: results,
            });
        } catch (err) {
            return res.status(500).json({ error: String(err) });
        }
    }

    // ═══ Firestore-based flow (existing pages) ═══
    if (!bizId) {
        return res.status(400).json({ error: 'Missing bizId parameter' });
    }

    const settings = await fsGet(`businesses/${bizId}/fbSettings/config`);
    if (!settings) {
        return res.status(400).json({ error: 'Facebook settings not found' });
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
                results.push({ pageId: page.pageId, pageName: page.pageName, status: 'error', error: String(err) });
            }
        }
        return res.status(200).json({ pages: results });
    }

    // ═══ POST: Subscribe from Firestore tokens ═══
    if (req.method === 'POST') {
        const results = [];
        for (const page of pagesArr) {
            try {
                const resp = await fetch(`https://graph.facebook.com/v22.0/${page.pageId}/subscribed_apps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscribed_fields: SUBSCRIBED_FIELDS, access_token: page.pageAccessToken }),
                });
                const data = await resp.json();
                results.push({ pageId: page.pageId, pageName: page.pageName, success: !!data.success, error: data.error || null });
            } catch (err) {
                results.push({ pageId: page.pageId, pageName: page.pageName, success: false, error: String(err) });
            }
        }

        const allSuccess = results.every(r => r.success);
        return res.status(allSuccess ? 200 : 207).json({ success: allSuccess, pages: results });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

