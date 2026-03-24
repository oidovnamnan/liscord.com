import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useCartStore } from '../../store';
import { orderService } from '../../services/db';
import { qpayService, type QPayInvoiceResponse } from '../../services/qpay';
import { ChevronLeft, CheckCircle, MapPin, Truck, ImageIcon, ShieldCheck, CreditCard, QrCode, Landmark, Copy, Check, Smartphone, PartyPopper } from 'lucide-react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Business, Order } from '../../types';
import { toast } from 'react-hot-toast';
import { StockInquiryPopup } from './StockInquiryPopup';

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

    // Stock Inquiry
    const [showInquiryPopup, setShowInquiryPopup] = useState(false);
    const pendingFormRef = useRef<HTMLFormElement | null>(null);

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qpay' | 'social_pay'>('qpay');
    const [selectedBankId, setSelectedBankId] = useState<string>('');

    const hasReadyItems = items.some(item => item.product.productType === 'ready');
    const hasPreorderItems = items.some(item => item.product.productType === 'preorder');

    const [isDeliveryRequested, setIsDeliveryRequested] = useState(hasReadyItems);
    const [deliveryZone, setDeliveryZone] = useState('ub_center');
    const [cargoPaymentTiming, setCargoPaymentTiming] = useState<'with_order' | 'on_arrival'>('on_arrival');

    const deliveryFees: Record<string, { label: string, fee: number }> = {
        'ub_center': { label: 'Улаанбаатар (А бүс)', fee: 5000 },
        'ub_far': { label: 'Улаанбаатар (Б бүс)', fee: 8000 },
        'local_cargo': { label: 'Орон нутаг (Унаанд тавих)', fee: 0 }
    };

    // Cargo fee calculation: sum of each item's cargoFee.amount × quantity (skip if isIncluded)
    const totalCargoFee = useMemo(() => {
        return items.reduce((sum, item) => {
            const cf = item.product.cargoFee;
            if (!cf || !cf.amount || cf.isIncluded) return sum;
            return sum + cf.amount * item.quantity;
        }, 0);
    }, [items]);

    const currentFee = isDeliveryRequested ? deliveryFees[deliveryZone].fee : 0;
    const cargoInTotal = cargoPaymentTiming === 'with_order' ? totalCargoFee : 0;
    const finalTotal = totalAmount() + currentFee + cargoInTotal;

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

        // Check if stock-inquiry module is enabled
        const biz = business as any;
        const hasSIModule = !!(biz.moduleSubscriptions?.['stock-inquiry']) || 
                            !!(biz.activeModules?.includes?.('stock-inquiry'));
        const siEnabled = biz.settings?.stockInquiry?.enabled;

        if (hasSIModule && siEnabled && !showInquiryPopup) {
            pendingFormRef.current = e.currentTarget;
            setShowInquiryPopup(true);
            return;
        }

        await executeOrder(name, phone, address);
    };

    const executeOrder = async (name: string, phone: string, address: string) => {
        setLoading(true);
        try {
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
                    cargoFee: totalCargoFee,
                    cargoIncluded: cargoPaymentTiming === 'with_order',
                    cargoPaymentTiming,
                    cargoPaymentStatus: totalCargoFee > 0 ? (cargoPaymentTiming === 'with_order' ? 'paid' : 'unpaid') : 'paid',
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
            window.scrollTo(0, 0);

            if (name) localStorage.setItem(`customer_name_${business.id}`, name);
            if (phone) localStorage.setItem(`customer_phone_${business.id}`, phone);

            if (business.settings?.qpay?.enabled && paymentMethod === 'qpay') {
                try {
                    const qpaySettings = business.settings?.qpay;
                    const invoice = await qpayService.createInvoice(
                        business.id,
                        newId,
                        finalTotal,
                        `${business.name} захиалга #${newId.slice(-4)}`,
                        phone,
                        'product',
                        {
                            username: qpaySettings?.username || '',
                            password: qpaySettings?.password || '',
                            invoiceCode: qpaySettings?.invoiceCode || '',
                        }
                    );
                    setQpayInvoice(invoice);

                    // Save invoice_id to order for callback verification
                    if (invoice.invoice_id) {
                        await updateDoc(doc(db, `businesses/${business.id}/orders`, newId), {
                            qpayInvoiceId: invoice.invoice_id,
                        });
                    }
                } catch (e) {
                    console.error('QPay generation failed', e);
                }
            }

            setSuccessId(newId);
            clearCart();
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

    // ──────── POLL QPAY PAYMENT STATUS ────────
    // Uses server-side qpay-callback with Admin SDK for reliable order updates + membership.
    useEffect(() => {
        if (!qpayInvoice?.invoice_id || !successId || !business?.id || paymentConfirmed) return;

        let stopped = false;
        const poll = async () => {
            if (stopped || paymentConfirmed) return;
            try {
                // Call qpay-callback (Admin SDK) — verifies payment + updates order server-side
                const resp = await fetch(`/api/qpay-callback?bizId=${encodeURIComponent(business.id)}&orderId=${encodeURIComponent(successId)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await resp.json();
                if ((data.message === 'Payment confirmed' || data.message === 'Already paid') && !stopped) {
                    stopped = true;
                    setPaymentConfirmed(true);
                    toast.success('Төлбөр баталгаажлаа! 🎉');
                }
            } catch (e) {
                console.error('QPay poll error', e);
            }
        };

        // Poll every 3 seconds
        const interval = setInterval(poll, 3000);
        // First check after 2 seconds
        const timeout = setTimeout(poll, 2000);

        return () => {
            stopped = true;
            clearInterval(interval);
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qpayInvoice?.invoice_id, successId, business?.id, paymentConfirmed]);

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
                        ) : !qpayInvoice && (
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
                            <div className="animate-fade-in" style={{ margin: '20px 0', background: 'var(--bg-soft)', padding: '24px 20px', borderRadius: 24, border: '1px solid var(--border-primary)' }}>
                                <p style={{ fontWeight: 800, marginBottom: 6, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Төлбөр төлөх</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>Банкны апп-аа сонгоно уу</p>

                                {/* Bank app deeplinks — prominent grid */}
                                {qpayInvoice.urls.length > 0 && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: 10,
                                        marginBottom: 20,
                                    }}>
                                        {qpayInvoice.urls.map(url => (
                                            <a
                                                key={url.name}
                                                href={url.link}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '12px 4px',
                                                    borderRadius: 16,
                                                    border: '1px solid var(--border-color)',
                                                    background: 'var(--surface-1)',
                                                    textDecoration: 'none',
                                                    color: 'var(--text-primary)',
                                                    transition: 'all 0.2s ease',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {url.logo ? (
                                                    <img src={url.logo} alt={url.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
                                                ) : (
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏦</div>
                                                )}
                                                <span style={{ fontSize: '0.62rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                                                    {url.description || url.name}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* QR code — smaller, below as fallback */}
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Эсвэл QR код уншуулах</p>
                                    <div style={{
                                        width: 160, height: 160, margin: '0 auto',
                                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1.5px solid var(--border-color)', borderRadius: 16, padding: 8
                                    }}>
                                        {qpayInvoice.qr_image ? (
                                            <img src={`data:image/png;base64,${qpayInvoice.qr_image}`} alt="QPay QR" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ачааллаж байна...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : paymentMethod !== 'bank_transfer' && (
                            <div style={{ margin: '24px 0 40px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    Таны захиалга хүлээн авлаа. Манай менежер тун удахгүй тантай холбогдож захиалгыг баталгаажуулна.
                                </p>
                            </div>
                        )}

                        {/* QPay Payment Status */}
                        {qpayInvoice && !paymentConfirmed && (
                            <div className="animate-fade-in" style={{
                                margin: '12px 0 16px',
                                background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
                                border: '1px solid #8b5cf633',
                                borderRadius: 16,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    border: '3px solid #8b5cf6',
                                    borderTopColor: 'transparent',
                                    animation: 'paymentSpin 1s linear infinite',
                                    flexShrink: 0,
                                }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#5b21b6', marginBottom: 1 }}>
                                        QPay төлбөр хүлээж байна...
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#6d28d9', lineHeight: 1.3 }}>
                                        QR уншуулсны дараа автоматаар баталгаажна
                                    </div>
                                </div>
                            </div>
                        )}

                        {qpayInvoice && paymentConfirmed && (
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
                                        QPay төлбөр баталгаажсан ✅
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#15803d', lineHeight: 1.3 }}>
                                        Таны төлбөр амжилттай хүлээн авлаа
                                    </div>
                                </div>
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
    if (items.length === 0 && !loading) {
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
        <div className="store-bg checkout-page" style={{ minHeight: '100vh', paddingBottom: 120, overflow: 'hidden' }}>
            <nav className="store-nav" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-1)', padding: 0 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <button className="btn btn-ghost" onClick={() => navigate(`/${slug}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
                        <ChevronLeft size={20} /> Буцах
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Тооцоо хийх</div>
                    <div style={{ width: 60 }}></div>
                </div>
            </nav>

            <main className="store-container" style={{ maxWidth: 1100, marginTop: 24, margin: '24px auto 0' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'start' }} className="checkout-grid">

                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Delivery Info */}
                        <div className="settings-card animate-slide-up" style={{ padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-1)' }}>
                            <div className="checkout-section-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                <div className="checkout-section-icon" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={22} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Захиалагчийн мэдээлэл</h2>
                            </div>

                            <div className="grid-2-gap" style={{ marginBottom: 20 }}>
                                <div className="input-group">
                                    <label className="input-label checkout-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Захиалагчийн нэр *</label>
                                    <input className="input" name="name" required placeholder="Захиалагчийн нэр" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ height: 48, borderRadius: 12, background: 'var(--bg-soft)', border: '1px solid var(--border-primary)' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label checkout-label" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Утасны дугаар *</label>
                                    <input
                                        className="input"
                                        name="phone"
                                        required
                                        type="tel"
                                        maxLength={8}
                                        placeholder="Утасны дугаар"
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
                            ) : null}
                        </div>

                        {/* ──────── PAYMENT METHOD ──────── */}
                        <div className="settings-card animate-slide-up" style={{ padding: 32, borderRadius: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', background: 'var(--surface-1)', animationDelay: '0.1s' }}>
                            <div className="checkout-section-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div className="checkout-section-icon" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={22} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Төлбөрийн хэлбэр</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* QPay - Primary */}
                                <div
                                    className="payment-option"
                                    onClick={() => setPaymentMethod('qpay')}
                                    style={{
                                        padding: '16px 20px', borderRadius: 16, cursor: 'pointer',
                                        border: `2px solid ${paymentMethod === 'qpay' ? 'var(--primary)' : 'var(--border-color)'}`,
                                        background: paymentMethod === 'qpay' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-1)',
                                        display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div className="payment-option-icon" style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: paymentMethod === 'qpay' ? 'var(--primary)' : 'var(--bg-soft)',
                                        color: paymentMethod === 'qpay' ? '#fff' : 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <QrCode size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>QPay</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>QR кодоор төлөх</div>
                                    </div>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        border: `2px solid ${paymentMethod === 'qpay' ? 'var(--primary)' : 'var(--border-color)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {paymentMethod === 'qpay' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </div>
                                </div>

                                {/* Bank Transfer - Secondary / Collapsible */}
                                <div style={{ borderRadius: 16, border: `2px solid ${paymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--border-color)'}`, overflow: 'hidden', transition: 'all 0.2s ease' }}>
                                    <div
                                        className="payment-option"
                                        onClick={() => setPaymentMethod('bank_transfer')}
                                        style={{
                                            padding: '16px 20px', cursor: 'pointer',
                                            background: paymentMethod === 'bank_transfer' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface-1)',
                                            display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <div className="payment-option-icon" style={{
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

                                    {/* Bank details — shown only when bank_transfer selected */}
                                    {paymentMethod === 'bank_transfer' && enabledBanks.length > 0 && (
                                        <div className="animate-fade-in" style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-color)' }}>
                                            {enabledBanks.length > 1 && (
                                                <div className="input-group" style={{ marginTop: 16, marginBottom: 12 }}>
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

                                            {selectedBank && (
                                                <div className="bank-details-card" style={{
                                                    padding: 16, borderRadius: 12, marginTop: 12,
                                                    background: 'var(--bg-soft)',
                                                    border: '1px solid var(--border-primary)',
                                                }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Банк:</span>
                                                            <span style={{ fontWeight: 700 }}>{selectedBank.bankName}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
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
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>IBAN:</span>
                                                                <span
                                                                    style={{ fontWeight: 700, letterSpacing: '0.03em', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                                                    onClick={() => copyToClipboard(selectedBank.iban!, 'IBAN')}
                                                                >
                                                                    {selectedBank.iban}
                                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Хүлээн авагч:</span>
                                                            <span style={{ fontWeight: 700 }}>{selectedBank.accountName}</span>
                                                        </div>
                                                    </div>

                                                    {/* Reference Code */}
                                                    <div style={{
                                                        marginTop: 12, paddingTop: 12,
                                                        borderTop: '1px dashed var(--border-color)',
                                                        textAlign: 'center',
                                                    }}>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>
                                                            ГҮЙЛГЭЭНИЙ УТГА ДЭЭР БИЧНЭ ҮҮ
                                                        </p>
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 10,
                                                            background: 'var(--surface-1)', borderRadius: 10, padding: '8px 16px',
                                                            border: '2px dashed var(--primary)',
                                                        }}>
                                                            <span style={{
                                                                fontSize: '1.4rem', fontWeight: 900,
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
                                                                    padding: '5px 10px', fontWeight: 700, fontSize: '0.75rem',
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                                    transition: 'all 0.2s',
                                                                }}
                                                            >
                                                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {enabledBanks.length === 0 && (
                                                <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: 'var(--bg-soft)', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>Банкны данс тохируулаагүй байна.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Social Pay - Hidden on mobile */}
                                <div className="payment-disabled" style={{
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
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="settings-card summary-sidebar animate-slide-up" style={{ padding: 0, borderRadius: 24, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', background: 'var(--surface-1)', overflow: 'hidden', animationDelay: '0.2s', position: 'sticky', top: 100 }}>
                        <div className="summary-header" style={{ padding: '24px 32px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Захиалгын хураангуй ({totalItems()})</h2>
                        </div>

                        <div className="summary-items custom-scrollbar" style={{ padding: '24px 32px', maxHeight: '45vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {items.map((item, idx) => (
                                    <div key={`${item.product.id}-${idx}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div className="summary-item-image" style={{ width: 64, height: 64, flexShrink: 0, position: 'relative' }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: 12, background: 'var(--bg-soft)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                {item.product.images?.[0] ? (
                                                    <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="summary-item-badge" style={{ position: 'absolute', top: -8, right: -8, background: 'var(--text-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-1)', zIndex: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="summary-item-name" style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{item.product.name}</div>
                                            {item.variant && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{Object.values(item.variant).join(' - ')}</div>}
                                            <div className="summary-item-price" style={{ fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{(item.price * item.quantity).toLocaleString()} ₮</div>
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
                            {currentFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                <span style={{ fontWeight: 500 }}>Хүргэлтийн төлбөр:</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currentFee.toLocaleString()} ₮</span>
                            </div>
                            )}

                            {/* Cargo Fee Section */}
                            {totalCargoFee > 0 && (
                                <div className="cargo-fee-section" style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>📦 Карго:</span>
                                        <span style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem' }}>{totalCargoFee.toLocaleString()} ₮</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <label
                                            className="cargo-radio-option"
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                                padding: '8px 10px', borderRadius: 10,
                                                background: cargoPaymentTiming === 'on_arrival' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0,0,0,0.02)',
                                                border: `1.5px solid ${cargoPaymentTiming === 'on_arrival' ? '#d97706' : 'transparent'}`,
                                                transition: 'all 0.15s'
                                            }}
                                            onClick={() => setCargoPaymentTiming('on_arrival')}
                                        >
                                            <div style={{
                                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${cargoPaymentTiming === 'on_arrival' ? '#d97706' : '#ccc'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {cargoPaymentTiming === 'on_arrival' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706' }} />}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>Дараа төлөх</span>
                                        </label>
                                        <label
                                            className="cargo-radio-option"
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                                padding: '8px 10px', borderRadius: 10,
                                                background: cargoPaymentTiming === 'with_order' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0,0,0,0.02)',
                                                border: `1.5px solid ${cargoPaymentTiming === 'with_order' ? 'var(--primary)' : 'transparent'}`,
                                                transition: 'all 0.15s'
                                            }}
                                            onClick={() => setCargoPaymentTiming('with_order')}
                                        >
                                            <div style={{
                                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${cargoPaymentTiming === 'with_order' ? 'var(--primary)' : '#ccc'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {cargoPaymentTiming === 'with_order' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />}
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>Одоо хамт</span>
                                        </label>
                                    </div>
                                    {cargoPaymentTiming === 'on_arrival' && (
                                        <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.08)', fontSize: '0.68rem', color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
                                            ⚠ {totalCargoFee.toLocaleString()}₮ бараа ирэхэд тусад нь төлнө
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px dashed var(--border-primary)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)' }} className="summary-total-row">
                                <span>Нийт төлөх:</span>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--primary)' }}>{finalTotal.toLocaleString()} ₮</div>
                                    {totalCargoFee > 0 && cargoPaymentTiming === 'on_arrival' && (
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#d97706', marginTop: 2 }}>+ карго {totalCargoFee.toLocaleString()}₮ (дараа)</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="summary-footer" style={{ padding: '24px 32px', background: 'var(--surface-1)' }}>
                            <button type="submit" className="btn btn-primary gradient-btn premium-btn summary-submit-btn" style={{ width: '100%', height: 56, fontSize: '1.1rem', borderRadius: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s ease', opacity: !isFormValid ? 0.5 : 1 }} disabled={loading || !isFormValid}>
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
                            gap: 12px !important;
                        }
                        .summary-sidebar {
                            position: static !important;
                            margin-top: 0 !important;
                        }
                    }
                    @media (max-width: 768px) {
                        .checkout-page {
                            min-height: auto !important;
                            padding-bottom: 0 !important;
                        }
                        .checkout-page .store-container {
                            margin-top: 0 !important;
                            padding-top: 8px !important;
                            padding-bottom: 8px !important;
                        }
                        .checkout-grid .grid-2-gap {
                            gap: 12px !important;
                            row-gap: 12px !important;
                        }
                        .checkout-grid .input-group + .input-group {
                            margin-top: 12px !important;
                        }
                        .checkout-grid .settings-card {
                            padding: 16px !important;
                            border-radius: 16px !important;
                            box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
                            border: 1px solid rgba(0,0,0,0.06) !important;
                        }
                        .checkout-grid .settings-card h2 {
                            font-size: 1rem !important;
                        }
                        /* Hide section header icons on mobile */
                        .checkout-section-icon {
                            display: none !important;
                        }
                        /* Compact section headers */
                        .checkout-section-header {
                            margin-bottom: 14px !important;
                            gap: 0 !important;
                        }
                        /* Hide input labels on mobile — use placeholders */
                        .checkout-label {
                            display: none !important;
                        }
                        /* Compact inputs */
                        .checkout-grid .input-group {
                            margin-bottom: 0 !important;
                        }
                        .checkout-grid .grid-2-gap {
                            gap: 10px !important;
                            margin-bottom: 12px !important;
                        }
                        .checkout-grid .input {
                            height: 42px !important;
                            font-size: 0.9rem !important;
                        }
                        .checkout-grid .input-label {
                            font-size: 0.72rem !important;
                            margin-bottom: 4px !important;
                        }
                        /* Hide disabled payment methods */
                        .payment-disabled {
                            display: none !important;
                        }
                        /* Compact payment option */
                        .payment-option {
                            padding: 12px 14px !important;
                            border-radius: 12px !important;
                        }
                        .payment-option-icon {
                            width: 34px !important;
                            height: 34px !important;
                            border-radius: 8px !important;
                        }
                        /* Compact bank details */
                        .bank-details-card {
                            padding: 14px !important;
                            border-radius: 12px !important;
                        }
                        /* Compact summary */
                        .summary-sidebar {
                            border-radius: 16px !important;
                        }
                        .summary-sidebar > div {
                            padding-left: 16px !important;
                            padding-right: 16px !important;
                        }
                        .summary-item-image {
                            width: 48px !important;
                            height: 48px !important;
                        }
                        .summary-item-badge {
                            min-width: 18px !important;
                            height: 18px !important;
                            font-size: 0.65rem !important;
                            top: -6px !important;
                            right: -6px !important;
                        }
                        .summary-item-name {
                            font-size: 0.85rem !important;
                        }
                        .summary-item-price {
                            font-size: 0.85rem !important;
                        }
                        .summary-total-row {
                            font-size: 1.15rem !important;
                            padding-top: 12px !important;
                        }
                        .summary-submit-btn {
                            height: 48px !important;
                            font-size: 0.95rem !important;
                            border-radius: 12px !important;
                        }
                        .summary-footer {
                            padding: 16px !important;
                        }
                        .summary-footer p {
                            margin-top: 10px !important;
                            font-size: 0.72rem !important;
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

                {/* Stock Inquiry Popup */}
                {showInquiryPopup && (
                    <StockInquiryPopup
                        businessId={business.id}
                        cartItems={items.map(i => ({
                            productId: i.product.id,
                            productName: i.product.name,
                            productImage: i.product.images?.[0] || null,
                            currentPrice: i.price,
                        }))}
                        customerPhone={customerPhone}
                        timeoutSeconds={(business.settings as any)?.stockInquiry?.timeoutSeconds || 60}
                        inactiveDays={(business.settings as any)?.stockInquiry?.inactiveDays || 30}
                        onProceed={() => {
                            setShowInquiryPopup(false);
                            // Re-submit the form
                            const form = pendingFormRef.current;
                            if (form) {
                                const fd = new FormData(form);
                                const name = fd.get('name') as string || customerName;
                                const phone = (fd.get('phone') as string || customerPhone).replace(/\D/g, '');
                                const address = fd.get('address') as string || '';
                                executeOrder(name, phone, address);
                            }
                        }}
                        onCancel={() => {
                            setShowInquiryPopup(false);
                            toast('Захиалга цуцлагдлаа', { icon: '🚫' });
                        }}
                    />
                )}
            </main>
        </div>
    );
}
