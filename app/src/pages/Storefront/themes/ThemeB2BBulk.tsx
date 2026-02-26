import { ShoppingCart, Search, Plus, Minus } from 'lucide-react';
import type { Business, Product } from '../../../types';
import { useCartStore } from '../../../store';
import { useStorefrontData } from '../hooks/useStorefrontData';
import './ThemeB2BBulk.css';

export function ThemeB2BBulk({ business }: { business: Business }) {
    const {
        loading, searchQuery, setSearchQuery,
        activeCategory, setActiveCategory, categories, filteredProducts
    } = useStorefrontData(business);

    const cartItems = useCartStore(state => state.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // B2B specific: keep local input state for quantity before adding to global cart
    // Actually, integrating directly with cart is better UX so it syncs immediately.
    const getItemQuantity = (productId: string) => {
        return cartItems.find(i => i.product.id === productId)?.quantity || 0;
    };

    const handleUpdateQuantity = (p: Product, newQty: number) => {
        if (newQty < 0) return;

        if (newQty === 0) {
            useCartStore.getState().removeItem(p.id);
        } else {
            const existing = cartItems.find(i => i.product.id === p.id);
            if (existing) {
                useCartStore.getState().updateQuantity(p.id, newQty);
            } else {
                useCartStore.getState().addItem({
                    product: p,
                    quantity: newQty,
                    price: p.pricing?.salePrice || 0
                });
            }
        }
    };

    if (loading) {
        return <div style={{ height: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading List...</div>;
    }

    const storeName = business.settings?.storefront?.name || business.name;

    return (
        <div className="theme-b2b">
            <header className="b2b-header">
                <a href={`/s/${business.slug}`} className="b2b-logo">
                    {business.logo && <img src={business.logo} alt={storeName} />}
                    <span className="hide-mobile">{storeName} Wholesale</span>
                </a>

                <div className="b2b-controls">
                    <div className="b2b-search">
                        <Search size={16} color="#adb5bd" />
                        <input
                            type="text"
                            placeholder="Шуурхай хайх (SKU, Нэр)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        className="b2b-cart-btn"
                        onClick={() => useCartStore.getState().setIsOpen(true)}
                    >
                        <ShoppingCart size={18} />
                        <span className="hide-mobile">{cartCount} ш / {cartTotal.toLocaleString()} ₮</span>
                        <span className="hide-desktop">{cartCount}</span>
                    </button>
                </div>
            </header>

            <main className="b2b-main">
                <div className="b2b-layout">
                    <aside className="b2b-sidebar animate-fade-in">
                        <h2 className="b2b-sidebar-title">Ангилал</h2>
                        <div className="b2b-cat-list">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`b2b-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat === 'all' ? 'Бүх бараа' : cat}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="b2b-content animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="b2b-table-wrap">
                            <table className="b2b-table">
                                <thead>
                                    <tr>
                                        <th>Барааны код (SKU)</th>
                                        <th>Зураг</th>
                                        <th>Нэр / Үзүүлэлт</th>
                                        <th>Бөөний үнэ</th>
                                        <th>Үлдэгдэл</th>
                                        <th style={{ width: 140 }}>Тоо ширхэг</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>Илэрц олдсонгүй</td>
                                        </tr>
                                    ) : (
                                        filteredProducts.map(p => {
                                            const qty = getItemQuantity(p.id);
                                            return (
                                                <tr key={p.id}>
                                                    <td className="b2b-td-sku">{p.barcode || p.id.slice(0, 8).toUpperCase()}</td>
                                                    <td>
                                                        {p.images?.[0] ?
                                                            <img src={p.images[0]} alt="" className="b2b-td-img" loading="lazy" /> :
                                                            <div className="b2b-td-img" />
                                                        }
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                    <td style={{ color: '#0056b3', fontWeight: 600 }}>{(p.pricing?.salePrice || 0).toLocaleString()} ₮</td>
                                                    <td style={{ color: (p.stock?.quantity || 0) > 0 ? '#28a745' : '#dc3545' }}>
                                                        {(p.stock?.quantity || 0) > 0 ? (p.stock?.quantity || 0) : 'Гүйцсэн'}
                                                    </td>
                                                    <td>
                                                        <div className="b2b-qty-wrap">
                                                            <button onClick={() => handleUpdateQuantity(p, qty - 1)}>
                                                                <Minus size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={qty || ''}
                                                                placeholder="0"
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    handleUpdateQuantity(p, isNaN(val) ? 0 : val);
                                                                }}
                                                            />
                                                            <button onClick={() => handleUpdateQuantity(p, qty + 1)}>
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
