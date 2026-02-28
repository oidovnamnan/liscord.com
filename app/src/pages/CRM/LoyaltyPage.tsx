import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, MoreVertical, Coins, Users, Star, TrendingUp, History } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { loyaltyService, customerService } from '../../services/db';
import { useNavigate } from 'react-router-dom';

export function LoyaltyPage() {
    const { business } = useBusinessStore();
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [customers, setCustomers] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        const u1 = loyaltyService.subscribeConfig(business.id, setConfig);
        const u2 = customerService.subscribeCustomers(business.id, (data) => {
            setCustomers(data.filter(c => !c.isDeleted));
            setLoading(false);
        });
        return () => { u1(); u2(); };
    }, [business?.id]);

    const filteredCustomers = customers.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleGoToSettings = () => {
        navigate('/app/settings?tab=loyalty');
    };

    return (
        <>
            <Header title="Лоялти & Оноо" action={{ label: 'Тохиргоо', onClick: handleGoToSettings }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}><Users size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{customers.length}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт гишүүд</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' }}><Star size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{customers.filter(c => (c.loyalty?.points || 0) > 100).length}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VIP гишүүд</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}><Coins size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{customers.reduce((sum, c) => sum + (c.loyalty?.points || 0), 0).toLocaleString()}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Олгосон нийт оноо</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}><TrendingUp size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{config?.enabled ? 'Идэвхтэй' : 'Идэвхгүй'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Системийн төлөв</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Харилцагч хайх (нэр, утас)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Харилцагч</th>
                                    <th>Утас</th>
                                    <th>Нийт оноо</th>
                                    <th>Зэрэглэл</th>
                                    <th>Түүх</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            Гишүүд олдсонгүй
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td>{c.phone}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Coins size={14} /> {c.loyalty?.points || 0}
                                                </div>
                                            </td>
                                            <td>
                                                {(c.loyalty?.points || 0) > 1000 ? <span className="badge badge-warning">Gold</span> :
                                                    (c.loyalty?.points || 0) > 500 ? <span className="badge badge-info">Silver</span> :
                                                        <span className="badge">Bronze</span>}
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                                                    <History size={14} /> Түүх
                                                </button>
                                            </td>
                                            <td>
                                                <button className="btn-icon">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
