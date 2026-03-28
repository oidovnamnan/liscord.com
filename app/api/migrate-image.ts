import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

/**
 * POST /api/migrate-image
 * 
 * Downloads an image from a URL (e.g. expired Facebook CDN) and re-uploads 
 * it to Firebase Storage, returning the new permanent download URL.
 * 
 * Body: { url: string, bizId: string, productId: string, index: number }
 * Returns: { newUrl: string }
 */

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'liscord-2b529',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'liscord-2b529.firebasestorage.app',
    });
}

const bucket = admin.storage().bucket();
const db = admin.firestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, bizId, productId, index } = req.body;

        if (!url || !bizId || !productId || index === undefined) {
            return res.status(400).json({ error: 'Missing required fields: url, bizId, productId, index' });
        }

        console.log(`[migrate-image] Downloading: ${url.substring(0, 80)}...`);

        // 1. Download the image from the source URL
        const imgRes = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!imgRes.ok) {
            return res.status(400).json({ 
                error: `Failed to download image: HTTP ${imgRes.status}`,
                expired: imgRes.status === 403 || imgRes.status === 404,
            });
        }

        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        const buffer = Buffer.from(await imgRes.arrayBuffer());

        if (buffer.length < 100) {
            return res.status(400).json({ error: 'Downloaded file is too small, likely invalid' });
        }

        // 2. Determine file extension from content type
        const extMap: Record<string, string> = {
            'image/jpeg': 'jpg', 'image/jpg': 'jpg',
            'image/png': 'png', 'image/webp': 'webp',
            'image/gif': 'gif',
        };
        const ext = extMap[contentType] || 'jpg';
        const fileName = `${Date.now()}_migrated_${index}.${ext}`;
        const filePath = `businesses/${bizId}/products/${fileName}`;

        // 3. Upload to Firebase Storage
        const file = bucket.file(filePath);
        await file.save(buffer, {
            metadata: { contentType },
            public: true,
        });

        // 4. Get the public download URL
        const [metadata] = await file.getMetadata();
        const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

        console.log(`[migrate-image] Uploaded: ${filePath} (${buffer.length} bytes)`);

        // 5. Update the product document in Firestore
        const productRef = db.collection(`businesses/${bizId}/products`).doc(productId);
        const productDoc = await productRef.get();
        
        if (productDoc.exists) {
            const data = productDoc.data();
            const images = [...(data?.images || [])];
            if (index < images.length) {
                images[index] = newUrl;
                await productRef.update({ images });
                console.log(`[migrate-image] Updated product ${productId} image[${index}]`);
            }
        }

        return res.status(200).json({ newUrl, size: buffer.length });

    } catch (err: any) {
        console.error('[migrate-image] Error:', err);
        return res.status(500).json({ error: err.message || 'Internal error' });
    }
}
