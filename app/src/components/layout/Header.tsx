import { Menu, Bell, Search, Plus } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import './Header.css';

interface HeaderProps {
    title?: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function Header({ title, subtitle, action }: HeaderProps) {
    const { toggleSidebar } = useUIStore();
    const { user } = useAuthStore();

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-menu-btn hide-desktop" onClick={toggleSidebar}>
                    <Menu size={22} />
                </button>
                <div className="header-title-section">
                    {title && <h1 className="header-title">{title}</h1>}
                    {subtitle && <p className="header-subtitle">{subtitle}</p>}
                </div>
            </div>

            <div className="header-right">
                <button className="header-icon-btn" title="Хайлт (Ctrl+K)">
                    <Search size={20} />
                </button>

                <button className="header-icon-btn header-notif-btn" title="Мэдэгдэл">
                    <Bell size={20} />
                    <span className="header-notif-badge">3</span>
                </button>

                {action && (
                    <button className="btn btn-primary btn-sm" onClick={action.onClick}>
                        <Plus size={16} />
                        <span className="hide-mobile">{action.label}</span>
                    </button>
                )}

                <div className="header-avatar" title={user?.displayName || 'Хэрэглэгч'}>
                    {user?.displayName?.charAt(0) || '?'}
                </div>
            </div>
        </header>
    );
}
