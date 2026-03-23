import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    Globe, Search, Loader2, Clock, Package, Truck, CheckCircle2, Copy, Check, X, ChevronDown,
    Link2, ExternalLink, Plus, DollarSign, Trash2, EyeOff, Eye, Power, ChevronUp, Layers, AlertTriangle, Settings
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { moduleSettingsService } from '../../services/db';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { productService } from '../../services/productService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import './SourcingPage.css';

type SourcingStatus = 'pending' | 'ordered' | 'arrived' | 'picked_up' | 'delivered' | 'fulfilled' | 'returned';
type FilterStatus = 'all' | SourcingStatus | 'not_arrived';

interface SourcingItem {
    ordered: boolean;
    orderedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SourcingOrder {
    id: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    items: {
        productId: string;
        name: string;
        quantity: number;
        price: number;
        isPreorder?: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    }[];
    total: number;
    paymentStatus: string;
    status: string;
    createdAt?: Date;
    sourcing?: {
        status: SourcingStatus;
        items: Record<string, SourcingItem>;
        cargoLabel: string;
        sourcedBy: string;
        trackingNumber: string;
        sourceUrl: string;
        sourceCost: number;
        notes: string;
        updatedAt?: Date;
        batchId?: string;
        isBatch?: boolean;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface ProductInfo {
    id: string;
    name: string;
    salePrice: number;
    sourceLinks: { url: string; label: string }[];
    isActive: boolean;
    images: string[];
}

const STATUS_LABELS: Record<SourcingStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending:    { label: 'Хүлээгдэж буй', color: '#e17055', icon: Clock },
    ordered:    { label: 'Захиалсан',     color: '#0984e3', icon: Package },
    arrived:    { label: 'Ирсэн',        color: '#6c5ce7', icon: Truck },
    picked_up:  { label: 'Ирж авсан',    color: '#00b894', icon: CheckCircle2 },
    delivered:  { label: 'Хүргэсэн',     color: '#00b894', icon: Truck },
    fulfilled:  { label: 'Биелсэн',      color: '#2d3436', icon: CheckCircle2 },
    returned:   { label: 'Буцаалт',      color: '#d63031', icon: AlertTriangle },
};

export function SourcingPage() {
    const { business } = useBusinessStore();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [orders, setOrders] = useState<SourcingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [arrivalWarningDays, setArrivalWarningDays] = useState(30);
    const [selectedOrder, setSelectedOrder] = useState<SourcingOrder | null>(null);
    const [inactiveProducts, setInactiveProducts] = useState<ProductInfo[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    const [reactivating, setReactivating] = useState<string | null>(null);
    const [productImages, setProductImages] = useState<Record<string, string>>({});

    // Batch mode
    const [batchMode, setBatchMode] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [showBatchModal, setShowBatchModal] = useState(false);

    const toggleBatchMode = () => {
        setBatchMode(prev => !prev);
        setSelectedOrderIds(new Set());
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const selectedOrders = useMemo(() => {
        return orders.filter(o => selectedOrderIds.has(o.id));
    }, [orders, selectedOrderIds]);

    const generateBatchId = (): string => {
        const now = new Date();
        const dateStr = format(now, 'yyMMdd');
        // Find existing batch numbers for today
        const todayPrefix = `B-${dateStr}-`;
        const existingNums = orders
            .map(o => o.sourcing?.batchId)
            .filter((b): b is string => !!b && b.startsWith(todayPrefix))
            .map(b => parseInt(b.split('-').pop() || '0'))
            .filter(n => !isNaN(n));
        const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        return `${todayPrefix}${String(nextNum).padStart(3, '0')}`;
    };

    // Subscribe to products for inactive list
    useEffect(() => {
        if (!business?.id) return;
        return productService.subscribeProducts(business.id, (products) => {
            const inactive = products
                .filter(p => !p.isActive && !p.isDeleted)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    salePrice: p.pricing?.salePrice || 0,
                    sourceLinks: (p as any).sourceLinks || [],
                    isActive: p.isActive,
                    images: p.images || [],
                }));
            setInactiveProducts(inactive);
            // Build productId → firstImage map for list thumbnails
            const imgMap: Record<string, string> = {};
            products.forEach(p => {
                if (p.images?.[0]) imgMap[p.id] = p.images[0];
            });
            setProductImages(imgMap);
        });
    }, [business?.id]);

    // Load returns config for arrivalWarningDays
    useEffect(() => {
        if (!business?.id) return;
        moduleSettingsService.getSettings(business.id, 'returns').then((data) => {
            if (data?.arrivalWarningDays) setArrivalWarningDays(data.arrivalWarningDays);
        }).catch(() => {});
    }, [business?.id]);

    // "Not arrived" orders: createdAt > arrivalWarningDays ago AND status NOT arrived/picked_up/delivered/fulfilled
    const notArrivedOrders = useMemo(() => {
        const thresholdMs = arrivalWarningDays * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return orders.filter(o => {
            const s = o.sourcing?.status || 'pending';
            if (['arrived', 'picked_up', 'delivered', 'fulfilled'].includes(s)) return false;
            if (!o.createdAt) return false;
            return (now - o.createdAt.getTime()) > thresholdMs;
        });
    }, [orders, arrivalWarningDays]);

    const handleReactivate = async (productId: string) => {
        if (!business?.id) return;
        setReactivating(productId);
        try {
            await productService.updateProduct(business.id, productId, { isActive: true } as any);
            toast.success('Бараа идэвхтэй боллоо');
        } catch { toast.error('Алдаа гарлаа'); }
        finally { setReactivating(null); }
    };

    // Load paid orders that have pre-order items
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, 'businesses', business.id, 'orders'),
            where('paymentStatus', '==', 'paid'),
            where('isDeleted', '==', false),
        );
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: SourcingOrder[] = [];
            snap.docs.forEach(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = d.data() as any;
                const items = data.items || [];
                // Show items that are preorder (by isPreorder flag OR productType)
                const preorderItems = items.filter((it: { isPreorder?: boolean; productType?: string }) => 
                    it.isPreorder || it.productType === 'preorder'
                );
                // If no explicitly preorder items, show ALL items for paid orders
                const displayItems = preorderItems.length > 0 ? preorderItems : items;
                if (displayItems.length === 0) return;
                // Exclude VIP membership orders — they belong in the Membership module
                if (data.orderNumber?.startsWith('VIP-')) return;
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined);
                
                result.push({
                    ...data,
                    id: d.id,
                    items: displayItems,
                    customerName: data.customer?.name || data.customerName || '',
                    customerPhone: data.customer?.phone || data.customerPhone || '',
                    total: data.financials?.totalAmount || data.total || 0,
                    createdAt,
                    sourcing: data.sourcing ? {
                        ...data.sourcing,
                        updatedAt: data.sourcing.updatedAt?.toDate?.() || undefined,
                    } : undefined,
                });
            });
            // Sort: pending first, then by date desc
            result.sort((a, b) => {
                const sa = a.sourcing?.status || 'pending';
                const sb = b.sourcing?.status || 'pending';
                if (sa === 'pending' && sb !== 'pending') return -1;
                if (sb === 'pending' && sa !== 'pending') return 1;
                return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
            });
            setOrders(result);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = useMemo(() => {
        let base = orders;
        if (statusFilter === 'not_arrived') {
            base = notArrivedOrders;
        }
        return base.filter(o => {
            const s = o.sourcing?.status || 'pending';
            if (statusFilter !== 'all' && statusFilter !== 'not_arrived' && s !== statusFilter) return false;
            const matchSearch = !searchQuery || 
                (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.orderNumber || o.id).toLowerCase().includes(searchQuery.toLowerCase());
            return matchSearch;
        });
    }, [orders, statusFilter, searchQuery, notArrivedOrders]);

    const stats = useMemo(() => ({
        pending: orders.filter(o => (o.sourcing?.status || 'pending') === 'pending').length,
        ordered: orders.filter(o => o.sourcing?.status === 'ordered').length,
        arrived: orders.filter(o => o.sourcing?.status === 'arrived').length,
        fulfilled: orders.filter(o => o.sourcing?.status === 'fulfilled' || o.sourcing?.status === 'picked_up' || o.sourcing?.status === 'delivered').length,
    }), [orders]);

    const getSourcingStatus = (o: SourcingOrder): SourcingStatus => o.sourcing?.status || 'pending';

    const getItemProgress = (o: SourcingOrder): string => {
        const total = o.items.length;
        const done = o.items.filter(it => o.sourcing?.items?.[it.productId]?.ordered).length;
        return `${done}/${total}`;
    };

    const getTotalQty = (o: SourcingOrder): number => {
        return o.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    };

    return (
        <div className="sourcing-page animate-fade-in">
            {/* ── Premium Hero ── */}
            <div className="src-hero">
                <div className="src-hero-top">
                    <div className="src-hero-left">
                        <div className="src-hero-icon"><Globe size={24} /></div>
                        <div>
                            <h2 className="src-hero-title">Сорсинг Агент</h2>
                            <div className="src-hero-desc">Хятадаас бараа захиалах, мөрдөх</div>
                        </div>
                    </div>
                    {hasPermission('sourcing.configure') && (
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => navigate('/app/settings?tab=sourcing')}
                            title="Сорсинг тохиргоо"
                            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, color: 'white', width: 36, height: 36 }}
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>
                <div className="src-hero-stats">
                    <div className="src-hero-stat" onClick={() => setStatusFilter('pending')}>
                        <div className="src-hero-stat-value">{stats.pending}</div>
                        <div className="src-hero-stat-label">Хүлээгдэж буй</div>
                    </div>
                    <div className="src-hero-stat" onClick={() => setStatusFilter('ordered')}>
                        <div className="src-hero-stat-value">{stats.ordered}</div>
                        <div className="src-hero-stat-label">Захиалсан</div>
                    </div>
                    <div className="src-hero-stat" onClick={() => setStatusFilter('arrived')}>
                        <div className="src-hero-stat-value">{stats.arrived}</div>
                        <div className="src-hero-stat-label">Ирсэн</div>
                    </div>
                    <div className="src-hero-stat" onClick={() => setStatusFilter('all')}>
                        <div className="src-hero-stat-value">{stats.fulfilled}</div>
                        <div className="src-hero-stat-label">Биелсэн</div>
                    </div>
                    {notArrivedOrders.length > 0 && (
                        <div className="src-hero-stat warning" onClick={() => setStatusFilter('not_arrived')}>
                            <div className="src-hero-stat-value">⚠️ {notArrivedOrders.length}</div>
                            <div className="src-hero-stat-label">Ирээгүй</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Card: Toolbar + Orders List ── */}
            <div className="src-page-card">

            {/* Toolbar */}
            <div className="inv-toolbar">
                <div className="inv-search-wrap">
                    <Search size={18} className="inv-search-icon" />
                    <input className="inv-search-input" placeholder="Захиалга, харилцагчаар хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        className={`sourcing-batch-toggle ${batchMode ? 'active' : ''}`}
                        onClick={toggleBatchMode}
                    >
                        <Layers size={16} />
                        {batchMode ? 'Болих' : 'Нэгтгэх горим'}
                    </button>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="sourcing-status-select"
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="pending">Хүлээгдэж буй</option>
                        <option value="ordered">Захиалсан</option>
                        <option value="arrived">Ирсэн</option>
                        <option value="picked_up">Ирж авсан</option>
                        <option value="delivered">Хүргэсэн</option>
                        <option value="fulfilled">Биелсэн</option>
                        {notArrivedOrders.length > 0 && <option value="not_arrived">⚠️ Ирээгүй ({notArrivedOrders.length})</option>}
                    </select>
                </div>
            </div>

            {/* Orders List — Premium Cards */}
            <div className="sourcing-orders-list">
                {loading ? (
                    <div className="sourcing-loading"><Loader2 size={36} className="animate-spin" /><p>Ачаалж байна...</p></div>
                ) : filtered.length === 0 ? (
                    <div className="sourcing-empty">
                        <div className="sourcing-empty-icon"><Globe size={48} /></div>
                        <h3>Сорсинг захиалга олдсонгүй</h3>
                        <p>Төлбөр баталгаажсан захиалга ирэхэд энд харагдана</p>
                    </div>
                ) : (
                    filtered.map(order => {
                        const s = getSourcingStatus(order);
                        const statusInfo = STATUS_LABELS[s];
                        const StatusIcon = statusInfo.icon;
                        const progress = getItemProgress(order);
                        const [done, total] = progress.split('/').map(Number);
                        const progressPercent = total > 0 ? (done / total) * 100 : 0;
                        const totalQty = getTotalQty(order);

                        return (
                            <div
                                key={order.id}
                                className={`sourcing-order-card ${s} ${batchMode && selectedOrderIds.has(order.id) ? 'batch-selected' : ''}`}
                                onClick={() => batchMode ? toggleOrderSelection(order.id) : setSelectedOrder(order)}
                            >
                                {batchMode && (
                                    <div className="sourcing-batch-check">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.has(order.id)}
                                            onChange={() => toggleOrderSelection(order.id)}
                                            onClick={e => e.stopPropagation()}
                                            style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
                                        />
                                    </div>
                                )}
                                <div className="sourcing-card-left">
                                    {/* Product image or status icon */}
                                    {(() => {
                                        const firstImg = order.items.find(it => productImages[it.productId]);
                                        if (firstImg && productImages[firstImg.productId]) {
                                            return (
                                                <img
                                                    src={productImages[firstImg.productId]}
                                                    alt={firstImg.name}
                                                    className="sourcing-card-avatar"
                                                    style={{
                                                        width: 44, height: 44, borderRadius: 10,
                                                        objectFit: 'cover',
                                                        border: '2px solid ' + statusInfo.color + '30',
                                                    }}
                                                />
                                            );
                                        }
                                        return (
                                            <div className="sourcing-card-avatar" style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                                                <StatusIcon size={18} />
                                            </div>
                                        );
                                    })()}
                                    <div className="sourcing-card-info">
                                        <div className="sourcing-card-top">
                                            <span className="sourcing-card-order">#{(order.orderNumber || order.id.slice(0, 6)).toUpperCase()}</span>
                                            <span className="sourcing-card-date">{order.createdAt ? format(order.createdAt, 'MM/dd HH:mm') : '—'}</span>
                                            {order.sourcing?.batchId && (
                                                <span className="sourcing-batch-id-badge">
                                                    <Layers size={10} />
                                                    {order.sourcing.batchId}
                                                </span>
                                            )}
                                        </div>
                                        <div className="sourcing-card-customer">{order.customerName || 'Тодорхойгүй'}</div>
                                        {order.customerPhone && <div className="sourcing-card-phone">{order.customerPhone}</div>}
                                    </div>
                                </div>

                                <div className="sourcing-card-meta">
                                    <div className="sourcing-card-items">
                                        <Package size={13} />
                                        <span>{order.items.length} төрөл · {totalQty}ш</span>
                                    </div>
                                    <div className="sourcing-card-amount">₮{(order.total || 0).toLocaleString()}</div>
                                </div>

                                <div className="sourcing-card-progress-section">
                                    <div className="sourcing-card-progress-header">
                                        <span className="sourcing-card-progress-label">Явц</span>
                                        <span className="sourcing-card-progress-value">{progress}</span>
                                    </div>
                                    <div className="sourcing-card-progress-bar">
                                        <div
                                            className="sourcing-card-progress-fill"
                                            style={{ width: `${progressPercent}%`, background: progressPercent === 100 ? 'var(--accent-green)' : statusInfo.color }}
                                        />
                                    </div>
                                </div>

                                <div className="sourcing-card-status">
                                    <span className="sourcing-card-badge" style={{ background: statusInfo.color + '14', color: statusInfo.color, borderColor: statusInfo.color + '30' }}>
                                        <StatusIcon size={12} />
                                        {statusInfo.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            </div>{/* /src-page-card */}

            {/* Inactive Products Panel */}
            {inactiveProducts.length > 0 && (
                <div className="sourcing-inactive-panel" style={{ marginTop: 20 }}>
                    <button
                        className="sourcing-inactive-toggle"
                        onClick={() => setShowInactive(!showInactive)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <EyeOff size={16} />
                            <span>Идэвхгүй бараа ({inactiveProducts.length})</span>
                        </div>
                        {showInactive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showInactive && (
                        <div className="sourcing-inactive-list">
                            {inactiveProducts.map(p => (
                                <div key={p.id} className="sourcing-inactive-item">
                                    <div className="sourcing-inactive-img">
                                        {p.images[0] ? (
                                            <img src={p.images[0]} alt="" />
                                        ) : (
                                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                                        )}
                                    </div>
                                    <div className="sourcing-inactive-info">
                                        <span className="sourcing-inactive-name">{p.name}</span>
                                        <span className="sourcing-inactive-price">₮{p.salePrice.toLocaleString()}</span>
                                    </div>
                                    <button
                                        className="sourcing-reactivate-btn"
                                        onClick={() => handleReactivate(p.id)}
                                        disabled={reactivating === p.id}
                                    >
                                        {reactivating === p.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <><Eye size={14} /> Идэвхжүүлэх</>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Batch Mode Floating Action Bar */}
            {batchMode && selectedOrderIds.size > 0 && (
                <div className="sourcing-batch-fab">
                    <div className="sourcing-batch-fab-inner">
                        <span className="sourcing-batch-fab-count">
                            <Layers size={16} />
                            {selectedOrderIds.size} захиалга сонгосон
                        </span>
                        <button
                            className="btn btn-primary gradient-btn sourcing-batch-fab-btn"
                            onClick={() => setShowBatchModal(true)}
                        >
                            📦 Нэгтгэх
                        </button>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <SourcingDetailModal
                    order={selectedOrder}
                    businessId={business!.id}
                    settings={(business as any)?.settings?.sourcing}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={(updated) => {
                        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
                        setSelectedOrder(updated);
                    }}
                />
            )}

            {showBatchModal && selectedOrders.length > 0 && (
                <BatchSourcingModal
                    orders={selectedOrders}
                    allOrders={orders}
                    businessId={business!.id}
                    settings={(business as any)?.settings?.sourcing}
                    generateBatchId={generateBatchId}
                    onClose={() => setShowBatchModal(false)}
                    onSaved={() => {
                        setShowBatchModal(false);
                        setBatchMode(false);
                        setSelectedOrderIds(new Set());
                    }}
                />
            )}
        </div>
    );
}

// ============ DETAIL MODAL ============
function SourcingDetailModal({ order, businessId, settings, onClose, onUpdate }: {
    order: SourcingOrder;
    businessId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings?: any;
    onClose: () => void;
    onUpdate: (o: SourcingOrder) => void;
}) {
    const { hasPermission } = usePermissions();
    const [saving, setSaving] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState(order.sourcing?.trackingNumber || '');
    const [notes, setNotes] = useState(order.sourcing?.notes || '');
    const [itemsState, setItemsState] = useState<Record<string, SourcingItem>>(() => {
        const existing = order.sourcing?.items || {};
        const state: Record<string, SourcingItem> = {};
        const hasExisting = Object.keys(existing).length > 0;
        order.items.forEach(it => {
            state[it.productId] = existing[it.productId] || { ordered: !hasExisting, orderedAt: !hasExisting ? new Date() : undefined };
        });
        return state;
    });
    const [statusOverride, setStatusOverride] = useState<SourcingStatus>(order.sourcing?.status || 'ordered');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [expandedCargoField, setExpandedCargoField] = useState<string | null>('label');

    // Dirty state tracking: save button disabled when no changes
    const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => {
        const snap = JSON.stringify({
            items: Object.fromEntries(Object.entries(
                (() => { const s: Record<string, SourcingItem> = {}; const existing = order.sourcing?.items || {}; const hasExisting = Object.keys(existing).length > 0; order.items.forEach(it => { s[it.productId] = existing[it.productId] || { ordered: !hasExisting }; }); return s; })()
            ).map(([k, v]) => [k, v.ordered])),
            status: order.sourcing?.status || 'ordered',
            tracking: order.sourcing?.trackingNumber || '',
            notes: order.sourcing?.notes || '',
        });
        return snap;
    });

    // Products info for source links + price editing
    const [productsInfo, setProductsInfo] = useState<Record<string, ProductInfo>>({});
    const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
    const [addingLink, setAddingLink] = useState<string | null>(null);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkLabel, setNewLinkLabel] = useState('');

    // Subscribe to products for sourceLinks and live pricing
    useEffect(() => {
        const unsub = productService.subscribeProducts(businessId, (products) => {
            const info: Record<string, ProductInfo> = {};
            products.forEach(p => {
                info[p.id] = {
                    id: p.id,
                    name: p.name,
                    salePrice: p.pricing?.salePrice || 0,
                    sourceLinks: (p as any).sourceLinks || [],
                    isActive: p.isActive,
                    images: p.images || [],
                };
            });
            setProductsInfo(info);
        });
        return () => unsub();
    }, [businessId]);

    // Settings
    const recipientName = settings?.recipientName || '';
    const recipientPhone = settings?.recipientPhone || '';
    const cargoAddress = settings?.cargoAddress || '';
    const shopPhone = settings?.shopPhone || '';
    
    // Dynamic cargo label template
    const labelTemplate = settings?.labelTemplate || '{shopPhone}-{date}-{customer}-{qty}ш';
    
    const totalQty = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const dateStr = format(new Date(), 'M/dd');
    const customerName = order.customerName || 'Тодорхойгүй';

    // Generate auto label from template
    const autoLabel = labelTemplate
        .replace('{shopPhone}', shopPhone)
        .replace('{date}', dateStr)
        .replace('{customer}', customerName)
        .replace('{qty}', String(totalQty))
        .replace('{orderNumber}', order.orderNumber || order.id.slice(0, 6).toUpperCase());

    const recipientText = `${recipientName}，${recipientPhone}`;
    const addressText = `${cargoAddress} (${autoLabel})`;

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch { toast.error('Хуулж чадсангүй'); }
    };

    const toggleItem = (productId: string) => {
        setItemsState(prev => {
            const newState = { ...prev };
            newState[productId] = {
                ordered: !prev[productId]?.ordered,
                orderedAt: !prev[productId]?.ordered ? new Date() : undefined,
            };
            return newState;
        });
    };

    const allItemsOrdered = order.items.every(it => itemsState[it.productId]?.ordered);
    const anyItemOrdered = order.items.some(it => itemsState[it.productId]?.ordered);
    const isFirstSave = !order.sourcing?.status;

    // Auto-calculate status based on items
    const computedStatus: SourcingStatus = (() => {
        if (statusOverride === 'ordered' || statusOverride === 'arrived' || statusOverride === 'picked_up' || statusOverride === 'delivered' || statusOverride === 'fulfilled') return statusOverride;
        if (allItemsOrdered) return 'ordered';
        return 'pending';
    })();

    const handleSave = async () => {
        // First-time save confirmation
        if (isFirstSave) {
            const confirmed = window.confirm(
                `Та тус захиалга (#${(order.orderNumber || order.id.slice(0, 6)).toUpperCase()}) -г "${statusOverride === 'ordered' ? 'Захиалсан' : statusOverride === 'pending' ? 'Хүлээгдэж буй' : statusOverride}" төлөвт оруулах гэж байна. Үргэлжлүүлэх үү?`
            );
            if (!confirmed) return;
        }
        setSaving(true);
        try {
            // Use the status the admin selected directly
            const finalStatus = statusOverride;
            const sourcingData = {
                status: finalStatus,
                items: Object.fromEntries(
                    Object.entries(itemsState).map(([k, v]) => [k, {
                        ordered: v.ordered,
                        ...(v.orderedAt ? { orderedAt: Timestamp.fromDate(v.orderedAt) } : {}),
                    }])
                ),
                cargoLabel: autoLabel,
                trackingNumber,
                notes,
                updatedAt: Timestamp.now(),
            };
            const orderUpdate: Record<string, unknown> = {
                sourcing: sourcingData,
            };
            // Auto-advance order status: sourcing ordered/arrived → order 'sourced'
            if (['ordered', 'arrived', 'picked_up', 'delivered', 'fulfilled'].includes(finalStatus)) {
                const currentOrderStatus = order.status || 'new';
                if (['new', 'confirmed'].includes(currentOrderStatus)) {
                    orderUpdate.status = 'sourced';
                }
            }
            // Auto-cancel order when sourcing is returned
            if (finalStatus === 'returned') {
                orderUpdate.status = 'cancelled';
                orderUpdate.isDeleted = true;
            }
            await updateDoc(doc(db, 'businesses', businessId, 'orders', order.id), orderUpdate);
            const updated: SourcingOrder = {
                ...order,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sourcing: { ...sourcingData, sourcedBy: '', updatedAt: new Date() } as any,
            };
            onUpdate(updated);
            toast.success('Хадгалагдлаа');
            // Update saved snapshot so button becomes disabled
            setLastSavedSnapshot(JSON.stringify({
                items: Object.fromEntries(Object.entries(itemsState).map(([k, v]) => [k, v.ordered])),
                status: statusOverride,
                tracking: trackingNumber,
                notes,
            }));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    // Source link management
    const handleAddLink = async (productId: string) => {
        if (!newLinkUrl.trim()) return;
        const product = productsInfo[productId];
        const currentLinks = product?.sourceLinks || [];
        const newLink = { url: newLinkUrl.trim(), label: newLinkLabel.trim() || extractDomain(newLinkUrl) };
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await productService.updateProduct(businessId, productId, { sourceLinks: [...currentLinks, newLink] } as any);
            toast.success('Линк нэмэгдлээ');
            setAddingLink(null);
            setNewLinkUrl('');
            setNewLinkLabel('');
        } catch { toast.error('Алдаа'); }
    };

    const handleRemoveLink = async (productId: string, index: number) => {
        const product = productsInfo[productId];
        const currentLinks = [...(product?.sourceLinks || [])];
        currentLinks.splice(index, 1);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await productService.updateProduct(businessId, productId, { sourceLinks: currentLinks } as any);
            toast.success('Линк устгагдлаа');
        } catch { toast.error('Алдаа'); }
    };

    const handlePriceUpdate = async (productId: string) => {
        const newPrice = parseFloat(editingPrice[productId]);
        if (isNaN(newPrice) || newPrice < 0) return;
        try {
            await productService.updateProduct(businessId, productId, { 'pricing.salePrice': newPrice } as any);
            toast.success('Үнэ шинэчлэгдлээ');
            setEditingPrice(prev => { const n = {...prev}; delete n[productId]; return n; });
        } catch { toast.error('Алдаа'); }
    };

    const extractDomain = (url: string): string => {
        try { return new URL(url).hostname.replace('www.', ''); }
        catch { return 'Линк'; }
    };

    const handleDeactivateProduct = async (productId: string) => {
        try {
            await productService.updateProduct(businessId, productId, { isActive: false } as any);
            toast.success('Бараа идэвхгүй боллоо');
        } catch { toast.error('Алдаа'); }
    };

    const hasConfig = !!recipientName && !!cargoAddress;

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal sourcing-detail-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header" style={{ padding: '20px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}>
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                                #{(order.orderNumber || order.id.slice(0, 6)).toUpperCase()} — {customerName}
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {order.createdAt ? format(order.createdAt, 'yyyy.MM.dd HH:mm') : ''} · {totalQty}ш · ₮{(order.total || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: 0, overflowY: 'auto' }}>
                    {/* Cargo Info */}
                    {hasConfig ? (
                        <div className="sourcing-cargo-section">
                            {/* Collapsible cargo blocks — only one open at a time */}
                            {[{
                                key: 'recipient', icon: '📋', label: 'Хүлээн авагч', value: recipientText, style: {},
                            }, {
                                key: 'label', icon: '🏷️', label: 'Таних код', value: autoLabel, style: {
                                    background: 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(0,206,158,0.06) 100%)',
                                    borderColor: 'var(--primary)', borderStyle: 'dashed' as const,
                                }, valueStyle: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' },
                            }, {
                                key: 'address', icon: '📋', label: 'Хаяг (карго шошго)', value: addressText, style: {},
                            }].map(block => {
                                const isOpen = expandedCargoField === block.key;
                                return (
                                    <div key={block.key} className="sourcing-copy-block" style={{
                                        ...block.style, cursor: 'pointer', transition: 'all 0.2s',
                                        ...(isOpen ? {} : { padding: '8px 16px' }),
                                    }} onClick={() => setExpandedCargoField(isOpen ? null : block.key)}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <div className="sourcing-copy-label" style={{ margin: 0 }}>{block.icon} {block.label}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {!isOpen && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {block.value}
                                                    </span>
                                                )}
                                                <ChevronDown size={14} style={{
                                                    color: 'var(--text-muted)', transition: 'transform 0.2s',
                                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    opacity: isOpen ? 0 : 1,
                                                }} />
                                            </div>
                                        </div>
                                        {isOpen && (
                                            <>
                                                <div className="sourcing-copy-value" style={block.valueStyle || {}}>{block.value}</div>
                                                <button className="sourcing-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopy(block.value, block.key); }}>
                                                    {copiedField === block.key ? <Check size={14} /> : <Copy size={14} />}
                                                    {copiedField === block.key ? 'Хуулсан!' : 'Хуулах'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="sourcing-cargo-section" style={{ textAlign: 'center', padding: '24px 28px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                ⚠️ Каргоны тохиргоо хийгдээгүй. Тохиргоо → Сорсинг хэсэгт хаяг оруулна уу.
                            </p>
                        </div>
                    )}

                    {/* Items checklist */}
                    <div className="sourcing-items-section">
                        <div className="sourcing-section-title">
                            Сорсинг бараа ({order.items.filter(it => itemsState[it.productId]?.ordered).length}/{order.items.length} захиалсан)
                        </div>
                        <div className="sourcing-items-list">
                            {order.items.map(item => {
                                const isOrdered = itemsState[item.productId]?.ordered;
                                const productInfo = productsInfo[item.productId];
                                const links = productInfo?.sourceLinks || [];
                                const currentPrice = productInfo?.salePrice || 0;
                                const priceChanged = currentPrice !== item.price && currentPrice > 0;
                                const isEditingPrice = editingPrice[item.productId] !== undefined;

                                return (
                                    <div key={item.productId} className={`sourcing-item-block ${isOrdered ? 'ordered' : ''}`}>
                                        <label className="sourcing-item-row">
                                            <input
                                                type="checkbox"
                                                checked={isOrdered}
                                                onChange={() => toggleItem(item.productId)}
                                                style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
                                            />
                                            {/* Product thumbnail */}
                                            {productInfo?.images?.[0] ? (
                                                <img
                                                    src={productInfo.images[0]}
                                                    alt={item.name}
                                                    style={{
                                                        width: 40, height: 40, borderRadius: 8,
                                                        objectFit: 'cover', flexShrink: 0,
                                                        border: '1px solid var(--border-primary)',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: 'var(--surface-2)', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'var(--text-muted)', fontSize: '0.9rem',
                                                }}>📦</div>
                                            )}
                                            <div className="sourcing-item-info">
                                                <span className="sourcing-item-name">{item.name}</span>
                                                <span className="sourcing-item-qty">x{item.quantity || 1}</span>
                                                {productsInfo[item.productId] && !productsInfo[item.productId].isActive && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e17055', background: 'rgba(225,112,85,0.1)', padding: '1px 6px', borderRadius: 4 }}>Идэвхгүй</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {/* Inline price display/edit */}
                                                {isEditingPrice ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <input
                                                            type="number"
                                                            className="input"
                                                            value={editingPrice[item.productId]}
                                                            onChange={e => setEditingPrice(prev => ({...prev, [item.productId]: e.target.value}))}
                                                            onKeyDown={e => { if (e.key === 'Enter') handlePriceUpdate(item.productId); if (e.key === 'Escape') setEditingPrice(prev => { const n = {...prev}; delete n[item.productId]; return n; }); }}
                                                            onClick={e => e.stopPropagation()}
                                                            autoFocus
                                                            style={{ width: 90, height: 30, fontSize: '0.85rem', padding: '2px 8px', borderRadius: 8, textAlign: 'right' }}
                                                        />
                                                        <button className="btn btn-primary btn-xs" onClick={(e) => { e.preventDefault(); handlePriceUpdate(item.productId); }} style={{ height: 28, padding: '0 8px', borderRadius: 6, fontSize: '0.75rem' }}>✓</button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="sourcing-item-price"
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPrice(prev => ({...prev, [item.productId]: String(currentPrice || item.price)})); }}
                                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}
                                                        title="Дарж үнэ засах"
                                                    >
                                                        ₮{(currentPrice || item.price || 0).toLocaleString()}
                                                        <DollarSign size={11} style={{ opacity: 0.4 }} />
                                                        {priceChanged && <span style={{ position: 'absolute', top: -6, right: -6, width: 6, height: 6, borderRadius: '50%', background: '#e17055' }} />}
                                                    </span>
                                                )}
                                            </div>
                                        </label>

                                        {/* Source links */}
                                        <div className="sourcing-links-row">
                                            {links.map((link, i) => (
                                                <div key={i} className="sourcing-link-chip">
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title={link.url}>
                                                        <ExternalLink size={11} />
                                                        {link.label}
                                                    </a>
                                                    <button className="sourcing-link-remove" onClick={() => handleRemoveLink(item.productId, i)} title="Устгах">
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            {addingLink === item.productId ? (
                                                <div className="sourcing-link-add-form" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        className="input"
                                                        placeholder="URL (https://...)"
                                                        value={newLinkUrl}
                                                        onChange={e => setNewLinkUrl(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleAddLink(item.productId); }}
                                                        autoFocus
                                                        style={{ height: 28, fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6, flex: 1, minWidth: 160 }}
                                                    />
                                                    <input
                                                        className="input"
                                                        placeholder="Нэр"
                                                        value={newLinkLabel}
                                                        onChange={e => setNewLinkLabel(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleAddLink(item.productId); }}
                                                        style={{ height: 28, fontSize: '0.8rem', padding: '2px 8px', borderRadius: 6, width: 70 }}
                                                    />
                                                    <button className="btn btn-primary btn-xs" onClick={() => handleAddLink(item.productId)} style={{ height: 26, padding: '0 8px', borderRadius: 6, fontSize: '0.75rem' }}>✓</button>
                                                    <button className="btn btn-ghost btn-xs" onClick={() => { setAddingLink(null); setNewLinkUrl(''); setNewLinkLabel(''); }} style={{ height: 26, padding: '0 4px' }}><X size={12} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                <button
                                                    className="sourcing-link-add-btn"
                                                    onClick={(e) => { e.stopPropagation(); setAddingLink(item.productId); setNewLinkUrl(''); setNewLinkLabel(''); }}
                                                >
                                                    <Plus size={11} />
                                                    Линк
                                                </button>
                                                {productsInfo[item.productId]?.isActive !== false && (
                                                    <button
                                                        className="sourcing-link-add-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleDeactivateProduct(item.productId); }}
                                                        style={{ color: '#e17055', borderColor: 'rgba(225,112,85,0.2)' }}
                                                        title="Бараа дууссан — идэвхгүй болгох"
                                                    >
                                                        <EyeOff size={11} />
                                                        Дууссан
                                                    </button>
                                                )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status + Tracking */}
                    <div className="sourcing-tracking-section">
                        <div className="sourcing-section-title">Статус & Каргоны дугаар</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Статус</label>
                                <div className="sourcing-select-wrap">
                                    <select
                                        className="input select"
                                        value={statusOverride}
                                        onChange={e => setStatusOverride(e.target.value as SourcingStatus)}
                                        style={{ height: 44 }}

                                    >
                                        <option value="pending">Хүлээгдэж буй</option>
                                        <option value="ordered">Захиалсан</option>
                                        <option value="arrived">Ирсэн</option>
                                        <option value="picked_up">Ирж авсан</option>
                                        <option value="delivered">Хүргэсэн</option>
                                        <option value="fulfilled">Биелсэн</option>
                                        <option value="returned" style={{ color: '#d63031' }}>🔄 Буцаалт</option>
                                    </select>
                                    <ChevronDown size={14} className="sourcing-select-icon" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Каргоны дугаар</label>
                                <input className="input" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Pinduoduo / Taobao дугаар" style={{ height: 44 }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Тэмдэглэл</label>
                            <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Нэмэлт мэдээлэл..." rows={2} style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '16px 28px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Болих</button>
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={
                        saving || (
                            !isFirstSave &&
                            JSON.stringify({ items: Object.fromEntries(Object.entries(itemsState).map(([k, v]) => [k, v.ordered])), status: statusOverride, tracking: trackingNumber, notes }) === lastSavedSnapshot
                        )
                    }>
                        {saving ? 'Хадгалж байна...' : '💾 Хадгалах'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ============ BATCH SOURCING MODAL ============
interface BatchItem {
    productId: string;
    name: string;
    totalQty: number;
    breakdown: { orderId: string; orderNumber: string; customer: string; qty: number }[];
}

function BatchSourcingModal({ orders, allOrders, businessId, settings, generateBatchId, onClose, onSaved }: {
    orders: SourcingOrder[];
    allOrders: SourcingOrder[];
    businessId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings?: any;
    generateBatchId: () => string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [batchId] = useState(() => generateBatchId());
    const [statusOverride, setStatusOverride] = useState<SourcingStatus>('ordered');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [expandedBatchField, setExpandedBatchField] = useState<string | null>(null);

    // Group items by productId
    const batchItems = useMemo<BatchItem[]>(() => {
        const map = new Map<string, BatchItem>();
        orders.forEach(order => {
            order.items.forEach(item => {
                const existing = map.get(item.productId);
                if (existing) {
                    existing.totalQty += item.quantity || 1;
                    existing.breakdown.push({
                        orderId: order.id,
                        orderNumber: order.orderNumber || order.id.slice(0, 6),
                        customer: order.customerName || 'Тодорхойгүй',
                        qty: item.quantity || 1,
                    });
                } else {
                    map.set(item.productId, {
                        productId: item.productId,
                        name: item.name,
                        totalQty: item.quantity || 1,
                        breakdown: [{
                            orderId: order.id,
                            orderNumber: order.orderNumber || order.id.slice(0, 6),
                            customer: order.customerName || 'Тодорхойгүй',
                            qty: item.quantity || 1,
                        }],
                    });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
    }, [orders]);

    const totalQty = batchItems.reduce((s, i) => s + i.totalQty, 0);

    // Cargo settings
    const recipientName = settings?.recipientName || '';
    const recipientPhone = settings?.recipientPhone || '';
    const cargoAddress = settings?.cargoAddress || '';
    const shopPhone = settings?.shopPhone || '';

    const recipientText = `${recipientName}，${recipientPhone}`;
    const cargoLabel = `${shopPhone} ${batchId} ${totalQty}ш`;
    const addressText = `${cargoAddress} (${cargoLabel})`;

    const hasConfig = !!recipientName && !!cargoAddress;

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch { toast.error('Хуулж чадсангүй'); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build sourcing items for each order
            const promises = orders.map(order => {
                const itemsMap: Record<string, SourcingItem> = {};
                order.items.forEach(it => {
                    itemsMap[it.productId] = { ordered: true, orderedAt: new Date() };
                });

                const sourcingData = {
                    status: statusOverride,
                    items: Object.fromEntries(
                        Object.entries(itemsMap).map(([k, v]) => [k, {
                            ordered: v.ordered,
                            ...(v.orderedAt ? { orderedAt: Timestamp.fromDate(v.orderedAt) } : {}),
                        }])
                    ),
                    cargoLabel,
                    batchId,
                    isBatch: true,
                    trackingNumber,
                    notes,
                    updatedAt: Timestamp.now(),
                };

                const orderUpdate: Record<string, unknown> = {
                    sourcing: sourcingData,
                };
                // Auto-advance order status: sourcing ordered → order 'sourced'
                if (['ordered', 'arrived', 'picked_up', 'delivered', 'fulfilled'].includes(statusOverride)) {
                    const currentOrderStatus = order.status || 'new';
                    if (['new', 'confirmed'].includes(currentOrderStatus)) {
                        orderUpdate.status = 'sourced';
                    }
                }
                return updateDoc(doc(db, 'businesses', businessId, 'orders', order.id), orderUpdate);
            });

            await Promise.all(promises);
            toast.success(`${orders.length} захиалга нэгтгэгдлээ · ${batchId}`);
            onSaved();
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal sourcing-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
                {/* Header */}
                <div className="modal-header" style={{ padding: '20px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}>
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
                                📦 Нэгтгэсэн Сорсинг
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {orders.length} захиалга · {batchItems.length} төрөл · {totalQty}ш
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: 0, overflowY: 'auto' }}>
                    {/* Batch Code */}
                    <div className="sourcing-cargo-section">
                        <div className="sourcing-copy-block" style={{
                            background: 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(0,206,158,0.06) 100%)',
                            borderColor: 'var(--primary)', borderStyle: 'dashed',
                        }}>
                            <div className="sourcing-copy-label">🏷️ Багц код</div>
                            <div className="sourcing-copy-value" style={{
                                fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)',
                                letterSpacing: '1px', fontFamily: 'monospace',
                            }}>{batchId}</div>
                            <button className="sourcing-copy-btn" onClick={() => handleCopy(batchId, 'batchId')}>
                                {copiedField === 'batchId' ? <Check size={14} /> : <Copy size={14} />}
                                {copiedField === 'batchId' ? 'Хуулсан!' : 'Хуулах'}
                            </button>
                        </div>

                        {hasConfig ? (
                            <>
                                {[{
                                    key: 'recipient', icon: '📋', label: 'Хүлээн авагч', value: recipientText,
                                }, {
                                    key: 'address', icon: '📋', label: 'Хаяг (карго шошго)', value: addressText,
                                }].map(block => {
                                    const isOpen = expandedBatchField === block.key;
                                    return (
                                        <div key={block.key} className="sourcing-copy-block" style={{
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            ...(isOpen ? {} : { padding: '8px 16px' }),
                                        }} onClick={() => setExpandedBatchField(isOpen ? null : block.key)}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div className="sourcing-copy-label" style={{ margin: 0 }}>{block.icon} {block.label}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {!isOpen && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {block.value}
                                                        </span>
                                                    )}
                                                    <ChevronDown size={14} style={{
                                                        color: 'var(--text-muted)', transition: 'transform 0.2s',
                                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    }} />
                                                </div>
                                            </div>
                                            {isOpen && (
                                                <>
                                                    <div className="sourcing-copy-value">{block.value}</div>
                                                    <button className="sourcing-copy-btn" onClick={(e) => { e.stopPropagation(); handleCopy(block.value, block.key); }}>
                                                        {copiedField === block.key ? <Check size={14} /> : <Copy size={14} />}
                                                        {copiedField === block.key ? 'Хуулсан!' : 'Хуулах'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                                ⚠️ Каргоны тохиргоо хийгдээгүй. Тохиргоо → Сорсинг хэсэгт хаяг оруулна уу.
                            </p>
                        )}
                    </div>

                    {/* Grouped Items */}
                    <div className="sourcing-items-section">
                        <div className="sourcing-section-title">
                            Нэгтгэсэн бараа ({batchItems.length} төрөл · {totalQty}ш)
                        </div>
                        <div className="sourcing-items-list">
                            {batchItems.map(item => (
                                <div key={item.productId} className="sourcing-batch-item-block">
                                    <div className="sourcing-batch-item-header">
                                        <span className="sourcing-batch-item-name">{item.name}</span>
                                        <span className="sourcing-batch-item-qty">{item.totalQty}ш</span>
                                    </div>
                                    <div className="sourcing-batch-breakdown">
                                        {item.breakdown.map((b, i) => (
                                            <span key={i} className="sourcing-batch-breakdown-chip">
                                                #{b.orderNumber.toUpperCase()}-{b.customer}({b.qty})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status + Tracking */}
                    <div className="sourcing-tracking-section">
                        <div className="sourcing-section-title">Статус & Каргоны дугаар</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Статус</label>
                                <div className="sourcing-select-wrap">
                                    <select
                                        className="input select"
                                        value={statusOverride}
                                        onChange={e => setStatusOverride(e.target.value as SourcingStatus)}
                                        style={{ height: 44 }}
                                    >
                                        <option value="pending">Хүлээгдэж буй</option>
                                        <option value="ordered">Захиалсан</option>
                                        <option value="arrived">Ирсэн</option>
                                        <option value="picked_up">Ирж авсан</option>
                                        <option value="delivered">Хүргэсэн</option>
                                        <option value="fulfilled">Биелсэн</option>
                                    </select>
                                    <ChevronDown size={14} className="sourcing-select-icon" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Каргоны дугаар</label>
                                <input className="input" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Pinduoduo / Taobao дугаар" style={{ height: 44 }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Тэмдэглэл</label>
                            <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Нэмэлт мэдээлэл..." rows={2} style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '16px 28px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Болих</button>
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving}>
                        {saving ? 'Хадгалж байна...' : `📦 ${orders.length} захиалга нэгтгэх`}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
