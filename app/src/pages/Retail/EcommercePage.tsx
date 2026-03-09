import { useState, useEffect } from 'react';
import {
    Globe, Settings, CreditCard, Truck, Plus, ExternalLink,
    Loader2, Palette, Package, Search, Pencil,
    Link2, ToggleLeft, ToggleRight
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
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const categoryConfig: Record<string, { label: string; color: string; tint: string; icon: typeof Settings }> = {
    general: { label: 'Ерөнхий', color: 'var(--primary)', tint: 'var(--primary-tint)', icon: Settings },
    payment: { label: 'Төлбөр', color: 'var(--accent-green)', tint: 'var(--green-tint)', icon: CreditCard },
    delivery: { label: 'Хүргэлт', color: 'var(--accent-orange, #f59e0b)', tint: 'rgba(245,158,11,0.1)', icon: Truck },
    theme: { label: 'Загвар', color: '#8b5cf6', tint: 'rgba(139,92,246,0.1)', icon: Palette },
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

    const totalSettings = items.length;
    const paymentCount = items.filter(i => i.category === 'payment').length;
    const deliveryCount = items.filter(i => i.category === 'delivery').length;
    const themeCount = items.filter(i => i.category === 'theme').length;

    const storeSlug = business?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'my-store';
    const storeUrl = `https://${storeSlug}.liscord.com`;

    const filtered = items.filter(i => {
        const matchCat = catFilter === 'all' || (i.category || 'general') === catFilter;
        const matchSearch = !search || i.settingKey?.toLowerCase().includes(search.toLowerCase()) || i.settingValue?.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

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
                            <p className="page-hero-subtitle">Вэб дэлгүүрийн тохиргоо, төлбөр, хүргэлт</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        <Plus size={16} /> Тохиргоо нэмэх
                    </button>
                </div>

                {/* ═══ Store Status Card ═══ */}
                <div style={{
                    background: storeEnabled
                        ? 'linear-gradient(135deg, var(--primary), #7c3aed)'
                        : 'linear-gradient(135deg, #94a3b8, #64748b)',
                    borderRadius: 18,
                    padding: '24px 28px',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', right: -30, bottom: -30, opacity: 0.06 }}>
                        <Globe size={180} strokeWidth={0.8} />
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'relative', zIndex: 1, gap: 16, flexWrap: 'wrap',
                    }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800 }}>
                                {business?.name || 'Миний'} Дэлгүүр
                            </h3>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: 'rgba(0,0,0,0.2)', padding: '8px 14px', borderRadius: 10,
                                fontSize: '0.8rem', fontWeight: 600,
                            }}>
                                <Link2 size={13} style={{ opacity: 0.6 }} />
                                <span>{storeUrl}</span>
                                <a href={storeUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ color: 'white', display: 'flex', opacity: 0.7 }}>
                                    <ExternalLink size={13} />
                                </a>
                            </div>
                        </div>

                        <button onClick={() => setStoreEnabled(!storeEnabled)} style={{
                            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 12, padding: '10px 16px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, color: 'white',
                            fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                        }}>
                            {storeEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
                        </div>
                        <div className="inv-stat-icon icon-primary"><Settings size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Төлбөрийн</h4>
                            <div className="inv-stat-value">{paymentCount}</div>
                        </div>
                        <div className="inv-stat-icon icon-green"><CreditCard size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Хүргэлтийн</h4>
                            <div className="inv-stat-value">{deliveryCount}</div>
                        </div>
                        <div className="inv-stat-icon icon-orange"><Truck size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Загвар</h4>
                            <div className="inv-stat-value">{themeCount}</div>
                        </div>
                        <div className="inv-stat-icon icon-primary"><Palette size={24} /></div>
                    </div>
                </div>

                {/* ═══ Search & Filter ═══ */}
                <div className="inv-toolbar">
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input className="inv-search-input" placeholder="Тохиргоо хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="inv-filter-chips">
                        <button className={`inv-chip ${catFilter === 'all' ? 'active' : ''}`} onClick={() => setCatFilter('all')}>
                            Бүгд <span className="chip-count">{totalSettings}</span>
                        </button>
                        <button data-type="in" className={`inv-chip ${catFilter === 'payment' ? 'active' : ''}`} onClick={() => setCatFilter('payment')}>
                            Төлбөр <span className="chip-count">{paymentCount}</span>
                        </button>
                        <button data-type="out" className={`inv-chip ${catFilter === 'delivery' ? 'active' : ''}`} onClick={() => setCatFilter('delivery')}>
                            Хүргэлт <span className="chip-count">{deliveryCount}</span>
                        </button>
                        <button data-type="adjustment" className={`inv-chip ${catFilter === 'theme' ? 'active' : ''}`} onClick={() => setCatFilter('theme')}>
                            Загвар <span className="chip-count">{themeCount}</span>
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
                            <div className="inv-empty-icon"><Settings size={36} /></div>
                            <div className="inv-empty-title">Тохиргоо олдсонгүй</div>
                            <div className="inv-empty-desc">
                                {catFilter !== 'all'
                                    ? `"${categoryConfig[catFilter]?.label || catFilter}" ангиллын тохиргоо байхгүй`
                                    : 'Дэлгүүрийн тохиргоогоо нэмнэ үү'
                                }
                            </div>
                            <button className="btn btn-primary btn-sm gradient-btn inv-empty-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                                <Plus size={14} /> Тохиргоо нэмэх
                            </button>
                        </div>
                    ) : filtered.map(item => {
                        const cfg = categoryConfig[item.category || 'general'] || categoryConfig.general;
                        const Icon = cfg.icon;
                        return (
                            <div key={item.id} className="inv-move-card move-in" style={{ cursor: 'pointer' }}
                                onClick={() => { setEditingItem(item); setShowModal(true); }}>
                                <div className="inv-move-icon" style={{ background: cfg.tint, color: cfg.color }}>
                                    <Icon size={20} />
                                </div>
                                <div className="inv-move-info">
                                    <div className="inv-move-product">{item.settingKey}</div>
                                    <div className="inv-move-reason">{item.settingValue}</div>
                                </div>
                                <div className="inv-move-qty">
                                    <span style={{
                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem',
                                        fontWeight: 700, background: cfg.tint, color: cfg.color,
                                    }}>
                                        {cfg.label}
                                    </span>
                                </div>
                                <div className="inv-move-meta">
                                    <div className="inv-move-meta-text">
                                        <div className="inv-move-date" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Pencil size={10} /> Засах
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && <GenericCrudModal title="Дэлгүүрийн тохиргоо" icon={<Globe size={20} />} collectionPath="businesses/{bizId}/ecommerceSettings" fields={ECOM_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </>
    );
}
