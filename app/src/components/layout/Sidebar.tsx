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
    Blocks,
    LogOut,
} from 'lucide-react';
import { useUIStore, useBusinessStore, useAuthStore, useModuleDefaultsStore } from '../../store';
import { doc, updateDoc, collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { businessService } from '../../services/db';
import { toast } from 'react-hot-toast';
import * as Icons from 'lucide-react';
import { getVisibleModules } from '../../utils/moduleUtils';
import { MODULE_PERMISSIONS } from '../../config/modulePermissions';
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
    const [moduleBadges, setModuleBadges] = useState<Record<string, number>>({});

    useEffect(() => {
        if (showSwitcher) {
            if (user?.businessIds?.length) loadBusinesses();
            loadSwitchableEmployees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSwitcher]);

    // Real-time badge counts from actual business data
    useEffect(() => {
        if (!business?.id) return;
        const unsubs: (() => void)[] = [];

        // 1. Orders: paid but still unprocessed (status='new')
        const ordersQ = query(
            collection(db, 'businesses', business.id, 'orders'),
            where('paymentStatus', '==', 'paid'),
            where('status', '==', 'new'),
            where('isDeleted', '==', false),
        );
        unsubs.push(onSnapshot(ordersQ, (snap) => {
            setModuleBadges(prev => ({ ...prev, orders: snap.size }));
            // Also count sourcing: paid orders with pre-order items and no sourcing done
            let sourcingPending = 0;
            snap.docs.forEach(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = d.data() as any;
                const hasPreorder = (data.items || []).some((it: { isPreorder?: boolean }) => it.isPreorder);
                const sourcingStatus = data.sourcing?.status || 'pending';
                if (hasPreorder && sourcingStatus === 'pending') sourcingPending++;
            });
            setModuleBadges(prev => ({ ...prev, sourcing: sourcingPending }));
        }, () => {}));

        // 2. Pending SMS income (unmatched payments)
        if ((business as any).smsBridgeKey) {
            const smsQ = query(
                collection(db, 'sms_inbox'),
                where('pairingKey', '==', (business as any).smsBridgeKey),
                where('status', '==', 'pending'),
                limit(50),
            );
            unsubs.push(onSnapshot(smsQ, (snap) => {
                setModuleBadges(prev => ({ ...prev, 'sms-income-sync': snap.size }));
            }, () => {}));
        }

        // 3. Stock inquiries: pending (not yet responded)
        const inquiryQ = query(
            collection(db, 'businesses', business.id, 'stockInquiries'),
            where('status', '==', 'pending'),
            limit(50),
        );
        unsubs.push(onSnapshot(inquiryQ, (snap) => {
            setModuleBadges(prev => ({ ...prev, 'stock-inquiry': snap.size }));
        }, () => {}));

        // 5. Order inquiries: pending (not yet answered)
        const orderInqQ = query(
            collection(db, 'businesses', business.id, 'orderInquiries'),
            where('status', '==', 'pending'),
            limit(50),
        );
        unsubs.push(onSnapshot(orderInqQ, (snap) => {
            setModuleBadges(prev => ({ ...prev, 'order-inquiry': snap.size }));
        }, () => {}));

        // 4. Messenger: total unread conversations
        const messengerQ = query(
            collection(db, 'businesses', business.id, 'fbConversations'),
            where('unreadCount', '>', 0),
            limit(50),
        );
        unsubs.push(onSnapshot(messengerQ, (snap) => {
            const totalUnread = snap.docs.reduce((sum, d) => sum + (d.data().unreadCount || 0), 0);
            setModuleBadges(prev => ({ ...prev, messenger: totalUnread }));
        }, () => {}));

        return () => unsubs.forEach(u => u());
    }, [business?.id]);

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
            // Multiple ways to detect owner: ownerId match, role, superAdmin, or businessIds owner
            const isOwner = user.uid === business.ownerId
                || employee?.role === 'owner'
                || user.isSuperAdmin === true
                || (user.businessIds?.includes(business.id) && !employee);

            if (isOwner) {
                // Owner: load ALL non-deleted employees
                const allEmps = await businessService.getAllEmployees(business.id);
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

    const { defaults: moduleDefaults, fetchDefaults } = useModuleDefaultsStore();

    useEffect(() => {
        fetchDefaults();
    }, [fetchDefaults]);

    // Auto-generate module → permission prefix map from MODULE_PERMISSIONS
    // Each module's permissions share the same prefix (e.g. 'sourcing.view' → prefix 'sourcing.')
    const modulePermissionMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const [moduleId, perms] of Object.entries(MODULE_PERMISSIONS)) {
            // Collect unique prefixes from all permission IDs of this module
            const prefixes = new Set<string>();
            for (const p of perms) {
                const dotIdx = p.id.indexOf('.');
                if (dotIdx > 0) {
                    prefixes.add(p.id.substring(0, dotIdx + 1)); // e.g. 'sourcing.'
                }
            }
            if (prefixes.size > 0) {
                map[moduleId] = [...prefixes];
            }
        }
        // Core permissions (always available modules)
        map['dashboard'] = ['reports.'];
        return map;
    }, []);

    // Check if user is owner — when impersonating, treat as non-owner to apply permissions
    const isOwner = !isImpersonating && (user?.uid === business?.ownerId || employee?.role === 'owner');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empPerms: string[] = (employee as any)?.permissions || [];

    // Detect if user is a known employee (even if employee object hasn't loaded yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isKnownEmployee = !isOwner && !!(employee || (user as any)?.employeeMap?.[business?.id || '']);

    const filteredNavItems = useMemo(() => {
        let items = getVisibleModules(business, moduleDefaults);

        // Non-owner employees: filter by permissions
        // Also applies when employee object hasn't loaded but user is known to be an employee
        if (isKnownEmployee) {
            if (employee) {
                items = items.filter(mod => {
                    if (mod.id === 'dashboard') return true; // Dashboard always visible
                    const prefixes = modulePermissionMap[mod.id];
                    if (!prefixes || prefixes.length === 0) return false; // No mapping = HIDE
                    // Check if employee has ANY permission matching this module's prefixes
                    return prefixes.some(prefix => empPerms.some(p => p.startsWith(prefix)));
                });
            } else {
                // Employee not loaded yet — show only dashboard until loaded
                items = items.filter(mod => mod.id === 'dashboard');
            }
        }

        return items;
    }, [business?.activeModules, business?.moduleSubscriptions, business?.category, moduleDefaults, isOwner, isImpersonating, employee, isKnownEmployee, modulePermissionMap]);

    // Sort modules by admin-configured order (per-employee first, then global fallback)
    const sortedNavItems = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const empOrder: string[] = (employee as any)?.moduleOrder || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bizOrder: string[] = (business as any)?.moduleOrder || [];
        const moduleOrder = empOrder.length > 0 ? empOrder : bizOrder;
        if (moduleOrder.length === 0) return filteredNavItems;
        
        return [...filteredNavItems].sort((a, b) => {
            const idxA = moduleOrder.indexOf(a.id);
            const idxB = moduleOrder.indexOf(b.id);
            // Items not in order go to the end, preserving their original relative order
            const posA = idxA >= 0 ? idxA : moduleOrder.length + filteredNavItems.indexOf(a);
            const posB = idxB >= 0 ? idxB : moduleOrder.length + filteredNavItems.indexOf(b);
            return posA - posB;
        });
    }, [filteredNavItems, (employee as any)?.moduleOrder, (business as any)?.moduleOrder]);

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
                    {/* App Store - only visible to owner */}
                    {isOwner && (
                        <NavLink
                            to="/app/app-store"
                            className={`sidebar-link ${location.pathname.startsWith('/app/app-store') ? 'active' : ''}`}
                            onClick={() => sidebarOpen && toggleSidebar()}
                            title={sidebarCollapsed ? 'Апп Стор' : undefined}
                        >
                            <Blocks size={20} />
                            {!sidebarCollapsed && <span>Апп Стор</span>}
                            {location.pathname.startsWith('/app/app-store') && <div className="sidebar-link-indicator" />}
                        </NavLink>
                    )}

                    {/* Dashboard */}
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

                    {sortedNavItems.map((mod) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const Icon = (Icons as any)[mod.icon] || Icons.Box;

                        // Only highlight the module whose route matches the current path
                        const isActive = location.pathname.startsWith(mod.route);

                        // Better label for main inventory hub module
                        let displayName = mod.name;
                        if (mod.id === 'inventory') displayName = 'Агуулах / Логистик';
                        if (mod.id === 'crm') displayName = 'Харилцагч & CRM';
                        if (mod.id === 'logistics') displayName = 'Логистик & Карго';
                        if (mod.id === 'sms-income-sync') displayName = 'Орлого';

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
                                {moduleBadges[mod.id] > 0 && (
                                    <span className="sidebar-badge">{moduleBadges[mod.id] > 9 ? '9+' : moduleBadges[mod.id]}</span>
                                )}
                                {isActive && <div className="sidebar-link-indicator" />}
                            </NavLink>
                        );
                    })}


                    {/* Settings - owner always, employees only with settings.* permission */}
                    {(isOwner || (!isKnownEmployee && empPerms.length === 0) || empPerms.some(p => p.startsWith('settings.'))) && (
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

                {/* Logout button */}
                <button
                    className="sidebar-logout-btn"
                    onClick={async () => {
                        try {
                            await signOut(auth);
                            navigate('/login');
                        } catch (e) {
                            console.error('Logout failed:', e);
                        }
                    }}
                    title={sidebarCollapsed ? 'Гарах' : undefined}
                >
                    <LogOut size={18} />
                    {!sidebarCollapsed && <span>Гарах</span>}
                </button>

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
