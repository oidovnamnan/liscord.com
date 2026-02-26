import { CheckCircle2 } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeSaaS.css';

export function ThemeSaaS({ business }: { business: Business }) {
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
        return <div style={{ height: '100vh', background: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading Data...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-saas">
            <header className="saas-header">
                <a href={`/s/${business.slug}`} className="saas-logo">
                    {business.logo ? <img src={business.logo} alt={storeName} /> : <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 8 }} />}
                    {storeName}
                </a>

                <button
                    className="saas-cart-btn"
                    onClick={() => useCartStore.getState().setIsOpen(true)}
                >
                    Checkout {cartCount > 0 && `(${cartCount})`}
                </button>
            </header>

            <main>
                <section className="saas-hero animate-fade-in">
                    <div className="saas-badge">v2.0 Released</div>
                    <h1>Unlock your full potential</h1>
                    <p>Choose the perfect plan or digital product that fits your needs. No hidden fees, cancel anytime.</p>
                </section>

                <div className="saas-pricing-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8' }}>
                            No active plans found.
                        </div>
                    ) : (
                        filteredProducts.map((p) => (
                            <div key={p.id} className="saas-card">
                                <div className="saas-cat">{p.categoryId || 'Digital Product'}</div>
                                <h3 className="saas-title">{p.name}</h3>
                                <div className="saas-desc">{p.description || 'Everything you need to get started with our core features and integrations.'}</div>

                                <div className="saas-price">
                                    {(p.pricing?.salePrice || 0).toLocaleString()} ₮
                                    <span>/ one-time</span>
                                </div>

                                <ul className="saas-features">
                                    <li><CheckCircle2 size={16} color="#3b82f6" /> Full access</li>
                                    <li><CheckCircle2 size={16} color="#3b82f6" /> Standard support</li>
                                    <li><CheckCircle2 size={16} color="#3b82f6" /> 1 year updates</li>
                                </ul>

                                <button className="saas-add-btn" onClick={(e) => handleAddToCart(e, p)}>
                                    Get Started
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
