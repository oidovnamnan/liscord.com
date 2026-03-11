import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    ChevronLeft,
    ChevronRight,
    UserCog,
    X,
    ChevronDown,
    ArrowRightLeft,
    CornerDownLeft,
    Shield,
} from 'lucide-react';
import { useUIStore, useBusinessStore, useAuthStore } from '../../store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { businessService, systemSettingsService } from '../../services/db';
import { toast } from 'react-hot-toast';
import * as Icons from 'lucide-react';
import { getVisibleModules } from '../../utils/moduleUtils';
import './Sidebar.css';

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore();
    const { business, setBusiness, setEmployee, setLinkedEmployees, linkedEmployees, employee, isImpersonating, switchToEmployee, switchBack } = useBusinessStore();
    const { user } = useAuthStore();
    const [switching, setSwitching] = useState(false);
    const [showSwitcher, setShowSwitcher] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userBusinesses, setUserBusinesses] = useState<any[]>([]);

    useEffect(() => {
        if (showSwitcher) {
            if (user?.businessIds?.length) loadBusinesses();
            loadSwitchableEmployees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSwitcher]);

    const loadBusinesses = async () => {
        if (!user) return;
        try {
            const bizs = await Promise.all(
                user.businessIds.map((id: string) => businessService.getBusiness(id))
            );
            setUserBusinesses(bizs.filter(Boolean));
        } catch (error) {
            console.error('Failed to load businesses:', error);
        }
    };

    const loadSwitchableEmployees = async () => {
        if (!user || !business) return;
        try {
            const isOwner = user.uid === business.ownerId || employee?.role === 'owner';
            console.log('[Sidebar] loadSwitchableEmployees', { isOwner, userId: user.uid, ownerId: business.ownerId, employeeId: employee?.id });
            if (isOwner) {
                // Owner: load ALL non-deleted employees
                const allEmps = await businessService.getAllEmployees(business.id);
                console.log('[Sidebar] allEmps loaded:', allEmps.length);
                const currentEmpId = employee?.id;
                setLinkedEmployees(currentEmpId ? allEmps.filter(e => e.id !== currentEmpId) : allEmps);
            } else if (employee?.linkedEmployeeIds?.length) {
                const linked = await businessService.getLinkedEmployees(business.id, employee.linkedEmployeeIds);
                setLinkedEmployees(linked);
            }
        } catch (e) {
            console.warn('[Sidebar] loadSwitchableEmployees failed:', e);
        }
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
            // Load switchable employees
            if (emp && biz) {
                try {
                    const isOwner = user.uid === biz.ownerId || emp.role === 'owner';
                    if (isOwner) {
                        const allEmps = await businessService.getEmployees(biz.id);
                        setLinkedEmployees(allEmps.filter(e => e.id !== emp.id));
                    } else if (emp.linkedEmployeeIds?.length) {
                        const linked = await businessService.getLinkedEmployees(biz.id, emp.linkedEmployeeIds);
                        setLinkedEmployees(linked);
                    } else {
                        setLinkedEmployees([]);
                    }
                } catch (e) {
                    console.warn('[Sidebar] loadSwitchableEmployees failed:', e);
                    setLinkedEmployees([]);
                }
            }
            setShowSwitcher(false);
            navigate('/app');
            toast.success(`${biz?.name} руу шилжлээ`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Шилжихэд алдаа гарлаа');
        } finally {
            setSwitching(false);
        }
    };

    const handleSwitchEmployee = async (emp: typeof employee) => {
        if (!emp || !business) return;
        try {
            // Fetch position permissions for this employee
            let empWithPerms = { ...emp };
            if (emp.positionId) {
                const posDoc = await import('firebase/firestore').then(({ doc, getDoc }) =>
                    getDoc(doc(db, 'businesses', business.id, 'positions', emp.positionId!))
                );
                if (posDoc.exists()) {
                    empWithPerms = { ...emp, permissions: posDoc.data().permissions || [] } as typeof emp;
                }
            }
            switchToEmployee(empWithPerms);
            setShowSwitcher(false);
            navigate('/app');
            toast.success(`${emp.name} эрх рүү шилжлээ`);
        } catch (e) {
            console.error('[Sidebar] switchEmployee failed:', e);
            toast.error('Шилжихэд алдаа гарлаа');
        }
    };

    const handleSwitchBack = () => {
        switchBack();
        setShowSwitcher(false);
        toast.success('Өөрийн эрх рүү буцлаа');
    };

    const [moduleDefaults, setModuleDefaults] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                const data = await systemSettingsService.getModuleDefaults();
                setModuleDefaults(data);
            } catch (e) {
                console.error('Failed to fetch module defaults:', e);
            }
        };
        fetchDefaults();
    }, []);

    // Module ID → required permission prefix mapping
    const modulePermissionMap: Record<string, string> = {
        'orders': 'orders.',
        'products': 'products.',
        'customers': 'customers.',
        'crm': 'customers.',
        'inventory': 'products.',
        'procurement': 'orders.purchase',
        'team': 'team.',
        'barcode': 'products.',
        'logistics': 'orders.manage_delivery',
        'sms-bank': 'finance.',
        'reports': 'reports.',
        'finance': 'finance.',
    };

    const filteredNavItems = useMemo(() => {
        let items = getVisibleModules(business, moduleDefaults);

        // When impersonating, filter by employee's permissions
        if (isImpersonating && employee) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const empPerms: string[] = (employee as any).permissions || [];
            items = items.filter(mod => {
                if (mod.isCore) return true; // Dashboard always visible
                const permPrefix = modulePermissionMap[mod.id];
                if (!permPrefix) return false; // No mapping = HIDE during impersonation
                return empPerms.some(p => p.startsWith(permPrefix));
            });
        }

        return items;
    }, [business?.activeModules, business?.moduleSubscriptions, business?.category, moduleDefaults, isImpersonating, employee]);

    const hasMultipleBusinesses = (userBusinesses.length > 1);

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

                {/* Business Info + Switcher */}
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
                                {isImpersonating && employee ? (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Shield size={9} /> {employee.name}
                                    </div>
                                ) : (
                                    <div className="sidebar-business-plan badge badge-primary">
                                        {business.subscription.plan.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <ChevronDown size={16} className={`switcher-arrow ${showSwitcher ? 'open' : ''}`} />
                        </div>

                        {showSwitcher && (
                            <div className="business-switcher-dropdown">
                                {/* Business switching (only when multiple businesses) */}
                                {hasMultipleBusinesses && (
                                    <>
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
                                    </>
                                )}

                                {/* Back to own account (when impersonating) */}
                                {isImpersonating && (
                                    <>
                                        {hasMultipleBusinesses && <div className="switcher-divider" />}
                                        <button className="switcher-item switcher-back" onClick={handleSwitchBack}>
                                            <div className="switcher-item-icon" style={{ background: 'var(--success)', color: 'white' }}>
                                                <CornerDownLeft size={14} />
                                            </div>
                                            <div className="sidebar-business-info">
                                                <div className="sidebar-business-name">Эзэн</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--success)' }}>← Буцах</div>
                                            </div>
                                        </button>
                                    </>
                                )}

                                {/* Employee switching */}
                                {linkedEmployees.length > 0 && (
                                    <>
                                        {(hasMultipleBusinesses || isImpersonating) && <div className="switcher-divider" />}
                                        <div className="switcher-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <ArrowRightLeft size={10} /> Ажилтан солих
                                        </div>
                                        {linkedEmployees.map(emp => (
                                            <button
                                                key={emp.id}
                                                className="switcher-item"
                                                onClick={() => handleSwitchEmployee(emp)}
                                            >
                                                <div className="switcher-item-icon" style={{ background: 'linear-gradient(135deg, var(--primary), #6c5ce7)', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>
                                                    {(emp.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="sidebar-business-info">
                                                    <div className="sidebar-business-name">{emp.name}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Shield size={8} /> {emp.positionName || 'Ажилтан'}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )}
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Icon = (Icons as any)[mod.icon] || Icons.Box;

                        // Only highlight the module whose route matches the current path
                        const isActive = location.pathname.startsWith(mod.route);

                        // Better label for main inventory hub module
                        let displayName = mod.name;
                        if (mod.id === 'inventory') displayName = 'Агуулах / Логистик';
                        if (mod.id === 'crm') displayName = 'Харилцагч & CRM';
                        if (mod.id === 'logistics') displayName = 'Логистик & Карго';

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


                    {/* Settings - hidden during impersonation unless has settings permission */}
                    {(!isImpersonating || ((employee as any)?.permissions || []).some((p: string) => p.startsWith('settings.'))) && (
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
                    )}

                    {/* Super Admin - never show during impersonation */}
                    {user?.isSuperAdmin && !isImpersonating && (
                        <NavLink
                            to="/super"
                            className={`sidebar-link platform-admin-link ${location.pathname.startsWith('/super') ? 'active' : ''}`}
                            onClick={() => sidebarOpen && toggleSidebar()}
                            title={sidebarCollapsed ? 'Платформ Админ' : undefined}
                        >
                            <UserCog size={20} color="var(--primary)" />
                            {!sidebarCollapsed && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Платформ Админ</span>}
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
