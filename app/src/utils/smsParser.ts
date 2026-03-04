
/**
 * Simple Regex-based parser for Mongolian Bank SMS
 */

export interface ParsedSms {
    amount: number;
    transactionId?: string;
    description?: string;
    bankName: string;
}

export const parseBankSms = (body: string): ParsedSms | null => {
    // Khan Bank Example: "Orlogo: 50,000.00 MNT ... 5000123456 ORD-1234"
    // Golomt Bank Example: "50,000.00 MNT orlogo ... note..."

    // Normalize body: remove commas from numbers to make regex easier
    const cleanBody = body.replace(/(\d),(\d{3})/g, '$1$2');

    // 1. Amount Extraction (Numbers followed by MNT, ₮, or after 'Orlogo:' / 'Орлого:')
    let amount = 0;
    const amountRegex = /(?:Орлого|Orlogo|Income):\s*([\d.]+)|([\d.]+)\s*(?:MNT|₮|ТӨГ)/i;
    const amountMatch = cleanBody.match(amountRegex);
    if (amountMatch) {
        amount = parseFloat(amountMatch[1] || amountMatch[2]);
    }

    if (amount <= 0) return null;

    // 2. Bank Identification
    let bankName = 'Unknown';
    if (body.toLowerCase().includes('khan') || body.toLowerCase().includes('хаан')) bankName = 'Khan Bank';
    else if (body.toLowerCase().includes('golomt') || body.toLowerCase().includes('голомт')) bankName = 'Golomt Bank';
    else if (body.toLowerCase().includes('tdb') || body.toLowerCase().includes('худалдаа')) bankName = 'TDB';
    else if (body.toLowerCase().includes('state bank') || body.toLowerCase().includes('төрийн')) bankName = 'State Bank';

    // 3. Description / Note extraction (usually the last part or after specific words)
    // Most banks put the note at the end.
    const parts = body.split(/\s+/);
    const description = parts.slice(-2).join(' '); // Taking last 2 words as a guess for note

    return {
        amount,
        bankName,
        description,
        transactionId: undefined // Usually banks don't give global transaction IDs in SMS, maybe per account?
    };
};
