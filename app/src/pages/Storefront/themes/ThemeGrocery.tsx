import { ShoppingCart, Search, Plus, Minus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeGrocery.css';

export function ThemeGrocery({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const getItemQuantity = (productId: string) => {
        return cartItems.find(i => i.product.id === productId)?.quantity || 0;
    };

    const handleAdd = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
    };

    const handleRemove = (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();
        useCartStore.getState().removeItem(productId);
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Ачаалаж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-grocery">
            <header className="grocery-header">
                <div className="grocery-header-top animate-fade-in">
                    <a href={`/s/${business.slug}`} className="grocery-logo">
                        {business.logo && <img src={business.logo} alt={storeName} />}
                        {storeName}
                    </a>

                    <div className="grocery-search-form">
                        <Search size={20} className="grocery-search-icon" />
                        <input
                            type="text"
                            placeholder="Хүнс, ахуйн хэрэглээ, ундаа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="grocery-search-input"
                        />
                    </div>

                    <button
                        className="grocery-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingCart size={22} />
                        <span className="hide-mobile">{cartCount} бараа</span>
                        {cartTotal > 0 && <span className="grocery-cart-total">{cartTotal.toLocaleString()} ₮</span>}
                    </button>
                </div>

                <nav className="grocery-nav">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`gro-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Бүх бараа' : cat}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="grocery-main animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="grocery-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                            Одоогоор бараа алга
                        </div>
                    ) : (
                        filteredProducts.map(p => {
                            const qty = getItemQuantity(p.id);

                            return (
                                <div key={p.id} className="gro-card">
                                    <div className="gro-img-wrap" onClick={() => { /* maybe open modal but minimal grocery usually adds directly */ }}>
                                        {p.images?.[0] ? (
                                            <img src={p.images[0]} alt={p.name} className="gro-img" loading="lazy" />
                                        ) : (
                                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', fontSize: '0.8rem', background: '#f8fafc' }}>{p.categoryId}</div>
                                        )}
                                    </div>

                                    <div className="gro-price-row">
                                        <div className="gro-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    </div>

                                    <h3 className="gro-title">{p.name}</h3>

                                    {qty > 0 ? (
                                        <div className="gro-qty-controls">
                                            <button className="gro-qty-btn" onClick={(e) => handleRemove(e, p.id)}>
                                                <Minus size={18} strokeWidth={2.5} />
                                            </button>
                                            <span className="gro-qty-val">{qty}</span>
                                            <button className="gro-qty-btn" onClick={(e) => handleAdd(e, p)}>
                                                <Plus size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="gro-add-initial" onClick={(e) => handleAdd(e, p)}>
                                            <Plus size={18} strokeWidth={3} />
                                            Сагсанд
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
