import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * QPay V2 Payment Check — Vercel Serverless Function
 * 
 * Frontend polls this endpoint to check if payment has been made.
 * If paid, updates the Firestore order directly from here.
 */

const QPAY_API_URL = 'https://merchant.qpay.mn/v2';
const QPAY_USERNAME = 'GATE_SIM';
const QPAY_PASSWORD = '8r3bvsa3';

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

    if (!response.ok) throw new Error(`QPay auth failed: ${response.status}`);

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

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { invoiceId } = req.body;

    if (!invoiceId) {
        return res.status(400).json({ error: 'Missing invoiceId' });
    }

    try {
        const token = await getAccessToken();

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
