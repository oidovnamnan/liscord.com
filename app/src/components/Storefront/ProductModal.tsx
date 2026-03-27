import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Minus, ShoppingBag, Check, ChevronLeft, ChevronRight, Package, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Product } from '../../types';
import { useCartStore } from '../../store';
import './ProductModal.css';

interface ProductModalProps {
    product: Product;
    onClose: () => void;
    preorderTerms?: string;
    onCategoryClick?: (categoryName: string) => void;
    flashDealPrice?: number;
    flashDealMaxQty?: number;
    businessId?: string;
}

export function ProductModal({ product, onClose, preorderTerms, onCategoryClick, flashDealPrice, flashDealMaxQty, businessId }: ProductModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const touchRef = useRef<{ startX: number; startY: number } | null>(null);

    // Variation support — default to cheapest variation
    // Legacy fallback: some products have prices stored in `quantity` instead of `salePrice`
    const getVarPrice = (v: { salePrice?: number; quantity?: number }) => {
        if ((v.salePrice ?? 0) > 0) return v.salePrice!;
        // If quantity looks like a price (>= 1000), use it as fallback
        if ((v.quantity ?? 0) >= 1000) return v.quantity!;
        return 0;
    };
    const variations = (product.variations || []).filter(v => getVarPrice(v) > 0 || v.name);
    const hasVariations = variations.length > 0;
    const cheapestVariation = hasVariations
        ? variations.reduce((min, v) => (getVarPrice(v) < getVarPrice(min) || getVarPrice(min) === 0 ? v : min), variations[0])
        : null;
    const [selectedVariation, setSelectedVariation] = useState<string | null>(
        cheapestVariation?.id ?? null
    );
    const activeVariation = hasVariations ? variations.find(v => v.id === selectedVariation) || variations[0] : null;

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Track product view
    useEffect(() => {
        if (businessId && product?.id) {
            updateDoc(doc(db, 'businesses', businessId, 'products', product.id), {
                viewCount: increment(1)
            }).catch(() => {});
        }
    }, [businessId, product?.id]);

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

    // Price: variation price > flash deal > base sale price
    const variationPrice = activeVariation ? getVarPrice(activeVariation) : 0;
    const effectivePrice = flashDealPrice ?? (hasVariations && variationPrice > 0 ? variationPrice : (product.pricing?.salePrice || 0));

    const handleAddToCart = () => {
        const cartProduct = flashDealPrice
            ? { ...product, pricing: { ...product.pricing, salePrice: flashDealPrice } }
            : hasVariations && activeVariation
                ? { ...product, pricing: { ...product.pricing, salePrice: variationPrice }, name: `${product.name} — ${activeVariation.name}` }
                : product;
        useCartStore.getState().addItem({
            product: cartProduct,
            quantity,
            price: effectivePrice,
            maxQuantity: flashDealMaxQty,
        });
        toast.success('Сагсанд нэмлээ', {
            duration: 2000,
            style: { background: '#1e293b', color: '#fff', fontSize: '0.88rem', fontWeight: 600 },
            icon: '🛒',
        });
        setAdded(true);
        setTimeout(() => {
            setAdded(false);
            onClose();
        }, 800);
    };

    const handleBuyNow = () => {
        const cartProduct = flashDealPrice
            ? { ...product, pricing: { ...product.pricing, salePrice: flashDealPrice } }
            : hasVariations && activeVariation
                ? { ...product, pricing: { ...product.pricing, salePrice: variationPrice }, name: `${product.name} — ${activeVariation.name}` }
                : product;
        useCartStore.getState().addItem({
            product: cartProduct,
            quantity,
            price: effectivePrice,
            maxQuantity: flashDealMaxQty,
        });
        onClose();
        // Open cart immediately for checkout
        setTimeout(() => useCartStore.getState().setIsOpen(true), 100);
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
    const originalSalePrice = hasVariations && variationPrice > 0 ? variationPrice : (product.pricing?.salePrice || 0);
    const salePrice = flashDealPrice ?? originalSalePrice;
    const comparePrice = flashDealPrice ? (product.pricing?.salePrice || 0) : product.pricing?.comparePrice;
    const hasDiscount = (comparePrice && comparePrice > salePrice) || !!flashDealPrice;
    const discountPercent = hasDiscount && comparePrice ? Math.round((1 - salePrice / comparePrice) * 100) : 0;
    const isFlashDeal = !!flashDealPrice;

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
                        {/* Sticky Header: Category + Name + Price */}
                        <div className="sf-modal-info-header">
                            {(brand || product.categoryName) && (
                                <span
                                    className="sf-modal-category"
                                    style={onCategoryClick && product.categoryName ? { cursor: 'pointer' } : undefined}
                                    onClick={() => {
                                        if (onCategoryClick && product.categoryName) {
                                            onClose();
                                            onCategoryClick(product.categoryName);
                                        }
                                    }}
                                >
                                    {brand || product.categoryName}
                                </span>
                            )}

                            <h2 className="sf-modal-title">{product.name}</h2>

                            <div className="sf-modal-price">
                                {isFlashDeal && (
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                        color: '#fff',
                                        padding: '3px 10px', borderRadius: 100,
                                        marginRight: 6, display: 'inline-flex',
                                        alignItems: 'center', gap: 3,
                                    }}>
                                        <Zap size={11} /> FLASH DEAL
                                    </span>
                                )}
                                <span>{salePrice.toLocaleString()} ₮</span>
                                {hasDiscount && comparePrice && (
                                    <>
                                        <span className="sf-modal-compare-price">
                                            {comparePrice.toLocaleString()} ₮
                                        </span>
                                        {discountPercent > 0 && (
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 700,
                                                background: '#fef2f2', color: '#dc2626',
                                                padding: '3px 8px', borderRadius: 100,
                                            }}>
                                                -{discountPercent}%
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Scrollable content below sticky header */}
                        <div className="sf-modal-info-body">
                            {/* Variation selector */}
                            {hasVariations && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Хувилбар сонгох
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {variations.map(v => {
                                            const isActive = selectedVariation === v.id;
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => setSelectedVariation(v.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: 10,
                                                        border: isActive ? '2px solid #111' : '1.5px solid #e0e0e0',
                                                        background: isActive ? '#111' : '#fff',
                                                        color: isActive ? '#fff' : '#333',
                                                        fontSize: '0.82rem',
                                                        fontWeight: isActive ? 700 : 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        fontFamily: 'inherit',
                                                        lineHeight: 1.3,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                    }}
                                                >
                                                    <span>{v.name}</span>
                                                    {getVarPrice(v) > 0 && (
                                                        <span style={{ fontSize: '0.72rem', opacity: isActive ? 0.85 : 0.6 }}>
                                                            {getVarPrice(v).toLocaleString()}₮
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <hr className="sf-modal-divider" />

                            {/* Stock / Preorder indicator */}
                            {isPreorder ? (
                                <div className="sf-modal-preorder-badge">
                                    <Package size={16} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Урьдчилсан захиалга</div>
                                        <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>Захиалга өгсөнөөс хойш дунджаар 14 хоногт хүргэнэ</div>
                                    </div>
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
                                    {product.description
                                        // Split on newlines AND ' - ' separators (common in AI descriptions)
                                        .split(/\n| - /)
                                        .map((line, i) => {
                                        if (!line.trim()) return <br key={i} />;
                                        // Bold label pattern: "Label: value"
                                        const labelMatch = line.match(/^([^:]{2,25}):\s*(.+)/);
                                        const knownLabels = ['Хэмжээ', 'Хадгалах нөхцөл', 'Хадгалах хугацаа', 'Гарал үүсэл', 'Найрлага', 'Хэрэглэх заавар', 'Жин', 'Эзлэхүүн', 'Багц', 'Материал', 'Өнгө', 'Брэнд', 'Загвар', 'Багтаамж', 'Аюулгүй байдал', 'Чанартай материал', 'Биед эвтэйхэн', 'Аялахад тухтай', 'Зориулалт', 'Онцлог', 'Хэмжээс', 'Бүтээгдэхүүн', 'Төрөл'];
                                        if (labelMatch && knownLabels.some(l => labelMatch[1].trim().includes(l))) {
                                            return <div key={i} className="sf-modal-desc-detail"><strong>{labelMatch[1].trim()}:</strong> {labelMatch[2]}</div>;
                                        }
                                        return <span key={i}>{line}{' '}</span>;
                                    })}
                                </div>
                            )}


                        </div>

                        {/* Actions: Quantity + Buy Now + Add to Cart */}
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
                            <div className="sf-modal-btn-group">
                                <button
                                    className="sf-modal-cart-btn"
                                    onClick={handleAddToCart}
                                    disabled={added}
                                    style={added ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff' } : undefined}
                                >
                                    {added ? (
                                        <><Check size={16} /> Нэмэгдлээ!</>
                                    ) : (
                                        <><ShoppingBag size={16} /> <span className="sf-btn-label">Сагслах</span></>
                                    )}
                                </button>
                                <button
                                    className="sf-modal-add-btn"
                                    onClick={handleBuyNow}
                                    disabled={false}
                                    style={undefined}
                                >
                                    <Zap size={16} /> <span className="sf-btn-label">Захиалах</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
