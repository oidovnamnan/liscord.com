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
    confidence: number; // 0-100 AI confidence
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
    } catch (e: unknown) {
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

// ============ AI Product Extraction ============

export async function extractProductFromPost(post: FBPost, apiKey: string): Promise<FBExtractedProduct | null> {
    const message = post.message || '';

    // Skip posts without meaningful text
    if (!message || message.trim().length < 10) return null;

    const client = getClient(apiKey);
    const images = extractImagesFromPost(post);

    const prompt = `
Та Facebook page-ийн пост-оос бараа/бүтээгдэхүүний мэдээллийг задалж байна.

ПОСТ:
"""
${message}
"""

ЗУРАГ ТОО: ${images.length}

ДААЛГАВАР:
1. Энэ пост нь бараа/бүтээгдэхүүний пост мөн эсэхийг тодорхойлох.
2. Бараа мөн бол дараах мэдээллийг задлах:
   - name: Барааны нэр (товч, тодорхой)
   - description: Тайлбар (постын текстээс)
   - salePrice: Зарах үнэ (тоо, 0 хэрэв олдохгүй бол)
   - costPrice: Өртөг (тоо, 0 хэрэв олдохгүй бол)
   - categoryName: Бүтээгдэхүүний ангилалын нэр (таамаглах, жишээ: "Хувцас", "Электроник", "Гоо сайхан")
   - isProduct: true/false

ТООН УТГЫГ ЗӨВХӨН ТООГООР бичнэ. Мөнгөн тэмдэг, таслал зэргийг оруулахгүй.
Хэрэв үнэ "45,000₮" бол 45000 гэж бичнэ.

JSON ХАРИУ:
{
  "isProduct": true,
  "name": "...",
  "description": "...",
  "salePrice": 0,
  "costPrice": 0,
  "categoryName": "...",
  "confidence": 85
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

        return {
            name: parsed.name || 'Нэргүй бараа',
            description: parsed.description || message.substring(0, 200),
            salePrice: Number(parsed.salePrice) || 0,
            costPrice: Number(parsed.costPrice) || 0,
            categoryName: parsed.categoryName || 'Бусад',
            images,
            fbPostId: post.id,
            fbPostUrl: `https://facebook.com/${post.id}`,
            fbCreatedTime: new Date(post.created_time),
            status: 'new',
            isSelected: true,
            confidence: parsed.confidence || 50
        };
    } catch (error) {
        console.error('AI extraction error for post:', post.id, error);
        return null;
    }
}

export async function extractProductsFromPosts(
    posts: FBPost[],
    apiKey: string,
    onProgress?: (current: number, total: number, product?: FBExtractedProduct) => void
): Promise<FBExtractedProduct[]> {
    const products: FBExtractedProduct[] = [];

    for (let i = 0; i < posts.length; i++) {
        onProgress?.(i + 1, posts.length);
        const product = await extractProductFromPost(posts[i], apiKey);
        if (product) {
            products.push(product);
            onProgress?.(i + 1, posts.length, product);
        }
    }

    return products;
}

// ============ Duplicate Detection ============

export function detectDuplicates(
    extracted: FBExtractedProduct[],
    existing: { id: string; name: string; sku: string; images: string[] }[]
): FBExtractedProduct[] {
    return extracted.map(product => {
        const nameLower = product.name.toLowerCase().trim();

        for (const ex of existing) {
            const exNameLower = ex.name.toLowerCase().trim();

            // Exact name match
            if (nameLower === exNameLower) {
                return {
                    ...product,
                    status: 'duplicate' as const,
                    duplicateOf: ex.id,
                    duplicateOfName: ex.name,
                    duplicateAction: 'skip' as const
                };
            }

            // Fuzzy name match (contains or similarity > 80%)
            if (nameLower.includes(exNameLower) || exNameLower.includes(nameLower)) {
                if (Math.min(nameLower.length, exNameLower.length) / Math.max(nameLower.length, exNameLower.length) > 0.7) {
                    return {
                        ...product,
                        status: 'duplicate' as const,
                        duplicateOf: ex.id,
                        duplicateOfName: ex.name,
                        duplicateAction: 'skip' as const
                    };
                }
            }
        }

        return product;
    });
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
