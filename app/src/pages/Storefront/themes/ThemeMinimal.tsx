import { useState } from 'react';
import { ShoppingBag, Search, Plus, Lock, Crown, X, Phone } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData, type StorefrontProduct } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import { ProductModal } from '../../../components/Storefront/ProductModal';
import '../Storefront.css';

export function ThemeMinimal({ business }: { business: Business }) {
    const {
        products, loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts,
        verifyMembership,
    } = useStorefrontData(business);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [membershipTarget, setMembershipTarget] = useState<StorefrontProduct | null>(null);

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

                <button
                    className="store-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    <ShoppingBag size={18} strokeWidth={2.5} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    <span className="hide-mobile">Сагс</span>
                </button>
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
                                                    style={sfp.isLocked ? { filter: 'blur(8px)', opacity: 0.5 } : undefined}
                                                />
                                            ) : (
                                                <div style={{ color: '#ccc', fontSize: '2.5rem' }}>📦</div>
                                            )}

                                            {sfp.isLocked ? (
                                                <div className="sf-lock-overlay">
                                                    <Lock size={28} />
                                                    <span>VIP гишүүнчлэл</span>
                                                    {sfp.membershipConfig && (
                                                        <span className="sf-lock-price">
                                                            ₮{sfp.membershipConfig.price.toLocaleString()} / {sfp.membershipConfig.durationDays} хоног
                                                        </span>
                                                    )}
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
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// Membership Verification Modal
// ═══════════════════════════════════════════
function MembershipModal({
    product,
    onClose,
    onVerify,
}: {
    product: StorefrontProduct;
    onClose: () => void;
    onVerify: (phone: string) => Promise<boolean>;
}) {
    const [phone, setPhone] = useState('');
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleVerify = async () => {
        if (!phone.trim() || phone.length < 8) {
            setError('Утасны дугаараа оруулна уу');
            return;
        }
        setChecking(true);
        setError('');
        try {
            const hasMembership = await onVerify(phone.trim().replace(/[\s\-+]/g, ''));
            if (hasMembership) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError('Таны дугаар дээр идэвхтэй гишүүнчлэл олдсонгүй. Админтай холбогдоно уу.');
            }
        } catch {
            setError('Алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="sf-membership-backdrop" onClick={onClose}>
            <div className="sf-membership-modal" onClick={e => e.stopPropagation()}>
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

                {product.membershipConfig && (
                    <div className="sf-membership-pricing">
                        <div className="sf-membership-price">
                            ₮{product.membershipConfig.price.toLocaleString()}
                        </div>
                        <div className="sf-membership-duration">
                             / {product.membershipConfig.durationDays} хоног
                        </div>
                    </div>
                )}

                {success ? (
                    <div className="sf-membership-success">
                        ✅ Гишүүнчлэл баталгаажлаа! Хуудсыг шинэчилж байна...
                    </div>
                ) : (
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
                                />
                            </div>
                            {error && <div className="sf-membership-error">{error}</div>}
                        </div>

                        <button
                            className="sf-membership-verify-btn"
                            onClick={handleVerify}
                            disabled={checking}
                        >
                            {checking ? 'Шалгаж байна...' : 'Гишүүнчлэл шалгах'}
                        </button>

                        <p className="sf-membership-hint">
                            Гишүүнчлэл авахыг хүсвэл дэлгүүрийн админтай холбогдоно уу.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
