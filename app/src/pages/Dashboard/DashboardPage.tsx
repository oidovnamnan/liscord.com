import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    ShoppingCart, Package, Loader2, ArrowRight, CheckCircle2, ScanLine,
    Truck as TruckIcon, AlertTriangle, Users, FileText, TrendingDown, TrendingUp,
    Clock, CreditCard, Radio, Wifi, Sparkles, LayoutDashboard,
    GripVertical, BarChart3, Percent, DollarSign, Repeat, UserPlus, PackageX,
    ShoppingBag, PieChart, ArrowDownRight, ArrowUpRight, Banknote, RefreshCw,
    Crown, Hash, Eye, Menu
} from 'lucide-react';
import { useBusinessStore, useAuthStore, useModuleDefaultsStore, useUIStore } from '../../store';
import { useCartStore } from '../../store/cartStore';
import { dashboardService } from '../../services/db';
import { auditService } from '../../services/audit';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
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

interface LowStockProduct { id: string; name: string; stock: number; lowStockThreshold: number; }
interface TopProduct { id: string; name: string; soldCount: number; revenue: number; }
interface RecentCustomer { id: string; name: string; phone?: string; totalOrders?: number; createdAt?: Date; }
interface UnpaidInvoice { id: string; invoiceNumber?: string; customerName?: string; totalAmount: number; dueDate?: Date; status: string; }

// ═══════════════════════════════════════
// Comprehensive Analytics State
// ═══════════════════════════════════════
interface AnalyticsData {
    // Orders
    avgOrderValue: number;
    todayOrderCount: number;
    weekOrderCount: number;
    monthOrderCount: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    prevWeekRevenue: number;
    revenueGrowthPct: number;
    cancelledCount: number;
    returnedCount: number;
    cancelRate: number;
    // Payment
    paidCount: number;
    unpaidCount: number;
    partialCount: number;
    paymentMethods: Record<string, number>;
    // Customers
    newCustomers7d: number;
    repeatCustomers: number;
    totalCustomerSpend: number;
    // Products
    outOfStockCount: number;
    totalProductCount: number;
    activeProductCount: number;
    noSalesProducts: number;
    // Status breakdown
    statusBreakdown: Record<string, number>;
}

// Widget definitions
type WidgetId = 'kpi' | 'analytics-grid' | 'chart' | 'status-bar' | 'status-donut' |
    'recent-orders' | 'low-stock' | 'top-products' | 'most-viewed' | 'recent-customers' |
    'unpaid-invoices' | 'online-employees' | 'activity-log' | 'getting-started' |
    'payment-breakdown' | 'customer-insights' | 'unpaid-cart';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
    'kpi', 'analytics-grid', 'status-bar', 'chart',
    'status-donut', 'payment-breakdown',
    'recent-orders', 'unpaid-cart',
    'top-products', 'most-viewed',
    'low-stock', 'customer-insights',
    'unpaid-invoices', 'online-employees',
    'recent-customers', 'activity-log'
];

/** Format large numbers nicely */
function fmtNum(n: number, prefix = ''): string {
    if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${prefix}${(n / 1_000).toFixed(0)}K`;
    if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
    return `${prefix}${n.toLocaleString()}`;
}

// ═══════════════════════════════════════
// Mini Stat Card Component
// ═══════════════════════════════════════
function MiniStat({ icon: Icon, label, value, sub, color, trend }: {
    icon: typeof DollarSign; label: string; value: string; sub?: string;
    color: string; trend?: 'up' | 'down' | null;
}) {
    return (
        <div className="mini-stat-card" style={{ '--ms-color': color } as React.CSSProperties}>
            <div className="mini-stat-icon"><Icon size={16} /></div>
            <div className="mini-stat-body">
                <div className="mini-stat-value">
                    {value}
                    {trend === 'up' && <ArrowUpRight size={12} style={{ color: '#10b981', marginLeft: 3 }} />}
                    {trend === 'down' && <ArrowDownRight size={12} style={{ color: '#ef4444', marginLeft: 3 }} />}
                </div>
                <div className="mini-stat-label">{label}</div>
                {sub && <div className="mini-stat-sub">{sub}</div>}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════
// Donut Chart Component
// ═══════════════════════════════════════
function DonutChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="empty-state-compact"><p className="text-muted">Мэдээлэл байхгүй</p></div>;
    let offset = 0;
    const segments = data.filter(d => d.value > 0).map((d, i) => {
        const pct = (d.value / total) * 100;
        const seg = { ...d, pct, offset, color: colors[i % colors.length] };
        offset += pct;
        return seg;
    });

    return (
        <div className="donut-chart-wrapper">
            <svg viewBox="0 0 100 100" className="donut-svg">
                {segments.map((seg, i) => {
                    const circumference = Math.PI * 70;
                    const dashLen = (seg.pct / 100) * circumference;
                    const dashOffset = -(seg.offset / 100) * circumference;
                    return (
                        <circle key={i} cx="50" cy="50" r="35" fill="none"
                            stroke={seg.color} strokeWidth="8"
                            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                            strokeDashoffset={dashOffset}
                            style={{ transition: 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease' }}
                        />
                    );
                })}
                <text x="50" y="48" textAnchor="middle" className="donut-total">{total}</text>
                <text x="50" y="58" textAnchor="middle" className="donut-total-label">нийт</text>
            </svg>
            <div className="donut-legend">
                {segments.map((seg, i) => (
                    <div key={i} className="donut-legend-item">
                        <span className="donut-legend-dot" style={{ background: seg.color }} />
                        <span className="donut-legend-label">{seg.label}</span>
                        <span className="donut-legend-value">{seg.value} ({seg.pct.toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════
// Horizontal Bar Component
// ═══════════════════════════════════════
function HBarChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    if (data.every(d => d.value === 0)) return <div className="empty-state-compact"><p className="text-muted">Мэдээлэл байхгүй</p></div>;
    return (
        <div className="hbar-chart">
            {data.filter(d => d.value > 0).map((d, i) => (
                <div key={i} className="hbar-row">
                    <span className="hbar-label">{d.label}</span>
                    <div className="hbar-track">
                        <div className="hbar-fill" style={{
                            width: `${(d.value / max) * 100}%`,
                            background: colors[i % colors.length],
                            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                    <span className="hbar-value">{d.value}</span>
                </div>
            ))}
        </div>
    );
}

export function DashboardPage() {
    const { business, employee, isImpersonating } = useBusinessStore();
    const { user } = useAuthStore();
    const cartItems = useCartStore(s => s.items);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [mostViewedProducts, setMostViewedProducts] = useState<{ id: string; name: string; viewCount: number; image?: string }[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
    const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
    const [onlineEmployees, setOnlineEmployees] = useState<{ id: string; name: string; position?: string }[]>([]);
    const [unpaidCartItems, setUnpaidCartItems] = useState<{ productId: string; name: string; totalQty: number; totalValue: number; cartCount: number }[]>([]);
    const [visitorCount, setVisitorCount] = useState(0);
    const { defaults: moduleDefaults, fetchDefaults } = useModuleDefaultsStore();

    // ═══ COMPREHENSIVE ANALYTICS ═══
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        avgOrderValue: 0, todayOrderCount: 0, weekOrderCount: 0, monthOrderCount: 0,
        todayRevenue: 0, weekRevenue: 0, monthRevenue: 0, prevWeekRevenue: 0, revenueGrowthPct: 0,
        cancelledCount: 0, returnedCount: 0, cancelRate: 0,
        paidCount: 0, unpaidCount: 0, partialCount: 0, paymentMethods: {},
        newCustomers7d: 0, repeatCustomers: 0, totalCustomerSpend: 0,
        outOfStockCount: 0, totalProductCount: 0, activeProductCount: 0, noSalesProducts: 0,
        statusBreakdown: {},
    });

    // ═══ Widget Order ═══
    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);
    const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
    const [dragOverWidget, setDragOverWidget] = useState<WidgetId | null>(null);

    useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

    // Load saved layout
    useEffect(() => {
        if (!business?.id || !user?.uid) return;
        getDoc(doc(db, 'businesses', business.id, 'dashboardLayout', user.uid)).then(snap => {
            if (snap.exists() && snap.data()?.widgetOrder?.length) {
                const saved = snap.data().widgetOrder as WidgetId[];
                // Filter out deprecated widgets no longer in defaults
                const validSet = new Set(DEFAULT_WIDGET_ORDER);
                const filtered = saved.filter(w => validSet.has(w));
                // Add any new widgets not in saved order
                for (const w of DEFAULT_WIDGET_ORDER) { if (!filtered.includes(w)) filtered.push(w); }
                setWidgetOrder(filtered);
            }
        }).catch(() => {});
    }, [business?.id, user?.uid]);

    const saveLayout = useCallback((order: WidgetId[]) => {
        if (!business?.id || !user?.uid) return;
        setDoc(doc(db, 'businesses', business.id, 'dashboardLayout', user.uid),
            { widgetOrder: order, updatedAt: new Date() }, { merge: true }).catch(() => {});
    }, [business?.id, user?.uid]);

    // ═══ Drag handlers (CSS Grid compatible) ═══
    const handleDragStart = useCallback((e: React.DragEvent, wId: WidgetId) => {
        setDraggedWidget(wId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', wId);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedWidget(null);
        setDragOverWidget(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDragEnterWidget = useCallback((e: React.DragEvent, wId: WidgetId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverWidget(wId);
    }, []);

    const handleDragLeaveWidget = useCallback((e: React.DragEvent) => {
        // Only clear if leaving the actual widget (not entering a child)
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !e.currentTarget.contains(related)) {
            setDragOverWidget(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: WidgetId) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggedWidget(null);
        setDragOverWidget(null);
        const sourceId = e.dataTransfer.getData('text/plain') as WidgetId;
        if (!sourceId || sourceId === targetId) return;
        setWidgetOrder(prev => {
            const arr = [...prev];
            const si = arr.indexOf(sourceId), ti = arr.indexOf(targetId);
            if (si < 0 || ti < 0) return prev;
            arr.splice(si, 1);
            arr.splice(ti, 0, sourceId);
            saveLayout(arr);
            return arr;
        });
    }, [saveLayout]);

    // Permissions
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

    // ═══ Data loading ═══
    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);

        async function loadDashboard() {
            if (!business?.id) return;
            try {
                const statsData = await dashboardService.getDashboardStats(business.id);
                setStats(statsData || { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0 });
            } catch {
                setStats({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0 });
            } finally { setLoading(false); }
        }

        async function loadExtendedData() {
            if (!business?.id) return;
            const bizId = business.id;
            const now = new Date();
            const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
            const weekAgo = new Date(now.getTime() - 7 * 86400000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
            const monthAgo = new Date(now.getTime() - 30 * 86400000);

            try {
                // ═══ PRODUCTS ═══
                let outOfStock = 0, totalProds = 0, activeProds = 0;
                const lowStock: LowStockProduct[] = [];
                const viewedProds: { id: string; name: string; viewCount: number; image?: string }[] = [];
                if (visibleModuleIds.has('products') || visibleModuleIds.has('inventory')) {
                    const productsSnap = await getDocs(collection(db, 'businesses', bizId, 'products'));
                    productsSnap.docs.forEach(d => {
                        const p = d.data();
                        if (p.isDeleted) return;
                        totalProds++;
                        if (!p.isArchived) activeProds++;
                        const stock = p.stock ?? p.quantity ?? 0;
                        if (stock === 0 && !p.isPreorder) outOfStock++;
                        const threshold = p.lowStockThreshold ?? 5;
                        if (stock <= threshold && !p.isPreorder) {
                            lowStock.push({ id: d.id, name: p.name || 'Нэргүй', stock, lowStockThreshold: threshold });
                        }
                        // Track most-viewed
                        if ((p.viewCount || 0) > 0 && !p.isArchived) {
                            viewedProds.push({ id: d.id, name: p.name || 'Нэргүй', viewCount: p.viewCount, image: p.images?.[0] });
                        }
                    });
                    lowStock.sort((a, b) => a.stock - b.stock);
                    setLowStockProducts(lowStock.slice(0, 8));
                    viewedProds.sort((a, b) => b.viewCount - a.viewCount);
                    setMostViewedProducts(viewedProds.slice(0, 10));
                }

                // ═══ ORDERS (comprehensive analytics) ═══
                let avgVal = 0, todayOrdCount = 0, weekOrdCount = 0, monthOrdCount = 0;
                let todayRev = 0, weekRev = 0, monthRev = 0, prevWeekRev = 0;
                let cancelledCount = 0, returnedCount = 0, totalValidOrders = 0;
                let paidCount = 0, unpaidOrdCount = 0, partialCount = 0;
                const payMethods: Record<string, number> = {};
                const statusMap: Record<string, number> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
                const soldProductIds = new Set<string>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const cartItemsMap: Record<string, { productId: string; name: string; totalQty: number; totalValue: number; cartCount: number }> = {};

                if (visibleModuleIds.has('orders')) {
                    const ordersSnap = await getDocs(query(
                        collection(db, 'businesses', bizId, 'orders'),
                        where('isDeleted', '==', false)
                    ));

                    ordersSnap.docs.forEach(d => {
                        const o = d.data();
                        if (o.orderType === 'membership') return;
                        const status = o.status || 'new';
                        const amount = o.financials?.totalAmount || o.totalAmount || 0;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const createdAt = o.createdAt?.toDate?.() || (o.createdAt as any)?.seconds ? new Date(o.createdAt.seconds * 1000) : null;

                        // Status breakdown (all)
                        statusMap[status] = (statusMap[status] || 0) + 1;

                        if (status === 'cancelled') { cancelledCount++; return; }
                        if (status === 'returned') { returnedCount++; return; }

                        // Unpaid carts — collect product items
                        if (o.paymentStatus === 'unpaid' && status === 'new') {
                            if (o.items) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                o.items.forEach((item: any) => {
                                    const pid = item.productId || item.name;
                                    if (!pid) return;
                                    if (!cartItemsMap[pid]) cartItemsMap[pid] = { productId: pid, name: item.name || 'Нэргүй', totalQty: 0, totalValue: 0, cartCount: 0 };
                                    cartItemsMap[pid].totalQty += item.quantity || 1;
                                    cartItemsMap[pid].totalValue += (item.price || 0) * (item.quantity || 1);
                                });
                                // Count unique carts per product
                                const seenPids = new Set<string>();
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                o.items.forEach((item: any) => {
                                    const pid = item.productId || item.name;
                                    if (pid && !seenPids.has(pid)) { seenPids.add(pid); if (cartItemsMap[pid]) cartItemsMap[pid].cartCount++; }
                                });
                            }
                            return;
                        }

                        totalValidOrders++;

                        // Payment status
                        if (o.paymentStatus === 'paid') paidCount++;
                        else if (o.paymentStatus === 'partial') partialCount++;
                        else unpaidOrdCount++;

                        // Payment method
                        const method = o.paymentMethod || o.financials?.paymentMethod || 'unknown';
                        payMethods[method] = (payMethods[method] || 0) + 1;

                        // Time-based stats
                        if (createdAt) {
                            if (createdAt >= todayStart) { todayOrdCount++; todayRev += amount; }
                            if (createdAt >= weekAgo) { weekOrdCount++; weekRev += amount; }
                            if (createdAt >= monthAgo) { monthOrdCount++; monthRev += amount; }
                            if (createdAt >= twoWeeksAgo && createdAt < weekAgo) { prevWeekRev += amount; }
                        }

                        // Product sales
                        if (o.items) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            o.items.forEach((item: any) => {
                                const pid = item.productId || item.name;
                                if (!pid) return;
                                soldProductIds.add(pid);
                                if (!productSales[pid]) productSales[pid] = { name: item.name || 'Нэргүй', count: 0, revenue: 0 };
                                productSales[pid].count += item.quantity || 1;
                                productSales[pid].revenue += (item.price || 0) * (item.quantity || 1);
                            });
                        }
                    });

                    avgVal = totalValidOrders > 0 ? Math.round(weekRev / Math.max(weekOrdCount, 1)) : 0;
                    const allOrderCount = totalValidOrders + cancelledCount + returnedCount;
                    const cancelRate = allOrderCount > 0 ? Math.round(((cancelledCount + returnedCount) / allOrderCount) * 100) : 0;
                    const growthPct = prevWeekRev > 0 ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100) : (weekRev > 0 ? 100 : 0);

                    setOrdersByStatus(statusMap);
                    setTopProducts(Object.entries(productSales)
                        .map(([id, data]) => ({ id, name: data.name, soldCount: data.count, revenue: data.revenue }))
                        .sort((a, b) => b.soldCount - a.soldCount).slice(0, 8));

                    // Unpaid cart items — sorted by total quantity
                    setUnpaidCartItems(Object.values(cartItemsMap).sort((a, b) => b.totalQty - a.totalQty));

                    setAnalytics(prev => ({
                        ...prev,
                        avgOrderValue: avgVal, todayOrderCount: todayOrdCount,
                        weekOrderCount: weekOrdCount, monthOrderCount: monthOrdCount,
                        todayRevenue: todayRev, weekRevenue: weekRev, monthRevenue: monthRev,
                        prevWeekRevenue: prevWeekRev, revenueGrowthPct: growthPct,
                        cancelledCount, returnedCount, cancelRate,
                        paidCount, unpaidCount: unpaidOrdCount, partialCount,
                        paymentMethods: payMethods,
                        statusBreakdown: statusMap,
                        outOfStockCount: outOfStock, totalProductCount: totalProds,
                        activeProductCount: activeProds,
                        noSalesProducts: Math.max(0, activeProds - soldProductIds.size),
                    }));
                }

                // ═══ CUSTOMERS ═══
                let newCust7d = 0, repeatCust = 0;
                if (visibleModuleIds.has('customers')) {
                    try {
                        const custSnap = await getDocs(collection(db, 'businesses', bizId, 'customers'));
                        const recentCusts: RecentCustomer[] = [];
                        custSnap.docs.forEach(d => {
                            const c = d.data();
                            const created = c.createdAt?.toDate?.();
                            if (created && created >= weekAgo) newCust7d++;
                            if ((c.totalOrders || 0) >= 2) repeatCust++;
                            recentCusts.push({
                                id: d.id, name: c.name || 'Нэргүй', phone: c.phone,
                                totalOrders: c.totalOrders || 0,
                                createdAt: created || new Date()
                            });
                        });
                        recentCusts.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
                        setRecentCustomers(recentCusts.slice(0, 5));
                        setAnalytics(prev => ({ ...prev, newCustomers7d: newCust7d, repeatCustomers: repeatCust }));
                    } catch { setRecentCustomers([]); }
                }

                // ═══ INVOICES ═══
                if (visibleModuleIds.has('finance')) {
                    try {
                        const invSnap = await getDocs(query(
                            collection(db, 'businesses', bizId, 'invoices'), where('status', '==', 'unpaid')));
                        setUnpaidInvoices(invSnap.docs.map(d => {
                            const inv = d.data();
                            return { id: d.id, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, totalAmount: inv.totalAmount || 0, dueDate: inv.dueDate?.toDate?.(), status: inv.status };
                        }).slice(0, 5));
                    } catch { setUnpaidInvoices([]); }
                }
            } catch (error) { console.error('Extended data load error:', error); }
        }

        loadDashboard();
        loadExtendedData();

        let unsubOrders: (() => void) | undefined;
        if (visibleModuleIds.has('orders')) {
            unsubOrders = dashboardService.subscribeRecentOrders(business.id!, o => setRecentOrders(o));
        }
        const unsubLogs = auditService.subscribeAuditLogs(business.id!, 10, l => setRecentLogs(l));

        let unsubOnline: (() => void) | undefined;
        let unsubVisitors: (() => void) | undefined;
        if (visibleModuleIds.has('online-presence')) {
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 120000));
            unsubOnline = onSnapshot(
                query(collection(db, 'businesses', business.id!, 'employees'), where('lastActiveAt', '>=', twoMinAgo)),
                snap => setOnlineEmployees(snap.docs.map(d => ({ id: d.id, name: d.data().name || 'Нэргүй', position: d.data().positionName || '' }))),
                () => setOnlineEmployees([])
            );
            unsubVisitors = onSnapshot(
                query(collection(db, 'businesses', business.id!, 'visitors'), where('lastActiveAt', '>=', twoMinAgo)),
                snap => setVisitorCount(snap.size), () => setVisitorCount(0)
            );
        }

        return () => { unsubOrders?.(); unsubLogs(); unsubOnline?.(); unsubVisitors?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, visibleModuleIds]);

    const todayRevenue = useMemo(() => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        return recentOrders
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter(o => { const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any)?.toDate?.(); return d && d >= todayStart && o.paymentStatus === 'paid' && o.orderType !== 'membership'; })
            .reduce((sum, o) => sum + (o.financials?.totalAmount || 0), 0);
    }, [recentOrders]);

    // Confirmed orders today (real-time from recentOrders)
    const todayConfirmedOrders = useMemo(() => {
        const ts = new Date(); ts.setHours(0, 0, 0, 0);
        return recentOrders.filter(o => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any)?.toDate?.();
            return d && d >= ts && o.paymentStatus === 'paid' && o.orderType !== 'membership';
        }).length;
    }, [recentOrders]);

    // Magnetic scroll-snap now handled by CSS on .dash-mobile-hero

    if (loading || !stats) {
        return <div className="loading-screen"><Loader2 className="animate-spin" size={32} /><p>Уншиж байна...</p></div>;
    }

    const isNewBusiness = (stats?.totalOrders || 0) === 0;
    const pendingOrders = (ordersByStatus['new'] || 0) + (ordersByStatus['confirmed'] || 0);
    const preparingOrders = (ordersByStatus['preparing'] || 0) + (ordersByStatus['ready'] || 0);
    const shippingOrders = ordersByStatus['shipping'] || 0;
    const displayName = isImpersonating && employee ? employee.name : (user?.displayName || 'Эзэн');

    // ═══════════════════════════════════════
    // Widget Config — size tiers
    // ═══════════════════════════════════════
    const WIDGET_SIZE: Record<WidgetId, { tier: 'header' | 'standard' | 'tall' | 'full' }> = {
        'kpi':               { tier: 'header' },
        'analytics-grid':    { tier: 'header' },
        'status-bar':        { tier: 'header' },
        'getting-started':   { tier: 'header' },
        'chart':             { tier: 'full' },
        'status-donut':      { tier: 'standard' },
        'payment-breakdown': { tier: 'standard' },
        'customer-insights': { tier: 'standard' },
        'online-employees':  { tier: 'standard' },
        'low-stock':         { tier: 'standard' },
        'unpaid-invoices':   { tier: 'standard' },
        'unpaid-cart':       { tier: 'standard' },
        'recent-orders':     { tier: 'tall' },
        'top-products':      { tier: 'tall' },
        'most-viewed':       { tier: 'tall' },
        'recent-customers':  { tier: 'tall' },
        'activity-log':      { tier: 'tall' },
    };

    const tierClass = (wId: WidgetId) => {
        const tier = WIDGET_SIZE[wId]?.tier || 'standard';
        if (tier === 'header') return 'wt-header';
        if (tier === 'full') return 'wt-full';
        if (tier === 'tall') return 'wt-tall';
        return 'wt-standard';
    };

    // Widget Wrapper
    const wrapWidget = (wId: WidgetId, node: React.ReactNode) => (
        <div
            key={wId}
            className={`dash-widget ${tierClass(wId)} ${draggedWidget === wId ? 'dash-widget-dragging' : ''} ${dragOverWidget === wId ? 'dash-widget-drag-over' : ''}`}
            draggable
            onDragStart={e => handleDragStart(e, wId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={e => handleDragEnterWidget(e, wId)}
            onDragLeave={handleDragLeaveWidget}
            onDrop={e => handleDrop(e, wId)}
        >
            <div className="dash-widget-grip" title="Чирж зөөх"><GripVertical size={14} /></div>
            {node}
        </div>
    );

    // Build final order
    const finalOrder = [...widgetOrder];
    if (isNewBusiness && !finalOrder.includes('getting-started')) {
        finalOrder.splice(Math.min(3, finalOrder.length), 0, 'getting-started');
    }

    // Payment methods readable names
    const payMethodNames: Record<string, string> = {
        cash: 'Бэлэн', qpay: 'QPay', bank: 'Банк', card: 'Карт',
        socialPay: 'SocialPay', unknown: 'Бусад', transfer: 'Шилжүүлэг',
        storepay: 'StorePay', monpay: 'MonPay',
    };

    // ═══════════════════════════════════════
    // Render widgets
    // ═══════════════════════════════════════
    const renderWidget = (wId: WidgetId): React.ReactNode | null => {
        switch (wId) {
            case 'kpi':
                return <KPICards stats={stats} category={business?.category} visibleModuleIds={visibleModuleIds} />;

            case 'analytics-grid':
                if (!hasModule('orders')) return null;
                return (
                    <div className="analytics-mini-grid">
                        <MiniStat icon={DollarSign} label="Д/Д захиалгын дүн" value={fmtNum(analytics.avgOrderValue, '₮')} color="#059669" sub="7 хоногийн" />
                        <MiniStat icon={ShoppingBag} label="Өнөөдрийн захиалга" value={String(analytics.todayOrderCount)} color="#6366f1" sub={`₮${fmtNum(analytics.todayRevenue)}`} />
                        <MiniStat icon={BarChart3} label="7 хоногийн орлого" value={fmtNum(analytics.weekRevenue, '₮')} color="#0891b2"
                            trend={analytics.revenueGrowthPct > 0 ? 'up' : analytics.revenueGrowthPct < 0 ? 'down' : null}
                            sub={`${analytics.revenueGrowthPct >= 0 ? '+' : ''}${analytics.revenueGrowthPct}% өмнөх 7 хоногоос`} />
                        <MiniStat icon={Hash} label="Сарын захиалга" value={String(analytics.monthOrderCount)} color="#8b5cf6" sub={fmtNum(analytics.monthRevenue, '₮')} />
                        <MiniStat icon={Percent} label="Цуцлалт/Буцаалт" value={`${analytics.cancelRate}%`} color={analytics.cancelRate > 10 ? '#ef4444' : '#10b981'}
                            sub={`${analytics.cancelledCount} цуцалсан · ${analytics.returnedCount} буцаалт`} />
                        <MiniStat icon={PackageX} label="Нөөц дууссан" value={String(analytics.outOfStockCount)} color={analytics.outOfStockCount > 0 ? '#ef4444' : '#10b981'}
                            sub={`${analytics.activeProductCount} идэвхтэй бараа`} />
                        {hasModule('customers') && (
                            <MiniStat icon={UserPlus} label="Шинэ харилцагч (7 хоног)" value={String(analytics.newCustomers7d)} color="#f59e0b" />
                        )}
                        {hasModule('customers') && (
                            <MiniStat icon={Repeat} label="Давтан худалдан авагч" value={String(analytics.repeatCustomers)} color="#ec4899" sub="2+ захиалга" />
                        )}
                    </div>
                );

            case 'status-bar':
                if (!hasModule('orders') || (pendingOrders === 0 && preparingOrders === 0 && shippingOrders === 0)) return null;
                return (
                    <div className="dash-status-bar">
                        {pendingOrders > 0 && <a href="/app/orders" className="dash-status-chip chip-pending"><Clock size={14} /><span>{pendingOrders} хүлээгдэж буй</span></a>}
                        {preparingOrders > 0 && <a href="/app/orders" className="dash-status-chip chip-preparing"><Package size={14} /><span>{preparingOrders} бэлтгэж буй</span></a>}
                        {shippingOrders > 0 && <a href="/app/orders" className="dash-status-chip chip-shipping"><TruckIcon size={14} /><span>{shippingOrders} хүргэлтэнд</span></a>}
                    </div>
                );

            case 'chart':
                if (!hasModule('orders')) return null;
                return <OrderChart />;

            case 'status-donut':
                if (!hasModule('orders')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><PieChart size={18} style={{ color: '#6366f1', marginRight: 8 }} /> Захиалгын статус задаргаа</h3>
                        </div>
                        <DonutChart
                            data={[
                                { label: 'Шинэ', value: ordersByStatus['new'] || 0 },
                                { label: 'Баталсан', value: ordersByStatus['confirmed'] || 0 },
                                { label: 'Бэлтгэж буй', value: (ordersByStatus['preparing'] || 0) + (ordersByStatus['ready'] || 0) },
                                { label: 'Хүргэлтэнд', value: ordersByStatus['shipping'] || 0 },
                                { label: 'Хүргэгдсэн', value: (ordersByStatus['delivered'] || 0) + (ordersByStatus['completed'] || 0) },
                                { label: 'Төлөгдсөн', value: ordersByStatus['paid'] || 0 },
                            ]}
                            colors={['#f59e0b', '#6366f1', '#8b5cf6', '#0891b2', '#10b981', '#059669']}
                        />
                    </div>
                );

            case 'payment-breakdown':
                if (!hasModule('orders')) return null;
                const payData = Object.entries(analytics.paymentMethods)
                    .map(([k, v]) => ({ label: payMethodNames[k] || k, value: v }))
                    .sort((a, b) => b.value - a.value);
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><Banknote size={18} style={{ color: '#059669', marginRight: 8 }} /> Төлбөрийн арга</h3>
                        </div>
                        <HBarChart data={payData} colors={['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']} />
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                            <div className="pay-stat-mini"><CheckCircle2 size={12} style={{ color: '#10b981' }} /> <strong>{analytics.paidCount}</strong> төлөгдсөн</div>
                            <div className="pay-stat-mini"><Clock size={12} style={{ color: '#f59e0b' }} /> <strong>{analytics.unpaidCount}</strong> төлөгдөөгүй</div>
                            {analytics.partialCount > 0 && <div className="pay-stat-mini"><RefreshCw size={12} style={{ color: '#8b5cf6' }} /> <strong>{analytics.partialCount}</strong> хэсэгчилсэн</div>}
                        </div>
                    </div>
                );

            case 'customer-insights':
                if (!hasModule('customers')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><Users size={18} style={{ color: '#ec4899', marginRight: 8 }} /> Харилцагчийн Инсайт</h3>
                        </div>
                        <div className="insight-grid">
                            <div className="insight-card">
                                <div className="insight-value">{stats.totalCustomers || 0}</div>
                                <div className="insight-label">Нийт</div>
                            </div>
                            <div className="insight-card">
                                <div className="insight-value" style={{ color: '#10b981' }}>+{analytics.newCustomers7d}</div>
                                <div className="insight-label">Шинэ (7хон)</div>
                            </div>
                            <div className="insight-card">
                                <div className="insight-value" style={{ color: '#8b5cf6' }}>{analytics.repeatCustomers}</div>
                                <div className="insight-label">Давтаж авсан</div>
                            </div>
                            <div className="insight-card">
                                <div className="insight-value" style={{ color: '#ec4899' }}>
                                    {stats.totalCustomers > 0 ? Math.round((analytics.repeatCustomers / stats.totalCustomers) * 100) : 0}%
                                </div>
                                <div className="insight-label">Давтамж</div>
                            </div>
                        </div>
                    </div>
                );

            case 'getting-started':
                if (!isNewBusiness) return null;
                return (
                    <div className="getting-started-card">
                        <h3>🚀 Эхлэх гарын авлага</h3>
                        <p className="text-muted">Бизнесээ бүрэн тохируулахын тулд дараах алхмуудыг хийнэ үү:</p>
                        <div className="checklist-items">
                            <div className="checklist-item done"><CheckCircle2 size={18} color="#0be881" /><span>Бизнес үүсгэсэн</span></div>
                            {business?.category === 'cargo' ? (
                                <><a href="/app/packages" className="checklist-item"><TruckIcon size={18} /><span>Анхны багц ачих</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                <a href="/app/packages" className="checklist-item"><ScanLine size={18} /><span>Ачаа сканнердаж бүртгэх</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a></>
                            ) : (
                                <><a href="/app/products" className="checklist-item"><Package size={18} /><span>Эхний бараа нэмэх</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                <a href="/app/orders" className="checklist-item"><ShoppingCart size={18} /><span>Эхний захиалга авах</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a></>
                            )}
                        </div>
                    </div>
                );

            case 'recent-orders':
                if (!hasModule('orders')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><ShoppingCart size={18} className="text-primary inline-mr" /> Сүүлийн захиалгууд</h3>
                            <a href="/app/orders" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dashboard-orders-list">
                            {recentOrders.length === 0 ? (
                                <div className="empty-state-compact premium-empty"><ShoppingCart size={24} className="text-muted mb-2" /><p className="text-muted">Захиалга байхгүй</p></div>
                            ) : recentOrders.map((order, i) => (
                                <div key={order.id} className="dashboard-order-item card card-clickable animate-fade-in premium-hover" style={{ '--index': i } as React.CSSProperties}>
                                    <div className="dashboard-order-left">
                                        <span className="dashboard-order-number">#{order.orderNumber}</span>
                                        <span className="dashboard-order-customer font-semibold">{order.customer?.name}</span>
                                    </div>
                                    <div className="dashboard-order-right">
                                        <span className="dashboard-order-amount font-bold">{fmt(order.financials?.totalAmount)}</span>
                                        <span className={`badge ${statusLabels[order.status]?.class || ''}`}>{statusLabels[order.status]?.label || order.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'low-stock':
                if (!hasModule('products') && !hasModule('inventory')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><AlertTriangle size={18} style={{ color: 'var(--accent-orange)', marginRight: 8 }} /> Нөөц дуусаж буй</h3>
                            <a href="/app/inventory" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {lowStockProducts.length === 0 ? (
                                <div className="empty-state-compact"><CheckCircle2 size={24} style={{ color: 'var(--accent-green)', marginBottom: 8 }} /><p className="text-muted">Бүх нөөц хангалттай 👍</p></div>
                            ) : lowStockProducts.map(p => (
                                <div key={p.id} className="dash-list-item">
                                    <div className="dash-list-left"><span className="dash-list-name">{p.name}</span></div>
                                    <div className="dash-list-right">
                                        <span className={`dash-stock-badge ${p.stock === 0 ? 'stock-out' : 'stock-low'}`}>{p.stock === 0 ? 'Дууссан' : `${p.stock} ширхэг`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'top-products':
                if (!hasModule('orders')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><TrendingUp size={18} style={{ color: 'var(--accent-green)', marginRight: 8 }} /> Шилдэг бүтээгдэхүүн</h3>
                        </div>
                        <div className="dash-list">
                            {topProducts.length === 0 ? (
                                <div className="empty-state-compact"><Package size={24} className="text-muted mb-2" /><p className="text-muted">Мэдээлэл байхгүй</p></div>
                            ) : topProducts.map((p, i) => (
                                <div key={p.id} className="dash-list-item">
                                    <div className="dash-list-left"><span className="dash-rank">#{i + 1}</span><span className="dash-list-name">{p.name}</span></div>
                                    <div className="dash-list-right"><span className="dash-list-meta">{p.soldCount}ш</span><span className="dash-list-amount">{fmt(p.revenue)}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'most-viewed':
                if (!hasModule('products') && !hasModule('inventory')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><Eye size={18} style={{ color: '#8b5cf6', marginRight: 8 }} /> Хамгийн их үзэлттэй</h3>
                            <a href="/app/products" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {mostViewedProducts.length === 0 ? (
                                <div className="empty-state-compact"><Eye size={24} className="text-muted mb-2" /><p className="text-muted">Үзэлтийн мэдээлэл хуримтлагдаагүй байна</p></div>
                            ) : mostViewedProducts.map((p, i) => (
                                <div key={p.id} className="dash-list-item">
                                    <div className="dash-list-left">
                                        <span className="dash-rank">#{i + 1}</span>
                                        {p.image && <img src={p.image} alt="" className="dash-list-thumb" />}
                                        <span className="dash-list-name">{p.name}</span>
                                    </div>
                                    <div className="dash-list-right">
                                        <span className="dash-view-count"><Eye size={12} /> {fmtNum(p.viewCount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'recent-customers':
                if (!hasModule('customers')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><Users size={18} style={{ color: 'var(--secondary)', marginRight: 8 }} /> Сүүлийн харилцагчид</h3>
                            <a href="/app/customers" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {recentCustomers.length === 0 ? (
                                <div className="empty-state-compact"><Users size={24} className="text-muted mb-2" /><p className="text-muted">Харилцагч байхгүй</p></div>
                            ) : recentCustomers.map(c => (
                                <div key={c.id} className="dash-list-item">
                                    <div className="dash-list-left">
                                        <div className="dash-customer-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                        <div><span className="dash-list-name">{c.name}</span>{c.phone && <span className="dash-list-sub">{c.phone}</span>}</div>
                                    </div>
                                    {(c.totalOrders ?? 0) > 0 && <span className="dash-list-meta">{c.totalOrders} захиалга</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'unpaid-cart':
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><ShoppingBag size={18} style={{ color: '#f59e0b', marginRight: 8 }} /> Сагсанд байгаа ({cartItems.length})</h3>
                        </div>
                        <div className="dash-list">
                            {cartItems.length === 0 ? (
                                <div className="empty-state-compact"><ShoppingBag size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} /><p className="text-muted">Сагсанд бараа байхгүй</p></div>
                            ) : [...cartItems].sort((a, b) => b.quantity - a.quantity).map(item => (
                                <div key={item.id} className="dash-list-item">
                                    <div className="dash-list-left">
                                        {item.product?.images?.[0] ? (
                                            <img src={item.product.images[0]} alt={item.product.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                        ) : (
                                            <ShoppingCart size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                                        )}
                                        <div>
                                            <span className="dash-list-name">{item.product?.name || 'Нэргүй'}</span>
                                            <span className="dash-list-sub">x{item.quantity}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="dash-list-amount" style={{ color: '#f59e0b' }}>{fmt(item.price * item.quantity)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'unpaid-invoices':
                if (!hasModule('finance')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><CreditCard size={18} style={{ color: 'var(--accent-orange)', marginRight: 8 }} /> Төлөгдөөгүй нэхэмжлэл</h3>
                            <a href="/app/finance" className="text-primary text-sm hover-underline">Бүгд →</a>
                        </div>
                        <div className="dash-list">
                            {unpaidInvoices.length === 0 ? (
                                <div className="empty-state-compact"><CheckCircle2 size={24} style={{ color: 'var(--accent-green)', marginBottom: 8 }} /><p className="text-muted">Тойрч гарах зүйлгүй 👍</p></div>
                            ) : unpaidInvoices.map(inv => (
                                <div key={inv.id} className="dash-list-item">
                                    <div className="dash-list-left">
                                        <FileText size={16} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
                                        <div><span className="dash-list-name">{inv.customerName || inv.invoiceNumber || 'Нэхэмжлэл'}</span>
                                        {inv.dueDate && <span className="dash-list-sub">Хугацаа: {inv.dueDate.toLocaleDateString('mn-MN')}</span>}</div>
                                    </div>
                                    <span className="dash-list-amount" style={{ color: 'var(--accent-orange)' }}>{fmt(inv.totalAmount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'online-employees':
                if (!hasModule('online-presence')) return null;
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3><Radio size={16} style={{ marginRight: 6 }} />Онлайн ажилтнууд <span style={{ fontSize: '0.8rem', color: onlineEmployees.length > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 700, marginLeft: 4 }}>{onlineEmployees.length} онлайн</span></h3>
                            <a href="/app/online-presence" className="text-primary text-sm">Бүгд →</a>
                        </div>
                        {onlineEmployees.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px' }}>
                                {onlineEmployees.map(emp => (
                                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', fontSize: '0.85rem' }}>
                                        <Wifi size={14} style={{ color: '#10b981' }} />
                                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                                        {emp.position && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>· {emp.position}</span>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                <Wifi size={20} style={{ opacity: 0.2, marginBottom: 6, display: 'inline-block' }} /><br />Одоогоор онлайн ажилтан байхгүй
                            </div>
                        )}
                    </div>
                );

            case 'activity-log':
                return (
                    <div className="dashboard-section glass-section">
                        <div className="dashboard-section-header">
                            <h3>Сүүлийн үйлдлүүд</h3>
                            <a href="/app/settings?tab=activity" className="text-primary text-sm">Бүгд →</a>
                        </div>
                        <div className="activity-stream" style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {recentLogs.length === 0 ? (
                                <div className="empty-state-compact"><p className="text-muted">Үйлдэл байхгүй</p></div>
                            ) : recentLogs.map((log, i) => {
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
                                            <div className="activity-text"><strong>{log.userName}</strong> {log.action}{' '}<span className="font-medium text-primary">{log.targetLabel}</span></div>
                                            <div className="activity-time">{timeStr} &middot; {log.module}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    // ═══ Render all widgets flat into CSS Grid ═══
    const renderedWidgets = finalOrder
        .map(wId => {
            const node = renderWidget(wId);
            if (!node) return null;
            return wrapWidget(wId, node);
        })
        .filter(Boolean);



    return (
        <div className="page-container animate-fade-in" style={{ padding: '0 0 32px' }}>
            {/* ═══ MOBILE HERO — Full-Screen App-Style Metrics ═══ */}
            <div className="dash-mobile-hero">
                {/* Background decorations */}
                <div className="dash-mobile-hero-bg" />

                {/* Greeting bar + hamburger + status — hides on swipe up */}
                <div className="dash-mobile-hero-header">
                    <div className="dash-mobile-hero-greeting">
                        <button className="dash-hero-menu-btn" onClick={() => useUIStore.getState().toggleSidebar()} aria-label="Цэс нээх">
                            <Menu size={22} />
                        </button>
                        <div>
                            <div className="dash-mobile-hero-biz"><Sparkles size={10} /> {business?.name}</div>
                            <div className="dash-mobile-hero-hello">Сайн байна уу, {displayName}! 👋</div>
                        </div>
                        <div className="dash-mobile-hero-time">
                            {new Date().toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Quick status chips — also hide on swipe */}
                    {(pendingOrders > 0 || preparingOrders > 0 || shippingOrders > 0) && (
                        <div className="dash-mobile-status-row">
                            {pendingOrders > 0 && <a href="/app/orders" className="dash-mobile-chip chip-pend"><Clock size={12} /> {pendingOrders} хүлээгдэж буй</a>}
                            {preparingOrders > 0 && <a href="/app/orders" className="dash-mobile-chip chip-prep"><Package size={12} /> {preparingOrders} бэлтгэж буй</a>}
                            {shippingOrders > 0 && <a href="/app/orders" className="dash-mobile-chip chip-ship"><TruckIcon size={12} /> {shippingOrders} хүргэлтэнд</a>}
                        </div>
                    )}
                </div>

                {/* Metrics body — snaps to fill screen */}
                <div className="dash-mobile-hero-body">
                    {/* 3 KEY METRICS */}
                    <div className="dash-mobile-metrics">
                        {/* 1. Live Visitors — Red/Orange vibrant */}
                        <div className="dash-metric-card dash-metric-visitors">
                            <div className="dash-metric-glow" />
                            <div className="dash-metric-icon-wrap">
                                <Eye size={22} />
                                <span className="dash-metric-live-dot" />
                            </div>
                            <div className="dash-metric-value">{visitorCount}</div>
                            <div className="dash-metric-label">Зочин</div>
                            <div className="dash-metric-sub">
                                <Radio size={10} className="dash-metric-pulse-icon" /> LIVE
                            </div>
                        </div>

                        {/* 2. Today Revenue — Deep Blue/Cyan */}
                        <div className="dash-metric-card dash-metric-revenue">
                            <div className="dash-metric-glow" />
                            <div className="dash-metric-icon-wrap">
                                <Banknote size={22} />
                            </div>
                            <div className="dash-metric-value">
                                {todayRevenue > 999999
                                    ? `${(todayRevenue / 1000000).toFixed(1)}M`
                                    : todayRevenue > 999
                                        ? `${Math.round(todayRevenue / 1000)}K`
                                        : todayRevenue.toLocaleString()}
                            </div>
                            <div className="dash-metric-label">Өнөөдрийн орлого</div>
                            <div className="dash-metric-sub">₮ баталгаажсан</div>
                        </div>

                        {/* 3. Today Orders — Amber/Yellow */}
                        <div className="dash-metric-card dash-metric-orders">
                            <div className="dash-metric-glow" />
                            <div className="dash-metric-icon-wrap">
                                <ShoppingBag size={22} />
                            </div>
                            <div className="dash-metric-value">{todayConfirmedOrders}</div>
                            <div className="dash-metric-label">Захиалга</div>
                            <div className="dash-metric-sub">өнөөдөр баталгаажсан</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Widgets below ═══ */}
            <div className="dash-widgets-container" style={{ padding: '0 clamp(12px, 3vw, 32px)' }}>
                {renderedWidgets}
            </div>
        </div>
    );
}
