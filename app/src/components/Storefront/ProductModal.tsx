import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store';
import './ProductModal.css';

interface ProductModalProps {
    product: Product;
    onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [activeImage, setActiveImage] = useState(0);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleAddToCart = () => {
        useCartStore.getState().addItem({
            product,
            quantity,
            price: product.pricing?.salePrice || 0
        });
        setAdded(true);
        setTimeout(() => {
            setAdded(false);
            onClose();
        }, 800);
    };

    const extractBrand = (desc: string) => {
        if (!desc) return null;
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^\n|*]+)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    const brand = extractBrand(product.description);
    const images = product.images?.filter(Boolean) || [];
    const hasStock = !product.stock?.trackInventory || (product.stock?.quantity ?? 0) > 0;
    const salePrice = product.pricing?.salePrice || 0;
    const comparePrice = product.pricing?.comparePrice;
    const hasDiscount = comparePrice && comparePrice > salePrice;
    const discountPercent = hasDiscount ? Math.round((1 - salePrice / comparePrice) * 100) : 0;

    return (
        <div className="sf-modal-overlay" onClick={onClose}>
            <div className="sf-modal-container" onClick={e => e.stopPropagation()}>
                <button className="sf-modal-close" onClick={onClose} aria-label="Хаах">
                    <X size={20} />
                </button>

                <div className="sf-modal-content">
                    {/* Gallery */}
                    <div className="sf-modal-gallery">
                        {images.length > 0 ? (
                            <img
                                src={images[activeImage] || images[0]}
                                alt={product.name}
                                className="sf-modal-main-img"
                                draggable={false}
                            />
                        ) : (
                            <div className="sf-modal-img-placeholder">📦</div>
                        )}

                        {/* Thumbnail strip */}
                        {images.length > 1 && (
                            <div style={{
                                position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', gap: 6
                            }}>
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        style={{
                                            width: activeImage === i ? 24 : 8,
                                            height: 8,
                                            borderRadius: 4,
                                            border: 'none',
                                            background: activeImage === i ? 'var(--sf-brand-color, #111)' : 'rgba(0,0,0,0.15)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            padding: 0,
                                        }}
                                        aria-label={`Зураг ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="sf-modal-info">
                        {(brand || product.categoryName) && (
                            <span className="sf-modal-category">
                                {brand || product.categoryName}
                            </span>
                        )}

                        <h2 className="sf-modal-title">{product.name}</h2>

                        <div className="sf-modal-price">
                            <span>{salePrice.toLocaleString()} ₮</span>
                            {hasDiscount && (
                                <>
                                    <span className="sf-modal-compare-price">
                                        {comparePrice.toLocaleString()} ₮
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 700,
                                        background: '#fef2f2', color: '#dc2626',
                                        padding: '3px 8px', borderRadius: 100,
                                    }}>
                                        -{discountPercent}%
                                    </span>
                                </>
                            )}
                        </div>

                        <hr className="sf-modal-divider" />

                        {/* Stock indicator */}
                        <div className="sf-modal-stock" style={!hasStock ? { color: '#dc2626' } : undefined}>
                            <span className="sf-modal-stock-dot" style={!hasStock ? { background: '#dc2626', animation: 'none' } : undefined} />
                            {hasStock ? 'Нөөцөд байгаа' : 'Дууссан'}
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="sf-modal-desc">
                                {product.description}
                            </div>
                        )}

                        {/* Add to cart */}
                        <div className="sf-modal-actions">
                            <div className="sf-modal-qty">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                    aria-label="Хасах"
                                >
                                    <Minus size={16} />
                                </button>
                                <span>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    aria-label="Нэмэх"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <button
                                className="sf-modal-add-btn"
                                onClick={handleAddToCart}
                                disabled={added}
                                style={added ? { background: '#16a34a' } : undefined}
                            >
                                {added ? (
                                    <><Check size={18} /> Нэмэгдлээ!</>
                                ) : (
                                    <><ShoppingBag size={18} /> Сагсанд нэмэх</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
