import { useState, useEffect } from 'react';
import {
    Globe, Settings, CreditCard, Truck, Plus, ExternalLink,
    Loader2, ShoppingBag, Palette, Eye, Package, TrendingUp,
    Link2, ToggleLeft, ToggleRight, Search, Pencil, Trash2
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Inventory/InventoryPage.css';

const ECOM_FIELDS: CrudField[] = [
    { name: 'settingKey', label: 'Тохиргооны нэр', type: 'text', required: true },
    { name: 'settingValue', label: 'Утга', type: 'text', required: true },
    {
        name: 'category', label: 'Ангилал', type: 'select', options: [
            { value: 'general', label: 'Ерөнхий' },
            { value: 'payment', label: 'Төлбөр' },
            { value: 'delivery', label: 'Хүргэлт' },
            { value: 'theme', label: 'Загвар / Дизайн' },
            { value: 'seo', label: 'SEO' },
            { value: 'notification', label: 'Мэдэгдэл' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const categoryConfig: Record<string, { label: string; color: string; tint: string; icon: typeof Settings }> = {
    general: { label: 'Ерөнхий', color: 'var(--primary)', tint: 'var(--primary-tint)', icon: Settings },
    payment: { label: 'Төлбөр', color: 'var(--accent-green)', tint: 'var(--green-tint)', icon: CreditCard },
    delivery: { label: 'Хүргэлт', color: 'var(--accent-orange, #f59e0b)', tint: 'rgba(245,158,11,0.1)', icon: Truck },
    theme: { label: 'Загвар', color: '#8b5cf6', tint: 'rgba(139,92,246,0.1)', icon: Palette },
    seo: { label: 'SEO', color: '#06b6d4', tint: 'rgba(6,182,212,0.1)', icon: Globe },
    notification: { label: 'Мэдэгдэл', color: '#ec4899', tint: 'rgba(236,72,153,0.1)', icon: ShoppingBag },
};

export function EcommercePage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [storeEnabled, setStoreEnabled] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/ecommerceSettings`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // Stats
    const totalSettings = items.length;
    const paymentCount = items.filter(i => i.category === 'payment').length;
    const deliveryCount = items.filter(i => i.category === 'delivery').length;
    const themeCount = items.filter(i => i.category === 'theme').length;

    // Slug
    const storeSlug = business?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'my-store';
    const storeUrl = `https://${storeSlug}.liscord.com`;

    // Filtered
    const filtered = items.filter(i => {
        const matchCat = catFilter === 'all' || (i.category || 'general') === catFilter;
        const matchSearch = !search || i.settingKey?.toLowerCase().includes(search.toLowerCase()) || i.settingValue?.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    // Quick action cards
    const quickActions = [
        { icon: Palette, label: 'Дизайн', desc: 'Өнгө, фонт, layout', color: '#8b5cf6', tint: 'rgba(139,92,246,0.08)', cat: 'theme' },
        { icon: CreditCard, label: 'Төлбөр', desc: 'QPay, банк, карт', color: 'var(--accent-green)', tint: 'var(--green-tint)', cat: 'payment' },
        { icon: Truck, label: 'Хүргэлт', desc: 'Бүс, үнэ, нөхцөл', color: 'var(--accent-orange, #f59e0b)', tint: 'rgba(245,158,11,0.08)', cat: 'delivery' },
        { icon: Globe, label: 'SEO', desc: 'Meta, OG, sitemap', color: '#06b6d4', tint: 'rgba(6,182,212,0.08)', cat: 'seo' },
        { icon: Package, label: 'Бүтээгдэхүүн', desc: 'Харагдац, эрэмбэ', color: 'var(--primary)', tint: 'var(--primary-tint)', cat: 'general' },
        { icon: Eye, label: 'Preview', desc: 'Дэлгүүр харах', color: '#ec4899', tint: 'rgba(236,72,153,0.08)', cat: 'preview' },
    ];

    return (
        <>
            <div className="inventory-page animate-fade-in">
                {/* ═══ Page Hero ═══ */}
                <div className="page-hero">
                    <div className="page-hero-left">
                        <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)' }}>
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Онлайн Дэлгүүр</h2>
                            <p className="page-hero-subtitle">Өөрийн вэб дэлгүүрийг кодгүйгээр тохируулж ажиллуулах</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6, textDecoration: 'none' }}>
                            <ExternalLink size={15} /> Дэлгүүр нээх
                        </a>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                            <Plus size={16} /> Тохиргоо нэмэх
                        </button>
                    </div>
                </div>

                {/* ═══ Store Status Banner ═══ */}
                <div style={{
                    background: storeEnabled
                        ? 'linear-gradient(135deg, var(--primary), #8b5cf6)'
                        : 'linear-gradient(135deg, #64748b, #475569)',
                    borderRadius: 20,
                    padding: '28px 32px',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: 4,
                }}>
                    {/* Background decoration */}
                    <div style={{
                        position: 'absolute', right: -40, bottom: -40, opacity: 0.08,
                    }}>
                        <Globe size={240} strokeWidth={0.8} />
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 16,
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <span style={{
                                    padding: '4px 12px', background: 'rgba(255,255,255,0.2)',
                                    borderRadius: 20, fontSize: '0.65rem', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.15em',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                }}>
                                    {storeEnabled ? '● Идэвхтэй' : '○ Зогссон'}
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                {business?.name || 'Миний'} Дэлгүүр
                            </h3>

                            {/* Store URL */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                                background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}>
                                <Link2 size={14} style={{ opacity: 0.6 }} />
                                <code style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.02em', flex: 1 }}>
                                    {storeUrl}
                                </code>
                                <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>
                                    <ExternalLink size={13} /> Нээх
                                </a>
                            </div>
                        </div>

                        <button
                            onClick={() => setStoreEnabled(!storeEnabled)}
                            style={{
                                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 16, padding: '12px 20px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10, color: 'white',
                                fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700,
                                transition: 'all 0.2s',
                            }}
                        >
                            {storeEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            {storeEnabled ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </button>
                    </div>
                </div>

                {/* ═══ Stats Grid ═══ */}
                <div className="inv-stats-grid">
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт тохиргоо</h4>
                            <div className="inv-stat-value">{totalSettings}</div>
                            <div className="inv-stat-trend neutral">
                                <Settings size={10} /> бүртгэл
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <Settings size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Төлбөрийн</h4>
                            <div className="inv-stat-value">{paymentCount}</div>
                            <div className={`inv-stat-trend ${paymentCount > 0 ? 'up' : 'neutral'}`}>
                                <CreditCard size={10} /> тохиргоо
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-green">
                            <CreditCard size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Хүргэлтийн</h4>
                            <div className="inv-stat-value">{deliveryCount}</div>
                            <div className="inv-stat-trend neutral">
                                <Truck size={10} /> тохиргоо
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-orange">
                            <Truck size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Загвар / Дизайн</h4>
                            <div className="inv-stat-value">{themeCount}</div>
                            <div className="inv-stat-trend neutral">
                                <Palette size={10} /> тохиргоо
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <Palette size={24} />
                        </div>
                    </div>
                </div>

                {/* ═══ Quick Actions ═══ */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 10, marginBottom: 4,
                }}>
                    {quickActions.map((a, i) => (
                        <button key={i} onClick={() => {
                            if (a.cat === 'preview') {
                                window.open(storeUrl, '_blank');
                            } else {
                                setCatFilter(a.cat);
                            }
                        }} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            padding: '18px 12px', borderRadius: 16, cursor: 'pointer',
                            background: catFilter === a.cat ? a.tint : 'var(--surface-1)',
                            border: `1.5px solid ${catFilter === a.cat ? a.color : 'var(--border-primary)'}`,
                            color: catFilter === a.cat ? a.color : 'var(--text-secondary)',
                            transition: 'all 0.2s', fontFamily: 'inherit',
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: a.tint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: a.color,
                            }}>
                                <a.icon size={20} />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{a.label}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{a.desc}</span>
                        </button>
                    ))}
                </div>

                {/* ═══ Search & Filter Toolbar ═══ */}
                <div className="inv-toolbar">
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input
                            className="inv-search-input"
                            placeholder="Тохиргоо хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="inv-filter-chips">
                        <button className={`inv-chip ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>
                            Бүгд <span className="chip-count">{totalSettings}</span>
                        </button>
                        <button data-type="in" className={`inv-chip ${catFilter === 'general' ? 'active' : ''}`} onClick={() => setCatFilter('general')}>
                            Ерөнхий <span className="chip-count">{items.filter(i => (i.category || 'general') === 'general').length}</span>
                        </button>
                        <button data-type="out" className={`inv-chip ${catFilter === 'payment' ? 'active' : ''}`} onClick={() => setCatFilter('payment')}>
                            Төлбөр <span className="chip-count">{paymentCount}</span>
                        </button>
                        <button data-type="adjustment" className={`inv-chip ${catFilter === 'delivery' ? 'active' : ''}`} onClick={() => setCatFilter('delivery')}>
                            Хүргэлт <span className="chip-count">{deliveryCount}</span>
                        </button>
                    </div>
                </div>

                {/* ═══ Settings List ═══ */}
                <div className="inv-movements-premium">
                    {loading ? (
                        <div className="inv-loading">
                            <Loader2 size={36} className="animate-spin" />
                            <p className="inv-loading-text">Ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="inv-empty-state">
                            <div className="inv-empty-icon">
                                <Settings size={36} />
                            </div>
                            <div className="inv-empty-title">Тохиргоо олдсонгүй</div>
                            <div className="inv-empty-desc">
                                {catFilter !== 'all'
                                    ? `"${categoryConfig[catFilter]?.label || catFilter}" ангиллын тохиргоо байхгүй байна`
                                    : 'Дэлгүүрийн анхны тохиргоогоо нэмнэ үү'
                                }
                            </div>
                            <button className="btn btn-primary btn-sm gradient-btn inv-empty-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                                <Plus size={14} /> Тохиргоо нэмэх
                            </button>
                        </div>
                    ) : (
                        filtered.map(item => {
                            const cfg = categoryConfig[item.category || 'general'] || categoryConfig.general;
                            const Icon = cfg.icon;

                            return (
                                <div
                                    key={item.id}
                                    className="inv-move-card move-in"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => { setEditingItem(item); setShowModal(true); }}
                                >
                                    <div className="inv-move-icon" style={{ background: cfg.tint, color: cfg.color }}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="inv-move-info">
                                        <div className="inv-move-product">{item.settingKey}</div>
                                        <div className="inv-move-reason">{item.settingValue}</div>
                                    </div>
                                    <div className="inv-move-qty">
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: cfg.tint,
                                            color: cfg.color,
                                        }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="inv-move-meta">
                                        <div className="inv-move-meta-text">
                                            {item.notes && <div className="inv-move-user">{item.notes}</div>}
                                            <div className="inv-move-date">
                                                <Pencil size={10} /> Засах
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showModal && <GenericCrudModal title="Дэлгүүрийн тохиргоо" icon={<Globe size={20} />} collectionPath="businesses/{bizId}/ecommerceSettings" fields={ECOM_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </>
    );
}
