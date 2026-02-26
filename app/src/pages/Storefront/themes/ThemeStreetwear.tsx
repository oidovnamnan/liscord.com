import { ShoppingCart, Search, Flame } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeStreetwear.css';

export function ThemeStreetwear({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
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
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>LOADING_DROP...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-streetwear">
            <header className="streetwear-header">
                <a href={`/s/${business.slug}`} className="streetwear-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="streetwear-controls">
                    <div className="streetwear-search-wrap">
                        <Search size={18} color="#fff" />
                        <input
                            type="text"
                            placeholder="SEARCH DROP"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="streetwear-search-input"
                        />
                    </div>

                    <button
                        className="streetwear-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingCart size={24} strokeWidth={2} />
                        {cartCount > 0 && <span className="cart-badge-sw">{cartCount}</span>}
                    </button>
                </div>
            </header>

            <div className="sw-drop-banner">
                <Flame size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
                LATEST DROP AVAILABLE NOW
            </div>

            <div className="streetwear-filters">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`sw-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'ALL ITEMS' : cat}
                    </button>
                ))}
            </div>

            <main className="streetwear-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                        NO ITEMS FOUND IN THIS DROP.
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="sw-card" onClick={(e) => handleAddToCart(e, p)}>
                            <div className="sw-img-wrap">
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="sw-img" loading="lazy" />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.8rem', fontFamily: 'monospace' }}>NO_IMG</div>
                                )}
                            </div>

                            <div className="sw-card-info">
                                <h3 className="sw-title">{p.name}</h3>
                                <div className="sw-price">{(p.pricing?.salePrice || 0).toLocaleString()} MNT</div>

                                <button className="sw-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                    ADD TO CART
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
