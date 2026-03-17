/**
 * QPay V2 Integration — via Vercel Serverless Functions
 * 
 * Calls /api/qpay-invoice on the same domain (Vercel).
 * No CORS issues since it's same-origin.
 * 
 * VIP credentials are stored server-side only (env vars).
 * Product credentials come from business settings.
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

export const qpayService = {
    /**
     * Create QPay invoice via Vercel serverless function
     * VIP: credentials resolved server-side from env vars
     * Product: credentials passed from business settings
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
        // For VIP: server resolves credentials from env vars
        // For Product: pass business credentials
        const body: Record<string, any> = {
            bizId,
            orderId,
            amount,
            description,
            customerPhone,
            purpose,
        };

        if (purpose === 'product') {
            if (!businessQpaySettings?.username || !businessQpaySettings?.password) {
                throw new Error('QPay credentials not configured');
            }
            body.qpayUsername = businessQpaySettings.username;
            body.qpayPassword = businessQpaySettings.password;
            body.qpayInvoiceCode = businessQpaySettings.invoiceCode || `${businessQpaySettings.username}_INVOICE`;
        }

        const response = await fetch('/api/qpay-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay request failed: ${response.status}`);
        }

        return response.json();
    },

    /**
     * Check if payment has been made for an invoice
     * VIP: credentials resolved server-side
     * Product: credentials passed from business settings
     */
    async checkPayment(
        bizId: string,
        invoiceId: string,
        purpose: 'vip' | 'product' = 'product',
        businessQpaySettings?: { username: string; password: string }
    ): Promise<{ paid: boolean; payment: any; count: number }> {
        const body: Record<string, any> = {
            invoiceId,
            bizId,
            purpose,
        };

        if (purpose === 'product') {
            if (!businessQpaySettings?.username || !businessQpaySettings?.password) {
                throw new Error('QPay credentials not configured');
            }
            body.qpayUsername = businessQpaySettings.username;
            body.qpayPassword = businessQpaySettings.password;
        }

        const response = await fetch('/api/qpay-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay check failed: ${response.status}`);
        }

        return response.json();
    },
};
