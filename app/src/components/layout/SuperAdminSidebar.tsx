import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Users,
    ShieldAlert,
    DollarSign,
    Tags,
    Globe,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    CheckSquare
} from 'lucide-react';
import { useUIStore } from '../../store';
import './Sidebar.css';

type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
};

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Платформ Админ', icon: LayoutDashboard, path: '/super' },
    { id: 'businesses', label: 'Бизнесүүд', icon: Building2, path: '/super/businesses' },
    { id: 'users', label: 'Хэрэглэгчид', icon: Users, path: '/super/users' },
    { id: 'audit', label: 'Аудит & Лог', icon: ShieldAlert, path: '/super/audit' },
    { id: 'finance', label: 'Санхүү (P&L)', icon: DollarSign, path: '/super/finance' },
    { id: 'categories', label: 'Ангилал & Төрөл', icon: Tags, path: '/super/categories' },
    { id: 'global', label: 'Глобал Тохиргоо', icon: Globe, path: '/super/global-settings' },
    { id: 'settings', label: 'Модуль Тохиргоо', icon: Settings, path: '/super/settings' },
    { id: 'requests', label: 'Хүсэлтүүд', icon: CheckSquare, path: '/super/requests' },
];

export function SuperAdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore();

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={toggleSidebar} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ borderRight: '1px solid var(--accent-blue)', background: 'var(--bg-secondary)' }}>
                {/* Header / Mobile Close Button */}
                <div className="hide-desktop" style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-primary)' }}>
                    <button className="btn-icon sidebar-close" onClick={toggleSidebar}>
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="sidebar-business-container" style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="super-admin-badge" style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'linear-gradient(135deg, rgba(82,113,255,0.1) 0%, rgba(47,82,246,0.1) 100%)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(82,113,255,0.2)' }}>
                        <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>🦅</div>
                        {!sidebarCollapsed && (
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>Liscord Core</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Super Admin Portal</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav" style={{ paddingTop: '16px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/super'
                            ? location.pathname === '/super'
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                end={item.path === '/super'}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => sidebarOpen && toggleSidebar()}
                                title={sidebarCollapsed ? item.label : undefined}
                                style={isActive ? { background: 'rgba(82,113,255,0.1)', color: 'var(--primary)' } : {}}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                                {!sidebarCollapsed && <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                                {isActive && <div className="sidebar-link-indicator" style={{ background: 'var(--primary)' }} />}
                            </NavLink>
                        );
                    })}

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0', padding: '16px 12px' }}>
                        <button
                            className="sidebar-link"
                            onClick={() => navigate('/app')}
                            title={sidebarCollapsed ? 'Буцах' : undefined}
                            style={{ width: '100%', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
                        >
                            <ArrowLeft size={18} />
                            {!sidebarCollapsed && <span>Бусад бизнес рүү буцах</span>}
                        </button>
                    </div>
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
