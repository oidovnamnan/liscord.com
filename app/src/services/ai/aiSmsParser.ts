import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
let lastApiKey = '';

function getClient(apiKey: string): GoogleGenAI {
    if (!apiKey) throw new Error('Gemini API Key байхгүй байна');
    if (!aiClient || lastApiKey !== apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
        lastApiKey = apiKey;
    }
    return aiClient;
}

export interface AiSmsParseResult {
    bank: string;
    amount: number;
    utga: string;
    isIncome: boolean;
    accountNumber?: string;
    balance?: string;
    date?: string;
    confidence: 'high' | 'medium' | 'low';
    raw?: string;
}

/**
 * Parse a bank SMS message using Gemini AI.
 * Returns structured data: bank name, amount, utga (transaction note), etc.
 */
export async function parseSmsWithAi(
    apiKey: string,
    smsBody: string,
    senderNumber?: string
): Promise<AiSmsParseResult> {
    const client = getClient(apiKey);

    const prompt = `Чи Монголын банкны SMS мессежийг задлан шинжлэдэг мэргэжилтэн.

Доорх SMS мессежийг задалж, JSON хэлбэрээр хариулна уу.

SMS илгээгч: ${senderNumber || 'тодорхойгүй'}
SMS агуулга:
"""
${smsBody}
"""

Дараах JSON формат буцаана уу (зөвхөн JSON, тайлбаргүй):
{
  "bank": "Банкны нэр (Khan Bank, Golomt, TDB, XacBank, Төрийн Банк, Bogd Bank гэх мэт)",
  "amount": 0,
  "utga": "Гүйлгээний утга (Utga: хэсгийн дараах текст)",
  "isIncome": true,
  "accountNumber": "Дансны дугаар (хэрвээ байвал)",
  "balance": "Үлдэгдэл (хэрвээ байвал)",
  "date": "Огноо (хэрвээ байвал)",
  "confidence": "high"
}

Дүрэм:
- amount нь тоон утга байна (string биш), жнь: 5500.00
- isIncome: орлого/orlogo/credited/dungeer/зарлага хүлээн авсан SMS бол true, зарлага бол false
- bank: Илгээгчийн дугаараас эсвэл SMS бие-ээс банкны нэрийг таниулна
- confidence: "high" хэрвээ SMS банкны мессеж нь тодорхой бол, "medium" хэрвээ бүрэн тодорхойгүй бол, "low" хэрвээ банкны SMS биш бол
- Хэрвээ энэ нь банкны SMS биш бол amount=0, isIncome=false, confidence="low" гэж буцаана`;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text || '';
        
        // Extract JSON from response (may be wrapped in ```json blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI хариултаас JSON задалж чадсангүй');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
            bank: parsed.bank || 'Тодорхойгүй',
            amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
            utga: parsed.utga || '',
            isIncome: parsed.isIncome ?? true,
            accountNumber: parsed.accountNumber || undefined,
            balance: parsed.balance || undefined,
            date: parsed.date || undefined,
            confidence: parsed.confidence || 'medium',
            raw: text,
        };
    } catch (error) {
        console.error('AI SMS Parse Error:', error);
        throw error;
    }
}
