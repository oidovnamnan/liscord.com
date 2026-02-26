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

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ borderRight: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                {/* Header / Mobile Close Button */}
                <div className="hide-desktop" style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-primary)' }}>
                    <button className="btn-icon sidebar-close" onClick={toggleSidebar}>
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="sidebar-business-container" style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-glass)' }}>
                    <div className="super-admin-badge" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        background: 'var(--primary-tint)',
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-glass)',
                        boxShadow: 'inset 0 0 12px rgba(var(--primary-rgb), 0.05)'
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)'
                        }}>
                            <Globe size={20} />
                        </div>
                        {!sidebarCollapsed && (
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Liscord Core</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Super Admin</div>
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
                                style={isActive ? { background: 'var(--primary-light)', color: 'var(--primary)' } : {}}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                                {!sidebarCollapsed && <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                                {isActive && <div className="sidebar-link-indicator" style={{ background: 'var(--primary)' }} />}
                            </NavLink>
                        );
                    })}

                    <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: 'auto', padding: '20px 16px' }}>
                        <button
                            className="sidebar-link"
                            onClick={() => navigate('/app')}
                            title={sidebarCollapsed ? 'Буцах' : undefined}
                            style={{
                                width: '100%',
                                border: '1px solid var(--border-glass)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.2s',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--bg-soft)';
                                e.currentTarget.style.transform = 'translateX(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <ArrowLeft size={18} className="text-primary" />
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
