/**
 * Facebook Messenger AI Reply — Server-side Gemini
 * 
 * Called by fb-webhook.ts when AI mode is 'auto' or 'assist'.
 * - Fetches business products from Firestore
 * - Builds system prompt with product catalog
 * - Sends to Gemini with conversation history
 * - Returns AI response text + optional action (create_order)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'liscord-2b529';
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch {
        admin.initializeApp({ projectId });
    }
}

const db = admin.firestore();

interface AIResponse {
    text: string;
    action?: {
        type: 'create_order';
        productIds: string[];
        quantities: number[];
    };
}

function buildSystemPrompt(
    bizName: string,
    bizInfo: { phone?: string; address?: string; storeUrl?: string },
    productTable: string,
    senderName: string
): string {
    return `Чи "${bizName}" дэлгүүрийн найрсаг, тусч зөвлөх.
Чат дээр хэрэглэгчтэй харилцаж байна. Хэрэглэгчийн нэр: ${senderName}.

ДҮРЭМ:
- Найрсаг, тусч, ТОВЧ хариулах (2-3 өгүүлбэрээс илүүгүй)
- Зөвхөн мэдэх зүйлээ хариулах
- Мэдэхгүй бол "Оператор тань удахгүй холбогдоно 🙏" гэж хэлэх
- Бараа нэр, ҮНЭ, ҮЛДЭГДЭЛ → EXACT утгаар хариулах (зохиохгүй!)
- Emoji бага зэрэг хэр (1-2 emoji/мессеж)
- Монгол хэлээр

БИЗНЕСИЙН МЭДЭЭЛЭЛ:
• Нэр: ${bizName}
${bizInfo.phone ? `• Утас: ${bizInfo.phone}` : ''}
${bizInfo.address ? `• Хаяг: ${bizInfo.address}` : ''}
${bizInfo.storeUrl ? `• Дэлгүүр: ${bizInfo.storeUrl}` : ''}

БАРААНЫ ЖАГСААЛТ:
${productTable || '(Бараа оруулаагүй)'}

ЗАХИАЛГА АВАХ:
- Хэрэглэгч бараа авмаар бол → барааны нэр, үнэ, үлдэгдэл хэлэх
- "Захиалах уу?" гэж асуух
- Хэрэглэгч "Тийм", "За", "Авъя" гэвэл → хариундаа [ORDER:productId:quantity] format оруулах
  Жишээ: "Захиалга үүсгэж байна! 🛒 [ORDER:abc123:1]"
- Олон бараа бол: [ORDER:id1:1,id2:2]
- Үлдэгдэл 0 бол → "Уучлаарай, одоогоор дууссан байна" гэж хэлэх (захиалга авахгүй)

ХАРИУЛАХГҮЙ:
- Буцаалт/гомдол → "Оператор тан руу холбож байна 🙏"
- Хувийн мэдээлэл асуувал → хариулахгүй
- Барааны жагсаалтад байхгүй зүйл → "Манайд энэ бараа одоогоор байхгүй байна"`;
}

function parseAIResponse(text: string): AIResponse {
    const result: AIResponse = { text };

    // Parse [ORDER:id:qty] or [ORDER:id1:qty1,id2:qty2]
    const orderMatch = text.match(/\[ORDER:([^\]]+)\]/);
    if (orderMatch) {
        const pairs = orderMatch[1].split(',');
        const productIds: string[] = [];
        const quantities: number[] = [];

        for (const pair of pairs) {
            const parts = pair.split(':');
            if (parts.length >= 2) {
                productIds.push(parts[0].trim());
                quantities.push(parseInt(parts[1]) || 1);
            }
        }

        if (productIds.length > 0) {
            result.action = { type: 'create_order', productIds, quantities };
            // Clean the ORDER tag from visible text
            result.text = text.replace(/\s*\[ORDER:[^\]]+\]\s*/g, '').trim();
        }
    }

    return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { bizId, senderId, senderName, messageText } = req.body;
    if (!bizId || !senderId || !messageText) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Get Gemini API key from system settings
        const sysSnap = await db.doc('system/settings').get();
        const apiKey = sysSnap.data()?.geminiApiKey;
        if (!apiKey) {
            return res.status(400).json({ error: 'Gemini API Key тохируулаагүй', fallback: true });
        }

        // 2. Get business info
        const bizSnap = await db.doc(`businesses/${bizId}`).get();
        const biz = bizSnap.data();
        const bizName = biz?.name || 'Дэлгүүр';
        const bizSlug = biz?.slug;
        const storeUrl = bizSlug ? `https://www.liscord.com/store/${bizSlug}` : '';

        // 3. Get products (compact table for AI)
        const productsSnap = await db.collection(`businesses/${bizId}/products`)
            .where('isDeleted', '==', false)
            .limit(100)
            .get();

        const productTable = productsSnap.docs.map(d => {
            const p = d.data();
            const price = p.pricing?.salePrice || 0;
            const stock = p.stock?.quantity ?? 0;
            return `[${d.id}] "${p.name}" | ₮${price.toLocaleString()} | Үлдэгдэл: ${stock}ш${p.description ? ` | ${(p.description as string).substring(0, 60)}` : ''}`;
        }).join('\n');

        // 4. Get conversation history (last 10 messages)
        const msgsSnap = await db.collection(`businesses/${bizId}/fbConversations/${senderId}/messages`)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const history = msgsSnap.docs.reverse().map(d => {
            const m = d.data();
            return {
                role: m.direction === 'inbound' ? 'user' : 'model',
                text: m.text || '',
            };
        });

        // 5. Build prompt and call Gemini
        const systemPrompt = buildSystemPrompt(
            bizName,
            { phone: biz?.phone, address: biz?.address, storeUrl },
            productTable,
            senderName || senderId
        );

        // Dynamic import Google GenAI
        const { GoogleGenAI } = await import('@google/genai');
        const client = new GoogleGenAI({ apiKey });

        const contents = [
            { role: 'user' as const, parts: [{ text: systemPrompt + '\n\nДээрх мэдээллийг анхааралтай уншаад бэлэн болоорой.' }] },
            { role: 'model' as const, parts: [{ text: 'Ойлголоо! Бүх бараа мэдээлэл, дүрмийг мэдэж байна. Бэлэн! 🙂' }] },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'model',
                parts: [{ text: msg.text }]
            })),
            { role: 'user' as const, parts: [{ text: messageText }] }
        ];

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents
        });

        const rawText = response.text || 'Уучлаарай, хариулт бэлдэж чадсангүй. Оператор тан руу холбогдоно.';
        const parsed = parseAIResponse(rawText);

        return res.status(200).json({
            text: parsed.text,
            action: parsed.action || null,
        });

    } catch (err: any) {
        console.error('AI Reply error:', err);
        return res.status(200).json({
            text: 'Оператор тань удахгүй холбогдоно 🙏',
            action: null,
            error: err.message,
        });
    }
}
