import { useState, useEffect, useMemo } from 'react';
import { platformFinanceService, businessService } from '../../services/db';
import { DollarSign, Loader2, Search, Activity, Sparkles, CheckCircle2, Clock, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { PlatformPayment, Business } from '../../types';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

type BizFilter = 'all' | 'active' | 'free' | 'expired';

export function SuperAdminFinance() {
    const [payments, setPayments] = useState<PlatformPayment[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<BizFilter>('all');

    // Extension modal state
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [extendMonths, setExtendMonths] = useState(1);
    const [extendPlan, setExtendPlan] = useState<'free' | 'pro' | 'business'>('pro');
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bDocs, pDocs] = await Promise.all([
                businessService.getSystemBusinesses(),
                platformFinanceService.getPayments()
            ]);
            setBusinesses(bDocs);
            setPayments(pDocs);
        } catch (error) {
            console.error('Failed to fetch finance data:', error);
            toast.error('Мэдээлэл татахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenExtendModal = (b: Business) => {
        setSelectedBusiness(b);
        setExtendPlan(b.subscription?.plan || 'pro');
        setExtendMonths(1);
        setIsExtendModalOpen(true);
    };

    const handleExtendSubmitClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;
        setShowSecurityModal(true);
    };

    const handleExtendSubmit = async () => {
        if (!selectedBusiness) return;
        setShowSecurityModal(false);
        setSaving(true);
        try {
            await platformFinanceService.extendBusinessSubscription(
                selectedBusiness.id,
                extendPlan,
                extendMonths
            );
            toast.success('Хугацаа амжилттай сунгагдлаа');
            setIsExtendModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to extend subscription:', error);
            toast.error('Сунгалт хийхэд алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    // Calculate Stats
    const totalRevenue = payments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0);

    const heroStats = useMemo(() => {
        const now = new Date();
        const active = businesses.filter(b => {
            const exp = b.subscription?.expiresAt;
            return exp && new Date(exp) > now && b.subscription?.plan !== 'free';
        }).length;
        const free = businesses.filter(b => b.subscription?.plan === 'free').length;
        const expired = businesses.filter(b => {
            const exp = b.subscription?.expiresAt ? new Date(b.subscription.expiresAt) : null;
            return !exp || exp <= now;
        }).length;
        return { total: businesses.length, active, free, expired };
    }, [businesses]);

    const filteredBusinesses = useMemo(() => {
        return businesses.filter(b => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!b.name.toLowerCase().includes(term) && !b.id.toLowerCase().includes(term)) {
                    return false;
                }
            }
            const now = new Date();
            const exp = b.subscription?.expiresAt ? new Date(b.subscription.expiresAt) : null;

            switch (filter) {
                case 'active': return exp && exp > now && b.subscription?.plan !== 'free';
                case 'expired': return !exp || exp <= now;
                case 'free': return b.subscription?.plan === 'free';
                default: return true;
            }
        });
    }, [businesses, searchTerm, filter]);

    const filterTabs: { id: BizFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'Бүгд', count: heroStats.total },
        { id: 'active', label: 'Идэвхтэй', count: heroStats.active, icon: <CheckCircle2 size={12} /> },
        { id: 'free', label: 'Free', count: heroStats.free, icon: <Tag size={12} /> },
        { id: 'expired', label: 'Дууссан', count: heroStats.expired, icon: <Clock size={12} /> },
    ];

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Санхүүгийн мэдээлэл уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 40%, #0ea5e9 100%)', boxShadow: '0 8px 32px rgba(5, 150, 105, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><DollarSign size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Санхүүгийн удирдлага</div>
                            <h1 className="sa-hero-title">Санхүү (P&L)</h1>
                            <div className="sa-hero-desc">Бизнесүүдийн эрх, сунгалт болон нийт орлогын хяналт</div>
                        </div>
                    </div>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{totalRevenue.toLocaleString()}₮</div>
                        <div className="sa-hero-stat-label">Нийт орлого</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.active}</div>
                        <div className="sa-hero-stat-label">Идэвхтэй (Төлбөртэй)</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.free}</div>
                        <div className="sa-hero-stat-label">Free план</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.total}</div>
                        <div className="sa-hero-stat-label">Нийт бизнес</div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-bar-premium" style={{ maxWidth: 400 }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Бизнесийн нэр, ID-гаар хайх..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 20,
                                border: filter === tab.id ? '1.5px solid var(--primary)' : '1.5px solid var(--border-primary)',
                                background: filter === tab.id ? 'var(--primary)' : 'var(--surface-1)',
                                color: filter === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label} <span style={{
                                background: filter === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-soft)',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Subscriptions Table ── */}
            <div className="card no-padding overflow-hidden">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <Activity size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Бизнесүүдийн эрх</h3>
                </div>
                <table className="super-table">
                    <thead>
                        <tr>
                            <th>Бизнес</th>
                            <th>Утас / Эзэн</th>
                            <th>Одоогийн Багц</th>
                            <th>Дуусах хугацаа</th>
                            <th>Төлөв</th>
                            <th className="text-right">Үйлдэл</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBusinesses.map(b => {
                            const exp = b.subscription?.expiresAt ? new Date(b.subscription.expiresAt) : null;
                            const isExpired = !exp || exp <= new Date();
                            const isFree = b.subscription?.plan === 'free';

                            return (
                                <tr key={b.id}>
                                    <td>
                                        <div className="font-bold">{b.name}</div>
                                        <div className="text-secondary text-xs font-mono">{b.id.substring(0, 16)}...</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{b.phone}</div>
                                        <div className="text-secondary text-xs">{b.ownerName}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${isFree ? 'badge-neutral' : 'badge-primary'} font-bold`}>
                                            {b.subscription?.plan?.toUpperCase() || 'FREE'}
                                        </span>
                                    </td>
                                    <td className={isExpired && !isFree ? 'text-danger font-bold' : 'text-secondary font-medium'}>
                                        {exp ? exp.toLocaleDateString('mn-MN') : 'Хязгааргүй'}
                                    </td>
                                    <td>
                                        {isFree ? (
                                            <span className="badge badge-neutral">Free Plan</span>
                                        ) : isExpired ? (
                                            <span className="badge badge-danger">Дууссан</span>
                                        ) : (
                                            <span className="badge badge-delivered">Идэвхтэй</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-primary btn-sm gradient-btn"
                                                onClick={() => handleOpenExtendModal(b)}
                                            >
                                                Сунгах
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredBusinesses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-secondary">
                                    Илэрц олдсонгүй
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Recent Payments Log ── */}
            <div style={{ marginTop: 28 }}>
                <div className="card no-padding overflow-hidden">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <DollarSign size={16} />
                        </div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Сүүлийн гүйлгээ (Төлөлтүүд)</h3>
                    </div>
                    <table className="super-table">
                        <thead>
                            <tr>
                                <th style={{ width: '180px' }}>Огноо</th>
                                <th>Бизнес</th>
                                <th>Төрөл</th>
                                <th>Сар</th>
                                <th>Дүн</th>
                                <th>Хэлбэр</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.slice(0, 50).map(p => (
                                <tr key={p.id}>
                                    <td className="text-secondary text-xs">
                                        {p.createdAt.toLocaleString('mn-MN')}
                                    </td>
                                    <td>
                                        <div className="font-bold">{p.businessName}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-primary">{p.plan?.toUpperCase()}</span>
                                    </td>
                                    <td>{p.months} сар</td>
                                    <td>
                                        <div className="font-bold text-success">
                                            +{p.amount.toLocaleString()} ₮
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-2 px-2 py-1 rounded-md border border-primary-light/30">
                                            {p.paymentMethod}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-secondary">
                                        Одоогоор төлөлт бүртгэгдээгүй байна
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Extend Modal */}
            {isExtendModalOpen && selectedBusiness && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Эрх сунгах</h2>
                            <button className="btn-icon" onClick={() => setIsExtendModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleExtendSubmitClick}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px' }}>
                                    <strong>{selectedBusiness.name}</strong>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        Одоогийн дуусах хугацаа: {selectedBusiness.subscription?.expiresAt
                                            ? new Date(selectedBusiness.subscription.expiresAt).toLocaleDateString('mn-MN')
                                            : 'Байхгүй'}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Багцын төрөл</label>
                                    <select
                                        className="input"
                                        value={extendPlan}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onChange={e => setExtendPlan(e.target.value as any)}
                                    >
                                        <option value="free">Free (Үнэгүй)</option>
                                        <option value="pro">Pro</option>
                                        <option value="business">Business</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Сунгах хугацаа (сараар)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="1"
                                        max="120"
                                        value={extendMonths}
                                        onChange={e => setExtendMonths(parseInt(e.target.value) || 1)}
                                        required
                                    />
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <em>Сонгосон хугацаагаар одоо байгаа дуусах хугацаан дээр нэмэгдэж тооцогдоно.</em>
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsExtendModalOpen(false)}>Болих</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : 'Сунгах'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={handleExtendSubmit}
                    onClose={() => setShowSecurityModal(false)}
                />
            )}
        </div>
    );
}
