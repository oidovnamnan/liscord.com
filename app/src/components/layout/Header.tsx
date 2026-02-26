import { useState, useRef, useEffect } from 'react';
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
    extra?: React.ReactNode;
}

export function Header({ title, subtitle, action, extra }: HeaderProps) {
    const { toggleSidebar } = useUIStore();
    const { user, setUser } = useAuthStore();
    const { business } = useBusinessStore();

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dummyNotifications = [
        { id: 1, text: "Шинэ захиалга ирлээ (#1024)", time: "10 минутын өмнө", unread: true },
        { id: 2, text: "Каргоны төлбөр төлөгдсөн (#1022)", time: "1 цагийн өмнө", unread: true },
        { id: 3, text: "Системийн шинэчлэл амжилттай хийгдлээ", time: "Өчигдөр", unread: false },
    ];

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
                    <div className="header-title-container">
                        {title && <h1 className="header-title">{title}</h1>}
                        {subtitle && <p className="header-subtitle">{subtitle}</p>}
                    </div>
                    {extra && <div className="header-extra hide-mobile">{extra}</div>}
                </div>
            </div>

            <div className="header-right">
                <button className="header-icon-btn" title="Хайлт (Ctrl+K)">
                    <Search size={20} />
                </button>

                <div className="header-notif-container" ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button className="header-icon-btn header-notif-btn" title="Мэдэгдэл" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                        <Bell size={20} />
                        <span className="header-notif-badge">3</span>
                    </button>

                    {isNotifOpen && (
                        <div className="notif-dropdown shadow-lg animate-slide-up" style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                            width: '320px', background: 'var(--surface-1)', borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            zIndex: 1000, display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Мэдэгдэл</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Бүгдийг уншсан</span>
                            </div>
                            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                {dummyNotifications.length > 0 ? dummyNotifications.map(n => (
                                    <div key={n.id} className="notif-item" style={{
                                        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                                        background: n.unread ? 'var(--bg-hover)' : 'transparent',
                                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px',
                                        transition: 'background 0.2s',
                                        position: 'relative'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                        onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'var(--bg-hover)' : 'transparent'}
                                    >
                                        {n.unread && <div style={{ position: 'absolute', left: '6px', top: '18px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: n.unread ? 600 : 400, marginLeft: n.unread ? '8px' : '0' }}>{n.text}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: n.unread ? '8px' : '0' }}>{n.time}</div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <Bell size={32} style={{ opacity: 0.2, marginBottom: '12px', display: 'inline-block' }} />
                                        <br />Шинэ мэдэгдэл алга байна
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                Бүх мэдэгдлийг харах
                            </div>
                        </div>
                    )}
                </div>

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
