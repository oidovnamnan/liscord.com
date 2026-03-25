import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
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
    const [flashDealPrice, setFlashDealPrice] = useState<number | null>(null);
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [membershipTarget, setMembershipTarget] = useState<StorefrontProduct | null>(null);
    const [showDashboard, setShowDashboard] = useState(false);
    
    const PRODUCTS_PER_PAGE = business.settings?.storefront?.productsPerPage || 20;
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

    // ── Auto-scroll categories ──
    const catScrollRef = useRef<HTMLDivElement>(null);
    const catPausedRef = useRef(false);
    const catPauseTimer = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        const el = catScrollRef.current;
        if (!el) return;
        // Only auto-scroll if content overflows
        if (el.scrollWidth <= el.clientWidth) return;

        let raf: number;
        const speed = 0.5; // px per frame

        const step = () => {
            if (!catPausedRef.current && el) {
                el.scrollLeft += speed;
                // Loop: when reaching the end, jump back to start
                if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
                    el.scrollLeft = 0;
                }
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);

        // Pause on user interaction
        const pause = () => {
            catPausedRef.current = true;
            if (catPauseTimer.current) clearTimeout(catPauseTimer.current);
            catPauseTimer.current = setTimeout(() => { catPausedRef.current = false; }, 3000);
        };

        el.addEventListener('touchstart', pause, { passive: true });
        el.addEventListener('mouseenter', pause);
        el.addEventListener('wheel', pause, { passive: true });

        return () => {
            cancelAnimationFrame(raf);
            if (catPauseTimer.current) clearTimeout(catPauseTimer.current);
            el.removeEventListener('touchstart', pause);
            el.removeEventListener('mouseenter', pause);
            el.removeEventListener('wheel', pause);
        };
    }, [categories]);

    // Deep-link: auto-open product from ?product= URL query param
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        const productId = searchParams.get('product');
        if (productId && products.length > 0 && !selectedProduct) {
            const target = products.find(p => p.id === productId);
            if (target) {
                setSelectedProduct(target);
                // Clean up the URL param after opening
                searchParams.delete('product');
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [products, searchParams]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(PRODUCTS_PER_PAGE);
    }, [activeCategory, searchQuery]);

    // Late-response listener: check if agent responded to expired inquiries
    useEffect(() => {
        let unsubscribers: (() => void)[] = [];
        try {
            const raw = localStorage.getItem('pendingInquiries');
            if (!raw) return;
            const pending: { inquiryId: string; businessId: string; createdAt: number }[] = JSON.parse(raw);
            if (!pending.length) return;

            // Clean entries older than 24 hours
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            const valid = pending.filter(p => p.createdAt > cutoff);
            if (valid.length !== pending.length) {
                localStorage.setItem('pendingInquiries', JSON.stringify(valid));
            }
            if (!valid.length) return;

            // Dynamic import to avoid loading firebase for all visitors
            import('firebase/firestore').then(({ doc: firestoreDoc, onSnapshot: fsOnSnapshot }) => {
                import('../../../services/firebase').then(({ db: fsDb }) => {
                    valid.forEach(entry => {
                        const ref = firestoreDoc(fsDb, `businesses/${entry.businessId}/stockInquiries`, entry.inquiryId);
                        const unsub = fsOnSnapshot(ref, (snap) => {
                            const data = snap.data();
                            if (!data) return;
                            const st = data.status as string;
                            // Agent responded — notify customer
                            if (['no_change', 'updated', 'inactive', 'checking'].includes(st)) {
                                let message = '✅ Барааны лавлагаа хүсэлтэд хариу ирлээ!';
                                if (st === 'no_change') message = '✅ Барааны мэдээлэл өөрчлөгдөөгүй — захиалга хийх боломжтой!';
                                if (st === 'updated') message = '🔄 Барааны мэдээлэл шинэчлэгдлээ — шалгана уу!';
                                if (st === 'inactive') message = '❌ Бараа одоогоор нөөцөд байхгүй байна.';
                                if (st === 'checking') return; // still in progress

                                toast(message, {
                                    duration: 8000,
                                    style: { background: '#1e293b', color: '#fff', fontWeight: 600, fontSize: '0.88rem' },
                                    icon: st === 'inactive' ? '❌' : '🔔',
                                });

                                // Remove from pending
                                try {
                                    const current = JSON.parse(localStorage.getItem('pendingInquiries') || '[]');
                                    const filtered = current.filter((p: any) => p.inquiryId !== entry.inquiryId);
                                    localStorage.setItem('pendingInquiries', JSON.stringify(filtered));
                                } catch (_) {}

                                unsub();
                            }
                        });
                        unsubscribers.push(unsub);
                    });
                });
            });
        } catch (_) {}

        return () => { unsubscribers.forEach(u => u()); };
    }, []);

    // Check if user has stored phone (logged in) — check both membership and customer phone
    const storedPhone = localStorage.getItem(`membership_phone_${business.id}`) || localStorage.getItem('liscord_customer_phone') || '';
    const [customerPhone, setCustomerPhone] = useState(storedPhone);
    const hasMembership = activeMemberships.length > 0;

    const extractBrand = (desc: string) => {
        if (!desc) return null;
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^.,\n]+(?:\s*\([^)]*\))?)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    // Social proof: generate a consistent order count from product ID
    const getSocialProof = useCallback((productId: string) => {
        let hash = 0;
        for (let i = 0; i < productId.length; i++) {
            hash = ((hash << 5) - hash) + productId.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash % 113) + 8; // Range: 8-120
    }, []);

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleAddToCart = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        // If product has variations, open modal to pick one
        const varPrices = (p.variations || []).filter(v => (v.salePrice ?? 0) > 0);
        if (varPrices.length > 0 && (p.pricing?.salePrice || 0) === 0) {
            setSelectedProduct(p as StorefrontProduct);
            return;
        }
        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
        toast.success('Сагсанд нэмлээ', {
            duration: 2000,
            style: { background: '#1e293b', color: '#fff', fontSize: '0.88rem', fontWeight: 600 },
            icon: '🛒',
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
                <a href={`/${business.slug}`} className="store-logo">
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
                    <button
                        className={`store-profile-btn ${hasMembership ? 'has-membership' : ''}`}
                        onClick={() => setShowDashboard(true)}
                    >
                        <User size={18} strokeWidth={2.5} />
                        {hasMembership && <span className="store-profile-vip-dot" />}
                    </button>
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

                {/* Trust Banner */}
                <div className="sf-trust-banner">
                    <div className="sf-trust-track">
                        <div className="sf-trust-item">
                            <span className="sf-trust-icon">✅</span>
                            <span>100% баталгаатай бараа</span>
                        </div>
                        <div className="sf-trust-item">
                            <span className="sf-trust-icon">🚚</span>
                            <span>Хүргэлттэй</span>
                        </div>
                        <div className="sf-trust-item">
                            <span className="sf-trust-icon">🔒</span>
                            <span>Аюулгүй төлбөр</span>
                        </div>
                        <div className="sf-trust-item">
                            <span className="sf-trust-icon">⭐</span>
                            <span>Итгэлтэй худалдаа</span>
                        </div>
                        {/* Duplicate for seamless mobile marquee */}
                        <div className="sf-trust-item sf-trust-dup" aria-hidden="true">
                            <span className="sf-trust-icon">✅</span>
                            <span>100% баталгаатай бараа</span>
                        </div>
                        <div className="sf-trust-item sf-trust-dup" aria-hidden="true">
                            <span className="sf-trust-icon">🚚</span>
                            <span>Хүргэлттэй</span>
                        </div>
                        <div className="sf-trust-item sf-trust-dup" aria-hidden="true">
                            <span className="sf-trust-icon">🔒</span>
                            <span>Аюулгүй төлбөр</span>
                        </div>
                        <div className="sf-trust-item sf-trust-dup" aria-hidden="true">
                            <span className="sf-trust-icon">⭐</span>
                            <span>Итгэлтэй худалдаа</span>
                        </div>
                    </div>
                </div>

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

                {/* Categories — auto-scrolling */}
                {categories.length > 2 && (
                    <div className="store-categories" ref={catScrollRef}>
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
                        products: (fd.products || []).map((p: any) => ({
                            ...p,
                            addedAt: p.addedAt?.toDate?.()?.toISOString?.() || p.addedAt || null,
                        })),
                    };
                    return (
                        <FlashDealSection
                            config={flashConfig}
                            allProducts={products}
                            onProductClick={(p, fp) => {
                                setFlashDealPrice(fp ?? null);
                                setSelectedProduct(p);
                            }}
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
                            filteredProducts.slice(0, visibleCount).map((p, index) => {
                                const sfp = p as StorefrontProduct;
                                const brand = extractBrand(p.description);
                                const salePrice = p.pricing?.salePrice || 0;
                                const comparePrice = p.pricing?.comparePrice;
                                const hasDiscount = comparePrice && comparePrice > salePrice;
                                // Variation price range for cards (with legacy fallback: quantity as price if >= 1000)
                                const variationPrices = (p.variations || []).map(v => {
                                    if ((v.salePrice ?? 0) > 0) return v.salePrice!;
                                    if ((v.quantity ?? 0) >= 1000) return v.quantity!;
                                    return 0;
                                }).filter(pr => pr > 0);
                                const hasVariationPrices = variationPrices.length > 0 && salePrice === 0;
                                const minVarPrice = hasVariationPrices ? Math.min(...variationPrices) : 0;
                                const maxVarPrice = hasVariationPrices ? Math.max(...variationPrices) : 0;
                                const displayPrice = hasVariationPrices ? minVarPrice : salePrice;

                                return (
                                    <div
                                        key={p.id}
                                        className={`product-card ${sfp.isLocked ? 'product-card-locked' : ''}`}
                                        onClick={() => handleProductClick(sfp)}
                                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                    >
                                        <div className="product-image-wrap">

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
                                                ) : hasVariationPrices ? (
                                                    <span>
                                                        {minVarPrice === maxVarPrice
                                                            ? `${minVarPrice.toLocaleString()} ₮`
                                                            : `${minVarPrice.toLocaleString()} ~ ${maxVarPrice.toLocaleString()} ₮`
                                                        }
                                                    </span>
                                                ) : (
                                                    <>
                                                        {displayPrice.toLocaleString()} ₮
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
                                            {!sfp.isLocked && (
                                                <div className="sf-social-proof">
                                                    👥 {getSocialProof(p.id)}+ хүн захиалсан
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Load More */}
                    {filteredProducts.length > visibleCount && (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: 8, padding: '28px 0 12px',
                        }}>
                            <button
                                onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                                style={{
                                    padding: '12px 36px', borderRadius: 100,
                                    border: '1.5px solid #e0e0e0', background: '#fff',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    fontSize: '0.9rem', fontWeight: 600, color: '#333',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f5f5f5'; (e.target as HTMLElement).style.borderColor = '#bbb'; }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.background = '#fff'; (e.target as HTMLElement).style.borderColor = '#e0e0e0'; }}
                            >
                                Цааш үзэх
                            </button>
                            <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                {Math.min(visibleCount, filteredProducts.length)} / {filteredProducts.length} бараа
                            </span>
                        </div>
                    )}
                </div>
            </main>

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => { setSelectedProduct(null); setFlashDealPrice(null); }}
                    preorderTerms={business.settings?.storefront?.preorderTerms}
                    flashDealPrice={flashDealPrice ?? undefined}
                    businessId={business.id}
                    onCategoryClick={(catName) => {
                        setActiveCategory(catName);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
            )}

            {showMembershipModal && membershipTarget && (
                <MembershipModal
                    product={membershipTarget}
                    onClose={() => { setShowMembershipModal(false); setMembershipTarget(null); }}
                    onVerify={verifyMembership}
                    business={business}
                    customerPhone={customerPhone}
                />
            )}

            {/* Customer Dashboard Drawer */}
            <CustomerDashboard
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
                business={business}
                phone={customerPhone}
                onLogin={(phone) => {
                    setCustomerPhone(phone);
                    // Also verify membership with new phone
                    verifyMembership(phone.replace(/[^\d]/g, ''));
                }}
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
    customerPhone: loggedInPhone,
}: {
    product: StorefrontProduct;
    onClose: () => void;
    onVerify: (phone: string) => Promise<boolean>;
    business: Business;
    customerPhone?: string;
}) {
    const [phone, setPhone] = useState(loggedInPhone || '');
    const isAlreadyVerified = !!loggedInPhone;
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

    // Auto-check membership for logged-in users (skip OTP entirely)
    useEffect(() => {
        if (!isAlreadyVerified || !loggedInPhone) return;
        let cancelled = false;
        (async () => {
            setChecking(true);
            try {
                const hasMembership = await onVerify(loggedInPhone);
                if (cancelled) return;
                if (hasMembership) {
                    setSuccess(true);
                    setTimeout(() => onClose(), 1500);
                } else {
                    // No membership → go straight to payment
                    setShowPayment(true);
                }
            } catch {
                if (!cancelled) setShowPayment(true);
            } finally {
                if (!cancelled) setChecking(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

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
            const unsubscribe = onSnapshot(orderRef, async (snap) => {
                const data = snap.data();
                if (data?.paymentStatus === 'paid' && !paymentConfirmed) {
                    setPaymentConfirmed(true);
                    unsubscribe();
                    
                    // Auto-create membership when payment is confirmed (bank transfer or QPay callback)
                    if (product.exclusiveCategoryId) {
                        try {
                            const { addDoc, collection, serverTimestamp, Timestamp } = await import('firebase/firestore');
                            const cleanPh = cleanPhone.replace(/^976/, '');
                            const expDate = new Date();
                            expDate.setDate(expDate.getDate() + durationDays);
                            
                            await addDoc(collection(db, 'businesses', business.id, 'memberships'), {
                                customerPhone: cleanPh,
                                categoryId: product.exclusiveCategoryId,
                                orderId: newId,
                                purchasedAt: serverTimestamp(),
                                expiresAt: Timestamp.fromDate(expDate),
                                amountPaid: price,
                                status: 'active',
                                createdBy: 'payment_listener',
                            });
                        } catch (e) {
                            console.debug('Membership auto-create failed (may already exist via QPay):', e);
                        }
                    }
                    
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
                phone || '',
                'product',
                {
                    username: business.settings?.qpay?.username || '',
                    password: business.settings?.qpay?.password || '',
                    invoiceCode: business.settings?.qpay?.invoiceCode || '',
                }
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
    const invoiceIdRef = useRef<string>('');

    const startPaymentPolling = (invoiceId: string, _oid: string) => {
        // Clear any existing polling
        if (pollingRef.current) clearInterval(pollingRef.current);
        invoiceIdRef.current = invoiceId;

        let attempts = 0;
        const maxAttempts = 200; // ~10 min at 3s intervals

        pollingRef.current = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                return;
            }

            try {
                // Use /api/qpay-check (no Firebase Admin needed) to verify payment
                const qpaySettings = business.settings?.qpay;
                const resp = await fetch('/api/qpay-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceId: invoiceIdRef.current,
                        qpayUsername: qpaySettings?.username || '',
                        qpayPassword: qpaySettings?.password || '',
                        purpose: 'product',
                    }),
                });
                const data = await resp.json();

                if (data.paid) {
                    if (pollingRef.current) clearInterval(pollingRef.current);

                    // Update order as paid via client-side Firestore
                    try {
                        const { doc, updateDoc, getDoc } = await import('firebase/firestore');
                        const { db } = await import('../../../services/firebase');
                        const orderRef = doc(db, 'businesses', business.id, 'orders', _oid);
                        const orderSnap = await getDoc(orderRef);
                        const orderTotal = orderSnap.data()?.financials?.totalAmount || price;
                        await updateDoc(orderRef, {
                            status: 'confirmed',
                            paymentStatus: 'paid',
                            paymentVerifiedAt: new Date(),
                            paymentVerifiedBy: 'qpay',
                            'financials.paidAmount': orderTotal,
                            'financials.balanceDue': 0,
                        });
                    } catch (updateErr) {
                        console.warn('Client-side order update failed:', updateErr);
                    }

                    setPaymentConfirmed(true);
                    // onSnapshot listener will handle membership creation
                    const cleanPhone = phone.trim().replace(/[\s\-+]/g, '').replace(/^976/, '');
                    onVerify(cleanPhone);
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
                                {/* Bank apps first — primary action on mobile */}
                                {qpayData.urls.length > 0 && (
                                    <div className="sf-qpay-banks-section">
                                        <div className="sf-qpay-banks-divider">
                                            <span>банкны аппаар төлөх</span>
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
                                {/* QR code — secondary option */}
                                <div className="sf-qpay-banks-divider" style={{ marginTop: 16 }}>
                                    <span>эсвэл QR уншуулах</span>
                                </div>
                                <div className="sf-membership-qr">
                                    <img
                                        src={`data:image/png;base64,${qpayData.qr_image}`}
                                        alt="QPay QR"
                                        style={{ width: '160px', height: '160px', borderRadius: '12px' }}
                                    />
                                </div>
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
                ) : isAlreadyVerified ? (
                    /* Logged-in user — auto-checking membership, will auto-redirect to payment */
                    <div className="sf-membership-waiting" style={{ padding: '30px 0' }}>
                        <div className="sf-membership-spinner" />
                        Гишүүнчлэл шалгаж байна...
                    </div>
                ) : (
                    /* ═══ Phone + OTP verification (non-logged-in users only) ═══ */
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
                                            placeholder=""
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

