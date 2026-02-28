/**
 * QPay V2 Integration Wrapper
 * Simulates standard QPay API behavior for generating invoices and QR codes.
 * In production, these calls must be routed through a backend to protect the Client ID and Secret.
 */

export interface QPayInvoiceRequest {
    invoice_code: string; // The merchant's invoice code
    sender_invoice_no: string; // Unique order ID
    invoice_receiver_code: string; // Optional customer identifier
    invoice_description: string;
    amount: number;
    callback_url?: string;
}

export interface QPayInvoiceResponse {
    invoice_id: string; // QPay's internal invoice ID
    qr_text: string; // The raw QR content
    qr_image: string; // Base64 image
    qPay_shortUrl: string; // deeplink URL
    urls: Array<{
        name: string;
        description: string;
        logo: string;
        link: string;
    }>;
}

export const qpayService = {
    /**
     * Mocks generating a QPay invoice. Returns a fake base64 QR and deep links.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    async mockCreateInvoice(request: QPayInvoiceRequest, _settings?: any): Promise<QPayInvoiceResponse> {
        // Simulate network
        await new Promise(resolve => setTimeout(resolve, 600));

        // Generate a fake QR data string
        const fakeQR = `00020101021226500014mn.mobicom.qpay0128${request.sender_invoice_no}520459995303496540${request.amount.toString().length}${request.amount}5802MN5911Liscord POS6011Ulaanbaatar62250121${Date.now()}6304`;

        return {
            invoice_id: `QPAY-${Date.now()}`,
            qr_text: fakeQR,
            // 1x1 transparent base64 image as placeholder for demonstration
            qr_image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            qPay_shortUrl: `https://qpay.mn/q/${request.sender_invoice_no}`,
            urls: [
                { name: 'Хаан Банк', description: 'Khaan Bank', logo: 'khaan', link: `khaanbank://q?q=${fakeQR}` },
                { name: 'Голомт Банк', description: 'Golomt Bank', logo: 'golomt', link: `golomtbank://q?q=${fakeQR}` },
                { name: 'Төрийн Банк', description: 'State Bank', logo: 'state', link: `statebank://q?q=${fakeQR}` }
            ]
        };
    },

    /**
     * Mocks checking the payment status of an invoice
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async mockCheckPayment(_invoiceId: string): Promise<{ paid_amount: number; status: 'PAID' | 'NEW' }> {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Randomly succeed after a few tries in the demo
        const isPaid = Math.random() > 0.5;

        return {
            paid_amount: isPaid ? 100 : 0,
            status: isPaid ? 'PAID' : 'NEW'
        };
    }
};
