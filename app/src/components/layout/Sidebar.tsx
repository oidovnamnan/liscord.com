import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    BarChart3,
    Settings,
    MessageSquare,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Truck,
    Warehouse,
    UserCog,
    X,
    ChevronDown,
    Plus,
    ScanLine,
} from 'lucide-react';
import { useUIStore, useBusinessStore, useAuthStore } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import { businessService } from '../../services/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import './Sidebar.css';

const navItems = [
    { id: 'dashboard', label: 'Хянах самбар', icon: LayoutDashboard, path: '/app', permission: 'reports.view_dashboard' },
    { id: 'orders', label: 'Захиалга', icon: ShoppingCart, path: '/app/orders', permission: 'orders.view_all' },
    { id: 'customers', label: 'Харилцагч', icon: Users, path: '/app/customers', permission: 'customers.view' },
    { id: 'products', label: 'Бараа', icon: Package, path: '/app/products', permission: 'products.view' },
    { id: 'delivery', label: 'Хүргэлт', icon: Truck, path: '/app/delivery' },
    { id: 'packages', label: 'Ачаа (AI)', icon: ScanLine, path: '/app/packages' },
    { id: 'inventory', label: 'Нөөц', icon: Warehouse, permission: 'products.manage_stock', path: '/app/inventory' },
    { id: 'payments', label: 'Төлбөр', icon: Receipt, path: '/app/payments', permission: 'orders.manage_payments' },
    { id: 'reports', label: 'Тайлан', icon: BarChart3, path: '/app/reports', permission: 'reports.view_sales' },
    { id: 'chat', label: 'Чат', icon: MessageSquare, path: '/app/chat' },
    { id: 'employees', label: 'Ажилтан', icon: UserCog, path: '/app/employees', permission: 'team.view' },
    { id: 'settings', label: 'Тохиргоо', icon: Settings, path: '/app/settings', permission: 'settings.view' },
];

export function Sidebar() {
    const location = useLocation();
    const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore();
    const { business, setBusiness, setEmployee } = useBusinessStore();
    const { user } = useAuthStore();
    const { hasPermission } = usePermissions();
    const [switching, setSwitching] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    const [userBusinesses, setUserBusinesses] = useState<any[]>([]);

    useEffect(() => {
        if (user?.businessIds?.length && showSwitcher) {
            loadBusinesses();
        }
    }, [user?.businessIds, showSwitcher]);

    const loadBusinesses = async () => {
        if (!user) return;
        const bizs = await Promise.all(
            user.businessIds.map((id: string) => businessService.getBusiness(id))
        );
        setUserBusinesses(bizs.filter(Boolean));
    };

    const handleSwitch = async (bizId: string) => {
        if (!user || bizId === business?.id) return;
        setSwitching(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { activeBusiness: bizId });
            const [biz, emp] = await Promise.all([
                businessService.getBusiness(bizId),
                businessService.getEmployeeProfile(bizId, user.uid)
            ]);
            setBusiness(biz);
            setEmployee(emp);
            setShowSwitcher(false);
            toast.success(`${biz?.name} руу шилжлээ`);
        } catch (error) {
            toast.error('Шилжихэд алдаа гарлаа');
        } finally {
            setSwitching(false);
        }
    };

    const handleAddNew = async () => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), { activeBusiness: null });
        window.location.reload(); // App.tsx will show BusinessWizard
    };

    const filteredNavItems = navItems.filter(item => !item.permission || hasPermission(item.permission));


    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Header / Mobile Close Button */}
                <div className="sidebar-header" style={{ paddingBottom: 0 }}>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn-icon sidebar-close hide-desktop" onClick={toggleSidebar}>
                        <X size={20} />
                    </button>
                </div>

                {/* Business Info */}
                {business && !sidebarCollapsed && (
                    <div className="sidebar-business-container">
                        <div className="sidebar-business" onClick={() => setShowSwitcher(!showSwitcher)}>
                            <div className="sidebar-business-avatar">
                                {business.name.charAt(0)}
                            </div>
                            <div className="sidebar-business-info">
                                <div className="sidebar-business-name">{business.name}</div>
                                <div className="sidebar-business-plan badge badge-primary">
                                    {business.subscription.plan.toUpperCase()}
                                </div>
                            </div>
                            <ChevronDown size={16} className={`switcher-arrow ${showSwitcher ? 'open' : ''}`} />
                        </div>

                        {showSwitcher && (
                            <div className="business-switcher-dropdown">
                                <div className="switcher-label">Миний бизнесүүд</div>
                                {userBusinesses.map(biz => (
                                    <button
                                        key={biz.id}
                                        className={`switcher-item ${biz.id === business.id ? 'active' : ''}`}
                                        onClick={() => handleSwitch(biz.id)}
                                        disabled={switching}
                                    >
                                        <div className="switcher-item-icon">{biz.name.charAt(0)}</div>
                                        <div className="switcher-item-name">{biz.name}</div>
                                        {biz.id === business.id && <div className="switcher-active-dot" />}
                                    </button>
                                ))}
                                <button className="switcher-item add-new" onClick={handleAddNew}>
                                    <div className="switcher-item-icon"><Plus size={14} /></div>
                                    <div className="switcher-item-name">Шинэ бизнес нэмэх</div>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/app'
                            ? location.pathname === '/app'
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => sidebarOpen && toggleSidebar()}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <Icon size={20} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                                {isActive && <div className="sidebar-link-indicator" />}
                            </NavLink>
                        );
                    })}

                    {user?.isSuperAdmin && (
                        <NavLink
                            to="/super"
                            className={`sidebar-link platform-admin-link ${location.pathname.startsWith('/super') ? 'active' : ''}`}
                            onClick={() => sidebarOpen && toggleSidebar()}
                            title={sidebarCollapsed ? 'Платформ Админ' : undefined}
                        >
                            <UserCog size={20} color="var(--primary-color)" />
                            {!sidebarCollapsed && <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Платформ Админ</span>}
                            {location.pathname.startsWith('/super') && <div className="sidebar-link-indicator" />}
                        </NavLink>
                    )}
                </nav>

                {/* Collapse toggle (desktop only) */}
                <button
                    className="sidebar-collapse-btn hide-mobile"
                    onClick={toggleSidebarCollapsed}
                >
                    {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </aside>
        </>
    );
}
