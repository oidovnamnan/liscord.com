import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * QPay V2 Create Invoice — Vercel Serverless Function
 * 
 * Frontend passes QPay credentials directly.
 * For VIP: passes platform credentials (GATE_SIM)
 * For Product: passes business's own QPay credentials
 * No Firebase Admin needed — credentials come from frontend.
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';

// Token cache per credential set
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

    if (!response.ok) {
        throw new Error(`QPay auth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    tokenCache[cacheKey] = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };

    return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { bizId, orderId, amount, description, customerPhone, qpayUsername, qpayPassword, qpayInvoiceCode } = req.body;

    if (!bizId || !orderId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: bizId, orderId, amount' });
    }

    if (!qpayUsername || !qpayPassword || !qpayInvoiceCode) {
        return res.status(400).json({ error: 'Missing QPay credentials' });
    }

    try {
        const token = await getAccessToken(qpayUsername, qpayPassword);

        // Callback URL pointing to our qpay-callback serverless function
        const host = req.headers.host || 'www.liscord.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const callbackUrl = `${protocol}://${host}/api/qpay-callback?bizId=${bizId}&orderId=${orderId}`;

        const invoiceResponse = await fetch(`${QPAY_API_URL}/invoice`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                invoice_code: qpayInvoiceCode,
                sender_invoice_no: orderId,
                invoice_receiver_code: customerPhone || 'guest',
                invoice_description: description || `Liscord #${orderId.slice(-6)}`,
                amount: amount,
                callback_url: callbackUrl,
            }),
        });

        if (!invoiceResponse.ok) {
            const errorData = await invoiceResponse.json().catch(() => ({}));
            console.error('QPay invoice creation failed:', invoiceResponse.status, errorData);
            return res.status(500).json({ error: 'QPay invoice creation failed', details: errorData });
        }

        const result = await invoiceResponse.json();

        return res.status(200).json({
            invoice_id: result.invoice_id,
            qr_text: result.qr_text,
            qr_image: result.qr_image,
            qPay_shortUrl: result.qPay_shortUrl,
            urls: result.urls || [],
        });

    } catch (err: any) {
        console.error('qpayCreateInvoice error:', err);
        return res.status(500).json({ error: err.message || 'Failed to create QPay invoice' });
    }
}
