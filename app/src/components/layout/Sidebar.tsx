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
    { id: 'dashboard', label: 'Хянах самбар', icon: LayoutDashboard, path: '/app' },
    { id: 'orders', label: 'Борлуулалт', icon: ShoppingCart, path: '/app/orders', feature: 'hasOrders' },
    { id: 'appointments', label: 'Цаг захиалга', icon: Calendar, path: '/app/appointments', feature: 'hasAppointments' },
    { id: 'projects', label: 'Төсөл / Ажил', icon: Warehouse, path: '/app/projects', feature: 'hasProjects' },
    { id: 'manufacturing', label: 'Үйлдвэрлэл', icon: Factory, path: '/app/manufacturing' },
    { id: 'contracts', label: 'Гэрээ / Зээл', icon: Receipt, path: '/app/contracts', feature: 'hasContracts' },
    { id: 'rooms', label: 'Өрөө / Талбай', icon: LayoutDashboard, path: '/app/rooms', feature: 'hasRooms' },
    { id: 'vehicles', label: 'Машин / Техник', icon: Truck, path: '/app/vehicles', feature: 'hasVehicles' },
    { id: 'tickets', label: 'Тасалбар', icon: ScanLine, path: '/app/tickets', feature: 'hasTickets' },
    { id: 'customers', label: 'Харилцагч', icon: Users, path: '/app/customers' },
    { id: 'b2b', label: 'B2B Маркет', icon: Building, path: '/app/b2b' },
    { id: 'b2b-provider', label: 'B2B Хүсэлтүүд', icon: Network, path: '/app/b2b-provider', feature: 'isB2BProvider' },
    { id: 'products', label: 'Бараа', icon: Package, path: '/app/products', feature: 'hasProducts' },
    { id: 'delivery', label: 'Хүргэлт', icon: Truck, path: '/app/delivery', feature: 'hasDelivery' },
    { id: 'packages', label: 'Ачаа (AI)', icon: ScanLine, path: '/app/packages', feature: 'hasPackages' },
    { id: 'inventory', label: 'Нөөц', icon: Warehouse, path: '/app/inventory', feature: 'hasInventory' },
    { id: 'loans', label: 'Ломбард / Зээл', icon: Landmark, path: '/app/loans' },
    { id: 'queue', label: 'Дараалал', icon: Layers, path: '/app/queue' },
    { id: 'attendance', label: 'Цаг бүртгэл', icon: Clock, path: '/app/attendance' },
    { id: 'payroll', label: 'Цалин', icon: DollarSign, path: '/app/payroll' },
    { id: 'finance', label: 'Санхүү', icon: PieChart, path: '/app/finance' },
    { id: 'payments', label: 'Төлбөр', icon: Receipt, path: '/app/payments' },
    { id: 'reports', label: 'Тайлан', icon: BarChart3, path: '/app/reports' },
    { id: 'support', label: 'Гомдол / Буцаалт', icon: HeadphonesIcon, path: '/app/support' },
    { id: 'chat', label: 'Чат', icon: MessageSquare, path: '/app/chat' },
    { id: 'employees', label: 'Ажилтан', icon: UserCog, path: '/app/employees' },
    { id: 'settings', label: 'Тохиргоо', icon: Settings, path: '/app/settings' },
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
        // Settings is the ONLY core item always visible regardless of modules
        if (item.id === 'settings') return true;

        // For all other items, they MUST be explicitly in the activeModules array
        // If activeModules is undefined (legacy account not migrated yet), we might 
        // temporarily show a default set, or just rely on the migration script. 
        // Since we are forcing the App Store model, we will trust activeModules.
        if (business?.activeModules) {
            return business.activeModules.includes(item.id);
        }

        // --- LEGACY FALLBACK (Will be removed after DB is fully migrated) ---
        // If the business doesn't even have the activeModules field yet, 
        // fallback to old feature logic just to prevent a completely blank screen today.
        if (item.feature) {
            if (item.feature === 'isB2BProvider') return business?.serviceProfile?.isProvider === true;
            return features[item.feature as keyof BusinessFeatures];
        }

        // Show core legacy items if no activeModules array exists at all
        const LEGACY_VISIBLE = ['dashboard', 'reports', 'chat', 'employees', 'b2b'];
        if (LEGACY_VISIBLE.includes(item.id)) return true;

        return false;
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
