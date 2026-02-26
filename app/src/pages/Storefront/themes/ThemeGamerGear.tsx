import { ShoppingCart, Search, Crosshair } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeGamerGear.css';

export function ThemeGamerGear({ business }: { business: Business }) {
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
        return <div style={{ height: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontFamily: '"Rajdhani", sans-serif', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Initialize...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-gamer">
            <header className="gamer-header">
                <a href={`/s/${business.slug}`} className="gamer-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <div className="gamer-controls">
                    <div className="gamer-search">
                        <Search size={16} color="#a1a1aa" />
                        <input
                            type="text"
                            placeholder="Search arsenal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        className="gamer-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingCart size={18} />
                        <span className="hide-mobile">Lootbox</span>
                        {cartCount > 0 && <span className="gamer-cart-badge">{cartCount}</span>}
                    </button>
                </div>
            </header>

            <section className="gamer-hero animate-fade-in">
                <h1>Level Up Your Setup</h1>
                <p>Equip yourself with the ultimate hardware and accessories built for performance, precision, and victory.</p>
            </section>

            <nav className="gamer-nav animate-fade-in">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`gmr-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'All Gear' : cat}
                    </button>
                ))}
            </nav>

            <main className="gamer-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#52525b', fontSize: '1.2rem', border: '1px dashed #27272a', borderRadius: '8px' }}>
                        No items found in this category.
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="gmr-card">
                            <div className="gmr-img-wrap" onClick={() => { /* maybe open modal */ }}>
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="gmr-img" loading="lazy" />
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#3f3f46' }}>No Image</div>
                                )}
                            </div>

                            <div className="gmr-info">
                                <div className="gmr-cat">{p.categoryId || 'Hardware'}</div>
                                <h3 className="gmr-title">{p.name}</h3>

                                <div className="gmr-bottom">
                                    <div className="gmr-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    <button className="gmr-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                        <Crosshair size={20} />
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
