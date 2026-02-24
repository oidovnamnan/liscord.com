import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingBag, Search, Plus } from 'lucide-react';
import type { Business, Product } from '../../types';
import { productService } from '../../services/db';
import { useCartStore } from '../../store';
import './Storefront.css';

export function StoreCatalog() {
    const { business } = useOutletContext<{ business: Business }>();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        if (!business) return;
        setLoading(true);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data.filter(p => !p.isDeleted && p.isActive !== false));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach(p => {
            if (p.categoryName) cats.add(p.categoryName);
        });
        return ['all', ...Array.from(cats)];
    }, [products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = activeCategory === 'all' || p.categoryName === activeCategory;
            return matchesSearch && matchesCat;
        });
    }, [products, searchQuery, activeCategory]);

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
        <div className="store-bg">
            {/* Minimal Navbar */}
            <nav className="store-nav">
                <a href={`/s/${business.slug}`} className="store-logo">
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

            <main className="store-container">
                <header className="store-header animate-fade-in">
                    <h1 className="store-header-title">{activeCategory === 'all' ? storeName : activeCategory}</h1>

                    <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Бараа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 44px',
                                borderRadius: '100px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-body)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div className="store-categories">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat === 'all' ? 'Бүх бараа' : cat}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="product-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {products.length === 0 ? (
                        <>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="product-card" style={{ opacity: 0.6 }}>
                                    <div className="product-image-wrap" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)' }}>
                                        <div style={{ color: 'var(--text-muted)' }}>Агнах бараа алга</div>
                                    </div>
                                    <div className="product-info" style={{ gap: '8px' }}>
                                        <div style={{ height: '16px', borderRadius: '4px', background: 'var(--bg-soft)', width: '80%' }}></div>
                                        <div style={{ height: '20px', borderRadius: '4px', background: 'var(--bg-soft)', width: '40%' }}></div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Илэрц олдсонгүй
                        </div>
                    ) : (
                        filteredProducts.map(p => (
                            <div key={p.id} className="product-card">
                                <div className="product-image-wrap">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} alt={p.name} className="product-image" loading="lazy" />
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)' }}>Зураггүй</div>
                                    )}

                                    <button
                                        className="product-add-overlay"
                                        onClick={(e) => handleAddToCart(e, p)}
                                        title="Сагсанд нэмэх"
                                    >
                                        <Plus size={20} strokeWidth={2} />
                                    </button>
                                </div>

                                <div className="product-info">
                                    <h3 className="product-name">{p.name}</h3>
                                    <div className="product-price">
                                        {(p.pricing?.salePrice || 0).toLocaleString()} ₮
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
