import { ShoppingBag } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeOneProduct.css';

export function ThemeOneProduct({ business }: { business: Business }) {
    const {
        loading, filteredProducts
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
        useCartStore.getState().setIsOpen(true);
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ачаалаж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;
    const heroProduct = filteredProducts[0]; // The first product acts as the Hero
    const restProducts = filteredProducts.slice(1);

    return (
        <div className="theme-oneproduct">
            <header className="one-header">
                <a href={`/s/${business.slug}`} className="one-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <button
                    className="one-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    <ShoppingBag size={18} />
                    {cartCount > 0 && <span>{cartCount}</span>}
                </button>
            </header>

            {heroProduct ? (
                <section className="one-hero animate-fade-in">
                    <div className="one-hero-img animate-slide-up">
                        {heroProduct.images?.[0] ? (
                            <img src={heroProduct.images[0]} alt={heroProduct.name} loading="lazy" />
                        ) : (
                            <div className="placeholder">Зураггүй</div>
                        )}
                    </div>

                    <div className="one-hero-text animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="one-badge">Шинэ</div>
                        <h1 className="one-title">{heroProduct.name}</h1>
                        <p className="one-desc">{heroProduct.description || 'Энэхүү онцгой бүтээгдэхүүн нь таны өдөр тутмын амьдралыг илүү хялбар, загварлаг болгох зорилттой.'}</p>

                        <div className="one-price-wrap">
                            <div className="one-price">{(heroProduct.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                            <button className="one-add-btn" onClick={(e) => handleAddToCart(e, heroProduct)}>
                                Худалдан авах
                            </button>
                        </div>

                        <div className="one-features">
                            <div className="one-feature-card">
                                <h4>Дээд зэргийн чанар</h4>
                                <p>Хамгийн сайн материалыг сонгон ашигласан.</p>
                            </div>
                            <div className="one-feature-card">
                                <h4>Орчин үеийн загвар</h4>
                                <p>Төгс минимал деталь бүхий дизайн.</p>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="one-hero">
                    <div className="one-hero-text">
                        <h1>Одоогоор бараа алга байна</h1>
                    </div>
                </section>
            )}

            {restProducts.length > 0 && (
                <section className="one-related">
                    <h2>Бусад бүтээгдэхүүн</h2>
                    <div className="one-grid">
                        {restProducts.map(p => (
                            <div key={p.id} className="one-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="one-card-img">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} loading="lazy" />
                                    ) : (
                                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#aaa' }}>Зураггүй</div>
                                    )}
                                </div>
                                <div className="one-card-info">
                                    <h3 className="one-card-title">{p.name}</h3>
                                    <div className="one-card-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    <button className="one-card-btn" onClick={(e) => handleAddToCart(e, p)}>
                                        Сагсанд хийх
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
