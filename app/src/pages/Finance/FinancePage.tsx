import { useState, useEffect } from 'react';
import { useBusinessStore } from '../../store';
import { Header } from '../../components/layout/Header';
import { TrendingUp, TrendingDown, Wallet, Download, Building, CreditCard } from 'lucide-react';
import { orderService } from '../../services/db';
import type { Order } from '../../types';

export function FinancePage() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);

    // Mock Statistics
    const stats = {
        totalRevenue: 45000000,
        totalExpenses: 12500000,
        netIncome: 32500000,
        accountsReceivable: 5000000, // Авлага
        accountsPayable: 2000000,   // Өглөг
    };

    useEffect(() => {
        if (!business) return;
        const unsubscribe = orderService.subscribeOrders(business.id, (data) => {
            setOrders(data.slice(0, 10)); // Just for preview
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Санхүү & Татвар"
                subtitle="Компанийн орлого, зарлага болон авлага өглөгийн нэгдсэн самбар"
            />

            <div className="page-content">
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button className="btn btn-primary gradient-btn">
                        <TrendingUp size={18} /> Орлого бүртгэх
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-secondary)' }}>
                        <TrendingDown size={18} /> Зарлага гаргах
                    </button>
                    <button className="btn btn-outline" style={{ marginLeft: 'auto' }}>
                        <Download size={18} /> Тайлан татах
                    </button>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Нийт Орлого (Сараар)</span>
                            <div className="stat-icon" style={{ background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60' }}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#27ae60' }}>
                            {stats.totalRevenue.toLocaleString()} ₮
                        </div>
                        <div className="stat-change positive">↑ 12% өссөн</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Нийт Зарлага (Сараар)</span>
                            <div className="stat-icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ color: '#e74c3c' }}>
                            {stats.totalExpenses.toLocaleString()} ₮
                        </div>
                        <div className="stat-change negative">↓ 5% буурсан</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Цэвэр Ашиг</span>
                            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="stat-value">
                            {stats.netIncome.toLocaleString()} ₮
                        </div>
                        <div className="stat-change positive">Эрүүл үзүүлэлттэй</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building size={18} color="var(--primary)" /> Авлага (Бусдаас авах)
                            </h3>
                            <span style={{ fontWeight: 600, color: '#27ae60' }}>{stats.accountsReceivable.toLocaleString()} ₮</span>
                        </div>
                        <div className="empty-state" style={{ height: '150px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                            <p>Авлагын задаргаа гаргах</p>
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={18} color="#e74c3c" /> Өглөг (Бусдад өгөх)
                            </h3>
                            <span style={{ fontWeight: 600, color: '#e74c3c' }}>{stats.accountsPayable.toLocaleString()} ₮</span>
                        </div>
                        <div className="empty-state" style={{ height: '150px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                            <p>Өглөгийн задаргаа гаргах</p>
                        </div>
                    </div>
                </div>

                {/* Ledger / Recent Transactions */}
                <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Сүүлийн гүйлгээнүүд</h2>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Огноо</th>
                                <th>Гүйлгээний утга</th>
                                <th>Төрөл</th>
                                <th>Харилцагч</th>
                                <th style={{ textAlign: 'right' }}>Дүн</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td>{o.createdAt.toLocaleDateString()}</td>
                                    <td>Борлуулалтын орлого #{o.orderNumber}</td>
                                    <td>
                                        <span className="badge badge-success">Орлого</span>
                                    </td>
                                    <td>{o.customer?.name || 'Зочин'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#27ae60' }}>
                                        +{(o.financials?.totalAmount || 0).toLocaleString()} ₮
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        Гүйлгээ олдсонгүй
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
