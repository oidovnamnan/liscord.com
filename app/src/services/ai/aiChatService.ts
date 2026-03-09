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

/**
 * Send a chat message to Gemini and get a response.
 * Includes business context in the system prompt for relevant answers.
 */
export async function sendChatMessage(
    apiKey: string,
    userMessage: string,
    history: ChatMessage[],
    businessContext?: {
        businessName?: string;
        totalProducts?: number;
        totalOrders?: number;
        totalRevenue?: number;
    }
): Promise<string> {
    const client = getClient(apiKey);

    const systemPrompt = `Та "Liscord Super Brain" — бизнесийн ухаалаг AI туслах.

ДҮРЭМ:
- Монгол хэлээр хариулна.
- Товч, тодорхой, бизнесийн хэрэгцээнд нийцсэн хариулт өгнө.
- Хэрэглэгчийн бизнесийн мэдээллийг ашиглаж, зөвлөгөө, шинжилгээ, тайлбар хийнэ.
- Бизнесийн стратеги, маркетинг, борлуулалт, санхүү, ажилтны менежмент талаар мэргэжлийн түвшинд зөвлөнө.
- Хэрэв мэдэхгүй бол, үнэнчээр хэлнэ.
- Emoji хэрэглэж, найрсаг, мэргэжлийн өнгө аясаар хариулна.

${businessContext ? `БИЗНЕСИЙН МЭДЭЭЛЭЛ:
- Нэр: ${businessContext.businessName || 'Тодорхойгүй'}
- Нийт бүтээгдэхүүн: ${businessContext.totalProducts ?? 'Тодорхойгүй'}
- Нийт захиалга: ${businessContext.totalOrders ?? 'Тодорхойгүй'}
- Нийт орлого: ${businessContext.totalRevenue ? `₮${businessContext.totalRevenue.toLocaleString()}` : 'Тодорхойгүй'}` : ''}`;

    // Build conversation history for context
    const contents = [
        { role: 'user' as const, parts: [{ text: systemPrompt + '\n\nДээрх мэдээллийг анхаарч, харилцан ярианы үргэлжлэл байдлаар хариулна уу.' }] },
        { role: 'model' as const, parts: [{ text: 'Ойлголоо! Би Liscord Super Brain, таны бизнесийн ухаалаг туслах бэлэн байна. 🧠' }] },
        // Include recent history (last 10 messages for context window efficiency)
        ...history.slice(-10).map(msg => ({
            role: msg.role as 'user' | 'model',
            parts: [{ text: msg.text }]
        })),
        { role: 'user' as const, parts: [{ text: userMessage }] }
    ];

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents
        });

        return response.text || 'Хариулт авч чадсангүй. Дахин оролдоно уу.';
    } catch (error: unknown) {
        console.error('Gemini Chat Error:', error);
        if (error instanceof Error && error.message?.includes('API key')) {
            throw new Error('API Key буруу эсвэл хугацаа дууссан. Super Admin тохиргоог шалгана уу.');
        }
        throw new Error('AI хариулт авахад алдаа гарлаа. Дахин оролдоно уу.');
    }
}
