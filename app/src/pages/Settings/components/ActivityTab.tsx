import { useState, useEffect, useMemo } from 'react';
import { Loader2, Filter, Clock, Package, Users, ShoppingCart, Settings, Trash2, PlusCircle, Edit3, Search } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { auditService } from '../../../services/audit';

const MODULE_ICONS: Record<string, React.ReactNode> = {
    orders: <ShoppingCart size={14} />,
    products: <Package size={14} />,
    customers: <Users size={14} />,
    settings: <Settings size={14} />,
    Auth: <Users size={14} />,
    Team: <Users size={14} />,
};

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    created: { icon: <PlusCircle size={14} />, color: '#10b981', label: 'Үүсгэсэн' },
    updated: { icon: <Edit3 size={14} />, color: '#6366f1', label: 'Засварласан' },
    deleted: { icon: <Trash2 size={14} />, color: '#ef4444', label: 'Устгасан' },
    default: { icon: <Clock size={14} />, color: '#f59e0b', label: 'Үйлдэл' },
};

function getActionConfig(action: string) {
    if (action.includes('create')) return ACTION_CONFIG.created;
    if (action.includes('update') || action.includes('edit')) return ACTION_CONFIG.updated;
    if (action.includes('delete') || action.includes('remove')) return ACTION_CONFIG.deleted;
    return ACTION_CONFIG.default;
}

export function ActivityTab() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUser, setFilterUser] = useState('all');
    const [filterModule, setFilterModule] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = auditService.subscribeAuditLogs(business.id, 500, (data) => {
            setLogs(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    // Unique users and modules for filters
    const uniqueUsers = useMemo(() => {
        const map = new Map<string, string>();
        logs.forEach(l => { if (l.userId && l.userName) map.set(l.userId, l.userName); });
        return Array.from(map.entries());
    }, [logs]);

    const uniqueModules = useMemo(() => {
        return [...new Set(logs.map(l => l.module).filter(Boolean))];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(l => {
            if (filterUser !== 'all' && l.userId !== filterUser) return false;
            if (filterModule !== 'all' && l.module !== filterModule) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const match = (l.userName || '').toLowerCase().includes(term) ||
                    (l.action || '').toLowerCase().includes(term) ||
                    (l.targetLabel || '').toLowerCase().includes(term);
                if (!match) return false;
            }
            return true;
        });
    }, [logs, filterUser, filterModule, searchTerm]);

    // Group by date
    const groupedLogs = useMemo(() => {
        const groups: Record<string, typeof filteredLogs> = {};
        filteredLogs.forEach(log => {
            const d = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
            const key = d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });
        return groups;
    }, [filteredLogs]);

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

            {/* Stats Strip */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{
                    padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-1)',
                    border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{logs.length}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>нийт бүртгэл</span>
                </div>
                <div style={{
                    padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-1)',
                    border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Users size={14} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{uniqueUsers.length}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ажилтан</span>
                </div>
                <div style={{
                    padding: '10px 16px', borderRadius: '12px', background: 'var(--surface-1)',
                    border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Package size={14} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{uniqueModules.length}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>модуль</span>
                </div>
            </div>

            {/* Filters Row */}
            <div style={{
                display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center',
                padding: '12px 16px', background: 'var(--surface-2)', borderRadius: '14px',
                border: '1px solid var(--border-primary)'
            }}>
                <Filter size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '140px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        placeholder="Хайх..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem', borderRadius: '10px' }}
                    />
                </div>

                <select
                    className="input"
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    style={{ height: '36px', fontSize: '0.85rem', borderRadius: '10px', minWidth: '140px', flex: '0 1 auto' }}
                >
                    <option value="all">👤 Бүх ажилтан</option>
                    {uniqueUsers.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>

                <select
                    className="input"
                    value={filterModule}
                    onChange={e => setFilterModule(e.target.value)}
                    style={{ height: '36px', fontSize: '0.85rem', borderRadius: '10px', minWidth: '120px', flex: '0 1 auto' }}
                >
                    <option value="all">📦 Бүх модуль</option>
                    {uniqueModules.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {(filterUser !== 'all' || filterModule !== 'all' || searchTerm) && (
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => { setFilterUser('all'); setFilterModule('all'); setSearchTerm(''); }}
                        style={{ height: '36px', borderRadius: '10px', fontSize: '0.8rem', flexShrink: 0 }}
                    >
                        Цэвэрлэх
                    </button>
                )}
            </div>

            {/* Results Count */}
            {(filterUser !== 'all' || filterModule !== 'all' || searchTerm) && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {filteredLogs.length} үр дүн олдлоо
                </p>
            )}

            {/* Activity Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.keys(groupedLogs).length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 20px',
                        background: 'var(--surface-2)', borderRadius: '16px', border: '1px solid var(--border-primary)'
                    }}>
                        <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {logs.length > 0 ? 'Шүүлтүүрт тохирох үйлдэл олдсонгүй' : 'Одоогоор үйлдэл бүртгэгдээгүй'}
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([dateLabel, dateLogs]) => (
                        <div key={dateLabel}>
                            {/* Date Header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
                                padding: '0 4px'
                            }}>
                                <span style={{
                                    fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap'
                                }}>{dateLabel}</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border-primary)' }} />
                                <span style={{
                                    fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600
                                }}>{dateLogs.length} үйлдэл</span>
                            </div>

                            {/* Log Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {dateLogs.map((log) => {
                                    const d = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
                                    const timeStr = d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
                                    const ac = getActionConfig(log.action);
                                    const moduleIcon = MODULE_ICONS[log.module];

                                    return (
                                        <div key={log.id} style={{
                                            display: 'flex', gap: '12px', padding: '12px 14px',
                                            background: 'var(--surface-1)', borderRadius: '12px',
                                            border: '1px solid var(--border-primary)',
                                            transition: 'border-color 0.2s',
                                            alignItems: 'flex-start'
                                        }}>
                                            {/* Action icon */}
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: `${ac.color}15`, color: ac.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, marginTop: '2px'
                                            }}>
                                                {ac.icon}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                                                    <strong style={{ fontWeight: 700 }}>{log.userName}</strong>{' '}
                                                    <span style={{
                                                        fontSize: '0.75rem', padding: '2px 6px', borderRadius: '6px',
                                                        background: `${ac.color}12`, color: ac.color, fontWeight: 600
                                                    }}>{ac.label}</span>{' '}
                                                    <span style={{ color: 'var(--text-secondary)' }}>{log.targetLabel}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeStr}</span>
                                                    {moduleIcon && (
                                                        <>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>•</span>
                                                            <span style={{
                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                fontSize: '0.75rem', color: 'var(--text-muted)'
                                                            }}>
                                                                {moduleIcon} {log.module}
                                                            </span>
                                                        </>
                                                    )}
                                                    {log.userPosition && (
                                                        <>
                                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>•</span>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.userPosition}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Changes detail */}
                                                {log.changes && log.changes.length > 0 && (
                                                    <div style={{
                                                        marginTop: '8px', padding: '8px 10px', borderRadius: '8px',
                                                        background: 'var(--surface-2)', fontSize: '0.78rem',
                                                        border: '1px solid var(--border-primary)'
                                                    }}>
                                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                        {log.changes.map((c: any, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{c.field}:</span>
                                                                <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{String(c.oldValue)}</span>
                                                                <span style={{ color: 'var(--primary)' }}>→ {String(c.newValue)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
