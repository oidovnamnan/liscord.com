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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Нийт орлого</p>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{totalRevenue.toLocaleString()} ₮</h3>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Идэвхтэй харилцагч (Төлбөртэй)</p>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{activeCount} бизнес</h3>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-3)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Систем дэх нийт бизнес</p>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{businesses.length}</h3>
                        </div>
                    </div>
                </div>

                {/* Subscriptions List */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} className="text-primary" />
                            Багцын хугацаа (Subscriptions)
                        </h2>
                        <div style={{ display: 'flex', gap: '12px', flex: '1 1 auto', justifyContent: 'flex-end', maxWidth: '600px' }}>
                            <div className="search-bar" style={{ flex: 1 }}>
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Бизнесийн нэр, ID-гаар хайх..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <button className={`filter - btn ${filter === 'all' ? 'active' : ''} `} onClick={() => setFilter('all')}>Бүгд</button>
                                <button className={`filter - btn ${filter === 'active' ? 'active' : ''} `} onClick={() => setFilter('active')}>Идэвхтэй</button>
                                <button className={`filter - btn ${filter === 'free' ? 'active' : ''} `} onClick={() => setFilter('free')}>Free План</button>
                                <button className={`filter - btn ${filter === 'expired' ? 'active' : ''} `} onClick={() => setFilter('expired')}>Хугацаа дууссан</button>
                            </div>
                        </div>
                    </div>

                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Бизнес</th>
                                <th style={{ padding: '16px' }}>Утас / Эзэн</th>
                                <th style={{ padding: '16px' }}>Одоогийн Багц</th>
                                <th style={{ padding: '16px' }}>Дуусах хугацаа</th>
                                <th style={{ padding: '16px' }}>Төлөв</th>
                                <th style={{ padding: '16px', textAlign: 'right' }}>Үйлдэл</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBusinesses.map(b => {
                                const exp = b.subscription?.expiresAt ? new Date(b.subscription.expiresAt) : null;
                                const isExpired = !exp || exp <= new Date();
                                const isFree = b.subscription?.plan === 'free';

                                return (
                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 600 }}>{b.name}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{b.id}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div>{b.phone}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.ownerName}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ textTransform: 'capitalize', fontWeight: 600, color: isFree ? 'var(--text-secondary)' : 'var(--primary)' }}>
                                                {b.subscription?.plan || 'Free'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: isExpired && !isFree ? 'var(--danger)' : 'inherit' }}>
                                            {exp ? exp.toLocaleDateString('mn-MN') : 'Хязгааргүй'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {isFree ? (
                                                <span className="badge badge-neutral">Free Plan</span>
                                            ) : isExpired ? (
                                                <span className="badge badge-danger">Дууссан</span>
                                            ) : (
                                                <span className="badge badge-success">Идэвхтэй</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button
                                                className="btn btn-primary btn-small gradient-btn"
                                                onClick={() => handleOpenExtendModal(b)}
                                            >
                                                Сунгах
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredBusinesses.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Илэрц олдсонгүй
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Recent Payments Log */}
                <div className="card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={18} className="text-success" />
                            Сүүлийн гүйлгээ (Төлөлтүүд)
                        </h2>
                    </div>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Огноо</th>
                                <th style={{ padding: '16px' }}>Бизнес</th>
                                <th style={{ padding: '16px' }}>Төрөл</th>
                                <th style={{ padding: '16px' }}>Сар</th>
                                <th style={{ padding: '16px' }}>Дүн</th>
                                <th style={{ padding: '16px' }}>Хэлбэр</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.slice(0, 50).map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                        {p.createdAt.toLocaleString('mn-MN')}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 500 }}>{p.businessName}</td>
                                    <td style={{ padding: '16px', textTransform: 'capitalize' }}>{p.plan}</td>
                                    <td style={{ padding: '16px' }}>{p.months} сар</td>
                                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--success)' }}>
                                        +{p.amount.toLocaleString()} ₮
                                    </td>
                                    <td style={{ padding: '16px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                                        {p.paymentMethod}
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
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
