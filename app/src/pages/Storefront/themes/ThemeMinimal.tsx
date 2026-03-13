import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Lock, Crown, X, Phone, User } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData, type StorefrontProduct } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import { ProductModal } from '../../../components/Storefront/ProductModal';
import { CustomerDashboard } from '../../../components/Storefront/CustomerDashboard';
import { FlashDealSection, type FlashDealConfig } from '../../../components/Storefront/FlashDealSection';
import '../Storefront.css';

export function ThemeMinimal({ business }: { business: Business }) {
    const {
        products, loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts,
        verifyMembership, activeMemberships,
    } = useStorefrontData(business);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [membershipTarget, setMembershipTarget] = useState<StorefrontProduct | null>(null);
    const [showDashboard, setShowDashboard] = useState(false);

    // Check if user has stored phone (logged in)
    const storedPhone = localStorage.getItem(`membership_phone_${business.id}`) || '';
    const hasMembership = activeMemberships.length > 0;

    const extractBrand = (desc: string) => {
        if (!desc) return null;
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^.,\n]+(?:\s*\([^)]*\))?)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleAddToCart = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
    };

    const handleProductClick = (p: StorefrontProduct) => {
        if (p.isLocked) {
            setMembershipTarget(p);
            setShowMembershipModal(true);
        } else {
            setSelectedProduct(p);
        }
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12, fontFamily: 'var(--sf-font-body)'
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid #f0f0f0', borderTopColor: '#111',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ color: '#999', fontSize: '0.9rem' }}>Ачаалж байна...</span>
            </div>
        );
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="store-bg">
            {/* Sticky Navbar */}
            <nav className="store-nav">
                <a href={`/s/${business.slug}`} className="store-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span>{storeName}</span>
                </a>

                <div className="store-nav-actions">
                    <button
                        className="store-cart-btn-minimal"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={20} strokeWidth={2} />
                        {cartCount > 0 && <span className="cart-badge-minimal">{cartCount}</span>}
                    </button>
                    {storedPhone && (
                        <button
                            className={`store-profile-btn ${hasMembership ? 'has-membership' : ''}`}
                            onClick={() => setShowDashboard(true)}
                        >
                            <User size={18} strokeWidth={2.5} />
                            {hasMembership && <span className="store-profile-vip-dot" />}
                        </button>
                    )}
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <header className="store-hero">
                    <h1 className="store-hero-title">
                        {activeCategory === 'all' ? (
                            <>Танд зориулсан<br />шилдэг цуглуулга</>
                        ) : activeCategory}
                    </h1>
                    <p className="store-hero-subtitle">
                        Бид хамгийн чанартай бараа бүтээгдэхүүнийг танд хамгийн таатай үнээр санал болгож байна.
                    </p>
                </header>

                {/* Search */}
                <div className="store-search-container">
                    <div className="store-search-inner">
                        <Search size={18} className="store-search-icon" />
                        <input
                            type="text"
                            placeholder="Бараа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="store-search-input"
                        />
                    </div>
                </div>

                {/* Categories */}
                {categories.length > 2 && (
                    <div className="store-categories">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat === 'all' ? 'Бүх бараа' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Flash Deal Section */}
                {(() => {
                    const fd = (business.settings as any)?.storefront?.flashDeal;
                    if (!fd?.enabled || !fd.products?.length) return null;
                    const flashConfig: FlashDealConfig = {
                        enabled: fd.enabled,
                        title: fd.title || '⚡ FLASH DEAL',
                        startsAt: fd.startsAt?.toDate?.() || new Date(fd.startsAt),
                        endsAt: fd.endsAt?.toDate?.() || new Date(fd.endsAt),
                        products: fd.products,
                    };
                    return (
                        <FlashDealSection
                            config={flashConfig}
                            allProducts={products}
                            onProductClick={(p) => setSelectedProduct(p)}
                        />
                    );
                })()}

                {/* Product Grid */}
                <div className="store-container">
                    <div className="product-grid">
                        {products.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}>
                                <StorefrontEmpty message="Одоогоор бараа ороогүй байна" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}>
                                <StorefrontEmpty message="Ийм нэртэй бараа олдсонгүй" />
                            </div>
                        ) : (
                            filteredProducts.map((p, index) => {
                                const sfp = p as StorefrontProduct;
                                const brand = extractBrand(p.description);
                                const salePrice = p.pricing?.salePrice || 0;
                                const comparePrice = p.pricing?.comparePrice;
                                const hasDiscount = comparePrice && comparePrice > salePrice;

                                return (
                                    <div
                                        key={p.id}
                                        className={`product-card ${sfp.isLocked ? 'product-card-locked' : ''}`}
                                        onClick={() => handleProductClick(sfp)}
                                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                    >
                                        <div className="product-image-wrap">
                                            {brand && !sfp.isLocked && <div className="product-brand-badge">{brand}</div>}

                                            {sfp.isExclusive && !sfp.isLocked && (
                                                <div className="sf-vip-badge">
                                                    <Crown size={10} /> VIP
                                                </div>
                                            )}

                                            {hasDiscount && !sfp.isLocked && (
                                                <div style={{
                                                    position: 'absolute', top: 12, right: 12, zIndex: 2,
                                                    background: '#dc2626', color: '#fff',
                                                    padding: '4px 10px', borderRadius: 100,
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                }}>
                                                    -{Math.round((1 - salePrice / comparePrice) * 100)}%
                                                </div>
                                            )}

                                            {p.images?.[0] ? (
                                                <img
                                                    src={p.images[0]}
                                                    alt={p.name}
                                                    className="product-image"
                                                    loading="lazy"
                                                    style={sfp.isLocked ? { filter: 'blur(4px)', opacity: 0.7 } : undefined}
                                                />
                                            ) : (
                                                <div style={{ color: '#ccc', fontSize: '2.5rem' }}>📦</div>
                                            )}

                                            {sfp.isLocked ? (
                                                <div className="sf-lock-overlay">
                                                    <Lock size={22} />
                                                    <span>VIP гишүүнчлэл</span>
                                                </div>
                                            ) : (
                                                <button
                                                    className="product-add-overlay"
                                                    onClick={(e) => handleAddToCart(e, p)}
                                                    title="Сагсанд нэмэх"
                                                >
                                                    <Plus size={20} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">
                                                {sfp.isLocked ? '🔒 ' : ''}{p.name}
                                            </h3>
                                            <div className="product-price">
                                                {sfp.isLocked ? (
                                                    <span style={{ color: '#999', fontSize: '0.85rem' }}>Гишүүнчлэл шаардлагатай</span>
                                                ) : (
                                                    <>
                                                        {salePrice.toLocaleString()} ₮
                                                        {hasDiscount && (
                                                            <span style={{
                                                                fontSize: '0.82rem', textDecoration: 'line-through',
                                                                opacity: 0.35, fontWeight: 400, color: '#888'
                                                            }}>
                                                                {comparePrice.toLocaleString()} ₮
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    preorderTerms={business.settings?.storefront?.preorderTerms}
                />
            )}

            {showMembershipModal && membershipTarget && (
                <MembershipModal
                    product={membershipTarget}
                    onClose={() => { setShowMembershipModal(false); setMembershipTarget(null); }}
                    onVerify={verifyMembership}
                    business={business}
                />
            )}

            {/* Customer Dashboard Drawer */}
            <CustomerDashboard
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
                business={business}
                phone={storedPhone}
                onOpenMembership={() => {
                    setShowDashboard(false);
                    // Show membership modal for any exclusive product
                    const exclusive = filteredProducts.find(p => p.isExclusive);
                    if (exclusive) {
                        setMembershipTarget(exclusive);
                        setShowMembershipModal(true);
                    }
                }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════
// Membership Purchase Modal
// QPay + Bank Transfer dual payment
// ═══════════════════════════════════════════
function MembershipModal({
    product,
    onClose,
    onVerify,
    business,
}: {
    product: StorefrontProduct;
    onClose: () => void;
    onVerify: (phone: string) => Promise<boolean>;
    business: Business;
}) {
    const [phone, setPhone] = useState('');
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaVerifierRef = useRef<any>(null);

    // Payment flow
    const [showPayment, setShowPayment] = useState(false);
    const [paymentTab, setPaymentTab] = useState<'qpay' | 'bank'>('qpay');
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [refCode, setRefCode] = useState('');
    const [qpayData, setQpayData] = useState<{ qr_image: string; qPay_shortUrl: string; urls: Array<{ name: string; description: string; link: string; logo: string }> } | null>(null);
    const [qpayError, setQpayError] = useState(false);
    const [qpayLoading, setQpayLoading] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    const enabledBanks = (business.settings?.bankTransferAccounts || []).filter((a: { enabled: boolean }) => a.enabled);
    const selectedBank = enabledBanks[0] || null;
    const membershipConfig = product.membershipConfig;
    const price = membershipConfig?.price || 0;
    const durationDays = membershipConfig?.durationDays || 30;

    // Generate a 6-char refCode
    const generateRefCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    };

    // Step 1: Send OTP to phone
    const handleSendOTP = async () => {
        const cleanPhone = phone.trim().replace(/[\s\-]/g, '');
        if (!cleanPhone || cleanPhone.length < 8) {
            setError('Утасны дугаараа оруулна уу');
            return;
        }
        setChecking(true);
        setError('');

        try {
            const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
            const { auth } = await import('../../../services/firebase');

            // Create invisible recaptcha (only once)
            if (!recaptchaVerifierRef.current && recaptchaRef.current) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
                    size: 'invisible',
                });
            }

            // Format phone number (add +976 if not present)
            const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone :
                cleanPhone.startsWith('976') ? `+${cleanPhone}` : `+976${cleanPhone}`;

            const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
            setConfirmationResult(result);
            setOtpSent(true);
        } catch (err: any) {
            console.error('OTP send error:', err);
            if (err.code === 'auth/too-many-requests') {
                setError('Хэт олон удаа оролдлоо. Түр хүлээнэ үү.');
            } else if (err.code === 'auth/invalid-phone-number') {
                setError('Буруу утасны дугаар байна');
            } else {
                setError('SMS илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
            }
            // Reset recaptcha on error
            recaptchaVerifierRef.current = null;
        } finally {
            setChecking(false);
        }
    };

    // Step 2: Verify OTP code
    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length < 6) {
            setError('6 оронтой кодоо оруулна уу');
            return;
        }
        setOtpVerifying(true);
        setError('');

        // Step A: Confirm the OTP code with Firebase
        try {
            await confirmationResult.confirm(otpCode);
        } catch (confirmErr: any) {
            console.error('OTP confirm error:', confirmErr);
            setOtpVerifying(false);
            if (confirmErr.code === 'auth/invalid-verification-code') {
                setError('Буруу код байна');
            } else if (confirmErr.code === 'auth/code-expired') {
                setError('Кодын хугацаа дууссан. Дахин илгээнэ үү.');
                setOtpSent(false);
                setOtpCode('');
            } else {
                setError('Код баталгаажуулахад алдаа гарлаа. Дахин оролдоно уу.');
            }
            return;
        }

        // Step B: OTP confirmed! Sign out to restore Firestore access
        try {
            const { auth } = await import('../../../services/firebase');
            await auth.signOut();
        } catch {
            // Ignore signOut errors
        }

        // Step C: Check if user already has membership
        const cleanPhone = phone.trim().replace(/[\s\-+]/g, '');
        try {
            const hasMembership = await onVerify(cleanPhone);
            if (hasMembership) {
                setSuccess(true);
                setTimeout(() => onClose(), 1500);
                setOtpVerifying(false);
                return;
            }
        } catch (verifyErr) {
            console.debug('Membership check failed (permissions), proceeding to payment:', verifyErr);
            // If Firestore permission error, phone IS verified — just can't check memberships
            // Proceed to payment as if no membership exists
        }

        // No membership found (or check failed) → show payment options
        setShowPayment(true);
        setOtpVerifying(false);
    };

    // Step 2: Create membership order and initiate payment
    const handlePurchase = async () => {
        setCreatingOrder(true);
        setError('');
        try {
            const code = generateRefCode();
            setRefCode(code);

            const cleanPhone = phone.trim().replace(/[\s\-+]/g, '');

            // Create membership order in Firestore
            const { orderService } = await import('../../../services/orderService');
            const orderPayload = {
                orderNumber: `VIP-${code}`,
                status: 'pending',
                paymentStatus: 'unpaid' as const,
                customer: { id: null, name: cleanPhone, phone: cleanPhone },
                items: [{
                    productId: `membership_${product.exclusiveCategoryId || ''}`,
                    name: `VIP гишүүнчлэл — ${product.exclusiveCategoryName || 'Онцгой'}`,
                    variant: '',
                    quantity: 1,
                    unitPrice: price,
                    costPrice: 0,
                    totalPrice: price,
                }],
                financials: {
                    subtotal: price,
                    discountType: 'fixed' as const,
                    discountValue: 0,
                    discountAmount: 0,
                    deliveryFee: 0,
                    cargoFee: 0,
                    cargoIncluded: false,
                    totalAmount: price,
                    payments: [],
                    paidAmount: 0,
                    balanceDue: price,
                },
                assignedTo: null,
                assignedToName: null,
                notes: `VIP гишүүнчлэл худалдан авалт | ${durationDays} хоног | Код: ${code}`,
                internalNotes: '',
                deliveryAddress: '',
                tags: ['membership'],
                createdBy: 'guest',
                createdByName: cleanPhone,
                selectedPaymentMethod: paymentTab === 'qpay' ? 'qpay' as const : 'bank_transfer' as const,
                paymentRefCode: code,
                orderType: 'membership' as const,
                membershipCategoryId: product.exclusiveCategoryId || '',
                membershipDurationDays: durationDays,
            };

            const newId = await orderService.createOrder(business.id, orderPayload);
            setOrderId(newId);

            // Start listening for payment confirmation
            const { doc, onSnapshot } = await import('firebase/firestore');
            const { db } = await import('../../../services/firebase');
            const orderRef = doc(db, 'businesses', business.id, 'orders', newId);
            const unsubscribe = onSnapshot(orderRef, (snap) => {
                const data = snap.data();
                if (data?.paymentStatus === 'paid') {
                    setPaymentConfirmed(true);
                    unsubscribe();
                    // Refresh membership status
                    onVerify(cleanPhone);
                    setTimeout(() => onClose(), 2500);
                }
            });

            // If QPay selected, generate QR
            if (paymentTab === 'qpay') {
                await generateQPayQR(newId, cleanPhone);
            }
        } catch (err) {
            console.error('Failed to create membership order:', err);
            setError('Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
            setCreatingOrder(false);
        }
    };

    // Generate or retry QPay QR
    const generateQPayQR = async (oid?: string, phone?: string) => {
        const targetOrderId = oid || orderId;
        if (!targetOrderId) return;
        setQpayLoading(true);
        setQpayError(false);
        try {
            const { qpayService } = await import('../../../services/qpay');
            const invoice = await qpayService.createInvoice(
                business.id,
                targetOrderId,
                price,
                `VIP гишүүнчлэл — ${product.exclusiveCategoryName || 'Онцгой'}`,
                phone || ''
            );
            setQpayData({
                qr_image: invoice.qr_image,
                qPay_shortUrl: invoice.qPay_shortUrl,
                urls: invoice.urls || [],
            });

            // Save invoice_id to order for callback verification
            if (invoice.invoice_id) {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../../../services/firebase');
                await updateDoc(doc(db, 'businesses', business.id, 'orders', targetOrderId), {
                    qpayInvoiceId: invoice.invoice_id,
                });

                // Start polling QPay for payment confirmation
                startPaymentPolling(invoice.invoice_id, targetOrderId);
            }
        } catch (qpayErr) {
            console.error('QPay QR generation failed:', qpayErr);
            setQpayError(true);
        } finally {
            setQpayLoading(false);
        }
    };

    // Poll QPay every 3s to detect payment
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPaymentPolling = (invoiceId: string, oid: string) => {
        // Clear any existing polling
        if (pollingRef.current) clearInterval(pollingRef.current);

        let attempts = 0;
        const maxAttempts = 200; // ~10 min at 3s intervals

        pollingRef.current = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                return;
            }

            try {
                const resp = await fetch('/api/qpay-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceId }),
                });
                const data = await resp.json();

                if (data.paid) {
                    // Payment confirmed! Update Firestore order
                    if (pollingRef.current) clearInterval(pollingRef.current);

                    try {
                        const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore');
                        const { db } = await import('../../../services/firebase');
                        const orderRef = doc(db, 'businesses', business.id, 'orders', oid);
                        await updateDoc(orderRef, {
                            paymentStatus: 'paid',
                            paymentVerifiedAt: serverTimestamp(),
                            paymentVerifiedBy: 'qpay',
                            'financials.paidAmount': price,
                            'financials.balanceDue': 0,
                            'financials.payments': arrayUnion({
                                id: `qpay_${data.payment?.payment_id || Date.now()}`,
                                amount: price,
                                method: 'qpay',
                                note: 'QPay төлбөр',
                                paidAt: new Date().toISOString(),
                                recordedBy: 'qpay_auto',
                            }),
                        });

                        // Grant membership!
                        const categoryId = product.exclusiveCategoryId || '';
                        const memberPhone = phone || localStorage.getItem(`membership_phone_${business.id}`) || '';
                        if (categoryId && memberPhone) {
                            const { membershipService } = await import('../../../services/membershipService');
                            await membershipService.grantMembership(
                                business.id,
                                categoryId,
                                memberPhone,
                                price,
                                durationDays
                            );
                            // Refresh membership status so products unlock
                            onVerify(memberPhone);
                        }
                    } catch (updateErr) {
                        console.error('Failed to update order:', updateErr);
                    }

                    // Directly confirm payment (don't rely only on onSnapshot)
                    setPaymentConfirmed(true);
                    setTimeout(() => onClose(), 2500);
                }
            } catch (pollErr) {
                // Silent fail — will retry on next interval
                console.debug('QPay poll error:', pollErr);
            }
        }, 3000);
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    return (
        <div className="sf-membership-backdrop" onClick={onClose}>
            <div className="sf-membership-modal sf-membership-purchase" onClick={e => e.stopPropagation()}>
                <button className="sf-membership-close" onClick={onClose}>
                    <X size={18} />
                </button>

                <div className="sf-membership-header">
                    <div className="sf-membership-icon">
                        <Crown size={28} />
                    </div>
                    <h3>VIP Гишүүнчлэл</h3>
                    <p>"{product.exclusiveCategoryName}" ангилалын бараа үзэхэд гишүүнчлэл шаардлагатай.</p>
                </div>

                {membershipConfig && (
                    <div className="sf-membership-pricing">
                        <div className="sf-membership-price">
                            ₮{price.toLocaleString()}
                        </div>
                        <div className="sf-membership-duration">
                             / {durationDays} хоног
                        </div>
                    </div>
                )}

                {/* ═══ Payment confirmed ═══ */}
                {paymentConfirmed ? (
                    <div className="sf-membership-success">
                        ✅ Төлбөр баталгаажлаа! Гишүүнчлэл идэвхжлээ. Хуудсыг шинэчилж байна...
                    </div>
                ) : success ? (
                    <div className="sf-membership-success">
                        ✅ Гишүүнчлэл баталгаажлаа!
                    </div>
                ) : orderId ? (
                    /* ═══ Payment screen ═══ */
                    <div className="sf-membership-payment">
                        {/* Tabs */}
                        <div className="sf-membership-tabs">
                            <button
                                className={`sf-membership-tab ${paymentTab === 'qpay' ? 'active' : ''}`}
                                onClick={() => setPaymentTab('qpay')}
                            >
                                QPay
                            </button>
                            <button
                                className={`sf-membership-tab ${paymentTab === 'bank' ? 'active' : ''}`}
                                onClick={() => setPaymentTab('bank')}
                            >
                                Банкны шилжүүлэг
                            </button>
                        </div>

                        {paymentTab === 'qpay' && qpayData ? (
                            <div className="sf-membership-qpay">
                                <div className="sf-membership-qr">
                                    <img
                                        src={`data:image/png;base64,${qpayData.qr_image}`}
                                        alt="QPay QR"
                                        style={{ width: '200px', height: '200px', borderRadius: '12px' }}
                                    />
                                </div>
                                <p className="sf-membership-qpay-hint">
                                    Банкны аппаараа QR уншуулна уу
                                </p>
                                {qpayData.urls.length > 0 && (
                                    <div className="sf-qpay-banks-section">
                                        <div className="sf-qpay-banks-divider">
                                            <span>эсвэл аппаар нээх</span>
                                        </div>
                                        <div className="sf-qpay-banks-grid">
                                            {qpayData.urls.map((url, i) => (
                                                <a key={i} href={url.link} className="sf-qpay-bank-item">
                                                    <img
                                                        src={url.logo}
                                                        alt={url.name}
                                                        className="sf-qpay-bank-logo"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.add('sf-qpay-bank-fallback-visible');
                                                        }}
                                                    />
                                                    <span className="sf-qpay-bank-fallback">{url.name.slice(0, 2)}</span>
                                                    <span className="sf-qpay-bank-name">{url.description || url.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="sf-membership-waiting">
                                    <div className="sf-membership-spinner" />
                                    Төлбөр хүлээж байна...
                                </div>
                            </div>
                        ) : paymentTab === 'qpay' && qpayError ? (
                            <div className="sf-membership-qpay-error">
                                <p style={{ color: '#dc2626', fontWeight: 600, margin: '0 0 10px' }}>QPay QR үүсгэхэд алдаа гарлаа</p>
                                <button className="sf-membership-verify-btn" onClick={() => generateQPayQR()}>Дахин оролдох</button>
                                <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 8 }}>Эсвэл "Банкны шилжүүлэг" сонгоно уу</p>
                            </div>
                        ) : paymentTab === 'qpay' && (qpayLoading || !qpayData) ? (
                            <div className="sf-membership-waiting">
                                <div className="sf-membership-spinner" />
                                QPay QR код үүсгэж байна...
                            </div>
                        ) : (
                            /* Bank transfer tab */
                            <div className="sf-membership-bank">
                                {selectedBank ? (
                                    <div className="sf-membership-bank-info">
                                        <div className="sf-membership-bank-row">
                                            <span className="sf-membership-bank-label">Банк:</span>
                                            <span className="sf-membership-bank-value">{selectedBank.bankName}</span>
                                        </div>
                                        <div className="sf-membership-bank-row">
                                            <span className="sf-membership-bank-label">Данс:</span>
                                            <span className="sf-membership-bank-value">{selectedBank.accountNumber}</span>
                                        </div>
                                        <div className="sf-membership-bank-row">
                                            <span className="sf-membership-bank-label">Нэр:</span>
                                            <span className="sf-membership-bank-value">{selectedBank.accountName}</span>
                                        </div>
                                        <div className="sf-membership-bank-row">
                                            <span className="sf-membership-bank-label">Дүн:</span>
                                            <span className="sf-membership-bank-value sf-membership-bank-amount">₮{price.toLocaleString()}</span>
                                        </div>
                                        <div className="sf-membership-bank-row sf-membership-bank-ref">
                                            <span className="sf-membership-bank-label">Гүйлгээний утга:</span>
                                            <span className="sf-membership-bank-value sf-membership-ref-code">{refCode}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', color: '#999' }}>Банкны данс тохируулагдаагүй байна.</p>
                                )}
                                <div className="sf-membership-waiting">
                                    <div className="sf-membership-spinner" />
                                    Төлбөр хүлээж байна... (автомат баталгаажна)
                                </div>
                            </div>
                        )}
                    </div>
                ) : showPayment ? (
                    /* ═══ Purchase prompt ═══ */
                    <div className="sf-membership-purchase-prompt">
                        <p className="sf-membership-no-sub">
                            Таны <strong>{phone}</strong> дугаар дээр идэвхтэй гишүүнчлэл олдсонгүй.
                        </p>
                        
                        {/* Payment method selection */}
                        <div className="sf-membership-tabs">
                            <button
                                className={`sf-membership-tab ${paymentTab === 'qpay' ? 'active' : ''}`}
                                onClick={() => setPaymentTab('qpay')}
                            >
                                QPay
                            </button>
                            <button
                                className={`sf-membership-tab ${paymentTab === 'bank' ? 'active' : ''}`}
                                onClick={() => setPaymentTab('bank')}
                            >
                                Банкны шилжүүлэг
                            </button>
                        </div>

                        <button
                            className="sf-membership-buy-btn"
                            onClick={handlePurchase}
                            disabled={creatingOrder}
                        >
                            {creatingOrder ? 'Бэлдэж байна...' : `₮${price.toLocaleString()} — Гишүүнчлэл худалдаж авах`}
                        </button>
                        {error && <div className="sf-membership-error">{error}</div>}
                    </div>
                ) : (
                    /* ═══ Phone + OTP verification ═══ */
                    <>
                        {!otpSent ? (
                            /* Step 1: Phone input */
                            <>
                                <div className="sf-membership-input-group">
                                    <label>Утасны дугаар</label>
                                    <div className="sf-membership-input-wrap">
                                        <Phone size={16} />
                                        <input
                                            type="tel"
                                            placeholder="9900 1234"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            maxLength={12}
                                            onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                                        />
                                    </div>
                                    {error && <div className="sf-membership-error">{error}</div>}
                                </div>

                                <button
                                    className="sf-membership-verify-btn"
                                    onClick={handleSendOTP}
                                    disabled={checking}
                                >
                                    {checking ? 'Илгээж байна...' : '📱 Код илгээх'}
                                </button>
                            </>
                        ) : (
                            /* Step 2: OTP code input */
                            <>
                                <div className="sf-membership-input-group">
                                    <label>
                                        <strong>+976{phone.replace(/[\s\-+]/g, '')}</strong> дугаар руу код илгээлээ
                                    </label>
                                    <div className="sf-membership-input-wrap sf-otp-input-wrap">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="— — — — — —"
                                            value={otpCode}
                                            onChange={e => {
                                                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtpCode(v);
                                            }}
                                            maxLength={6}
                                            onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                                            autoFocus
                                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 700 }}
                                        />
                                    </div>
                                    {error && <div className="sf-membership-error">{error}</div>}
                                </div>

                                <button
                                    className="sf-membership-verify-btn"
                                    onClick={handleVerifyOTP}
                                    disabled={otpVerifying}
                                >
                                    {otpVerifying ? 'Шалгаж байна...' : '✅ Баталгаажуулах'}
                                </button>

                                <button
                                    className="sf-membership-resend-btn"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtpCode('');
                                        setError('');
                                        recaptchaVerifierRef.current = null;
                                    }}
                                    style={{
                                        background: 'none', border: 'none', color: '#7c3aed',
                                        fontSize: '0.78rem', cursor: 'pointer', padding: '8px',
                                        marginTop: '4px', textDecoration: 'underline'
                                    }}
                                >
                                    Дахин илгээх
                                </button>
                            </>
                        )}

                        {/* Invisible reCAPTCHA container */}
                        <div ref={recaptchaRef} id="recaptcha-container" />
                    </>
                )}
            </div>
        </div>
    );
}

