/**
 * QPay V2 Integration — Real API via Cloud Functions
 * Calls our HTTP endpoint (not httpsCallable) to avoid CORS/IAM issues.
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

// Via Firebase Hosting rewrite — bypasses org IAM policy
const QPAY_FUNCTION_URL = '/api/qpayCreateInvoice';

export const qpayService = {
    /**
     * Create a real QPay invoice via Cloud Function HTTP endpoint
     */
    async createInvoice(
        bizId: string,
        orderId: string,
        amount: number,
        description: string,
        customerPhone?: string
    ): Promise<QPayInvoiceResponse> {
        const response = await fetch(QPAY_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bizId,
                orderId,
                amount,
                description,
                customerPhone,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `QPay request failed: ${response.status}`);
        }

        return response.json();
    },
};
