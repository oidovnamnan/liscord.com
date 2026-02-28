import { Search, ShoppingCart, CheckCircle, AlertTriangle, XCircle, Settings } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeAutoParts.css';

export function ThemeAutoParts({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleAddToCart = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        if ((p.stock?.quantity || 0) <= 0) return;

        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontWeight: 600 }}>Loading parts database...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-auto">
            <header className="auto-header">
                <a href={`/s/${business.slug}`} className="auto-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <div className="auto-controls">
                    <div className="auto-search-wrap">
                        <input
                            type="text"
                            placeholder="OEM дугаар, баркод, нэрээр хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="auto-search-input"
                        />
                        <button className="auto-search-btn">
                            <Search size={18} />
                        </button>
                    </div>

                    <button
                        className="auto-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingCart size={20} />
                        <span className="hide-mobile">Сагс</span>
                        {cartCount > 0 && <span className="auto-cart-badge">{cartCount}</span>}
                    </button>
                </div>
            </header>

            <nav className="auto-nav">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`auto-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүх каталог' : cat}
                    </button>
                ))}
            </nav>

            <main className="auto-main animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="auto-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#718096', fontSize: '1.2rem', background: '#fff', border: '1px solid #e2e8f0' }}>
                            Сэлбэг олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => {
                            const qty = p.stock?.quantity || 0;
                            const isOuter = qty <= 0;
                            const isLow = qty > 0 && qty < 5;

                            return (
                                <div key={p.id} className="auto-card">
                                    <div className="auto-img-wrap" onClick={() => { /* maybe open modal */ }}>
                                        {p.images?.[0] ? (
                                            <img src={p.images[0]} alt={p.name} className="auto-img" loading="lazy" />
                                        ) : (
                                            <Settings size={48} color="#cbd5e0" strokeWidth={1} />
                                        )}
                                    </div>

                                    <div className="auto-info">
                                        <div className="auto-sku">SKU: {p.barcode || p.id.slice(0, 10).toUpperCase()}</div>
                                        <h3 className="auto-title">{p.name}</h3>

                                        <ul className="auto-specs">
                                            <li><span>Үйлдвэрлэгч</span> <span>OEM / Aftermarket</span></li>
                                            <li><span>Жин</span> <span>4.2 kg</span></li>
                                            <li><span>Төрөл</span> <span>{p.categoryId || 'General'}</span></li>
                                        </ul>

                                        <div className="auto-bottom">
                                            <div className="auto-price-wrap">
                                                <div className={`auto-stock ${isOuter ? 'out' : isLow ? 'low' : ''}`}>
                                                    {isOuter ? <XCircle size={14} /> : isLow ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                                    {isOuter ? 'Дууссан' : `Үлдэгдэл: ${qty} ш`}
                                                </div>
                                                <div className="auto-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                            </div>

                                            <button
                                                className="auto-add-btn"
                                                onClick={(e) => handleAddToCart(e, p)}
                                                disabled={isOuter}
                                            >
                                                <ShoppingCart size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
