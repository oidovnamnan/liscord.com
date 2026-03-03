import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ChevronLeft, ChevronRight, Package } from 'lucide-react';
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const touchRef = useRef<{ startX: number; startY: number } | null>(null);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Close on Escape, arrow keys for gallery
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, activeImage]);

    const images = product.images?.filter(Boolean) || [];

    const goToNext = useCallback(() => {
        if (images.length <= 1 || isTransitioning) return;
        setIsTransitioning(true);
        setActiveImage(prev => (prev + 1) % images.length);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [images.length, isTransitioning]);

    const goToPrev = useCallback(() => {
        if (images.length <= 1 || isTransitioning) return;
        setIsTransitioning(true);
        setActiveImage(prev => (prev - 1 + images.length) % images.length);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [images.length, isTransitioning]);

    // Touch swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchRef.current || images.length <= 1) return;
        const deltaX = e.changedTouches[0].clientX - touchRef.current.startX;
        const deltaY = e.changedTouches[0].clientY - touchRef.current.startY;

        // Only swipe if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX < 0) goToNext();
            else goToPrev();
        }
        touchRef.current = null;
    };

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
        const brandMatch = desc.match(/(?:Брэнд|Brand):\s*([^.,\n]+(?:\s*\([^)]*\))?)/i);
        if (brandMatch) return brandMatch[1].trim();
        return null;
    };

    const brand = extractBrand(product.description);
    const isPreorder = product.productType === 'preorder';
    const hasStock = isPreorder || !product.stock?.trackInventory || (product.stock?.quantity ?? 0) > 0;
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
                    {/* Gallery with swipe support */}
                    <div
                        className="sf-modal-gallery"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {images.length > 0 ? (
                            <img
                                key={activeImage}
                                src={images[activeImage] || images[0]}
                                alt={`${product.name} - зураг ${activeImage + 1}`}
                                className="sf-modal-main-img sf-img-fade"
                                draggable={false}
                            />
                        ) : (
                            <div className="sf-modal-img-placeholder">📦</div>
                        )}

                        {/* Left/Right navigation arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    className="sf-gallery-arrow sf-gallery-arrow-left"
                                    onClick={goToPrev}
                                    aria-label="Өмнөх зураг"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    className="sf-gallery-arrow sf-gallery-arrow-right"
                                    onClick={goToNext}
                                    aria-label="Дараагийн зураг"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}

                        {/* Image counter */}
                        {images.length > 1 && (
                            <div className="sf-gallery-counter">
                                {activeImage + 1} / {images.length}
                            </div>
                        )}

                        {/* Dot indicators */}
                        {images.length > 1 && (
                            <div className="sf-gallery-dots">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (!isTransitioning) {
                                                setIsTransitioning(true);
                                                setActiveImage(i);
                                                setTimeout(() => setIsTransitioning(false), 300);
                                            }
                                        }}
                                        className={`sf-gallery-dot ${activeImage === i ? 'active' : ''}`}
                                        aria-label={`Зураг ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Thumbnail strip for 3+ images */}
                        {images.length >= 3 && (
                            <div className="sf-gallery-thumbs">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`sf-gallery-thumb ${activeImage === i ? 'active' : ''}`}
                                        onClick={() => {
                                            setIsTransitioning(true);
                                            setActiveImage(i);
                                            setTimeout(() => setIsTransitioning(false), 300);
                                        }}
                                    >
                                        <img src={img} alt={`Thumbnail ${i + 1}`} />
                                    </button>
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

                        {/* Stock / Preorder indicator */}
                        {isPreorder ? (
                            <div className="sf-modal-stock" style={{ color: 'var(--sf-brand-color, #6366f1)' }}>
                                <Package size={15} />
                                Захиалгаар авах боломжтой
                            </div>
                        ) : (
                            <div className="sf-modal-stock" style={!hasStock ? { color: '#dc2626' } : undefined}>
                                <span className="sf-modal-stock-dot" style={!hasStock ? { background: '#dc2626', animation: 'none' } : undefined} />
                                {hasStock ? 'Нөөцөд байгаа' : 'Дууссан'}
                            </div>
                        )}

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
