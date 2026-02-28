import { useState, useEffect } from 'react';
import { useBusinessStore } from '../../store';
import { Header } from '../../components/layout/Header';
import { TrendingUp, TrendingDown, Wallet, Download, Building, CreditCard } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
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
        <HubLayout hubId="finance-hub">
            <Header
                title="Санхүү & Татвар"
                subtitle="Компанийн орлого, зарлага болон авлага өглөгийн нэгдсэн самбар"
            />

            <div className="page animate-fade-in">
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary gradient-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                        <TrendingUp size={18} /> Орлого бүртгэх
                    </button>
                    <button className="btn btn-outline" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-secondary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                        <TrendingDown size={18} /> Зарлага гаргах
                    </button>
                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', marginLeft: 'auto' }}>
                        <Download size={18} /> Тайлан татах
                    </button>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">Нийт Орлого (Сараар)</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="stat-card-value" style={{ color: '#27ae60', margin: 0, wordBreak: 'break-word' }}>
                                {stats.totalRevenue.toLocaleString()} ₮
                            </div>
                            <div className="stat-card-change positive">↑ 12% өссөн</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">Нийт Зарлага (Сараар)</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="stat-card-value" style={{ color: '#e74c3c', margin: 0, wordBreak: 'break-word' }}>
                                {stats.totalExpenses.toLocaleString()} ₮
                            </div>
                            <div className="stat-card-change negative">↓ 5% буурсан</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">Цэвэр Ашиг</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="stat-card-value" style={{ margin: 0, wordBreak: 'break-word' }}>
                                {stats.netIncome.toLocaleString()} ₮
                            </div>
                            <div className="stat-card-change positive">Эрүүл үзүүлэлттэй</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)', transition: 'all 0.3s ease' }} className="finance-inline-card">
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

                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)', transition: 'all 0.3s ease' }} className="finance-inline-card">
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
                <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: 0 }}>Сүүлийн гүйлгээнүүд</h2>
                    <div className="data-table-container" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-2)' }}>
                                    <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Огноо</th>
                                    <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Гүйлгээний утга</th>
                                    <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Төрөл</th>
                                    <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Харилцагч</th>
                                    <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', textAlign: 'right' }}>Дүн</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px' }}>{o.createdAt.toLocaleDateString()}</td>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>Борлуулалтын орлого #{o.orderNumber}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className="badge badge-success">Орлого</span>
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{o.customer?.name || 'Зочин'}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#27ae60' }}>
                                            +{(o.financials?.totalAmount || 0).toLocaleString()} ₮
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && !loading && (
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Гүйлгээ олдсонгүй</span>
                                                <span style={{ fontSize: '0.85rem' }}>Одоогоор бүртгэгдсэн гүйлгээ байхгүй байна.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </HubLayout>
    );
}
