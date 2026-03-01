import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { Search, Plus, Package, AlertTriangle, ArrowDownRight, ArrowUpRight, History, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
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

const typeConfig: Record<string, { label: string; cls: string; icon: typeof ArrowDownRight }> = {
    in: { label: 'Орлого', cls: 'inv-in', icon: ArrowDownRight },
    out: { label: 'Зарлага', cls: 'inv-out', icon: ArrowUpRight },
    adjustment: { label: 'Тохируулга', cls: 'inv-adj', icon: History },
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

    return (
        <HubLayout hubId="inventory-hub">
            <Header title="Нөөц удирдлага" subtitle="Барааны орлого, зарлага, нөөцийн түүх" action={{ label: 'Нөөц нэмэх', onClick: () => setShowAdd(true) }} />
            <div className="page">
                <div className="inv-stats-summary stagger-children">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(11, 232, 129, 0.1)', color: '#0be881' }}><TrendingUp size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-label">Нийт орлого</div>
                            <div className="stat-value">{totalIn}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><TrendingDown size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-label">Нийт зарлага</div>
                            <div className="stat-value">{totalOut}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7' }}><Package size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-label">Барааны нэр төрөл</div>
                            <div className="stat-value">{products.length}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><AlertTriangle size={24} /></div>
                        <div className="stat-info">
                            <div className="stat-label">Нөөц бага</div>
                            <div className="stat-value">{lowStockItems.length}</div>
                        </div>
                    </div>
                </div>

                {/* Low stock alert */}
                {!loading && lowStockItems.length > 0 && (
                    <div className="inv-low-stock-panel" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 className="text-sm font-black mb-3 text-orange-600 flex items-center gap-2">
                            <AlertTriangle size={18} /> Нөөц бага байгаа бараа
                        </h3>
                        <div className="inv-low-stock-list">
                            {lowStockItems.map((item, i) => (
                                <div key={i} className="inv-low-stock-item">
                                    <span className="inv-low-stock-name">{item.name}</span>
                                    {item.sku && <span className="badge badge-surface">{item.sku}</span>}
                                    <span className={`badge ${(item.stock?.quantity || 0) === 0 ? 'badge-cancelled' : 'badge-preparing'}`}>
                                        {(item.stock?.quantity || 0) === 0 ? 'Дууссан' : `${item.stock?.quantity} ш`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="orders-search-input" placeholder="Бараа, шалтгаан хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="orders-status-bar">
                        <button className={`orders-status-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Бүгд</button>
                        <button className={`orders-status-chip ${typeFilter === 'in' ? 'active' : ''}`} onClick={() => setTypeFilter('in')}>Орлого</button>
                        <button className={`orders-status-chip ${typeFilter === 'out' ? 'active' : ''}`} onClick={() => setTypeFilter('out')}>Зарлага</button>
                        <button className={`orders-status-chip ${typeFilter === 'adjustment' ? 'active' : ''}`} onClick={() => setTypeFilter('adjustment')}>Тохируулга</button>
                    </div>
                </div>

                <div className="inv-movement-list stagger-children">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <p className="mt-4 font-bold text-muted">Өгөгдөл ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <History size={48} className="text-muted opacity-20" />
                            </div>
                            <h3>Түүх олдсонгүй</h3>
                            <p>Нөөцийн хөдөлгөөн бүртгэгдээгүй байна</p>
                        </div>
                    ) : (
                        filtered.map(m => {
                            const cfg = typeConfig[m.type];
                            const Icon = cfg?.icon || ArrowDownRight;
                            const dateStr = m.createdAt instanceof Date
                                ? m.createdAt.toLocaleDateString('mn-MN') + ' ' + m.createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
                                : '';
                            return (
                                <div key={m.id} className={`inv-movement-card ${cfg?.cls}`}>
                                    <div className="inv-movement-icon"><Icon size={20} /></div>
                                    <div className="inv-movement-info">
                                        <div className="inv-movement-product">{m.productName}</div>
                                        <div className="inv-movement-reason">{m.reason || cfg?.label}</div>
                                    </div>
                                    <div className="inv-movement-qty">
                                        <span className={`inv-movement-change ${cfg?.cls}`}>
                                            {m.type === 'out' ? '-' : m.type === 'in' ? '+' : ''}{Math.abs(m.quantity)} ш
                                        </span>
                                        <span className="inv-movement-stock">{m.previousStock} → {m.newStock}</span>
                                    </div>
                                    <div className="inv-movement-meta">
                                        <span>{m.createdBy}</span>
                                        <span>{dateStr}</span>
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
