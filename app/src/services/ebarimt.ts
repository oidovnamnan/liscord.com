/**
 * E-Barimt (VAT) Service Wrapper
 * Handles formatting receipts into the standard POS API JSON payload 
 * and mocking the DDTD, QR, and Lottery strings for the frontend tests.
 * 
 * In a real production environment, this should trigger a Cloud Function
 * to securely hit `https://posapi.ebarimt.mn/put` to avoid CORS & Secret leaks.
 */

export interface EbarimtPayload {
    amount: string; // 1000.00
    vat: string; // 90.91
    cashAmount: string;
    nonCashAmount: string;
    cityTax: string;
    districtCode: string; // '23'
    merchantId: string; // '1234567'
    branchNo: string; // '001'
    posId: string; // '0001'
    customerNo: string; // optional TTd
    billType: '1' | '3'; // 1: ААН, 3: Иргэн
    billIdSuffix: string; // Unique string
    goods: Array<{
        code: string;
        name: string;
        measureUnit: string;
        qty: string;
        unitPrice: string;
        totalAmount: string;
        cityTax: string;
        vat: string;
        barCode: string;
    }>;
}

export const ebarimtService = {
    /**
     * Prepares the exact JSON needed by the E-Barimt POS API.
     */
    buildPayload(settings: any, orderData: any): EbarimtPayload {
        // Simplified mapping for the audit/demo
        return {
            amount: orderData.totalAmount.toFixed(2),
            vat: (orderData.totalAmount / 11).toFixed(2),
            cashAmount: orderData.totalAmount.toFixed(2),
            nonCashAmount: '0.00',
            cityTax: '0.00',
            districtCode: '23',
            merchantId: settings.ebarimt?.companyRegNo || '1234567',
            branchNo: '001',
            posId: settings.ebarimt?.posId || '0000',
            customerNo: '',
            billType: '3',
            billIdSuffix: orderData.id,
            goods: orderData.items?.map((item: any) => ({
                code: item.productId,
                name: item.name,
                measureUnit: 'ш',
                qty: item.quantity.toFixed(2),
                unitPrice: item.price.toFixed(2),
                totalAmount: (item.price * item.quantity).toFixed(2),
                cityTax: '0.00',
                vat: ((item.price * item.quantity) / 11).toFixed(2),
                barCode: item.productId,
            })) || []
        };
    },

    /**
     * Mocks a successful POS API Response for testing UI without certificates.
     */
    async mockPutReceipt(payload: EbarimtPayload) {
        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const randomHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const randomLotto = Math.floor(10000000 + Math.random() * 90000000).toString();

        return {
            success: true,
            warningMsg: '',
            errorCode: '',
            message: '',
            billId: `${payload.posId}-${payload.billIdSuffix}`,
            date: new Date().toISOString().split('T')[0],
            macAddress: 'AA:BB:CC:DD:EE:FF',
            internalCode: randomHash.substring(0, 16),
            qrData: `000000000000000000000000000000000000000000000000000000000000000000${randomHash}`,
            lottery: randomLotto,
            lotteryWarningMsg: ''
        };
    }
};
