import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firestore timestamps in an object to Dates
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertTimestamps(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map(item => convertTimestamps(item));

    const result = { ...data };
    for (const key in result) {
        result[key] = convertTimestamps(result[key]);
    }
    return result;
}
