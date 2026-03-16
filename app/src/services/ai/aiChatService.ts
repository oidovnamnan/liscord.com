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

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface BusinessContext {
    businessName?: string;
    totalProducts?: number;
    totalOrders?: number;
    totalRevenue?: number;
    totalCustomers?: number;
    lowStockProducts?: string[];
    topProducts?: string[];
    recentOrdersToday?: number;
    pendingOrders?: number;
    productCategories?: string[];
    averageOrderValue?: number;
    // Full data tables
    productTable?: string;    // "Нэр | Үнэ | Үлдэгдэл | Ангилал" rows
    orderTable?: string;      // Recent orders detail
    customerTable?: string;   // Customer detail
}

function buildSystemPrompt(ctx?: BusinessContext): string {
    const bizBlock = ctx ? `

БИЗНЕСИЙН БОДИТ МЭДЭЭЛЭЛ (${new Date().toLocaleDateString('mn-MN')} байдлаар):
━━━━━━━━━━━━━━━━━━━━━━━━
• Бизнесийн нэр: ${ctx.businessName || 'Тодорхойгүй'}
• Нийт бүтээгдэхүүн: ${ctx.totalProducts ?? '—'}
• Нийт хэрэглэгч: ${ctx.totalCustomers ?? '—'}
• Нийт захиалга: ${ctx.totalOrders ?? '—'}
• Нийт орлого: ${ctx.totalRevenue != null ? `₮${ctx.totalRevenue.toLocaleString()}` : '—'}
• Дундаж сагс: ${ctx.averageOrderValue != null ? `₮${Math.round(ctx.averageOrderValue).toLocaleString()}` : '—'}
• Өнөөдрийн захиалга: ${ctx.recentOrdersToday ?? '—'}
• Хүлээгдэж буй захиалга: ${ctx.pendingOrders ?? '—'}
${ctx.lowStockProducts?.length ? `• ⚠️ Үлдэгдэл бага (≤5): ${ctx.lowStockProducts.join(', ')}` : ''}
${ctx.topProducts?.length ? `• 🏆 Шилдэг: ${ctx.topProducts.join(', ')}` : ''}
${ctx.productCategories?.length ? `• Ангилалууд: ${ctx.productCategories.join(', ')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━` : '';

    const productBlock = ctx?.productTable ? `

📦 БАРАА МАТЕРИАЛЫН БҮРЭН ЖАГСААЛТ:
${ctx.productTable}` : '';

    const orderBlock = ctx?.orderTable ? `

🛒 СҮҮЛИЙН ЗАХИАЛГУУД:
${ctx.orderTable}` : '';

    const customerBlock = ctx?.customerTable ? `

👥 ХЭРЭГЛЭГЧДИЙН ЖАГСААЛТ:
${ctx.customerTable}` : '';

    return `Та "Liscord Super Brain 🧠" — бизнесийн ухаалаг AI туслах.

МИНИЙ ҮҮРЭГ:
1. Бизнесийн дата дээр суурилсан ✅ БОДИТ мэдээлэл + шинжилгээ өгөх
2. Борлуулалтын стратеги, маркетингийн зөвлөгөө, үнийн бодлого санал болгох
3. Бараа материалын менежмент, нөөц хангамжийн зөвлөгөө
4. Хэрэглэгчийн сегментчилэл, loyalty стратеги
5. Ажилтны бүтээмжийн шинжилгээ
6. Санхүүгийн тайлан, cashflow удирдлага

ДҮРЭМ:
- Монгол хэлээр, найрсаг, мэргэжлийн өнгө аясаар
- Доорх бодит дата-г ашиглаж хариулт бэлдэх (зохиохгүй!)
- Зөвлөгөөг bullet point-аар, товч, ойлгомжтой
- Emoji ашиглаж уншигчдад ойлгомжтой болгох
- Хэрэв мэдэхгүй бол үнэнчээр хэлэх
- Тоон утгыг ₮ форматаар (жишээ: ₮1,500,000)
- Бараа нэр, үнэ, үлдэгдэл зэргийг exact-аар хэлэх
${bizBlock}${productBlock}${orderBlock}${customerBlock}

ЧАДВАР:
📊 Борлуулалтын шинжилгээ | 📦 Нөөц оновчлох | 💡 Маркетинг стратеги
📝 Пост/тайлбар бичих | 👥 Хэрэглэгч сегментчилэх | 💰 Санхүүгийн тайлан
🎯 KPI зорилт тохируулах | 🔔 Анхааруулга`;
}

/**
 * Send a chat message to Gemini and get a response.
 */
export async function sendChatMessage(
    apiKey: string,
    userMessage: string,
    history: ChatMessage[],
    businessContext?: BusinessContext,
    modelId: string = 'gemini-2.5-flash'
): Promise<string> {
    const client = getClient(apiKey);
    const systemPrompt = buildSystemPrompt(businessContext);

    const contents = [
        { role: 'user' as const, parts: [{ text: systemPrompt + '\n\nДээрх бизнесийн бүх мэдээллийг анхааралтай уншаж, бэлэн болоорой.' }] },
        { role: 'model' as const, parts: [{ text: 'Ойлголоо! 🧠 Бүх мэдээллийг хүлээн авлаа — бараа, захиалга, хэрэглэгч бүрийг мэдэж байна. Бэлэн!' }] },
        ...history.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'model',
            parts: [{ text: msg.text }]
        })),
        { role: 'user' as const, parts: [{ text: userMessage }] }
    ];

    try {
        const response = await client.models.generateContent({
            model: modelId,
            contents
        });

        return response.text || 'Хариулт авч чадсангүй. Дахин оролдоно уу.';
    } catch (error: unknown) {
        console.error('Gemini Chat Error:', error);
        if (error instanceof Error) {
            if (error.message?.includes('API key')) {
                throw new Error('API Key буруу эсвэл хугацаа дууссан. Super Admin тохиргоог шалгана уу.');
            }
            if (error.message?.includes('quota')) {
                throw new Error('API хязгаарт хүрсэн. Түр хүлээгээд дахин оролдоно уу.');
            }
        }
        throw new Error('AI хариулт авахад алдаа гарлаа. Дахин оролдоно уу.');
    }
}

// ============ Product Audit ============

export type AuditIssueType =
    | 'missing_description'
    | 'short_description'
    | 'wrong_category'
    | 'duplicate'
    | 'not_product'
    | 'missing_price'
    | 'bad_name';

export interface ProductAuditIssue {
    productId: string;
    productName: string;
    type: AuditIssueType;
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion?: string;
    action?: {
        type: 'update' | 'delete' | 'merge';
        field?: string;
        value?: string;
        mergeIntoId?: string;
    };
}

export interface AuditResult {
    totalProducts: number;
    issueCount: number;
    issues: ProductAuditIssue[];
    summary: string;
}

interface AuditProduct {
    id: string;
    name: string;
    description: string;
    categoryName: string;
    salePrice: number;
    costPrice: number;
    images: number;
}

/**
 * Audit all products using Gemini AI.
 * Scans for: missing descriptions, wrong categories, duplicates, non-products, bad names, missing prices.
 */
export async function auditProducts(
    apiKey: string,
    products: AuditProduct[],
    existingCategories: string[]
): Promise<AuditResult> {
    const client = getClient(apiKey);

    // Build compact product table for AI
    const productRows = products.map((p, i) =>
        `${i + 1}. [${p.id}] "${p.name}" | Тайлбар: ${p.description ? (p.description.length > 80 ? p.description.substring(0, 80) + '...' : p.description) : '(хоосон)'} | Ангилал: ${p.categoryName || '(байхгүй)'} | Үнэ: ${p.salePrice}₮ | Өртөг: ${p.costPrice}₮ | Зураг: ${p.images}`
    ).join('\n');

    const prompt = `Чи бараа бүтээгдэхүүний чанарын шалгагч (Product Quality Auditor).

БҮТЭЭГДЭХҮҮНИЙ ЖАГСААЛТ (${products.length} бараа):
${productRows}

ОДОО БАЙГАА АНГИЛАЛУУД:
${existingCategories.map(c => `- "${c}"`).join('\n')}

ДААЛГАВАР: Дээрх бүх барааг нэг бүрчлэн шалгаж, асуудалтай бараа бүрийг олж мэдэгд.

ШАЛГАХ ЗҮЙЛС:

1. **missing_description** (high): Тайлбар хоосон эсвэл "(хоосон)" бол
2. **short_description** (medium): Тайлбар 50 тэмдэгтээс бага бол
3. **bad_name** (medium): Нэр нь эможи, зар текст ("ЯРААРАЙ!", "ШИН ИРЛЭЭ!"), код (#123) агуулж байвал → цэвэр нэр санал болго
4. **wrong_category** (medium): Ангилал нь барааны төрөлтэй тохирохгүй бол → зөв ангилалыг ОДОО БАЙГАА жагсаалтаас сонгож санал болго
5. **duplicate** (high): Хоёр бараа ижил зүйл бол (нэр ижил, жаахан өөр бичигдсэн) → аль нэгийг нь тэмдэглэ
6. **not_product** (high): Энэ нь бараа биш (зар мэдэгдэл, мэндчилгээ, мэдээлэл) бол
7. **missing_price** (medium): Зарах үнэ 0 бол

ДҮРЭМ:
- Зөвхөн БОДИТ асуудалтай барааг тэмдэглэ, хэвийн барааг тэмдэглэхГҮЙ
- duplicate шалгахдаа нэрний ижил утгыг анхааралтай хар (жнь "Hershey's Kisses 100г" ба "Hershey's Kisses Milk Chocolate 100g" = давхардал)
- wrong_category: ЗААВАЛ одоо байгаа ангилалуудаас нэрийг ТОДОРХОЙ бич
- suggestion-д ЗОХИОСОН мэдээлэл бичихГҮЙ, зөвхөн барааны нэрнээс гаргаж чадах мэдээллийг бич
- missing_description / short_description-д suggestion-д "Энэ барааны тайлбар дутуу байна, нэмж бичнэ үү" гэж бич (AI зохиохгүй)
- JSON формат ЗААВАЛ дагах

JSON ХАРИУ:
{
  "issues": [
    {
      "productId": "id_here",
      "productName": "нэр",
      "type": "missing_description",
      "severity": "high",
      "message": "Тайлбар хоосон байна",
      "suggestion": "Тайлбар нэмж бичнэ үү",
      "action": { "type": "update", "field": "description", "value": "" }
    }
  ],
  "summary": "Нийт X бараанаас Y-д асуудал олдлоо: ... товч дүгнэлт"
}

Хэрэв БҮГД хэвийн бол: {"issues": [], "summary": "Бүх бараа хэвийн байна ✅"}`;

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

        const issues: ProductAuditIssue[] = (parsed.issues || []).map((issue: any) => ({
            productId: issue.productId || '',
            productName: issue.productName || '',
            type: issue.type || 'missing_description',
            severity: issue.severity || 'medium',
            message: issue.message || '',
            suggestion: issue.suggestion || undefined,
            action: issue.action || undefined,
        }));

        return {
            totalProducts: products.length,
            issueCount: issues.length,
            issues,
            summary: parsed.summary || `${issues.length} асуудал олдлоо`,
        };
    } catch (error: unknown) {
        console.error('Product Audit Error:', error);
        throw new Error('Бараа шалгахад алдаа гарлаа. Дахин оролдоно уу.');
    }
}
