import { useState, useEffect, useMemo } from 'react';
import { auditService } from '../../services/audit';
import { Loader2, ShieldAlert, Search, RefreshCw, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './SuperAdmin.css';

type LogFilter = 'all' | 'critical' | 'warning' | 'normal';

export function SuperAdminAudit() {
    const [logs, setLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState<LogFilter>('all');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getPlatformAuditLogs(200);
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

    const heroStats = useMemo(() => {
        const critical = logs.filter(l => l.severity === 'critical').length;
        const warning = logs.filter(l => l.severity === 'warning').length;
        const normal = logs.filter(l => !l.severity || l.severity === 'normal').length;
        return { total: logs.length, critical, warning, normal };
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (filterLevel !== 'all' && log.severity !== filterLevel) {
                if (filterLevel === 'normal' && (!log.severity || log.severity === 'normal')) {
                    // ok
                } else if (log.severity !== filterLevel) {
                    return false;
                }
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
    }, [logs, searchTerm, filterLevel]);

    const filterTabs: { id: LogFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'Бүгд', count: heroStats.total },
        { id: 'critical', label: 'Critical', count: heroStats.critical, icon: <ShieldAlert size={12} /> },
        { id: 'warning', label: 'Warning', count: heroStats.warning, icon: <AlertTriangle size={12} /> },
        { id: 'normal', label: 'Normal', count: heroStats.normal, icon: <Activity size={12} /> },
    ];

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
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)', boxShadow: '0 8px 32px rgba(234, 88, 12, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><ShieldAlert size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Системийн аудит</div>
                            <h1 className="sa-hero-title">Аудит & Лог</h1>
                            <div className="sa-hero-desc">Бүх бизнесүүд дээрх үйлдэл болон өөрчлөлтийн түүх</div>
                        </div>
                    </div>
                    <button
                        className="sa-hero-btn"
                        onClick={fetchLogs}
                        disabled={loading}
                        title="Шинэчлэх"
                        style={{ width: 42, height: 42 }}
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.total}</div>
                        <div className="sa-hero-stat-label">Нийт лог</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.critical}</div>
                        <div className="sa-hero-stat-label">Critical</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.warning}</div>
                        <div className="sa-hero-stat-label">Warning</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.normal}</div>
                        <div className="sa-hero-stat-label">Normal</div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-bar-premium" style={{ maxWidth: 400 }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Хэрэглэгч, Бизнес ID, Үйлдлээр хайх..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterLevel(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 20,
                                border: filterLevel === tab.id ? '1.5px solid var(--primary)' : '1.5px solid var(--border-primary)',
                                background: filterLevel === tab.id ? 'var(--primary)' : 'var(--surface-1)',
                                color: filterLevel === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label} <span style={{
                                background: filterLevel === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-soft)',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card no-padding overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="py-16 text-center text-secondary">
                        <Loader2 className="animate-spin mb-4" size={32} style={{ marginInline: 'auto' }} />
                        <p>Өгөгдөл уншиж байна...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="super-table min-w-[900px]">
                            <thead>
                                <tr>
                                    <th style={{ width: '150px' }}>Огноо</th>
                                    <th style={{ width: '120px' }}>Бизнес ID</th>
                                    <th style={{ width: '180px' }}>Хэрэглэгч</th>
                                    <th style={{ width: '120px' }}>Түвшин</th>
                                    <th style={{ width: '160px' }}>Үйлдэл</th>
                                    <th>Дэлгэрэнгүй</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id} className="align-top">
                                        <td className="text-secondary text-[0.8rem]">
                                            {log.createdAt instanceof Date ? log.createdAt.toLocaleString('mn-MN') : '...'}
                                        </td>
                                        <td className="font-mono text-[0.75rem] text-secondary">
                                            {log.businessId}
                                        </td>
                                        <td>
                                            <div className="font-bold text-sm">{log.userName}</div>
                                            <div className="text-tertiary text-[0.7rem]">{log.userPosition}</div>
                                        </td>
                                        <td>
                                            {getSeverityBadge(log.severity || 'normal')}
                                        </td>
                                        <td>
                                            <div className="font-bold text-sm">{formatAction(log.action)}</div>
                                            <div className="text-tertiary text-[0.75rem]">{log.module}</div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-sm mb-2">{log.targetLabel}</div>
                                            {log.changes && log.changes.length > 0 && (
                                                <div className="bg-surface-2 p-2 rounded-lg text-[0.75rem] font-mono border border-primary-light">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {log.changes.map((c: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                        <div key={i} className={`grid grid-cols-[100px_1fr] gap-2 ${i !== log.changes.length - 1 ? 'border-b border-white/10 pb-1 mb-1' : ''}`}>
                                                            <span className="text-tertiary">{c.field}:</span>
                                                            <span className="break-all">
                                                                <span className="text-danger line-through mr-2">
                                                                    {JSON.stringify(c.oldValue)}
                                                                </span>
                                                                <span className="text-success">
                                                                    {JSON.stringify(c.newValue)}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {!log.changes && log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="bg-surface-2 p-2 rounded-lg text-[0.75rem] text-secondary font-mono whitespace-pre-wrap border border-primary-light">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-secondary">
                                            <Activity size={32} className="mx-auto mb-4 opacity-20" />
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
    );
}
