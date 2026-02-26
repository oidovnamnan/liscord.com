import { ShoppingBag } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeArtisan.css';

export function ThemeArtisan({ business }: { business: Business }) {
    const {
        loading,
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
        useCartStore.getState().setIsOpen(true);
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#fdfaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Lora", serif', fontSize: '1.2rem', color: '#727a6c' }}>Шинэхэн бүтээлүүд...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-artisan">
            <header className="artisan-header">
                <a href={`/s/${business.slug}`} className="artisan-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <button
                    className="artisan-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    <ShoppingBag size={18} />
                    Цүнх {cartCount > 0 && `(${cartCount})`}
                </button>
            </header>

            <section className="artisan-hero animate-fade-in">
                <h1>Уламжлал ба Орчин үеийн <br /> төгс хослол</h1>
                <p>Байгалийн гаралтай материалуудаар, гараар урласан дахин давтагдашгүй бүтээлүүдийн цуглуулга.</p>
            </section>

            <nav className="artisan-nav animate-fade-in">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`art-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat === 'all' ? 'Бүх бүтээл' : cat}
                    </button>
                ))}
            </nav>

            <main className="artisan-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#727a6c', fontFamily: '"Inter", sans-serif' }}>
                        Бүтээл олдсонгүй
                    </div>
                ) : (
                    filteredProducts.map(p => (
                        <div key={p.id} className="art-card" onClick={(e) => handleAddToCart(e, p)}>
                            <div className="art-img-wrap">
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} className="art-img" loading="lazy" />
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#b5bcae', fontSize: '0.9rem' }}>Зураггүй</div>
                                )}
                            </div>

                            <div className="art-info">
                                <h3 className="art-title">{p.name}</h3>
                                <p className="art-desc">{p.description || 'Эко, цэвэр байгалийн гаралтай орцоор тусгайлан урласан бүтээгдэхүүн.'}</p>

                                <div className="art-bottom">
                                    <div className="art-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    <button className="art-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                        Сагслах
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
