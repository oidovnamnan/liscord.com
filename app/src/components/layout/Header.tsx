import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Bell, Search, Plus, Zap, ShoppingBag } from 'lucide-react';
import { useUIStore, useAuthStore, useBusinessStore } from '../../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { V2UpgradeModal } from '../common/V2UpgradeModal';
import { userService } from '../../services/db';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import './Header.css';

interface HeaderProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    extra?: React.ReactNode;
}

interface NotifItem {
    id: string;
    templateId?: string;
    type?: string;
    title: string;
    body?: string;
    message?: string;
    icon?: string;
    link?: string;
    readBy?: Record<string, unknown>;
    isRead?: boolean;
    priority?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt?: any;
}

function timeAgo(date: Date | undefined): string {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Дөнгөж сая';
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} цагийн өмнө`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Өчигдөр';
    return `${days} өдрийн өмнө`;
}

export function Header({ title, subtitle, action, extra }: HeaderProps) {
    const { toggleSidebar } = useUIStore();
    const { user, setUser } = useAuthStore();
    const { business } = useBusinessStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<NotifItem[]>([]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time Firestore notification subscription
    useEffect(() => {
        if (!business?.id || !user?.uid) return;

        const q = query(
            collection(db, 'businesses', business.id, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsub = onSnapshot(q, (snap) => {
            const items: NotifItem[] = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
            })) as NotifItem[];
            setNotifications(items);
        }, (err) => {
            console.warn('[Notifications] subscription error:', err);
        });

        return () => unsub();
    }, [business?.id, user?.uid]);

    // Check if notification is unread for current user
    const isUnread = useCallback((notif: NotifItem): boolean => {
        if (!user?.uid) return false;
        if (notif.readBy && notif.readBy[user.uid]) return false;
        if (notif.isRead === true) return false;
        return true;
    }, [user?.uid]);

    const unreadCount = notifications.filter(isUnread).length;

    // Mark single notification as read
    const markAsRead = async (notif: NotifItem) => {
        if (!business?.id || !user?.uid || !isUnread(notif)) return;
        try {
            const ref = doc(db, 'businesses', business.id, 'notifications', notif.id);
            await updateDoc(ref, {
                [`readBy.${user.uid}`]: serverTimestamp(),
            });
        } catch (e) {
            console.warn('[Notifications] markAsRead failed:', e);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!business?.id || !user?.uid) return;
        const unread = notifications.filter(isUnread);
        if (unread.length === 0) return;
        try {
            const batch = writeBatch(db);
            unread.forEach(notif => {
                const ref = doc(db, 'businesses', business.id, 'notifications', notif.id);
                batch.update(ref, { [`readBy.${user.uid}`]: serverTimestamp() });
            });
            await batch.commit();
        } catch (e) {
            console.warn('[Notifications] markAllAsRead failed:', e);
        }
    };

    // Handle notification click
    const handleNotifClick = (notif: NotifItem) => {
        markAsRead(notif);
        if (notif.link) {
            navigate(notif.link);
            setIsNotifOpen(false);
        }
    };

    // Get icon for notification
    const getNotifIcon = (notif: NotifItem): string => {
        if (notif.icon) return notif.icon;
        const t = notif.templateId || notif.type || '';
        if (t.includes('order')) return '📥';
        if (t.includes('payment')) return '💰';
        if (t.includes('stock') || t.includes('low_stock')) return '⚠️';
        if (t.includes('team')) return '👤';
        if (t.includes('chat')) return '💬';
        if (t.includes('delivery')) return '🚚';
        if (t.includes('system')) return '🔔';
        return '📋';
    };

    const handleToggleV2 = async () => {
        if (!user) return;
        const isAuthorized = user.isSuperAdmin || business?.subscription?.hasV2Access;
        if (isAuthorized) {
            const nextVersion = user.uiVersion === 'v2' ? 'v1' : 'v2';
            await userService.updateProfile(user.uid, { uiVersion: nextVersion });
            setUser({ ...user, uiVersion: nextVersion });
        } else {
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
                        {title && <div className="header-title">{title}</div>}
                        {subtitle && <div className="header-subtitle">{subtitle}</div>}
                    </div>
                    {extra && <div className="header-extra hide-mobile">{extra}</div>}
                </div>
            </div>

            <div className="header-right">
                <button className="header-icon-btn hide-mobile" title="Хайлт (Ctrl+K)">
                    <Search size={20} />
                </button>

                <div className="header-notif-container" ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button className="header-icon-btn header-notif-btn" title="Мэдэгдэл" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="header-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    {isNotifOpen && (
                        <div className="notif-dropdown shadow-lg animate-slide-up" style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                            width: '360px', background: 'var(--surface-1)', borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            zIndex: 1000, display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                    Мэдэгдэл {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: 6 }}>({unreadCount})</span>}
                                </h3>
                                {unreadCount > 0 && (
                                    <span
                                        style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                                        onClick={markAllAsRead}
                                    >
                                        Бүгдийг уншсан
                                    </span>
                                )}
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {notifications.length > 0 ? notifications.map(n => {
                                    const unread = isUnread(n);
                                    const createdAt = n.createdAt?.toDate?.() instanceof Date
                                        ? n.createdAt.toDate()
                                        : n.createdAt instanceof Date ? n.createdAt : undefined;

                                    return (
                                        <div
                                            key={n.id}
                                            className="notif-item"
                                            style={{
                                                padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                                                background: unread ? 'var(--bg-hover)' : 'transparent',
                                                cursor: n.link ? 'pointer' : 'default',
                                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                                transition: 'background 0.2s',
                                            }}
                                            onClick={() => handleNotifClick(n)}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                                            onMouseLeave={e => e.currentTarget.style.background = unread ? 'var(--bg-hover)' : 'transparent'}
                                        >
                                            <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>
                                                {getNotifIcon(n)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '0.88rem',
                                                    color: 'var(--text-primary)',
                                                    fontWeight: unread ? 600 : 400,
                                                    lineHeight: 1.35,
                                                    marginBottom: 2,
                                                }}>
                                                    {n.title}
                                                </div>
                                                {(n.body || n.message) && (
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)',
                                                        lineHeight: 1.3,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}>
                                                        {n.body || n.message}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    {timeAgo(createdAt)}
                                                </div>
                                            </div>
                                            {unread && (
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: 'var(--primary)', flexShrink: 0, marginTop: 6,
                                                }} />
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <Bell size={32} style={{ opacity: 0.15, marginBottom: '12px', display: 'inline-block' }} />
                                        <br />Шинэ мэдэгдэл алга байна
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {!location.pathname.includes('app-store') && (
                    <button
                        className="header-icon-btn header-appstore-btn"
                        title="App Store"
                        onClick={() => navigate('/app/app-store')}
                    >
                        <ShoppingBag size={20} />
                        <span className="hide-mobile" style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '4px' }}>Апп Стор</span>
                    </button>
                )}

                {action && (
                    <button className="btn btn-primary btn-sm" onClick={action.onClick}>
                        <Plus size={16} />
                        <span className="hide-mobile">{action.label}</span>
                    </button>
                )}

                {/* V2 Toggle Switcher */}
                <button
                    onClick={handleToggleV2}
                    className="btn btn-sm hide-mobile"
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
