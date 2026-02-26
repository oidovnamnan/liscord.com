import { ShoppingBag, Search } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeLookbook.css';

export function ThemeLookbook({ business }: { business: Business }) {
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

    // We can simulate Masonry heights by injecting a pseudo-random aspect ratio multiplier based on product ID
    // but actual images will dictate the height if we leave height: auto. 
    // To prevent layout jumps before images load, it's better to force aspect ratios.
    const getPaddingTop = (id: string) => {
        const charCode = id.charCodeAt(id.length - 1);
        if (charCode % 3 === 0) return '150%'; // tall
        if (charCode % 2 === 0) return '100%'; // square
        return '130%'; // standard portrait
    };

    return (
        <div className="theme-lookbook">
            <header className="lookbook-header">
                <a href={`/s/${business.slug}`} className="lookbook-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="lookbook-controls">
                    <div className="lookbook-search-wrap hide-mobile">
                        <Search size={16} color="#767676" />
                        <input
                            type="text"
                            placeholder="Хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="lookbook-search-input"
                        />
                    </div>

                    <button
                        className="lookbook-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={24} strokeWidth={1.5} color="#111" />
                        {cartCount > 0 && <span className="cart-badge" style={{ background: '#e60023' }}>{cartCount}</span>}
                    </button>
                </div>
            </header>

            <div className="lookbook-search-wrap hide-desktop" style={{ width: 'auto', margin: '0 4% 1rem 4%' }}>
                <Search size={16} color="#767676" />
                <input
                    type="text"
                    placeholder="Хайх..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="lookbook-search-input"
                />
            </div>

            <div className="lookbook-categories">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`lookbook-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүгд' : cat}
                    </button>
                ))}
            </div>

            <main className="lookbook-main">
                <div className="lookbook-masonry animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {products.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>Агнах бараа алга</div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ padding: '40px', color: 'var(--text-muted)' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="lookbook-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="lookbook-image-wrap" style={{ paddingTop: p.images?.[0] ? 0 : getPaddingTop(p.id) }}>
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="lookbook-image" loading="lazy" />
                                    ) : (
                                        <div style={{ position: 'absolute', inset: 0, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="lookbook-overlay">
                                    <button className="lookbook-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                        Сагсанд
                                    </button>
                                    <div className="lookbook-info-chip">
                                        <div className="lookbook-name">{p.name}</div>
                                        <div className="lookbook-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
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
