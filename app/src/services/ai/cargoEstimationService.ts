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

export interface CargoEstimation {
    productId: string;
    suggestedCargoTypeId: string;
    suggestedCargoTypeName: string;
    suggestedCargoValue: number;
    confidence: number;
}

interface ProductForEstimation {
    id: string;
    name: string;
    categoryName: string;
    image?: string;
}

interface CargoTypeInfo {
    id: string;
    name: string;
    fee: number;
}

// ============ Batch Estimation ============

const BATCH_SIZE = 10;
const DELAY_MS = 600;

/**
 * Estimate cargo size/type for a batch of products using Gemini AI.
 * Processes in batches of 10 for efficiency.
 */
export async function estimateCargoForProducts(
    products: ProductForEstimation[],
    cargoTypes: CargoTypeInfo[],
    apiKey: string,
    onProgress?: (current: number, total: number) => void
): Promise<Record<string, CargoEstimation>> {
    const client = getClient(apiKey);
    const results: Record<string, CargoEstimation> = {};

    if (cargoTypes.length === 0) {
        throw new Error('Каргоны төрөл тохируулаагүй байна. Эхлээд Тохиргоо → Сорсинг хэсэгт каргоны төрлүүд нэмнэ үү.');
    }

    // Process in batches
    const batches: ProductForEstimation[][] = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        batches.push(products.slice(i, i + BATCH_SIZE));
    }

    let processed = 0;

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];

        if (batchIdx > 0) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        try {
            const batchResults = await estimateBatch(client, batch, cargoTypes);

            for (const result of batchResults) {
                results[result.productId] = result;
            }
        } catch (error) {
            console.warn(`[Cargo Estimation] Batch ${batchIdx + 1} failed:`, error);
            // Mark failed products with default
            for (const product of batch) {
                results[product.id] = {
                    productId: product.id,
                    suggestedCargoTypeId: cargoTypes[0].id,
                    suggestedCargoTypeName: cargoTypes[0].name,
                    suggestedCargoValue: 1,
                    confidence: 0,
                };
            }
        }

        processed += batch.length;
        onProgress?.(processed, products.length);
    }

    return results;
}

async function estimateBatch(
    client: GoogleGenAI,
    products: ProductForEstimation[],
    cargoTypes: CargoTypeInfo[]
): Promise<CargoEstimation[]> {
    const cargoTypesList = cargoTypes.map(ct => `- "${ct.name}" (${ct.fee.toLocaleString()}₮)`).join('\n');

    const productsList = products.map((p, i) =>
        `${i + 1}. ID: "${p.id}" | Нэр: "${p.name}" | Ангилал: "${p.categoryName || 'Тодорхойгүй'}"`
    ).join('\n');

    const prompt = `
Та бүтээгдэхүүний ОВОР ХЭМЖЭЭГ тодорхойлж, каргоны ангилалд хуваарилж байна.

КАРГОНЫ АНГИЛАЛУУД:
${cargoTypesList}

БҮТЭЭГДЭХҮҮНҮҮД:
${productsList}

ДААЛГАВАР:
Бараа тус бүрд хамгийн тохирох каргоны ангилалыг сонгоно уу.
- Барааны нэр, ангилалаас овор хэмжээг таамаглана
- cargoValue нь нэгж тоо (ихэвчлэн 1, том зүйлд 2-3)
- confidence нь 0-100 хооронд (таамаглалын итгэл)

ДҮРЭМ:
- Хүнс (жижиг савтай, витамин, чихэр) → жижиг
- Гоо сайхан, ариун цэвэр → жижиг
- Гэр ахуйн бараа, тоглоом → дунд~том
- Алкогол, шингэн → тусгай (хэврэг, хүнд)
- Цахилгаан бараа (жижиг) → жижиг~дунд
- Том тоног төхөөрөмж → том
- Энгийн бүтээгдэхүүн → жижигт ойр

JSON ХАРИУ (array):
[
  {
    "productId": "xxx",
    "cargoSizeCategory": "Жижиг бараа",
    "cargoValue": 1,
    "confidence": 80
  }
]
`;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
    });

    const rawText = response.text || '[]';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any[];
    try {
        parsed = JSON.parse(rawText);
    } catch {
        const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
    }

    if (!Array.isArray(parsed)) parsed = [parsed];

    return parsed.map((item: { productId: string; cargoSizeCategory: string; cargoValue: number; confidence: number }) => {
        const matched = cargoTypes.find(ct =>
            ct.name.toLowerCase() === (item.cargoSizeCategory || '').toLowerCase()
        );

        return {
            productId: item.productId,
            suggestedCargoTypeId: matched?.id || cargoTypes[0].id,
            suggestedCargoTypeName: matched?.name || cargoTypes[0].name,
            suggestedCargoValue: item.cargoValue || 1,
            confidence: item.confidence || 50,
        };
    });
}
