import { useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useCartStore } from '../../store';
import { orderService } from '../../services/db';
import { qpayService, type QPayInvoiceResponse } from '../../services/qpay';
import { ChevronLeft, CheckCircle, MapPin, Truck, ImageIcon, ShieldCheck, CreditCard } from 'lucide-react';
import type { Business, Order } from '../../types';

export function StoreCheckout() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { business } = useOutletContext<{ business: Business }>();
    const { items, totalAmount, totalItems, clearCart } = useCartStore();

    const [loading, setLoading] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [qpayInvoice, setQpayInvoice] = useState<QPayInvoiceResponse | null>(null);

    const [deliveryZone, setDeliveryZone] = useState('ub_center');

    // Hardcoded simple delivery fees for the demo
    const deliveryFees: Record<string, { label: string, fee: number }> = {
        'ub_center': { label: 'Улаанбаатар (А бүс)', fee: 5000 },
        'ub_far': { label: 'Улаанбаатар (Б бүс)', fee: 8000 },
        'local_cargo': { label: 'Орон нутаг (Унаанд тавих)', fee: 0 }
    };

    const currentFee = deliveryFees[deliveryZone].fee;
    const finalTotal = totalAmount() + currentFee;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (items.length === 0) return;

        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const phone = fd.get('phone') as string;
        const address = fd.get('address') as string;

        setLoading(true);

        try {
            const orderPayload: Partial<Order> = {
                orderNumber: `${business.settings?.orderPrefix || 'ORD-'}${Date.now().toString().slice(-6)}`,
                status: 'new', // Assuming 'new' is the default first status
                paymentStatus: 'unpaid',
                customer: {
                    id: null,
                    name,
                    phone,
                },
                source: 'website',
                items: items.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    variant: item.variant ? Object.values(item.variant).join(' ') : 'Үндсэн',
                    quantity: item.quantity,
                    unitPrice: item.price,
                    costPrice: item.product.pricing?.costPrice || 0,
                    totalPrice: item.price * item.quantity,
                    image: item.product.images?.[0] || null
                })),
                financials: {
                    subtotal: totalAmount(),
                    discountType: 'fixed',
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: currentFee,
                    cargoFee: 0,
                    cargoIncluded: false,
                    totalAmount: finalTotal,
                    payments: [],
                    paidAmount: 0,
                    balanceDue: finalTotal
                },
                deliveryAddress: `${deliveryFees[deliveryZone].label} - ${address}`,
                notes: `Онлайн дэлгүүрээр өгсөн захиалга`,
                internalNotes: '',
                tags: ['online'],
                statusHistory: [],
                createdBy: 'guest',
                createdByName: 'Customer (Online)',
            };

            const newId = await orderService.createOrder(business.id, orderPayload);
            setSuccessId(newId);
            clearCart();

            // Generate QPay QR if enabled
            if (business.settings?.qpay?.enabled) {
                try {
                    const invoice = await qpayService.mockCreateInvoice({
                        invoice_code: business.settings.qpay.merchantId,
                        sender_invoice_no: newId,
                        invoice_receiver_code: phone,
                        invoice_description: `${business.name} захиалга #${newId.slice(-4)}`,
                        amount: finalTotal
                    }, business.settings);
                    setQpayInvoice(invoice);
                } catch (e) {
                    console.error('QPay generation failed', e);
                }
            }
        } catch (error) {
            console.error('Failed to create order', error);
            alert('Захиалга үүсгэхэд алдаа гарлаа. Та дахин оролдоно уу.');
        } finally {
            setLoading(false);
        }
    };

    if (successId) {
        return (
            <div className="store-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '60px 20px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <div className="animate-slide-up" style={{
                        background: 'var(--surface-1)',
                        padding: '60px 40px',
                        borderRadius: 32,
                        textAlign: 'center',
                        maxWidth: 500,
                        width: '100%',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--border-color)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: 6,
                            background: 'linear-gradient(90deg, #4BB543, #85e085)'
                        }} />

                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(75, 181, 67, 0.1)', color: '#4BB543', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={40} />
                        </div>

                        <h2 style={{ marginBottom: 16, fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Захиалга амжилттай!</h2>

                        {qpayInvoice ? (
                            <div className="animate-fade-in" style={{ margin: '32px 0', background: 'var(--bg-soft)', padding: 32, borderRadius: 24, border: '1px solid var(--border-primary)' }}>
                                <p style={{ fontWeight: 800, marginBottom: 20, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Төлбөр төлөх (QPay)</p>

                                <div style={{
                                    width: 200, height: 200, margin: '0 auto',
                                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid var(--primary-light)', borderRadius: 20, boxShadow: 'var(--shadow-md)',
                                    padding: 10
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📲</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.4 }}>QPay QR<br />энд харагдана</div>
                                    </div>
                                </div>

                                <div className="custom-scrollbar" style={{ display: 'flex', gap: 12, marginTop: 24, overflowX: 'auto', paddingBottom: 12, justifyContent: 'center' }}>
                                    {qpayInvoice.urls.map(url => (
                                        <a key={url.name} href={url.link} className="btn btn-outline btn-sm" style={{ flexShrink: 0, textDecoration: 'none', borderRadius: 10, fontWeight: 700, padding: '8px 16px' }}>
                                            {url.name}
                                        </a>
                                    ))}
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 16, fontWeight: 500 }}>Төлбөр төлснөөр захиалга баталгаажихыг анхаарна уу.</p>
                            </div>
                        ) : (
                            <div style={{ margin: '24px 0 40px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    Таны захиалга хүлээн авлаа. Манай менежер тун удахгүй тантай холбогдож захиалгыг баталгаажуулна.
                                </p>
                            </div>
                        )}

                        <button className="btn btn-primary gradient-btn" onClick={() => navigate(`/s/${slug}`)} style={{ width: '100%', height: 54, borderRadius: 16, fontSize: '1.05rem', fontWeight: 800 }}>
                            Дэлгүүр рүү буцах
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="store-bg" style={{ minHeight: '100vh', padding: 40, textAlign: 'center' }}>
                <h2>Таны сагс хоосон байна</h2>
                <button className="btn btn-outline" onClick={() => navigate(`/s/${slug}`)} style={{ marginTop: 20 }}>Буцах</button>
            </div>
        );
    }

    return (
        <div className="store-bg" style={{ minHeight: '100vh', paddingBottom: 60 }}>
            <nav className="store-nav" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-1)', padding: 0 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <button className="btn btn-ghost" onClick={() => navigate(`/s/${slug}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                        <ChevronLeft size={20} /> Буцах
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Тооцоо хийх</div>
                    <div style={{ width: 60 }}></div>
                </div>
            </nav>

            <main className="store-container" style={{ maxWidth: 1100, marginTop: 40, margin: '40px auto 0' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'start' }} className="checkout-grid">

                    {/* Left Column: Forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="settings-card animate-slide-up" style={{ padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={22} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Хүргэлтийн мэдээлэл</h2>
                            </div>

                            <div className="grid-2-gap" style={{ marginBottom: 20 }}>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Хүлээн авагчийн нэр *</label>
                                    <input className="input" name="name" required placeholder="Жнь: Бат" style={{ height: 48, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-primary)' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Утасны дугаар *</label>
                                    <input className="input" name="phone" required placeholder="Жнь: 99112233" style={{ height: 48, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-primary)' }} />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: 24 }}>
                                <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Хүргэлтийн бүс *</label>
                                <div style={{ position: 'relative' }}>
                                    <Truck size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                                    <select
                                        className="input"
                                        value={deliveryZone}
                                        onChange={(e) => setDeliveryZone(e.target.value)}
                                        style={{ height: 52, borderRadius: 12, paddingLeft: 44, background: 'var(--bg-soft)', fontSize: '0.95rem', fontWeight: 500, border: '1px solid var(--border-primary)', position: 'relative' }}
                                    >
                                        {Object.entries(deliveryFees).map(([key, data]) => (
                                            <option key={key} value={key}>{data.label} (+{data.fee.toLocaleString()} ₮)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: 10 }}>
                                <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Дэлгэрэнгүй хаяг *</label>
                                <textarea className="input" name="address" required rows={3} placeholder="Дүүрэг, Хороо, Хотхон/Байр, Орц, Давхар, Тоот..." style={{ borderRadius: 12, padding: 16, background: 'var(--bg-soft)', resize: 'none', border: '1px solid var(--border-primary)' }}></textarea>
                            </div>
                        </div>

                        <div className="settings-card animate-slide-up" style={{ padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-1)', animationDelay: '0.1s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={22} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Төлбөрийн нөхцөл</h2>
                            </div>
                            <div style={{ padding: 20, borderRadius: 16, border: '2px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={14} />
                                </div>
                                <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>Цахим төлбөр</div>
                            </div>
                            <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Захиалгыг баталгаажуулсны дараа QPay/Шилжүүлэх дансны мэдээлэл харагдана.</p>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="settings-card summary-sidebar animate-slide-up" style={{ padding: 0, borderRadius: 24, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', background: 'var(--surface-1)', overflow: 'hidden', animationDelay: '0.2s', position: 'sticky', top: 100 }}>
                        <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Захиалгын хураангуй ({totalItems()})</h2>
                        </div>

                        <div className="custom-scrollbar" style={{ padding: '24px 32px', maxHeight: '45vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {items.map((item, idx) => (
                                    <div key={`${item.product.id}-${idx}`} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div style={{ width: 64, height: 64, flexShrink: 0, position: 'relative' }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: 12, background: 'var(--bg-soft)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                {item.product.images?.[0] ? (
                                                    <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ position: 'absolute', top: -8, right: -8, background: 'var(--text-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-1)', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{item.product.name}</div>
                                            {item.variant && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{Object.values(item.variant).join(' - ')}</div>}
                                            <div style={{ fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{(item.price * item.quantity).toLocaleString()} ₮</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                <span style={{ fontWeight: 500 }}>Барааны нийт дүн:</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalAmount().toLocaleString()} ₮</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                <span style={{ fontWeight: 500 }}>Хүргэлтийн төлбөр:</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentFee.toLocaleString()} ₮</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px dashed var(--border-primary)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                                <span>Нийт төлөх:</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--primary)' }}>{finalTotal.toLocaleString()} ₮</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px 32px', background: 'var(--surface-1)' }}>
                            <button type="submit" className="btn btn-primary gradient-btn premium-btn" style={{ width: '100%', height: 56, fontSize: '1.1rem', borderRadius: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s ease' }} disabled={loading}>
                                {loading ? 'Уншиж байна...' : (
                                    <>
                                        <ShieldCheck size={20} />
                                        Захиалга баталгаажуулах
                                    </>
                                )}
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 600 }}>
                                <ShieldCheck size={14} /> Аюулгүй, найдвартай төлбөр
                            </p>
                        </div>
                    </div>
                </form>

                <style>{`
                    @media (max-width: 900px) {
                        .checkout-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .summary-sidebar {
                            position: static !important;
                            margin-top: 24px;
                        }
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0,0,0,0.1);
                        border-radius: 4px;
                    }
                    :root[data-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.1);
                    }
                `}</style>
            </main>
        </div>
    );
}
