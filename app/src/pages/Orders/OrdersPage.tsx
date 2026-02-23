import { useState, useEffect, useRef } from 'react';
import { Header } from '../../components/layout/Header';
import { Plus, Search, MoreVertical, Loader2, X, User, Package, CreditCard, Trash2, CheckSquare } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import {
    productService,
    orderService,
    sourceService,
    customerService,
    orderStatusService
} from '../../services/db';
import type { OrderSource, SocialAccount, OrderStatusConfig } from '../../types';
import { OrderDetailModal } from './OrderDetailModal';
import type { Order } from '../../types';
import './OrdersPage.css';


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
    const [statusFilter, setStatusFilter] = useState<string>('new');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { user } = useAuthStore();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!business?.id) return;

        const unOrder = orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
            setLoading(false);
        });

        const unStatus = orderStatusService.subscribeStatuses(business.id, (data) => {
            setStatuses(data);
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            unOrder();
            unStatus();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [business?.id]);

    const filtered = orders.filter(o => {
        const matchSearch = !search ||
            o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.phone.includes(search);

        // If searching, show everything matching the search
        if (search) return matchSearch;

        // Otherwise, filter by status and deletion state
        if (statusFilter === 'cancelled') {
            return matchSearch && o.isDeleted;
        }

        const isDeletedMatch = statusFilter === 'all' || !o.isDeleted;
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;

        return matchSearch && matchStatus && isDeletedMatch;
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
                            {statuses.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="orders-status-bar">
                    <button
                        className={`orders-status-chip ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Бүгд <span className="orders-status-count">{orders.length}</span>
                    </button>
                    {statuses.map(s => {
                        const count = s.id === 'cancelled'
                            ? orders.filter(o => o.isDeleted).length
                            : orders.filter(o => o.status === s.id && !o.isDeleted).length;

                        return (
                            <button
                                key={s.id}
                                className={`orders-status-chip ${statusFilter === s.id ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s.id)}
                            >
                                {s.label} <span className="orders-status-count">{count}</span>
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
                            <div
                                key={order.id}
                                className={`order-card pro-layout ${order.isDeleted ? 'is-deleted' : ''} stagger-item`}
                                style={{
                                    '--status-color': order.isDeleted ? '#ef4444' : (statuses.find(s => s.id === order.status)?.color || '#3b82f6')
                                } as React.CSSProperties}
                                onClick={() => setSelectedOrder(order)}
                            >
                                {/* Status Indicator (Slim) */}
                                <div className="pro-status-border"></div>

                                <div className="order-card-inner">
                                    {/* Header Row: ID, Date, Actions */}
                                    <div className="pro-card-header">
                                        <div className="header-id-group">
                                            <span className="order-id">#{order.orderNumber}</span>
                                            {order.isDeleted ? (
                                                <span className="pro-badge status-cancelled">
                                                    Цуцлагдсан
                                                </span>
                                            ) : (
                                                <span
                                                    className="pro-badge"
                                                    style={{
                                                        background: statuses.find(s => s.id === order.status)?.color + '20',
                                                        color: statuses.find(s => s.id === order.status)?.color,
                                                        border: `1px solid ${statuses.find(s => s.id === order.status)?.color}40`
                                                    }}
                                                >
                                                    {statuses.find(s => s.id === order.status)?.label || order.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="header-actions-group">
                                            <span className="pro-date">
                                                {order.createdAt instanceof Date
                                                    ? order.createdAt.toLocaleDateString('mn-MN')
                                                    : 'Саяхан'}
                                            </span>
                                            <div className="order-actions-dropdown" ref={openMenuId === order.id ? menuRef : null}>
                                                <button
                                                    className={`pro-btn-ghost btn-icon ${openMenuId === order.id ? 'active' : ''}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === order.id ? null : order.id);
                                                    }}
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                                {openMenuId === order.id && (
                                                    <div className="pro-dropdown-menu" onClick={e => e.stopPropagation()}>
                                                        <button className="pro-dropdown-item" onClick={() => { setSelectedOrder(order); setOpenMenuId(null); }}>
                                                            <Package size={14} /> Дэлгэрэнгүй
                                                        </button>
                                                        <button className="pro-dropdown-item" onClick={() => { /* Status change logic */ setOpenMenuId(null); }}>
                                                            <CheckSquare size={14} /> Статус солих
                                                        </button>
                                                        <hr />
                                                        <button
                                                            className="pro-dropdown-item text-danger"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteOrderId(order.id);
                                                                setShowDeleteModal(true);
                                                                setOpenMenuId(null);
                                                            }}
                                                        >
                                                            <Trash2 size={14} /> Устгах
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content: Product(s) Focus */}
                                    <div className="pro-card-main">
                                        <div className="pro-product-listing">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="pro-item-row">
                                                    <div className="pro-item-thumb">
                                                        {item.image ? (
                                                            <img src={item.image} alt="" />
                                                        ) : (
                                                            <Package size={16} />
                                                        )}
                                                    </div>
                                                    <div className="pro-item-info">
                                                        <span className="pro-item-name">{item.name}</span>
                                                        <div className="pro-item-meta">
                                                            {item.variant && <span className="pro-variant">{item.variant}</span>}
                                                            <span className="pro-qty">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="pro-item-price">
                                                        {fmt(item.totalPrice)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interaction Bar: Customer & Assignee */}
                                    <div className="pro-card-meta-bar">
                                        <div className="pro-meta-item">
                                            <User size={12} className="meta-icon" />
                                            <span className="pro-customer-name">{order.customer.name}</span>
                                            {order.customer.phone && <span className="pro-customer-phone">{order.customer.phone}</span>}
                                        </div>
                                        <div className="pro-meta-divider"></div>
                                        <div className="pro-meta-item">
                                            <div className="pro-assignee-mark">
                                                {order.assignedToName?.charAt(0) || <User size={10} />}
                                            </div>
                                            <span className="pro-assignee-name">{order.assignedToName || 'Хувиарлаагүй'}</span>
                                        </div>
                                        {order.source && (
                                            <div className="pro-source-tag">
                                                {sourceIcons[order.source] || '📦'} {order.source}
                                            </div>
                                        )}
                                        <div className="pro-meta-divider"></div>
                                        <div className="pro-meta-item" title={`Үүсгэсэн: ${order.createdByName || 'Систем'}`}>
                                            <div className="pro-assignee-mark creator">
                                                {order.createdByName?.charAt(0) || '?'}
                                            </div>
                                            <span className="pro-assignee-name">{order.createdByName?.split(' ')[0] || 'Систем'}</span>
                                        </div>
                                    </div>

                                    {/* Footer: Financials Summary */}
                                    <div className="pro-card-footer">
                                        <div className="pro-financial-summary">
                                            <div className="pro-total-label">НИЙТ ДҮН</div>
                                            <div className="pro-total-value">{fmt(order.financials.totalAmount)}</div>
                                        </div>
                                        <div className="pro-payment-indicator">
                                            <span className={`pro-payment-badge ${order.paymentStatus}`}>
                                                <CreditCard size={12} /> {paymentConfig[order.paymentStatus]?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {order.isDeleted && order.cancelReason && (
                                    <div className="order-cancel-reason-hint" title={order.cancelReason}>
                                        🔒 {order.cancelReason}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div >

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    statuses={statuses}
                />
            )
            }

            {
                showDeleteModal && (
                    <div className="modal-overlay" style={{ zIndex: 3000 }}>
                        <div className="modal-content" style={{ maxWidth: 400 }}>
                            <div className="modal-header">
                                <h2 style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Trash2 size={24} /> Устгах баталгаажуулалт
                                </h2>
                                <button className="btn-icon" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); }}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 16 }}>
                                    Энэ захиалгыг устгах (идэвхгүй болгох) шалтгаанаа бичнэ үү. Тайлбаргүйгээр устгах боломжгүй.
                                </p>
                                <div className="input-group">
                                    <label className="input-label">Цуцлах шалтгаан *</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        placeholder="Жишээ: Харилцагч утсаа авахгүй байна, Буруу бараа..."
                                        value={deleteReason}
                                        onChange={e => setDeleteReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDeleteReason(''); }}>Болих</button>
                                <button
                                    className="btn btn-danger"
                                    disabled={!deleteReason.trim()}
                                    onClick={async () => {
                                        if (!deleteOrderId || !business?.id) return;
                                        try {
                                            await orderService.deleteOrder(business.id, deleteOrderId, deleteReason, user);
                                            setShowDeleteModal(false);
                                            setDeleteOrderId(null);
                                            setDeleteReason('');
                                        } catch (err) {
                                            alert('Устгахад алдаа гарлаа');
                                        }
                                    }}
                                >
                                    <Trash2 size={16} /> Тийм, устгах
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showCreate && (
                    <CreateOrderModal
                        onClose={() => setShowCreate(false)}
                        nextNumber={`${business?.settings.orderPrefix || 'ORD'}-${String((business?.settings.orderCounter || 0) + 1).padStart(4, '0')}`}
                        statuses={statuses}
                    />
                )
            }
        </>
    );
}

function CreateOrderModal({ onClose, nextNumber, statuses }: {
    onClose: () => void;
    nextNumber: string;
    statuses: OrderStatusConfig[];
}) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();

    // Data lists
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    // Customer Info
    const [customer, setCustomer] = useState('');
    const [phone, setPhone] = useState('');
    const [socialHandle, setSocialHandle] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [address, setAddress] = useState('');

    // Dynamic Data
    const [allSources, setAllSources] = useState<OrderSource[]>([]);
    const [allAccounts, setAllAccounts] = useState<SocialAccount[]>([]);

    // Item Search & Details
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [manualItemName, setManualItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [color, setColor] = useState('');
    const [size, setSize] = useState('');
    const [unitPrice, setUnitPrice] = useState('0');
    const [itemCargoIncluded, setItemCargoIncluded] = useState(false);

    // List of added items
    const [items, setItems] = useState<any[]>([]);

    // Fees & Totals
    const [deliveryFee, setDeliveryFee] = useState('0');
    const [payCargoNow, setPayCargoNow] = useState(true);

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

        // Fetch sources
        const unsubSources = sourceService.subscribeSources(business.id, (data) => {
            setAllSources(data);
            if (data.length > 0 && !sourceId) {
                // Auto-select first source (or default if we had that in business settings)
                setSourceId(data[0].id);
            }
        });

        // Fetch all accounts for this business
        const unsubAccounts = sourceService.subscribeAccounts(business.id, null, (data) => {
            setAllAccounts(data);
        });

        // Fetch customers for autocomplete
        const unsubCustomers = customerService.subscribeCustomers(business.id, (data) => {
            setAllCustomers(data);
        });

        return () => {
            unsubProducts();
            unsubSources();
            unsubAccounts();
            unsubCustomers();
        };
    }, [business?.id, sourceId]); // Added sourceId to dependencies to re-evaluate auto-selection if sourceId changes

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
            setItemCargoIncluded(p.cargoFee.isIncluded);
        } else {
            setItemCargoIncluded(false);
        }
    };

    const handleAddItem = () => {
        const name = selectedProduct ? selectedProduct.name : manualItemName;
        if (!name) return;

        const variant = [color, size].filter(Boolean).join(' / ');
        const unitPriceNum = Number(unitPrice);
        const unitCargoFee = !itemCargoIncluded && selectedProduct?.cargoFee ? selectedProduct.cargoFee.amount : 0;

        // Check if item with same identity already exists in the list
        const existingItemIndex = items.findIndex(item =>
            item.productId === (selectedProduct?.id || null) &&
            item.name === name &&
            item.variant === variant &&
            item.unitPrice === unitPriceNum &&
            item.unitCargoFee === unitCargoFee
        );

        if (existingItemIndex > -1) {
            // MERGE: Update quantity of existing item
            const updatedItems = [...items];
            const existingItem = updatedItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;

            updatedItems[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                totalPrice: newQuantity * unitPriceNum
            };
            setItems(updatedItems);
        } else {
            // ADD NEW: Standard addition
            const newItem = {
                productId: selectedProduct?.id || null,
                name: name,
                variant: variant,
                quantity: quantity,
                unitPrice: unitPriceNum,
                costPrice: selectedProduct?.pricing?.costPrice || 0,
                totalPrice: unitPriceNum * quantity,
                unitCargoFee: unitCargoFee,
                image: selectedProduct?.images?.[0] || null
            };
            setItems([...items, newItem]);
        }

        // Reset item inputs
        setSelectedProduct(null);
        setManualItemName('');
        setQuantity(1);
        setColor('');
        setSize('');
        setUnitPrice('0');
        setSearchQuery('');
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateItemTotal = () => items.reduce((sum, item) => sum + item.totalPrice, 0);
    const calculateCargoTotal = () => items.reduce((sum, item) => sum + (item.unitCargoFee * item.quantity), 0);

    const calculateTotal = () => {
        const itemTotal = calculateItemTotal();
        const totalCargo = calculateCargoTotal();
        const total = itemTotal + Number(deliveryFee) + (payCargoNow ? totalCargo : 0);
        return total;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !business || !user) return;
        if (items.length === 0) return;

        setLoading(true);
        try {
            const finalTotal = calculateTotal();
            const paid = Number(paidAmount);
            const cargoTotal = calculateCargoTotal();

            await orderService.createOrder(business.id, {
                orderNumber: nextNumber,
                status: statuses[0]?.id || 'new',
                paymentStatus: paid >= finalTotal ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
                customer: {
                    id: null,
                    name: customer,
                    phone: phone,
                    socialHandle: socialHandle || undefined
                },
                sourceId: sourceId || undefined,
                accountId: accountId || undefined,
                deliveryAddress: address,
                items: items,
                financials: {
                    subtotal: calculateItemTotal(),
                    discountType: 'fixed',
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: Number(deliveryFee),
                    cargoFee: cargoTotal,
                    cargoIncluded: items.every(i => i.unitCargoFee === 0),
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
                notes: payCargoNow ? '' : 'Карго ирэхээр төлнө',
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
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="8811-XXXX"
                                        value={phone}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPhone(val);
                                            if (val.length >= 4) {
                                                const matches = allCustomers.filter(c =>
                                                    c.phone?.includes(val) ||
                                                    c.name?.toLowerCase().includes(val.toLowerCase())
                                                ).slice(0, 5);
                                                setFilteredCustomers(matches);
                                                setShowCustomerResults(matches.length > 0);
                                            } else {
                                                setShowCustomerResults(false);
                                            }
                                        }}
                                        required
                                        onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                                    />
                                    {showCustomerResults && (
                                        <div className="product-results" style={{ top: '100%', left: 0, right: 0, zIndex: 100, marginBottom: 0 }}>
                                            {filteredCustomers.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="product-result-item"
                                                    onClick={() => {
                                                        setCustomer(c.name || '');
                                                        setPhone(c.phone || '');
                                                        setSocialHandle(c.socialHandle || '');
                                                        if (c.sourceId) setSourceId(c.sourceId);
                                                        if (c.accountId) setAccountId(c.accountId);
                                                        if (c.address) setAddress(c.address);
                                                        setShowCustomerResults(false);
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone} {c.socialHandle && `• ${c.socialHandle}`}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Сошиал хаяг (IG/FB) <span className="required">*</span></label>
                                    <input className="input" placeholder="@username" value={socialHandle} onChange={e => setSocialHandle(e.target.value)} required />
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Харилцагчийн нэр</label>
                                    <input className="input" placeholder="Жишээ: Болд" value={customer} onChange={e => setCustomer(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Эх сурвалж</label>
                                    <select className="input select" value={sourceId} onChange={e => { setSourceId(e.target.value); setAccountId(''); }}>
                                        <option value="">Сонгох...</option>
                                        {allSources.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Пэйж / Хаяг</label>
                                    <select className="input select" value={accountId} onChange={e => setAccountId(e.target.value)} disabled={!sourceId}>
                                        <option value="">Сонгох...</option>
                                        {allAccounts.filter(a => a.sourceId === sourceId).map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хүргэлтийн хаяг</label>
                                <input className="input" placeholder="Жишээ: БЗД, 26-р хороо, Хүннү 2222, 101-102 тоот" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>
                        </div>

                        {/* SECTION 2: ITEMS LIST */}
                        <div className="modal-section">
                            <div className="modal-section-title"><Package size={14} /> Сонгосон бараанууд ({items.length})</div>

                            {items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {items.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: 10,
                                            background: 'var(--bg-soft)',
                                            borderRadius: 8,
                                            border: '1px solid var(--border-primary)'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {item.variant} • {fmt(item.unitPrice)} x {item.quantity}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(item.totalPrice)}</div>
                                            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItem(idx)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 10px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                        Нийт бараа: {fmt(calculateItemTotal())}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Захиалгад бараа нэмээгүй байна.
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: ADD NEW ITEM */}
                        <div className="modal-section" style={{ border: '1px dashed var(--primary)', background: 'var(--primary-light)' }}>
                            <div className="modal-section-title" style={{ color: 'var(--primary)' }}><Plus size={14} /> Бараа нэмэх</div>

                            {!selectedProduct ? (
                                <div className="product-search-container">
                                    <div className="input-group">
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                className="input"
                                                style={{ paddingLeft: 36 }}
                                                placeholder="Барааны нэр эсвэл SKU бичнэ үү..."
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
                                                        <span className="product-search-sku">{p.sku}</span>
                                                    </div>
                                                    <div className="product-search-price">{fmt(p.pricing.salePrice)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && filteredProducts.length === 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div className="input-group">
                                                <input className="input" placeholder="Барааны нэр" value={manualItemName} onChange={e => setManualItemName(e.target.value)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="selected-product-preview" style={{ background: 'white' }}>
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

                            {(selectedProduct || manualItemName) && (
                                <>
                                    <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <label className="input-label" style={{ margin: 0 }}>Нэгж үнэ</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <input type="checkbox" id="itemCargoInc" checked={itemCargoIncluded} onChange={e => setItemCargoIncluded(e.target.checked)} />
                                                    <label htmlFor="itemCargoInc" style={{ fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Карго орсон</label>
                                                </div>
                                            </div>
                                            <input className="input" type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                onClick={handleAddItem}
                                            >
                                                Жагсаалтанд нэмэх
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SECTION 4: DELIVERY & CARGO */}
                        <div className="modal-section" style={{ background: 'rgba(var(--primary-rgb), 0.05)' }}>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="input-label">Хүргэлтийн төлбөр</label>
                                    <input className="input" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Нийт карго ({calculateCargoTotal() > 0 ? "Ирж яваа" : "Үнэдээ орсон"})</label>
                                    <div className="input" style={{ background: 'var(--bg-soft)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                        {fmt(calculateCargoTotal())}
                                    </div>
                                </div>
                            </div>

                            {calculateCargoTotal() > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                    <input type="checkbox" id="payCargoNow" checked={payCargoNow} onChange={e => setPayCargoNow(e.target.checked)} />
                                    <label htmlFor="payCargoNow" style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>Каргоныг одоо төлөх (Бусад тохиолдолд ирэхээр нь төлнө)</label>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--border-primary)' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Нийт захиалгын дүн:</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {fmt(calculateTotal())}
                                </span>
                            </div>
                        </div>

                        {/* SECTION 5: PAYMENT */}
                        <div className="modal-section" style={{ borderColor: 'var(--primary)', borderStyle: 'dashed' }}>
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
                                    <label className="input-label">Төлсөн дүн (Урьдчилгаа)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input className="input" type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setPaidAmount((calculateTotal() * 0.5).toString())}
                                                style={{ fontSize: '0.65rem', padding: '2px 8px', height: 24 }}
                                            >
                                                50%
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setPaidAmount(calculateTotal().toString())}
                                                style={{ fontSize: '0.65rem', padding: '2px 8px', height: 24 }}
                                            >
                                                100%
                                            </button>
                                            <div style={{ flex: 1 }}></div>
                                            {Number(paidAmount) < calculateTotal() && Number(paidAmount) > 0 && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                    Үлдэгдэл: {fmt(calculateTotal() - Number(paidAmount))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !customer || items.length === 0}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Захиалга үүсгэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
