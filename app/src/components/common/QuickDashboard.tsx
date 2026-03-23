import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Activity, DollarSign, ShoppingCart, Users, RefreshCw,
    Loader2, Clock, TrendingUp
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
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
}

interface DashStats {
    todayRevenue: number;
    todayOrders: number;
    todayPaidAmount: number;
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
                };
            });

            const onlineUsers = [...onlineEmployees, ...onlineVisitors];

            setStats({ todayRevenue, todayOrders, todayPaidAmount, onlineUsers });
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
                                                        {user.role === 'owner' ? '👑 Эзэмшигч' : user.role === 'visitor' ? '👁 Зочин' : user.positionName || 'Ажилтан'}
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
