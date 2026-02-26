import { ShoppingCart, Search } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeTechSpecs.css';

export function ThemeTechSpecs({ business }: { business: Business }) {
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
        return <div style={{ height: '100vh', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568' }}>Мэдээлэл татаж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-tech">
            <header className="tech-header">
                <div className="tech-header-top animate-fade-in">
                    <a href={`/s/${business.slug}`} className="tech-logo">
                        {business.logo && <img src={business.logo} alt={storeName} />}
                        {storeName}
                    </a>

                    <div className="tech-search-form">
                        <input
                            type="text"
                            placeholder="Модель, брэнд, үзүүлэлтээр хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="tech-search-input"
                        />
                        <button className="tech-search-btn">
                            <Search size={18} />
                        </button>
                    </div>

                    <div className="tech-controls">
                        <button
                            className="tech-cart-btn"
                            onClick={() => useCartStore.getState().setIsOpen(true)}
                        >
                            <ShoppingCart size={24} color="#2d3748" />
                            <span className="tech-cart-label">Сагс</span>
                            {cartCount > 0 && <span className="cart-badge-tech">{cartCount}</span>}
                        </button>
                    </div>
                </div>

                <div className="tech-header-bottom">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`tech-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Бүх ангилал' : cat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="tech-main animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="tech-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="tech-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="tech-img-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="tech-img" loading="lazy" />
                                    ) : (
                                        <div style={{ color: '#cbd5e0', fontSize: '0.85rem' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="tech-info">
                                    <div className="tech-brand">{p.categoryId || 'Tech'}</div>
                                    <h3 className="tech-title">{p.name}</h3>

                                    {/* Simulated bullet points from description if possible, else just generic placeholder for spec look */}
                                    <ul className="tech-specs">
                                        <li>{p.barcode ? `SKU: ${p.barcode}` : 'Баталгаат хугацаа: 12 сар'}</li>
                                        <li>{(p.stock?.quantity || 0) > 0 ? `Агуулахад бэлэн: ${p.stock.quantity}` : 'Захиалгаар'}</li>
                                        <li>Үйлчилгээ: Хүргэлт, суурилуулалт</li>
                                    </ul>

                                    <div className="tech-price-row">
                                        <div className="tech-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                        <button className="tech-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                            <ShoppingCart size={16} />
                                            Нэмэх
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
