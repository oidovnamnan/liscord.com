import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users } from 'lucide-react';
import './ReportsPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

const dailyData = [
    { date: '02.16', orders: 18, revenue: 6200000 },
    { date: '02.17', orders: 22, revenue: 7800000 },
    { date: '02.18', orders: 15, revenue: 5100000 },
    { date: '02.19', orders: 28, revenue: 9500000 },
    { date: '02.20', orders: 20, revenue: 7200000 },
    { date: '02.21', orders: 31, revenue: 11000000 },
    { date: '02.22', orders: 24, revenue: 8500000 },
];

const topProducts = [
    { name: 'iPhone 15 Pro', sold: 24, revenue: 108000000 },
    { name: 'MacBook Air M3', sold: 12, revenue: 50400000 },
    { name: 'Galaxy S24 Ultra', sold: 18, revenue: 68400000 },
    { name: 'AirPods Pro 2', sold: 35, revenue: 14700000 },
    { name: 'Apple Watch Ultra 2', sold: 15, revenue: 27000000 },
];

const topCustomers = [
    { name: 'Мөнхбат', orders: 20, spent: 55000000 },
    { name: 'Дорж', orders: 25, spent: 48000000 },
    { name: 'Ганаа', orders: 15, spent: 31000000 },
    { name: 'Болд', orders: 12, spent: 25600000 },
    { name: 'Сараа', orders: 8, spent: 12400000 },
];

export function ReportsPage() {
    const [period, setPeriod] = useState('7d');
    const maxRevenue = Math.max(...dailyData.map(d => d.revenue));

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

                {/* Summary stats */}
                <div className="grid-4 stagger-children" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}><DollarSign size={20} /></div>
                            <span className="stat-card-change positive"><TrendingUp size={14} /> +18%</span>
                        </div>
                        <div className="stat-card-value">{fmt(55300000)}</div>
                        <div className="stat-card-label">Нийт орлого</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(13, 191, 240, 0.15)', color: '#0dbff0' }}><ShoppingCart size={20} /></div>
                            <span className="stat-card-change positive"><TrendingUp size={14} /> +12%</span>
                        </div>
                        <div className="stat-card-value">158</div>
                        <div className="stat-card-label">Нийт захиалга</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(11, 232, 129, 0.15)', color: '#0be881' }}><DollarSign size={20} /></div>
                            <span className="stat-card-change positive"><TrendingUp size={14} /> +8%</span>
                        </div>
                        <div className="stat-card-value">{fmt(12800000)}</div>
                        <div className="stat-card-label">Цэвэр ашиг</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(255, 107, 157, 0.15)', color: '#ff6b9d' }}><Users size={20} /></div>
                            <span className="stat-card-change negative"><TrendingDown size={14} /> -3%</span>
                        </div>
                        <div className="stat-card-value">{fmt(350000)}</div>
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
