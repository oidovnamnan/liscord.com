// ============ AI AD COPY GENERATOR (Gemini) ============
import { GoogleGenAI } from '@google/genai';

let lastKey = '';
let client: GoogleGenAI | null = null;

function getClient(apiKey: string): GoogleGenAI {
    if (!apiKey) throw new Error('Gemini API Key байхгүй');
    if (!client || lastKey !== apiKey) {
        client = new GoogleGenAI({ apiKey });
        lastKey = apiKey;
    }
    return client;
}

interface ProductInfo {
    name: string;
    price: number;
    comparePrice?: number;
    description?: string;
    categoryName?: string;
}

/**
 * Generate ad copy for a single product
 */
export async function generateProductAdCopy(
    apiKey: string,
    product: ProductInfo,
    businessName: string,
    storefront?: string
): Promise<string> {
    const ai = getClient(apiKey);

    const prompt = `Чи Facebook сурталчилгааны мэргэжилтэн. Дараах барааны FB пост текст бич.

БАРАА:
- Нэр: ${product.name}
- Үнэ: ${product.price.toLocaleString()}₮
${product.comparePrice ? `- Хуучин үнэ: ${product.comparePrice.toLocaleString()}₮ (${Math.round((1 - product.price / product.comparePrice) * 100)}% хямдрал)` : ''}
${product.description ? `- Тайлбар: ${product.description}` : ''}
${product.categoryName ? `- Ангилал: ${product.categoryName}` : ''}
- Дэлгүүр: ${businessName}
${storefront ? `- Холбоос: ${storefront}` : ''}

ДҮРЭМ:
- 3-5 мөр, товч, хүнд хандсан
- Эможи ашигла (гэхдээ хэтэрхий олон биш)
- Үнэ, хямдрал тод онцлох
- FOMO (дуусахаас өмнө, хязгаартай) оруулж болно
- Монгол хэлээр
- Hashtag 2-3 нэмж болно
- Зөвхөн текст буцаа (тайлбар хэрэггүй)`;

    const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return resp.text?.trim() || '';
}

/**
 * Generate general ad copy for multiple products
 */
export async function generateBulkAdCopy(
    apiKey: string,
    products: ProductInfo[],
    businessName: string,
    storefront?: string
): Promise<string> {
    const ai = getClient(apiKey);

    const productList = products.map((p, i) =>
        `${i + 1}. "${p.name}" — ${p.price.toLocaleString()}₮${p.comparePrice ? ` (хуучнаар ${p.comparePrice.toLocaleString()}₮)` : ''}`
    ).join('\n');

    const prompt = `Чи Facebook сурталчилгааны мэргэжилтэн. Дараах бараануудыг нэг FB пост дээр сурталчлах текст бич.

БАРААНУУД:
${productList}

ДЭЛГҮҮР: ${businessName}
${storefront ? `ХОЛБООС: ${storefront}` : ''}

ДҮРЭМ:
- 5-8 мөр, товч, хүнд хандсан
- Бараа тус бүрийг товч дурдаж, үнийг нь онцол
- Эможи ашигла
- "Манай дэлгүүрээс" гэх мэт бизнестэй уялдсан
- FOMO оруулж болно
- Монгол хэлээр
- Hashtag 3-5 нэмж болно
- Зөвхөн текст буцаа`;

    const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return resp.text?.trim() || '';
}
