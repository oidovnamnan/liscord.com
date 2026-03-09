import { useEffect, useState, useMemo } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { orderService } from '../../services/db';
import type { Order } from '../../types';
import '../Inventory/InventoryPage.css';
import './ReportsPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ReportsPage() {
    const { business } = useBusinessStore();
    const [period, setPeriod] = useState('7d');
    const [orders, setOrders] = useState<Order[]>([]);
    // Period-based date range
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - periodDays);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [periodDays]);

    useEffect(() => {
        if (!business) return;
        // Fetch up to 1000 orders within the period for reporting
        return orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
        }, 'all', 1000, startDate);
    }, [business, startDate]);

    // Active orders filtered by period
    const activeOrders = useMemo(() => orders.filter(o => {
        if (o.isDeleted || o.status === 'cancelled') return false;
        if (!o.createdAt) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as any);
        return d >= startDate;
    }), [orders, startDate]);

    // Calculate Summary Stats
    const totalRevenue = useMemo(() => activeOrders.reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0), [activeOrders]);
    const totalOrders = activeOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate Daily Data (grouped by date)
    const dailyData = useMemo(() => {
        const grouped: Record<string, { orders: number, revenue: number }> = {};

        // Setup days based on period (max 14 bars for readability)
        const numBars = Math.min(periodDays, 14);
        const step = Math.max(1, Math.floor(periodDays / numBars));
        for (let i = numBars - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i * step);
            const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
            grouped[key] = { orders: 0, revenue: 0 };
        }

        activeOrders.forEach(o => {
            if (!o.createdAt) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as any);
            const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
            if (grouped[key]) {
                grouped[key].orders += 1;
                grouped[key].revenue += (o.financials?.totalAmount || 0);
            }
        });

        return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
    }, [activeOrders, periodDays]);

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
            <div className="inventory-page animate-fade-in">
                <div className="page-hero" style={{ marginBottom: 8 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Бизнес Анализ</h2>
                            <p className="page-hero-subtitle">Таны бизнесийн гүйцэтгэлийг нэг дороос</p>
                        </div>
                    </div>
                </div>

                {/* Modern Period Switcher */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="report-period-bar">
                        {[
                            { key: '7d', label: '7 хоног' },
                            { key: '30d', label: '30 хоног' },
                            { key: '90d', label: '3 сар' },
                            { key: '1y', label: '1 жил' },
                        ].map(p => (
                            <button
                                key={p.key}
                                className={`report-period-btn ${period === p.key ? 'active' : ''}`}
                                onClick={() => setPeriod(p.key)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Premium Stat Cards */}
                <div className="inv-stats-grid" style={{ marginTop: 0, marginBottom: 16 }}>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт орлого</h4>
                            <div className="inv-stat-value">{fmt(totalRevenue)}</div>
                        </div>
                        <div className="inv-stat-icon icon-primary">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт захиалга</h4>
                            <div className="inv-stat-value">{totalOrders}</div>
                        </div>
                        <div className="inv-stat-icon icon-green">
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Цэвэр ашиг (тооцоолсон)</h4>
                            <div className="inv-stat-value">{fmt(totalRevenue * 0.85)}</div>
                        </div>
                        <div className="inv-stat-icon icon-orange">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Дундаж сагс</h4>
                            <div className="inv-stat-value">{fmt(avgOrderValue)}</div>
                        </div>
                        <div className="inv-stat-icon icon-red">
                            <BarChart3 size={24} />
                        </div>
                    </div>
                </div>

                {/* Enhanced Chart */}
                <div className="card" style={{ marginBottom: 'var(--space-2xl)', padding: 'var(--space-xl)', background: 'var(--surface-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--primary)' }} />
                            Өдрийн орлогын тренд
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Гүйлгээний дүнгээр</div>
                    </div>

                    <div className="report-chart">
                        {dailyData.map((d, i) => {
                            const height = (d.revenue / (maxRevenue || 1)) * 200;
                            return (
                                <div key={i} className="report-chart-bar-wrap">
                                    <div className="report-chart-value">{fmt(d.revenue)}</div>
                                    <div className="report-chart-bar" style={{ height: `${Math.max(height, 4)}px` }} />
                                    <span className="report-chart-label">{d.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid-2">
                    {/* Top Products */}
                    <div className="card" style={{ padding: 'var(--space-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>🏆</span> Шилдэг борлуулалттай бараа
                        </h3>
                        <div className="report-ranking">
                            {topProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', opacity: 0.5 }}>Мэдээлэл одоогоор алга</div>
                            ) : topProducts.map((p, i) => (
                                <div key={i} className="report-rank-item">
                                    <div className={`report-rank-num report-rank-num-${i + 1}`}>{i + 1}</div>
                                    <div className="report-rank-info">
                                        <span className="report-rank-name">{p.name}</span>
                                        <span className="report-rank-detail">{p.sold} ширхэг борлуулагдсан</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="report-rank-value">{fmt(p.revenue)}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Нийт дүн</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="card" style={{ padding: 'var(--space-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>👑</span> Үнэнч хэрэглэгчид
                        </h3>
                        <div className="report-ranking">
                            {topCustomers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', opacity: 0.5 }}>Мэдээлэл одоогоор алга</div>
                            ) : topCustomers.map((c, i) => (
                                <div key={i} className="report-rank-item">
                                    <div className={`report-rank-num report-rank-num-${i + 1}`}>{i + 1}</div>
                                    <div className="report-rank-info">
                                        <span className="report-rank-name">{c.name}</span>
                                        <span className="report-rank-detail">{c.orders} удаа худалдан авалт хийсэн</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="report-rank-value">{fmt(c.spent)}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Нийт зарцуулалт</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

