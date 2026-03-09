import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { ShoppingCart, Package, Loader2, ArrowRight, CheckCircle2, ScanLine, Truck as TruckIcon } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { dashboardService } from '../../services/db';
import { auditService } from '../../services/audit';
import { KPICards } from './components/KPICards';
import { OrderChart } from './components/OrderChart';
import type { Order } from '../../types';
import { fmt } from '../../utils/format';
import './Dashboard.css';



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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!business?.id) return;

        setTimeout(() => setLoading(true), 0);

        async function loadDashboard() {
            if (!business?.id) return;
            try {
                const statsData = await dashboardService.getDashboardStats(business.id);
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
        const unsubscribeOrders = dashboardService.subscribeRecentOrders(business.id!, (orders) => {
            setRecentOrders(orders);
            setLoading(false);
        });

        // Recent activity logs subscription
        const unsubscribeLogs = auditService.subscribeAuditLogs(business.id!, 10, (logs) => {
            setRecentLogs(logs);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeLogs();
        };
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
            <div className="page animate-fade-in" style={{ gap: 20 }}>
                {/* Dashboard Hero */}
                <div className="dashboard-hero stagger-item premium-glass-panel" style={{ '--index': 0 } as React.CSSProperties}>
                    <div className="dashboard-hero-content">
                        <div className="hero-badge">Эхлэх Цэг</div>
                        <h1>Сайн байна уу, <span className="text-gradient">{user?.displayName || 'Эзэн'}</span>! 👋</h1>
                        <p className="text-secondary">{business?.name} бизнесийн өнөөдрийн тойм болон шуурхай үйлдлүүд.</p>
                    </div>
                    <div className="dashboard-hero-action hide-mobile">
                        {business?.category === 'cargo' ? (
                            <a href="/app/packages" className="btn btn-primary btn-lg shine-effect">
                                <ScanLine size={18} /> Ачаа бүртгэх
                            </a>
                        ) : (
                            <a href="/app/orders" className="btn btn-primary btn-lg shine-effect">
                                <ShoppingCart size={18} /> Шинэ захиалга
                            </a>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <KPICards stats={stats} category={business?.category} />

                <div className="grid-2-1">
                    {/* Chart & Activity */}
                    <div className="dashboard-main-col">
                        <OrderChart />

                        {/* Getting Started for New Businesses */}
                        {isNewBusiness && (
                            <div className="getting-started-card stagger-item" style={{ '--index': 5 } as React.CSSProperties}>
                                <h3>🚀 Эхлэх гарын авлага</h3>
                                <p className="text-muted">Бизнесээ бүрэн тохируулахын тулд дараах алхмуудыг хийнэ үү:</p>
                                <div className="checklist-items">
                                    <div className="checklist-item done">
                                        <CheckCircle2 size={18} color="#0be881" />
                                        <span>Бизнес үүсгэсэн</span>
                                    </div>
                                    {business?.category === 'cargo' ? (
                                        <>
                                            <a href="/app/packages" className="checklist-item">
                                                <TruckIcon size={18} />
                                                <span>Анхны багц (Batch) ачих</span>
                                                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                                            </a>
                                            <a href="/app/packages" className="checklist-item">
                                                <ScanLine size={18} />
                                                <span>Ачаа сканнердаж бүртгэх</span>
                                                <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                                            </a>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Orders List */}
                    <div className="dashboard-side-col">
                        <div className="dashboard-section stagger-item glass-section" style={{ '--index': 6 } as React.CSSProperties}>
                            <div className="dashboard-section-header">
                                <h3><ShoppingCart size={18} className="text-primary inline-mr" /> Сүүлийн захиалгууд</h3>
                                <a href="/app/orders" className="text-primary text-sm hover-underline">Бүгд →</a>
                            </div>
                            <div className="dashboard-orders-list mb-6">
                                {recentOrders.length === 0 ? (
                                    <div className="empty-state-compact premium-empty">
                                        <ShoppingCart size={24} className="text-muted mb-2" />
                                        <p className="text-muted">Захиалга байхгүй</p>
                                    </div>
                                ) : (
                                    recentOrders.map((order, i) => (
                                        <div
                                            key={order.id}
                                            className="dashboard-order-item card card-clickable animate-fade-in premium-hover"
                                            style={{ '--index': i } as React.CSSProperties}
                                        >
                                            <div className="dashboard-order-left">
                                                <span className="dashboard-order-number">#{order.orderNumber}</span>
                                                <span className="dashboard-order-customer font-semibold">{order.customer?.name}</span>
                                            </div>
                                            <div className="dashboard-order-right">
                                                <span className="dashboard-order-amount font-bold">{fmt(order.financials?.totalAmount)}</span>
                                                <span className={`badge ${statusLabels[order.status]?.class || ''}`}>
                                                    {statusLabels[order.status]?.label || order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Log Stream */}
                        <div className="dashboard-section stagger-item" style={{ '--index': 7 } as React.CSSProperties}>
                            <div className="dashboard-section-header">
                                <h3>Сүүлийн үйлдлүүд</h3>
                                <a href="/app/settings?tab=activity" className="text-primary text-sm">Бүгд →</a>
                            </div>
                            <div className="activity-stream">
                                {recentLogs.length === 0 ? (
                                    <div className="empty-state-compact">
                                        <p className="text-muted">Үйлдэл байхгүй</p>
                                    </div>
                                ) : (
                                    recentLogs.map((log, i) => {
                                        const date = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
                                        const timeStr = date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

                                        let icon = '📝';
                                        if (log.action.includes('created')) icon = '✨';
                                        if (log.action.includes('updated')) icon = '🔄';
                                        if (log.action.includes('deleted')) icon = '🗑️';
                                        if (log.action.includes('settings')) icon = '⚙️';

                                        return (
                                            <div key={log.id} className="activity-item animate-fade-in" style={{ '--index': i } as React.CSSProperties}>
                                                <div className="activity-icon">{icon}</div>
                                                <div className="activity-content">
                                                    <div className="activity-text">
                                                        <strong>{log.userName}</strong> {log.action}{' '}
                                                        <span className="font-medium text-primary">{log.targetLabel}</span>
                                                    </div>
                                                    <div className="activity-time">{timeStr} &middot; {log.module}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
