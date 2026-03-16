/**
 * QPay V2 Integration — via Vercel Serverless Functions
 * 
 * Calls /api/qpay-invoice on the same domain (Vercel).
 * No CORS issues since it's same-origin.
 * QPay credentials are server-side only.
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
     */
    async createInvoice(
        bizId: string,
        orderId: string,
        amount: number,
        description: string,
        customerPhone?: string,
        purpose: 'vip' | 'product' = 'product'
    ): Promise<QPayInvoiceResponse> {
        const response = await fetch('/api/qpay-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bizId,
                orderId,
                amount,
                description,
                customerPhone,
                purpose,
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
        bizId: string,
        invoiceId: string
    ): Promise<{ paid: boolean; payment: any; count: number }> {
        const response = await fetch('/api/qpay-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bizId, invoiceId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay check failed: ${response.status}`);
        }

        return response.json();
    },
};
