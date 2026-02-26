import { useState, useEffect } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeFurniture.css';

export function ThemeFurniture({ business }: { business: Business }) {
    const {
        loading,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const [isScrolled, setIsScrolled] = useState(false);
    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        return <div style={{ height: '100vh', background: '#faf9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: '#888' }}>Түр хүлээнэ үү...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-furniture">
            <header className="furn-header" style={{
                background: isScrolled ? '#fff' : 'transparent',
                color: isScrolled ? '#222' : '#fff',
                position: isScrolled ? 'fixed' : 'absolute',
                boxShadow: isScrolled ? '0 1px 10px rgba(0,0,0,0.05)' : 'none',
                padding: isScrolled ? '16px 6%' : '24px 6%',
                transition: 'all 0.3s ease'
            }}>
                <a href={`/s/${business.slug}`} className="furn-logo">
                    {business.logo && <img src={business.logo} alt={storeName} style={{ filter: isScrolled ? 'none' : 'brightness(0) invert(1)' }} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <div className="furn-controls">
                    <button
                        className="furn-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        Захиалга
                        <ShoppingBag size={18} style={{ marginLeft: 8 }} />
                        {cartCount > 0 && <span style={{ marginLeft: 6 }}>({cartCount})</span>}
                    </button>
                </div>
            </header>

            {!isScrolled && (
                <section className="furn-hero">
                    <div className="furn-hero-content animate-fade-in">
                        <h1>Орчин үеийн тавилга, интерьер</h1>
                        <p>Гэртээ тав тухтай, тансаг байдлыг цогцлоох төгс сонголтууд.</p>
                    </div>
                </section>
            )}

            <div className="furn-nav-wrap">
                <nav className="furn-nav">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`furn-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat === 'all' ? 'Бүтээгдэхүүнүүд' : cat}
                        </button>
                    ))}
                </nav>
            </div>

            <main className="furn-main animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="furn-grid">
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#aaa', fontSize: '1.1rem' }}>
                            Илэрц олдсонгүй.
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="furn-card" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="furn-img-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="furn-img" loading="lazy" />
                                    ) : (
                                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>Зураггүй</div>
                                    )}
                                </div>
                                <div className="furn-card-info">
                                    <div>
                                        <h3 className="furn-title">{p.name}</h3>
                                        <p className="furn-desc">{p.categoryId || 'Тавилга'}</p>
                                    </div>
                                    <div className="furn-action">
                                        <div className="furn-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                        <button className="furn-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                            <Plus size={18} />
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
