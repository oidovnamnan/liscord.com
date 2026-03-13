/**
 * QPay V2 Integration — Real API via Cloud Functions
 * Uses httpsCallable with Anonymous Auth to bypass org IAM restrictions.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

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

/**
 * Ensure we have a Firebase Auth session (anonymous) so the callable function
 * receives an authenticated request. This bypasses the org IAM policy that
 * blocks unauthenticated Cloud Function invocations.
 */
async function ensureAuth(): Promise<void> {
    if (!auth.currentUser) {
        await signInAnonymously(auth);
    }
}

export const qpayService = {
    /**
     * Create a QPay invoice via Cloud Function callable
     */
    async createInvoice(
        bizId: string,
        orderId: string,
        amount: number,
        description: string,
        customerPhone?: string
    ): Promise<QPayInvoiceResponse> {
        // Ensure anonymous auth session for the callable
        await ensureAuth();

        const functions = getFunctions();
        const createInvoiceFn = httpsCallable(functions, 'qpayCreateInvoice');

        const result = await createInvoiceFn({
            bizId,
            orderId,
            amount,
            description,
            customerPhone,
        });

        return result.data as QPayInvoiceResponse;
    },
};
