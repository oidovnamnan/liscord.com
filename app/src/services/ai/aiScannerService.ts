import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client lazily.
// In a real production app, this should be called from a secure backend or Firebase Function.
// For this MVP, we will use it directly on the client side with a restricted API key if possible.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

export interface ExtractedData {
    extractedText: string;
    matchedOrderNumber: string | null;
    rawResponse: string;
}

/**
 * Sends an image to Gemini Vision API and asks it to extract Order Numbers or Phone numbers.
 * @param base64Image The image to scan (base64 encoded, without data:image/... prefix)
 * @param mimeType The mime type of the image (e.g. 'image/jpeg')
 * @param orderPrefix The business-specific order prefix to look for (e.g. 'ORD-')
 */
export async function scanPackageLabel(base64Image: string, mimeType: string, orderPrefix: string): Promise<ExtractedData> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }

    const prompt = `
You are a highly accurate Cargo/Package logictics OCR assistant.
Your task is to scan the provided package label image and extract the exact "Order Code" or a "Phone Number".
The business uses the following Order Prefix: "${orderPrefix}".

CRITICAL INSTRUCTION:
1. Look for any text that starts with "${orderPrefix}" (e.g., ${orderPrefix}1234, ${orderPrefix}0042). If found, return exactly that code.
2. If the Order Prefix is NOT found, look for a Mongolian phone number (usually 8 digits, e.g., 99112233, 88112233) and return it.
3. If neither can be found, return "UNKNOWN".

FORMAT YOUR RESPONSE EXACTLY LIKE THIS JSON:
{
  "matchedOrderNumber": "found_code_here_or_null",
  "extractedText": "a brief summary of the name/phone/code you saw on the label to help the user identify it manually"
}
`;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Image, mimeType: mimeType } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const rawText = response.text || "{}";
        let parsed: any;
        try {
            parsed = JSON.parse(rawText);
        } catch (e) {
            // Fallback parsing if Gemini returns markdown block
            const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(cleaned);
        }

        let code = parsed.matchedOrderNumber;
        if (code === "UNKNOWN" || code === "null") code = null;

        return {
            matchedOrderNumber: code,
            extractedText: parsed.extractedText || rawText,
            rawResponse: rawText
        };
    } catch (error) {
        console.error("Gemini Scanning Error:", error);
        throw new Error("Failed to scan image with AI.");
    }
}
