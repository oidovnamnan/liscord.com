import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Zap, Clock, TrendingUp } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store';

export interface FlashDealProduct {
    productId: string;
    flashPrice: number;
    maxQuantity: number;
    soldCount: number;
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

export function FlashDealSection({ config, allProducts, onProductClick }: FlashDealSectionProps) {
    const { hours, minutes, seconds, expired } = useCountdown(config.endsAt);
    const now = new Date();

    // Don't render if not enabled, not started yet, or expired
    if (!config.enabled || now < config.startsAt || expired) return null;

    const pad = (n: number) => String(n).padStart(2, '0');

    const handleAddToCart = (e: React.MouseEvent, product: Product, flashPrice: number) => {
        e.stopPropagation();
        useCartStore.getState().addItem({
            product: { ...product, pricing: { ...product.pricing, salePrice: flashPrice } },
            quantity: 1,
            price: flashPrice,
        });
    };

    // Match flash deal products with actual product data
    const dealProducts = config.products
        .map(fp => {
            const product = allProducts.find(p => p.id === fp.productId);
            if (!product) return null;
            return { ...fp, product };
        })
        .filter(Boolean) as (FlashDealProduct & { product: Product })[];

    if (dealProducts.length === 0) return null;

    return (
        <div className="fd-section">
            {/* Glow effect backgrounds */}
            <div className="fd-glow fd-glow-1" />
            <div className="fd-glow fd-glow-2" />

            {/* Header */}
            <div className="fd-header">
                <div className="fd-title-row">
                    <div className="fd-icon-pulse">
                        <Zap size={20} />
                    </div>
                    <h2 className="fd-title">{config.title || '⚡ FLASH DEAL'}</h2>
                </div>
                <div className="fd-timer">
                    <Clock size={14} />
                    <div className="fd-timer-box">{pad(hours)}</div>
                    <span className="fd-timer-sep">:</span>
                    <div className="fd-timer-box">{pad(minutes)}</div>
                    <span className="fd-timer-sep">:</span>
                    <div className="fd-timer-box fd-timer-sec">{pad(seconds)}</div>
                </div>
            </div>

            {/* Scrollable product cards */}
            <div className="fd-products">
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
                            {/* Discount badge */}
                            {discountPercent > 0 && (
                                <div className="fd-discount-badge">
                                    -{discountPercent}%
                                </div>
                            )}

                            {/* Product image */}
                            <div className="fd-card-img">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} />
                                ) : (
                                    <div className="fd-img-placeholder">📦</div>
                                )}
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

                                {/* Progress bar */}
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

                                {/* Add to cart */}
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
        </div>
    );
}
