import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { ArrowLeft, Package, Clock, Undo2, X, Camera, Loader2 } from 'lucide-react';
import type { Business, Order, ReturnType, ReturnReason } from '../../types';
import { toast } from 'react-hot-toast';
import './StoreMyOrders.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDate(val: any): Date {
    if (!val) return new Date();
    if (val instanceof Timestamp) return val.toDate();
    if (val?.seconds) return new Date(val.seconds * 1000);
    if (val?.toDate) return val.toDate();
    return new Date(val);
}

const PAYMENT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: 'Төлсөн', bg: '#d1fae5', color: '#065f46' },
    unpaid: { label: 'Төлөөгүй', bg: '#fef3c7', color: '#92400e' },
    partial: { label: 'Хэсэгчлэн', bg: '#dbeafe', color: '#1e40af' },
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
    new: { label: 'Шинэ', bg: '#dbeafe', color: '#1e40af' },
    confirmed: { label: 'Баталгаажсан', bg: '#ede9fe', color: '#6d28d9' },
    sourced: { label: 'Захиалагдсан', bg: '#fef3c7', color: '#92400e' },
    arrived: { label: 'Бараа ирсэн', bg: '#cffafe', color: '#155e75' },
    fulfilled: { label: 'Биелсэн', bg: '#d1fae5', color: '#065f46' },
    returned: { label: 'Буцаасан', bg: '#ffedd5', color: '#c2410c' },
    cancelled: { label: 'Цуцлагдсан', bg: '#fee2e2', color: '#dc2626' },
    // Legacy
    completed: { label: 'Биелсэн', bg: '#d1fae5', color: '#065f46' },
    preparing: { label: 'Бэлтгэж байна', bg: '#fef3c7', color: '#92400e' },
    delivered: { label: 'Хүргэгдсэн', bg: '#d1fae5', color: '#065f46' },
};

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
    { value: 'delivery_late', label: 'Хүргэлт удааширсан' },
    { value: 'defective', label: 'Эвдэрч хэмхэрсэн' },
    { value: 'wrong_item', label: 'Буруу бараа ирсэн' },
    { value: 'not_as_described', label: 'Тайлбарт нийцээгүй' },
    { value: 'other', label: 'Бусад' },
];

export function StoreMyOrders() {
    const { business } = useOutletContext<{ business: Business }>();
    const brandColor = business.brandColor || '#4a6bff';

    // Auth state
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    // Orders
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Return request
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [returnReason, setReturnReason] = useState<ReturnReason>('delivery_late');
    const [returnNote, setReturnNote] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [submittingReturn, setSubmittingReturn] = useState(false);

    // Check if already logged in
    useEffect(() => {
        const saved = localStorage.getItem('liscord_customer_phone');
        if (saved) {
            setConfirmedPhone(saved);
        }
    }, []);

    // Load orders once phone confirmed
    useEffect(() => {
        if (!confirmedPhone || !business.id) return;
        setOrdersLoading(true);

        const loadOrders = async () => {
            try {
                const q = query(
                    collection(db, `businesses/${business.id}/orders`),
                    where('customer.phone', '==', confirmedPhone),
                    where('isDeleted', '==', false)
                );
                const snap = await getDocs(q);
                const result: Order[] = snap.docs
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .sort((a, b) => {
                        const da = toDate(a.createdAt).getTime();
                        const db2 = toDate(b.createdAt).getTime();
                        return db2 - da;
                    }) as Order[];
                setOrders(result);
            } catch (e) {
                console.error('Failed to load orders:', e);
            } finally {
                setOrdersLoading(false);
            }
        };
        loadOrders();
    }, [confirmedPhone, business.id]);

    // ── OTP Flow ──
    const handleSendOtp = async () => {
        if (!phone || phone.length < 8) {
            toast.error('Утасны дугаар оруулна уу');
            return;
        }
        setAuthLoading(true);
        try {
            const fullPhone = phone.startsWith('+976') ? phone : `+976${phone.replace(/\D/g, '')}`;

            // Setup recaptcha
            if (!(window as any).recaptchaVerifier) {
                (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {},
                });
            }

            const result = await signInWithPhoneNumber(auth, fullPhone, (window as any).recaptchaVerifier);
            setConfirmation(result);
            setOtpSent(true);
            toast.success('Баталгаажуулах код илгээлээ');
        } catch (e) {
            console.error('OTP send error:', e);
            toast.error('Код илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
            // Reset recaptcha
            (window as any).recaptchaVerifier = null;
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmation || !otpCode) return;
        setAuthLoading(true);
        try {
            await confirmation.confirm(otpCode);
            const cleanPhone = phone.startsWith('+976') ? phone : `+976${phone.replace(/\D/g, '')}`;
            setConfirmedPhone(cleanPhone);
            localStorage.setItem('liscord_customer_phone', cleanPhone);
            toast.success('Амжилттай нэвтэрлээ!');
        } catch (e) {
            console.error('OTP verify error:', e);
            toast.error('Буруу код. Дахин оролдоно уу.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        setConfirmedPhone(null);
        setOrders([]);
        setSelectedOrder(null);
        setOtpSent(false);
        setOtpCode('');
        setPhone('');
        localStorage.removeItem('liscord_customer_phone');
    };

    // ── Return Request ──
    const handleSubmitReturn = async () => {
        if (!selectedOrder || !business.id || !confirmedPhone) return;
        setSubmittingReturn(true);
        try {
            const subtotal = selectedOrder.financials?.subtotal || 0;
            const totalPaid = selectedOrder.financials?.totalAmount || 0;

            const items = selectedOrder.items.map(item => ({
                productId: item.productId || '',
                name: item.name,
                image: item.image || '',
                quantity: item.quantity,
                originalQuantity: item.quantity,
                unitPrice: item.unitPrice,
                proportionalRefund: subtotal > 0 ? Math.round((item.unitPrice * item.quantity / subtotal) * totalPaid) : item.unitPrice * item.quantity,
                productType: 'ready' as const,
                action: 'restock' as const,
            }));

            const refundAmount = items.reduce((s, i) => s + i.proportionalRefund, 0);

            const returnDoc = {
                orderId: selectedOrder.id,
                orderNumber: selectedOrder.orderNumber,
                customer: {
                    id: null,
                    name: selectedOrder.customer.name,
                    phone: confirmedPhone,
                },
                refundAccount: (bankName && accountNumber) ? { bankName, accountNumber, accountHolder } : null,
                type: 'product_issue' as ReturnType,
                items,
                includeDeliveryFee: false,
                deliveryFeeRefund: 0,
                reason: returnReason,
                reasonNote: returnNote || '',
                evidenceUrls: [],
                refundAmount,
                status: 'pending',
                statusHistory: [{ status: 'pending', at: new Date(), by: 'customer', byName: selectedOrder.customer.name || 'Захиалагч', note: 'Захиалагч буцаалт хүсэлт илгээсэн' }],
                financeNote: '',
                createdBy: 'customer',
                createdByName: selectedOrder.customer.name || 'Захиалагч',
                createdByRole: 'customer',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await addDoc(collection(db, `businesses/${business.id}/returns`), returnDoc);
            toast.success('Буцаалтын хүсэлт амжилттай илгээгдлээ!');
            setShowReturnForm(false);
            setSelectedOrder(null);
            setReturnNote('');
            setBankName('');
            setAccountNumber('');
            setAccountHolder('');
        } catch (e) {
            console.error('Return submit error:', e);
            toast.error('Алдаа гарлаа');
        } finally {
            setSubmittingReturn(false);
        }
    };

    const storeName = business.settings?.storefront?.name || business.name;

    // ── Not logged in ──
    if (!confirmedPhone) {
        return (
            <div className="my-orders-page">
                <Link to={`/${business.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: brandColor, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', marginBottom: 16 }}>
                    <ArrowLeft size={18} /> {storeName}
                </Link>

                <div className="my-orders-login">
                    <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
                    <h2>Миний захиалгууд</h2>
                    <p>Утасны дугаараар нэвтэрч захиалгуудаа харна уу</p>

                    {!otpSent ? (
                        <div className="otp-input-group">
                            <input
                                type="tel"
                                placeholder="Утасны дугаар"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                maxLength={12}
                                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                            />
                            <button onClick={handleSendOtp} disabled={authLoading || phone.length < 8} style={{ background: brandColor }}>
                                {authLoading ? <Loader2 size={16} className="animate-spin" /> : 'Код авах'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: 12 }}>
                                {phone.startsWith('+976') ? phone : `+976${phone}`} руу 6 оронтой код илгээлээ
                            </p>
                            <div className="otp-input-group">
                                <input
                                    type="text"
                                    placeholder="Баталгаажуулах код"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                    maxLength={6}
                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                    style={{ letterSpacing: '4px', fontWeight: 700, textAlign: 'center' }}
                                />
                                <button onClick={handleVerifyOtp} disabled={authLoading || otpCode.length < 6} style={{ background: brandColor }}>
                                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : 'Нэвтрэх'}
                                </button>
                            </div>
                            <button onClick={() => { setOtpSent(false); setOtpCode(''); }} style={{ marginTop: 12, background: 'none', border: 'none', color: '#888', fontSize: '0.82rem', cursor: 'pointer' }}>
                                ← Дахин оролдох
                            </button>
                        </div>
                    )}

                    <div id="recaptcha-container" />
                </div>
            </div>
        );
    }

    // ── Logged in ──
    return (
        <div className="my-orders-page">
            <Link to={`/${business.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: brandColor, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', marginBottom: 16 }}>
                <ArrowLeft size={18} /> {storeName}
            </Link>

            <div className="my-orders-header">
                <h2>📦 Миний захиалгууд</h2>
                <button className="logout-btn" onClick={handleLogout}>Гарах</button>
            </div>

            {ordersLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: brandColor }} />
                </div>
            ) : orders.length === 0 ? (
                <div className="my-orders-empty">
                    <div className="my-orders-empty-icon">📦</div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Захиалга олдсонгүй</h3>
                    <p style={{ fontSize: '0.85rem' }}>Энэ утасны дугаараар захиалга хийгдээгүй байна</p>
                </div>
            ) : (
                orders.map(order => {
                    const payInfo = PAYMENT_LABELS[order.paymentStatus || 'unpaid'] || PAYMENT_LABELS.unpaid;
                    return (
                        <div key={order.id} className="my-order-card" onClick={() => setSelectedOrder(order)}>
                            <div className="my-order-card-top">
                                <span className="my-order-number">#{order.orderNumber}</span>
                                <span className="my-order-date">{toDate(order.createdAt).toLocaleDateString('mn-MN')}</span>
                            </div>
                            <div className="my-order-items-preview">
                                {order.items.slice(0, 3).map((item, i) => (
                                    <span key={i} className="my-order-item-chip">{item.name} ×{item.quantity}</span>
                                ))}
                                {order.items.length > 3 && <span className="my-order-item-chip">+{order.items.length - 3}</span>}
                            </div>
                            <div className="my-order-card-bottom">
                                <span className="my-order-total">{(order.financials?.totalAmount || 0).toLocaleString()}₮</span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {(() => {
                                        const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.new;
                                        return (
                                            <span className="my-order-status-badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                                {statusInfo.label}
                                            </span>
                                        );
                                    })()}
                                    <span className="my-order-status-badge" style={{ background: payInfo.bg, color: payInfo.color }}>
                                        {payInfo.label}
                                    </span>
                                </div>
                            </div>
                            {/* Fulfillment indicator */}
                            {order.fulfillmentNote && (
                                <div style={{ marginTop: 6, padding: '4px 10px', borderRadius: 6, background: order.fulfillmentStatus === 'full' ? '#d1fae5' : '#fef3c7', color: order.fulfillmentStatus === 'full' ? '#065f46' : '#92400e', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>
                                    {order.fulfillmentStatus === 'full' ? '✅' : '📦'} {order.fulfillmentNote}
                                </div>
                            )}
                            {order.returnStatus && order.returnStatus !== 'none' && (
                                <div style={{ marginTop: 8, padding: '4px 10px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>
                                    🔄 {order.returnStatus === 'full' ? 'Бүрэн буцаалт' : 'Хэсэгчлэн буцаалт'}
                                </div>
                            )}
                            {/* Cargo payment needed badge */}
                            {order.status === 'arrived' && order.financials?.cargoFee > 0 && order.financials?.cargoPaymentStatus !== 'paid' && order.financials?.cargoPaymentTiming === 'on_arrival' && (
                                <div style={{ marginTop: 6, padding: '5px 10px', borderRadius: 6, background: '#fef3c7', color: '#92400e', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid #fde68a' }}>
                                    📦 Каргоны төлбөр: {order.financials.cargoFee.toLocaleString()}₮
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            {/* Order Detail + Return */}
            {selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setSelectedOrder(null); setShowReturnForm(false); }}>
                    <div className="my-return-panel" onClick={e => e.stopPropagation()}>
                        <div className="my-return-header">
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
                                Захиалга #{selectedOrder.orderNumber}
                            </h3>
                            <button onClick={() => { setSelectedOrder(null); setShowReturnForm(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="my-return-body">
                            {/* Items with fulfillment */}
                            <div>
                                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', marginBottom: 8 }}>Бараа</h4>
                                {selectedOrder.items.map((item, i) => {
                                    const arrived = item.arrivedQuantity || 0;
                                    const pickedUp = item.pickedUpQuantity || 0;
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                            {item.image ?
                                                <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> :
                                                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="#ccc" /></div>
                                            }
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#999' }}>{item.quantity}ш × {item.unitPrice.toLocaleString()}₮</div>
                                                {arrived > 0 && (
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: arrived >= item.quantity ? '#10b981' : '#f59e0b', marginTop: 2 }}>
                                                        {arrived >= item.quantity ? '✅ Ирсэн' : `📦 ${arrived}/${item.quantity} ирсэн`}
                                                        {pickedUp > 0 && <span style={{ marginLeft: 6, color: '#8b5cf6' }}>· {pickedUp}ш авсан</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{(item.quantity * item.unitPrice).toLocaleString()}₮</div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 800, fontSize: '1rem' }}>
                                    <span>Нийт:</span>
                                    <span style={{ color: brandColor }}>{(selectedOrder.financials?.totalAmount || 0).toLocaleString()}₮</span>
                                </div>
                                {/* Cargo fee info */}
                                {selectedOrder.financials?.cargoFee > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: '0.82rem' }}>
                                        <span style={{ color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            📦 Каргоны төлбөр:
                                        </span>
                                        <span style={{ fontWeight: 700, color: selectedOrder.financials.cargoPaymentStatus === 'paid' ? '#10b981' : '#d97706' }}>
                                            {selectedOrder.financials.cargoFee.toLocaleString()}₮
                                            {selectedOrder.financials.cargoPaymentStatus === 'paid' ? ' ✅' : ' (төлөөгүй)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── CARGO GATE ── */}
                            {selectedOrder.status === 'arrived' &&
                             selectedOrder.financials?.cargoFee > 0 &&
                             selectedOrder.financials?.cargoPaymentTiming === 'on_arrival' &&
                             selectedOrder.financials?.cargoPaymentStatus !== 'paid' && (
                                <div style={{
                                    padding: 16, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #fef3c7, #fff7ed)',
                                    border: '2px solid #f59e0b',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📦</div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#92400e' }}>Каргоны төлбөр төлнө үү</div>
                                            <div style={{ fontSize: '0.75rem', color: '#a16207' }}>Төлбөр хийж байж бараагаа авах боломжтой</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#fff', borderRadius: 12, padding: '12px 16px',
                                        border: '1px solid #fde68a', marginBottom: 12, textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600, marginBottom: 4 }}>ТӨЛӨХ ДҮН</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#d97706' }}>
                                            {selectedOrder.financials.cargoFee.toLocaleString()}₮
                                        </div>
                                    </div>

                                    {/* Bank accounts for cargo payment */}
                                    {(business.settings?.bankTransferAccounts || []).filter(a => a.enabled).length > 0 && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Дансаар шилжүүлэх:</div>
                                            {(business.settings?.bankTransferAccounts || []).filter(a => a.enabled).map(bank => (
                                                <div key={bank.id} style={{ background: '#fff', padding: '8px 12px', borderRadius: 10, border: '1px solid #fde68a', marginBottom: 6, fontSize: '0.8rem' }}>
                                                    <div style={{ fontWeight: 700 }}>{bank.bankName}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                                        <span style={{ color: '#666' }}>{bank.accountNumber}</span>
                                                        <span style={{ fontWeight: 600 }}>{bank.accountName}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ fontSize: '0.72rem', color: '#92400e', textAlign: 'center', fontWeight: 600 }}>
                                        💡 QPay эсвэл бэлнээр төлөх бол манай менежерт хандана уу
                                    </div>
                                </div>
                            )}

                            {/* Return button */}
                            {selectedOrder.paymentStatus === 'paid' && selectedOrder.returnStatus !== 'full' && !showReturnForm && (
                                <button
                                    onClick={() => setShowReturnForm(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '12px 20px', borderRadius: 12, border: '2px solid #ef4444',
                                        background: '#fff', color: '#ef4444', fontWeight: 700, fontSize: '0.88rem',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <Undo2 size={18} /> Буцаалт хийх
                                </button>
                            )}

                            {/* Return form */}
                            {showReturnForm && (
                                <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, padding: 16, background: '#fafafa' }}>
                                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 12, color: '#ef4444' }}>🔄 Буцаалт хүсэлт</h4>

                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#999', display: 'block', marginBottom: 4 }}>Шалтгаан</label>
                                        <select
                                            value={returnReason}
                                            onChange={e => setReturnReason(e.target.value as ReturnReason)}
                                            style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid #e0e0e0', padding: '0 12px', fontSize: '0.85rem' }}
                                        >
                                            {RETURN_REASONS.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#999', display: 'block', marginBottom: 4 }}>Тайлбар</label>
                                        <textarea
                                            value={returnNote}
                                            onChange={e => setReturnNote(e.target.value)}
                                            placeholder="Дэлгэрэнгүй тайлбар..."
                                            rows={3}
                                            style={{ width: '100%', borderRadius: 10, border: '1px solid #e0e0e0', padding: 12, fontSize: '0.82rem', resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#999', display: 'block', marginBottom: 4 }}>Буцаалтын данс</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <input placeholder="Банк" value={bankName} onChange={e => setBankName(e.target.value)} style={{ height: 38, borderRadius: 8, border: '1px solid #e0e0e0', padding: '0 10px', fontSize: '0.82rem' }} />
                                            <input placeholder="Дансны дугаар" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={{ height: 38, borderRadius: 8, border: '1px solid #e0e0e0', padding: '0 10px', fontSize: '0.82rem' }} />
                                        </div>
                                        <input placeholder="Данс эзэмшигч" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={{ marginTop: 8, width: '100%', height: 38, borderRadius: 8, border: '1px solid #e0e0e0', padding: '0 10px', fontSize: '0.82rem' }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setShowReturnForm(false)} style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Болих</button>
                                        <button
                                            onClick={handleSubmitReturn}
                                            disabled={submittingReturn}
                                            style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {submittingReturn ? <Loader2 size={16} className="animate-spin" /> : 'Илгээх'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
