import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useCartStore } from '../../store';
import { orderService } from '../../services/db';
import { qpayService, type QPayInvoiceResponse } from '../../services/qpay';
import { ChevronLeft, CheckCircle, MapPin, Truck, ImageIcon, ShieldCheck, CreditCard, QrCode, Landmark, Copy, Check, Smartphone, PartyPopper } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Business, Order } from '../../types';
import { toast } from 'react-hot-toast';

async function getUniqueRefCode(businessId: string): Promise<string> {
    const counterRef = doc(db, `businesses/${businessId}/counters`, 'refCodes');
    const snap = await getDoc(counterRef);
    let usedCodes: number[] = snap.exists() ? (snap.data().used || []) : [];

    // If all 9999 codes are used, reset
    if (usedCodes.length >= 9999) {
        await setDoc(counterRef, { used: [] });
        usedCodes = [];
    }

    // Pick a random 4-digit number not in usedCodes
    const usedSet = new Set(usedCodes);
    let code: number;
    do {
        code = Math.floor(Math.random() * 9999) + 1; // 1–9999
    } while (usedSet.has(code));

    // Save used code
    if (snap.exists()) {
        await updateDoc(counterRef, { used: arrayUnion(code) });
    } else {
        await setDoc(counterRef, { used: [code] });
    }

    return String(code).padStart(4, '0');
}

export function StoreCheckout() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { business } = useOutletContext<{ business: Business }>();
    const { items, totalAmount, totalItems, clearCart } = useCartStore();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [loading, setLoading] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [qpayInvoice, setQpayInvoice] = useState<QPayInvoiceResponse | null>(null);
    const [phoneError, setPhoneError] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [copied, setCopied] = useState(false);

    // Auto-fill name & phone from localStorage (returning customers)
    useEffect(() => {
        if (!business?.id) return;
        const savedPhone = localStorage.getItem(`membership_phone_${business.id}`) || localStorage.getItem(`customer_phone_${business.id}`) || '';
        const savedName = localStorage.getItem(`customer_name_${business.id}`) || '';
        if (savedPhone && !customerPhone) setCustomerPhone(savedPhone.replace(/[^\d]/g, ''));
        if (savedName && !customerName) setCustomerName(savedName);
    }, [business?.id]);
    const [savedTotal, setSavedTotal] = useState(0);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qpay' | 'social_pay'>('bank_transfer');
    const [selectedBankId, setSelectedBankId] = useState<string>('');

    const hasReadyItems = items.some(item => item.product.productType === 'ready');
    const hasPreorderItems = items.some(item => item.product.productType === 'preorder');

    const [isDeliveryRequested, setIsDeliveryRequested] = useState(hasReadyItems);
    const [deliveryZone, setDeliveryZone] = useState('ub_center');

    const deliveryFees: Record<string, { label: string, fee: number }> = {
        'ub_center': { label: 'Улаанбаатар (А бүс)', fee: 5000 },
        'ub_far': { label: 'Улаанбаатар (Б бүс)', fee: 8000 },
        'local_cargo': { label: 'Орон нутаг (Унаанд тавих)', fee: 0 }
    };

    const currentFee = isDeliveryRequested ? deliveryFees[deliveryZone].fee : 0;
    const finalTotal = totalAmount() + currentFee;

    // Bank accounts
    const enabledBanks = useMemo(() =>
        (business.settings?.bankTransferAccounts || []).filter(a => a.enabled),
        [business.settings?.bankTransferAccounts]
    );

    // Auto-select first bank
    const selectedBank = enabledBanks.find(b => b.id === selectedBankId) || enabledBanks[0] || null;

    // Generate ref code once per session
    const [refCode, setRefCode] = useState('');
    useEffect(() => {
        if (!refCode && business?.id) {
            getUniqueRefCode(business.id).then(code => setRefCode(code)).catch(() => {
                // Fallback: random 4-digit
                setRefCode(String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0'));
            });
        }
    }, [business?.id]);

    const handleAddressChange = (val: string) => {
        const lower = val.toLowerCase();
        const bZoneKeywords = ['сонгинохайрхан', 'схд', 'хан-уул', 'худ', 'яармаг', 'нисэх', 'амгалан', 'баянхошуу', 'хайлааст', 'чсд', 'зуслан'];
        if (bZoneKeywords.some(k => lower.includes(k))) {
            setDeliveryZone('ub_far');
        } else if (lower.includes('орон нутаг') || lower.includes('аймаг') || lower.includes('сум')) {
            setDeliveryZone('local_cargo');
        } else if (val.length > 3) {
            setDeliveryZone('ub_center');
        }
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} хуулагдлаа`);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success(`${label} хуулагдлаа`);
        }
    };

    const copyRefCode = async () => {
        try {
            await navigator.clipboard.writeText(refCode);
            setCopied(true);
            toast.success('Код хуулагдлаа');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for mobile
            const textarea = document.createElement('textarea');
            textarea.value = refCode;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            toast.success('Код хуулагдлаа');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (items.length === 0) return;

        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string || customerName;
        const rawPhone = fd.get('phone') as string || customerPhone;
        const address = fd.get('address') as string;

        const phone = rawPhone.replace(/\D/g, '');
        if (phone.length !== 8) {
            setPhoneError(true);
            toast.error('Утасны дугаар 8 оронтой тоо байх ёстой');
            return;
        }
        setPhoneError(false);

        setLoading(true);

        try {
            // Ensure ref code is available (should already be set on mount)
            let code = refCode;
            if (paymentMethod === 'bank_transfer' && !code) {
                code = await getUniqueRefCode(business.id);
                setRefCode(code);
            }
            const orderPayload: Partial<Order> = {
                orderNumber: `${business.settings?.orderPrefix || 'ORD-'}${Date.now().toString().slice(-6)}`,
                status: 'new',
                paymentStatus: 'unpaid',
                customer: {
                    id: null,
                    name,
                    phone,
                },
                source: 'website',
                selectedPaymentMethod: paymentMethod,
                paymentRefCode: paymentMethod === 'bank_transfer' ? code : '',
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
                deliveryAddress: isDeliveryRequested ? `${deliveryFees[deliveryZone].label} - ${address}` : 'Дэлгүүрээс очиж авах',
                notes: `Онлайн дэлгүүрээр өгсөн захиалга${paymentMethod === 'bank_transfer' && selectedBank ? ` | Шилжүүлэг: ${selectedBank.bankName} ${selectedBank.accountNumber} | Код: ${code}` : ''}`,
                internalNotes: '',
                tags: ['online'],
                statusHistory: [],
                createdBy: 'guest',
                createdByName: 'Customer (Online)',
            };

            const newId = await orderService.createOrder(business.id, orderPayload);
            setSavedTotal(finalTotal);
            setSuccessId(newId);
            window.scrollTo(0, 0);
            clearCart();

            // Save customer info for auto-fill on next visit
            if (name) localStorage.setItem(`customer_name_${business.id}`, name);
            if (phone) localStorage.setItem(`customer_phone_${business.id}`, phone);

            // Generate QPay QR if enabled
            if (business.settings?.qpay?.enabled && paymentMethod === 'qpay') {
                try {
                    const invoice = await qpayService.createInvoice(
                        business.id,
                        newId,
                        finalTotal,
                        `${business.name} захиалга #${newId.slice(-4)}`,
                        phone
                    );
                    setQpayInvoice(invoice);
                } catch (e) {
                    console.error('QPay generation failed', e);
                }
            }
        } catch (error) {
            console.error('Failed to create order', error);
            toast.error('Захиалга үүсгэхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    // ──────── LISTEN FOR PAYMENT CONFIRMATION ────────
    useEffect(() => {
        if (!successId || !business?.id) return;
        const orderRef = doc(db, `businesses/${business.id}/orders`, successId);
        const unsub = onSnapshot(orderRef, (snap) => {
            const data = snap.data();
            if (data?.paymentStatus === 'paid' && !paymentConfirmed) {
                setPaymentConfirmed(true);
                toast.success('Төлбөр баталгаажлаа! 🎉');
            }
        });
        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [successId, business?.id]);

    // ──────── SUCCESS SCREEN ────────
    if (successId) {
        return (
            <div className="store-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="animate-slide-up" style={{
                        background: 'var(--surface-1)',
                        padding: '32px 24px',
                        borderRadius: 32,
                        textAlign: 'center',
                        maxWidth: 500,
                        width: '100%',
                        boxShadow: 'var(--shadow-xl)',
                        border: `1px solid ${paymentConfirmed ? '#4BB543' : 'var(--border-color)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'border-color 0.5s ease'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: 4,
                            background: paymentConfirmed
                                ? 'linear-gradient(90deg, #4BB543, #2ecc71, #4BB543)'
                                : 'linear-gradient(90deg, #4BB543, #85e085)',
                            backgroundSize: paymentConfirmed ? '200% 100%' : 'auto',
                            animation: paymentConfirmed ? 'shimmer 2s ease infinite' : 'none'
                        }} />

                        {paymentConfirmed ? (
                            <>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #4BB543, #2ecc71)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(75, 181, 67, 0.3)',
                                    animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}>
                                    <PartyPopper size={28} />
                                </div>
                                <h2 style={{ marginBottom: 4, fontSize: '1.4rem', fontWeight: 900, color: '#4BB543', letterSpacing: '-0.02em' }}>Төлбөр баталгаажлаа!</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8 }}>Таны шилжүүлэг амжилттай хүлээн авлаа.</p>
                            </>
                        ) : (
                            <>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(75, 181, 67, 0.1)', color: '#4BB543', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <CheckCircle size={28} />
                                </div>
                                <h2 style={{ marginBottom: 8, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Захиалга амжилттай!</h2>
                            </>
                        )}

                        {/* Bank Transfer Info on Success */}
                        {paymentMethod === 'bank_transfer' && selectedBank && (
                            <div className="animate-fade-in" style={{ margin: '16px 0', background: 'var(--bg-soft)', padding: 20, borderRadius: 20, border: '1px solid var(--border-primary)', textAlign: 'left' }}>
                                <p style={{ fontWeight: 800, marginBottom: 12, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Шилжүүлэг хийх мэдээлэл</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Банк:</span>
                                        <span style={{ fontWeight: 700 }}>{selectedBank.bankName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Данс:</span>
                                        <span
                                            style={{ fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                            onClick={() => copyToClipboard(selectedBank.accountNumber, 'Дансны дугаар')}
                                        >
                                            {selectedBank.accountNumber}
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        </span>
                                    </div>
                                    {selectedBank.iban && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>IBAN:</span>
                                            <span
                                                style={{ fontWeight: 700, letterSpacing: '0.03em', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                onClick={() => copyToClipboard(selectedBank.iban!, 'IBAN')}
                                            >
                                                {selectedBank.iban}
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Хүлээн авагч:</span>
                                        <span style={{ fontWeight: 700 }}>{selectedBank.accountName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Дүн:</span>
                                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{savedTotal.toLocaleString()} ₮</span>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--surface-1)', borderRadius: 14, padding: 16, textAlign: 'center',
                                    border: '2px dashed var(--primary)', position: 'relative'
                                }}>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>ГҮЙЛГЭЭНИЙ УТГА</p>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--primary)', fontFamily: 'monospace' }}>
                                        {refCode}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={copyRefCode}
                                        style={{
                                            marginTop: 8, background: copied ? '#4BB543' : 'var(--primary)', color: '#fff',
                                            border: 'none', borderRadius: 10, padding: '6px 16px', fontWeight: 700,
                                            fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {copied ? <><Check size={14} /> Хуулагдсан</> : <><Copy size={14} /> Код хуулах</>}
                                    </button>
                                </div>

                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
                                    Шилжүүлэг хийхдээ дээрх кодыг гүйлгээний утга дээр заавал бичнэ үү. Төлбөр автоматаар баталгаажна.
                                </p>
                            </div>
                        )}

                        {qpayInvoice ? (
                            <div className="animate-fade-in" style={{ margin: '32px 0', background: 'var(--bg-soft)', padding: 32, borderRadius: 24, border: '1px solid var(--border-primary)' }}>
                                <p style={{ fontWeight: 800, marginBottom: 20, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Төлбөр төлөх (QPay)</p>
                                <div style={{
                                    width: 200, height: 200, margin: '0 auto',
                                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid var(--primary-light)', borderRadius: 20, boxShadow: 'var(--shadow-md)', padding: 10
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
                            </div>
                        ) : paymentMethod !== 'bank_transfer' && (
                            <div style={{ margin: '24px 0 40px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    Таны захиалга хүлээн авлаа. Манай менежер тун удахгүй тантай холбогдож захиалгыг баталгаажуулна.
                                </p>
                            </div>
                        )}

                        {/* Payment Status Indicator */}
                        {paymentMethod === 'bank_transfer' && !paymentConfirmed && (
                            <div className="animate-fade-in" style={{
                                margin: '12px 0 16px',
                                background: 'linear-gradient(135deg, #fef9c3, #fef3c7)',
                                border: '1px solid #f59e0b33',
                                borderRadius: 16,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    border: '3px solid #f59e0b',
                                    borderTopColor: 'transparent',
                                    animation: 'paymentSpin 1s linear infinite',
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#92400e', marginBottom: 1 }}>
                                        Төлбөр хүлээж байна...
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#a16207', lineHeight: 1.3 }}>
                                        Шилжүүлэг хийсний дараа автоматаар баталгаажна
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'bank_transfer' && paymentConfirmed && (
                            <div className="animate-fade-in" style={{
                                margin: '12px 0 16px',
                                background: 'linear-gradient(135deg, #dcfce7, #d1fae5)',
                                border: '1px solid #4ade8033',
                                borderRadius: 16,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#4BB543', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}>
                                    <CheckCircle size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: 1 }}>
                                        Төлбөр баталгаажсан ✅
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#15803d', lineHeight: 1.3 }}>
                                        Таны шилжүүлэг амжилттай хүлээн авлаа
                                    </div>
                                </div>
                            </div>
                        )}

                        <button className="btn btn-primary gradient-btn" onClick={() => navigate(`/${slug}`)} style={{ width: '100%', height: 48, borderRadius: 14, fontSize: '0.95rem', fontWeight: 800 }}>
                            Дэлгүүр рүү буцах
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes shimmer {
                        0% { background-position: 0% 0%; }
                        100% { background-position: 200% 0%; }
                    }
                    @keyframes popIn {
                        0% { transform: scale(0.3); opacity: 0; }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes paymentSpin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // ──────── EMPTY CART ────────
    if (items.length === 0) {
        return (
            <div className="store-bg" style={{ minHeight: '100vh', padding: 40, textAlign: 'center' }}>
                <h2>Таны сагс хоосон байна</h2>
                <button className="btn btn-outline" onClick={() => navigate(`/${slug}`)} style={{ marginTop: 20 }}>Буцах</button>
            </div>
        );
    }

    const isFormValid = customerName.trim() && customerPhone.length === 8;

    // ──────── CHECKOUT FORM ────────
    return (
        <div className="store-bg" style={{ minHeight: '100vh', paddingBottom: 60 }}>
            <nav className="store-nav" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-1)', padding: 0 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <button className="btn btn-ghost" onClick={() => navigate(`/${slug}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                        <ChevronLeft size={20} /> Буцах
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Тооцоо хийх</div>
                    <div style={{ width: 60 }}></div>
                </div>
            </nav>

            <main className="store-container" style={{ maxWidth: 1100, marginTop: 40, margin: '40px auto 0' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'start' }} className="checkout-grid">

                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Delivery Info */}
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
                                    <input className="input" name="name" required value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ height: 48, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-primary)' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Утасны дугаар *</label>
                                    <input
                                        className="input"
                                        name="phone"
                                        required
                                        type="tel"
                                        maxLength={8}
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                        onFocus={() => setPhoneError(false)}
                                        style={{
                                            height: 48, borderRadius: 12, background: 'var(--bg-soft)',
                                            border: `1px solid ${phoneError ? '#ff4d4f' : 'var(--border-primary)'}`,
                                            boxShadow: phoneError ? '0 0 0 2px rgba(255, 77, 79, 0.1)' : 'none'
                                        }}
                                    />
                                    {phoneError && <span style={{ color: '#ff4d4f', fontSize: '0.75rem', marginTop: 4, fontWeight: 600 }}>8 оронтой тоо оруулна уу</span>}
                                </div>
                            </div>

                            {/* Delivery Options */}
                            {hasReadyItems ? (
                                <>
                                    <div style={{
                                        padding: '16px 20px', borderRadius: 16,
                                        background: isDeliveryRequested ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-soft)',
                                        border: `1px solid ${isDeliveryRequested ? 'var(--primary)' : 'var(--border-color)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: 24, cursor: 'pointer', transition: 'all 0.2s ease'
                                    }} onClick={() => setIsDeliveryRequested(!isDeliveryRequested)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 4,
                                                border: `2px solid ${isDeliveryRequested ? 'var(--primary)' : 'var(--text-muted)'}`,
                                                background: isDeliveryRequested ? 'var(--primary)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                            }}>
                                                {isDeliveryRequested && <CheckCircle size={14} />}
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isDeliveryRequested ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Хүргүүлэх үү? (Бэлэн бараа)</span>
                                        </div>
                                        <Truck size={18} style={{ color: isDeliveryRequested ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    </div>

                                    {isDeliveryRequested && (
                                        <div className="animate-fade-in">
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
                                                <textarea
                                                    className="input"
                                                    name="address"
                                                    required
                                                    rows={3}
                                                    onChange={(e) => handleAddressChange(e.target.value)}
                                                    placeholder="Дүүрэг, Хороо, Хотхон/Байр, Орц, Давхар, Тоот..."
                                                    style={{ borderRadius: 12, padding: 16, background: 'var(--bg-soft)', resize: 'none', border: '1px solid var(--border-primary)' }}
                                                ></textarea>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : hasPreorderItems ? (
                                <div style={{ padding: '20px', borderRadius: 16, background: 'var(--bg-soft)', border: '1px dotted var(--border-color)', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>Захиалгын бараа тул хүргэлтийн сонголтгүй.</p>
                                </div>
                            ) : null}
                        </div>

                        {/* ──────── PAYMENT METHOD ──────── */}
                        <div className="settings-card animate-slide-up" style={{ padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-1)', animationDelay: '0.1s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={22} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Төлбөрийн хэлбэр</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* Bank Transfer - Active */}
                                <div
                                    onClick={() => setPaymentMethod('bank_transfer')}
                                    style={{
                                        padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                                        border: `2px solid ${paymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--border-color)'}`,
                                        background: paymentMethod === 'bank_transfer' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-1)',
                                        display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: paymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--bg-soft)',
                                        color: paymentMethod === 'bank_transfer' ? '#fff' : 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Landmark size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Банкны шилжүүлэг</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>Дансаар шилжүүлэг хийх</div>
                                    </div>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        border: `2px solid ${paymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--border-color)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {paymentMethod === 'bank_transfer' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </div>
                                </div>

                                {/* QPay - Coming Soon */}
                                <div style={{
                                    padding: '16px 20px', borderRadius: 16,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-soft)',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    opacity: 0.5, cursor: 'not-allowed',
                                }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <QrCode size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>QPay</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>QR кодоор төлөх</div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                                        background: 'var(--bg-secondary)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>Тун удахгүй</span>
                                </div>

                                {/* Social Pay - Coming Soon */}
                                <div style={{
                                    padding: '16px 20px', borderRadius: 16,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-soft)',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    opacity: 0.5, cursor: 'not-allowed',
                                }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Smartphone size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-secondary)' }}>Social Pay</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>Аппликейшнээр төлөх</div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                                        background: 'var(--bg-secondary)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
                                    }}>Тун удахгүй</span>
                                </div>
                            </div>

                            {/* Bank Transfer Details */}
                            {paymentMethod === 'bank_transfer' && enabledBanks.length > 0 && (
                                <div className="animate-fade-in" style={{ marginTop: 20 }}>
                                    {/* Bank selector */}
                                    {enabledBanks.length > 1 && (
                                        <div className="input-group" style={{ marginBottom: 16 }}>
                                            <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Банк сонгох</label>
                                            <select
                                                className="input"
                                                value={selectedBank?.id || ''}
                                                onChange={e => setSelectedBankId(e.target.value)}
                                                style={{ height: 48, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-primary)' }}
                                            >
                                                {enabledBanks.map(b => (
                                                    <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Selected bank details card */}
                                    {selectedBank && (
                                        <div style={{
                                            padding: 20, borderRadius: 16,
                                            background: 'var(--bg-soft)',
                                            border: '1px solid var(--border-primary)',
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Банк:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedBank.bankName}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Данс:</span>
                                                    <span
                                                        style={{ fontWeight: 700, letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        onClick={() => copyToClipboard(selectedBank.accountNumber, 'Дансны дугаар')}
                                                    >
                                                        {selectedBank.accountNumber}
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                                    </span>
                                                </div>
                                                {selectedBank.iban && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>IBAN:</span>
                                                        <span
                                                            style={{ fontWeight: 700, letterSpacing: '0.03em', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                            onClick={() => copyToClipboard(selectedBank.iban!, 'IBAN')}
                                                        >
                                                            {selectedBank.iban}
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Хүлээн авагч:</span>
                                                    <span style={{ fontWeight: 700 }}>{selectedBank.accountName}</span>
                                                </div>
                                            </div>

                                            {/* Reference Code */}
                                            <div style={{
                                                marginTop: 16, paddingTop: 16,
                                                borderTop: '1px dashed var(--border-color)',
                                                textAlign: 'center',
                                            }}>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                                                    ГҮЙЛГЭЭНИЙ УТГА ДЭЭР БИЧНЭ ҮҮ
                                                </p>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 10,
                                                    background: 'var(--surface-1)', borderRadius: 12, padding: '10px 20px',
                                                    border: '2px dashed var(--primary)',
                                                }}>
                                                    <span style={{
                                                        fontSize: '1.6rem', fontWeight: 900,
                                                        letterSpacing: '0.15em', color: 'var(--primary)',
                                                        fontFamily: 'monospace',
                                                    }}>
                                                        {refCode}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={copyRefCode}
                                                        style={{
                                                            background: copied ? '#4BB543' : 'var(--primary)',
                                                            color: '#fff', border: 'none', borderRadius: 8,
                                                            padding: '6px 12px', fontWeight: 700, fontSize: '0.8rem',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentMethod === 'bank_transfer' && enabledBanks.length === 0 && (
                                <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'var(--bg-soft)', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Банкны данс тохируулаагүй байна.</p>
                                </div>
                            )}
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
                            <button type="submit" className="btn btn-primary gradient-btn premium-btn" style={{ width: '100%', height: 56, fontSize: '1.1rem', borderRadius: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s ease', opacity: !isFormValid ? 0.5 : 1 }} disabled={loading || !isFormValid}>
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
                `}
                </style>
            </main>
        </div>
    );
}
