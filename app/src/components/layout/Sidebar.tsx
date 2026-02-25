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
    Clock,
    DollarSign,
    Landmark,
    Layers,
    Calendar,
    PieChart,
    HeadphonesIcon,
    Building,
    Factory,
    Network
} from 'lucide-react';
import { useUIStore, useBusinessStore, useAuthStore } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { businessService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { getFeatures } from '../../config/features';
import type { BusinessFeatures } from '../../config/features';
import './Sidebar.css';

type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    permission?: string;
    feature?: string;
};

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Хянах самбар', icon: LayoutDashboard, path: '/app', permission: 'reports.view_dashboard' },
    { id: 'orders', label: 'Борлуулалт', icon: ShoppingCart, path: '/app/orders', permission: 'orders.view_all', feature: 'hasOrders' },
    { id: 'appointments', label: 'Цаг захиалга', icon: Calendar, path: '/app/appointments', feature: 'hasAppointments' },
    { id: 'projects', label: 'Төсөл / Ажил', icon: Warehouse, path: '/app/projects', feature: 'hasProjects' },
    { id: 'manufacturing', label: 'Үйлдвэрлэл', icon: Factory, path: '/app/manufacturing' },
    { id: 'contracts', label: 'Гэрээ / Зээл', icon: Receipt, path: '/app/contracts', feature: 'hasContracts' },
    { id: 'rooms', label: 'Өрөө / Талбай', icon: LayoutDashboard, path: '/app/rooms', feature: 'hasRooms' },
    { id: 'vehicles', label: 'Машин / Техник', icon: Truck, path: '/app/vehicles', feature: 'hasVehicles' },
    { id: 'tickets', label: 'Тасалбар', icon: ScanLine, path: '/app/tickets', feature: 'hasTickets' },
    { id: 'customers', label: 'Харилцагч', icon: Users, path: '/app/customers', permission: 'customers.view' },
    { id: 'b2b', label: 'B2B Маркет', icon: Building, path: '/app/b2b' },
    { id: 'b2b-provider', label: 'B2B Хүсэлтүүд', icon: Network, path: '/app/b2b-provider', feature: 'isB2BProvider' },
    { id: 'products', label: 'Бараа', icon: Package, path: '/app/products', permission: 'products.view', feature: 'hasProducts' },
    { id: 'delivery', label: 'Хүргэлт', icon: Truck, path: '/app/delivery', feature: 'hasDelivery' },
    { id: 'packages', label: 'Ачаа (AI)', icon: ScanLine, path: '/app/packages', feature: 'hasPackages' },
    { id: 'inventory', label: 'Нөөц', icon: Warehouse, permission: 'products.manage_stock', path: '/app/inventory', feature: 'hasInventory' },
    { id: 'loans', label: 'Ломбард / Зээл', icon: Landmark, path: '/app/loans' },
    { id: 'queue', label: 'Дараалал', icon: Layers, path: '/app/queue' },
    { id: 'attendance', label: 'Цаг бүртгэл', icon: Clock, path: '/app/attendance' },
    { id: 'payroll', label: 'Цалин', icon: DollarSign, path: '/app/payroll' },
    { id: 'finance', label: 'Санхүү', icon: PieChart, path: '/app/finance' },
    { id: 'payments', label: 'Төлбөр', icon: Receipt, path: '/app/payments', permission: 'orders.manage_payments' },
    { id: 'reports', label: 'Тайлан', icon: BarChart3, path: '/app/reports', permission: 'reports.view_sales' },
    { id: 'support', label: 'Гомдол / Буцаалт', icon: HeadphonesIcon, path: '/app/support' },
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

    const features = getFeatures(business?.category);

    const filteredNavItems = navItems.filter(item => {
        // First check permissions
        const hasPerm = !item.permission || hasPermission(item.permission);
        if (!hasPerm) return false;

        // The core items everyone should see (unless permission blocked)
        const ALWAYS_VISIBLE = ['dashboard', 'reports', 'settings', 'chat', 'employees'];

        // If the business has explicit activeModules set (The New App Store Way)
        if (business?.activeModules && business.activeModules.length > 0) {
            if (ALWAYS_VISIBLE.includes(item.id)) return true;
            return business.activeModules.includes(item.id);
        }

        // Fallback: Old hardcoded feature flags category logic (The Old Way)
        if (item.feature) {
            if (item.feature === 'isB2BProvider') return business?.serviceProfile?.isProvider === true;
            return features[item.feature as keyof BusinessFeatures];
        }

        // For new modules without 'feature' tags added yet when activeModules is empty
        if (['loans', 'queue', 'attendance', 'payroll'].includes(item.id)) {
            return false; // Hide by default until activated in App Store
        }

        return true;
    });


    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Header / Mobile Close Button (Only on mobile) */}
                <div className="hide-desktop" style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-primary)' }}>
                    <button className="btn-icon sidebar-close" onClick={toggleSidebar}>
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
