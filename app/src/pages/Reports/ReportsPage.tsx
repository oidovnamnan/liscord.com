import { useEffect, useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { orderService } from '../../services/db';
import type { Order } from '../../types';
import './ReportsPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ReportsPage() {
    const { business } = useBusinessStore();
    const [period, setPeriod] = useState('7d');
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!business) return;
        return orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
        });
    }, [business]);

    // Active orders are those not cancelled/deleted
    const activeOrders = useMemo(() => orders.filter(o => !o.isDeleted && o.status !== 'cancelled'), [orders]);

    // Calculate Summary Stats
    const totalRevenue = useMemo(() => activeOrders.reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0), [activeOrders]);
    const totalOrders = activeOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate Daily Data (Simple grouping by date string)
    const dailyData = useMemo(() => {
        const grouped: Record<string, { orders: number, revenue: number }> = {};

        // Setup last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
            grouped[key] = { orders: 0, revenue: 0 };
        }

        activeOrders.forEach(o => {
            if (!o.createdAt) return;
            // Assuming createdAt is a JS Date from our convertTimestamps wrapper
            const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as any);
            const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
            if (grouped[key]) {
                grouped[key].orders += 1;
                grouped[key].revenue += (o.financials?.totalAmount || 0);
            }
        });

        return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
    }, [activeOrders]);

    // Calculate Top Products
    const topProducts = useMemo(() => {
        const prods: Record<string, { name: string, sold: number, revenue: number }> = {};
        activeOrders.forEach(o => {
            o.items?.forEach(item => {
                const key = item.productId || item.name;
                if (!prods[key]) prods[key] = { name: item.name, sold: 0, revenue: 0 };
                prods[key].sold += item.quantity;
                prods[key].revenue += item.totalPrice;
            });
        });
        return Object.values(prods).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [activeOrders]);

    // Calculate Top Customers
    const topCustomers = useMemo(() => {
        const custs: Record<string, { name: string, orders: number, spent: number }> = {};
        activeOrders.forEach(o => {
            if (!o.customer?.phone) return;
            const key = o.customer.phone;
            if (!custs[key]) custs[key] = { name: o.customer.name || key, orders: 0, spent: 0 };
            custs[key].orders += 1;
            custs[key].spent += (o.financials?.totalAmount || 0);
        });
        return Object.values(custs).sort((a, b) => b.spent - a.spent).slice(0, 5);
    }, [activeOrders]);

    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 100000);

    return (
        <>
            <Header title="Тайлан" subtitle="Бизнесийн гүйцэтгэлийн тайлан" />
            <div className="page">
                {/* Period selector */}
                <div className="report-period-bar">
                    {[
                        { key: '7d', label: '7 хоног' },
                        { key: '30d', label: '30 хоног' },
                        { key: '90d', label: '3 сар' },
                        { key: '1y', label: '1 жил' },
                    ].map(p => (
                        <button key={p.key} className={`orders-status-chip ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid-4 stagger-children" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}><DollarSign size={20} /></div>
                        </div>
                        <div className="stat-card-value">{fmt(totalRevenue)}</div>
                        <div className="stat-card-label">Нийт орлого</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(13, 191, 240, 0.15)', color: '#0dbff0' }}><ShoppingCart size={20} /></div>
                        </div>
                        <div className="stat-card-value">{totalOrders}</div>
                        <div className="stat-card-label">Нийт захиалга</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(11, 232, 129, 0.15)', color: '#0be881' }}><DollarSign size={20} /></div>
                        </div>
                        <div className="stat-card-value">{fmt(totalRevenue * 0.85)}</div>
                        <div className="stat-card-label">Ойролцоо ашиг (15% өртөг)</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(255, 107, 157, 0.15)', color: '#ff6b9d' }}><Users size={20} /></div>
                        </div>
                        <div className="stat-card-value">{fmt(avgOrderValue)}</div>
                        <div className="stat-card-label">Дундаж захиалга</div>
                    </div>
                </div>

                {/* Chart - pure CSS bar chart */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>📊 Өдрийн орлого</h3>
                    <div className="report-chart">
                        {dailyData.map((d, i) => (
                            <div key={i} className="report-chart-bar-wrap">
                                <div className="report-chart-value">{fmt(d.revenue)}</div>
                                <div className="report-chart-bar" style={{ height: `${(d.revenue / maxRevenue) * 160}px` }} />
                                <div className="report-chart-label">{d.date}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid-2">
                    {/* Top Products */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>🏆 Шилдэг бараа</h3>
                        <div className="report-ranking">
                            {topProducts.map((p, i) => (
                                <div key={i} className="report-rank-item">
                                    <span className="report-rank-num">#{i + 1}</span>
                                    <div className="report-rank-info">
                                        <span className="report-rank-name">{p.name}</span>
                                        <span className="report-rank-detail">{p.sold} ширхэг</span>
                                    </div>
                                    <span className="report-rank-value">{fmt(p.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>👑 Шилдэг харилцагч</h3>
                        <div className="report-ranking">
                            {topCustomers.map((c, i) => (
                                <div key={i} className="report-rank-item">
                                    <span className="report-rank-num">#{i + 1}</span>
                                    <div className="report-rank-info">
                                        <span className="report-rank-name">{c.name}</span>
                                        <span className="report-rank-detail">{c.orders} захиалга</span>
                                    </div>
                                    <span className="report-rank-value">{fmt(c.spent)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
