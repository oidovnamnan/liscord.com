import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { auditService } from '../../../services/audit';

export function ActivityTab() {
    const { business } = useBusinessStore();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        // Fetch up to 100 recent logs
        const unsubscribe = auditService.subscribeAuditLogs(business.id, 100, (data) => {
            setLogs(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: '300px' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Үйлдэл ачаалж байна...</p>
            </div>
        );
    }

    return (
        <div className="settings-section animate-fade-in">
            <h2>Ажиллагсдын үйлдэл</h2>
            <p className="text-muted mb-6">Сүүлийн 100 үйлдлийн түүх. Энэ хэсгээс системд хэн, юу хийснийг хянах боломжтой.</p>

            <div className="activity-stream" style={{ background: 'var(--surface-2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)' }}>
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <p className="text-muted">Одоогоор үйлдэл бүртгэгдээгүй байна</p>
                    </div>
                ) : (
                    logs.map((log, i) => {
                        const date = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
                        const timeStr = date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = date.toLocaleDateString('mn-MN');

                        let icon = '📝';
                        if (log.action.includes('created')) icon = '✨';
                        if (log.action.includes('updated')) icon = '🔄';
                        if (log.action.includes('deleted')) icon = '🗑️';
                        if (log.action.includes('settings')) icon = '⚙️';
                        if (log.module === 'Auth' || log.module === 'Team') icon = '👥';

                        return (
                            <div key={log.id} className="activity-item animate-fade-in" style={{ '--index': i } as any}>
                                <div className="activity-icon">{icon}</div>
                                <div className="activity-content" style={{ flex: 1 }}>
                                    <div className="activity-text">
                                        <strong>{log.userName}</strong> <span className="text-muted">({log.userPosition || 'Ажилтан'})</span>{' '}
                                        {log.action}{' '}
                                        <span className="font-medium text-primary">{log.targetLabel}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        <span>{dateStr} {timeStr}</span>
                                        <span>&middot;</span>
                                        <span>{log.module}</span>
                                    </div>

                                    {log.changes && log.changes.length > 0 && (
                                        <div style={{ marginTop: '8px', padding: '8px', background: 'var(--background)', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {log.changes.map((change: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                                                    <span className="text-muted">{change.field}:</span>
                                                    <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{String(change.oldValue)}</span>
                                                    <span>→ {String(change.newValue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
