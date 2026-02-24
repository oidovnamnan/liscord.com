import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebase';

export type AuditSeverity = 'normal' | 'warning' | 'critical';

export interface AuditLogData {
    action: string;
    module: string;
    targetType: string;
    targetId: string;
    targetLabel: string;
    changes?: { field: string; oldValue: any; newValue: any }[];
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
}

export const auditService = {
    async writeLog(bizId: string, data: AuditLogData, employeeProfile?: any) {
        if (!auth.currentUser) return;

        try {
            await addDoc(collection(db, 'businesses', bizId, 'auditLog'), {
                ...data,
                userId: auth.currentUser.uid,
                userName: employeeProfile?.name || auth.currentUser.displayName || 'Систем',
                userPosition: employeeProfile?.positionName || 'Ажилтан',
                severity: data.severity || 'normal',
                createdAt: serverTimestamp(),
                metadata: {
                    ...data.metadata,
                    userAgent: navigator.userAgent,
                }
            });
        } catch (error) {
            console.error('Audit Log writing failed:', error);
            // Don't throw error to prevent blocking the main action in production
            // but log it to console or crash reporting
        }
    },

    subscribeAuditLogs(bizId: string, limitCount: number, callback: (logs: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'auditLog'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    // Basic date conversion without pulling in the full converter
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            });
            callback(logs);
        });
    }
};
