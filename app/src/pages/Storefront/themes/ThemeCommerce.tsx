import { ShoppingBag, Search, ShoppingCart } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import './ThemeCommerce.css';

export function ThemeCommerce({ business }: { business: Business }) {
    const {
        products, loading, searchQuery, setSearchQuery,
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
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ачаалж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-commerce">
            <header className="commerce-header">
                <div className="commerce-top-bar">
                    <a href={`/s/${business.slug}`} className="commerce-logo">
                        {business.logo && <img src={business.logo} alt={storeName} />}
                        {storeName}
                    </a>

                    <div className="commerce-search-wrap">
                        <Search size={20} className="commerce-search-icon" />
                        <input
                            type="text"
                            placeholder="Бүх төрлийн бараа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="commerce-search-input"
                        />
                    </div>

                    <button
                        className="store-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                        style={{ border: 'none', background: '#f4f4f5', padding: '10px 20px', borderRadius: '100px', alignSelf: 'center' }}
                    >
                        <ShoppingCart size={22} strokeWidth={2} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                </div>

                <div className="commerce-categories">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`commerce-category-pill ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Бүгд' : cat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="commerce-main">
                <div className="commerce-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {products.length === 0 ? (
                        <StorefrontEmpty message="Агнах бараа алга" />
                    ) : filteredProducts.length === 0 ? (
                        <StorefrontEmpty />
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="commerce-card">
                                <div className="commerce-image-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="commerce-image" loading="lazy" />
                                    ) : (
                                        <div style={{ color: '#a3a19b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.9rem' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="commerce-info">
                                    <h3 className="commerce-name">{p.name}</h3>
                                    <div className="commerce-bottom">
                                        <div className="commerce-price">
                                            {(p.pricing?.salePrice || 0).toLocaleString()} ₮
                                        </div>
                                        <button
                                            className="commerce-add-btn"
                                            onClick={(e) => handleAddToCart(e, p)}
                                            title="Сагсанд нэмэх"
                                        >
                                            <ShoppingBag size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
