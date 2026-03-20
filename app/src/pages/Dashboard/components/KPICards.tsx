import { useState, useEffect, useRef } from 'react';
import { DollarSign, ShoppingBag, Crown, Users, TrendingUp, Package, ScanLine, Truck, CheckCircle2 } from 'lucide-react';
import type { BusinessStats, BusinessCategory } from '../../../types';

interface KPICardsProps {
    stats: BusinessStats;
    category?: BusinessCategory;
    visibleModuleIds?: Set<string>;
}

/** Animated counter hook */
function useAnimatedCount(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    const ref = useRef<number | null>(null);
    useEffect(() => {
        if (ref.current !== null) cancelAnimationFrame(ref.current);
        const start = performance.now();
        const from = 0;
        const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart
        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            setCount(Math.round(from + (target - from) * ease(progress)));
            if (progress < 1) ref.current = requestAnimationFrame(tick);
        }
        ref.current = requestAnimationFrame(tick);
        return () => { if (ref.current !== null) cancelAnimationFrame(ref.current); };
    }, [target, duration]);
    return count;
}

/** Mini sparkline SVG */
function MiniSparkline({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div
                style={{
                    height: '100%', width: `${pct}%`, borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            />
        </div>
    );
}

/** Format large numbers nicely */
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

    // Animated values
    const animRevenue = useAnimatedCount(confirmedRevenue);
    const animOrders = useAnimatedCount(confirmedOrders);
    const animVip = useAnimatedCount(vipCount);
    const animCustomers = useAnimatedCount(stats.totalCustomers);
    const animProducts = useAnimatedCount(stats.totalProducts);

    // Cargo-specific animated values
    const animPackages = useAnimatedCount(stats.totalPackages || 0);
    const animInTransit = useAnimatedCount(stats.packagesInTransit || 0);
    const animArrived = useAnimatedCount(stats.packagesArrived || 0);

    interface CardDef {
        label: string;
        value: string;
        animValue: string;
        icon: typeof DollarSign;
        color: string;
        gradient: string;
        sparkValue: number;
        sparkMax: number;
        sub: string;
    }

    const allCards: (CardDef | false)[] = isCargo ? [
        has('packages') && {
            label: 'Нийт ачаа',
            value: (stats.totalPackages || 0).toLocaleString(),
            animValue: animPackages.toLocaleString(),
            icon: ScanLine,
            color: '#6366f1',
            gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
            sparkValue: stats.totalPackages || 0,
            sparkMax: (stats.totalPackages || 0) + 10,
            sub: 'бүртгэгдсэн',
        },
        has('packages') && {
            label: 'Замдаа яваа',
            value: (stats.packagesInTransit || 0).toLocaleString(),
            animValue: animInTransit.toLocaleString(),
            icon: Truck,
            color: '#f59e0b',
            gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            sparkValue: stats.packagesInTransit || 0,
            sparkMax: stats.totalPackages || 1,
            sub: `${stats.totalBatches || 0} багц`,
        },
        has('packages') && {
            label: 'Ирсэн ачаа',
            value: (stats.packagesArrived || 0).toLocaleString(),
            animValue: animArrived.toLocaleString(),
            icon: CheckCircle2,
            color: '#10b981',
            gradient: 'linear-gradient(135deg, #10b981, #34d399)',
            sparkValue: stats.packagesArrived || 0,
            sparkMax: stats.totalPackages || 1,
            sub: 'бэлэн',
        },
        has('orders') && {
            label: 'Баталгаажсан орлого',
            value: fmtNum(confirmedRevenue, '₮'),
            animValue: fmtNum(animRevenue, '₮'),
            icon: DollarSign,
            color: '#059669',
            gradient: 'linear-gradient(135deg, #059669, #10b981)',
            sparkValue: confirmedRevenue,
            sparkMax: stats.totalRevenue || 1,
            sub: 'confirmed',
        },
    ] : [
        has('orders') && {
            label: 'Баталгаажсан орлого',
            value: fmtNum(confirmedRevenue, '₮'),
            animValue: fmtNum(animRevenue, '₮'),
            icon: DollarSign,
            color: '#059669',
            gradient: 'linear-gradient(135deg, #059669, #10b981)',
            sparkValue: confirmedRevenue,
            sparkMax: stats.totalRevenue || 1,
            sub: `${stats.totalOrders} захиалгаас`,
        },
        has('orders') && {
            label: 'Захиалга',
            value: confirmedOrders.toLocaleString(),
            animValue: animOrders.toLocaleString(),
            icon: ShoppingBag,
            color: '#6366f1',
            gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
            sparkValue: confirmedOrders,
            sparkMax: stats.totalOrders || 1,
            sub: 'баталгаажсан',
        },
        (has('orders') && vipCount > 0) && {
            label: 'VIP Гишүүд',
            value: vipCount.toLocaleString(),
            animValue: animVip.toLocaleString(),
            icon: Crown,
            color: '#d97706',
            gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
            sparkValue: vipCount,
            sparkMax: stats.totalCustomers || 1,
            sub: 'идэвхтэй',
        },
        has('customers') && {
            label: 'Харилцагч',
            value: stats.totalCustomers.toLocaleString(),
            animValue: animCustomers.toLocaleString(),
            icon: Users,
            color: '#0891b2',
            gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            sparkValue: stats.totalCustomers,
            sparkMax: stats.totalCustomers + 10,
            sub: 'бүртгэлтэй',
        },
        has('products') && {
            label: 'Бараа',
            value: stats.totalProducts.toLocaleString(),
            animValue: animProducts.toLocaleString(),
            icon: Package,
            color: '#ec4899',
            gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
            sparkValue: stats.totalProducts,
            sparkMax: stats.totalProducts + 10,
            sub: 'идэвхтэй',
        },
    ];

    const cards = allCards.filter(Boolean) as CardDef[];
    if (cards.length === 0) return null;

    const colCount = Math.min(cards.length, 5);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: 14,
        }}>
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className="kpi-card-v2"
                        style={{
                            '--kpi-color': card.color,
                            '--kpi-gradient': card.gradient,
                            animationDelay: `${i * 80}ms`,
                        } as React.CSSProperties}
                    >
                        <div className="kpi-card-v2-header">
                            <div className="kpi-card-v2-icon">
                                <Icon size={18} />
                            </div>
                            <div className="kpi-card-v2-badge">
                                <TrendingUp size={10} />
                                <span>{card.sub}</span>
                            </div>
                        </div>
                        <div className="kpi-card-v2-value">{card.animValue}</div>
                        <div className="kpi-card-v2-label">{card.label}</div>
                        <MiniSparkline value={card.sparkValue} max={card.sparkMax} color={card.color} />
                    </div>
                );
            })}
        </div>
    );
}
