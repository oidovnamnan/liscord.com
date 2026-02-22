import { TrendingUp, ShoppingCart, DollarSign, Users, Package } from 'lucide-react';
import type { BusinessStats } from '../../../types';

interface KPICardsProps {
    stats: BusinessStats;
}

export function KPICards({ stats }: KPICardsProps) {
    const cards = [
        {
            label: 'Нийт захиалга',
            value: stats.totalOrders.toLocaleString(),
            icon: ShoppingCart,
            color: 'var(--primary-color)',
            bg: 'rgba(108, 92, 231, 0.1)',
            trend: '+12%',
        },
        {
            label: 'Нийт орлого',
            value: `₮${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: '#0be881',
            bg: 'rgba(11, 232, 129, 0.1)',
            trend: '+8%',
        },
        {
            label: 'Харилцагч',
            value: stats.totalCustomers.toLocaleString(),
            icon: Users,
            color: '#0dbff0',
            bg: 'rgba(13, 191, 240, 0.1)',
            trend: '+5%',
        },
        {
            label: 'Бараа',
            value: stats.totalProducts.toLocaleString(),
            icon: Package,
            color: '#ff6b9d',
            bg: 'rgba(255, 107, 157, 0.1)',
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
