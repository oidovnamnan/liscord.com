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
    // Pattern extraction fields
    amountPrefix?: string;  // Text before amount
    amountSuffix?: string;  // Text after amount
    utgaPrefix?: string;    // Text before utga value
    utgaSuffix?: string;    // Text after utga value
    senderNumbers?: string[];
    incomeKeywords?: string[];
}

/**
 * Parse a bank SMS message using Gemini AI.
 * Returns structured data: bank name, amount, utga (transaction note), etc.
 * Also extracts surrounding patterns for auto-creating templates.
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
  "confidence": "high",
  "amountPrefix": "Дүнгийн ЯАГААД ӨМНӨХӨН текст (жнь: 'dungeer ', 'Orlogo: ', 'orlogiin guilgee ')",
  "amountSuffix": "Дүнгийн ЯАГААД ДАРААХАН текст (жнь: ' MNT', ' tugrug')",
  "utgaPrefix": "Утгын ЯАГААД ӨМНӨХӨН текст (жнь: 'Utga: ', 'guilgeenii utga: ')",
  "utgaSuffix": "Утгын ЯАГААД ДАРААХАН текст (жнь: '' хэрвээ мөрийн төгсгөл бол)",
  "incomeKeywords": ["Энэ SMS дотор орлого гэдгийг илтгэх үг/үгс жнь: Orlogo, dungeer, orlogiin guilgee"]
}

Дүрэм:
- amount нь тоон утга байна (string биш), жнь: 5500.00
- isIncome: орлого/orlogo/credited/dungeer/зарлага хүлээн авсан SMS бол true, зарлага бол false
- bank: Илгээгчийн дугаараас эсвэл SMS бие-ээс банкны нэрийг таниулна
- confidence: "high" хэрвээ SMS банкны мессеж нь тодорхой бол, "medium" хэрвээ бүрэн тодорхойгүй бол, "low" хэрвээ банкны SMS биш бол
- amountPrefix: SMS-н бие дотор дүнгийн яг өмнө ирж байгаа бүтэн үг/текст. Яг ижил uppercase/lowercase хэрэглэнэ.
- amountSuffix: SMS-н бие дотор дүнгийн яг дараа ирж байгаа бүтэн үг/текст (валютын тэмдэг гэх мэт).
- utgaPrefix: SMS-н бие дотор утгын яг өмнө ирж байгаа текст. Яг ижил uppercase/lowercase хэрэглэнэ.
- utgaSuffix: утгын яг дараах текст. Хэрвээ утга мөрийн төгсгөлд байвал хоосон "".
- incomeKeywords: Энэ мессеж дотор орлого гэж илтгэж буй бүх түлхүүр үгсийг оруулна.
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
            amountPrefix: parsed.amountPrefix || '',
            amountSuffix: parsed.amountSuffix || '',
            utgaPrefix: parsed.utgaPrefix || '',
            utgaSuffix: parsed.utgaSuffix || '',
            incomeKeywords: parsed.incomeKeywords || [],
        };
    } catch (error) {
        console.error('AI SMS Parse Error:', error);
        throw error;
    }
}

/**
 * Generate regex patterns from prefix/suffix text.
 * This creates patterns that match based on surrounding words.
 */
export function generatePatternsFromAi(result: AiSmsParseResult): {
    amountPattern: string;
    utgaPattern: string;
} {
    // Escape special regex characters
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build amount pattern from prefix/suffix
    let amountPattern = '';
    if (result.amountPrefix) {
        const prefix = escapeRegex(result.amountPrefix.trim());
        const suffix = result.amountSuffix ? escapeRegex(result.amountSuffix.trim()) : '';
        amountPattern = `${prefix}\\s*(\\d[\\d,]*(?:\\.\\d{1,2})?)${suffix ? `\\s*${suffix}` : ''}`;
    } else {
        // Fallback: generic MNT pattern
        amountPattern = '(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt|tugrug)';
    }

    // Build utga pattern from prefix
    let utgaPattern = '';
    if (result.utgaPrefix) {
        const prefix = escapeRegex(result.utgaPrefix.trim());
        utgaPattern = `${prefix}\\s*([^\\n,.]+)`;
    } else {
        // Fallback: generic utga pattern
        utgaPattern = '(?:utga|Utga|утга|Утга)[:\\s]*([^\\n,.]+)';
    }

    return { amountPattern, utgaPattern };
}
