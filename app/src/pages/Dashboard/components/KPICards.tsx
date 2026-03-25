import { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Crown, Package, ScanLine, Truck, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import type { BusinessStats, BusinessCategory } from '../../../types';

interface KPICardsProps {
    stats: BusinessStats;
    category?: BusinessCategory;
    visibleModuleIds?: Set<string>;
}

/** Animated counter hook */
function useAnimatedCount(target: number, duration = 1000) {
    const [count, setCount] = useState(0);
    const ref = useRef<number | null>(null);
    useEffect(() => {
        if (ref.current !== null) cancelAnimationFrame(ref.current);
        const start = performance.now();
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(target * ease(progress)));
            if (progress < 1) ref.current = requestAnimationFrame(tick);
        }
        ref.current = requestAnimationFrame(tick);
        return () => { if (ref.current !== null) cancelAnimationFrame(ref.current); };
    }, [target, duration]);
    return count;
}

/** Format large numbers */
function fmtNum(n: number, prefix = ''): string {
    if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
    return `${prefix}${n.toLocaleString()}`;
}

export function KPICards({ stats, category, visibleModuleIds }: KPICardsProps) {
    const isCargo = category === 'cargo';
    const has = (id: string) => !visibleModuleIds || visibleModuleIds.has(id);

    const confirmedRevenue = stats.confirmedRevenue ?? stats.totalRevenue;
    const confirmedOrders = stats.confirmedOrderCount ?? stats.totalOrders;
    const vipCount = stats.vipMemberCount ?? 0;

    const animRevenue = useAnimatedCount(confirmedRevenue);
    const animOrders = useAnimatedCount(confirmedOrders);
    const animProducts = useAnimatedCount(stats.totalProducts);
    const animVip = useAnimatedCount(vipCount);
    const animPackages = useAnimatedCount(stats.totalPackages || 0);
    const animInTransit = useAnimatedCount(stats.packagesInTransit || 0);
    const animArrived = useAnimatedCount(stats.packagesArrived || 0);

    interface CardDef {
        label: string;
        value: string;
        icon: typeof DollarSign;
        color: string;
        sub?: string;
        trend?: 'up' | 'down' | null;
    }

    const allCards: (CardDef | false)[] = isCargo ? [
        has('packages') && {
            label: 'Нийт ачаа',
            value: animPackages.toLocaleString(),
            icon: ScanLine,
            color: '#6366f1',
            sub: 'бүртгэгдсэн',
        },
        has('packages') && {
            label: 'Замдаа яваа',
            value: animInTransit.toLocaleString(),
            icon: Truck,
            color: '#f59e0b',
            sub: `${stats.totalBatches || 0} багц`,
        },
        has('packages') && {
            label: 'Ирсэн ачаа',
            value: animArrived.toLocaleString(),
            icon: CheckCircle2,
            color: '#10b981',
            sub: 'бэлэн',
        },
    ] : [
        has('orders') && {
            label: 'Орлого',
            value: fmtNum(animRevenue, '₮'),
            icon: DollarSign,
            color: '#059669',
            sub: `${stats.totalOrders} захиалгаас`,
        },
        has('orders') && {
            label: 'Захиалга',
            value: animOrders.toLocaleString(),
            icon: ShoppingBag,
            color: '#6366f1',
            sub: 'баталгаажсан',
        },
        (has('orders') && vipCount > 0) && {
            label: 'VIP Гишүүд',
            value: animVip.toLocaleString(),
            icon: Crown,
            color: '#d97706',
            sub: 'идэвхтэй',
        },
        has('products') && {
            label: 'Бараа',
            value: animProducts.toLocaleString(),
            icon: Package,
            color: '#ec4899',
            sub: `${stats.totalProducts} идэвхтэй`,
        },
    ];

    const cards = allCards.filter(Boolean) as CardDef[];
    if (cards.length === 0) return null;

    return (
        <div className="kpi-unified-grid">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className="kpi-card-v3"
                        style={{
                            '--kpi-color': card.color,
                            animationDelay: `${i * 60}ms`,
                        } as React.CSSProperties}
                    >
                        <div className="kpi-v3-top">
                            <div className="kpi-v3-icon">
                                <Icon size={16} />
                            </div>
                            <span className="kpi-v3-label">{card.label}</span>
                        </div>
                        <div className="kpi-v3-value">
                            {card.value}
                            {card.trend === 'up' && <TrendingUp size={14} className="kpi-v3-trend up" />}
                            {card.trend === 'down' && <TrendingDown size={14} className="kpi-v3-trend down" />}
                        </div>
                        {card.sub && <div className="kpi-v3-sub">{card.sub}</div>}
                    </div>
                );
            })}
        </div>
    );
}
