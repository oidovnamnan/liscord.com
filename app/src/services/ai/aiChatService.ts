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

// ============ Category Audit ============

export interface CategoryMergeSuggestion {
    sourceId: string;
    sourceName: string;
    sourceProductCount: number;
    targetId: string;
    targetName: string;
    targetProductCount: number;
    reason: string;
}

export interface CategoryAuditResult {
    totalCategories: number;
    mergeGroups: CategoryMergeSuggestion[];
    summary: string;
}

interface AuditCategory {
    id: string;
    name: string;
    productCount: number;
}

/**
 * Audit categories for duplicates using both exact-match and AI semantic matching.
 */
export async function auditCategories(
    apiKey: string,
    categories: AuditCategory[]
): Promise<CategoryAuditResult> {
    // Phase 1: exact duplicates (same name, different IDs)
    const exactDuplicates: CategoryMergeSuggestion[] = [];
    const nameGroups = new Map<string, AuditCategory[]>();

    for (const cat of categories) {
        const key = cat.name.trim().toLowerCase();
        if (!nameGroups.has(key)) nameGroups.set(key, []);
        nameGroups.get(key)!.push(cat);
    }

    for (const [, group] of nameGroups) {
        if (group.length <= 1) continue;
        // Keep the one with most products as target
        const sorted = [...group].sort((a, b) => b.productCount - a.productCount);
        const target = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            exactDuplicates.push({
                sourceId: sorted[i].id,
                sourceName: sorted[i].name,
                sourceProductCount: sorted[i].productCount,
                targetId: target.id,
                targetName: target.name,
                targetProductCount: target.productCount,
                reason: `Нэр яг ижил: "${sorted[i].name}"`,
            });
        }
    }

    // Phase 2: AI semantic similarity check (only for unique-name categories)
    const uniqueCategories = [...nameGroups.entries()]
        .filter(([, g]) => g.length === 1)
        .map(([, g]) => g[0]);

    let aiMerges: CategoryMergeSuggestion[] = [];

    if (uniqueCategories.length > 1) {
        const client = getClient(apiKey);
        const catList = uniqueCategories
            .map(c => `[${c.id}] "${c.name}" (${c.productCount} бараа)`)
            .join('\n');

        const prompt = `Дараах ангилалуудыг шалгаж, УТГА ИЖИЛ ангилалуудыг нэгтгэхийг санал болго.

АНГИЛАЛУУД:
${catList}

ДҮРЭМ:
- Зөвхөн УТГА НЬ БОДИТООР ИЖИЛ ангилалуудыг нэгтгэ
- Жишээ: "Гэр ахуйн бараа" ба "Гэр ахуйн хэрэгсэл" = ИЖИЛ
- Жишээ: "Алкоголь" ба "Спирттэй ундаа" = ИЖИЛ
- Жишээ: "Хүнс" ба "Нэмэлт тэжээл" = ӨӨР (нэгтгэхгүй)
- Бараа тоо ихтэйг нь TARGET болгох (source → target руу нэгтгэнэ)
- Илт ижил биш бол нэгтгэхгүй

JSON ХАРИУ:
{
  "merges": [
    {
      "sourceId": "...",
      "sourceName": "...",
      "targetId": "...",
      "targetName": "...",
      "reason": "Утга ижил: ..."
    }
  ],
  "summary": "X ангилал нэгтгэх санал"
}

Нэгтгэх зүйл олдохгүй бол: {"merges": [], "summary": "Давхардал олдсонгүй"}`;

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

            aiMerges = (parsed.merges || []).map((m: any) => {
                const source = uniqueCategories.find(c => c.id === m.sourceId);
                const target = uniqueCategories.find(c => c.id === m.targetId);
                return {
                    sourceId: m.sourceId,
                    sourceName: m.sourceName || source?.name || '',
                    sourceProductCount: source?.productCount || 0,
                    targetId: m.targetId,
                    targetName: m.targetName || target?.name || '',
                    targetProductCount: target?.productCount || 0,
                    reason: m.reason || 'Утга ижил',
                };
            }).filter((m: CategoryMergeSuggestion) => m.sourceId && m.targetId);
        } catch (e) {
            console.warn('AI category audit failed, using exact matches only:', e);
        }
    }

    const allMerges = [...exactDuplicates, ...aiMerges];

    return {
        totalCategories: categories.length,
        mergeGroups: allMerges,
        summary: allMerges.length === 0
            ? 'Давхардсан ангилал олдсонгүй ✅'
            : `${allMerges.length} ангилал нэгтгэх санал байна`,
    };
}
