import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

/**
 * POST /api/migrate-image
 * 
 * Proxies image download from external URLs (e.g. Facebook CDN).
 * Returns image as base64 so the client can upload to Firebase Storage.
 * This avoids CORS issues when downloading from Facebook CDN.
 * 
 * Body: { url: string }
 * Returns: { base64: string, contentType: string, size: number }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'Missing required field: url' });
        }

        console.log(`[migrate-image] Downloading: ${url.substring(0, 100)}...`);

        // Download the image from the source URL
        const imgRes = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*',
            },
        });

        if (!imgRes.ok) {
            return res.status(400).json({ 
                error: `Failed to download image: HTTP ${imgRes.status}`,
                expired: imgRes.status === 403 || imgRes.status === 404,
            });
        }

        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 500) {
            return res.status(400).json({ error: 'Downloaded file too small', expired: true });
        }

        console.log(`[migrate-image] Downloaded ${buffer.length} bytes (${contentType})`);

        // Return as base64 for client-side Firebase Storage upload
        return res.status(200).json({ 
            base64: buffer.toString('base64'),
            contentType,
            size: buffer.length,
        });

    } catch (err: any) {
        console.error('[migrate-image] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
}
