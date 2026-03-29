import { useState, useEffect, useRef } from 'react';
import { X, User, Crown, Package, MapPin, Bell, Clock, CheckCircle, AlertTriangle, RefreshCw, Phone, Loader2, Edit3, MessageSquare, Send, Ticket, Copy, Check, Gift, Sparkles } from 'lucide-react';
import type { Business } from '../../types';
import { Timestamp } from 'firebase/firestore';

interface CustomerDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    business: Business;
    phone: string; // may be empty if not logged in
    onOpenMembership?: () => void;
    onLogin?: (phone: string) => void;
}

interface MembershipDetail {
    id: string;
    categoryId: string;
    categoryName?: string;
    expiresAt: Date;
    purchasedAt: Date;
    amountPaid: number;
    status: 'active' | 'expired';
    daysRemaining: number;
}

interface OrderItem {
    id: string;
    orderNumber?: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: Date;
    items?: { name: string; quantity: number; price: number }[];
}

interface CustomerAddress {
    locationType: 'city' | 'rural';
    district: string;
    subDistrict: string;
    building: string;
    floor: string;
    entrance: string;
    doorCode: string;
    notes: string;
}

type TabKey = 'profile' | 'orders' | 'address' | 'notifications';

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: 'orders', label: 'Захиалга', icon: Package },
    { key: 'profile', label: 'Бүртгэл', icon: User },
    { key: 'address', label: 'Хаяг', icon: MapPin },
    { key: 'notifications', label: 'Мэдэгдэл', icon: Bell },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Хүлээгдэж буй', color: '#e67e22', bg: '#fef3e2' },
    processing: { label: 'Бэлтгэж байна', color: '#3498db', bg: '#ebf5fb' },
    paid: { label: 'Төлбөр хийгдсэн', color: '#27ae60', bg: '#eafaf1' },
    delivered: { label: 'Хүргэгдсэн', color: '#2ecc71', bg: '#e8f8f0' },
    cancelled: { label: 'Цуцлагдсан', color: '#e74c3c', bg: '#fdecea' },
};

export function CustomerDashboard({ isOpen, onClose, business, phone, onOpenMembership, onLogin }: CustomerDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('orders');
    const [memberships, setMemberships] = useState<MembershipDetail[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [address, setAddress] = useState<CustomerAddress>({
        locationType: 'city', district: '', subDistrict: '', building: '', floor: '', entrance: '', doorCode: '', notes: ''
    });
    const [loadingMemberships, setLoadingMemberships] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [addressSaved, setAddressSaved] = useState(false);

    // Promo code generation
    const [promoCredits, setPromoCredits] = useState<{ used: number; total: number; codes: string[] }>({ used: 0, total: 5, codes: [] });
    const [promoGenLoading, setPromoGenLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<{ code: string; percent: number } | null>(null);
    const [promoCopied, setPromoCopied] = useState(false);
    const [promoUserCodes, setPromoUserCodes] = useState<{ code: string; value: number; isActive: boolean }[]>([]);

    // ═══ Login state (built-in OTP) ═══
    const [loginPhone, setLoginPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confirmation, setConfirmation] = useState<any>(null);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recaptchaVerifierRef = useRef<any>(null);

    // ═══ Name collection (first login) ═══
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [editingName, setEditingName] = useState(false);

    // Derive effective phone (from prop or after login)
    const [loggedInPhone, setLoggedInPhone] = useState(phone);
    const effectivePhone = loggedInPhone || phone;
    const isLoggedIn = !!effectivePhone;

    // Normalize phone for display and queries — always 8 digits without 976
    const normalizePhone = (p: string) => p.replace(/[^\d]/g, '').replace(/^976/, '');
    const displayPhone = normalizePhone(effectivePhone);

    // Sync phone prop
    useEffect(() => {
        if (phone) setLoggedInPhone(phone);
    }, [phone]);

    // Load saved customer name
    useEffect(() => {
        if (!effectivePhone || !business?.id) return;
        const savedName = localStorage.getItem(`customer_name_${business.id}_${normalizePhone(effectivePhone)}`);
        if (savedName) setCustomerName(savedName);
    }, [effectivePhone, business?.id]);

    // Load memberships
    useEffect(() => {
        if (!isOpen || !effectivePhone || !business?.id) return;
        loadMemberships();
    }, [isOpen, effectivePhone, business?.id]);

    // Load address from localStorage
    useEffect(() => {
        if (!business?.id || !effectivePhone) return;
        const saved = localStorage.getItem(`customer_address_${business.id}_${normalizePhone(effectivePhone)}`);
        if (saved) {
            try { setAddress(JSON.parse(saved)); } catch { /* ignore */ }
        }
    }, [business?.id, effectivePhone]);

    const loadMemberships = async () => {
        if (!business?.id || !effectivePhone) return;
        setLoadingMemberships(true);
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            const ref = collection(db, 'businesses', business.id, 'memberships');
            const q = query(ref, where('customerPhone', '==', normalizePhone(effectivePhone)));
            const snap = await getDocs(q);
            const now = new Date();
            const details: MembershipDetail[] = snap.docs.map(d => {
                const data = d.data();
                const expiresAt = data.expiresAt instanceof Timestamp
                    ? data.expiresAt.toDate()
                    : new Date(data.expiresAt);
                const purchasedAt = data.purchasedAt instanceof Timestamp
                    ? data.purchasedAt.toDate()
                    : data.purchasedAt ? new Date(data.purchasedAt) : new Date();
                const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                return {
                    id: d.id,
                    categoryId: data.categoryId,
                    expiresAt,
                    purchasedAt,
                    amountPaid: data.amountPaid || 0,
                    status: (expiresAt > now ? 'active' : 'expired') as 'active' | 'expired',
                    daysRemaining,
                };
            }).sort((a, b) => (a.status === 'active' ? -1 : 1));
            setMemberships(details);
        } catch (err) {
            console.error('Load memberships:', err);
        } finally {
            setLoadingMemberships(false);
        }
    };

    // Load orders
    useEffect(() => {
        if (!isOpen || !effectivePhone || !business?.id || activeTab !== 'orders') return;
        loadOrders();
    }, [isOpen, effectivePhone, business?.id, activeTab]);

    const loadOrders = async () => {
        if (!business?.id || !effectivePhone) return;
        setLoadingOrders(true);
        try {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            const ref = collection(db, 'businesses', business.id, 'orders');
            const normalizedPhone = normalizePhone(effectivePhone);
            const q = query(ref, where('customer.phone', '==', normalizedPhone));
            const snap = await getDocs(q);
            const items: OrderItem[] = snap.docs.map(d => {
                const data = d.data();
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : data.createdAt ? new Date(data.createdAt) : new Date();
                return {
                    id: d.id,
                    orderNumber: data.orderNumber || d.id.slice(-6).toUpperCase(),
                    totalAmount: data.financials?.totalAmount || data.totalAmount || 0,
                    paymentStatus: data.paymentStatus || 'pending',
                    createdAt,
                    items: data.items || [],
                };
            }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setOrders(items);
        } catch (err) {
            console.error('Load orders:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const saveAddress = () => {
        if (!business?.id || !effectivePhone) return;
        localStorage.setItem(`customer_address_${business.id}_${normalizePhone(effectivePhone)}`, JSON.stringify(address));
        (async () => {
            try {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                const addrRef = doc(db, 'businesses', business.id, 'customer_addresses', normalizePhone(effectivePhone));
                await setDoc(addrRef, { ...address, phone: normalizePhone(effectivePhone), updatedAt: new Date().toISOString() }, { merge: true });
            } catch { /* silent */ }
        })();
        setAddressSaved(true);
        setTimeout(() => setAddressSaved(false), 2000);
    };

    const formatDate = (d: Date) => {
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatCurrency = (n: number) => `₮${n.toLocaleString()}`;

    // ═══ OTP Login Flow ═══
    const handleSendOtp = async () => {
        const cleanPhone = loginPhone.trim().replace(/[\s\-]/g, '');
        if (!cleanPhone || cleanPhone.length < 8) return;
        setAuthLoading(true);
        try {
            const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
            const { auth } = await import('../../services/firebase');
            if (!recaptchaVerifierRef.current && recaptchaRef.current) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
            }
            const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : cleanPhone.startsWith('976') ? `+${cleanPhone}` : `+976${cleanPhone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
            setConfirmation(result);
            setOtpSent(true);
        } catch (err) {
            console.error('OTP send error:', err);
            recaptchaVerifierRef.current = null;
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmation || !otpCode || otpCode.length < 6) return;
        setAuthLoading(true);
        try {
            await confirmation.confirm(otpCode);
            // Sign out to restore Firestore access (anonymous → no admin auth needed)
            try {
                const { auth } = await import('../../services/firebase');
                await auth.signOut();
            } catch { /* ignore */ }

            const cleanPhone = loginPhone.trim().replace(/[\s\-+]/g, '').replace(/^976/, '');
            const normalizedPhone = cleanPhone.replace(/[^\d]/g, '');

            // Save phone to localStorage (8-digit format to match membership records)
            localStorage.setItem(`membership_phone_${business.id}`, normalizedPhone);
            localStorage.setItem('liscord_customer_phone', normalizedPhone);

            setLoggedInPhone(normalizedPhone);
            onLogin?.(normalizedPhone);

            // Check if name exists for this phone
            const savedName = localStorage.getItem(`customer_name_${business.id}_${normalizedPhone}`);
            if (!savedName) {
                // Try Firestore
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('../../services/firebase');
                    const profileDoc = await getDoc(doc(db, 'businesses', business.id, 'customer_profiles', normalizedPhone));
                    if (profileDoc.exists() && profileDoc.data().name) {
                        const name = profileDoc.data().name;
                        setCustomerName(name);
                        localStorage.setItem(`customer_name_${business.id}_${normalizedPhone}`, name);
                    } else {
                        setShowNamePrompt(true);
                    }
                } catch {
                    setShowNamePrompt(true);
                }
            } else {
                setCustomerName(savedName);
            }
        } catch (err) {
            console.error('OTP verify error:', err);
        } finally {
            setAuthLoading(false);
        }
    };

    const saveCustomerName = async (name: string) => {
        if (!name.trim() || !business?.id || !effectivePhone) return;
        const cleanName = name.trim();
        setCustomerName(cleanName);
        localStorage.setItem(`customer_name_${business.id}_${normalizePhone(effectivePhone)}`, cleanName);
        setShowNamePrompt(false);
        setEditingName(false);
        // Save to Firestore
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            await setDoc(doc(db, 'businesses', business.id, 'customer_profiles', normalizePhone(effectivePhone)), {
                name: cleanName,
                phone: normalizePhone(effectivePhone),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch { /* silent */ }
    };

    const handleLogout = () => {
        if (effectivePhone) {
            localStorage.removeItem(`membership_phone_${business.id}`);
            localStorage.removeItem('liscord_customer_phone');
        }
        setLoggedInPhone('');
        setOtpSent(false);
        setOtpCode('');
        setLoginPhone('');
        setConfirmation(null);
        setCustomerName('');
        setShowNamePrompt(false);
        onClose();
        window.location.reload();
    };

    if (!isOpen) return null;

    const brandColor = business.brandColor || '#4a6bff';

    // ═══ Not logged in → OTP Login ═══
    if (!isLoggedIn) {
        return (
            <>
                <div className="cd-backdrop" onClick={onClose} />
                <div className="cd-drawer">
                    <div className="cd-header">
                        <div className="cd-header-user">
                            <div className="cd-avatar"><User size={22} /></div>
                            <div>
                                <div className="cd-phone">Нэвтрэх</div>
                                <div className="cd-member-badge">Утасны дугаараар нэвтрэнэ үү</div>
                            </div>
                        </div>
                        <button className="cd-close" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div className="cd-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                        <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
                            <Phone size={40} strokeWidth={1.5} style={{ color: brandColor, marginBottom: 12 }} />
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 6px' }}>Утасны дугаараар нэвтрэх</h3>
                            <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>Захиалга, хаяг, гишүүнчлэл удирдах</p>
                        </div>

                        {!otpSent ? (
                            <div style={{ width: '100%', maxWidth: 320 }}>
                                <div className="cd-form-group">
                                    <label>Утасны дугаар</label>
                                    <input
                                        type="tel"
                                        placeholder=""
                                        value={loginPhone}
                                        onChange={e => setLoginPhone(e.target.value)}
                                        maxLength={12}
                                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                        style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px', fontWeight: 700 }}
                                    />
                                </div>
                                <button
                                    className="cd-btn-primary"
                                    onClick={handleSendOtp}
                                    disabled={authLoading || loginPhone.replace(/\D/g, '').length < 8}
                                    style={{ width: '100%', marginTop: 12, background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (authLoading || loginPhone.replace(/\D/g, '').length < 8) ? 0.5 : 1 }}
                                >
                                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : 'Нэвтрэх код авах'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ width: '100%', maxWidth: 320 }}>
                                <p style={{ fontSize: '0.82rem', color: '#666', textAlign: 'center', marginBottom: 12 }}>
                                    +976{loginPhone.replace(/\D/g, '')} руу код илгээлээ
                                </p>
                                <div className="cd-form-group">
                                    <label>Баталгаажуулах код</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value)}
                                        maxLength={6}
                                        onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                        style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '6px', fontWeight: 800 }}
                                    />
                                </div>
                                <button
                                    className="cd-btn-primary"
                                    onClick={handleVerifyOtp}
                                    disabled={authLoading || otpCode.length < 6}
                                    style={{ width: '100%', marginTop: 12, background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (authLoading || otpCode.length < 6) ? 0.5 : 1 }}
                                >
                                    {authLoading ? <Loader2 size={16} className="animate-spin" /> : 'Баталгаажуулах'}
                                </button>
                                <button
                                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                                    style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#888', fontSize: '0.82rem', cursor: 'pointer' }}
                                >
                                    ← Дахин оролдох
                                </button>
                            </div>
                        )}
                        <div ref={recaptchaRef} />
                    </div>
                </div>
            </>
        );
    }

    // ═══ Name prompt (first login) ═══
    if (showNamePrompt) {
        const [nameInput, setNameInput] = [customerName, setCustomerName];
        return (
            <>
                <div className="cd-backdrop" onClick={() => {}} />
                <div className="cd-drawer">
                    <div className="cd-header">
                        <div className="cd-header-user">
                            <div className="cd-avatar"><User size={22} /></div>
                            <div>
                                <div className="cd-phone">{displayPhone}</div>
                                <div className="cd-member-badge">Бүртгэл</div>
                            </div>
                        </div>
                        <button className="cd-close" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div className="cd-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                        <div style={{ textAlign: 'center', padding: '40px 0 20px' }}>
                            <User size={40} strokeWidth={1.5} style={{ color: brandColor, marginBottom: 12 }} />
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 6px' }}>Нэрээ оруулна уу</h3>
                            <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>Захиалга хийхэд таны нэр шаардлагатай</p>
                        </div>

                        <div style={{ width: '100%', maxWidth: 320 }}>
                            <div className="cd-form-group">
                                <label>Таны нэр</label>
                                <input
                                    type="text"
                                    placeholder=""
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && saveCustomerName(nameInput)}
                                    style={{ fontSize: '1rem', fontWeight: 600 }}
                                    autoFocus
                                />
                            </div>
                            <button
                                className="cd-btn-primary"
                                onClick={() => saveCustomerName(nameInput)}
                                disabled={!nameInput.trim()}
                                style={{ width: '100%', marginTop: 12, background: brandColor, opacity: !nameInput.trim() ? 0.5 : 1 }}
                            >
                                Үргэлжлүүлэх
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ═══ Logged in — Full Dashboard ═══
    return (
        <>
            {/* Backdrop */}
            <div className="cd-backdrop" onClick={onClose} />
            {/* Drawer */}
            <div className="cd-drawer">
                {/* Header */}
                <div className="cd-header">
                    <div className="cd-header-user">
                        <div className="cd-avatar">
                            <User size={22} />
                        </div>
                        <div>
                            <div className="cd-phone">{customerName || displayPhone}</div>
                            <div className="cd-member-badge">
                                {memberships.some(m => m.status === 'active')
                                    ? <><Crown size={12} /> VIP Гишүүн</>
                                    : customerName ? displayPhone : 'Хэрэглэгч'}
                            </div>
                        </div>
                    </div>
                    <button className="cd-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="cd-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`cd-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="cd-content">
                    {activeTab === 'profile' && (
                        <div className="cd-section">
                            {/* Profile info - name edit */}
                            <h3 className="cd-section-title">Хувийн мэдээлэл</h3>
                            <div style={{ marginBottom: 20 }}>
                                <div className="cd-detail-row" style={{ marginBottom: 10 }}>
                                    <span>Нэр</span>
                                    {editingName ? (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <input
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && saveCustomerName(customerName)}
                                                style={{ height: 30, padding: '0 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem', width: 140, fontWeight: 600 }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => saveCustomerName(customerName)}
                                                style={{ height: 30, padding: '0 10px', borderRadius: 6, border: 'none', background: brandColor, color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                            >✓</button>
                                        </div>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => setEditingName(true)}>
                                            {customerName || 'Нэр оруулах'}
                                            <Edit3 size={12} style={{ color: '#999' }} />
                                        </span>
                                    )}
                                </div>
                                <div className="cd-detail-row">
                                    <span>Утас</span>
                                    <span>{displayPhone}</span>
                                </div>
                            </div>

                            {/* VIP Membership */}
                            <h3 className="cd-section-title">VIP Гишүүнчлэл</h3>
                            {loadingMemberships ? (
                                <div className="cd-loading">Ачаалж байна...</div>
                            ) : memberships.length === 0 ? (
                                <div className="cd-empty">
                                    <Crown size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                    <p>Идэвхтэй гишүүнчлэл байхгүй</p>
                                    {onOpenMembership && (
                                        <button className="cd-btn-primary" onClick={() => { onClose(); onOpenMembership(); }}>
                                            Гишүүнчлэл авах
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="cd-membership-list">
                                    {memberships.map(m => (
                                        <div key={m.id} className={`cd-membership-card ${m.status}`}>
                                            <div className="cd-membership-header">
                                                <div className="cd-membership-status">
                                                    {m.status === 'active' ? (
                                                        <><CheckCircle size={16} /> Идэвхтэй</>
                                                    ) : (
                                                        <><AlertTriangle size={16} /> Дууссан</>
                                                    )}
                                                </div>
                                                {m.status === 'active' && (
                                                    <div className="cd-days-remaining">
                                                        {m.daysRemaining} хоног үлдсэн
                                                    </div>
                                                )}
                                            </div>
                                            <div className="cd-membership-details">
                                                <div className="cd-detail-row">
                                                    <span>Эхэлсэн</span>
                                                    <span>{formatDate(m.purchasedAt)}</span>
                                                </div>
                                                <div className="cd-detail-row">
                                                    <span>Дуусах</span>
                                                    <span>{formatDate(m.expiresAt)}</span>
                                                </div>
                                                <div className="cd-detail-row">
                                                    <span>Төлсөн</span>
                                                    <span>{formatCurrency(m.amountPaid)}</span>
                                                </div>
                                            </div>
                                            {m.status === 'expired' && onOpenMembership && (
                                                <button className="cd-btn-renew" onClick={() => { onClose(); onOpenMembership(); }}>
                                                    <RefreshCw size={14} /> Сунгах
                                                </button>
                                            )}
                                            {m.status === 'active' && (
                                                <div className="cd-progress-bar">
                                                    <div className="cd-progress-fill" style={{
                                                        width: `${Math.max(5, (m.daysRemaining / 365) * 100)}%`
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="cd-section">
                            {/* Promo Code Section - MOVED TO TOP OF ORDERS AND MADE FESTIVE */}
                            <PromoCodeSection
                                business={business}
                                phone={normalizePhone(effectivePhone)}
                                brandColor={brandColor}
                            />

                            <h3 className="cd-section-title" style={{ marginTop: 24 }}>Захиалгууд</h3>
                            {loadingOrders ? (
                                <div className="cd-loading">Ачаалж байна...</div>
                            ) : orders.length === 0 ? (
                                <div className="cd-empty">
                                    <Package size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                    <p>Захиалга байхгүй</p>
                                </div>
                            ) : (
                                <div className="cd-orders-list">
                                    {orders.map(order => {
                                        const statusInfo = STATUS_LABELS[order.paymentStatus] || STATUS_LABELS.pending;
                                        return (
                                            <OrderCardWithInquiry
                                                key={order.id}
                                                order={order}
                                                statusInfo={statusInfo}
                                                business={business}
                                                customerName={customerName}
                                                customerPhone={displayPhone}
                                                formatDate={formatDate}
                                                formatCurrency={formatCurrency}
                                                brandColor={brandColor}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">Хүргэлтийн хаяг</h3>
                            <div className="cd-address-form">
                                {/* Location type toggle */}
                                <div className="cd-location-toggle">
                                    <button
                                        className={`cd-loc-btn ${address.locationType === 'city' ? 'active' : ''}`}
                                        onClick={() => setAddress(a => ({ ...a, locationType: 'city' }))}
                                    >
                                        🏙️ Улаанбаатар
                                    </button>
                                    <button
                                        className={`cd-loc-btn ${address.locationType === 'rural' ? 'active' : ''}`}
                                        onClick={() => setAddress(a => ({ ...a, locationType: 'rural' }))}
                                    >
                                        🏔️ Орон нутаг
                                    </button>
                                </div>

                                <div className="cd-form-group">
                                    <label>{address.locationType === 'city' ? 'Дүүрэг' : 'Аймаг'}</label>
                                    <input value={address.district} onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} />
                                </div>
                                <div className="cd-form-group">
                                    <label>{address.locationType === 'city' ? 'Хороо' : 'Сум, Баг'}</label>
                                    <input value={address.subDistrict} onChange={e => setAddress(a => ({ ...a, subDistrict: e.target.value }))} />
                                </div>
                                <div className="cd-form-row">
                                    <div className="cd-form-group">
                                        <label>{address.locationType === 'city' ? 'Байр / Гэр' : 'Гэрийн хаяг'}</label>
                                        <input value={address.building} onChange={e => setAddress(a => ({ ...a, building: e.target.value }))} />
                                    </div>
                                    <div className="cd-form-group">
                                        <label>Давхар</label>
                                        <input value={address.floor} onChange={e => setAddress(a => ({ ...a, floor: e.target.value }))} />
                                    </div>
                                </div>
                                {address.locationType === 'city' && (
                                    <div className="cd-form-row">
                                        <div className="cd-form-group">
                                            <label>Орц</label>
                                            <input value={address.entrance} onChange={e => setAddress(a => ({ ...a, entrance: e.target.value }))} />
                                        </div>
                                        <div className="cd-form-group">
                                            <label>Хаалганы код</label>
                                            <input value={address.doorCode} onChange={e => setAddress(a => ({ ...a, doorCode: e.target.value }))} />
                                        </div>
                                    </div>
                                )}
                                <div className="cd-form-group">
                                    <label>Нэмэлт тэмдэглэл</label>
                                    <textarea value={address.notes} onChange={e => setAddress(a => ({ ...a, notes: e.target.value }))} rows={3} />
                                </div>
                                <button className="cd-btn-primary" onClick={saveAddress}>
                                    {addressSaved ? '✓ Хадгаллаа!' : 'Хадгалах'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="cd-section">
                            <h3 className="cd-section-title">Мэдэгдэл</h3>
                            <div className="cd-notifications">
                                {memberships.filter(m => m.status === 'active' && m.daysRemaining <= 30).map(m => (
                                    <div key={`exp-${m.id}`} className="cd-notification warn">
                                        <AlertTriangle size={16} />
                                        <div>
                                            <div className="cd-notif-title">VIP хугацаа дуусахад {m.daysRemaining} хоног</div>
                                            <div className="cd-notif-time">{formatDate(m.expiresAt)} хүртэл</div>
                                        </div>
                                    </div>
                                ))}
                                {memberships.filter(m => m.status === 'active').map(m => (
                                    <div key={`active-${m.id}`} className="cd-notification success">
                                        <CheckCircle size={16} />
                                        <div>
                                            <div className="cd-notif-title">VIP гишүүнчлэл идэвхтэй</div>
                                            <div className="cd-notif-time">{formatDate(m.purchasedAt)}-д бүртгэгдсэн</div>
                                        </div>
                                    </div>
                                ))}
                                {orders.filter(o => o.paymentStatus === 'paid').slice(0, 3).map(o => (
                                    <div key={`order-${o.id}`} className="cd-notification info">
                                        <Package size={16} />
                                        <div>
                                            <div className="cd-notif-title">Захиалга #{o.orderNumber} төлбөр баталгаажсан</div>
                                            <div className="cd-notif-time">{formatDate(o.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                                {memberships.length === 0 && orders.length === 0 && (
                                    <div className="cd-empty">
                                        <Bell size={32} strokeWidth={1.5} style={{ color: '#ccc' }} />
                                        <p>Мэдэгдэл байхгүй</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="cd-footer">
                    <button className="cd-btn-logout" onClick={handleLogout}>
                        Гарах
                    </button>
                </div>
            </div>
        </>
    );
}

// ═══ Sub-component: Order card with inquiry button ═══
const QUICK_QUESTIONS = [
    'Захиалга хаана явж байна?',
    'Хэзээ ирэх вэ?',
    'Буусан уу?',
];

function OrderCardWithInquiry({ order, statusInfo, business, customerName, customerPhone, formatDate, formatCurrency, brandColor }: {
    order: { id: string; orderNumber?: string; totalAmount: number; paymentStatus: string; createdAt: Date; items?: { name: string; quantity: number; price: number }[] };
    statusInfo: { label: string; color: string; bg: string };
    business: Business;
    customerName: string;
    customerPhone: string;
    formatDate: (d: Date) => string;
    formatCurrency: (n: number) => string;
    brandColor: string;
}) {
    const [showForm, setShowForm] = useState(false);
    const [question, setQuestion] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [prevInquiries, setPrevInquiries] = useState<any[]>([]);

    // Load previous inquiries for this order
    useEffect(() => {
        if (!business?.id || !order.id) return;
        (async () => {
            try {
                const { collection, query, where, getDocs, orderBy: fbOrderBy } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');
                const q = query(
                    collection(db, 'businesses', business.id, 'orderInquiries'),
                    where('orderId', '==', order.id),
                    fbOrderBy('createdAt', 'desc')
                );
                const snap = await getDocs(q);
                setPrevInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch { /* silent */ }
        })();
    }, [business?.id, order.id, sent]);

    const handleSend = async (q: string) => {
        if (!q.trim() || !business?.id) return;
        setSending(true);
        try {
            const { collection, addDoc, Timestamp } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');
            await addDoc(collection(db, 'businesses', business.id, 'orderInquiries'), {
                orderId: order.id,
                orderNumber: order.orderNumber || order.id.slice(-6).toUpperCase(),
                customerName: customerName || 'Хэрэглэгч',
                customerPhone: customerPhone,
                question: q.trim(),
                source: 'storefront',
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            setSent(true);
            setQuestion('');
            setShowForm(false);
            setTimeout(() => setSent(false), 3000);
        } catch (err) {
            console.error('Send inquiry error:', err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="cd-order-card">
            <div className="cd-order-top">
                <div className="cd-order-number">#{order.orderNumber}</div>
                <div className="cd-order-status" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                    {statusInfo.label}
                </div>
            </div>
            <div className="cd-order-info">
                <span className="cd-order-date"><Clock size={13} /> {formatDate(order.createdAt)}</span>
                <span className="cd-order-amount">{formatCurrency(order.totalAmount)}</span>
            </div>
            {order.items && order.items.length > 0 && (
                <div className="cd-order-items">
                    {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="cd-order-item">
                            <span>{item.name}</span>
                            <span>x{item.quantity}</span>
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <div className="cd-order-more">+{order.items.length - 3} бараа</div>
                    )}
                </div>
            )}

            {/* Inquiry sent confirmation */}
            {sent && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 12px', fontSize: '0.82rem', color: '#065f46', fontWeight: 600, marginTop: 8 }}>
                    ✅ Лавлагаа илгээгдлээ!
                </div>
            )}

            {/* Inquiry button / form */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 10,
                        border: `1.5px solid ${brandColor}20`, background: `${brandColor}08`,
                        color: brandColor, fontSize: '0.82rem', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                >
                    <MessageSquare size={14} /> Захиалга лавлах
                </button>
            ) : (
                <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: '#334155' }}>📩 Асуулга илгээх</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {QUICK_QUESTIONS.map(q => (
                            <button
                                key={q}
                                onClick={() => handleSend(q)}
                                disabled={sending}
                                style={{
                                    padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: '#fff', fontSize: '0.78rem', cursor: 'pointer', color: '#475569',
                                    fontWeight: 600, opacity: sending ? 0.5 : 1
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            type="text"
                            placeholder="Бусад асуулт бичих..."
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend(question)}
                            style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                        />
                        <button
                            onClick={() => handleSend(question)}
                            disabled={!question.trim() || sending}
                            style={{
                                padding: '7px 12px', borderRadius: 8, border: 'none',
                                background: brandColor, color: '#fff', cursor: 'pointer',
                                opacity: (!question.trim() || sending) ? 0.5 : 1
                            }}
                        >
                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                    <button onClick={() => setShowForm(false)} style={{ width: '100%', marginTop: 6, border: 'none', background: 'none', fontSize: '0.78rem', color: '#94a3b8', cursor: 'pointer' }}>
                        Болих
                    </button>
                </div>
            )}

            {/* Previous inquiry history */}
            {prevInquiries.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {prevInquiries.slice(0, 2).map(inq => (
                        <div key={inq.id} style={{ background: inq.answer ? '#f0fdf4' : '#fffbeb', border: `1px solid ${inq.answer ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '8px 12px', fontSize: '0.78rem' }}>
                            <div style={{ color: '#64748b', marginBottom: 2 }}>❓ {inq.question}</div>
                            {inq.answer ? (
                                <div style={{ color: '#065f46', fontWeight: 600 }}>✅ {inq.answer}</div>
                            ) : (
                                <div style={{ color: '#92400e', fontWeight: 600 }}>⏳ Хариу хүлээж байна...</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══ Promo Code Section (in Profile tab) ═══
function PromoCodeSection({ business, phone, brandColor }: { business: Business; phone: string; brandColor: string }) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<{ creditsPerUser: number; minPercent: number; maxPercent: number } | null>(null);
    const [credits, setCredits] = useState<{ used: number; total: number }>({ used: 0, total: 5 });
    const [myCodes, setMyCodes] = useState<{ code: string; value: number; isActive: boolean }[]>([]);
    const [genResult, setGenResult] = useState<{ code: string; pct: number } | null>(null);
    const [copied, setCopied] = useState('');

    // Load config & user codes
    useEffect(() => {
        if (!business?.id || !phone) return;
        (async () => {
            try {
                const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../../services/firebase');

                // Find active user_generated config
                const snap = await getDocs(query(
                    collection(db, 'businesses', business.id, 'promoCodes'),
                    where('mode', '==', 'user_generated'),
                    where('isActive', '==', true)
                ));
                if (!snap.empty) {
                    const cfg = snap.docs[0].data();
                    const ugc = cfg.userGenConfig || { creditsPerUser: 5, minPercent: 3, maxPercent: 10 };
                    setConfig(ugc);

                    // Load credits
                    const creditDoc = await getDoc(doc(db, 'businesses', business.id, 'promoCredits', phone));
                    if (creditDoc.exists()) {
                        const cd = creditDoc.data();
                        setCredits({ used: cd.usedCredits || 0, total: ugc.creditsPerUser });
                    } else {
                        setCredits({ used: 0, total: ugc.creditsPerUser });
                    }
                }

                // Load user's generated codes
                const codesSnap = await getDocs(query(
                    collection(db, 'businesses', business.id, 'promoCodes'),
                    where('mode', '==', 'user_generated'),
                    where('assignedTo', '==', phone)
                ));
                setMyCodes(codesSnap.docs.map(d => {
                    const data = d.data();
                    return { code: data.code, value: data.value, isActive: data.isActive && data.usageCount === 0 };
                }));

                // Also load dynamic codes assigned to this user
                const dynSnap = await getDocs(query(
                    collection(db, 'businesses', business.id, 'promoCodes'),
                    where('mode', '==', 'dynamic'),
                    where('assignedTo', '==', phone)
                ));
                const dynCodes = dynSnap.docs.map(d => {
                    const data = d.data();
                    return { code: data.code, value: data.value, isActive: data.isActive && data.usageCount === 0 };
                });
                setMyCodes(prev => [...prev, ...dynCodes]);
            } catch (e) {
                console.error('Load promo config:', e);
            }
        })();
    }, [business?.id, phone]);

    const generateCode = async () => {
        if (!config || !business?.id || !phone || credits.used >= credits.total) return;
        setLoading(true);
        try {
            const { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp: TS } = await import('firebase/firestore');
            const { db } = await import('../../services/firebase');

            const pct = Math.floor(Math.random() * (config.maxPercent - config.minPercent + 1)) + config.minPercent;
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = 'MY-';
            for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];

            // Create code
            await addDoc(collection(db, 'businesses', business.id, 'promoCodes'), {
                businessId: business.id,
                code,
                type: 'percentage',
                value: pct,
                mode: 'user_generated',
                target: 'all',
                usageType: 'one_time',
                usageLimit: 1,
                usageCount: 0,
                usedBy: [],
                startDate: serverTimestamp(),
                endDate: TS.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
                minOrderAmount: 0,
                isActive: true,
                isDeleted: false,
                assignedTo: phone,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Update credits
            await setDoc(doc(db, 'businesses', business.id, 'promoCredits', phone), {
                phone,
                usedCredits: credits.used + 1,
                totalCredits: credits.total,
                generatedCodes: [...myCodes.map(c => c.code), code],
            }, { merge: true });

            setCredits(prev => ({ ...prev, used: prev.used + 1 }));
            setMyCodes(prev => [{ code, value: pct, isActive: true }, ...prev]);
            setGenResult({ code, pct });
        } catch (e) {
            console.error('Generate promo code:', e);
        }
        setLoading(false);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(''), 2000);
    };

    const remaining = credits.total - credits.used;

    if (!config && myCodes.length === 0) {
        return null;
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
            padding: 20,
            borderRadius: 16,
            boxShadow: '0 10px 25px rgba(255, 154, 158, 0.2)',
            color: '#111',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Festive Background Decorations */}
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'rotate(15deg)' }}>
                <Gift size={120} />
            </div>
            <div style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.1, transform: 'rotate(-15deg)' }}>
                <Ticket size={100} />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Generate button or Result banner */}
                {config && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: 12, padding: 20 }}>
                        {genResult ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#6b7280', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                                    <Sparkles size={16} color="#d946ef" /> Таны промо код үүслээ! <Sparkles size={16} color="#d946ef" />
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: '#d946ef', letterSpacing: '0.05em', margin: '10px 0', textShadow: '0 2px 10px rgba(217, 70, 239, 0.2)' }}>{genResult.code}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>Гаднаасаа авах {genResult.pct}% ХЯМДРАЛ 🎉</div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                                    <button onClick={() => copyCode(genResult.code)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #d946ef, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 70, 239, 0.3)' }}>
                                        {copied === genResult.code ? <><Check size={16} /> ХУУЛСАН!</> : <><Copy size={16} /> КОДЫГ ХУУЛАХ</>}
                                    </button>
                                    <button onClick={() => setGenResult(null)} style={{ padding: '10px 20px', background: 'none', border: '2px solid #e5e7eb', color: '#4b5563', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>БУЦАХ</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, marginBottom: 12 }}>
                                    <Gift size={14} style={{ marginRight: 6 }} /> БЭЛЭГТЭЙ УРАМШУУЛАЛ
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111827', marginBottom: 6, lineHeight: 1.2 }}>
                                    {remaining > 0 ? `Азаа үзээд ${config.minPercent} - ${config.maxPercent}% хөнгөлөлт аваарай!` : 'Таны урамшууллын эрх дууссан байна'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16, fontWeight: 500 }}>
                                    Таньд <strong style={{ color: remaining > 0 ? '#d946ef' : '#dc2626', fontSize: '1rem' }}>{remaining}</strong> эрх үлдсэн байна.
                                </div>
                                <button
                                    onClick={generateCode}
                                    disabled={loading || remaining <= 0}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '12px 24px', background: remaining > 0 ? 'linear-gradient(135deg, #111 0%, #333 100%)' : '#d1d5db',
                                        color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem',
                                        fontWeight: 800, cursor: remaining > 0 ? 'pointer' : 'not-allowed',
                                        boxShadow: remaining > 0 ? '0 6px 16px rgba(0,0,0,0.2)' : 'none',
                                        transform: loading ? 'scale(0.98)' : 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? 'Уншиж байна...' : <><Ticket size={18} /> ХӨНГӨЛӨЛТИЙН КОД СУГАЛАХ</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* My codes list */}
                {myCodes.length > 0 && (
                    <div style={{ marginTop: 16, background: 'rgba(255, 255, 255, 0.6)', borderRadius: 12, padding: 16, backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Ticket size={14} /> ТАНЫ ИДЭВХТЭЙ КОДУУД
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                            {myCodes.map((c, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 14px', background: c.isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${c.isActive ? '#e5e7eb' : 'transparent'}`,
                                    borderRadius: 10, opacity: c.isActive ? 1 : 0.6,
                                    boxShadow: c.isActive ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.95rem', color: c.isActive ? '#111' : '#6b7280' }}>{c.code}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: c.isActive ? '#059669' : '#6b7280' }}>
                                            {c.value}% ХЯМДРАЛ
                                        </span>
                                    </div>
                                    {c.isActive ? (
                                        <button onClick={() => copyCode(c.code)} style={{ background: copied === c.code ? '#10b981' : '#f3f4f6', color: copied === c.code ? '#fff' : '#4b5563', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            {copied === c.code ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '0.68rem', color: '#999', fontWeight: 600 }}>Ашигласан</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
