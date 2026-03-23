import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Activity, DollarSign, ShoppingCart, Users, RefreshCw,
    Loader2, Clock, TrendingUp, Eye
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc as fdoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import './QuickDashboard.css';

// ======== Types ========

interface OnlineUser {
    id: string;
    name: string;
    positionName: string;
    avatar: string | null;
    role: 'owner' | 'employee' | 'visitor';
    deviceInfo?: string;
    currentPage?: string;
    duration?: string;
}

interface DashStats {
    todayRevenue: number;
    todayOrders: number;
    todayPaidAmount: number;
    todayVisitors: number;
    onlineUsers: OnlineUser[];
}

interface QuickDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

// ======== Helpers ========

const AVATAR_COLORS = [
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
    'linear-gradient(135deg, #6366f1, #4f46e5)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
];

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function formatMoney(n: number): string {
    return '₮' + (n || 0).toLocaleString();
}

function parseDevice(ua: string): string {
    if (!ua) return '🌐 Хөтөч';
    if (/MicroMessenger/i.test(ua)) return '🌐 WeChat';
    if (/FBAN|FBAV/i.test(ua)) return '📘 Facebook';
    if (/iPhone|iPad|iPod/i.test(ua)) return '📱 iPhone';
    if (/Android/i.test(ua)) return '📱 Android';
    if (/Macintosh|Mac OS/i.test(ua)) return '💻 Mac';
    if (/Windows/i.test(ua)) return '💻 Windows';
    return '🌐 Хөтөч';
}

function parsePage(page: string): string {
    if (!page || page === '/') return 'Нүүр хуудас';
    const clean = page.replace(/^\/store\/[^/]+/, '').replace(/^\/+/, '');
    if (!clean || clean === '/') return 'Нүүр хуудас';
    if (clean.startsWith('product')) return '🛍️ Бараа';
    if (clean.startsWith('cart')) return '🛒 Сагс';
    if (clean.startsWith('checkout')) return '💳 Төлбөр';
    if (clean.startsWith('order')) return '📦 Захиалга';
    if (clean.startsWith('category')) return '📂 Ангилал';
    return page;
}

function parseVisitorDuration(visitorId: string): string {
    // Visitor ID format: v_{Date.now()}_{random}
    const match = visitorId.match(/^v_(\d+)_/);
    if (!match) return '';
    const startMs = parseInt(match[1], 10);
    const diffMs = Date.now() - startMs;
    if (diffMs < 0) return 'саяхан';
    const secs = Math.floor(diffMs / 1000);
    if (secs < 60) return `${secs} сек`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} мин`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs} цаг ${remMins} мин` : `${hrs} цаг`;
}

// ======== Component ========

export function QuickDashboard({ isOpen, onClose }: QuickDashboardProps) {
    const [stats, setStats] = useState<DashStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { business } = useBusinessStore();

    const fetchStats = useCallback(async () => {
        if (!business?.id) return;
        setLoading(true);
        const bizId = business.id;

        try {
            // Today's start
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayTimestamp = Timestamp.fromDate(todayStart);

            // 1. Today's orders
            const ordersRef = collection(db, 'businesses', bizId, 'orders');
            const ordersSnap = await getDocs(query(
                ordersRef,
                where('isDeleted', '==', false),
                where('createdAt', '>=', todayTimestamp)
            ));

            let todayRevenue = 0;
            let todayPaidAmount = 0;
            const todayOrders = ordersSnap.size;

            ordersSnap.docs.forEach(doc => {
                const data = doc.data();
                todayRevenue += data.financials?.totalAmount || 0;
                todayPaidAmount += data.financials?.paidAmount || 0;
            });

            // 1b. Today's total visitors from daily_stats
            const todayStr = now.toISOString().slice(0, 10);
            const dailyRef = fdoc(db, 'businesses', bizId, 'daily_stats', todayStr);
            const dailySnap = await getDoc(dailyRef);
            const todayVisitors = dailySnap.exists() ? (dailySnap.data().visitorCount || 0) : 0;

            // 2. Online employees (active within last 2 minutes)
            const twoMinAgo = Timestamp.fromDate(new Date(Date.now() - 2 * 60_000));
            const empRef = collection(db, 'businesses', bizId, 'employees');
            const onlineEmpSnap = await getDocs(query(
                empRef,
                where('lastActiveAt', '>=', twoMinAgo)
            ));

            const onlineEmployees: OnlineUser[] = onlineEmpSnap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name || 'Нэргүй',
                    positionName: data.positionName || '',
                    avatar: data.avatar || null,
                    role: data.role || 'employee',
                };
            });

            // 3. Online visitors (active within last 2 minutes)
            const visRef = collection(db, 'businesses', bizId, 'visitors');
            const onlineVisSnap = await getDocs(query(
                visRef,
                where('lastActiveAt', '>=', twoMinAgo)
            ));

            const onlineVisitors: OnlineUser[] = onlineVisSnap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name || 'Зочин',
                    positionName: '',
                    avatar: data.avatar || null,
                    role: 'visitor' as const,
                    deviceInfo: parseDevice(data.userAgent || ''),
                    currentPage: parsePage(data.page || ''),
                    duration: parseVisitorDuration(d.id),
                };
            });

            const onlineUsers = [...onlineEmployees, ...onlineVisitors];

            setStats({ todayRevenue, todayOrders, todayPaidAmount, todayVisitors, onlineUsers });
            setLastUpdated(new Date());
        } catch (err) {
            console.error('[QuickDashboard] Error:', err);
        } finally {
            setLoading(false);
        }
    }, [business?.id]);

    // Fetch on open
    useEffect(() => {
        if (isOpen) fetchStats();
    }, [isOpen, fetchStats]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="qd-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="qd-card">
                {/* Header */}
                <div className="qd-header">
                    <div className="qd-title">
                        <div className="qd-title-icon">
                            <Activity size={18} />
                        </div>
                        Түргэн дэлгэц
                        <span className="qd-shortcut">⌘D</span>
                    </div>
                    <button className="qd-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {loading && !stats ? (
                    <div className="qd-loading">
                        <Loader2 size={28} className="animate-spin" />
                    </div>
                ) : stats ? (
                    <>
                        {/* Stats Grid */}
                        <div className="qd-body">
                            <div className="qd-stats-grid">
                                <div className="qd-stat qd-stat--emerald">
                                    <div className="qd-stat-icon">
                                        <DollarSign size={16} />
                                    </div>
                                    <div className="qd-stat-value">{formatMoney(stats.todayRevenue)}</div>
                                    <div className="qd-stat-label">Өнөөдрийн орлого</div>
                                </div>

                                <div className="qd-stat qd-stat--red">
                                    <div className="qd-stat-icon">
                                        <ShoppingCart size={16} />
                                    </div>
                                    <div className="qd-stat-value">{stats.todayOrders}</div>
                                    <div className="qd-stat-label">Өнөөдрийн захиалга</div>
                                </div>

                                <div className="qd-stat qd-stat--neutral">
                                    <div className="qd-stat-icon">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div className="qd-stat-value">{formatMoney(stats.todayPaidAmount)}</div>
                                    <div className="qd-stat-label">Төлсөн дүн</div>
                                </div>

                                <div className="qd-stat qd-stat--emerald">
                                    <div className="qd-stat-icon">
                                        <Eye size={16} />
                                    </div>
                                    <div className="qd-stat-value">{stats.todayVisitors}</div>
                                    <div className="qd-stat-label">Өнөөдрийн зочин</div>
                                </div>
                            </div>

                            {/* Online Users */}
                            <div className="qd-section">
                                <div className="qd-section-header">
                                    <div className="qd-section-title">Онлайн хэрэглэгчид</div>
                                    <div className="qd-online-badge">
                                        <div className="qd-online-dot" />
                                        {stats.onlineUsers.length} онлайн
                                    </div>
                                </div>

                                {stats.onlineUsers.length === 0 ? (
                                    <div className="qd-empty-users">
                                        Одоо онлайн хэрэглэгч байхгүй байна
                                    </div>
                                ) : (
                                    <div className="qd-user-list">
                                        {stats.onlineUsers.map(user => (
                                            <div key={user.id} className="qd-user-item">
                                                <div className="qd-user-avatar" style={{ background: getAvatarColor(user.name) }}>
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                                                    ) : (
                                                        getInitials(user.name)
                                                    )}
                                                    <div className="qd-user-avatar-online" />
                                                </div>
                                                <div className="qd-user-info">
                                                    <div className="qd-user-name">{user.name}</div>
                                                    <div className="qd-user-role">
                                                        {user.role === 'owner' ? '👑 Эзэмшигч' : user.role === 'visitor' ? (
                                                            <>
                                                                <span>{user.deviceInfo}</span>
                                                                {user.currentPage && <span style={{ marginLeft: 6, opacity: 0.7 }}>· {user.currentPage}</span>}
                                                                {user.duration && <span style={{ marginLeft: 6, color: '#10b981', fontWeight: 700 }}>· ⏱ {user.duration}</span>}
                                                            </>
                                                        ) : user.positionName || 'Ажилтан'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="qd-footer">
                            <div className="qd-timestamp">
                                <Clock size={12} />
                                {lastUpdated ? `${lastUpdated.toLocaleTimeString('mn-MN')} шинэчлэсэн` : ''}
                            </div>
                            <button className="qd-refresh-btn" onClick={fetchStats} disabled={loading}>
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                Шинэчлэх
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>,
        document.body
    );
}
