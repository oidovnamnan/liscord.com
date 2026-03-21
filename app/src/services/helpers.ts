import { Timestamp, writeBatch, Firestore } from 'firebase/firestore';
import { db } from './firebase';

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

/**
 * Firestore WriteBatch is limited to 500 operations.
 * This helper chunks an array of items, applies a callback to each batch,
 * and commits all batches sequentially.
 *
 * Usage:
 *   await chunkedBatch(items, (batch, item) => {
 *       batch.update(doc(db, 'col', item.id), { ... });
 *   });
 */
const BATCH_LIMIT = 500;

export async function chunkedBatch<T>(
    items: T[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (batch: ReturnType<typeof writeBatch>, item: T, index: number) => void,
    firestore: Firestore = db
): Promise<void> {
    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
        const chunk = items.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(firestore);
        chunk.forEach((item, idx) => callback(batch, item, i + idx));
        await batch.commit();
    }
}
