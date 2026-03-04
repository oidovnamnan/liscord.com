/**
 * Shared formatting utilities
 */

/**
 * Format number as Mongolian Tugrug currency
 */
export function fmt(n: number): string {
    return '₮' + (n || 0).toLocaleString('mn-MN');
}

/**
 * Format date as Mongolian locale string
 */
export function fmtDate(date: Date | null | undefined): string {
    if (!date) return '-';
    return date.toLocaleDateString('mn-MN');
}

/**
 * Format date + time
 */
export function fmtDateTime(date: Date | null | undefined): string {
    if (!date) return '-';
    return date.toLocaleDateString('mn-MN') + ' ' + date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
}
