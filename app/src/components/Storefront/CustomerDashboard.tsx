import { useState, useEffect, useRef } from 'react';
import { X, User, Crown, Package, MapPin, Bell, Clock, CheckCircle, AlertTriangle, RefreshCw, Phone, Loader2, Edit3 } from 'lucide-react';
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
                            <h3 className="cd-section-title">Захиалгууд</h3>
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
                                            <div key={order.id} className="cd-order-card">
                                                <div className="cd-order-top">
                                                    <div className="cd-order-number">#{order.orderNumber}</div>
                                                    <div className="cd-order-status" style={{
                                                        color: statusInfo.color,
                                                        background: statusInfo.bg
                                                    }}>
                                                        {statusInfo.label}
                                                    </div>
                                                </div>
                                                <div className="cd-order-info">
                                                    <span className="cd-order-date">
                                                        <Clock size={13} /> {formatDate(order.createdAt)}
                                                    </span>
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
                                            </div>
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
