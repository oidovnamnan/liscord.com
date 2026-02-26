import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { auditService } from '../../services/audit';
import { Loader2, ShieldAlert, Search, RefreshCw, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SuperAdminAudit() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getPlatformAuditLogs(200); // Fetch last 200 globally
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch platform audit logs:', error);
            toast.error('Лог татахад алдаа гарлаа. (FireStore Index хэрэгтэй байж магадгүй)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filterLevel !== 'all' && log.severity !== filterLevel) {
            return false;
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const searchableString = `
                ${log.action} ${log.module} ${log.targetLabel} 
                ${log.userName} ${log.userPosition} ${log.businessId}
            `.toLowerCase();
            return searchableString.includes(term);
        }

        return true;
    });

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <span className="badge badge-cancelled">Critical</span>;
            case 'warning': return <span className="badge badge-preparing">Warning</span>;
            default: return <span className="badge badge-soft">Normal</span>;
        }
    };

    const formatAction = (action: string) => {
        switch (action) {
            case 'create': return '✨ Үүсгэлээ';
            case 'update': return '✏️ Шинэчлэлээ';
            case 'delete': return '🗑️ Устгалаа';
            case 'login': return '🔑 Нэвтэрлээ';
            default: return action;
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Системийн Аудит Лог"
                subtitle="Бүх бизнесүүд дээрх хэрэглэгчдийн үйлдэл болон өөрчлөлтийн түүх"
            />

            <div className="page-content">
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Глобал Өөрчлөлтүүд</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Сүүлийн 200 үйлдэл</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flex: '1 1 auto', justifyContent: 'flex-end', maxWidth: '700px' }}>
                            <div className="search-bar" style={{ flex: 1 }}>
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Хэрэглэгч, Бизнес ID, Үйлдлээр хайх..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <button className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`} onClick={() => setFilterLevel('all')}>Бүгд</button>
                                <button className={`filter-btn ${filterLevel === 'critical' ? 'active' : ''}`} onClick={() => setFilterLevel('critical')}>Critical</button>
                                <button className={`filter-btn ${filterLevel === 'warning' ? 'active' : ''}`} onClick={() => setFilterLevel('warning')}>Warning</button>
                            </div>
                            <button className="btn btn-outline" onClick={fetchLogs} disabled={loading}>
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {loading && logs.length === 0 ? (
                        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                            <p>Өгөгдөл уншиж байна...</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '16px', width: '140px' }}>Огноо</th>
                                        <th style={{ padding: '16px', width: '120px' }}>Бизнес ID</th>
                                        <th style={{ padding: '16px', width: '160px' }}>Хэрэглэгч</th>
                                        <th style={{ padding: '16px', width: '120px' }}>Түвшин</th>
                                        <th style={{ padding: '16px', width: '140px' }}>Үйлдэл</th>
                                        <th style={{ padding: '16px' }}>Дэлгэрэнгүй</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                {log.createdAt instanceof Date ? log.createdAt.toLocaleString('mn-MN') : '...'}
                                            </td>
                                            <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {log.businessId}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.userName}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.userPosition}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {getSeverityBadge(log.severity || 'normal')}
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 500, fontSize: '0.9rem' }}>
                                                {formatAction(log.action)} <br />
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 400 }}>{log.module}</span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '0.9rem' }}>{log.targetLabel}</div>
                                                {log.changes && log.changes.length > 0 && (
                                                    <div style={{ background: 'var(--surface-2)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                        {log.changes.map((c: any, i: number) => (
                                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, auto) 1fr', gap: '8px', borderBottom: i !== log.changes.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: i !== log.changes.length - 1 ? '4px' : '0', marginBottom: i !== log.changes.length - 1 ? '4px' : '0' }}>
                                                                <span style={{ color: 'var(--text-secondary)' }}>{c.field}:</span>
                                                                <span style={{ wordBreak: 'break-all' }}>
                                                                    <span style={{ color: 'var(--danger)', textDecoration: 'line-through', marginRight: '4px' }}>
                                                                        {JSON.stringify(c.oldValue)}
                                                                    </span>
                                                                    <span style={{ color: 'var(--success)' }}>
                                                                        {JSON.stringify(c.newValue)}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {!log.changes && log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <div style={{ background: 'var(--surface-2)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                <Activity size={32} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                                                Илэрц олдсонгүй
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
