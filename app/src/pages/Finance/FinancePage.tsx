import { useState, useEffect, useMemo } from 'react';
import { useBusinessStore } from '../../store';
import '../Settings/components/FlashDealSettings.css';
import { TrendingUp, TrendingDown, Wallet, Building, CreditCard } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { orderService } from '../../services/db';
import type { Order } from '../../types';

type IncomeTab = 'all' | 'product' | 'delivery' | 'cargo' | 'membership';

const INCOME_TABS: { key: IncomeTab; label: string; icon: string; color: string }[] = [
    { key: 'all', label: 'Бүгд', icon: '📊', color: '#6366f1' },
    { key: 'product', label: 'Бараа', icon: '🛍️', color: '#10b981' },
    { key: 'delivery', label: 'Хүргэлт', icon: '🚚', color: '#3b82f6' },
    { key: 'cargo', label: 'Карго', icon: '📦', color: '#f59e0b' },
    { key: 'membership', label: 'Гишүүн', icon: '👑', color: '#8b5cf6' },
];

function getIncomeByType(orders: Order[]) {
    let product = 0, delivery = 0, cargo = 0, membership = 0;
    for (const o of orders) {
        if (o.orderType === 'membership') {
            membership += o.financials?.totalAmount || 0;
        } else {
            product += o.financials?.subtotal || 0;
            delivery += o.financials?.deliveryFee || 0;
            cargo += o.financials?.cargoFee || 0;
        }
    }
    return { product, delivery, cargo, membership, all: product + delivery + cargo + membership };
}

export function FinancePage() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<IncomeTab>('all');

    useEffect(() => {
        if (!business) return;
        const unsubscribe = orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    const income = useMemo(() => getIncomeByType(orders), [orders]);
    const totalRevenue = income.all;
    const totalExpenses = Math.round(totalRevenue * 0.28);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') return orders.slice(0, 20);
        if (activeTab === 'membership') return orders.filter(o => o.orderType === 'membership').slice(0, 20);
        if (activeTab === 'delivery') return orders.filter(o => o.orderType !== 'membership' && (o.financials?.deliveryFee || 0) > 0).slice(0, 20);
        if (activeTab === 'cargo') return orders.filter(o => o.orderType !== 'membership' && (o.financials?.cargoFee || 0) > 0).slice(0, 20);
        return orders.filter(o => o.orderType !== 'membership').slice(0, 20);
    }, [orders, activeTab]);

    const activeTabInfo = INCOME_TABS.find(t => t.key === activeTab)!;
    const tabAmount = income[activeTab];

    return (
        <HubLayout hubId="finance-hub">
            <div className="page animate-fade-in">
                <div className="fds-hero">
                    <div className="fds-hero-top">
                        <div className="fds-hero-left">
                            <div className="fds-hero-icon"><Wallet size={24} /></div>
                            <div>
                                <h3 className="fds-hero-title">Санхүү & Татвар</h3>
                                <div className="fds-hero-desc">Компанийн орлого, зарлага болон авлага өглөгийн нэгдсэн самбар</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Income Category Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {INCOME_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 18px', borderRadius: 12,
                                border: activeTab === tab.key ? `2px solid ${tab.color}` : '1px solid var(--border-secondary)',
                                background: activeTab === tab.key ? `${tab.color}10` : 'var(--surface-1)',
                                color: activeTab === tab.key ? tab.color : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.key ? 800 : 600,
                                fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span style={{ fontWeight: 800, marginLeft: 4 }}>{income[tab.key].toLocaleString()}₮</span>
                        </button>
                    ))}
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">{activeTabInfo.icon} {activeTabInfo.label} Орлого</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${activeTabInfo.color}15`, color: activeTabInfo.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color: activeTabInfo.color, margin: 0 }}>
                            {tabAmount.toLocaleString()} ₮
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">Нийт Зарлага</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingDown size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color: '#e74c3c', margin: 0 }}>
                            {totalExpenses.toLocaleString()} ₮
                        </div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span className="stat-card-label">Цэвэр Ашиг</span>
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Wallet size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ margin: 0 }}>
                            {(totalRevenue - totalExpenses).toLocaleString()} ₮
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)' }} className="finance-inline-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building size={18} color="var(--primary)" /> Авлага
                            </h3>
                            <span style={{ fontWeight: 600, color: '#27ae60' }}>
                                {orders.filter(o => String(o.paymentStatus) === 'pending' || String(o.paymentStatus) === 'unpaid').reduce((s, o) => s + (o.financials?.totalAmount || 0), 0).toLocaleString()} ₮
                            </span>
                        </div>
                        <div className="empty-state" style={{ height: '150px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                            <p>Авлагын задаргаа гаргах</p>
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)' }} className="finance-inline-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CreditCard size={18} color="#e74c3c" /> Өглөг
                            </h3>
                            <span style={{ fontWeight: 600, color: '#e74c3c' }}>0 ₮</span>
                        </div>
                        <div className="empty-state" style={{ height: '150px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                            <p>Өглөгийн задаргаа гаргах</p>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div style={{ background: 'var(--surface-1)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-secondary)', boxShadow: '0 4px 12px -4px var(--shadow-sm)' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: 0 }}>
                        {activeTabInfo.icon} {activeTab === 'all' ? 'Сүүлийн гүйлгээнүүд' : `${activeTabInfo.label} орлого`}
                    </h2>
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
                                {filteredOrders.map(o => {
                                    const isMembership = o.orderType === 'membership';
                                    const rows: { label: string; badge: string; color: string; amount: number }[] = [];

                                    if (activeTab === 'all' || activeTab === 'product') {
                                        if (!isMembership && (o.financials?.subtotal || 0) > 0) {
                                            rows.push({ label: `Борлуулалт #${o.orderNumber}`, badge: '🛍️ Бараа', color: '#10b981', amount: o.financials?.subtotal || 0 });
                                        }
                                    }
                                    if (activeTab === 'all' || activeTab === 'delivery') {
                                        if (!isMembership && (o.financials?.deliveryFee || 0) > 0) {
                                            rows.push({ label: `Хүргэлт #${o.orderNumber}`, badge: '🚚 Хүргэлт', color: '#3b82f6', amount: o.financials?.deliveryFee || 0 });
                                        }
                                    }
                                    if (activeTab === 'all' || activeTab === 'cargo') {
                                        if (!isMembership && (o.financials?.cargoFee || 0) > 0) {
                                            rows.push({ label: `Карго #${o.orderNumber}`, badge: '📦 Карго', color: '#f59e0b', amount: o.financials?.cargoFee || 0 });
                                        }
                                    }
                                    if (activeTab === 'all' || activeTab === 'membership') {
                                        if (isMembership) {
                                            rows.push({ label: `Гишүүнчлэл #${o.orderNumber}`, badge: '👑 Гишүүн', color: '#8b5cf6', amount: o.financials?.totalAmount || 0 });
                                        }
                                    }

                                    return rows.map((row, ri) => (
                                        <tr key={`${o.id}_${ri}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                                {o.createdAt instanceof Date ? o.createdAt.toLocaleDateString('mn-MN') : new Date(o.createdAt).toLocaleDateString('mn-MN')}
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: 500 }}>{row.label}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, background: `${row.color}15`, color: row.color }}>{row.badge}</span>
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{o.customer?.name || 'Зочин'}</td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: row.color }}>
                                                +{row.amount.toLocaleString()} ₮
                                            </td>
                                        </tr>
                                    ));
                                })}
                                {filteredOrders.length === 0 && !loading && (
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
