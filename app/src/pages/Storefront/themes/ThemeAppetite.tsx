import { ShoppingBag, Search, Plus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeAppetite.css';

export function ThemeAppetite({ business }: { business: Business }) {
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
        <div className="theme-appetite">
            <header className="appetite-header">
                <div className="appetite-top">
                    <a href={`/s/${business.slug}`} className="appetite-logo">
                        {business.logo && <img src={business.logo} alt={storeName} />}
                        {storeName}
                    </a>

                    <button
                        className="appetite-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        {cartCount > 0 && <span className="appetite-cart-badge">{cartCount}</span>}
                    </button>
                </div>

                <div className="appetite-search-wrap">
                    <Search size={18} className="appetite-search-icon" />
                    <input
                        type="text"
                        placeholder="Хоол болон уух зүйлс хайх..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="appetite-search-input"
                    />
                </div>
            </header>

            <div className="appetite-categories">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`appetite-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүх цэс' : cat}
                    </button>
                ))}
            </div>

            <main className="appetite-main">
                <div className="appetite-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {products.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Цэс хоосон байна</div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="appetite-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="appetite-info">
                                    <h3 className="appetite-name">{p.name}</h3>
                                    {p.description && (
                                        <p className="appetite-desc">{p.description}</p>
                                    )}
                                    <div className="appetite-price">
                                        {(p.pricing?.salePrice || 0).toLocaleString()} ₮
                                    </div>
                                </div>
                                <div className="appetite-image-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="appetite-image" loading="lazy" />
                                    ) : (
                                        <div style={{ color: '#a3a19b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.8rem' }}>Зураггүй</div>
                                    )}
                                    <div className="appetite-add-btn">
                                        <Plus size={18} strokeWidth={3} />
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
