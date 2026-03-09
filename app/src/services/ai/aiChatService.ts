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
