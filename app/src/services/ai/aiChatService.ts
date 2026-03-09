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
    lowStockProducts?: string[];  // names of products with stock <= 5
    topProducts?: string[];       // top selling product names
    recentOrdersToday?: number;
    pendingOrders?: number;
    productCategories?: string[];
    averageOrderValue?: number;
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
${ctx.lowStockProducts?.length ? `• ⚠️ Үлдэгдэл бага бараа (≤5): ${ctx.lowStockProducts.join(', ')}` : ''}
${ctx.topProducts?.length ? `• 🏆 Шилдэг борлуулалттай: ${ctx.topProducts.join(', ')}` : ''}
${ctx.productCategories?.length ? `• Ангилалууд: ${ctx.productCategories.join(', ')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━` : '';

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
- Тоо баримтыг exact-аар ашиглах (дээрх бодит мэдээллээс)
- Зөвлөгөөг bullet point-аар, товч, ойлгомжтой
- Emoji ашиглаж уншигчдад ойлгомжтой болгох
- Хэрэв мэдэхгүй бол үнэнчээр хэлэх, зохиохгүй байх
- Тоон утгыг ₮ форматаар харуулах (жишээ: ₮1,500,000)
${bizBlock}

ЧАДВАР:
📊 Борлуулалтын шинжилгээ хийх
📦 Бараа материалын нөөц оновчлох
💡 Маркетингийн стратеги санал болгох
📝 Facebook пост, бараа тайлбар бичих
👥 Хэрэглэгчийн сегментчилэл хийх
💰 Санхүүгийн тайлан гаргах
🎯 KPI зорилт тохируулахад туслах`;
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

    // Build conversation with system context
    const contents = [
        { role: 'user' as const, parts: [{ text: systemPrompt + '\n\nДээрх заавар бизнесийн мэдээллийг анхааралтай уншаж, бэлэн болоорой.' }] },
        { role: 'model' as const, parts: [{ text: 'Ойлголоо! 🧠 Би Liscord Super Brain — бүх мэдээллийг хүлээн авлаа. Таны бизнесийн бодит дата дээр суурилж, мэргэжлийн зөвлөгөө, шинжилгээ өгөхөд бэлэн байна!' }] },
        // Recent history for context (last 10 messages)
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
