import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, ShoppingCart, Package, Loader2, ExternalLink,
    User, Phone, Calendar, CreditCard, Hash, Tag, ArrowRight,
    ImageIcon
} from 'lucide-react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import type { Order, Product } from '../../types';
import './QuickLookup.css';

// ============ Types ============

type TabType = 'orders' | 'products';

interface QuickLookupProps {
    isOpen: boolean;
    onClose: () => void;
}

// ============ Helpers ============

const STATUS_COLORS: Record<string, string> = {
    new: '#6366f1',
    confirmed: '#3b82f6',
    sourced: '#8b5cf6',
    arrived: '#10b981',
    fulfilled: '#059669',
    returned: '#f59e0b',
    cancelled: '#ef4444',
    preparing: '#f59e0b',
    ready: '#10b981',
    shipping: '#3b82f6',
    delivered: '#059669',
    completed: '#059669',
};

const STATUS_LABELS: Record<string, string> = {
    new: 'Шинэ',
    confirmed: 'Баталсан',
    sourced: 'Авсан',
    arrived: 'Ирсэн',
    fulfilled: 'Хүлээлгэсэн',
    returned: 'Буцаалт',
    cancelled: 'Цуцалсан',
    preparing: 'Бэлтгэж буй',
    ready: 'Бэлэн',
    shipping: 'Хүргэж буй',
    delivered: 'Хүргэсэн',
    completed: 'Дууссан',
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
    unpaid: { label: 'Төлөөгүй', color: '#ef4444' },
    partial: { label: 'Хэсэгчилсэн', color: '#f59e0b' },
    paid: { label: 'Төлсөн', color: '#10b981' },
};

function formatDate(d: Date | any): string {
    if (!d) return '';
    const date = d instanceof Date ? d : d?.toDate?.() ? d.toDate() : new Date(d);
    try {
        return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
}

function formatMoney(n: number): string {
    return '₮' + (n || 0).toLocaleString();
}

// ============ Main Component ============

export function QuickLookup({ isOpen, onClose }: QuickLookupProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const { business } = useBusinessStore();
    const navigate = useNavigate();

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSearchQuery('');
            setOrders([]);
            setProducts([]);
            setPreviewOrder(null);
            setPreviewProduct(null);
            setFocusedIndex(0);
        }
    }, [isOpen]);

    // Global ESC to close — use refs to avoid stale closure
    const previewOrderRef = useRef(previewOrder);
    const previewProductRef = useRef(previewProduct);
    previewOrderRef.current = previewOrder;
    previewProductRef.current = previewProduct;

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (previewOrderRef.current || previewProductRef.current) {
                    setPreviewOrder(null);
                    setPreviewProduct(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handler, true); // capture phase
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, onClose]);

    // Search with debounce
    const doSearch = useCallback(async (q: string) => {
        if (!business?.id || q.length < 1) {
            setOrders([]);
            setProducts([]);
            return;
        }

        setLoading(true);
        const bizId = business.id;
        const qLower = q.toLowerCase();

        try {
            // Fetch orders — client-side filter (Firestore doesn't support LIKE)
            const ordersRef = collection(db, 'businesses', bizId, 'orders');
            const ordersSnap = await getDocs(query(ordersRef, where('isDeleted', '==', false), orderBy('createdAt', 'desc'), limit(50)));
            const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
            const matchedOrders = allOrders.filter(o =>
                o.orderNumber?.toLowerCase().includes(qLower) ||
                o.customer?.name?.toLowerCase().includes(qLower) ||
                o.customer?.phone?.includes(q)
            ).slice(0, 8);

            // Fetch products — client-side filter
            const productsRef = collection(db, 'businesses', bizId, 'products');
            const productsSnap = await getDocs(query(productsRef, where('isDeleted', '==', false), limit(100)));
            const allProducts = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            const matchedProducts = allProducts.filter(p =>
                p.name?.toLowerCase().includes(qLower) ||
                p.sku?.toLowerCase().includes(qLower) ||
                p.categoryName?.toLowerCase().includes(qLower)
            ).slice(0, 8);

            setOrders(matchedOrders);
            setProducts(matchedProducts);
            setFocusedIndex(0);

            // Auto-switch to tab with results
            if (matchedOrders.length > 0 && matchedProducts.length === 0) setActiveTab('orders');
            else if (matchedProducts.length > 0 && matchedOrders.length === 0) setActiveTab('products');
        } catch (err) {
            console.error('[QuickLookup] Search error:', err);
        } finally {
            setLoading(false);
        }
    }, [business?.id]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (searchQuery.length < 1) {
            setOrders([]);
            setProducts([]);
            return;
        }
        debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, doSearch]);

    // Active list
    const activeList = activeTab === 'orders' ? orders : products;

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (previewOrder || previewProduct) {
                setPreviewOrder(null);
                setPreviewProduct(null);
            } else {
                onClose();
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(i => Math.min(i + 1, activeList.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(i => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && activeList.length > 0) {
            e.preventDefault();
            const item = activeList[focusedIndex];
            if (activeTab === 'orders') setPreviewOrder(item as Order);
            else setPreviewProduct(item as Product);
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            setActiveTab(prev => prev === 'orders' ? 'products' : 'orders');
            setFocusedIndex(0);
        }
    }, [activeList, focusedIndex, activeTab, onClose, previewOrder, previewProduct]);

    if (!isOpen) return null;

    const hasResults = orders.length > 0 || products.length > 0;
    const showDefault = searchQuery.length === 0;

    return createPortal(
        <>
            {/* Main Search Overlay */}
            <div className="ql-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="ql-container" onKeyDown={handleKeyDown}>
                    {/* Search */}
                    <div className="ql-search-header">
                        <Search size={20} className="ql-search-icon" />
                        <input
                            ref={inputRef}
                            className="ql-search-input"
                            placeholder="Захиалга, бараа хайх..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <div className="ql-shortcut-badge">ESC</div>
                    </div>

                    {/* Tabs — only show when we have search query */}
                    {(hasResults || searchQuery.length > 0) && (
                        <div className="ql-tabs">
                            <button
                                className={`ql-tab ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('orders'); setFocusedIndex(0); }}
                            >
                                <ShoppingCart size={14} />
                                Захиалга
                                {orders.length > 0 && <span className="ql-tab-count">{orders.length}</span>}
                            </button>
                            <button
                                className={`ql-tab ${activeTab === 'products' ? 'active' : ''}`}
                                onClick={() => { setActiveTab('products'); setFocusedIndex(0); }}
                            >
                                <Package size={14} />
                                Бараа
                                {products.length > 0 && <span className="ql-tab-count">{products.length}</span>}
                            </button>
                        </div>
                    )}

                    {/* Default suggestions */}
                    {showDefault && (
                        <div className="ql-suggestions">
                            <div className="ql-suggestion-title">Түргэн үйлдлүүд</div>
                            <div className="ql-suggestion-item" onClick={() => { navigate('/app/orders'); onClose(); }}>
                                <ShoppingCart size={16} /> Захиалгын жагсаалт руу очих
                            </div>
                            <div className="ql-suggestion-item" onClick={() => { navigate('/app/products'); onClose(); }}>
                                <Package size={16} /> Барааны жагсаалт руу очих
                            </div>
                            <div className="ql-suggestion-title" style={{ marginTop: 8 }}>Хайлтын зөвлөмж</div>
                            <div
                                className="ql-suggestion-item"
                                style={{ cursor: 'default', opacity: 0.7 }}
                            >
                                <Hash size={16} /> Захиалгын дугаараар хайх (жишээ: ORD-001)
                            </div>
                            <div
                                className="ql-suggestion-item"
                                style={{ cursor: 'default', opacity: 0.7 }}
                            >
                                <User size={16} /> Харилцагчийн нэр, утсаар хайх
                            </div>
                            <div
                                className="ql-suggestion-item"
                                style={{ cursor: 'default', opacity: 0.7 }}
                            >
                                <Tag size={16} /> Барааны нэр, SKU-гаар хайх
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="ql-loading">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    )}

                    {/* Results */}
                    {!loading && !showDefault && (
                        <div className="ql-results">
                            {activeList.length === 0 && (
                                <div className="ql-empty">
                                    <div className="ql-empty-icon">🔍</div>
                                    <p>"{searchQuery}" — олдсонгүй</p>
                                </div>
                            )}

                            {activeTab === 'orders' && orders.map((order, i) => (
                                <div
                                    key={order.id}
                                    className={`ql-result-item ${i === focusedIndex ? 'focused' : ''}`}
                                    onClick={() => setPreviewOrder(order)}
                                    onMouseEnter={() => setFocusedIndex(i)}
                                >
                                    <div className="ql-result-thumb">
                                        <ShoppingCart size={20} className="ql-thumb-icon" />
                                    </div>
                                    <div className="ql-result-info">
                                        <div className="ql-result-name">
                                            {order.orderNumber}
                                            <span
                                                className="ql-status-badge"
                                                style={{
                                                    background: `${STATUS_COLORS[order.status] || '#888'}15`,
                                                    color: STATUS_COLORS[order.status] || '#888',
                                                    marginLeft: 8
                                                }}
                                            >
                                                {STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </div>
                                        <div className="ql-result-meta">
                                            <span><User size={11} /> {order.customer?.name || '—'}</span>
                                            {order.customer?.phone && <span><Phone size={11} /> {order.customer.phone}</span>}
                                            <span><Calendar size={11} /> {formatDate(order.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="ql-result-price">
                                        {formatMoney(order.financials?.totalAmount)}
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'products' && products.map((product, i) => (
                                <div
                                    key={product.id}
                                    className={`ql-result-item ${i === focusedIndex ? 'focused' : ''}`}
                                    onClick={() => setPreviewProduct(product)}
                                    onMouseEnter={() => setFocusedIndex(i)}
                                >
                                    <div className="ql-result-thumb">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt="" />
                                        ) : (
                                            <ImageIcon size={20} className="ql-thumb-icon" />
                                        )}
                                    </div>
                                    <div className="ql-result-info">
                                        <div className="ql-result-name">{product.name}</div>
                                        <div className="ql-result-meta">
                                            <span>{product.categoryName || 'Ангилалгүй'}</span>
                                            <span>SKU: {product.sku || '—'}</span>
                                            {product.stock?.quantity !== undefined && (
                                                <span style={{ color: product.stock.quantity === 0 ? '#ef4444' : 'inherit' }}>
                                                    Нөөц: {product.stock.quantity}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ql-result-price">
                                        {formatMoney(product.pricing?.salePrice)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Preview */}
            {previewOrder && (
                <div className="ql-preview-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewOrder(null); }}>
                    <div className="ql-preview-card">
                        <button className="ql-preview-close" onClick={() => setPreviewOrder(null)}>
                            <X size={16} />
                        </button>

                        <div className="ql-preview-header">
                            <div className="ql-preview-img" style={{ background: `${STATUS_COLORS[previewOrder.status] || '#6366f1'}15` }}>
                                <ShoppingCart size={28} style={{ color: STATUS_COLORS[previewOrder.status] || '#6366f1' }} />
                            </div>
                            <div>
                                <h3 className="ql-preview-title">{previewOrder.orderNumber}</h3>
                                <div className="ql-preview-subtitle">
                                    <span
                                        className="ql-status-badge"
                                        style={{
                                            background: `${STATUS_COLORS[previewOrder.status] || '#888'}15`,
                                            color: STATUS_COLORS[previewOrder.status] || '#888',
                                        }}
                                    >
                                        {STATUS_LABELS[previewOrder.status] || previewOrder.status}
                                    </span>
                                    <span
                                        className="ql-status-badge"
                                        style={{
                                            background: `${PAYMENT_LABELS[previewOrder.paymentStatus]?.color || '#888'}15`,
                                            color: PAYMENT_LABELS[previewOrder.paymentStatus]?.color || '#888',
                                        }}
                                    >
                                        <CreditCard size={11} />
                                        {PAYMENT_LABELS[previewOrder.paymentStatus]?.label || previewOrder.paymentStatus}
                                    </span>
                                    <span>{formatDate(previewOrder.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="ql-preview-section">
                            <div className="ql-preview-section-title">Харилцагч</div>
                            <div style={{ display: 'flex', gap: 16, fontSize: '0.88rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                    <User size={14} /> {previewOrder.customer?.name || '—'}
                                </span>
                                {previewOrder.customer?.phone && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                        <Phone size={14} /> {previewOrder.customer.phone}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        {previewOrder.items?.length > 0 && (
                            <div className="ql-preview-section">
                                <div className="ql-preview-section-title">Барааны жагсаалт ({previewOrder.items.length})</div>
                                <div className="ql-order-items">
                                    {previewOrder.items.map((item, i) => (
                                        <div key={i} className="ql-order-item">
                                            <div className="ql-order-item-img">
                                                {item.image ? (
                                                    <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Package size={14} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ql-order-item-info">
                                                <div className="ql-order-item-name">{item.name}</div>
                                                <div className="ql-order-item-qty">
                                                    {item.variant && `${item.variant} · `}{item.quantity} ш × {formatMoney(item.unitPrice)}
                                                </div>
                                            </div>
                                            <div className="ql-order-item-price">{formatMoney(item.totalPrice)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Financials */}
                        <div className="ql-preview-section">
                            <div className="ql-stat-row">
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value">{formatMoney(previewOrder.financials?.totalAmount)}</div>
                                    <div className="ql-stat-label">Нийт дүн</div>
                                </div>
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value" style={{ color: '#10b981' }}>{formatMoney(previewOrder.financials?.paidAmount)}</div>
                                    <div className="ql-stat-label">Төлсөн</div>
                                </div>
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value" style={{ color: (previewOrder.financials?.balanceDue || 0) > 0 ? '#ef4444' : '#10b981' }}>
                                        {formatMoney(previewOrder.financials?.balanceDue)}
                                    </div>
                                    <div className="ql-stat-label">Үлдэгдэл</div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {previewOrder.notes && (
                            <div className="ql-preview-section">
                                <div className="ql-preview-section-title">Тэмдэглэл</div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{previewOrder.notes}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="ql-preview-footer">
                            <button className="btn btn-ghost" onClick={() => setPreviewOrder(null)}>Хаах</button>
                            <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => { navigate('/app/orders'); onClose(); }}>
                                Дэлгэрэнгүй <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Preview */}
            {previewProduct && (
                <div className="ql-preview-overlay" onClick={(e) => { if (e.target === e.currentTarget) setPreviewProduct(null); }}>
                    <div className="ql-preview-card">
                        <button className="ql-preview-close" onClick={() => setPreviewProduct(null)}>
                            <X size={16} />
                        </button>

                        <div className="ql-preview-header">
                            <div className="ql-preview-img">
                                {previewProduct.images?.[0] ? (
                                    <img src={previewProduct.images[0]} alt="" />
                                ) : (
                                    <ImageIcon size={28} style={{ color: 'var(--text-muted)' }} />
                                )}
                            </div>
                            <div>
                                <h3 className="ql-preview-title">{previewProduct.name}</h3>
                                <div className="ql-preview-subtitle">
                                    <span className="ql-status-badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                                        {previewProduct.categoryName || 'Ангилалгүй'}
                                    </span>
                                    <span>SKU: {previewProduct.sku || '—'}</span>
                                    {previewProduct.productType === 'preorder' && (
                                        <span className="ql-status-badge" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                                            📦 Захиалгын бараа
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Multiple Images */}
                        {previewProduct.images?.length > 1 && (
                            <div className="ql-preview-section">
                                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                    {previewProduct.images.slice(0, 5).map((img, i) => (
                                        <div key={i} style={{
                                            width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                                            flexShrink: 0, background: 'var(--bg-soft)'
                                        }}>
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="ql-preview-section">
                            <div className="ql-preview-section-title">Үнийн мэдээлэл</div>
                            <div className="ql-stat-row">
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value">{formatMoney(previewProduct.pricing?.salePrice)}</div>
                                    <div className="ql-stat-label">Зарах үнэ</div>
                                </div>
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value" style={{ color: 'var(--text-muted)' }}>{formatMoney(previewProduct.pricing?.costPrice)}</div>
                                    <div className="ql-stat-label">Өртөг</div>
                                </div>
                                <div className="ql-stat-card">
                                    {(() => {
                                        const profit = (previewProduct.pricing?.salePrice || 0) - (previewProduct.pricing?.costPrice || 0);
                                        const pct = previewProduct.pricing?.salePrice ? Math.round((profit / previewProduct.pricing.salePrice) * 100) : 0;
                                        return (
                                            <>
                                                <div className="ql-stat-value" style={{ color: profit > 0 ? '#10b981' : '#ef4444' }}>
                                                    {profit > 0 ? '+' : ''}{formatMoney(profit)}
                                                </div>
                                                <div className="ql-stat-label">Ашиг ({pct}%)</div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="ql-preview-section">
                            <div className="ql-preview-section-title">Нөөц & Борлуулалт</div>
                            <div className="ql-stat-row">
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value" style={{
                                        color: (previewProduct.stock?.quantity || 0) === 0 ? '#ef4444' :
                                            (previewProduct.stock?.quantity || 0) <= (previewProduct.stock?.lowStockThreshold || 0) ? '#f59e0b' : 'inherit'
                                    }}>
                                        {previewProduct.stock?.quantity ?? 0}
                                    </div>
                                    <div className="ql-stat-label">Нөөц</div>
                                </div>
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value">{previewProduct.stats?.totalSold ?? 0}</div>
                                    <div className="ql-stat-label">Нийт зарсан</div>
                                </div>
                                <div className="ql-stat-card">
                                    <div className="ql-stat-value">{formatMoney(previewProduct.stats?.totalRevenue ?? 0)}</div>
                                    <div className="ql-stat-label">Нийт орлого</div>
                                </div>
                            </div>
                        </div>

                        {/* Variations */}
                        {previewProduct.variations && previewProduct.variations.length > 0 && (
                            <div className="ql-preview-section">
                                <div className="ql-preview-section-title">Хувилбарууд ({previewProduct.variations.length})</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {previewProduct.variations.map((v, i) => (
                                        <span key={i} className="ql-status-badge" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-primary)' }}>
                                            {v.name} ({v.quantity} ш)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {previewProduct.tags && previewProduct.tags.length > 0 && (
                            <div className="ql-preview-section">
                                <div className="ql-preview-section-title">Шошго</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {previewProduct.tags.map((tag, i) => (
                                        <span key={i} className="ql-status-badge" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {previewProduct.description && (
                            <div className="ql-preview-section">
                                <div className="ql-preview-section-title">Тайлбар</div>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: 100, overflow: 'hidden' }}>
                                    {previewProduct.description}
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="ql-preview-footer">
                            <button className="btn btn-ghost" onClick={() => setPreviewProduct(null)}>Хаах</button>
                            <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => { navigate('/app/products'); onClose(); }}>
                                Дэлгэрэнгүй <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
