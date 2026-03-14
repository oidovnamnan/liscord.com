import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Zap, Clock } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store';

export interface FlashDealProduct {
    productId: string;
    flashPrice: number;
    maxQuantity: number;
    soldCount: number;
    addedAt?: string; // ISO — when product was added to flash deal
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

/** Per-product countdown: each product counts down based on its own addedAt + deal duration */
function ProductCountdown({ addedAt, dealDuration }: { addedAt?: string; dealDuration: number }) {
    const calcTimeLeft = useCallback(() => {
        if (!addedAt) return { h: 0, m: 0, s: 0, expired: true };
        const expiresAt = new Date(addedAt).getTime() + dealDuration;
        const diff = expiresAt - Date.now();
        if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
        return {
            h: Math.floor(diff / (1000 * 60 * 60)),
            m: Math.floor((diff / (1000 * 60)) % 60),
            s: Math.floor((diff / 1000) % 60),
            expired: false,
        };
    }, [addedAt, dealDuration]);

    const [t, setT] = useState(calcTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => setT(calcTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calcTimeLeft]);

    if (t.expired) return null;

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="fd-timer-sm">
            <Clock size={11} />
            <span className="fd-timer-box-sm">{pad(t.h)}</span>
            <span className="fd-timer-sep-sm">:</span>
            <span className="fd-timer-box-sm">{pad(t.m)}</span>
            <span className="fd-timer-sep-sm">:</span>
            <span className="fd-timer-box-sm fd-timer-sec-sm">{pad(t.s)}</span>
        </div>
    );
}

export function FlashDealSection({ config, allProducts, onProductClick }: FlashDealSectionProps) {
    const now = new Date();
    if (!config.enabled) return null;

    // Deal duration in ms (from config startsAt to endsAt)
    const dealDuration = config.endsAt.getTime() - config.startsAt.getTime();

    const handleAddToCart = (e: React.MouseEvent, product: Product, flashPrice: number) => {
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: { ...product, pricing: { ...product.pricing, salePrice: flashPrice } },
            quantity: 1,
            price: flashPrice,
        });
    };

    // Match flash deal products with actual product data, filter expired
    const dealProducts = config.products
        .map(fp => {
            const product = allProducts.find(p => p.id === fp.productId);
            if (!product) return null;
            // Check if this product's deal has expired
            if (fp.addedAt) {
                const expiresAt = new Date(fp.addedAt).getTime() + dealDuration;
                if (expiresAt <= now.getTime()) return null; // expired
            }
            return { ...fp, product };
        })
        .filter(Boolean) as (FlashDealProduct & { product: Product })[];

    if (dealProducts.length === 0) return null;

    // Scroll indicator state
    const [activeIndex, setActiveIndex] = useState(0);
    const totalCards = dealProducts.length;
    const visibleCards = 2; // show 2 at a time on mobile

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const cardWidth = el.scrollWidth / totalCards;
        const idx = Math.round(el.scrollLeft / cardWidth);
        setActiveIndex(idx);
    };

    return (
        <div className="fd-section">
            {/* Glow effect backgrounds */}
            <div className="fd-glow fd-glow-1" />
            <div className="fd-glow fd-glow-2" />

            {/* Scrollable product cards */}
            <div className="fd-products" onScroll={handleScroll}>
                {dealProducts.map(deal => {
                    const { product, flashPrice, maxQuantity, soldCount, addedAt } = deal;
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
                            {/* Product image */}
                            <div className="fd-card-img">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} />
                                ) : (
                                    <div className="fd-img-placeholder">📦</div>
                                )}

                                {/* Overlay */}
                                <div className="fd-card-overlay">
                                    <div className="fd-card-overlay-top">
                                        <div className="fd-title-row">
                                            <div className="fd-icon-pulse">
                                                <Zap size={14} />
                                            </div>
                                            <span className="fd-title-sm">FLASH DEAL</span>
                                        </div>
                                        {discountPercent > 0 && (
                                            <div className="fd-discount-badge">
                                                -{discountPercent}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="fd-card-overlay-bottom">
                                        <ProductCountdown addedAt={addedAt} dealDuration={dealDuration} />
                                    </div>
                                </div>

                                {isSoldOut && (
                                    <div className="fd-sold-out-overlay">ДУУССАН</div>
                                )}
                            </div>

                            {/* Product info */}
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
                                        <div
                                            className="fd-progress-fill"
                                            style={{ width: `${soldRatio * 100}%` }}
                                        />
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
                                        <ShoppingBag size={14} />
                                        Авах
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scroll indicator dots */}
            {totalCards > visibleCards && (
                <div className="fd-dots">
                    {Array.from({ length: Math.ceil(totalCards / visibleCards) }).map((_, i) => (
                        <div key={i} className={`fd-dot ${i === Math.floor(activeIndex / visibleCards) ? 'active' : ''}`} />
                    ))}
                </div>
            )}
        </div>
    );
}
