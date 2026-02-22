import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { ShoppingCart, Package, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { dashboardService } from '../../services/db';
import { KPICards } from './components/KPICards';
import { OrderChart } from './components/OrderChart';
import type { Order } from '../../types';
import './Dashboard.css';

function fmt(n: number) { return '₮' + (n || 0).toLocaleString('mn-MN'); }

const statusLabels: Record<string, { label: string; class: string }> = {
    new: { label: 'Шинэ', class: 'badge-new' },
    confirmed: { label: 'Баталсан', class: 'badge-confirmed' },
    preparing: { label: 'Бэлтгэж буй', class: 'badge-preparing' },
    ready: { label: 'Бэлэн', class: 'badge-preparing' },
    shipping: { label: 'Хүргэлтэнд', class: 'badge-shipping' },
    delivered: { label: 'Хүргэгдсэн', class: 'badge-delivered' },
    completed: { label: 'Дууссан', class: 'badge-delivered' },
    paid: { label: 'Төлөгдсөн', class: 'badge-paid' },
    cancelled: { label: 'Цуцалсан', class: 'badge-cancelled' },
};

export function DashboardPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);

        async function loadDashboard() {
            try {
                const statsData = await dashboardService.getDashboardStats(business!.id);
                setStats(statsData || {
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalCustomers: 0,
                    totalProducts: 0
                });
            } catch (error) {
                console.error('Stats load error:', error);
            }
        }

        loadDashboard();

        // Recent orders subscription
        const unsubscribe = dashboardService.subscribeRecentOrders(business.id!, (orders) => {
            setRecentOrders(orders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    if (loading || !stats) {
        return (
            <div className="loading-screen">
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    const isNewBusiness = (stats?.totalOrders || 0) === 0;

    return (
        <>
            <Header title="Хянах самбар" />
            <div className="page animate-fade-in">
                {/* Dashboard Hero */}
                <div className="dashboard-hero stagger-item" style={{ '--index': 0 } as any}>
                    <div className="dashboard-hero-content">
                        <h1>Сайн байна уу, {user?.displayName || 'Эзэн'}! 👋</h1>
                        <p className="text-secondary">{business?.name} бизнесийн өнөөдрийн тойм.</p>
                    </div>
                    <div className="dashboard-hero-action hide-mobile">
                        <a href="/app/orders" className="btn btn-primary">
                            <ShoppingCart size={18} /> Шинэ захиалга
                        </a>
                    </div>
                </div>

                {/* KPI Cards */}
                <KPICards stats={stats} />

                <div className="grid-2-1">
                    {/* Chart & Activity */}
                    <div className="dashboard-main-col">
                        <OrderChart />

                        {/* Getting Started for New Businesses */}
                        {isNewBusiness && (
                            <div className="getting-started-card stagger-item" style={{ '--index': 5 } as any}>
                                <h3>🚀 Эхлэх гарын авлага</h3>
                                <p className="text-muted">Бизнесээ бүрэн тохируулахын тулд дараах алхмуудыг хийнэ үү:</p>
                                <div className="checklist-items">
                                    <div className="checklist-item done">
                                        <CheckCircle2 size={18} color="#0be881" />
                                        <span>Бизнес үүсгэсэн</span>
                                    </div>
                                    <a href="/app/products" className="checklist-item">
                                        <Package size={18} />
                                        <span>Эхний бараа нэмэх</span>
                                        <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                                    </a>
                                    <a href="/app/orders" className="checklist-item">
                                        <ShoppingCart size={18} />
                                        <span>Эхний захиалга авах</span>
                                        <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Orders List */}
                    <div className="dashboard-side-col">
                        <div className="dashboard-section stagger-item" style={{ '--index': 6 } as any}>
                            <div className="dashboard-section-header">
                                <h3>Сүүлийн захиалгууд</h3>
                                <a href="/app/orders" className="text-primary text-sm">Бүгд →</a>
                            </div>
                            <div className="dashboard-orders-list">
                                {recentOrders.length === 0 ? (
                                    <div className="empty-state-compact">
                                        <p className="text-muted">Захиалга байхгүй</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order, i) => (
                                        <div
                                            key={order.id}
                                            className="dashboard-order-item card card-clickable animate-fade-in"
                                            style={{ '--index': i } as any}
                                        >
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
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
