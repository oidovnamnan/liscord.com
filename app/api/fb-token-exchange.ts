/**
 * Facebook Token Exchange API
 * 
 * Exchanges a short-lived User Access Token for long-lived Page Access Tokens.
 * 
 * Steps:
 *   1. Exchange short-lived user token → long-lived user token
 *   2. Use long-lived user token → get page tokens (these are permanent/never-expire)
 *   3. Save page tokens to Firestore
 * 
 * POST: { bizId, shortLivedToken }  — Exchange & save all page tokens
 * GET:  ?token=xxx                  — Debug token info
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const APP_ID = process.env.FB_APP_ID || '';
const APP_SECRET = process.env.FB_APP_SECRET || '';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';

// Firestore helpers (minimal)
function toFirestoreValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    if (typeof val === 'object') {
        const fields: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function buildFirestoreDoc(data: Record<string, unknown>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        fields[k] = toFirestoreValue(v);
    }
    return { fields };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // GET: Debug token
    if (req.method === 'GET') {
        const token = req.query.token as string;
        if (!token) return res.status(400).json({ error: 'Missing token parameter' });

        try {
            const debugResp = await fetch(
                `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${APP_ID}|${APP_SECRET}`
            );
            const debugData = await debugResp.json();
            return res.status(200).json(debugData);
        } catch (err) {
            return res.status(500).json({ error: 'Failed to debug token', details: String(err) });
        }
    }

    // POST: Exchange tokens
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bizId, shortLivedToken } = req.body;

    if (!bizId || !shortLivedToken) {
        return res.status(400).json({ error: 'Missing bizId or shortLivedToken' });
    }

    if (!APP_SECRET) {
        return res.status(500).json({ error: 'FB_APP_SECRET not configured in environment variables' });
    }

    // Auth: Verify request origin + shared secret
    const origin = req.headers.origin || '';
    const allowedOrigins = ['https://www.liscord.com', 'https://liscord.com', 'http://localhost:5173', 'http://localhost:3000'];
    const authSecret = req.headers['x-api-secret'] as string;
    if (!allowedOrigins.includes(origin) && authSecret !== APP_SECRET) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        // Step 1: Exchange short-lived token → long-lived user token
        console.log('[fb-token] Step 1: Exchanging for long-lived user token...');
        const exchangeResp = await fetch(
            `https://graph.facebook.com/v22.0/oauth/access_token?` +
            `grant_type=fb_exchange_token&` +
            `client_id=${APP_ID}&` +
            `client_secret=${APP_SECRET}&` +
            `fb_exchange_token=${shortLivedToken}`
        );

        if (!exchangeResp.ok) {
            const err = await exchangeResp.json();
            console.error('[fb-token] Exchange failed:', err);
            return res.status(400).json({ error: 'Token exchange failed', details: err });
        }

        const exchangeData = await exchangeResp.json();
        const longLivedUserToken = exchangeData.access_token;
        console.log(`[fb-token] ✅ Got long-lived user token (expires_in: ${exchangeData.expires_in}s)`);

        // Step 2: Get all page tokens using long-lived user token
        console.log('[fb-token] Step 2: Fetching page tokens...');
        const pagesResp = await fetch(
            `https://graph.facebook.com/v22.0/me/accounts?access_token=${longLivedUserToken}&fields=id,name,access_token`
        );

        if (!pagesResp.ok) {
            const err = await pagesResp.json();
            console.error('[fb-token] Pages fetch failed:', err);
            return res.status(400).json({ error: 'Failed to fetch pages', details: err });
        }

        const pagesData = await pagesResp.json();
        const pages = (pagesData.data || []) as Array<{ id: string; name: string; access_token: string }>;

        if (pages.length === 0) {
            return res.status(400).json({ error: 'No pages found. Make sure you granted page permissions.' });
        }

        console.log(`[fb-token] ✅ Found ${pages.length} pages: ${pages.map(p => p.name).join(', ')}`);

        // Step 3: Build pages array for Firestore & save
        const pagesConfig = pages.map(p => ({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.access_token,
            isActive: true,
        }));

        // Save to Firestore
        const path = `businesses/${bizId}/fbSettings/config`;
        const fieldPaths = ['pages', 'pageAccessToken', 'pageId', 'pageName', 'isConnected', 'updatedAt']
            .map(k => `updateMask.fieldPaths=${k}`).join('&');

        const saveData = {
            pages: pagesConfig,
            pageAccessToken: pages[0].access_token,
            pageId: pages[0].id,
            pageName: pages[0].name,
            isConnected: true,
            updatedAt: new Date(),
        };

        const saveResp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(saveData)),
        });

        if (!saveResp.ok) {
            const errText = await saveResp.text();
            console.error('[fb-token] Firestore save failed:', errText);
            return res.status(500).json({ error: 'Failed to save tokens', details: errText });
        }

        console.log(`[fb-token] ✅ Saved ${pages.length} page tokens to Firestore`);

        // Step 4: Verify one token by fetching page info
        const verifyResp = await fetch(
            `https://graph.facebook.com/v22.0/${pages[0].id}?fields=name,id&access_token=${pages[0].access_token}`
        );
        const verifyData = await verifyResp.json();

        return res.status(200).json({
            success: true,
            pagesFound: pages.length,
            pages: pages.map(p => ({ id: p.id, name: p.name, tokenPreview: `${p.access_token.substring(0, 15)}...` })),
            verification: verifyData,
            message: `${pages.length} page token(s) saved successfully! These are long-lived (permanent) tokens.`,
        });

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Internal error';
        console.error('[fb-token] Error:', err);
        return res.status(500).json({ error: errMsg });
    }
}
