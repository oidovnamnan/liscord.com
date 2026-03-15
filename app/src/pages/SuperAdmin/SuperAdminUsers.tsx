import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    MoreVertical,
    Mail,
    Phone,
    Shield,
    CheckCircle2,
    Ban,
    UserCircle,
    Users,
    Sparkles,
    Crown
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { userService } from '../../services/db';
import { SecurityModal } from '../../components/common/SecurityModal';
import { toast } from 'react-hot-toast';
import './SuperAdmin.css';

type UserFilter = 'all' | 'active' | 'blocked' | 'admin';

export function SuperAdminUsers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'ban' | 'admin', userId: string, value: boolean } | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionSuccess = async () => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'admin') {
                await userService.toggleSuperAdmin(pendingAction.userId, pendingAction.value);
                toast.success('Эрх шинэчлэгдлээ');
            } else {
                await userService.toggleUserStatus(pendingAction.userId, pendingAction.value);
                toast.success(pendingAction.value ? 'Хэрэглэгчийг блоклов' : 'Хэрэглэгчийг нээв');
            }
            await loadUsers();
            setShowSecurityModal(false);
            setPendingAction(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const heroStats = useMemo(() => {
        const active = users.filter(u => !u.isDisabled).length;
        const blocked = users.filter(u => u.isDisabled).length;
        const admins = users.filter(u => u.isSuperAdmin).length;
        return { total: users.length, active, blocked, admins };
    }, [users]);

    const filtered = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.phone?.includes(searchTerm);
            let matchesFilter = true;
            if (activeFilter === 'active') matchesFilter = !u.isDisabled;
            else if (activeFilter === 'blocked') matchesFilter = !!u.isDisabled;
            else if (activeFilter === 'admin') matchesFilter = !!u.isSuperAdmin;
            return matchesSearch && matchesFilter;
        });
    }, [users, searchTerm, activeFilter]);

    const filterTabs: { id: UserFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'Бүгд', count: heroStats.total },
        { id: 'active', label: 'Идэвхтэй', count: heroStats.active, icon: <CheckCircle2 size={12} /> },
        { id: 'blocked', label: 'Блоклосон', count: heroStats.blocked, icon: <Ban size={12} /> },
        { id: 'admin', label: 'Админ', count: heroStats.admins, icon: <Crown size={12} /> },
    ];

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 50%, #10b981 100%)', boxShadow: '0 8px 32px rgba(5, 150, 105, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><Users size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Хэрэглэгчийн удирдлага</div>
                            <h1 className="sa-hero-title">Хэрэглэгчид</h1>
                            <div className="sa-hero-desc">Нийт {users.length} хэрэглэгч бүртгэлтэй</div>
                        </div>
                    </div>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.total}</div>
                        <div className="sa-hero-stat-label">Нийт хэрэглэгч</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.active}</div>
                        <div className="sa-hero-stat-label">Идэвхтэй</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.blocked}</div>
                        <div className="sa-hero-stat-label">Блоклосон</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.admins}</div>
                        <div className="sa-hero-stat-label">Super Admin</div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-bar-premium" style={{ maxWidth: 400 }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Нэр, и-мэйл эсвэл утсаар хайх..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 20,
                                border: activeFilter === tab.id ? '1.5px solid var(--primary)' : '1.5px solid var(--border-primary)',
                                background: activeFilter === tab.id ? 'var(--primary)' : 'var(--surface-1)',
                                color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label} <span style={{
                                background: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-soft)',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card no-padding overflow-hidden">
                <table className="super-table">
                    <thead>
                        <tr>
                            <th>Хэрэглэгч</th>
                            <th>Холбоо барих</th>
                            <th>Бизнесүүд</th>
                            <th>Систем эрх</th>
                            <th>Төлөв</th>
                            <th>Хийх</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Уншиж байна...</td></tr>
                        ) : filtered.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} alt={u.displayName} />
                                            ) : (
                                                <UserCircle size={24} className="text-tertiary" />
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name" style={{ fontWeight: 700 }}>{u.displayName || 'Нэргүй'}</div>
                                            <div className="user-id">UID: {u.id.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="contact-info">
                                        <div className="contact-item">
                                            <Mail size={12} /> {u.email || '—'}
                                        </div>
                                        <div className="contact-item">
                                            <Phone size={12} /> {u.phone || '—'}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                                        background: 'var(--primary-tint)', color: 'var(--primary)', border: '1px solid var(--primary-light)',
                                    }}>
                                        {u.businessIds?.length || 0} бизнес
                                    </span>
                                </td>
                                <td>
                                    {u.isSuperAdmin ? (
                                        <span className="badge badge-primary">
                                            <Shield size={12} /> Super Admin
                                        </span>
                                    ) : (
                                        <span className="text-tertiary" style={{ fontSize: '0.85rem' }}>Regular User</span>
                                    )}
                                </td>
                                <td>
                                    {u.isDisabled ? (
                                        <span className="badge badge-danger">
                                            <Ban size={12} /> Blocked
                                        </span>
                                    ) : (
                                        <span className="badge badge-delivered">
                                            <CheckCircle2 size={12} /> Active
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap' }}>
                                        <button
                                            className={`btn-icon ${u.isSuperAdmin ? 'text-primary' : ''}`}
                                            title={u.isSuperAdmin ? "Эрх хасах" : "Super Admin эрх олгох"}
                                            onClick={() => {
                                                setPendingAction({ type: 'admin', userId: u.id, value: !u.isSuperAdmin });
                                                setShowSecurityModal(true);
                                            }}
                                            style={{ width: 32, height: 32, minWidth: 32 }}
                                        >
                                            <Shield size={14} />
                                        </button>
                                        <button
                                            className={`btn-icon ${u.isDisabled ? '' : 'text-danger'}`}
                                            title={u.isDisabled ? "Блок гаргах" : "Блок хийх"}
                                            onClick={() => {
                                                setPendingAction({ type: 'ban', userId: u.id, value: !u.isDisabled });
                                                setShowSecurityModal(true);
                                            }}
                                            style={{ width: 32, height: 32, minWidth: 32 }}
                                        >
                                            <Ban size={14} />
                                        </button>
                                        <button className="btn-icon" style={{ width: 32, height: 32, minWidth: 32 }}>
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={handleActionSuccess}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setPendingAction(null);
                    }}
                />
            )}
        </div>
    );
}
