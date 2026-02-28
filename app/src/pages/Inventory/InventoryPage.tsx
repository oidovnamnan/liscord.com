import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { Search, Plus, Package, AlertTriangle, ArrowDownRight, ArrowUpRight, History, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, stockMovementService } from '../../services/db';
import type { Product } from '../../types';
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
                <div className="grid-4 stagger-children" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(11, 232, 129, 0.15)', color: '#0be881' }}><TrendingUp size={20} /></div>
                        </div>
                        <div className="stat-card-value">{totalIn}</div>
                        <div className="stat-card-label">Нийт орж ирсэн</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><TrendingDown size={20} /></div>
                        </div>
                        <div className="stat-card-value">{totalOut}</div>
                        <div className="stat-card-label">Нийт гарсан</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}><Package size={20} /></div>
                        </div>
                        <div className="stat-card-value">{products.length}</div>
                        <div className="stat-card-label">Барааны нэр төрөл</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><AlertTriangle size={20} /></div>
                        </div>
                        <div className="stat-card-value">{lowStockItems.length}</div>
                        <div className="stat-card-label">Нөөц бага</div>
                    </div>
                </div>

                {/* Low stock alert */}
                {!loading && lowStockItems.length > 0 && (
                    <div className="inv-low-stock-panel card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>⚠️ Нөөц бага байгаа бараа</h3>
                        <div className="inv-low-stock-list">
                            {lowStockItems.map((item, i) => (
                                <div key={i} className="inv-low-stock-item">
                                    <span className="inv-low-stock-name">{item.name}</span>
                                    <span className="inv-low-stock-sku">{item.sku || '-'}</span>
                                    <span className={`badge ${(item.stock?.quantity || 0) === 0 ? 'badge-cancelled' : 'badge-preparing'}`}>
                                        {(item.stock?.quantity || 0) === 0 ? 'Дууссан' : `${item.stock?.quantity} / ${item.stock?.lowStockThreshold} ш`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Бараа, шалтгаан хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="orders-status-bar" style={{ marginBottom: 0 }}>
                        <button className={`orders-status-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Бүгд</button>
                        <button className={`orders-status-chip ${typeFilter === 'in' ? 'active' : ''}`} onClick={() => setTypeFilter('in')}>Орлого</button>
                        <button className={`orders-status-chip ${typeFilter === 'out' ? 'active' : ''}`} onClick={() => setTypeFilter('out')}>Зарлага</button>
                        <button className={`orders-status-chip ${typeFilter === 'adjustment' ? 'active' : ''}`} onClick={() => setTypeFilter('adjustment')}>Тохируулга</button>
                    </div>
                </div>

                <div className="inv-movement-list stagger-children">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={32} className="animate-spin" />
                            <p>Ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🕒</div>
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
                                <div key={m.id} className={`inv-movement-card card ${cfg?.cls}`}>
                                    <div className="inv-movement-icon"><Icon size={18} /></div>
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

    const selectedProduct = products.find(p => p.id === productId);

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
                        <h2>Нөөц нэмэх</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Бараа <span className="required">*</span></label>
                            <select className="input select" value={productId} onChange={e => setProductId(e.target.value)} required>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Үлдэгдэл: {p.stock?.quantity || 0})</option>
                                ))}
                                {products.length === 0 && <option disabled>Бараа байхгүй байна</option>}
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Төрөл</label>
                            <select className="input select" value={type} onChange={e => setType(e.target.value as 'in' | 'out' | 'adjustment')}>
                                <option value="in">Орлого (Татан авалт)</option>
                                <option value="out">Зарлага</option>
                                <option value="adjustment">Тохируулга (шууд тоо оруулах)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Тоо ширхэг <span className="required">*</span></label>
                            <input className="input" type="number" min="1" placeholder="10" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Шалтгаан</label>
                            <input className="input" placeholder="Татан авалт — Нийлүүлэгч А" value={reason} onChange={e => setReason(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || products.length === 0}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Бүртгэх
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
