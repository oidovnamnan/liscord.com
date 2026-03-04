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
            <div className="store-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <CheckCircle size={64} color="var(--success)" style={{ marginBottom: 20 }} />
                    <h2 style={{ marginBottom: 10, fontSize: '1.5rem', fontWeight: 800 }}>Захиалга амжилттай!</h2>

                    {qpayInvoice ? (
                        <div style={{ margin: '20px 0', border: '1px solid var(--border-color)', padding: 20, borderRadius: 16 }}>
                            <p style={{ fontWeight: 600, marginBottom: 10 }}>Төлбөр төлөх (QPay)</p>

                            <div style={{
                                width: 220, height: 220, margin: '0 auto',
                                background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--primary-light)', borderRadius: 16, borderStyle: 'dashed'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📱</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Дэлгэцэн дээрх<br />QPay QR</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 16, overflowX: 'auto', paddingBottom: 10, justifyContent: 'center' }}>
                                {qpayInvoice.urls.map(url => (
                                    <a key={url.name} href={url.link} className="btn btn-outline btn-sm" style={{ flexShrink: 0, textDecoration: 'none' }}>
                                        {url.name}
                                    </a>
                                ))}
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 10 }}>Төлбөр төлснөөр захиалга баталгаажихыг анхаарна уу.</p>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>Таны захиалга админ руу илгээгдлээ. Бид удахгүй холбогдох болно.</p>
                    )}

                    <button className="btn btn-primary gradient-btn" onClick={() => navigate(`/s/${slug}`)} style={{ width: '100%' }}>
                        Дэлгүүр рүү буцах
                    </button>
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
            <nav className="store-nav" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-1)' }}>
                <button className="btn btn-ghost" onClick={() => navigate(`/s/${slug}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                    <ChevronLeft size={20} /> Буцах
                </button>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Тооцоо хийх</div>
                <div style={{ width: 60 }}></div>
            </nav>

            <main className="store-container" style={{ maxWidth: 1100, marginTop: 40 }}>
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
                                        <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--bg-soft)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)', position: 'relative' }}>
                                            {item.product.images?.[0] ? (
                                                <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                            <div style={{ position: 'absolute', top: -6, right: -6, background: 'var(--text-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 800, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-1)' }}>
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
