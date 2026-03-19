import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// ═══ Firestore REST API Helpers ═══
function toFirestoreValue(val: any): any {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
    if (typeof val === 'object') {
        const fields: any = {};
        for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

function buildFirestoreDoc(data: any): any {
    const fields: any = {};
    for (const [k, v] of Object.entries(data)) {
        fields[k] = toFirestoreValue(v);
    }
    return { fields };
}

function fromFirestoreValue(val: any): any {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        return (val.arrayValue.values || []).map((v: any) => fromFirestoreValue(v));
    }
    if ('mapValue' in val) {
        const result: any = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            result[k] = fromFirestoreValue(v);
        }
        return result;
    }
    return null;
}

function fromFirestoreDoc(doc: any): any {
    const result: any = { id: doc.name.split('/').pop() };
    for (const [k, v] of Object.entries(doc.fields || {})) {
        result[k] = fromFirestoreValue(v);
    }
    return result;
}

async function listDocs(collectionPath: string) {
    let url = `${FIRESTORE_BASE}/${collectionPath}?key=${API_KEY}&pageSize=300`;
    const docs = [];
    while (true) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`List failed: ${res.status}`);
        const data: any = await res.json();
        if (data.documents) {
            docs.push(...data.documents.map(fromFirestoreDoc));
        }
        if (data.nextPageToken) {
            url = `${FIRESTORE_BASE}/${collectionPath}?key=${API_KEY}&pageSize=300&pageToken=${data.nextPageToken}`;
        } else {
            break;
        }
    }
    return docs;
}

async function fsMerge(path: string, data: any): Promise<boolean> {
    try {
        data.updatedAt = new Date();
        const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}&${fieldPaths}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildFirestoreDoc(data)),
        });
        if (!resp.ok) console.error(`[fsMerge] FAILED ${path}: ${resp.status}`);
        return resp.ok;
    } catch (err) {
        console.error(`[fsMerge] ERROR:`, err);
        return false;
    }
}

// ═══ Main Script ═══
async function main() {
    console.log('--- Starting AI Product Enrichment ---');
    if (!GEMINI_KEY) {
        console.error('Missing GEMINI_API_KEY!');
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    console.log('Fetching businesses...');
    const businesses = await listDocs('businesses');
    console.log(`Found ${businesses.length} businesses.`);

    let totalEnriched = 0;

    for (const biz of businesses) {
        console.log(`\nProcessing business: ${biz.name} (${biz.id})`);
        
        try {
            const products = await listDocs(`businesses/${biz.id}/products`);
            
            // Only consider products with images and WITHOUT tags
            const productsToEnrich = products.filter(p => !p.isDeleted && p.images?.length > 0 && (!p.tags || p.tags.length === 0));
            console.log(`  Found ${productsToEnrich.length} products to enrich out of ${products.length} active products.`);

            for (const p of productsToEnrich) {
                console.log(`  - Generating tags for product: ${p.name || p.id}`);
                try {
                    const imageUrl = p.images[0];
                    const imgRes = await fetch(imageUrl);
                    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
                    
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const inlineData = {
                        data: buffer.toString('base64'),
                        mimeType: imgRes.headers.get('content-type') || 'image/jpeg'
                    };

                    const prompt = `Analyze this product image and generate up to 10 highly relevant search tags (keywords) in MONGOLIAN. 
Product name: "${p.name || 'Unknown'}"
Product description: "${p.description || 'None'}"

Rules for tags:
1. Short, concise keywords (1-2 words max per tag).
2. Must be in Mongolian language.
3. Include synonyms, related category words, materials, colors, or usage scenarios visible in the image.
4. Output ONLY a comma-separated list of tags, nothing else. No markdown, no bullet points.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: [{ role: 'user', parts: [{ inlineData }, { text: prompt }] }]
                    });

                    const reply = response.text || '';
                    const tags = reply.split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 10);
                    
                    if (tags.length > 0) {
                        const success = await fsMerge(`businesses/${biz.id}/products/${p.id}`, { tags });
                        if (success) {
                            console.log(`    ✓ Updated tags: ${tags.join(', ')}`);
                            totalEnriched++;
                        } else {
                            console.log(`    ✕ Failed to save tags to Firestore.`);
                        }
                    } else {
                        console.log(`    - API returned 0 tags.`);
                    }
                    
                    // Throttle to respect rate limits
                    await new Promise(r => setTimeout(r, 1000));
                } catch (err: any) {
                    console.error(`    ✕ Error on product ${p.name || p.id}: ${err.message}`);
                }
            }
        } catch(e) {
            console.error(`  Error processing business ${biz.name}:`, e);
        }
    }
    
    console.log(`\n--- Completed AI Enrichment! Enriched ${totalEnriched} products across all businesses. ---`);
}

main().catch(console.error);
