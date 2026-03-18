/**
 * Facebook Messenger AI Reply — Server-side Gemini
 * 
 * Called by fb-webhook.ts when AI mode is 'auto' or 'assist'.
 * - Fetches business products from Firestore (REST API)
 * - Builds system prompt with product catalog
 * - Sends to Gemini with conversation history
 * - Returns AI response text + optional action (create_order)
 * 
 * Uses Firestore REST API (no firebase-admin SDK needed)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROJECT_ID = 'liscord-2b529';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCuaNXSfhQt_dtNgoBs_Uz6IXN8qzZkONs';

// ═══ Firestore REST API Helpers ═══

function fromFirestoreValue(val: Record<string, unknown>): unknown {
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('doubleValue' in val) return val.doubleValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
        const arr = val.arrayValue as { values?: Record<string, unknown>[] };
        return (arr.values || []).map(v => fromFirestoreValue(v));
    }
    if ('mapValue' in val) {
        const map = val.mapValue as { fields?: Record<string, Record<string, unknown>> };
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(map.fields || {})) {
            result[k] = fromFirestoreValue(v);
        }
        return result;
    }
    return null;
}

function fromFirestoreDoc(doc: { fields?: Record<string, Record<string, unknown>> }): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc.fields || {})) {
        result[k] = fromFirestoreValue(v);
    }
    return result;
}

async function fsGet(path: string): Promise<Record<string, unknown> | null> {
    try {
        const resp = await fetch(`${FIRESTORE_BASE}/${path}?key=${API_KEY}`);
        if (!resp.ok) return null;
        const doc = await resp.json();
        return fromFirestoreDoc(doc);
    } catch { return null; }
}

interface FsListDoc {
    id: string;
    data: Record<string, unknown>;
}

async function fsList(collectionPath: string, orderBy?: string, orderDir?: string, limitCount?: number): Promise<FsListDoc[]> {
    try {
        // Use Firestore REST API runQuery for ordering
        const parent = collectionPath.split('/').slice(0, -1).join('/');
        const collectionId = collectionPath.split('/').pop()!;

        const query: Record<string, unknown> = {
            structuredQuery: {
                from: [{ collectionId }],
                limit: limitCount || 100,
            }
        };

        if (orderBy) {
            (query.structuredQuery as Record<string, unknown>).orderBy = [{
                field: { fieldPath: orderBy },
                direction: orderDir === 'desc' ? 'DESCENDING' : 'ASCENDING',
            }];
        }

        const parentPath = parent ? `${FIRESTORE_BASE}/${parent}` : FIRESTORE_BASE;
        const resp = await fetch(`${parentPath}:runQuery?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
        });

        if (!resp.ok) return [];
        const results = await resp.json();

        return (results as Array<{ document?: { name: string; fields?: Record<string, Record<string, unknown>> } }>)
            .filter(r => r.document)
            .map(r => ({
                id: r.document!.name.split('/').pop()!,
                data: fromFirestoreDoc(r.document!),
            }));
    } catch { return []; }
}

async function fsListWithFilter(collectionPath: string, filterField: string, filterValue: unknown, limitCount?: number): Promise<FsListDoc[]> {
    try {
        const parent = collectionPath.split('/').slice(0, -1).join('/');
        const collectionId = collectionPath.split('/').pop()!;

        let fieldFilter: Record<string, unknown>;
        if (typeof filterValue === 'boolean') {
            fieldFilter = { field: { fieldPath: filterField }, op: 'EQUAL', value: { booleanValue: filterValue } };
        } else if (typeof filterValue === 'string') {
            fieldFilter = { field: { fieldPath: filterField }, op: 'EQUAL', value: { stringValue: filterValue } };
        } else {
            fieldFilter = { field: { fieldPath: filterField }, op: 'EQUAL', value: { integerValue: String(filterValue) } };
        }

        const query = {
            structuredQuery: {
                from: [{ collectionId }],
                where: { fieldFilter },
                limit: limitCount || 100,
            }
        };

        const parentPath = parent ? `${FIRESTORE_BASE}/${parent}` : FIRESTORE_BASE;
        const resp = await fetch(`${parentPath}:runQuery?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
        });

        if (!resp.ok) return [];
        const results = await resp.json();

        return (results as Array<{ document?: { name: string; fields?: Record<string, Record<string, unknown>> } }>)
            .filter(r => r.document)
            .map(r => ({
                id: r.document!.name.split('/').pop()!,
                data: fromFirestoreDoc(r.document!),
            }));
    } catch { return []; }
}

// ═══ AI Logic ═══

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
        // 1. Get Gemini API key — env var first, then Firestore
        let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
            // Primary: system_settings/global (used by adminService)
            const sysSettings = await fsGet('system_settings/global');
            apiKey = (sysSettings?.geminiApiKey as string) || '';
        }
        if (!apiKey) {
            // Fallback: systemSettings/general
            const sysSettings2 = await fsGet('systemSettings/general');
            apiKey = (sysSettings2?.geminiApiKey as string) || '';
        }
        if (!apiKey) {
            return res.status(400).json({ error: 'Gemini API Key тохируулаагүй. GEMINI_API_KEY env var эсвэл system_settings/global-д тохируулна уу.', fallback: true });
        }

        // 2. Get business info
        const biz = await fsGet(`businesses/${bizId}`);
        const bizName = (biz?.name as string) || 'Дэлгүүр';
        const bizSlug = biz?.slug as string;
        const storeUrl = bizSlug ? `https://www.liscord.com/store/${bizSlug}` : '';

        // 3. Get products (compact table for AI)
        const products = await fsListWithFilter(`businesses/${bizId}/products`, 'isDeleted', false, 100);

        const productTable = products.map(d => {
            const p = d.data;
            const pricing = p.pricing as Record<string, unknown> | undefined;
            const stock = p.stock as Record<string, unknown> | undefined;
            const price = (pricing?.salePrice as number) || 0;
            const qty = (stock?.quantity as number) ?? 0;
            const desc = p.description as string;
            return `[${d.id}] "${p.name}" | ₮${price.toLocaleString()} | Үлдэгдэл: ${qty}ш${desc ? ` | ${desc.substring(0, 60)}` : ''}`;
        }).join('\n');

        // 4. Get conversation history (last 10 messages)
        const messages = await fsList(
            `businesses/${bizId}/fbConversations/${senderId}/messages`,
            'timestamp', 'desc', 10
        );

        const history = messages.reverse().map(d => {
            return {
                role: d.data.direction === 'inbound' ? 'user' : 'model',
                text: (d.data.text as string) || '',
            };
        });

        // 5. Build prompt and call Gemini
        const systemPrompt = buildSystemPrompt(
            bizName,
            { phone: biz?.phone as string, address: biz?.address as string, storeUrl },
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

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('AI Reply error:', errMsg);
        return res.status(200).json({
            text: 'Оператор тань удахгүй холбогдоно 🙏',
            action: null,
            error: errMsg,
        });
    }
}
