import { useState, useEffect } from 'react';
import {
    Search,
    MoreVertical,
    Mail,
    Phone,
    Shield,
    CheckCircle2,
    Ban,
    UserCircle
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { userService } from '../../services/db';
import { Header } from '../../components/layout/Header';
import { SecurityModal } from '../../components/common/SecurityModal';
import { toast } from 'react-hot-toast';
import './SuperAdmin.css';

export function SuperAdminUsers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    );

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Хэрэглэгчийн удирдлага"
                subtitle={`Нийт ${users.length} хэрэглэгч бүртгэлтэй байна`}
            />

            <div className="page-content">
                <div className="table-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Нэр, и-мэйл эсвэл утсаар хайх..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

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
                                                <div className="user-name">{u.displayName || 'Нэргүй'}</div>
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
                                        <span className="count-badge">
                                            {u.businessIds?.length || 0} бизнес
                                        </span>
                                    </td>
                                    <td>
                                        {u.isSuperAdmin ? (
                                            <span className="badge badge-primary">
                                                <Shield size={12} /> Super Admin
                                            </span>
                                        ) : (
                                            <span className="text-tertiary">Regular User</span>
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
                                        <div className="row-actions">
                                            <button
                                                className={`btn-icon ${u.isSuperAdmin ? 'text-primary' : ''}`}
                                                title={u.isSuperAdmin ? "Эрх хасах" : "Super Admin эрх олгох"}
                                                onClick={() => {
                                                    setPendingAction({ type: 'admin', userId: u.id, value: !u.isSuperAdmin });
                                                    setShowSecurityModal(true);
                                                }}
                                            >
                                                <Shield size={16} />
                                            </button>
                                            <button
                                                className={`btn-icon ${u.isDisabled ? '' : 'text-danger'}`}
                                                title={u.isDisabled ? "Блок гаргах" : "Блок хийх"}
                                                onClick={() => {
                                                    setPendingAction({ type: 'ban', userId: u.id, value: !u.isDisabled });
                                                    setShowSecurityModal(true);
                                                }}
                                            >
                                                <Ban size={16} />
                                            </button>
                                            <button className="btn-icon">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
