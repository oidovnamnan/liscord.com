import { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, Package, Loader2, ArrowRight, CheckCircle2, ScanLine,
    Truck as TruckIcon, AlertTriangle, Users, FileText, TrendingDown,
    Clock, CreditCard, Radio, Wifi, Activity, Eye, Sparkles, LayoutDashboard
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { dashboardService, systemSettingsService } from '../../services/db';
import { auditService } from '../../services/audit';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { KPICards } from './components/KPICards';
import { OrderChart } from './components/OrderChart';
import type { Order } from '../../types';
import { fmt } from '../../utils/format';
import { getVisibleModules } from '../../utils/moduleUtils';
import { MODULE_PERMISSIONS } from '../../config/modulePermissions';
import './Dashboard.css';
import '../SuperAdmin/SuperAdmin.css';

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

interface LowStockProduct {
    id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
}

interface TopProduct {
    id: string;
    name: string;
    soldCount: number;
    revenue: number;
}

interface RecentCustomer {
    id: string;
    name: string;
    phone?: string;
    totalOrders?: number;
    createdAt?: Date;
}

interface UnpaidInvoice {
    id: string;
    invoiceNumber?: string;
    customerName?: string;
    totalAmount: number;
    dueDate?: Date;
    status: string;
}

export function DashboardPage() {
    const { business, employee, isImpersonating } = useBusinessStore();
    const { user } = useAuthStore();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    // New comprehensive data
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
    const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
    const [onlineEmployees, setOnlineEmployees] = useState<{ id: string; name: string; position?: string }[]>([]);
    const [visitorCount, setVisitorCount] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [moduleDefaults, setModuleDefaults] = useState<any>({});

    // Fetch module defaults for permission filtering
    useEffect(() => {
        systemSettingsService.getModuleDefaults().then(setModuleDefaults).catch(() => {});
    }, []);

    // Permission-based module visibility — same logic as Sidebar
    const isOwner = !isImpersonating && (user?.uid === business?.ownerId || employee?.role === 'owner');

    const modulePermissionMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const [moduleId, perms] of Object.entries(MODULE_PERMISSIONS)) {
            const prefixes = new Set<string>();
            for (const p of perms) { const d = p.id.indexOf('.'); if (d > 0) prefixes.add(p.id.substring(0, d + 1)); }
            if (prefixes.size > 0) map[moduleId] = [...prefixes];
        }
        map['dashboard'] = ['reports.'];
        return map;
    }, []);

    const visibleModuleIds = useMemo(() => {
        const allModules = getVisibleModules(business, moduleDefaults);
        if (isOwner) return new Set(allModules.map(m => m.id));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const empPerms: string[] = (employee as any)?.permissions || [];
        if (empPerms.length === 0) return new Set(allModules.map(m => m.id));
        const visible = allModules.filter(mod => {
            if (mod.id === 'dashboard') return true;
            const prefixes = modulePermissionMap[mod.id];
            if (!prefixes || prefixes.length === 0) return false;
            return prefixes.some(prefix => empPerms.some(p => p.startsWith(prefix)));
        });
        return new Set(visible.map(m => m.id));
    }, [business, moduleDefaults, isOwner, employee, modulePermissionMap]);

    const hasModule = (id: string) => visibleModuleIds.has(id);

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);

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
                setStats({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0 });
            } finally {
                setLoading(false);
            }
        }

        async function loadExtendedData() {
            if (!business?.id) return;
            const bizId = business.id;

            try {
                // 1. Low Stock Products — only if products/inventory module available
                if (visibleModuleIds.has('products') || visibleModuleIds.has('inventory')) {
                    const productsSnap = await getDocs(collection(db, 'businesses', bizId, 'products'));
                    const lowStock: LowStockProduct[] = [];
                    productsSnap.docs.forEach(d => {
                        const p = d.data();
                        if (p.isDeleted) return;
                        const stock = p.stock ?? p.quantity ?? 0;
                        const threshold = p.lowStockThreshold ?? 5;
                        if (stock <= threshold && !p.isPreorder) {
                            lowStock.push({ id: d.id, name: p.name || 'Нэргүй', stock, lowStockThreshold: threshold });
                        }
                    });
                    lowStock.sort((a, b) => a.stock - b.stock);
                    setLowStockProducts(lowStock.slice(0, 5));
                }

                // 2. Orders by Status + Top Products — only if orders module available
                if (visibleModuleIds.has('orders')) {
                    const ordersSnap = await getDocs(query(
                        collection(db, 'businesses', bizId, 'orders'),
                        where('isDeleted', '==', false)
                    ));
                    const statusMap: Record<string, number> = {};
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const productSales: Record<string, { name: string; count: number; revenue: number }> = {};

                    ordersSnap.docs.forEach(d => {
                        const o = d.data();
                        const status = o.status || 'new';
                        statusMap[status] = (statusMap[status] || 0) + 1;
                        if (o.status !== 'cancelled' && o.items) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            o.items.forEach((item: any) => {
                                const pid = item.productId || item.name;
                                if (!pid) return;
                                if (!productSales[pid]) productSales[pid] = { name: item.name || 'Нэргүй', count: 0, revenue: 0 };
                                productSales[pid].count += item.quantity || 1;
                                productSales[pid].revenue += (item.price || 0) * (item.quantity || 1);
                            });
                        }
                    });
                    setOrdersByStatus(statusMap);

                    const topProds = Object.entries(productSales)
                        .map(([id, data]) => ({ id, name: data.name, soldCount: data.count, revenue: data.revenue }))
                        .sort((a, b) => b.soldCount - a.soldCount)
                        .slice(0, 5);
                    setTopProducts(topProds);
                }

                // 3. Recent Customers — only if customers module
                if (visibleModuleIds.has('customers')) {
                    try {
                        const custSnap = await getDocs(query(
                            collection(db, 'businesses', bizId, 'customers'),
                            orderBy('createdAt', 'desc'),
                            limit(5)
                        ));
                        setRecentCustomers(custSnap.docs.map(d => {
                            const c = d.data();
                            return { id: d.id, name: c.name || 'Нэргүй', phone: c.phone, totalOrders: c.totalOrders || 0, createdAt: c.createdAt?.toDate?.() || new Date() };
                        }));
                    } catch { setRecentCustomers([]); }
                }

                // 4. Unpaid Invoices — only if finance module
                if (visibleModuleIds.has('finance')) {
                    try {
                        const invSnap = await getDocs(query(
                            collection(db, 'businesses', bizId, 'invoices'),
                            where('status', '==', 'unpaid')
                        ));
                        setUnpaidInvoices(invSnap.docs.map(d => {
                            const inv = d.data();
                            return { id: d.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, totalAmount: inv.totalAmount || 0, dueDate: inv.dueDate?.toDate?.(), status: inv.status };
                        }).slice(0, 5));
                    } catch { setUnpaidInvoices([]); }
                }

                // 5. Online Employees — moved to real-time subscription below

            } catch (error) {
                console.error('Extended data load error:', error);
            }
        }

        loadDashboard();
        loadExtendedData();

        // Recent orders subscription — only if orders module
        let unsubscribeOrders: (() => void) | undefined;
        if (visibleModuleIds.has('orders')) {
            unsubscribeOrders = dashboardService.subscribeRecentOrders(business.id!, (orders) => {
                setRecentOrders(orders);
            });
        }

        // Recent activity logs subscription — always visible
        const unsubscribeLogs = auditService.subscribeAuditLogs(business.id!, 10, (logs) => {
            setRecentLogs(logs);
        });

        // Online Employees — real-time subscription (updates every heartbeat)
        let unsubscribeOnline: (() => void) | undefined;
        if (visibleModuleIds.has('online-presence')) {
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000));
            const onlineQ = query(
                collection(db, 'businesses', business.id!, 'employees'),
                where('lastActiveAt', '>=', twoMinAgo)
            );
            unsubscribeOnline = onSnapshot(onlineQ, (snap) => {
                setOnlineEmployees(snap.docs.map(d => {
                    const data = d.data();
                    return { id: d.id, name: data.name || 'Нэргүй', position: data.positionName || '' };
                }));
            }, () => setOnlineEmployees([]));
        }

        // Visitor count — real-time subscription
        let unsubscribeVisitors: (() => void) | undefined;
        if (visibleModuleIds.has('online-presence')) {
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000));
            const visitorQ = query(
                collection(db, 'businesses', business.id!, 'visitors'),
                where('lastActiveAt', '>=', twoMinAgo)
            );
            unsubscribeVisitors = onSnapshot(visitorQ, (snap) => {
                setVisitorCount(snap.size);
            }, () => setVisitorCount(0));
        }

        return () => {
            unsubscribeOrders?.();
            unsubscribeLogs();
            unsubscribeOnline?.();
            unsubscribeVisitors?.();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, visibleModuleIds]);

    // Today's revenue from recent orders (must be before early return - hooks rule)
    const todayRevenue = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return recentOrders
            .filter(o => {
                const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any)?.toDate?.();
                return d && d >= todayStart && o.paymentStatus === 'paid';
            })
            .reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0);
    }, [recentOrders]);

    if (loading || !stats) {
        return (
            <div className="loading-screen">
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    const isNewBusiness = (stats?.totalOrders || 0) === 0;

    // Order status summary
    const pendingOrders = (ordersByStatus['new'] || 0) + (ordersByStatus['confirmed'] || 0);
    const preparingOrders = (ordersByStatus['preparing'] || 0) + (ordersByStatus['ready'] || 0);
    const shippingOrders = ordersByStatus['shipping'] || 0;

    const displayName = isImpersonating && employee ? employee.name : (user?.displayName || 'Эзэн');

    return (
        <>
            {/* ── Premium Gradient Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 40%, #0891b2 100%)', boxShadow: '0 8px 32px rgba(5, 150, 105, 0.25)', margin: '24px clamp(16px, 3vw, 32px) 0' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><LayoutDashboard size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> {business?.name}</div>
                            <h1 className="sa-hero-title">Сайн байна уу, {displayName}! 👋</h1>
                            <div className="sa-hero-desc">{business?.name} бизнесийн өнөөдрийн тойм болон шуурхай үйлдлүүд</div>
                        </div>
                    </div>
                </div>
                <div className="sa-hero-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                    {hasModule('orders') && (
                        <div className="sa-hero-stat">
                            <div className="sa-hero-stat-value">₮{todayRevenue > 999999 ? `${(todayRevenue / 1000000).toFixed(1)}M` : todayRevenue > 999 ? `${(todayRevenue / 1000).toFixed(0)}K` : todayRevenue.toLocaleString()}</div>
                            <div className="sa-hero-stat-label">Өнөөдрийн орлого</div>
                        </div>
                    )}
                    {hasModule('orders') && (
                        <div className="sa-hero-stat">
                            <div className="sa-hero-stat-value">{pendingOrders}{pendingOrders > 0 && <span className="sa-hero-stat-growth down" style={{ background: 'rgba(251,191,36,0.3)', color: '#fde68a' }}>шинэ</span>}</div>
                            <div className="sa-hero-stat-label">Хүлээгдэж буй</div>
                        </div>
                    )}
                    {hasModule('products') && (
                        <div className="sa-hero-stat">
                            <div className="sa-hero-stat-value">{stats?.totalProducts || 0}</div>
                            <div className="sa-hero-stat-label">Идэвхтэй бараа</div>
                        </div>
                    )}
                    {hasModule('online-presence') && (
                        <div className="sa-hero-stat">
                            <div className="sa-hero-stat-value">{onlineEmployees.length + visitorCount}{(onlineEmployees.length + visitorCount) > 0 && <span className="sa-hero-stat-growth up">live</span>}</div>
                            <div className="sa-hero-stat-label">{onlineEmployees.length} ажилтан{visitorCount > 0 && ` · ${visitorCount} зочин`}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="page animate-fade-in" style={{ gap: 20 }}>

                {/* KPI Cards — filtered by permissions */}
                <KPICards stats={stats} category={business?.category} visibleModuleIds={visibleModuleIds} />

                {/* Order Status Summary Bar — only with orders module */}
                {hasModule('orders') && (pendingOrders > 0 || preparingOrders > 0 || shippingOrders > 0) && (
                    <div className="dash-status-bar">
                        {pendingOrders > 0 && (
                            <a href="/app/orders" className="dash-status-chip chip-pending">
                                <Clock size={14} />
                                <span>{pendingOrders} хүлээгдэж буй</span>
                            </a>
                        )}
                        {preparingOrders > 0 && (
                            <a href="/app/orders" className="dash-status-chip chip-preparing">
                                <Package size={14} />
                                <span>{preparingOrders} бэлтгэж буй</span>
                            </a>
                        )}
                        {shippingOrders > 0 && (
                            <a href="/app/orders" className="dash-status-chip chip-shipping">
                                <TruckIcon size={14} />
                                <span>{shippingOrders} хүргэлтэнд</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Chart — only with orders module */}
                {hasModule('orders') && <OrderChart />}

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

                {/* Row 1: Orders + Low Stock — guarded by module permissions */}
                {(hasModule('orders') || hasModule('products') || hasModule('inventory')) && (
                <div className="dashboard-bottom-grid">
                    {/* Recent Orders */}
                    {hasModule('orders') && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 6 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><ShoppingCart size={18} className="text-primary inline-mr" /> Сүүлийн захиалгууд</h3>
                            <a href="/app/orders" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dashboard-orders-list">
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
                    )}

                    {/* Low Stock Alert — requires products or inventory module */}
                    {(hasModule('products') || hasModule('inventory')) && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 7 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><AlertTriangle size={18} style={{ color: 'var(--accent-orange)', marginRight: 8 }} /> Нөөц дуусаж буй</h3>
                            <a href="/app/inventory" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {lowStockProducts.length === 0 ? (
                                <div className="empty-state-compact">
                                    <CheckCircle2 size={24} style={{ color: 'var(--accent-green)', marginBottom: 8 }} />
                                    <p className="text-muted">Бүх нөөц хангалттай 👍</p>
                                </div>
                            ) : (
                                lowStockProducts.map(p => (
                                    <div key={p.id} className="dash-list-item">
                                        <div className="dash-list-left">
                                            <span className="dash-list-name">{p.name}</span>
                                        </div>
                                        <div className="dash-list-right">
                                            <span className={`dash-stock-badge ${p.stock === 0 ? 'stock-out' : 'stock-low'}`}>
                                                {p.stock === 0 ? 'Дууссан' : `${p.stock} ширхэг`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}
                </div>
                )}

                {/* Row 2: Top Products + Recent Customers — guarded */}
                {(hasModule('orders') || hasModule('customers')) && (
                <div className="dashboard-bottom-grid">
                    {/* Top Selling Products — requires orders module */}
                    {hasModule('orders') && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 8 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><TrendingDown size={18} style={{ color: 'var(--accent-green)', marginRight: 8, transform: 'scaleY(-1)' }} /> Шилдэг бүтээгдэхүүн</h3>
                        </div>
                        <div className="dash-list">
                            {topProducts.length === 0 ? (
                                <div className="empty-state-compact">
                                    <Package size={24} className="text-muted mb-2" />
                                    <p className="text-muted">Борлуулалтын мэдээлэл байхгүй</p>
                                </div>
                            ) : (
                                topProducts.map((p, i) => (
                                    <div key={p.id} className="dash-list-item">
                                        <div className="dash-list-left">
                                            <span className="dash-rank">#{i + 1}</span>
                                            <span className="dash-list-name">{p.name}</span>
                                        </div>
                                        <div className="dash-list-right">
                                            <span className="dash-list-meta">{p.soldCount} ширхэг</span>
                                            <span className="dash-list-amount">{fmt(p.revenue)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {/* Recent Customers — requires customers module */}
                    {hasModule('customers') && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 9 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><Users size={18} style={{ color: 'var(--secondary)', marginRight: 8 }} /> Сүүлийн харилцагчид</h3>
                            <a href="/app/customers" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {recentCustomers.length === 0 ? (
                                <div className="empty-state-compact">
                                    <Users size={24} className="text-muted mb-2" />
                                    <p className="text-muted">Харилцагч байхгүй</p>
                                </div>
                            ) : (
                                recentCustomers.map(c => (
                                    <div key={c.id} className="dash-list-item">
                                        <div className="dash-list-left">
                                            <div className="dash-customer-avatar">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="dash-list-name">{c.name}</span>
                                                {c.phone && <span className="dash-list-sub">{c.phone}</span>}
                                            </div>
                                        </div>
                                        {(c.totalOrders ?? 0) > 0 && (
                                            <span className="dash-list-meta">{c.totalOrders} захиалга</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}
                </div>
                )}

                {/* Row 3: Unpaid Invoices + Activity */}
                <div className="dashboard-bottom-grid">
                    {/* Unpaid Invoices — requires finance module */}
                    {hasModule('finance') && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 10 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><CreditCard size={18} style={{ color: 'var(--accent-orange)', marginRight: 8 }} /> Төлөгдөөгүй нэхэмжлэл</h3>
                            <a href="/app/finance" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {unpaidInvoices.length === 0 ? (
                                <div className="empty-state-compact">
                                    <CheckCircle2 size={24} style={{ color: 'var(--accent-green)', marginBottom: 8 }} />
                                    <p className="text-muted">Тойрч гарах зүйлгүй 👍</p>
                                </div>
                            ) : (
                                unpaidInvoices.map(inv => (
                                    <div key={inv.id} className="dash-list-item">
                                        <div className="dash-list-left">
                                            <FileText size={16} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
                                            <div>
                                                <span className="dash-list-name">{inv.customerName || inv.invoiceNumber || 'Нэхэмжлэл'}</span>
                                                {inv.dueDate && (
                                                    <span className="dash-list-sub">
                                                        Хугацаа: {inv.dueDate.toLocaleDateString('mn-MN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="dash-list-amount" style={{ color: 'var(--accent-orange)' }}>
                                            {fmt(inv.totalAmount)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {/* Online Employees — only with online-presence module */}
                    {/* Online Employees — always show when module installed */}
                    {hasModule('online-presence') && (
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 11 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3><Radio size={16} style={{ marginRight: 6 }} />Онлайн ажилтнууд <span style={{ fontSize: '0.8rem', color: onlineEmployees.length > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 700, marginLeft: 4 }}>{onlineEmployees.length} онлайн</span></h3>
                            <a href="/app/online-presence" className="text-primary text-sm">Бүгд →</a>
                        </div>
                        {onlineEmployees.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px' }}>
                                {onlineEmployees.map(emp => (
                                    <div key={emp.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 14px', borderRadius: 12,
                                        background: 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.15)',
                                        fontSize: '0.85rem'
                                    }}>
                                        <Wifi size={14} style={{ color: '#10b981' }} />
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</span>
                                        {emp.position && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>· {emp.position}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                <Wifi size={20} style={{ opacity: 0.2, marginBottom: 6, display: 'inline-block' }} />
                                <br />Одоогоор онлайн ажилтан байхгүй
                            </div>
                        )}
                    </div>
                    )}

                    {/* Recent Activity Log */}
                    <div className="dashboard-section stagger-item glass-section" style={{ '--index': 12 } as React.CSSProperties}>
                        <div className="dashboard-section-header">
                            <h3>Сүүлийн үйлдлүүд</h3>
                            <a href="/app/settings?tab=activity" className="text-primary text-sm">Бүгд →</a>
                        </div>
                        <div className="activity-stream" style={{ maxHeight: 300, overflowY: 'auto' }}>
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
        </>
    );
}
