import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    ChevronLeft,
    ChevronRight,
    UserCog,
    X,
    ChevronDown,
    Plus,
} from 'lucide-react';
import { useUIStore, useBusinessStore, useAuthStore } from '../../store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { businessService } from '../../services/db';
import { toast } from 'react-hot-toast';
import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';
import './Sidebar.css';

export function Sidebar() {
    const location = useLocation();
    const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore();
    const { business, setBusiness, setEmployee } = useBusinessStore();
    const { user } = useAuthStore();
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

    const filteredNavItems = LISCORD_MODULES.filter((mod, index, self) => {
        // Core modules (like Dashboard, Reports, Settings) are always visible
        if (mod.isCore) {
            // If it has a hubId, only show the first one to avoid duplicates in sidebar
            if (mod.hubId) {
                return self.findIndex(m => m.hubId === mod.hubId) === index;
            }
            return true;
        }

        // Show only if enabled in business AND not expired
        const isEnabled = business?.activeModules?.includes(mod.id);
        if (!isEnabled) return false;

        const subscription = business?.moduleSubscriptions?.[mod.id];
        if (subscription) {
            const expiryDate = subscription.expiresAt ? (typeof (subscription.expiresAt as any).toDate === 'function' ? (subscription.expiresAt as any).toDate() : new Date(subscription.expiresAt as any)) : null;
            if (expiryDate && expiryDate < new Date()) return false;
        }

        // If it belongs to a hub, only show the FIRST enabled module of that hub in the sidebar
        if (mod.hubId) {
            return self.findIndex(m => m.hubId === mod.hubId && business?.activeModules?.includes(m.id)) === index;
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
                                {business.logo ? (
                                    <img src={business.logo} alt={business.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    business.name.charAt(0)
                                )}
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
                                        <div className="switcher-item-icon">
                                            {biz.logo ? (
                                                <img src={biz.logo} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                biz.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="sidebar-business-info">
                                            <div className="sidebar-business-name">{biz.name}</div>
                                            {biz.id === business.id && <div className="switcher-active-dot" />}
                                        </div>
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
                    {/* Dashboard Header Link */}
                    <NavLink
                        to="/app"
                        className={`sidebar-link ${location.pathname === '/app' ? 'active' : ''}`}
                        onClick={() => sidebarOpen && toggleSidebar()}
                        title={sidebarCollapsed ? 'Хянах самбар' : undefined}
                    >
                        <LayoutDashboard size={20} />
                        {!sidebarCollapsed && <span>Хянах самбар</span>}
                        {location.pathname === '/app' && <div className="sidebar-link-indicator" />}
                    </NavLink>

                    {filteredNavItems.map((mod) => {
                        const Icon = (Icons as any)[mod.icon] || Icons.Box;

                        // Check if any module in the same hub is active
                        const hubModules = mod.hubId ? LISCORD_MODULES.filter(m => m.hubId === mod.hubId) : [];
                        const isAnyHubModuleActive = hubModules.some(m => location.pathname.startsWith(m.route));
                        const isActive = isAnyHubModuleActive || location.pathname.startsWith(mod.route);

                        // Better labels for hubs to satisfy user
                        let displayName = mod.name;
                        if (mod.hubId === 'crm-hub') displayName = 'Харилцагч & CRM';
                        if (mod.hubId === 'logistics-hub') displayName = 'Логистик & Карго';

                        return (
                            <NavLink
                                key={mod.id}
                                to={mod.route}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => sidebarOpen && toggleSidebar()}
                                title={sidebarCollapsed ? displayName : undefined}
                            >
                                <Icon size={20} />
                                {!sidebarCollapsed && <span>{displayName}</span>}
                                {isActive && <div className="sidebar-link-indicator" />}
                            </NavLink>
                        );
                    })}

                    {/* Settings Always at Bottom */}
                    <NavLink
                        to="/app/settings"
                        className={`sidebar-link ${location.pathname.startsWith('/app/settings') ? 'active' : ''}`}
                        onClick={() => sidebarOpen && toggleSidebar()}
                        title={sidebarCollapsed ? 'Тохиргоо' : undefined}
                    >
                        <Settings size={20} />
                        {!sidebarCollapsed && <span>Тохиргоо</span>}
                        {location.pathname.startsWith('/app/settings') && <div className="sidebar-link-indicator" />}
                    </NavLink>

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
