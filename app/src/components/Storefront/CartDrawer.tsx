import { useEffect } from 'react';
import { useCartStore } from '../../store';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalAmount, totalItems } = useCartStore();
    const navigate = useNavigate();
    const { slug } = useParams();

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [setIsOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="cart-drawer-overlay">
            <div className="cart-drawer-backdrop" onClick={() => setIsOpen(false)} />

            <div className="cart-drawer">
                <div className="cart-header">
                    <h2>Миний сагс ({totalItems()})</h2>
                    <button className="cart-close-btn" onClick={() => setIsOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <ShoppingBag size={48} />
                            <p>Таны сагс хоосон байна</p>
                            <button className="btn btn-outline" onClick={() => setIsOpen(false)}>
                                Буцан дэлгүүр хэсэх
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {items.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-image">
                                        {item.product.images?.[0] ? (
                                            <img src={item.product.images[0]} alt={item.product.name} />
                                        ) : (
                                            <div className="cart-item-placeholder">Зураггүй</div>
                                        )}
                                    </div>
                                    <div className="cart-item-info">
                                        <div className="cart-item-top">
                                            <h4>{item.product.name}</h4>
                                            <button className="cart-item-remove" onClick={() => removeItem(item.id)}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="cart-item-price">
                                            {item.price.toLocaleString()} ₮
                                        </div>
                                        <div className="cart-item-actions">
                                            <div className="qty-control">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                    <Minus size={14} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="item-total">
                                                {(item.price * item.quantity).toLocaleString()} ₮
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-summary">
                            <span>Нийт дүн:</span>
                            <span className="cart-total">{totalAmount().toLocaleString()} ₮</span>
                        </div>
                        <button
                            className="btn btn-primary cart-checkout-btn"
                            onClick={() => {
                                setIsOpen(false);
                                navigate(`/s/${slug}/checkout`);
                            }}
                        >
                            Тооцоо хийх <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
