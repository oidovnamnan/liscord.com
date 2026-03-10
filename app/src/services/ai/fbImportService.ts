import { GoogleGenAI } from '@google/genai';

let lastApiKey = '';
let aiClient: GoogleGenAI | null = null;

function getClient(apiKey: string): GoogleGenAI {
    if (!apiKey) throw new Error('Gemini API Key байхгүй байна. Super Admin тохиргооноос нэмнэ үү.');
    if (!aiClient || lastApiKey !== apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
        lastApiKey = apiKey;
    }
    return aiClient;
}

// ============ Types ============

export interface FBExtractedProduct {
    name: string;
    description: string;
    salePrice: number;
    costPrice: number;
    categoryName: string;
    images: string[];
    fbPostId: string;
    fbPostUrl: string;
    fbCreatedTime: Date;
    status: 'new' | 'duplicate' | 'approved' | 'skipped';
    duplicateOf?: string;
    duplicateOfName?: string;
    duplicateAction?: 'skip' | 'update' | 'merge';
    isSelected: boolean;
    confidence: number;
    sku: string;
    variations?: { name: string; sku: string; quantity: number }[];
}

export interface FBPost {
    id: string;
    message?: string;
    full_picture?: string;
    created_time: string;
    attachments?: {
        data: Array<{
            media?: { image?: { src: string } };
            subattachments?: {
                data: Array<{
                    media?: { image?: { src: string } };
                }>;
            };
        }>;
    };
}

// ============ Facebook Graph API ============

export async function fetchFBPageId(pageUrl: string, accessToken: string): Promise<string> {
    try {
        const urlObj = new URL(pageUrl);
        let pageIdentifier = '';

        // Handle profile.php?id=xxx
        if (urlObj.pathname.includes('profile.php')) {
            pageIdentifier = urlObj.searchParams.get('id') || '';
        } else {
            // Handle facebook.com/pagename
            pageIdentifier = urlObj.pathname.split('/').filter(p => p && p !== 'groups').pop() || '';
        }

        if (!pageIdentifier) throw new Error('Page URL-ээс ID олж чадсангүй');

        // Try to get ID via Graph API
        const resp = await fetch(`https://graph.facebook.com/v21.0/${pageIdentifier}?fields=id&access_token=${accessToken}`);
        const data = await resp.json();

        if (data.id) return data.id;

        // If the identifier is already a numeric ID, return it as fallback
        if (/^\d+$/.test(pageIdentifier)) return pageIdentifier;

        throw new Error(data.error?.message || 'Facebook Page олдсонгүй');
    } catch (e: any) {
        // Final fallback: try regex to find numeric ID in URL
        const match = pageUrl.match(/(?:id=|\/)([0-9]{10,})/);
        if (match && match[1]) return match[1];

        throw new Error(e.message || 'Page URL буруу байна');
    }
}

export async function fetchFBPosts(
    pageId: string,
    accessToken: string,
    since: Date,
    until: Date
): Promise<FBPost[]> {
    const sinceTs = Math.floor(since.getTime() / 1000);
    const untilTs = Math.floor(until.getTime() / 1000);

    const allPosts: FBPost[] = [];
    let url = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=id,message,full_picture,created_time,attachments{media,subattachments}&since=${sinceTs}&until=${untilTs}&limit=100&access_token=${accessToken}`;

    while (url) {
        const resp = await fetch(url);
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.error?.message || 'Постууд татахад алдаа гарлаа');
        }
        const data = await resp.json();
        if (data.data) allPosts.push(...data.data);
        url = data.paging?.next || '';
    }

    return allPosts;
}

export function extractImagesFromPost(post: FBPost): string[] {
    const images: string[] = [];

    if (post.full_picture) {
        images.push(post.full_picture);
    }

    if (post.attachments?.data) {
        for (const attachment of post.attachments.data) {
            if (attachment.media?.image?.src) {
                const src = attachment.media.image.src;
                if (!images.includes(src)) images.push(src);
            }
            if (attachment.subattachments?.data) {
                for (const sub of attachment.subattachments.data) {
                    if (sub.media?.image?.src) {
                        const src = sub.media.image.src;
                        if (!images.includes(src)) images.push(src);
                    }
                }
            }
        }
    }

    return images;
}

// ============ SKU Generator ============

const CATEGORY_PREFIXES: Record<string, string> = {
    'электроник': 'ELK', 'хувцас': 'HVC', 'гоо сайхан': 'GOS',
    'гэр ахуйн бараа': 'GAB', 'хүнс': 'HNS', 'спорт': 'SPR',
    'тоглоом': 'TGL', 'эрүүл мэнд': 'ERM', 'ном': 'NOM',
    'гар ахуйн бараа': 'GAB', 'гар ахуйн хэрэгсэл': 'GAH',
    'хүүхдийн бараа': 'HHB', 'гутал': 'GTL', 'цүнх': 'TSN',
};

function generateSKU(categoryName: string): string {
    const lower = categoryName.toLowerCase();
    let prefix = 'LSC';
    for (const [key, val] of Object.entries(CATEGORY_PREFIXES)) {
        if (lower.includes(key)) { prefix = val; break; }
    }
    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${rand()}`;
}

// ============ AI Product Extraction ============

export async function extractProductFromPost(
    post: FBPost,
    apiKey: string,
    existingCategories: string[] = []
): Promise<FBExtractedProduct | null> {
    const message = post.message || '';
    const images = extractImagesFromPost(post);

    // Skip posts without any text AND no images
    if ((!message || message.trim().length < 3) && images.length === 0) return null;

    const client = getClient(apiKey);

    const prompt = `
Та Facebook page-ийн пост-оос бараа/бүтээгдэхүүний мэдээллийг задалж, ЦЭВЭРЛЭЖ байна.

ПОСТ:
"""
${message}
"""

ZУРАГ ТОО: ${images.length}

${existingCategories.length > 0 ? `ОДОО БАЙГАА АНГИЛАЛУУД (эдгээрээс сонгох нь илүүд үзнэ):
${existingCategories.map(c => `- ${c}`).join('\n')}
Эдгээрт таарахгүй бол шинэ ангилал нэрлэж болно.
` : ''}
ДААЛГАВАР:
1. Энэ пост нь бараа/бүтээгдэхүүний пост мөн эсэхийг тодорхойлох.
2. Бараа мөн бол дараах мэдээллийг задлах:

НЭР (name):
- Барааны нэрийг товч, тодорхой бичих
- Код/артикул (жишээ: "#ABC123", "SKU-001") зэргийг АВАХГҮЙ, ХАСЧ хаях
- Эможи, тусгай тэмдэгт (🔥✅💫🎉⭐️➡️ гм) БҮРЭН ХАСАХ

ТАЙЛБАР (description):
- Постын текстийг цэвэрлэж, зөвхөн барааны тайлбар болгох
- Дараах зүйлсийг ЗААВАЛ ХАСАХ:
  • Эможи, тусгай тэмдэгтүүд (🔥✅💫🎉⭐️➡️ гм)
  • "Захиалга өгөх бол чат бичээрэй", "DM бичнэ үү", "Inbox-оор холбогдоорой" төрлийн үгс
  • "Like, Share, Follow" төрлийн хүсэлтүүд
  • Утасны дугаар, хаяг (хэрэв байвал)
- Хэрэв тайлбар дэндүү богино бол, постын мэдээлэл дээр тулгуурлаж 1-2 өгүүлбэрээр өргөтгөж бичих
- Мэргэжлийн, цэвэрхэн, дэлгүүрийн каталогт тохирсон хэл найруулгатай байх

ХУВИЛБАРУУД (variations):
- Хэрэв постонд өнгө, хэмжээ, багц зэрэг сонголт байвал тус тусад нь хувилбар үүсгэх
- Жишээ: "S, M, L, XL" → variations: [{name: "S"}, {name: "M"}, {name: "L"}, {name: "XL"}]
- Жишээ: "Хар, Цагаан, Улаан" → variations: [{name: "Хар"}, {name: "Цагаан"}, {name: "Улаан"}]
- Хувилбар байхгүй бол хоосон array []

ТООН УТГЫГ ЗӨВХӨН ТООГООР бичнэ. "45,000₮" → 45000

JSON ХАРИУ:
{
  "isProduct": true,
  "name": "Цэвэрхэн барааны нэр",
  "description": "Цэвэрлэгдсэн, мэргэжлийн тайлбар",
  "salePrice": 0,
  "costPrice": 0,
  "categoryName": "Ангилал",
  "confidence": 85,
  "variations": [{"name": "S"}, {"name": "M"}]
}

Хэрэв бараа БИSH бол: {"isProduct": false, "confidence": 0}
`;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const rawText = response.text || '{}';
        let parsed: any;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(cleaned);
        }

        if (!parsed.isProduct) return null;

        const categoryName = parsed.categoryName || 'Бусад';
        const sku = generateSKU(categoryName);
        const variations = (parsed.variations || []).map((v: any, i: number) => ({
            id: Math.random().toString(36).substring(2, 9),
            name: v.name || `Хувилбар ${i + 1}`,
            sku: `${sku}-${(i + 1).toString().padStart(2, '0')}`,
            quantity: 0
        }));

        return {
            name: parsed.name || 'Нэргүй бараа',
            description: parsed.description || message.substring(0, 200),
            salePrice: Number(parsed.salePrice) || 0,
            costPrice: Number(parsed.costPrice) || 0,
            categoryName,
            images,
            fbPostId: post.id,
            fbPostUrl: `https://facebook.com/${post.id}`,
            fbCreatedTime: new Date(post.created_time),
            status: 'new',
            isSelected: true,
            confidence: parsed.confidence || 50,
            sku,
            variations: variations.length > 0 ? variations : undefined
        };
    } catch (error: any) {
        console.warn('[FB Import] AI extraction failed for post:', post.id, error?.message || error);

        // Fallback: if post has images and some text, create a basic product
        if (images.length > 0 && message.length > 5) {
            const priceMatch = message.match(/(\d[\d,.']+)\s*[₮₹$€¥]/)?.[1] || message.match(/[₮₹$€¥]\s*(\d[\d,.']+)/)?.[1];
            const price = priceMatch ? Number(priceMatch.replace(/[,.'+]/g, '')) : 0;

            return {
                name: message.substring(0, 80).split('\n')[0] || 'Нэргүй бараа',
                description: message.substring(0, 200),
                salePrice: price,
                costPrice: 0,
                categoryName: 'Бусад',
                images,
                fbPostId: post.id,
                fbPostUrl: `https://facebook.com/${post.id}`,
                fbCreatedTime: new Date(post.created_time),
                status: 'new',
                isSelected: true,
                confidence: 30,
                sku: generateSKU('Бусад')
            };
        }
        return null;
    }
}

export async function extractProductsFromPosts(
    posts: FBPost[],
    apiKey: string,
    onProgress?: (current: number, total: number, product?: FBExtractedProduct) => void,
    existingCategories: string[] = []
): Promise<FBExtractedProduct[]> {
    const products: FBExtractedProduct[] = [];
    const DELAY_MS = 500; // 0.5s between requests (paid tier has high limits)

    for (let i = 0; i < posts.length; i++) {
        onProgress?.(i + 1, posts.length);

        // Rate limit delay (skip for first request)
        if (i > 0) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        let product = await extractProductFromPost(posts[i], apiKey, existingCategories);

        // If rate limited (429), wait longer and retry once
        if (!product && posts[i].message && posts[i].message!.length > 3) {
            // Check if it was a rate limit by trying again after longer wait
            await new Promise(r => setTimeout(r, 15000)); // wait 15s
            product = await extractProductFromPost(posts[i], apiKey, existingCategories);
        }

        if (product) {
            products.push(product);
            onProgress?.(i + 1, posts.length, product);
        }
    }

    return products;
}

// ============ Duplicate Detection ============

// Tokenize name into meaningful words (remove noise)
function tokenize(name: string): string[] {
    return name
        .toLowerCase()
        .replace(/[^\u0400-\u04ffa-z0-9\s]/gi, ' ') // keep cyrillic + latin + numbers
        .split(/\s+/)
        .filter(w => w.length > 1); // skip single chars
}

// Calculate word overlap similarity (0-100)
function wordSimilarity(a: string[], b: string[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    const setA = new Set(a);
    const setB = new Set(b);
    let matches = 0;
    for (const word of setA) {
        if (setB.has(word)) matches++;
        // Also check partial word matches (e.g. "витамин" matches "витамины")
        else {
            for (const bw of setB) {
                if (word.length > 3 && bw.length > 3 && (word.includes(bw) || bw.includes(word))) {
                    matches += 0.8;
                    break;
                }
            }
        }
    }
    const shorter = Math.min(setA.size, setB.size);
    return (matches / shorter) * 100;
}

export function detectDuplicates(
    extracted: FBExtractedProduct[],
    existing: { id: string; name: string; sku: string; images: string[] }[]
): FBExtractedProduct[] {
    const result: FBExtractedProduct[] = [];
    // Track already-seen products within this batch (fbPostId → index in result)
    const seenInBatch: { name: string; words: string[]; index: number }[] = [];

    for (const product of extracted) {
        const nameLower = product.name.toLowerCase().trim();
        const nameWords = tokenize(product.name);

        // === CHECK 1: Against existing DB products ===
        let dbMatch: { id: string; name: string; score: number } | null = null;

        for (const ex of existing) {
            const exNameLower = ex.name.toLowerCase().trim();

            if (nameLower === exNameLower) {
                dbMatch = { id: ex.id, name: ex.name, score: 100 };
                break;
            }

            const exWords = tokenize(ex.name);
            const score = wordSimilarity(nameWords, exWords);
            if (score > (dbMatch?.score || 0)) {
                dbMatch = { id: ex.id, name: ex.name, score };
            }
        }

        if (dbMatch && dbMatch.score >= 40) {
            console.log(`[FB Import] DB duplicate: "${product.name}" ≈ "${dbMatch.name}" (${dbMatch.score.toFixed(0)}%)`);
            result.push({
                ...product,
                status: 'duplicate' as const,
                duplicateOf: dbMatch.id,
                duplicateOfName: dbMatch.name,
                duplicateAction: 'skip' as const
            });
            continue;
        }

        // === CHECK 2: Against already-extracted products in this batch ===
        let batchMatch: { index: number; name: string; score: number } | null = null;

        for (const seen of seenInBatch) {
            if (nameLower === seen.name) {
                batchMatch = { index: seen.index, name: seen.name, score: 100 };
                break;
            }

            const score = wordSimilarity(nameWords, seen.words);
            if (score > (batchMatch?.score || 0)) {
                batchMatch = { index: seen.index, name: seen.name, score };
            }
        }

        if (batchMatch && batchMatch.score >= 50) {
            // This is a duplicate within the batch — skip it (keep the first one)
            console.log(`[FB Import] Batch duplicate: "${product.name}" ≈ "${batchMatch.name}" (${batchMatch.score.toFixed(0)}%) — skipping`);
            // Merge images from the duplicate into the first occurrence
            const firstProduct = result[batchMatch.index];
            if (firstProduct) {
                const mergedImages = [...firstProduct.images];
                for (const img of product.images) {
                    if (!mergedImages.includes(img)) mergedImages.push(img);
                }
                result[batchMatch.index] = { ...firstProduct, images: mergedImages };
            }
            // Don't add this product — it's a batch duplicate
            continue;
        }

        // === NEW: Add to results and track ===
        seenInBatch.push({ name: nameLower, words: nameWords, index: result.length });
        result.push(product);
    }

    return result;
}

// ============ Image Upload Helper ============

export async function downloadAndUploadImage(imageUrl: string, bizId: string): Promise<string | null> {
    try {
        const resp = await fetch(imageUrl);
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const ext = blob.type === 'image/png' ? '.png' : '.jpg';
        const fileName = `fb_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
        const file = new File([blob], fileName, { type: blob.type });

        const { storageService } = await import('../storage');
        const path = `businesses/${bizId}/products/${fileName}`;
        return await storageService.uploadImage(file, path);
    } catch (error) {
        console.error('Image download/upload error:', error);
        return null;
    }
}

export async function uploadAllImages(
    images: string[],
    bizId: string,
    onProgress?: (current: number, total: number) => void
): Promise<string[]> {
    const uploaded: string[] = [];
    for (let i = 0; i < images.length; i++) {
        onProgress?.(i + 1, images.length);
        const url = await downloadAndUploadImage(images[i], bizId);
        if (url) uploaded.push(url);
    }
    return uploaded;
}
