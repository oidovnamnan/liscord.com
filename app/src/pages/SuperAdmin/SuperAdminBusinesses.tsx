import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    MoreVertical,
    Clock,
    Lock,
    Building2,
    Sparkles,
    CheckCircle2,
    XCircle,
    Crown
} from 'lucide-react';
import { businessService } from '../../services/db';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore, useBusinessStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

type BizFilter = 'all' | 'active' | 'disabled' | 'pro';

export function SuperAdminBusinesses() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, setImpersonatedBusinessId } = useAuthStore();
    const { setBusiness, setEmployee } = useBusinessStore();
    const navigate = useNavigate();
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedBiz, setSelectedBiz] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeFilter, setActiveFilter] = useState<BizFilter>('all');
    const [bulkSaving, setBulkSaving] = useState(false);

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        try {
            const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setBusinesses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleToggleStatus = async (biz: any) => {
        try {
            await businessService.toggleBusinessStatus(biz.id, !biz.isDisabled);
            toast.success(biz.isDisabled ? 'Бизнесийг идэвхжүүллээ' : 'Бизнесийг зогсоолоо');
            loadBusinesses();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleBulkToggle = async (isDisabled: boolean) => {
        if (selectedIds.length === 0) return;
        setBulkSaving(true);
        try {
            await businessService.bulkToggleBusinesses(selectedIds, isDisabled);
            toast.success(`${selectedIds.length} бизнесийн төлөв шинэчлэгдлээ`);
            setSelectedIds([]);
            loadBusinesses();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Үйлдэл амжилтгүй');
        } finally {
            setBulkSaving(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleImpersonateClick = (biz: any) => {
        setSelectedBiz(biz);
        setShowSecurityModal(true);
    };

    const handleImpersonate = async () => {
        if (!user || !selectedBiz) return;
        setShowSecurityModal(false);
        const biz = selectedBiz;

        try {
            toast.loading(`${biz.name} рүү нэвтэрч байна...`);
            const [bizData, empData] = await Promise.all([
                businessService.getBusiness(biz.id),
                businessService.getEmployeeProfile(biz.id, biz.ownerId)
            ]);

            setImpersonatedBusinessId(biz.id);
            setBusiness(bizData);
            setEmployee(empData);

            toast.dismiss();
            navigate('/app');
            toast.success(`Та ${biz.name} бизнесийг хянаж байна`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.dismiss();
            toast.error('Нэвтрэхэд алдаа гарлаа');
        } finally {
            setSelectedBiz(null);
        }
    };

    // Compute hero stats
    const heroStats = useMemo(() => {
        const active = businesses.filter(b => !b.isDisabled).length;
        const disabled = businesses.filter(b => b.isDisabled).length;
        const pro = businesses.filter(b => b.subscription?.plan === 'pro' || b.subscription?.plan === 'business').length;
        return { total: businesses.length, active, disabled, pro };
    }, [businesses]);

    const filtered = useMemo(() => {
        return businesses.filter(b => {
            const matchesSearch = b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesFilter = true;
            if (activeFilter === 'active') matchesFilter = !b.isDisabled;
            else if (activeFilter === 'disabled') matchesFilter = !!b.isDisabled;
            else if (activeFilter === 'pro') matchesFilter = b.subscription?.plan === 'pro' || b.subscription?.plan === 'business';
            return matchesSearch && matchesFilter;
        });
    }, [businesses, searchTerm, activeFilter]);

    const filterTabs: { id: BizFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'Бүгд', count: heroStats.total },
        { id: 'active', label: 'Идэвхтэй', count: heroStats.active, icon: <CheckCircle2 size={12} /> },
        { id: 'disabled', label: 'Зогсоосон', count: heroStats.disabled, icon: <XCircle size={12} /> },
        { id: 'pro', label: 'Pro', count: heroStats.pro, icon: <Crown size={12} /> },
    ];

    const getCategoryColor = (cat: string) => {
        switch (cat?.toLowerCase()) {
            case 'online_shop': return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' };
            case 'cargo': return { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.2)' };
            case 'restaurant': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' };
            case 'service': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' };
            default: return { bg: 'var(--bg-soft)', color: 'var(--text-secondary)', border: 'var(--border-primary)' };
        }
    };

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><Building2 size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Бизнес удирдлага</div>
                            <h1 className="sa-hero-title">Бизнесүүд</h1>
                            <div className="sa-hero-desc">Нийт {businesses.length} бизнес бүртгэлтэй</div>
                        </div>
                    </div>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.total}</div>
                        <div className="sa-hero-stat-label">Нийт бизнес</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.active}</div>
                        <div className="sa-hero-stat-label">Идэвхтэй</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.disabled}</div>
                        <div className="sa-hero-stat-label">Зогсоосон</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.pro}</div>
                        <div className="sa-hero-stat-label">Pro / Business</div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Tabs (like Categories) ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-bar-premium" style={{ maxWidth: 400 }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Бизнес эсвэл эзэмшигч хайх..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 20,
                                border: activeFilter === tab.id ? '1.5px solid var(--primary)' : '1.5px solid var(--border-primary)',
                                background: activeFilter === tab.id ? 'var(--primary)' : 'var(--surface-1)',
                                color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label} <span style={{
                                background: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-soft)',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                            }}>{tab.count}</span>
                        </button>
                    ))}
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '4px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{selectedIds.length} сонгосон:</span>
                            <button className="btn btn-outline btn-xs text-success" onClick={() => handleBulkToggle(false)} disabled={bulkSaving}>Нээх</button>
                            <button className="btn btn-outline btn-xs text-danger" onClick={() => handleBulkToggle(true)} disabled={bulkSaving}>Хаах</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card no-padding overflow-hidden">
                <table className="super-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(filtered.map(b => b.id));
                                        else setSelectedIds([]);
                                    }}
                                />
                            </th>
                            <th>Бизнес</th>
                            <th>Ангилал</th>
                            <th>Эзэмшигч</th>
                            <th>Төлөвлөгөө</th>
                            <th>Захиалга</th>
                            <th>Үүссэн</th>
                            <th>Төлөв</th>
                            <th className="text-right">Үйлдэл</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-8">Уншиж байна...</td></tr>
                        ) : filtered.map(biz => {
                            const catStyle = getCategoryColor(biz.category);
                            return (
                                <tr key={biz.id} className={biz.isDisabled ? 'opacity-50' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(biz.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds([...selectedIds, biz.id]);
                                                else setSelectedIds(selectedIds.filter(id => id !== biz.id));
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <div className="biz-cell">
                                            <div className="biz-avatar" style={{ background: catStyle.bg, color: catStyle.color, fontWeight: 800 }}>{biz.name?.charAt(0)}</div>
                                            <div className="biz-info">
                                                <div className="biz-name" style={{ fontWeight: 700 }}>{biz.name}</div>
                                                <div className="biz-id">{biz.id?.substring(0, 20)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                                            background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}`,
                                        }}>
                                            {biz.category || '—'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{biz.ownerName || 'Тодорхойгүй'}</td>
                                    <td>
                                        <span className={`plan-tag ${biz.subscription?.plan || 'free'}`}>
                                            {(biz.subscription?.plan || 'FREE').toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{biz.stats?.totalOrders || 0}</td>
                                    <td>
                                        <div className="date-cell">
                                            <Clock size={14} />
                                            {biz.createdAt?.toDate ? biz.createdAt.toDate().toLocaleDateString() : '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <label className="ios-switch" title={biz.isDisabled ? 'Нээх' : 'Хаах'}>
                                                <input
                                                    type="checkbox"
                                                    checked={!biz.isDisabled}
                                                    onChange={() => handleToggleStatus(biz)}
                                                />
                                                <span className="ios-slider"></span>
                                            </label>
                                            <span className={`text-[10px] font-heavy uppercase ${biz.isDisabled ? 'text-danger' : 'text-success'}`}>
                                                {biz.isDisabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="row-actions justify-end">
                                            <button
                                                className="btn-icon"
                                                title="Нэвтэрч орох"
                                                onClick={() => handleImpersonateClick(biz)}
                                            >
                                                <Lock size={16} />
                                            </button>
                                            <button className="btn-icon">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={handleImpersonate}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setSelectedBiz(null);
                    }}
                    title="Бизнес рүү нэвтрэх"
                    description={`${selectedBiz?.name} бизнес рүү нэвтрэхийн тулд нууц үгээ оруулна уу.`}
                />
            )}
        </div>
    );
}
