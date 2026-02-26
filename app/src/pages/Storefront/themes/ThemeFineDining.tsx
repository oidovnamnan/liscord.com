import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeFineDining.css';

export function ThemeFineDining({ business }: { business: Business }) {
    const {
        loading,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const [isScrolled, setIsScrolled] = useState(false);
    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
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
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#0f1115', color: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>Уншиж байна...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-finedining">
            <header className="fd-header" style={{
                background: isScrolled ? 'rgba(15, 17, 21, 0.95)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(10px)' : 'none',
                position: isScrolled ? 'fixed' : 'absolute',
                padding: isScrolled ? '15px 6%' : '30px 6%',
                transition: 'all 0.3s ease'
            }}>
                <a href={`/s/${business.slug}`} className="fd-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName}</span>
                </a>

                <div className="fd-controls">
                    <button
                        className="fd-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <span>Захиалга</span>
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        {cartCount > 0 && `(${cartCount})`}
                    </button>
                </div>
            </header>

            <section className="fd-home-hero">
                <h1>{storeName}</h1>
                <p>Дээд зэрэглэлийн амт, төгс үйлчилгээ</p>
            </section>

            <div className="fd-menu-nav">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`fd-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => {
                            setActiveCategory(cat);
                            // Optional: scroll to menu section
                            document.getElementById('fd-menu')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        {cat === 'all' ? 'Бүтэн цэс' : cat}
                    </button>
                ))}
            </div>

            <main id="fd-menu" className="fd-menu-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="fd-menu-title">{activeCategory === 'all' ? 'Үндсэн цэс' : activeCategory}</h2>

                <div className="fd-menu-list">
                    {filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#7b808c', padding: '40px' }}>
                            Цэс хоосон байна
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="fd-menu-item" onClick={(e) => handleAddToCart(e, p)}>
                                <div className="fd-img-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="fd-img" loading="lazy" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Зураггүй</div>
                                    )}
                                </div>

                                <div className="fd-item-info">
                                    <div className="fd-item-header">
                                        <h3 className="fd-item-name">{p.name}</h3>
                                        <div className="fd-item-dots" />
                                        <div className="fd-item-price">{(p.pricing?.salePrice || 0).toLocaleString()} ₮</div>
                                    </div>
                                    <p className="fd-item-desc">{p.description || 'Орц: Тогоочийн нууц жор, шинэхэн хүнс...'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
