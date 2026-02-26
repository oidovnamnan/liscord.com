import { ShoppingBag, Search, Plus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeCafe.css';

export function ThemeCafe({ business }: { business: Business }) {
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
        return <div style={{ height: '100vh', background: '#fdfaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a3b32', fontFamily: '"Outfit", sans-serif' }}>Цэс уншиж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-cafe">
            <header className="cafe-header">
                <a href={`/s/${business.slug}`} className="cafe-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="cafe-controls">
                    <div className="cafe-search-wrap">
                        <Search size={18} color="#9c8b7e" />
                        <input
                            type="text"
                            placeholder="Юу уумаар байна?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="cafe-search-input"
                        />
                    </div>

                    <button
                        className="cafe-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        {cartCount > 0 && <span style={{ marginLeft: 4 }}>{cartCount}</span>}
                    </button>
                </div>
            </header>

            <nav className="cafe-nav">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`cafe-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүх цэс' : cat}
                    </button>
                ))}
            </nav>

            <main className="cafe-main animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="cafe-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#9c8b7e' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="cafe-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="cafe-img-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="cafe-img" loading="lazy" />
                                    ) : (
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9c8b7e', fontSize: '0.8rem' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="cafe-card-info">
                                    <h3 className="cafe-card-title">{p.name}</h3>
                                    <p className="cafe-card-desc">{p.description || 'Амтат, шинэхэн орцоор бэлтгэв.'}</p>

                                    <div className="cafe-card-bottom">
                                        <div className="cafe-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                        <button className="cafe-add" onClick={(e) => handleAddToCart(e, p)}>
                                            <Plus size={24} strokeWidth={2.5} />
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
