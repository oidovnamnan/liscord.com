import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { platformFinanceService, businessService } from '../../services/db';
import { TrendingUp, DollarSign, Calendar, Loader2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { PlatformPayment, Business } from '../../types';

export function SuperAdminFinance() {
    const [payments, setPayments] = useState<PlatformPayment[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'free'>('all');

    // Extension modal state
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [extendMonths, setExtendMonths] = useState(1);
    const [extendPlan, setExtendPlan] = useState<'free' | 'pro' | 'business'>('pro');
    const [saving, setSaving] = useState(false);

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

    const handleExtendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;

        setSaving(true);
        try {
            await platformFinanceService.extendBusinessSubscription(
                selectedBusiness.id,
                extendPlan,
                extendMonths
            );
            toast.success('Хугацаа амжилттай сунгагдлаа');
            setIsExtendModalOpen(false);
            fetchData(); // Refresh list
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

    const activeCount = businesses.filter(b => {
        const exp = b.subscription?.expiresAt;
        return exp && new Date(exp) > new Date();
    }).length;

    const filteredBusinesses = businesses.filter(b => {
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

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Санхүүгийн мэдээлэл уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Платформын Санхүү"
                subtitle="Бизнесүүдийн эрх, сунгалт болон нийт орлогын хяналт"
            />

            <div className="page-content">
                {/* Dashboard Cards */}
                <div className="stats-grid">
                    <div className="stat-card hover-card">
                        <div className="stat-icon green">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Нийт орлого</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{totalRevenue.toLocaleString()} ₮</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card hover-card">
                        <div className="stat-icon purple">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Идэвхтэй харилцагч (Төлбөртэй)</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{activeCount} бизнес</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card hover-card">
                        <div className="stat-icon blue">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Систем дэх нийт бизнес</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{businesses.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="table-actions">
                    <div className="section-header">
                        <div className="stats-icon-wrapper active-tint">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Бизнесүүдийн эрх</h2>
                    </div>

                    <div className="flex gap-3 flex-1 justify-end items-center max-w-4xl">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Бизнесийн нэр, ID-гаар хайх..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Бүгд</button>
                            <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Идэвхтэй</button>
                            <button className={`filter-btn ${filter === 'free' ? 'active' : ''}`} onClick={() => setFilter('free')}>Free</button>
                            <button className={`filter-btn ${filter === 'expired' ? 'active' : ''}`} onClick={() => setFilter('expired')}>Дууссан</button>
                        </div>
                    </div>
                </div>

                <div className="card no-padding overflow-hidden">
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
                                            <div className="text-secondary text-xs font-mono">{b.id}</div>
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
                                            <div className="row-actions justify-end">
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

                {/* Recent Payments Log */}
                <div className="mt-8">
                    <div className="table-actions">
                        <div className="section-header">
                            <div className="stats-icon-wrapper success-tint">
                                <DollarSign size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Сүүлийн гүйлгээ (Төлөлтүүд)</h2>
                        </div>
                    </div>

                    <div className="card no-padding overflow-hidden">
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
            </div>

            {/* Extend Modal */}
            {isExtendModalOpen && selectedBusiness && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Эрх сунгах</h2>
                            <button className="btn-icon" onClick={() => setIsExtendModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleExtendSubmit}>
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
        </div>
    );
}
