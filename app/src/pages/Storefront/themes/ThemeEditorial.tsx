import { ShoppingBag } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import { StorefrontEmpty } from '../../../components/Storefront/StorefrontEmpty';
import './ThemeEditorial.css';

export function ThemeEditorial({ business }: { business: Business }) {
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
        <div className="theme-editorial">
            <nav className="editorial-nav">
                <a href={`/s/${business.slug}`} className="editorial-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <button
                    className="store-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    <ShoppingBag size={24} strokeWidth={1.5} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
            </nav>

            <div className="editorial-layout">
                <aside className="editorial-sidebar">
                    <div className="editorial-sidebar-title">Категори</div>
                    <div className="editorial-categories">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`editorial-category-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat === 'all' ? 'Бүх бараа' : cat}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="editorial-main">
                    <div className="editorial-search-wrap animate-fade-in">
                        <input
                            type="text"
                            placeholder="Юу хайж байна вэ?..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="editorial-search-input"
                        />
                    </div>

                    <div className="editorial-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {products.length === 0 ? (
                            <StorefrontEmpty message="Агнах бараа алга" />
                        ) : filteredProducts.length === 0 ? (
                            <StorefrontEmpty />
                        ) : (
                            filteredProducts.map(p => (
                                <div key={p.id} className="editorial-card">
                                    <div className="editorial-image-wrap">
                                        {p.images?.[0] ? (
                                            <img src={p.images[0]} alt={p.name} className="editorial-image" loading="lazy" />
                                        ) : (
                                            <div style={{ color: '#a3a19b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Зураггүй</div>
                                        )}

                                        <button
                                            className="editorial-add-btn"
                                            onClick={(e) => handleAddToCart(e, p)}
                                        >
                                            Сагсанд нэмэх
                                        </button>
                                    </div>

                                    <div className="editorial-info">
                                        <h3 className="editorial-name">{p.name}</h3>
                                        <div className="editorial-price">
                                            {(p.pricing?.salePrice || 0).toLocaleString()} ₮
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
