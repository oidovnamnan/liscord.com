import { TrendingUp, ShoppingCart, DollarSign, Users, Package, ScanLine, Truck, CheckCircle2 } from 'lucide-react';
import type { BusinessStats, BusinessCategory } from '../../../types';

interface KPICardsProps {
    stats: BusinessStats;
    category?: BusinessCategory;
}

export function KPICards({ stats, category }: KPICardsProps) {
    const isCargo = category === 'cargo';

    const cards = isCargo ? [
        {
            label: 'Нийт ачаа',
            value: (stats.totalPackages || 0).toLocaleString(),
            icon: ScanLine,
            color: 'var(--primary)',
            bg: 'var(--primary-tint)',
            trend: 'Шинэ',
        },
        {
            label: 'Замдаа яваа',
            value: (stats.packagesInTransit || 0).toLocaleString(),
            icon: Truck,
            color: 'var(--accent-orange)',
            bg: 'var(--orange-tint)',
            trend: (stats.totalBatches || 0) + ' багц',
        },
        {
            label: 'УБ-д ирсэн',
            value: (stats.packagesArrived || 0).toLocaleString(),
            icon: CheckCircle2,
            color: 'var(--accent-green)',
            bg: 'var(--green-tint)',
            trend: 'Бэлэн',
        },
        {
            label: 'Нийт орлого',
            value: `₮${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--secondary)',
            bg: 'var(--cyan-tint)',
            trend: '+8%',
        },
    ] : [
        {
            label: 'Нийт захиалга',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            color: 'var(--primary)',
            bg: 'var(--primary-tint)',
            trend: '+12%',
        },
        {
            label: 'Нийт орлого',
            value: `₮${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'var(--accent-green)',
            bg: 'var(--green-tint)',
            trend: '+8%',
        },
        {
            label: 'Харилцагч',
            value: stats.totalCustomers.toLocaleString(),
            icon: Users,
            color: 'var(--secondary)',
            bg: 'var(--cyan-tint)',
            trend: '+5%',
        },
        {
            label: 'Бараа',
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            color: 'var(--accent-pink)',
            bg: 'var(--pink-tint)',
            trend: '+2',
        },
    ];

    return (
        <div className="grid-4 stagger-children">
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
                            <span className="stat-card-change positive">
                                <TrendingUp size={14} /> {card.trend}
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
