import { ShoppingCart, DollarSign, Users, Package, ScanLine, Truck, CheckCircle2 } from 'lucide-react';
import type { BusinessStats, BusinessCategory } from '../../../types';

interface KPICardsProps {
    stats: BusinessStats;
    category?: BusinessCategory;
    visibleModuleIds?: Set<string>;
}

export function KPICards({ stats, category, visibleModuleIds }: KPICardsProps) {
    const isCargo = category === 'cargo';
    const has = (id: string) => !visibleModuleIds || visibleModuleIds.has(id);

    const allCards = isCargo ? [
        has('packages') && {
            label: 'Нийт ачаа',
            value: (stats.totalPackages || 0).toLocaleString(),
            icon: ScanLine,
            color: 'var(--primary)',
            bg: 'var(--primary-tint)',
            sub: 'бүртгэгдсэн',
        },
        has('packages') && {
            label: 'Замдаа яваа',
            value: (stats.packagesInTransit || 0).toLocaleString(),
            icon: Truck,
            color: 'var(--accent-orange)',
            bg: 'var(--orange-tint)',
            sub: (stats.totalBatches || 0) + ' багц',
        },
        has('packages') && {
            label: 'УБ-д ирсэн',
            value: (stats.packagesArrived || 0).toLocaleString(),
            icon: CheckCircle2,
            color: 'var(--accent-green)',
            bg: 'var(--green-tint)',
            sub: 'бэлэн',
        },
        has('orders') && {
            label: 'Нийт орлого',
            value: `₮${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--secondary)',
            bg: 'var(--cyan-tint)',
            sub: 'нийлбэр',
        },
    ] : [
        has('orders') && {
            label: 'Нийт захиалга',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            color: 'var(--primary)',
            bg: 'var(--primary-tint)',
            sub: 'бүртгэгдсэн',
        },
        has('orders') && {
            label: 'Нийт орлого',
            value: `₮${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--accent-green)',
            bg: 'var(--green-tint)',
            sub: 'нийлбэр',
        },
        has('customers') && {
            label: 'Харилцагч',
            value: stats.totalCustomers.toLocaleString(),
            icon: Users,
            color: 'var(--secondary)',
            bg: 'var(--cyan-tint)',
            sub: 'бүртгэлтэй',
        },
        has('products') && {
            label: 'Бараа',
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            color: 'var(--accent-pink)',
            bg: 'var(--pink-tint)',
            sub: 'идэвхтэй',
        },
    ];

    // Filter out falsy entries (modules the employee doesn't have access to)
    const cards = allCards.filter(Boolean) as { label: string; value: string; icon: typeof ShoppingCart; color: string; bg: string; sub: string }[];

    if (cards.length === 0) return null;

    return (
        <div className={`grid-${Math.min(cards.length, 4)} stagger-children`}>
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className="stat-card card animate-fade-in"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        style={{ '--index': i } as any}
                    >
                        <div className="stat-card-header">
                            <div
                                className="stat-card-icon"
                                style={{ backgroundColor: card.bg, color: card.color }}
                            >
                                <Icon size={20} />
                            </div>
                            <span className="stat-card-sub" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>
                                {card.sub}
                            </span>
                        </div>
                        <div className="stat-card-value">{card.value}</div>
                        <div className="stat-card-label">{card.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
