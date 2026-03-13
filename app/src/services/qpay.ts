/**
 * QPay V2 Integration — Real API via Cloud Functions
 * All QPay calls go through our Cloud Function (qpayCreateInvoice) 
 * to keep credentials server-side.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

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
     * Create a real QPay invoice via Cloud Function
     */
    async createInvoice(
        bizId: string,
        orderId: string,
        amount: number,
        description: string,
        customerPhone?: string
    ): Promise<QPayInvoiceResponse> {
        const functions = getFunctions();
        const createInvoiceFn = httpsCallable<
            {
                bizId: string;
                orderId: string;
                amount: number;
                description: string;
                customerPhone?: string;
            },
            QPayInvoiceResponse
        >(functions, 'qpayCreateInvoice');

        const result = await createInvoiceFn({
            bizId,
            orderId,
            amount,
            description,
            customerPhone,
        });

        return result.data;
    },
};
