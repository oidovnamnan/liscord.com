import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * QPay V2 Payment Check — Vercel Serverless Function
 * 
 * For VIP: uses server-side env credentials
 * For Product: credentials from frontend (or resolved from Firestore via bizId)
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';
const ALLOWED_ORIGINS = ['https://www.liscord.com', 'https://liscord.com', 'http://localhost:5173', 'http://localhost:3000'];

// Token cache
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getAccessToken(username: string, password: string): Promise<string> {
    const cacheKey = `${username}`;
    const cached = tokenCache[cacheKey];
    if (cached && Date.now() < cached.expiresAt - 300000) {
        return cached.token;
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const response = await fetch(`${QPAY_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) throw new Error(`QPay auth failed: ${response.status}`);

    const data = await response.json();
    tokenCache[cacheKey] = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };
    return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS — restricted origins
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { invoiceId, qpayUsername, qpayPassword, purpose } = req.body;

    if (!invoiceId) {
        return res.status(400).json({ error: 'Missing invoiceId' });
    }

    // Resolve credentials based on purpose
    let username: string;
    let password: string;

    if (purpose === 'vip') {
        // VIP → server-side env credentials (Vercel Environment Variables)
        if (!process.env.QPAY_VIP_USERNAME || !process.env.QPAY_VIP_PASSWORD) {
            return res.status(500).json({ error: 'QPay VIP credentials not configured in server environment' });
        }
        username = process.env.QPAY_VIP_USERNAME;
        password = process.env.QPAY_VIP_PASSWORD;
    } else {
        // Product → credentials from frontend
        if (!qpayUsername || !qpayPassword) {
            return res.status(400).json({ error: 'Missing QPay credentials' });
        }
        username = qpayUsername;
        password = qpayPassword;
    }

    try {
        const token = await getAccessToken(username, password);

        const checkResp = await fetch(`${QPAY_API_URL}/payment/check`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                object_type: 'INVOICE',
                object_id: invoiceId,
                offset: { page_number: 1, page_limit: 100 },
            }),
        });

        if (!checkResp.ok) {
            return res.status(500).json({ error: 'QPay check failed' });
        }

        const result = await checkResp.json();
        const payments = result.rows || [];
        const paidPayment = payments.find((p: any) => p.payment_status === 'PAID');

        return res.status(200).json({
            paid: !!paidPayment,
            payment: paidPayment || null,
            count: result.count || 0,
        });

    } catch (err: any) {
        console.error('QPay check error:', err);
        return res.status(500).json({ error: err.message || 'Check failed' });
    }
}
