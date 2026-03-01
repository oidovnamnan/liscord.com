import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, Package, AlertTriangle, ArrowDownRight, ArrowUpRight,
    History, TrendingUp, TrendingDown, Loader2, ArrowRight
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, stockMovementService, warehouseService } from '../../services/db';
import type { Product, Warehouse, Shelf } from '../../types';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import './InventoryPage.css';

interface StockMovement {
    id: string;
    productId: string;
    productName: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    createdBy: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: any;
}

const typeConfig: Record<string, { label: string; moveCls: string; changeCls: string; icon: typeof ArrowDownRight }> = {
    in: { label: 'Орлого', moveCls: 'move-in', changeCls: 'change-in', icon: ArrowDownRight },
    out: { label: 'Зарлага', moveCls: 'move-out', changeCls: 'change-out', icon: ArrowUpRight },
    adjustment: { label: 'Тохируулга', moveCls: 'move-adj', changeCls: 'change-adj', icon: History },
};

export function InventoryPage() {
    const { business } = useBusinessStore();
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        setTimeout(() => setLoading(true), 0);
        const unsub1 = productService.subscribeProducts(business.id, (data) => {
            setProducts(data);
            setLoading(false);
        });
        const unsub2 = stockMovementService.subscribeMovements(business.id, (data) => {
            setMovements(data as StockMovement[]);
        });

        return () => { unsub1(); unsub2(); };
    }, [business?.id]);

    const lowStockItems = products.filter(p => (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0));

    const totalIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0);
    const totalOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + m.quantity, 0);

    const filtered = movements.filter(m => {
        const matchType = typeFilter === 'all' || m.type === typeFilter;
        const matchSearch = !search || m.productName.toLowerCase().includes(search.toLowerCase()) || (m.reason || '').toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const countAll = movements.length;
    const countIn = movements.filter(m => m.type === 'in').length;
    const countOut = movements.filter(m => m.type === 'out').length;
    const countAdj = movements.filter(m => m.type === 'adjustment').length;

    return (
        <HubLayout hubId="inventory-hub">
            <div className="inventory-page animate-fade-in">
                {/* Page Section Header */}
                <div className="page-section-header">
                    <div>
                        <h2 className="page-section-title">Агуулах / Логистик</h2>
                        <p className="page-section-subtitle">Барааны орлого, зарлага, нөөцийн түүх</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
                        <Plus size={16} /> Нөөц нэмэх
                    </button>
                </div>

                {/* ====== Stats Grid ====== */}
                <div className="inv-stats-grid">
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт орлого</h4>
                            <div className="inv-stat-value">{totalIn}</div>
                        </div>
                        <div className="inv-stat-icon icon-green">
                            <TrendingUp size={28} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт зарлага</h4>
                            <div className="inv-stat-value">{totalOut}</div>
                        </div>
                        <div className="inv-stat-icon icon-red">
                            <TrendingDown size={28} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Барааны нэр төрөл</h4>
                            <div className="inv-stat-value">{products.length}</div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <Package size={28} />
                        </div>
                    </div>

                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нөөц бага</h4>
                            <div className="inv-stat-value">{lowStockItems.length}</div>
                        </div>
                        <div className="inv-stat-icon icon-orange">
                            <AlertTriangle size={28} />
                        </div>
                    </div>
                </div>

                {/* ====== Low Stock Alert ====== */}
                {!loading && lowStockItems.length > 0 && (
                    <div className="inv-low-stock-premium">
                        <div className="low-stock-header">
                            <AlertTriangle size={18} />
                            Нөөц бага байгаа бараа
                        </div>
                        <div className="low-stock-list">
                            {lowStockItems.map((item, i) => (
                                <div key={i} className="low-stock-item">
                                    <span className="low-stock-item-name">{item.name}</span>
                                    {item.sku && <span className="badge badge-surface">{item.sku}</span>}
                                    <span className={`low-stock-item-badge ${(item.stock?.quantity || 0) === 0 ? 'out-of-stock' : 'low'}`}>
                                        {(item.stock?.quantity || 0) === 0 ? 'Дууссан' : `${item.stock?.quantity} ш`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ====== Search & Filter Toolbar ====== */}
                <div className="inv-toolbar">
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input
                            className="inv-search-input"
                            placeholder="Бараа, шалтгаан хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="inv-filter-chips">
                        <button className={`inv-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
                            Бүгд <span className="chip-count">{countAll}</span>
                        </button>
                        <button className={`inv-chip ${typeFilter === 'in' ? 'active' : ''}`} onClick={() => setTypeFilter('in')}>
                            Орлого <span className="chip-count">{countIn}</span>
                        </button>
                        <button className={`inv-chip ${typeFilter === 'out' ? 'active' : ''}`} onClick={() => setTypeFilter('out')}>
                            Зарлага <span className="chip-count">{countOut}</span>
                        </button>
                        <button className={`inv-chip ${typeFilter === 'adjustment' ? 'active' : ''}`} onClick={() => setTypeFilter('adjustment')}>
                            Тохируулга <span className="chip-count">{countAdj}</span>
                        </button>
                    </div>
                </div>

                {/* ====== Movement List ====== */}
                <div className="inv-movements-premium">
                    {loading ? (
                        <div className="inv-loading">
                            <Loader2 size={36} className="animate-spin" />
                            <p className="inv-loading-text">Өгөгдөл ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="inv-empty-state">
                            <div className="inv-empty-icon">
                                <History size={40} />
                            </div>
                            <div className="inv-empty-title">Түүх олдсонгүй</div>
                            <div className="inv-empty-desc">Нөөцийн хөдөлгөөн бүртгэгдээгүй байна</div>
                        </div>
                    ) : (
                        filtered.map(m => {
                            const cfg = typeConfig[m.type];
                            const Icon = cfg?.icon || ArrowDownRight;
                            const dateStr = m.createdAt instanceof Date
                                ? m.createdAt.toLocaleDateString('mn-MN') + ' ' + m.createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
                                : '';
                            return (
                                <div key={m.id} className={`inv-move-card ${cfg?.moveCls || ''}`}>
                                    <div className="inv-move-icon"><Icon size={22} /></div>
                                    <div className="inv-move-info">
                                        <div className="inv-move-product">{m.productName}</div>
                                        <div className="inv-move-reason">{m.reason || cfg?.label}</div>
                                    </div>
                                    <div className="inv-move-qty">
                                        <span className={`inv-move-change ${cfg?.changeCls || ''}`}>
                                            {m.type === 'out' ? '-' : m.type === 'in' ? '+' : ''}{Math.abs(m.quantity)} ш
                                        </span>
                                        <div className="inv-move-stock">
                                            {m.previousStock} <ArrowRight size={10} /> {m.newStock}
                                        </div>
                                    </div>
                                    <div className="inv-move-meta">
                                        <div className="inv-move-user">{m.createdBy}</div>
                                        <div className="inv-move-date">{dateStr}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showAdd && <AddMovementModal products={products} onClose={() => setShowAdd(false)} />}
        </HubLayout>
    );
}

function AddMovementModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [productId, setProductId] = useState(products[0]?.id || '');
    const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [selectedShelfId, setSelectedShelfId] = useState('');

    const selectedProduct = products.find(p => p.id === productId);

    useEffect(() => {
        if (!business?.id) return;
        return warehouseService.subscribeWarehouses(business.id, (data) => {
            setWarehouses(data);
            if (data.length > 0) setSelectedWarehouseId(data[0].id);
        });
    }, [business?.id]);

    useEffect(() => {
        if (!business?.id || !selectedWarehouseId) {
            setShelves([]);
            return;
        }
        return warehouseService.subscribeShelves(business.id, selectedWarehouseId, setShelves);
    }, [business?.id, selectedWarehouseId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business || !user) return;
        const qty = parseInt(quantity);
        if (!productId || !qty || qty <= 0) {
            toast.error('Бараа болон тоо ширхэг оруулна уу');
            return;
        }

        setSaving(true);
        try {
            await stockMovementService.createMovement(business.id, {
                productId,
                productName: selectedProduct?.name || 'Тодорхойгүй',
                type,
                quantity: qty,
                reason: reason.trim() || typeConfig[type]?.label || '',
                createdBy: user.displayName || user.email || 'System',
                warehouseId: selectedWarehouseId || undefined,
                shelfId: selectedShelfId || undefined
            });
            toast.success('Нөөцийн хөдөлгөөн амжилттай бүртгэгдлээ!');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Нөөцийн хөдөлгөөн бүртгэх</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Бараа <span className="required">*</span></label>
                                <select className="input select" value={productId} onChange={e => setProductId(e.target.value)} required>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (Нийт: {p.stock?.quantity || 0})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Төрөл</label>
                                <select className="input select" value={type} onChange={e => setType(e.target.value as 'in' | 'out' | 'adjustment')}>
                                    <option value="in">Орлого (Татан авалт)</option>
                                    <option value="out">Зарлага</option>
                                    <option value="adjustment">Тохируулга</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Агуулах</label>
                                <select className="input select" value={selectedWarehouseId} onChange={e => setSelectedWarehouseId(e.target.value)}>
                                    <option value="">Сонгох...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Тавиур / Хаяг</label>
                                <select className="input select" value={selectedShelfId} onChange={e => setSelectedShelfId(e.target.value)} disabled={!selectedWarehouseId}>
                                    <option value="">Сонгох...</option>
                                    {shelves.map(s => (
                                        <option key={s.id} value={s.id}>{s.locationCode} (Level {s.level || '?'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Тоо ширхэг <span className="required">*</span></label>
                                <input className="input" type="number" min="1" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Шалтгаан</label>
                                <input className="input" placeholder="Жишээ: Шинэ бараа ирсэн..." value={reason} onChange={e => setReason(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || products.length === 0}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Бүртгэх
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
