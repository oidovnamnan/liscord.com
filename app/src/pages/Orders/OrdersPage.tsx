import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Plus, Search, MoreVertical, Loader2, X, User, Package, CreditCard, Check } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { orderService, productService, cargoService } from '../../services/db';
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

    // Data lists
    const [allProducts, setAllProducts] = useState<any[]>([]);

    // Customer Info
    const [customer, setCustomer] = useState('');
    const [phone, setPhone] = useState('');
    const [socialHandle, setSocialHandle] = useState('');
    const [source, setSource] = useState('instagram');
    const [address, setAddress] = useState('');

    // Item Search & Details
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [manualItemName, setManualItemName] = useState('');

    const [quantity, setQuantity] = useState(1);
    const [color, setColor] = useState('');
    const [size, setSize] = useState('');
    const [unitPrice, setUnitPrice] = useState('0');

    // Fees & Totals
    const [deliveryFee, setDeliveryFee] = useState('0');
    const [cargoFee, setCargoFee] = useState('0');
    const [cargoIncluded, setCargoIncluded] = useState(false);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<any>('bank');
    const [paidAmount, setPaidAmount] = useState('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!business?.id) return;

        // Fetch products
        const unsubProducts = productService.subscribeProducts(business.id, (data) => {
            setAllProducts(data);
        });

        // Fetch cargo types
        const unsubCargo = cargoService.subscribeCargoTypes(business.id, (_data) => {
            // No longer storing cargo types list since we auto-fill from product
        });

        return () => {
            unsubProducts();
            unsubCargo();
        };
    }, [business?.id]);

    const filteredProducts = searchQuery.length > 0
        ? allProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5)
        : [];

    const handleSelectProduct = (p: any) => {
        setSelectedProduct(p);
        setUnitPrice(p.pricing.salePrice.toString());
        setSearchQuery('');
        setShowResults(false);

        // Auto-fill cargo fee if available
        if (p.cargoFee) {
            setCargoFee(p.cargoFee.amount.toString());
            setCargoIncluded(p.cargoFee.isIncluded);
        }
    };

    const calculateTotal = () => {
        const itemTotal = Number(unitPrice) * quantity;
        const total = itemTotal + Number(deliveryFee) + (cargoIncluded ? 0 : Number(cargoFee));
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !business || !user) return;
        if (!selectedProduct && !manualItemName) return;

        setLoading(true);
        try {
            const finalTotal = calculateTotal();
            const paid = Number(paidAmount);

            const variantParts = [color, size].filter(Boolean).join(' / ');
            const finalItemName = selectedProduct ? selectedProduct.name : manualItemName;

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
                deliveryAddress: address,
                items: [{
                    productId: selectedProduct?.id || null,
                    name: finalItemName,
                    variant: variantParts,
                    quantity: quantity,
                    unitPrice: Number(unitPrice),
                    costPrice: selectedProduct?.pricing?.costPrice || 0,
                    totalPrice: Number(unitPrice) * quantity,
                }],
                financials: {
                    subtotal: Number(unitPrice) * quantity,
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
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                <div className="modal-header">
                    <h2>Шинэ захиалга — {nextNumber}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* SECTION 1: CUSTOMER */}
                        <div className="modal-section">
                            <div className="modal-section-title"><User size={14} /> Харилцагчийн мэдээлэл</div>
                            <div className="input-group">
                                <label className="input-label">Нэр <span className="required">*</span></label>
                                <input className="input" placeholder="Болд" value={customer} onChange={e => setCustomer(e.target.value)} autoFocus required />
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Утасны дугаар</label>
                                    <input className="input" placeholder="8811-XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Сошиал хаяг (IG/FB)</label>
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
                                    <label className="input-label">Хүргэлтийн хаяг</label>
                                    <input className="input" placeholder="БЗД, 26-р хороо..." value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: ITEMS */}
                        <div className="modal-section">
                            <div className="modal-section-title"><Package size={14} /> Бараа / Үйлчилгээ</div>

                            {!selectedProduct ? (
                                <div className="product-search-container">
                                    <div className="input-group">
                                        <label className="input-label">Бараа хайх (Нэр эсвэл SKU)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                className="input"
                                                style={{ paddingLeft: 36 }}
                                                placeholder="Барааны нэр бичнэ үү..."
                                                value={searchQuery}
                                                onChange={e => {
                                                    setSearchQuery(e.target.value);
                                                    setShowResults(true);
                                                }}
                                                onFocus={() => setShowResults(true)}
                                            />
                                        </div>
                                    </div>

                                    {showResults && filteredProducts.length > 0 && (
                                        <div className="product-search-results">
                                            {filteredProducts.map(p => (
                                                <div key={p.id} className="product-search-item" onClick={() => handleSelectProduct(p)}>
                                                    <img src={p.images?.[0] || 'https://via.placeholder.com/40'} className="product-search-img" alt="" />
                                                    <div className="product-search-info">
                                                        <span className="product-search-name">{p.name}</span>
                                                        <span className="product-search-sku">{p.sku} • {p.categoryName}</span>
                                                    </div>
                                                    <div className="product-search-price">{fmt(p.pricing.salePrice)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && filteredProducts.length === 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div className="input-group">
                                                <label className="input-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Олдсонгүй, гараар оруулах:</label>
                                                <input className="input" placeholder="Барааны нэр" value={manualItemName} onChange={e => setManualItemName(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="selected-product-preview">
                                    <img src={selectedProduct.images?.[0] || 'https://via.placeholder.com/40'} className="product-search-img" alt="" />
                                    <div className="product-search-info">
                                        <span className="product-search-name">{selectedProduct.name}</span>
                                        <span className="product-search-sku">{selectedProduct.sku}</span>
                                    </div>
                                    <div className="product-search-price">{fmt(Number(unitPrice))}</div>
                                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedProduct(null)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Тоо ширхэг</label>
                                    <input className="input" type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Өнгө</label>
                                    <input className="input" placeholder="Хар" value={color} onChange={e => setColor(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Хэмжээ</label>
                                    <input className="input" placeholder="XL" value={size} onChange={e => setSize(e.target.value)} />
                                </div>
                            </div>

                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Нэгж үнэ</label>
                                    <input className="input" type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Нийт бараа</label>
                                    <div className="input" style={{ background: 'var(--bg-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        {fmt(Number(unitPrice) * quantity)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: DELIVERY & CARGO */}
                        <div className="modal-section" style={{ background: 'var(--primary-light)' }}>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Хүргэлтийн төлбөр</label>
                                    <input className="input" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <label className="input-label" style={{ margin: 0 }}>Каргоны дүн</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <input type="checkbox" id="cargoInc" checked={cargoIncluded} onChange={e => setCargoIncluded(e.target.checked)} />
                                            <label htmlFor="cargoInc" style={{ fontSize: '0.7rem', cursor: 'pointer' }}>Орсон</label>
                                        </div>
                                    </div>
                                    <input className="input" type="number" disabled={cargoIncluded} value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4 }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Нийт төлөх дүн:</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {fmt(calculateTotal())}
                                </span>
                            </div>
                        </div>

                        {/* SECTION 4: PAYMENT */}
                        <div className="modal-section" style={{ borderColor: 'var(--primary)' }}>
                            <div className="modal-section-title"><CreditCard size={14} /> Төлбөр бүртгэх</div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Төлбөрийн хэлбэр</label>
                                    <select className="input select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="bank">Дансаар (Хаан/Голомт)</option>
                                        <option value="qpay">QPay</option>
                                        <option value="cash">Бэлнээр</option>
                                        <option value="card">Картаар</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Төлсөн дүн</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="input" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setPaidAmount(calculateTotal().toString())}
                                            style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                        >
                                            <Check size={14} /> Бүрэн
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !customer || (!selectedProduct && !manualItemName)}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Захиалга үүсгэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
