/**
 * Temporary one-time token updater endpoint
 * DELETE THIS FILE AFTER USE
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';

function toFirestoreValue(val: unknown): Record<string, unknown> {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
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

function fromFirestoreValue(val: Record<string, unknown>): unknown {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security: only allow with secret
    const secret = req.query.secret as string;
    if (secret !== 'liscord_token_update_2026') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const bizId = 'zF4bngY2zmLcUgGdvjky';
    const docPath = `businesses/${bizId}/fbSettings/config`;

    try {
        // 1. Read current doc
        const readResp = await fetch(`${FIRESTORE_BASE}/${docPath}?key=${API_KEY}`);
        if (!readResp.ok) return res.status(500).json({ error: 'Failed to read', status: readResp.status });
        const doc = await readResp.json();
        
        const fields = doc.fields;
        const pagesRaw = fields.pages?.arrayValue?.values || [];
        
        // Parse pages
        const pages: Array<Record<string, unknown>> = pagesRaw.map((p: Record<string, unknown>) => {
            const pf = (p.mapValue as { fields: Record<string, Record<string, unknown>> }).fields;
            const result: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(pf)) {
                result[k] = fromFirestoreValue(v);
            }
            return result;
        });

        const updates: string[] = [];

        // Token map
        const tokenMap: Record<string, string> = {
            '583392281525669': 'EAANVlGzHm9cBQ4OuCIcNU2mPq244xu9rt09Wta3sUYpvbrJ7TSreNJyO90BdcgYPSWukCznDrZB2bfZCPakPKO2s6hSu8msjZBWFmim5B6jvIBFFIZBZAS5PKLw1OhVZBZBPm16XiaEvbQtt9BgTtBo5u8En63JShO2AkVwwNOwe6uPuZCssr6cYiqP4ZA9ZCCVA8oBMdAZCFoZCw34CAizf8E5zrUyeoejZBS2zxYDqQioOMX5qrBOtuj2LZCtF46Jd0ZD',
            '600750406447680': 'EAANVlGzHm9cBQ7AbXmkmruvx20UJiwewgqvZBxttrpdyU2qrOvB9e31BYL6q13gWAyI1AkEtVPXktOKz0uQBEFzs7GTgQjzN7rFFah4JPhAGJ9CpF15DNM3VLLfVyLTzSP5WSui9ajowX8OGdJlWAlmQZBAM6bMJ334NL6CzSZC6l75faBErlU8PfYpwb2J9ePFQzEBpqMrmmw4cZCXebmYrlfowV2OiBRcCRmdHAAWgWjmVx7s4ZC2S9B8kZD',
        };

        for (const page of pages) {
            const pid = page.pageId as string;
            if (tokenMap[pid]) {
                page.pageAccessToken = tokenMap[pid];
                updates.push(`✅ ${page.pageName} (${pid}) — len=${tokenMap[pid].length}`);
            } else {
                updates.push(`⏭️ ${page.pageName} (${pid}) — unchanged`);
            }
        }

        // 2. Write back
        const pagesValue = toFirestoreValue(pages);
        const writeBody = JSON.stringify({
            fields: {
                pages: pagesValue,
            }
        });

        const writeResp = await fetch(
            `${FIRESTORE_BASE}/${docPath}?key=${API_KEY}&updateMask.fieldPaths=pages`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: writeBody,
            }
        );

        if (!writeResp.ok) {
            const errText = await writeResp.text();
            return res.status(500).json({ error: 'Failed to write', status: writeResp.status, details: errText });
        }

        // 3. Verify
        const verifyResp = await fetch(`${FIRESTORE_BASE}/${docPath}?key=${API_KEY}`);
        const verifyDoc = await verifyResp.json();
        const verifyPages = verifyDoc.fields.pages?.arrayValue?.values || [];
        const verification: string[] = [];
        for (const p of verifyPages) {
            const pf = (p.mapValue as { fields: Record<string, Record<string, unknown>> }).fields;
            const name = fromFirestoreValue(pf.pageName) as string;
            const token = fromFirestoreValue(pf.pageAccessToken) as string;
            const isOk = token.length < 300 ? '✅' : '❌ STILL OLD';
            verification.push(`${isOk} ${name} — token len=${token.length}`);
        }

        return res.status(200).json({
            success: true,
            updates,
            verification,
        });

    } catch (err: unknown) {
        return res.status(500).json({ error: (err as Error).message });
    }
}
