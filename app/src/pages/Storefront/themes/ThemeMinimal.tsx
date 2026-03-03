import { useState } from 'react';
import { ShoppingBag, Search, Plus, X, Minus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import '../Storefront.css';

export function ThemeMinimal({ business }: { business: Business }) {
    const {
        products, loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);

    const extractBrand = (desc: string) => {
        if (!desc) return null;
        // Look for common patterns in FB imported descriptions
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^\n|*]+)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleOpenProduct = (p: Product) => {
        setSelectedProduct(p);
        setQuantity(1);
    };

    const handleAddToCart = (e: React.MouseEvent | null, p: Product, qty: number = 1) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        useCartStore.getState().addItem({
            product: p,
            quantity: qty,
            price: p.pricing?.salePrice || 0
        });
        if (!e) setSelectedProduct(null); // Close modal if added from modal
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ачаалж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="store-bg animate-fade-in">
            {/* Floating Premium Navbar */}
            <nav className="store-nav">
                <a href={`/s/${business.slug}`} className="store-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span>{storeName}</span>
                </a>

                <button
                    className="store-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    <ShoppingBag size={20} strokeWidth={2.5} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    <span className="hide-mobile" style={{ fontWeight: 700, fontSize: '0.9rem', marginLeft: 4, fontFamily: 'var(--sf-font-body)' }}>Сагс</span>
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

                {/* Modern Search */}
                <div className="store-search-container">
                    <div className="store-search-inner">
                        <Search size={20} className="store-search-icon" />
                        <input
                            type="text"
                            placeholder="Хүссэн бараагаа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="store-search-input"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="store-categories animate-fade-in" style={{ animationDelay: '0.2s' }}>
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

                {/* Product Grid */}
                <div className="store-container">
                    <div className="product-grid animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        {products.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}>
                                <StorefrontEmpty message="Одоогоор бараа ороогүй байна" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div style={{ gridColumn: '1/-1' }}>
                                <StorefrontEmpty message="Ийм нэртэй бараа олдсонгүй" />
                            </div>
                        ) : (
                            filteredProducts.map(p => {
                                const brand = extractBrand(p.description);
                                return (
                                    <div key={p.id} className="product-card" onClick={() => handleOpenProduct(p)}>
                                        <div className="product-image-wrap">
                                            {brand && <div className="product-brand-badge">{brand}</div>}
                                            {p.images?.[0] ? (
                                                <img src={p.images[0]} alt={p.name} className="product-image" loading="lazy" />
                                            ) : (
                                                <div style={{ color: 'var(--sf-text-muted)', fontSize: '3rem' }}>📦</div>
                                            )}

                                            <button
                                                className="product-add-overlay"
                                                onClick={(e) => handleAddToCart(e, p)}
                                                title="Сагсанд нэмэх"
                                            >
                                                <Plus size={24} strokeWidth={3} />
                                            </button>
                                        </div>

                                        <div className="product-info">
                                            <h3 className="product-name">{p.name}</h3>
                                            <div className="product-price">
                                                {(p.pricing?.salePrice || 0).toLocaleString()} ₮
                                                {p.pricing?.comparePrice && p.pricing.comparePrice > (p.pricing.salePrice || 0) && (
                                                    <span style={{ fontSize: '0.85rem', textDecoration: 'line-through', opacity: 0.4, fontWeight: 500 }}>
                                                        {p.pricing.comparePrice.toLocaleString()} ₮
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

            {/* Premium Product Modal */}
            {selectedProduct && (
                <div className="sf-modal-overlay animate-fade-in" onClick={() => setSelectedProduct(null)}>
                    <div className="sf-modal-container animate-slide-up" onClick={e => e.stopPropagation()}>
                        <button className="sf-modal-close" onClick={() => setSelectedProduct(null)}>
                            <X size={24} />
                        </button>

                        <div className="sf-modal-content">
                            <div className="sf-modal-gallery">
                                {selectedProduct.images?.[0] ? (
                                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="sf-modal-main-img" />
                                ) : (
                                    <div className="sf-modal-img-placeholder">📦</div>
                                )}
                            </div>

                            <div className="sf-modal-info">
                                <span className="sf-modal-category">
                                    {extractBrand(selectedProduct.description) || selectedProduct.categoryName}
                                </span>
                                <h2 className="sf-modal-title">{selectedProduct.name}</h2>
                                <div className="sf-modal-price">
                                    {(selectedProduct.pricing?.salePrice || 0).toLocaleString()} ₮
                                    {selectedProduct.pricing?.comparePrice && selectedProduct.pricing.comparePrice > (selectedProduct.pricing.salePrice || 0) && (
                                        <span className="sf-modal-compare-price">
                                            {selectedProduct.pricing.comparePrice.toLocaleString()} ₮
                                        </span>
                                    )}
                                </div>

                                <div className="sf-modal-desc">
                                    {selectedProduct.description || 'Энэхүү бүтээгдэхүүний талаарх дэлгэрэнгүй мэдээллийг тун удахгүй оруулах болно.'}
                                </div>

                                <div className="sf-modal-actions">
                                    <div className="sf-modal-qty">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={18} /></button>
                                        <span>{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
                                    </div>
                                    <button
                                        className="sf-modal-add-btn"
                                        onClick={() => handleAddToCart(null, selectedProduct, quantity)}
                                    >
                                        Сагсанд нэмэх
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
