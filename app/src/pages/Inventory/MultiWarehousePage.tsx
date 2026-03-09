import { useState, useEffect } from 'react';
import {
    Search, Plus, Warehouse, MapPin, Package, Loader2,
    TrendingUp, AlertTriangle, Building2, Truck
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Inventory/InventoryPage.css';

const WH_FIELDS: CrudField[] = [
    { name: 'name', label: 'Агуулахын нэр', type: 'text', required: true },
    { name: 'location', label: 'Байршил', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'main', label: 'Үндсэн' }, { value: 'branch', label: 'Салбар' }, { value: 'transit', label: 'Тээвэр' },
        ]
    },
    { name: 'capacity', label: 'Багтаамж', type: 'number' },
    { name: 'currentStock', label: 'Одоогийн нөөц', type: 'number' },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
    { name: 'manager', label: 'Менежер', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const typeConfig: Record<string, { label: string; color: string; tint: string; icon: typeof Building2 }> = {
    main: { label: 'Үндсэн', color: 'var(--accent-green)', tint: 'var(--green-tint)', icon: Building2 },
    branch: { label: 'Салбар', color: 'var(--primary)', tint: 'var(--primary-tint)', icon: Warehouse },
    transit: { label: 'Тээвэр', color: 'var(--accent-orange, #f59e0b)', tint: 'rgba(245,158,11,0.1)', icon: Truck },
};

export function MultiWarehousePage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/warehouses`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // Stats
    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter(w => w.isActive !== false).length;
    const totalCapacity = warehouses.reduce((s, w) => s + (w.capacity || 0), 0);
    const totalStock = warehouses.reduce((s, w) => s + (w.currentStock || 0), 0);
    const lowCapacity = warehouses.filter(w => w.capacity && ((w.currentStock || 0) / w.capacity) > 0.85).length;

    // Filters
    const filtered = warehouses.filter(w => {
        const matchType = typeFilter === 'all' || (w.type || 'main') === typeFilter;
        const matchSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.location?.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const countAll = warehouses.length;
    const countMain = warehouses.filter(w => (w.type || 'main') === 'main').length;
    const countBranch = warehouses.filter(w => w.type === 'branch').length;
    const countTransit = warehouses.filter(w => w.type === 'transit').length;

    return (
        <>
            <div className="inventory-page animate-fade-in">
                {/* ═══ Page Hero ═══ */}
                <div className="page-hero">
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <Warehouse size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Олон Агуулах</h2>
                            <p className="page-hero-subtitle">Агуулахын удирдлага, бүртгэл, багтаамж</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        <Plus size={16} /> Агуулах нэмэх
                    </button>
                </div>

                {/* ═══ Stats Grid — Glassmorphism ═══ */}
                <div className="inv-stats-grid">
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт агуулах</h4>
                            <div className="inv-stat-value">{totalWarehouses}</div>
                            <div className="inv-stat-trend neutral">
                                <Warehouse size={10} /> {activeWarehouses} идэвхтэй
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <Warehouse size={24} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт багтаамж</h4>
                            <div className="inv-stat-value">{totalCapacity.toLocaleString()}</div>
                            <div className="inv-stat-trend neutral">
                                <Package size={10} /> ш багтана
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-green">
                            <TrendingUp size={24} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт нөөц</h4>
                            <div className="inv-stat-value">{totalStock.toLocaleString()}</div>
                            <div className="inv-stat-trend neutral">
                                <Package size={10} /> ш хадгалсан
                            </div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <Package size={24} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Дүүрсэн</h4>
                            <div className="inv-stat-value">{lowCapacity}</div>
                            {lowCapacity > 0 && (
                                <div className="inv-stat-trend down">
                                    <AlertTriangle size={10} /> Анхааруулга
                                </div>
                            )}
                        </div>
                        <div className="inv-stat-icon icon-orange">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>

                {/* ═══ Search & Filter Toolbar ═══ */}
                <div className="inv-toolbar">
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input
                            className="inv-search-input"
                            placeholder="Агуулах, байршил хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="inv-filter-chips">
                        <button data-type="all" className={`inv-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
                            Бүгд <span className="chip-count">{countAll}</span>
                        </button>
                        <button data-type="in" className={`inv-chip ${typeFilter === 'main' ? 'active' : ''}`} onClick={() => setTypeFilter('main')}>
                            Үндсэн <span className="chip-count">{countMain}</span>
                        </button>
                        <button data-type="out" className={`inv-chip ${typeFilter === 'branch' ? 'active' : ''}`} onClick={() => setTypeFilter('branch')}>
                            Салбар <span className="chip-count">{countBranch}</span>
                        </button>
                        <button data-type="adjustment" className={`inv-chip ${typeFilter === 'transit' ? 'active' : ''}`} onClick={() => setTypeFilter('transit')}>
                            Тээвэр <span className="chip-count">{countTransit}</span>
                        </button>
                    </div>
                </div>

                {/* ═══ Warehouse Cards ═══ */}
                <div className="inv-movements-premium">
                    {loading ? (
                        <div className="inv-loading">
                            <Loader2 size={36} className="animate-spin" />
                            <p className="inv-loading-text">Ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="inv-empty-state">
                            <div className="inv-empty-icon">
                                <Warehouse size={36} />
                            </div>
                            <div className="inv-empty-title">Агуулах олдсонгүй</div>
                            <div className="inv-empty-desc">Эхний агуулахаа нэмнэ үү</div>
                            <button className="btn btn-primary btn-sm gradient-btn inv-empty-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                                <Plus size={14} /> Агуулах нэмэх
                            </button>
                        </div>
                    ) : (
                        filtered.map(w => {
                            const cfg = typeConfig[w.type || 'main'] || typeConfig.main;
                            const Icon = cfg.icon;
                            const usagePercent = w.capacity ? Math.round(((w.currentStock || 0) / w.capacity) * 100) : 0;
                            const usageCls = usagePercent > 90 ? 'low' : usagePercent > 60 ? 'medium' : 'high';

                            return (
                                <div
                                    key={w.id}
                                    className={`inv-move-card move-in`}
                                    style={{ cursor: 'pointer', opacity: w.isActive === false ? 0.55 : 1 }}
                                    onClick={() => { setEditingItem(w); setShowModal(true); }}
                                >
                                    <div className="inv-move-icon" style={{ background: cfg.tint, color: cfg.color }}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="inv-move-info">
                                        <div className="inv-move-product">{w.name}</div>
                                        <div className="inv-move-reason" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={11} /> {w.location || 'Байршил тодорхойгүй'}
                                        </div>
                                        {w.capacity > 0 && (
                                            <div className="inv-move-stock-bar">
                                                <div className={`stock-fill ${usageCls}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="inv-move-qty">
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            background: cfg.tint,
                                            color: cfg.color,
                                        }}>
                                            {cfg.label}
                                        </span>
                                        {w.capacity > 0 && (
                                            <div className="inv-move-stock" style={{ marginTop: 4 }}>
                                                {(w.currentStock || 0).toLocaleString()} / {w.capacity.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="inv-move-meta">
                                        <div className="inv-move-meta-text">
                                            {w.manager && <div className="inv-move-user">{w.manager}</div>}
                                            <div className="inv-move-date">
                                                {w.isActive === false ? 'Идэвхгүй' : 'Идэвхтэй'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showModal && <GenericCrudModal title="Агуулах" icon={<Warehouse size={20} />} collectionPath="businesses/{bizId}/warehouses" fields={WH_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </>
    );
}
