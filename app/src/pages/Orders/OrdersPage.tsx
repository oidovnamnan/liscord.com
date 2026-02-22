import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Plus, Search, MoreVertical, Loader2 } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { orderService } from '../../services/db';
import { OrderDetailModal } from './OrderDetailModal';
import type { Order, OrderStatus } from '../../types';
import './OrdersPage.css';

const statusConfig: Record<OrderStatus, { label: string; cls: string }> = {
    new: { label: 'Шинэ', cls: 'badge-new' },
    confirmed: { label: 'Баталсан', cls: 'badge-confirmed' },
    preparing: { label: 'Бэлтгэж буй', cls: 'badge-preparing' },
    ready: { label: 'Бэлэн', cls: 'badge-preparing' },
    shipping: { label: 'Хүргэлтэнд', cls: 'badge-shipping' },
    delivered: { label: 'Хүргэгдсэн', cls: 'badge-delivered' },
    completed: { label: 'Дууссан', cls: 'badge-delivered' },
    cancelled: { label: 'Цуцалсан', cls: 'badge-cancelled' },
};

const paymentConfig: Record<string, { label: string; cls: string }> = {
    unpaid: { label: 'Төлөгдөөгүй', cls: 'badge-unpaid' },
    partial: { label: 'Хэсэгчлэн', cls: 'badge-partial' },
    paid: { label: 'Төлөгдсөн', cls: 'badge-paid' },
};

const sourceIcons: Record<string, string> = {
    facebook: '🔵',
    instagram: '📸',
    tiktok: '🎵',
    website: '🌐',
    phone: '📞',
    pos: '🏪',
    other: '📦',
};

function fmt(n: number) {
    return '₮' + n.toLocaleString('mn-MN');
}

export function OrdersPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);
        const unsubscribe = orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    const filtered = orders.filter(o => {
        const matchSearch = !search ||
            o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.phone.includes(search);
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <>
            <Header
                title="Захиалга"
                subtitle={loading ? 'Уншиж байна...' : `Нийт ${orders.length} захиалга`}
                action={{ label: 'Шинэ захиалга', onClick: () => setShowCreate(true) }}
            />
            <div className="page">
                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input
                            className="input orders-search-input"
                            placeholder="Захиалга, нэр, утас хайх..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="orders-filters">
                        <select
                            className="input select orders-filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Бүх статус</option>
                            {Object.entries(statusConfig).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="orders-status-bar">
                    {['all', 'new', 'confirmed', 'preparing', 'shipping', 'delivered'].map(s => {
                        const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
                        const label = s === 'all' ? 'Бүгд' : statusConfig[s as OrderStatus]?.label;
                        return (
                            <button
                                key={s}
                                className={`orders-status-chip ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                            >
                                {label} <span className="orders-status-count">{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="orders-list stagger-children">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={32} className="animate-spin" />
                            <p>Захиалга ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>Захиалга олдсонгүй</h3>
                            <p>Хайлтын нөхцөлөө өөрчилнө үү</p>
                        </div>
                    ) : (
                        filtered.map(order => (
                            <div key={order.id} className="order-card card card-clickable" onClick={() => setSelectedOrder(order)}>
                                <div className="order-card-top">
                                    <div className="order-card-left">
                                        <span className="order-number">#{order.orderNumber}</span>
                                        <span className={`badge ${statusConfig[order.status]?.cls}`}>
                                            {statusConfig[order.status]?.label}
                                        </span>
                                        {order.source && (
                                            <span className="order-source-icon" title={order.source}>
                                                {sourceIcons[order.source] || '📦'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="order-card-right">
                                        <span className="order-date">
                                            {order.createdAt instanceof Date
                                                ? order.createdAt.toLocaleDateString('mn-MN')
                                                : 'Саяхан'}
                                        </span>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); /* context menu later */ }}>
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="order-card-body">
                                    <div className="order-customer">
                                        <strong>{order.customer.name}</strong>
                                        <span className="order-phone">{order.customer.phone}</span>
                                        {order.customer.socialHandle && (
                                            <span className="order-social-handle">@{order.customer.socialHandle}</span>
                                        )}
                                    </div>
                                    <div className="order-items">
                                        {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                                    </div>
                                </div>
                                <div className="order-card-bottom">
                                    <div className="order-financials">
                                        <div className="order-total">{fmt(order.financials.totalAmount)}</div>
                                        <span className={`badge ${paymentConfig[order.paymentStatus]?.cls}`}>
                                            {paymentConfig[order.paymentStatus]?.label}
                                        </span>
                                    </div>
                                    <div className="order-assignee">
                                        <div className="order-assignee-avatar">
                                            {order.assignedToName?.charAt(0) || '?'}
                                        </div>
                                        <span>{order.assignedToName || 'Хувиарлаагүй'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}

            {showCreate && (
                <CreateOrderModal
                    onClose={() => setShowCreate(false)}
                    nextNumber={`${business?.settings.orderPrefix || 'ORD'}-${String((business?.settings.orderCounter || 0) + 1).padStart(4, '0')}`}
                />
            )}
        </>
    );
}

function CreateOrderModal({ onClose, nextNumber }: {
    onClose: () => void;
    nextNumber: string;
}) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [customer, setCustomer] = useState('');
    const [phone, setPhone] = useState('');
    const [socialHandle, setSocialHandle] = useState('');
    const [source, setSource] = useState('instagram');
    const [itemStr, setItemStr] = useState('');
    const [total, setTotal] = useState('');
    const [deliveryFee, setDeliveryFee] = useState('0');
    const [cargoFee, setCargoFee] = useState('0');
    const [cargoIncluded, setCargoIncluded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<any>('bank');
    const [paidAmount, setPaidAmount] = useState('0');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !total || !business || !user) return;

        setLoading(true);
        try {
            const finalTotal = Number(total) + Number(deliveryFee) + (cargoIncluded ? 0 : Number(cargoFee));
            const paid = Number(paidAmount);

            await orderService.createOrder(business.id, {
                orderNumber: nextNumber,
                status: 'new',
                paymentStatus: paid >= finalTotal ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
                customer: {
                    id: null,
                    name: customer,
                    phone: phone,
                    socialHandle: socialHandle || undefined
                },
                source: source as any,
                items: [{
                    productId: null,
                    name: itemStr || 'Бараа',
                    variant: '',
                    quantity: 1,
                    unitPrice: Number(total),
                    costPrice: 0,
                    totalPrice: Number(total),
                }],
                financials: {
                    subtotal: Number(total),
                    discountType: 'fixed',
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: Number(deliveryFee),
                    cargoFee: Number(cargoFee),
                    cargoIncluded: cargoIncluded,
                    totalAmount: finalTotal,
                    payments: paid > 0 ? [{
                        id: crypto.randomUUID(),
                        amount: paid,
                        method: paymentMethod,
                        note: 'Урьдчилгаа төлбөр',
                        paidAt: new Date(),
                        recordedBy: user.uid
                    }] : [],
                    paidAmount: paid,
                    balanceDue: finalTotal - paid,
                },
                createdBy: user.uid,
                createdByName: user.displayName,
                isDeleted: false,
                notes: '',
                internalNotes: '',
                deliveryAddress: '',
                statusHistory: [],
                tags: []
            });
            onClose();
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                    <h2>Шинэ захиалга — #{nextNumber}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Харилцагчийн нэр <span className="required">*</span></label>
                            <input className="input" placeholder="Болд" value={customer} onChange={e => setCustomer(e.target.value)} autoFocus required />
                        </div>

                        <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Утасны дугаар</label>
                                <input className="input" placeholder="8811-XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Сошиал хаяг</label>
                                <input className="input" placeholder="@username" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Эх сурвалж</label>
                                <select className="input select" value={source} onChange={e => setSource(e.target.value)}>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="phone">Утас</option>
                                    <option value="other">Бусад</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Бараа / Тайлбар</label>
                                <input className="input" placeholder="Барааны нэр" value={itemStr} onChange={e => setItemStr(e.target.value)} />
                            </div>
                        </div>

                        <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Барааны дүн <span className="required">*</span></label>
                                <input className="input" type="number" placeholder="0" value={total} onChange={e => setTotal(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хүргэлт</label>
                                <input className="input" type="number" placeholder="0" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                            </div>
                        </div>

                        <div className="cargo-management-section" style={{ background: 'var(--bg-soft)', padding: 12, borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label className="input-label" style={{ margin: 0 }}>Каргоны тооцоолол</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" id="cargoIncluded" checked={cargoIncluded} onChange={e => setCargoIncluded(e.target.checked)} />
                                    <label htmlFor="cargoIncluded" style={{ fontSize: '0.8rem' }}>Үнэдээ орсон</label>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Каргоны дүн</label>
                                    <input className="input" type="number" placeholder="0" value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Нийт дүн</label>
                                    <div className="input" style={{ background: 'var(--bg-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        {fmt(Number(total) + Number(deliveryFee) + (cargoIncluded ? 0 : Number(cargoFee)))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="payment-entry-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                            <label className="input-label">Төлбөр бүртгэх</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Төрөл</label>
                                    <select className="input select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="bank">Дансаар (Хаан/Голомт)</option>
                                        <option value="qpay">QPay</option>
                                        <option value="cash">Бэлнээр</option>
                                        <option value="card">Картаар</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Төлсөн дүн</label>
                                    <input className="input" type="number" placeholder="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading || !customer || !total}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Захиалга үүсгэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
