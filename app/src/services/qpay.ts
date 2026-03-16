/**
 * QPay V2 Integration — via Vercel Serverless Functions
 * 
 * Calls /api/qpay-invoice on the same domain (Vercel).
 * No CORS issues since it's same-origin.
 * Credentials are passed from business settings.
 */

export interface QPayInvoiceResponse {
    invoice_id: string;
    qr_text: string;
    qr_image: string;      // Base64 QR image
    qPay_shortUrl: string;  // Short URL for mobile
    urls: Array<{
        name: string;
        description: string;
        logo: string;
        link: string;
    }>;
}

// Platform credentials for VIP/membership
const PLATFORM_QPAY = {
    username: 'GATE_SIM',
    password: '8r3bvsa3',
    invoiceCode: 'GATE_SIM_INVOICE',
};

export const qpayService = {
    /**
     * Create QPay invoice via Vercel serverless function
     */
    async createInvoice(
        bizId: string,
        orderId: string,
        amount: number,
        description: string,
        customerPhone?: string,
        purpose: 'vip' | 'product' = 'product',
        businessQpaySettings?: { username: string; password: string; invoiceCode: string }
    ): Promise<QPayInvoiceResponse> {
        // Determine credentials based on purpose
        const creds = purpose === 'vip'
            ? PLATFORM_QPAY
            : businessQpaySettings;

        if (!creds?.username || !creds?.password) {
            throw new Error('QPay credentials not configured');
        }

        const response = await fetch('/api/qpay-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bizId,
                orderId,
                amount,
                description,
                customerPhone,
                qpayUsername: creds.username,
                qpayPassword: creds.password,
                qpayInvoiceCode: creds.invoiceCode || `${creds.username}_INVOICE`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay request failed: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Check if payment has been made for an invoice
     */
    async checkPayment(
        invoiceId: string,
        purpose: 'vip' | 'product' = 'product',
        businessQpaySettings?: { username: string; password: string }
    ): Promise<{ paid: boolean; payment: any; count: number }> {
        const creds = purpose === 'vip'
            ? PLATFORM_QPAY
            : businessQpaySettings;

        if (!creds?.username || !creds?.password) {
            throw new Error('QPay credentials not configured');
        }

        const response = await fetch('/api/qpay-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceId,
                qpayUsername: creds.username,
                qpayPassword: creds.password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay check failed: ${response.status}`);
        }

        return response.json();
    },
};
