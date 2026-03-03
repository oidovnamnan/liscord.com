import { useState } from 'react';
import { ShoppingBag, Search, Plus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import { ProductModal } from '../../../components/Storefront/ProductModal';
import '../Storefront.css';

export function ThemeMinimal({ business }: { business: Business }) {
    const {
        products, loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
                                const brand = extractBrand(p.description);
                                const salePrice = p.pricing?.salePrice || 0;
                                const comparePrice = p.pricing?.comparePrice;
                                const hasDiscount = comparePrice && comparePrice > salePrice;

                                return (
                                    <div
                                        key={p.id}
                                        className="product-card"
                                        onClick={() => setSelectedProduct(p)}
                                        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                                    >
                                        <div className="product-image-wrap">
                                            {brand && <div className="product-brand-badge">{brand}</div>}

                                            {hasDiscount && (
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
                                                <img src={p.images[0]} alt={p.name} className="product-image" loading="lazy" />
                                            ) : (
                                                <div style={{ color: '#ccc', fontSize: '2.5rem' }}>📦</div>
                                            )}

                                            <button
                                                className="product-add-overlay"
                                                onClick={(e) => handleAddToCart(e, p)}
                                                title="Сагсанд нэмэх"
                                            >
                                                <Plus size={20} strokeWidth={2.5} />
                                            </button>
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">{p.name}</h3>
                                            <div className="product-price">
                                                {salePrice.toLocaleString()} ₮
                                                {hasDiscount && (
                                                    <span style={{
                                                        fontSize: '0.82rem', textDecoration: 'line-through',
                                                        opacity: 0.35, fontWeight: 400, color: '#888'
                                                    }}>
                                                        {comparePrice.toLocaleString()} ₮
                                                    </span>
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
                />
            )}
        </div>
    );
}
