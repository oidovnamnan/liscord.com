
/**
 * SMS Parser Utilities — shared between BankSmsSync and SmsTemplateSettings
 */

export interface ParsedSms {
    amount: number;
    utga: string;
    bank: string;
    matched: boolean;
}

export interface SmsTemplate {
    id: string;
    bankName: string;
    senderNumbers: string[];
    incomeKeywords: string[];
    amountPrefix: string;
    amountSuffix: string;
    utgaPrefix: string;
    utgaSuffix: string;
    sampleSms: string;
    isActive: boolean;
    isDefault: boolean;
    amountPattern?: string;
    utgaPattern?: string;
}

/**
 * Parse SMS using prefix/suffix text markers.
 * Finds text between prefix and suffix to extract value.
 */
export function parseWithMarkers(
    smsBody: string,
    prefix: string,
    suffix: string
): string {
    if (!prefix) return '';
    const lower = smsBody.toLowerCase();
    const prefixLower = prefix.toLowerCase();
    const prefixIdx = lower.indexOf(prefixLower);
    if (prefixIdx === -1) return '';

    const startIdx = prefixIdx + prefix.length;

    if (!suffix) {
        // No suffix: take until end of line, comma, period followed by space, or next whitespace-heavy break
        const rest = smsBody.substring(startIdx);
        // Find end: newline, or ", " or ".  " or double space
        const endMatch = rest.match(/[\n]|,\s|\.\s\s/);
        return endMatch ? rest.substring(0, endMatch.index).trim() : rest.trim();
    }

    const suffixLower = suffix.toLowerCase();
    const suffixIdx = lower.indexOf(suffixLower, startIdx);
    if (suffixIdx === -1) {
        // Suffix not found: take everything after prefix until line end
        const rest = smsBody.substring(startIdx);
        const nlIdx = rest.indexOf('\n');
        return nlIdx > -1 ? rest.substring(0, nlIdx).trim() : rest.trim();
    }

    return smsBody.substring(startIdx, suffixIdx).trim();
}

export function tryParseWithTemplate(template: SmsTemplate, smsBody: string): ParsedSms {
    let amount = 0;
    let utga = '';
    let matched = false;

    // Check income keywords
    const hasKeyword = template.incomeKeywords.some(kw =>
        smsBody.toLowerCase().includes(kw.toLowerCase())
    );
    if (!hasKeyword) return { amount, utga, bank: template.bankName, matched: false };

    // Parse amount by prefix/suffix markers
    if (template.amountPrefix) {
        const amountStr = parseWithMarkers(smsBody, template.amountPrefix, template.amountSuffix);
        if (amountStr) {
            const parsed = parseFloat(amountStr.replace(/[,\s]/g, ''));
            if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                matched = true;
            }
        }
    }

    // Parse utga by prefix/suffix markers
    if (template.utgaPrefix) {
        utga = parseWithMarkers(smsBody, template.utgaPrefix, template.utgaSuffix);
    }

    // Fallback: try old regex patterns if markers didn't work
    if (!matched && template.amountPattern) {
        try {
            const amountRegex = new RegExp(template.amountPattern, 'i');
            const amountMatch = smsBody.match(amountRegex);
            if (amountMatch?.[1]) {
                amount = parseFloat(amountMatch[1].replace(/[,\s]/g, ''));
                matched = amount > 0;
            }
        } catch (_e) { /* invalid regex */ }
    }
    if (!utga && template.utgaPattern) {
        try {
            const utgaRegex = new RegExp(template.utgaPattern, 'i');
            const utgaMatch = smsBody.match(utgaRegex);
            if (utgaMatch?.[1]) {
                utga = utgaMatch[1].trim();
            }
        } catch (_e) { /* invalid regex */ }
    }

    // Fallback: MNT amount pattern
    if (!matched) {
        const mntFallback = smsBody.match(/(\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*(?:MNT|₮|mnt)/i);
        if (mntFallback) {
            amount = parseFloat(mntFallback[1].replace(/,/g, ''));
            matched = amount > 0;
        }
    }

    return { amount, utga, bank: template.bankName, matched };
}

/**
 * Try parsing an SMS body against all templates.
 * Prefers the template that extracts BOTH amount and utga over one that only extracts amount.
 * This avoids issues when multiple templates exist for the same bank with slightly different markers.
 */
export function parseSmsByTemplates(smsBody: string, templates: SmsTemplate[]): ParsedSms | null {
    if (!smsBody) return null;

    let bestResult: ParsedSms | null = null;
    let bestScore = 0; // 0 = no match, 1 = amount only, 2 = amount + utga

    for (const tmpl of templates) {
        if (!tmpl.isActive) continue;
        const result = tryParseWithTemplate(tmpl, smsBody);
        if (!result.matched) continue;

        const score = result.utga ? 2 : 1;
        if (score > bestScore) {
            bestResult = result;
            bestScore = score;
        }
        // If we already have a perfect match (amount + utga), stop
        if (bestScore === 2) break;
    }

    return bestResult;
}
