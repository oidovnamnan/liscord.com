import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * QPay V2 Create Invoice — Vercel Serverless Function
 * 
 * Called from frontend to generate QPay QR code for payment.
 * Credentials are handled server-side, never exposed to browser.
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';
const QPAY_USERNAME = 'GATE_SIM';
const QPAY_PASSWORD = '8r3bvsa3';
const QPAY_INVOICE_CODE = 'GATE_SIM_INVOICE';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
    if (accessToken && Date.now() < tokenExpiry - 300000) {
        return accessToken;
    }

    const credentials = Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64');

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
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    return accessToken!;
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

    const { bizId, orderId, amount, description, customerPhone } = req.body;

    if (!bizId || !orderId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: bizId, orderId, amount' });
    }

    try {
        const token = await getAccessToken();

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
                invoice_code: QPAY_INVOICE_CODE,
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
            return res.status(500).json({ error: 'QPay invoice creation failed' });
        }

        const result = await invoiceResponse.json();

        // Update order with qpayInvoiceId via Firebase Admin
        // (We'll handle this from the frontend instead — simpler for Vercel)

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
