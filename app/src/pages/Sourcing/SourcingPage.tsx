import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Globe, Search, Loader2, Clock, Package, Truck, CheckCircle2, Copy, Check, X, ChevronDown
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import './SourcingPage.css';

type SourcingStatus = 'pending' | 'ordered' | 'arrived' | 'picked_up' | 'delivered' | 'fulfilled';

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
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

const STATUS_LABELS: Record<SourcingStatus, { label: string; color: string; icon: typeof Clock }> = {
    pending:    { label: 'Хүлээгдэж буй', color: '#e17055', icon: Clock },
    ordered:    { label: 'Захиалсан',     color: '#0984e3', icon: Package },
    arrived:    { label: 'Ирсэн',        color: '#6c5ce7', icon: Truck },
    picked_up:  { label: 'Ирж авсан',    color: '#00b894', icon: CheckCircle2 },
    delivered:  { label: 'Хүргэсэн',     color: '#00b894', icon: Truck },
    fulfilled:  { label: 'Биелсэн',      color: '#2d3436', icon: CheckCircle2 },
};

export function SourcingPage() {
    const { business } = useBusinessStore();
    const [orders, setOrders] = useState<SourcingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | SourcingStatus>('all');
    const [selectedOrder, setSelectedOrder] = useState<SourcingOrder | null>(null);

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
                
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined);
                
                result.push({
                    ...data,
                    id: d.id,
                    items: displayItems,
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
        return orders.filter(o => {
            const s = o.sourcing?.status || 'pending';
            const matchStatus = statusFilter === 'all' || s === statusFilter;
            const matchSearch = !searchQuery || 
                (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.orderNumber || o.id).toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [orders, statusFilter, searchQuery]);

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
            <div className="page-hero" style={{ marginBottom: 8 }}>
                <div className="page-hero-left">
                    <div className="page-hero-icon">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h2 className="page-hero-title">Сорсинг Агент</h2>
                        <p className="page-hero-subtitle">Хятадаас бараа захиалах, мөрдөх</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="inv-stats-grid" style={{ marginBottom: 24 }}>
                <div className="inv-stat-card" onClick={() => setStatusFilter('pending')} style={{ cursor: 'pointer' }}>
                    <div className="inv-stat-content">
                        <h4>Хүлээгдэж буй</h4>
                        <div className="inv-stat-value">{stats.pending}</div>
                    </div>
                    <div className="inv-stat-icon icon-red"><Clock size={24} /></div>
                </div>
                <div className="inv-stat-card" onClick={() => setStatusFilter('ordered')} style={{ cursor: 'pointer' }}>
                    <div className="inv-stat-content">
                        <h4>Захиалсан</h4>
                        <div className="inv-stat-value">{stats.ordered}</div>
                    </div>
                    <div className="inv-stat-icon icon-primary"><Package size={24} /></div>
                </div>
                <div className="inv-stat-card" onClick={() => setStatusFilter('arrived')} style={{ cursor: 'pointer' }}>
                    <div className="inv-stat-content">
                        <h4>Ирсэн</h4>
                        <div className="inv-stat-value">{stats.arrived}</div>
                    </div>
                    <div className="inv-stat-icon" style={{ background: 'rgba(108,92,231,0.1)', color: '#6c5ce7' }}><Truck size={24} /></div>
                </div>
                <div className="inv-stat-card" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer' }}>
                    <div className="inv-stat-content">
                        <h4>Биелсэн</h4>
                        <div className="inv-stat-value">{stats.fulfilled}</div>
                    </div>
                    <div className="inv-stat-icon icon-green"><CheckCircle2 size={24} /></div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="inv-toolbar">
                <div className="inv-search-wrap">
                    <Search size={18} className="inv-search-icon" />
                    <input className="inv-search-input" placeholder="Захиалга, харилцагчаар хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
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
                </select>
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
                                className={`sourcing-order-card ${s}`}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="sourcing-card-left">
                                    <div className="sourcing-card-avatar" style={{ background: statusInfo.color + '18', color: statusInfo.color }}>
                                        <StatusIcon size={18} />
                                    </div>
                                    <div className="sourcing-card-info">
                                        <div className="sourcing-card-top">
                                            <span className="sourcing-card-order">#{(order.orderNumber || order.id.slice(0, 6)).toUpperCase()}</span>
                                            <span className="sourcing-card-date">{order.createdAt ? format(order.createdAt, 'MM/dd HH:mm') : '—'}</span>
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
    const [sourceUrl, setSourceUrl] = useState(order.sourcing?.sourceUrl || '');
    const [sourceCost, setSourceCost] = useState(order.sourcing?.sourceCost || 0);
    const [notes, setNotes] = useState(order.sourcing?.notes || '');
    const [itemsState, setItemsState] = useState<Record<string, SourcingItem>>(() => {
        const existing = order.sourcing?.items || {};
        const state: Record<string, SourcingItem> = {};
        order.items.forEach(it => {
            state[it.productId] = existing[it.productId] || { ordered: false };
        });
        return state;
    });
    const [statusOverride, setStatusOverride] = useState<SourcingStatus>(order.sourcing?.status || 'pending');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Settings
    const recipientName = settings?.recipientName || '';
    const recipientPhone = settings?.recipientPhone || '';
    const cargoAddress = settings?.cargoAddress || '';
    const shopPhone = settings?.shopPhone || '';
    
    // Dynamic cargo label template
    const labelTemplate = settings?.labelTemplate || '{shopPhone}-{date}-{customer}-{qty}ш';
    
    const totalQty = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const dateStr = order.createdAt ? format(order.createdAt, 'M/dd') : '';
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

    // Auto-calculate status based on items
    const computedStatus: SourcingStatus = (() => {
        if (statusOverride === 'arrived' || statusOverride === 'picked_up' || statusOverride === 'delivered' || statusOverride === 'fulfilled') return statusOverride;
        if (allItemsOrdered) return 'ordered';
        return 'pending';
    })();

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalStatus = computedStatus;
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
                sourceUrl,
                sourceCost,
                notes,
                updatedAt: Timestamp.now(),
            };
            await updateDoc(doc(db, 'businesses', businessId, 'orders', order.id), {
                sourcing: sourcingData,
            });
            const updated: SourcingOrder = {
                ...order,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sourcing: { ...sourcingData, sourcedBy: '', updatedAt: new Date() } as any,
            };
            onUpdate(updated);
            toast.success('Хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
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
                            <div className="sourcing-copy-block">
                                <div className="sourcing-copy-label">📋 Хүлээн авагч</div>
                                <div className="sourcing-copy-value">{recipientText}</div>
                                <button className="sourcing-copy-btn" onClick={() => handleCopy(recipientText, 'recipient')}>
                                    {copiedField === 'recipient' ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedField === 'recipient' ? 'Хуулсан!' : 'Хуулах'}
                                </button>
                            </div>
                            <div className="sourcing-copy-block">
                                <div className="sourcing-copy-label">📋 Хаяг (карго шошго)</div>
                                <div className="sourcing-copy-value">{addressText}</div>
                                <button className="sourcing-copy-btn" onClick={() => handleCopy(addressText, 'address')}>
                                    {copiedField === 'address' ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedField === 'address' ? 'Хуулсан!' : 'Хуулах'}
                                </button>
                            </div>
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
                                return (
                                    <label key={item.productId} className={`sourcing-item-row ${isOrdered ? 'ordered' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isOrdered}
                                            onChange={() => toggleItem(item.productId)}
                                            style={{ accentColor: 'var(--primary)', width: 18, height: 18 }}
                                        />
                                        <div className="sourcing-item-info">
                                            <span className="sourcing-item-name">{item.name}</span>
                                            <span className="sourcing-item-qty">x{item.quantity || 1}</span>
                                        </div>
                                        <span className="sourcing-item-price">₮{(item.price || 0).toLocaleString()}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status + Tracking */}
                    <div className="sourcing-tracking-section">
                        <div className="sourcing-section-title">Статус & Tracking</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Статус</label>
                                <div className="sourcing-select-wrap">
                                    <select
                                        className="input select"
                                        value={statusOverride}
                                        onChange={e => setStatusOverride(e.target.value as SourcingStatus)}
                                        style={{ height: 44 }}
                                        disabled={!hasPermission('sourcing.update_status')}
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
                                <label className="input-label">Tracking №</label>
                                <input className="input" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Илгээмжийн дугаар" style={{ height: 44 }} disabled={!hasPermission('sourcing.add_tracking')} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Source URL</label>
                                <input className="input" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="Taobao/1688 link" style={{ height: 44 }} disabled={!hasPermission('sourcing.add_tracking')} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Бодит өртөг (¥)</label>
                                <input className="input" type="number" value={sourceCost || ''} onChange={e => setSourceCost(Number(e.target.value))} placeholder="0" style={{ height: 44 }} disabled={!hasPermission('sourcing.view_cost')} />
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
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving || !hasPermission('sourcing.update_status')}>
                        {saving ? 'Хадгалж байна...' : '💾 Хадгалах'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
