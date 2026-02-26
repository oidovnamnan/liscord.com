import { ShoppingBag, Search, Clock, Award } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeServiceBooking.css';

export function ThemeServiceBooking({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleBook = (e: React.MouseEvent, p: Product) => {
        e.preventDefault();
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: p,
            quantity: 1,
            price: p.pricing?.salePrice || 0
        });
        useCartStore.getState().setIsOpen(true);
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Ачаалаж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-service">
            <header className="service-header">
                <a href={`/s/${business.slug}`} className="service-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    {storeName}
                </a>

                <div className="service-controls">
                    <div className="service-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Үйлчилгээ хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        className="service-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        {cartCount > 0 ? `${cartCount} захиалга` : 'Сагс'}
                    </button>
                </div>
            </header>

            <main className="service-main">
                <div className="service-hero animate-fade-in">
                    <h1>Үйлчилгээний цэс</h1>
                    <p>Танд хэрэгтэй мэргэжлийн үйлчилгээг сонгоно уу</p>
                </div>

                <div className="service-cats animate-fade-in">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`srv-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Бүх үйлчилгээ' : cat}
                        </button>
                    ))}
                </div>

                <div className="service-list animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '16px' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="srv-card" onClick={(e) => handleBook(e, p)}>
                                <div className="srv-img-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="srv-img" loading="lazy" />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', fontSize: '0.8rem' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="srv-info">
                                    <h3 className="srv-title">{p.name}</h3>

                                    <div className="srv-meta">
                                        {/* Simulating duration/info based on description or id, etc. */}
                                        <span><Clock size={14} /> 45 - 60 мин</span>
                                        <span><Award size={14} /> Мэргэжлийн</span>
                                    </div>

                                    <p className="srv-desc">{p.description || 'Үйлчилгээний дэлгэрэнгүй мэдээлэл болон нөхцөлүүд...'}</p>
                                </div>

                                <div className="srv-action">
                                    <div className="srv-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    <button className="srv-book-btn" onClick={(e) => handleBook(e, p)}>
                                        Цаг авах
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
