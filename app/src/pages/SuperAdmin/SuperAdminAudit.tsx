import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { auditService } from '../../services/audit';
import { Loader2, ShieldAlert, Search, RefreshCw, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SuperAdminAudit() {
    const [logs, setLogs] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
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
                <div className="table-actions">
                    <div className="section-header">
                        <div className="stats-icon-wrapper danger-tint">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Глобал Өөрчлөлтүүд</h2>
                            <p className="text-secondary text-xs">Сүүлийн 200 үйлдэл</p>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-1 justify-end items-center max-w-4xl">
                        <div className="search-box">
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
                        <button className="btn btn-icon" onClick={fetchLogs} disabled={loading} title="Шинэчлэх">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

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
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        </div>
    );
}
