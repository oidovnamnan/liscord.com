import { useState } from 'react';
import { Menu, Bell, Search, Plus, Zap } from 'lucide-react';
import { useUIStore, useAuthStore, useBusinessStore } from '../../store';
import { V2UpgradeModal } from '../common/V2UpgradeModal';
import { userService } from '../../services/db';
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
    const { user, setUser } = useAuthStore();
    const { business } = useBusinessStore();

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const handleToggleV2 = async () => {
        if (!user) return;

        // Super admins OR businesses that paid for V2 can switch freely
        const isAuthorized = user.isSuperAdmin || business?.subscription?.hasV2Access;

        if (isAuthorized) {
            const nextVersion = user.uiVersion === 'v2' ? 'v1' : 'v2';
            await userService.updateProfile(user.uid, { uiVersion: nextVersion });
            setUser({ ...user, uiVersion: nextVersion });
        } else {
            // Unpaid normal user -> Show Paywall
            setIsUpgradeModalOpen(true);
        }
    };

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

                {/* V2 Toggle Switcher */}
                <button
                    onClick={handleToggleV2}
                    className="btn btn-sm"
                    style={{
                        background: user?.uiVersion === 'v2' ? 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.1)',
                        color: user?.uiVersion === 'v2' ? '#000' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600
                    }}
                    title="Switch Workspace Version"
                >
                    <Zap size={14} />
                    <span className="hide-mobile">{user?.uiVersion === 'v2' ? 'V2' : 'V1'}</span>
                </button>

                <div className="header-avatar" title={user?.displayName || 'Хэрэглэгч'}>
                    {user?.displayName?.charAt(0) || '?'}
                </div>
            </div>

            <V2UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onSuccess={() => {
                    setIsUpgradeModalOpen(false);
                    if (user) {
                        const newV = 'v2';
                        userService.updateProfile(user.uid, { uiVersion: newV });
                        setUser({ ...user, uiVersion: newV });
                    }
                }}
            />
        </header>
    );
}
