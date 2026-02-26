import { useState } from 'react';
import { ShoppingBag, Search, X } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeCosmetics.css';

export function ThemeCosmetics({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        return <div style={{ height: '100vh', background: '#faf4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#4a403a' }}>Уншиж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-cosmetics">
            <div className={`cosmetics-search-overlay ${isSearchOpen ? 'open' : ''}`}>
                <Search size={24} color="#b5a9a1" />
                <input
                    type="text"
                    placeholder="Бүтээгдэхүүн хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="cosmetics-search-input"
                    autoFocus={isSearchOpen}
                />
                <button className="cosmetics-close-search" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
                    <X size={24} />
                </button>
            </div>

            <header className="cosmetics-header">
                {/* Empty div for symmetry if we want logo centered, but keeping it standard flow for now */}
                <div></div>

                <a href={`/s/${business.slug}`} className="cosmetics-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="cosmetics-controls">
                    <button className="cosmetics-search-btn" onClick={() => setIsSearchOpen(true)}>
                        <Search size={22} strokeWidth={1.5} />
                    </button>

                    <button
                        className="cosmetics-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={22} strokeWidth={1.5} />
                        ({cartCount})
                    </button>
                </div>
            </header>

            <section className="cosmetics-hero">
                <h1>Арьс арчилгааны гайхамшиг</h1>
                <p>Байгалийн гаралтай, эрүүл гоо сайхан</p>
            </section>

            <div className="cosmetics-cats">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`cosmetics-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүх бүтээгдэхүүн' : cat}
                    </button>
                ))}
            </div>

            <main className="cosmetics-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#a89f98', fontFamily: '"Lato", sans-serif' }}>
                        Бүтээгдэхүүн олдсонгүй
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="cosmetics-card" onClick={(e) => handleAddToCart(e, p)}>
                            <div className="co-img-wrap">
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="co-img" loading="lazy" />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b5a9a1', fontSize: '0.8rem', fontFamily: '"Lato", sans-serif' }}>Зураггүй</div>
                                )}
                            </div>

                            <div className="co-brand">{p.categoryId || 'Beauty'}</div>
                            <h3 className="co-title">{p.name}</h3>
                            <div className="co-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>

                            <button className="co-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                Сагсанд нэмэх
                            </button>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
