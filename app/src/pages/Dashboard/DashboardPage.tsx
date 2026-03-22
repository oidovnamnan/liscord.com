import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    ShoppingCart, Package, Loader2, ArrowRight, CheckCircle2, ScanLine,
    Truck as TruckIcon, AlertTriangle, Users, FileText, TrendingDown,
    Clock, CreditCard, Radio, Wifi, Activity, Eye, Sparkles, LayoutDashboard,
    GripVertical
} from 'lucide-react';
import { useBusinessStore, useAuthStore, useModuleDefaultsStore } from '../../store';
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
// Widget Definition
// ═══════════════════════════════════════
type WidgetId = 'kpi' | 'chart' | 'status-bar' | 'recent-orders' | 'low-stock' | 'top-products' | 'recent-customers' | 'unpaid-invoices' | 'online-employees' | 'activity-log' | 'getting-started';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
    'kpi', 'status-bar', 'chart', 'recent-orders', 'low-stock',
    'top-products', 'recent-customers', 'unpaid-invoices',
    'online-employees', 'activity-log'
];

const WIDGET_LABELS: Record<WidgetId, string> = {
    'kpi': 'KPI Stat Cards',
    'chart': 'Захиалгын график',
    'status-bar': 'Захиалгын статус',
    'recent-orders': 'Сүүлийн захиалгууд',
    'low-stock': 'Нөөц дуусаж буй',
    'top-products': 'Шилдэг бүтээгдэхүүн',
    'recent-customers': 'Сүүлийн харилцагчид',
    'unpaid-invoices': 'Төлөгдөөгүй нэхэмжлэл',
    'online-employees': 'Онлайн ажилтнууд',
    'activity-log': 'Сүүлийн үйлдлүүд',
    'getting-started': 'Эхлэх гарын авлага',
};

export function DashboardPage() {
    const { business, employee, isImpersonating } = useBusinessStore();
    const { user } = useAuthStore();
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
    const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
    const [onlineEmployees, setOnlineEmployees] = useState<{ id: string; name: string; position?: string }[]>([]);
    const [visitorCount, setVisitorCount] = useState(0);
    const { defaults: moduleDefaults, fetchDefaults } = useModuleDefaultsStore();

    // ═══ Widget Order State ═══
    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);
    const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
    const [dragOverWidget, setDragOverWidget] = useState<WidgetId | null>(null);
    const dragCounter = useRef(0);

    useEffect(() => { fetchDefaults(); }, [fetchDefaults]);

    // ═══ Load saved widget order from Firestore ═══
    useEffect(() => {
        if (!business?.id || !user?.uid) return;
        const docRef = doc(db, 'businesses', business.id, 'dashboardLayout', user.uid);
        getDoc(docRef).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                if (data?.widgetOrder?.length) {
                    // Merge: keep saved order + append any missing widgets
                    const saved = data.widgetOrder as WidgetId[];
                    const merged = [...saved];
                    for (const w of DEFAULT_WIDGET_ORDER) {
                        if (!merged.includes(w)) merged.push(w);
                    }
                    setWidgetOrder(merged);
                }
            }
        }).catch(() => {});
    }, [business?.id, user?.uid]);

    // ═══ Save widget order ═══
    const saveWidgetOrder = useCallback((order: WidgetId[]) => {
        if (!business?.id || !user?.uid) return;
        const docRef = doc(db, 'businesses', business.id, 'dashboardLayout', user.uid);
        setDoc(docRef, { widgetOrder: order, updatedAt: new Date() }, { merge: true }).catch(() => {});
    }, [business?.id, user?.uid]);

    // ═══ Drag & Drop handlers ═══
    const handleDragStart = useCallback((e: React.DragEvent, widgetId: WidgetId) => {
        setDraggedWidget(widgetId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', widgetId);
        // Make the drag image slightly transparent
        const el = e.currentTarget as HTMLElement;
        setTimeout(() => el.classList.add('dash-widget-dragging'), 0);
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        setDraggedWidget(null);
        setDragOverWidget(null);
        dragCounter.current = 0;
        (e.currentTarget as HTMLElement).classList.remove('dash-widget-dragging');
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, widgetId: WidgetId) => {
        e.preventDefault();
        dragCounter.current++;
        setDragOverWidget(widgetId);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setDragOverWidget(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetId: WidgetId) => {
        e.preventDefault();
        setDragOverWidget(null);
        dragCounter.current = 0;
        const sourceId = e.dataTransfer.getData('text/plain') as WidgetId;
        if (!sourceId || sourceId === targetId) return;

        setWidgetOrder(prev => {
            const newOrder = [...prev];
            const sourceIdx = newOrder.indexOf(sourceId);
            const targetIdx = newOrder.indexOf(targetId);
            if (sourceIdx < 0 || targetIdx < 0) return prev;
            newOrder.splice(sourceIdx, 1);
            newOrder.splice(targetIdx, 0, sourceId);
            saveWidgetOrder(newOrder);
            return newOrder;
        });
    }, [saveWidgetOrder]);

    // Permission-based module visibility
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

    // ═══ Data loading (unchanged logic) ═══
    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);

        async function loadDashboard() {
            if (!business?.id) return;
            try {
                const statsData = await dashboardService.getDashboardStats(business.id);
                setStats(statsData || { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0 });
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
                        if (o.paymentStatus === 'unpaid' || o.orderType === 'membership') return;
                        if (o.status === 'cancelled') return;
                        const status = o.status || 'new';
                        statusMap[status] = (statusMap[status] || 0) + 1;
                        if (o.items) {
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

                if (visibleModuleIds.has('customers')) {
                    try {
                        const custSnap = await getDocs(query(
                            collection(db, 'businesses', bizId, 'customers'),
                            orderBy('createdAt', 'desc'), limit(5)
                        ));
                        setRecentCustomers(custSnap.docs.map(d => {
                            const c = d.data();
                            return { id: d.id, name: c.name || 'Нэргүй', phone: c.phone, totalOrders: c.totalOrders || 0, createdAt: c.createdAt?.toDate?.() || new Date() };
                        }));
                    } catch { setRecentCustomers([]); }
                }

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
            } catch (error) {
                console.error('Extended data load error:', error);
            }
        }

        loadDashboard();
        loadExtendedData();

        let unsubscribeOrders: (() => void) | undefined;
        if (visibleModuleIds.has('orders')) {
            unsubscribeOrders = dashboardService.subscribeRecentOrders(business.id!, (orders) => setRecentOrders(orders));
        }

        const unsubscribeLogs = auditService.subscribeAuditLogs(business.id!, 10, (logs) => setRecentLogs(logs));

        let unsubscribeOnline: (() => void) | undefined;
        if (visibleModuleIds.has('online-presence')) {
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000));
            const onlineQ = query(collection(db, 'businesses', business.id!, 'employees'), where('lastActiveAt', '>=', twoMinAgo));
            unsubscribeOnline = onSnapshot(onlineQ, (snap) => {
                setOnlineEmployees(snap.docs.map(d => {
                    const data = d.data();
                    return { id: d.id, name: data.name || 'Нэргүй', position: data.positionName || '' };
                }));
            }, () => setOnlineEmployees([]));
        }

        let unsubscribeVisitors: (() => void) | undefined;
        if (visibleModuleIds.has('online-presence')) {
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000));
            const visitorQ = query(collection(db, 'businesses', business.id!, 'visitors'), where('lastActiveAt', '>=', twoMinAgo));
            unsubscribeVisitors = onSnapshot(visitorQ, (snap) => setVisitorCount(snap.size), () => setVisitorCount(0));
        }

        return () => {
            unsubscribeOrders?.();
            unsubscribeLogs();
            unsubscribeOnline?.();
            unsubscribeVisitors?.();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, visibleModuleIds]);

    const todayRevenue = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return recentOrders
            .filter(o => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any)?.toDate?.();
                return d && d >= todayStart && o.paymentStatus === 'paid' && o.orderType !== 'membership';
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
    const pendingOrders = (ordersByStatus['new'] || 0) + (ordersByStatus['confirmed'] || 0);
    const preparingOrders = (ordersByStatus['preparing'] || 0) + (ordersByStatus['ready'] || 0);
    const shippingOrders = ordersByStatus['shipping'] || 0;
    const displayName = isImpersonating && employee ? employee.name : (user?.displayName || 'Эзэн');

    // ═══════════════════════════════════════
    // Widget Render Map
    // ═══════════════════════════════════════
    const renderWidget = (widgetId: WidgetId): React.ReactNode | null => {
        switch (widgetId) {
            case 'kpi':
                return <KPICards stats={stats} category={business?.category} visibleModuleIds={visibleModuleIds} />;

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

            case 'getting-started':
                if (!isNewBusiness) return null;
                return (
                    <div className="getting-started-card">
                        <h3>🚀 Эхлэх гарын авлага</h3>
                        <p className="text-muted">Бизнесээ бүрэн тохируулахын тулд дараах алхмуудыг хийнэ үү:</p>
                        <div className="checklist-items">
                            <div className="checklist-item done"><CheckCircle2 size={18} color="#0be881" /><span>Бизнес үүсгэсэн</span></div>
                            {business?.category === 'cargo' ? (
                                <>
                                    <a href="/app/packages" className="checklist-item"><TruckIcon size={18} /><span>Анхны багц ачих</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                    <a href="/app/packages" className="checklist-item"><ScanLine size={18} /><span>Ачаа сканнердаж бүртгэх</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                </>
                            ) : (
                                <>
                                    <a href="/app/products" className="checklist-item"><Package size={18} /><span>Эхний бараа нэмэх</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                    <a href="/app/orders" className="checklist-item"><ShoppingCart size={18} /><span>Эхний захиалга авах</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></a>
                                </>
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
                                <div className="empty-state-compact premium-empty">
                                    <ShoppingCart size={24} className="text-muted mb-2" />
                                    <p className="text-muted">Захиалга байхгүй</p>
                                </div>
                            ) : (
                                recentOrders.map((order, i) => (
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
                                ))
                            )}
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
                                <div className="empty-state-compact">
                                    <CheckCircle2 size={24} style={{ color: 'var(--accent-green)', marginBottom: 8 }} />
                                    <p className="text-muted">Бүх нөөц хангалттай 👍</p>
                                </div>
                            ) : (
                                lowStockProducts.map(p => (
                                    <div key={p.id} className="dash-list-item">
                                        <div className="dash-list-left"><span className="dash-list-name">{p.name}</span></div>
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
                );

            case 'top-products':
                if (!hasModule('orders')) return null;
                return (
                    <div className="dashboard-section glass-section">
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
                                <div className="empty-state-compact">
                                    <Users size={24} className="text-muted mb-2" />
                                    <p className="text-muted">Харилцагч байхгүй</p>
                                </div>
                            ) : (
                                recentCustomers.map(c => (
                                    <div key={c.id} className="dash-list-item">
                                        <div className="dash-list-left">
                                            <div className="dash-customer-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <span className="dash-list-name">{c.name}</span>
                                                {c.phone && <span className="dash-list-sub">{c.phone}</span>}
                                            </div>
                                        </div>
                                        {(c.totalOrders ?? 0) > 0 && <span className="dash-list-meta">{c.totalOrders} захиалга</span>}
                                    </div>
                                ))
                            )}
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
                                                {inv.dueDate && <span className="dash-list-sub">Хугацаа: {inv.dueDate.toLocaleDateString('mn-MN')}</span>}
                                            </div>
                                        </div>
                                        <span className="dash-list-amount" style={{ color: 'var(--accent-orange)' }}>{fmt(inv.totalAmount)}</span>
                                    </div>
                                ))
                            )}
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
                                                <div className="activity-text"><strong>{log.userName}</strong> {log.action}{' '}<span className="font-medium text-primary">{log.targetLabel}</span></div>
                                                <div className="activity-time">{timeStr} &middot; {log.module}</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ═══ Determine which widgets should be full-width vs half ═══
    const fullWidthWidgets: WidgetId[] = ['kpi', 'chart', 'status-bar', 'getting-started'];
    const isFullWidth = (id: WidgetId) => fullWidthWidgets.includes(id);

    // Build final ordered list including getting-started if needed
    const finalWidgetOrder = [...widgetOrder];
    if (isNewBusiness && !finalWidgetOrder.includes('getting-started')) {
        const chartIdx = finalWidgetOrder.indexOf('chart');
        finalWidgetOrder.splice(chartIdx >= 0 ? chartIdx + 1 : 2, 0, 'getting-started');
    }

    // Group widgets: full-width ones render alone, half-width ones pair up
    const renderedWidgets: React.ReactNode[] = [];
    const halfQueue: { id: WidgetId; node: React.ReactNode }[] = [];

    for (const wId of finalWidgetOrder) {
        const node = renderWidget(wId);
        if (!node) continue;

        if (isFullWidth(wId)) {
            // Flush any queued half-width first
            if (halfQueue.length > 0) {
                const items = halfQueue.splice(0);
                renderedWidgets.push(
                    <div className="dashboard-bottom-grid" key={`grid-${items.map(x => x.id).join('-')}`}>
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={`dash-widget ${draggedWidget === item.id ? 'dash-widget-dragging' : ''} ${dragOverWidget === item.id ? 'dash-widget-drag-over' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragEnd={handleDragEnd}
                                onDragEnter={(e) => handleDragEnter(e, item.id)}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, item.id)}
                            >
                                <div className="dash-widget-grip" title="Чирж зөөх"><GripVertical size={14} /></div>
                                {item.node}
                            </div>
                        ))}
                    </div>
                );
            }
            // Render full-width widget
            renderedWidgets.push(
                <div
                    key={wId}
                    className={`dash-widget dash-widget-full ${draggedWidget === wId ? 'dash-widget-dragging' : ''} ${dragOverWidget === wId ? 'dash-widget-drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, wId)}
                    onDragEnd={handleDragEnd}
                    onDragEnter={(e) => handleDragEnter(e, wId)}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, wId)}
                >
                    <div className="dash-widget-grip" title="Чирж зөөх"><GripVertical size={14} /></div>
                    {node}
                </div>
            );
        } else {
            halfQueue.push({ id: wId, node });
        }
    }

    // Flush remaining half-width
    if (halfQueue.length > 0) {
        renderedWidgets.push(
            <div className="dashboard-bottom-grid" key={`grid-final`}>
                {halfQueue.map(item => (
                    <div
                        key={item.id}
                        className={`dash-widget ${draggedWidget === item.id ? 'dash-widget-dragging' : ''} ${dragOverWidget === item.id ? 'dash-widget-drag-over' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        onDragEnter={(e) => handleDragEnter(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.id)}
                    >
                        <div className="dash-widget-grip" title="Чирж зөөх"><GripVertical size={14} /></div>
                        {item.node}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Gradient Hero (NOT draggable) ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 40%, #0891b2 100%)', boxShadow: '0 8px 32px rgba(5, 150, 105, 0.25)' }}>
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
                            <div className="sa-hero-stat-label">Өнөөдрийн орлого (баталгаажсан)</div>
                        </div>
                    )}
                    {hasModule('orders') && pendingOrders > 0 && (
                        <div className="sa-hero-stat">
                            <div className="sa-hero-stat-value">{pendingOrders}<span className="sa-hero-stat-growth down" style={{ background: 'rgba(251,191,36,0.3)', color: '#fde68a' }}>шинэ</span></div>
                            <div className="sa-hero-stat-label">Хүлээгдэж буй</div>
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

            {/* ── Draggable Widgets ── */}
            <div className="dash-widgets-container">
                {renderedWidgets}
            </div>
        </div>
    );
}
