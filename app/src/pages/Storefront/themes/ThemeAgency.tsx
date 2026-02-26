import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeAgency.css';

export function ThemeAgency({ business }: { business: Business }) {
    const {
        loading,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

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
        useCartStore.getState().setIsOpen(true);
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#fff', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif' }}>Loading works...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-agency">
            <header className="agency-header">
                <a href={`/s/${business.slug}`} className="agency-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="agency-controls">
                    <button
                        className="agency-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        Cart {cartCount > 0 && <span className="agency-cart-count">{cartCount}</span>}
                    </button>
                </div>
            </header>

            <section className="agency-hero animate-fade-in">
                <h1>Selected Works <br />& Services</h1>
                <p>A collection of our premium offerings, digital products, and creative solutions designed to elevate your brand.</p>
            </section>

            <div className="agency-filters">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`agc-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'All' : cat}
                    </button>
                ))}
            </div>

            <main className="agency-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ color: '#888', fontSize: '1.2rem' }}>No projects found.</div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="agc-card" onClick={(e) => handleAddToCart(e, p)}>
                            <div className="agc-img-wrap">
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="agc-img" loading="lazy" />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No Preview</div>
                                )}
                            </div>

                            <div className="agc-info-row">
                                <div>
                                    <h3 className="agc-title">{p.name}</h3>
                                    <div className="agc-cat">{p.categoryId || 'Digital'} / Concept</div>
                                </div>

                                <div className="agc-action">
                                    <div className="agc-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    <button className="agc-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                        Acquire
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
