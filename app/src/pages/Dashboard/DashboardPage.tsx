import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign, Loader2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { dashboardService } from '../../services/db';
import type { Order } from '../../types';
import './Dashboard.css';

function fmt(n: number) { return '₮' + (n || 0).toLocaleString('mn-MN'); }

const statusLabels: Record<string, { label: string; class: string }> = {
    new: { label: 'Шинэ', class: 'badge-new' },
    confirmed: { label: 'Баталсан', class: 'badge-confirmed' },
    preparing: { label: 'Бэлтгэж буй', class: 'badge-preparing' },
    preparing_for_shipping: { label: 'Бэлтгэж буй', class: 'badge-preparing' },
    ready: { label: 'Бэлэн', class: 'badge-preparing' },
    shipping: { label: 'Хүргэлтэнд', class: 'badge-shipping' },
    delivered: { label: 'Хүргэгдсэн', class: 'badge-delivered' },
    completed: { label: 'Дууссан', class: 'badge-delivered' },
    paid: { label: 'Төлөгдсөн', class: 'badge-paid' },
    cancelled: { label: 'Цуцалсан', class: 'badge-cancelled' },
};

export function DashboardPage() {
    const { business } = useBusinessStore();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);
        // Stats
        dashboardService.getDashboardStats(business.id).then(data => {
            setStats(data);
        });

        // Recent orders subscription
        const unsubscribe = dashboardService.subscribeRecentOrders(business.id, (orders) => {
            setRecentOrders(orders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    const statItems = [
        { id: 'orders', label: 'Нийт захиалга', value: stats?.totalOrders || 0, positive: true, icon: ShoppingCart, color: '#6c5ce7' },
        { id: 'revenue', label: 'Нийт орлого', value: fmt(stats?.totalRevenue || 0), positive: true, icon: DollarSign, color: '#0dbff0' },
        { id: 'customers', label: 'Нийт харилцагч', value: stats?.totalCustomers || 0, positive: true, icon: Users, color: '#ff6b9d' },
        { id: 'products', label: 'Нийт бараа', value: stats?.totalProducts || 0, positive: true, icon: Package, color: '#ff9f43' },
    ];

    if (loading) {
        return (
            <div className="loading-screen">
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <>
            <Header title="Хянах самбар" subtitle={`Сайн байна уу, ${business?.name}! 👋`} />
            <div className="page">
                {/* Stats */}
                <div className="grid-4 stagger-children">
                    {statItems.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.id} className="stat-card">
                                <div className="stat-card-header">
                                    <div className="stat-card-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                                        {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        +0%
                                    </span>
                                </div>
                                <div className="stat-card-value">{stat.value}</div>
                                <div className="stat-card-label">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Orders */}
                <div className="dashboard-section">
                    <div className="dashboard-section-header">
                        <h2>Сүүлийн захиалгууд</h2>
                        <a href="/app/orders" className="btn btn-ghost btn-sm">Бүгд →</a>
                    </div>
                    <div className="dashboard-orders-list stagger-children">
                        {recentOrders.length === 0 ? (
                            <div className="empty-state">
                                <p>Захиалга байхгүй байна</p>
                            </div>
                        ) : (
                            recentOrders.map((order) => (
                                <div key={order.id} className="dashboard-order-item card card-clickable">
                                    <div className="dashboard-order-left">
                                        <span className="dashboard-order-number">#{order.orderNumber}</span>
                                        <span className="dashboard-order-customer">{order.customer?.name}</span>
                                    </div>
                                    <div className="dashboard-order-right">
                                        <span className="dashboard-order-amount">{fmt(order.financials?.totalAmount)}</span>
                                        <span className={`badge ${statusLabels[order.status]?.class || ''}`}>
                                            {statusLabels[order.status]?.label || order.status}
                                        </span>
                                    </div>
                                    <span className="dashboard-order-time">
                                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
