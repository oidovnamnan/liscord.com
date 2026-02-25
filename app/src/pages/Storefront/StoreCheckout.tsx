import { useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useCartStore } from '../../store';
import { orderService } from '../../services/db';
import { qpayService, type QPayInvoiceResponse } from '../../services/qpay';
import { ChevronLeft, CheckCircle } from 'lucide-react';
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
        <div className="store-bg" style={{ minHeight: '100vh' }}>
            <nav className="store-nav">
                <button className="btn btn-ghost" onClick={() => navigate(`/s/${slug}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                    <ChevronLeft size={20} /> Буцах
                </button>
                <div style={{ fontWeight: 700 }}>Тооцоо хийх</div>
                <div style={{ width: 60 }}></div>
            </nav>

            <main className="store-container" style={{ maxWidth: 800 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>

                    {/* Order Summary Form */}
                    <form className="settings-card animate-fade-in" onSubmit={handleSubmit}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: 20, fontWeight: 700 }}>Хүргэлтийн мэдээлэл</h2>

                        <div className="grid-2-gap" style={{ marginBottom: 20 }}>
                            <div className="input-group">
                                <label className="input-label">Хүлээн авагчийн нэр</label>
                                <input className="input" name="name" required placeholder="Жнь: Бат" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Утасны дугаар</label>
                                <input className="input" name="phone" required placeholder="Жнь: 99112233" />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: 20 }}>
                            <label className="input-label">Хүргэлтийн бүс</label>
                            <select
                                className="input"
                                value={deliveryZone}
                                onChange={(e) => setDeliveryZone(e.target.value)}
                            >
                                {Object.entries(deliveryFees).map(([key, data]) => (
                                    <option key={key} value={key}>{data.label} (+{data.fee.toLocaleString()} ₮)</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 30 }}>
                            <label className="input-label">Дэлгэрэнгүй хаяг маш тодорхой бичих</label>
                            <textarea className="input" name="address" required rows={3} placeholder="Дүүрэг, Хороо, Хотхон/Байр, Орц, Давхар, Тоот..."></textarea>
                        </div>

                        <div style={{ padding: '20px', background: 'var(--bg-body)', borderRadius: '12px', marginBottom: 30 }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Захиалгын хураангуй</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)' }}>
                                <span>Барааны дүн ({totalItems()} ш):</span>
                                <span>{totalAmount().toLocaleString()} ₮</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: 'var(--text-muted)' }}>
                                <span>Хүргэлт:</span>
                                <span>{currentFee.toLocaleString()} ₮</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px dashed var(--border-color)', fontWeight: 800, fontSize: '1.25rem' }}>
                                <span>Нийт төлөх:</span>
                                <span>{finalTotal.toLocaleString()} ₮</span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary gradient-btn" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} disabled={loading}>
                            {loading ? 'Уншиж байна...' : 'Захиалга баталгаажуулах'}
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
}
