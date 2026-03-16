import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Zap, Clock } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store';

export interface FlashDealProduct {
    productId: string;
    flashPrice: number;
    maxQuantity: number;
    soldCount: number;
    addedAt?: string;
}

export interface FlashDealConfig {
    enabled: boolean;
    title: string;
    startsAt: Date;
    endsAt: Date;
    products: FlashDealProduct[];
}

interface FlashDealSectionProps {
    config: FlashDealConfig;
    allProducts: Product[];
    onProductClick?: (product: Product) => void;
}

function useCountdown(targetDate: Date) {
    const calcTimeLeft = useCallback(() => {
        const diff = targetDate.getTime() - Date.now();
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
        return {
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            expired: false,
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calcTimeLeft]);

    return timeLeft;
}

/** Flip-clock style digit */
function FlipDigit({ value }: { value: string }) {
    return <span className="fd-flip-digit">{value}</span>;
}

export function FlashDealSection({ config, allProducts, onProductClick }: FlashDealSectionProps) {
    const { hours, minutes, seconds, expired } = useCountdown(config.endsAt);
    const now = new Date();


    if (!config.enabled) return null;
    if (expired) return null;

    const pad = (n: number) => String(n).padStart(2, '0');
    const h = pad(hours);
    const m = pad(minutes);
    const s = pad(seconds);

    const handleAddToCart = (e: React.MouseEvent, product: Product, flashPrice: number) => {
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: { ...product, pricing: { ...product.pricing, salePrice: flashPrice } },
            quantity: 1,
            price: flashPrice,
        });
    };

    const dealProducts = config.products
        .map(fp => {
            const product = allProducts.find(p => p.id === fp.productId);
            if (!product) return null;
            return { ...fp, product };
        })
        .filter(Boolean) as (FlashDealProduct & { product: Product })[];

    if (dealProducts.length === 0) return null;

    // Scroll tracking
    const [activeIdx, setActiveIdx] = useState(0);
    const totalCards = dealProducts.length;
    const pageCount = Math.max(1, Math.ceil(totalCards / 2));

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const cardW = el.scrollWidth / totalCards;
        setActiveIdx(Math.round(el.scrollLeft / (cardW * 2)));
    };

    return (
        <div className="fd-section">
            {/* Glow orbs */}
            <div className="fd-glow fd-glow-1" />
            <div className="fd-glow fd-glow-2" />

            {/* Premium Header */}
            <div className="fd-header">
                <div className="fd-title-row">
                    <div className="fd-icon-pulse">
                        <Zap size={16} />
                    </div>
                    <h2 className="fd-title">{config.title || 'FLASH DEAL'}</h2>
                </div>
                <div className="fd-flip-timer">
                    <FlipDigit value={h[0]} />
                    <FlipDigit value={h[1]} />
                    <span className="fd-flip-sep">:</span>
                    <FlipDigit value={m[0]} />
                    <FlipDigit value={m[1]} />
                    <span className="fd-flip-sep">:</span>
                    <FlipDigit value={s[0]} />
                    <FlipDigit value={s[1]} />
                </div>
            </div>

            {/* Product cards carousel */}
            <div className="fd-products" onScroll={handleScroll}>
                {dealProducts.map(deal => {
                    const { product, flashPrice, maxQuantity, soldCount } = deal;
                    const originalPrice = product.pricing?.salePrice || 0;
                    const discountPercent = originalPrice > 0
                        ? Math.round((1 - flashPrice / originalPrice) * 100)
                        : 0;
                    const soldRatio = maxQuantity > 0 ? Math.min(1, soldCount / maxQuantity) : 0;
                    const remaining = Math.max(0, maxQuantity - soldCount);
                    const isSoldOut = remaining <= 0;

                    return (
                        <div
                            key={product.id}
                            className={`fd-card ${isSoldOut ? 'sold-out' : ''}`}
                            onClick={() => !isSoldOut && onProductClick?.(product)}
                        >
                            {/* Image container */}
                            <div className="fd-card-img-wrap">
                                <div className="fd-card-img">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.name} loading="lazy" />
                                    ) : (
                                        <div className="fd-img-placeholder">📦</div>
                                    )}
                                </div>
                                {discountPercent > 0 && (
                                    <div className="fd-discount-badge">-{discountPercent}%</div>
                                )}
                                {isSoldOut && (
                                    <div className="fd-sold-out-overlay">ДУУССАН</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="fd-card-info">
                                <div className="fd-card-name">{product.name}</div>
                                <div className="fd-card-prices">
                                    <span className="fd-flash-price">
                                        {flashPrice.toLocaleString()}₮
                                    </span>
                                    {originalPrice > flashPrice && (
                                        <span className="fd-original-price">
                                            {originalPrice.toLocaleString()}₮
                                        </span>
                                    )}
                                </div>

                                <div className="fd-progress-wrap">
                                    <div className="fd-progress-bar">
                                        <div className="fd-progress-fill" style={{ width: `${soldRatio * 100}%` }} />
                                    </div>
                                    <span className="fd-progress-text">
                                        {isSoldOut ? 'Дууссан' : `${remaining} үлдсэн`}
                                    </span>
                                </div>

                                {!isSoldOut && (
                                    <button
                                        className="fd-add-btn"
                                        onClick={(e) => handleAddToCart(e, product, flashPrice)}
                                    >
                                        <ShoppingBag size={13} />
                                        Авах
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scroll dots */}
            {pageCount > 1 && (
                <div className="fd-dots">
                    {Array.from({ length: pageCount }).map((_, i) => (
                        <div key={i} className={`fd-dot ${i === activeIdx ? 'active' : ''}`} />
                    ))}
                </div>
            )}
        </div>
    );
}
