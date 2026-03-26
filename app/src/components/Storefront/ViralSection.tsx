import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Eye } from 'lucide-react';
import type { Product } from '../../types';
import './ViralSection.css';

interface ViralSectionProps {
    products: Product[];
    onProductClick: (product: Product) => void;
}

// ═══ Ember Particle System ═══
function EmberCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Check reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let animationId: number;
        const particles: {
            x: number; y: number; vx: number; vy: number;
            size: number; life: number; maxLife: number;
            color: string;
        }[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener('resize', resize);

        const colors = ['#ff6b00', '#ff8c00', '#ff4500', '#ff2d00', '#ffaa00'];

        const spawn = () => {
            if (particles.length > 40) return;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            particles.push({
                x: Math.random() * w,
                y: h + 10,
                vx: (Math.random() - 0.5) * 0.8,
                vy: -(Math.random() * 1.2 + 0.4),
                size: Math.random() * 3 + 1,
                life: 0,
                maxLife: Math.random() * 120 + 60,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        };

        const animate = () => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            // Spawn 1-2 per frame
            if (Math.random() > 0.5) spawn();

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx + Math.sin(p.life * 0.03) * 0.3;
                p.y += p.vy;
                p.life++;
                p.size *= 0.998;

                const alpha = 1 - (p.life / p.maxLife);
                if (alpha <= 0 || p.y < -10) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha * 0.7;
                ctx.fill();

                // Glow effect
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha * 0.15;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="viral-embers" />;
}

// ═══ View Count Generator (deterministic from ID) ═══
function getViewCount(productId: string): string {
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        hash = ((hash << 5) - hash) + productId.charCodeAt(i);
        hash |= 0;
    }
    const views = Math.abs(hash % 9500) + 500; // 500-9999
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
}

// ═══ Single Card Renderer ═══
function ViralCard({ p, onProductClick, fmt }: { p: Product; onProductClick: (p: Product) => void; fmt: (n: number) => string }) {
    const salePrice = p.pricing?.salePrice || 0;
    const comparePrice = p.pricing?.comparePrice;
    const hasDiscount = comparePrice && comparePrice > salePrice;
    const varPrices = (p.variations || []).map(v => (v.salePrice ?? 0) > 0 ? v.salePrice! : 0).filter(pr => pr > 0);
    const hasVarPrices = varPrices.length > 0 && salePrice === 0;
    const minVar = hasVarPrices ? Math.min(...varPrices) : 0;
    const maxVar = hasVarPrices ? Math.max(...varPrices) : 0;

    return (
        <div className="viral-card" onClick={() => onProductClick(p)}>
            <div className="viral-card-border" />
            <div className="viral-card-inner">
                <div className="viral-card-image-wrap">
                    <div className="viral-badge">🔥 FIRE</div>
                    {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="viral-card-image" loading="lazy" />
                    ) : (
                        <div className="viral-card-placeholder">📦</div>
                    )}
                    <div className="viral-views">
                        <Eye size={12} strokeWidth={2.5} />
                        {getViewCount(p.id)}
                    </div>
                </div>
                <div className="viral-card-content">
                    <div className="viral-card-name">{p.name}</div>
                    <div className="viral-card-price">
                        {hasVarPrices
                            ? (minVar === maxVar ? fmt(minVar) : `${fmt(minVar)} ~ ${fmt(maxVar)}`)
                            : fmt(salePrice)
                        }
                        {hasDiscount && (
                            <span className="viral-card-compare">{fmt(comparePrice)}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ Main Component ═══
export function ViralSection({ products, onProductClick }: ViralSectionProps) {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const autoScrollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const pausedRef = useRef(false);
    const isResettingRef = useRef(false);

    const count = products.length;
    const cardWidth = 276; // 260 card + 16 gap

    // Infinite loop: render 3 copies [clone-before | original | clone-after]
    // When scroll reaches clone zones, silently snap back to the middle set
    const tripleProducts = useMemo(() => {
        if (count <= 1) return products;
        return [...products, ...products, ...products];
    }, [products, count]);

    // On mount: scroll to start of middle set (instant, no animation)
    useEffect(() => {
        const el = carouselRef.current;
        if (!el || count <= 1) return;
        el.scrollLeft = count * cardWidth;
    }, [count, cardWidth]);

    // Track scroll + infinite reset
    const handleScroll = useCallback(() => {
        const el = carouselRef.current;
        if (!el || count <= 1 || isResettingRef.current) return;

        const setWidth = count * cardWidth;
        const scrollLeft = el.scrollLeft;

        // If scrolled past the end of middle set → snap to start of middle
        if (scrollLeft >= setWidth * 2) {
            isResettingRef.current = true;
            el.style.scrollBehavior = 'auto';
            el.scrollLeft = scrollLeft - setWidth;
            el.style.scrollBehavior = '';
            isResettingRef.current = false;
        }
        // If scrolled before middle set → snap to end of middle
        else if (scrollLeft < setWidth * 0.3) {
            isResettingRef.current = true;
            el.style.scrollBehavior = 'auto';
            el.scrollLeft = scrollLeft + setWidth;
            el.style.scrollBehavior = '';
            isResettingRef.current = false;
        }

        // Active dot based on position within one set
        const posInSet = el.scrollLeft % setWidth;
        const idx = Math.round(posInSet / cardWidth) % count;
        setActiveIndex(idx);
    }, [count, cardWidth]);

    // Auto-scroll every 3.5s
    useEffect(() => {
        const el = carouselRef.current;
        if (!el || count <= 1) return;

        autoScrollRef.current = setInterval(() => {
            if (pausedRef.current) return;
            el.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }, 3500);

        return () => clearInterval(autoScrollRef.current);
    }, [count, cardWidth]);

    // Pause on touch/mouse
    const handleTouch = useCallback(() => {
        pausedRef.current = true;
        setTimeout(() => { pausedRef.current = false; }, 5000);
    }, []);

    if (count === 0) return null;

    const fmt = (n: number) => n.toLocaleString() + ' ₮';

    return (
        <section className="viral-section">
            <div className="viral-aurora" />
            <EmberCanvas />

            <div className="viral-header">
                <div className="viral-title-glow">
                    <span className="viral-fire-icon">🔥</span>
                    <h2 className="viral-title">VIRAL</h2>
                </div>
                <div className="viral-subtitle">Хамгийн их эрэлттэй бүтээгдэхүүн</div>
            </div>

            <div
                className="viral-carousel"
                ref={carouselRef}
                onScroll={handleScroll}
                onTouchStart={handleTouch}
                onMouseDown={handleTouch}
            >
                {tripleProducts.map((p, i) => (
                    <ViralCard key={`v-${i}`} p={p} onProductClick={onProductClick} fmt={fmt} />
                ))}
            </div>

            {count > 1 && (
                <div className="viral-scroll-dots">
                    {products.map((_, i) => (
                        <div
                            key={i}
                            className={`viral-scroll-dot ${i === activeIndex ? 'active' : ''}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
