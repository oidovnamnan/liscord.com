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
import { Header } from '../../components/layout/Header';
import './SuperAdmin.css';

export function SuperAdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                                        <span className="badge badge-delivered">
                                            <CheckCircle2 size={12} /> Active
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="btn-icon" title="Эрх засах">
                                                <Shield size={16} />
                                            </button>
                                            <button className="btn-icon text-danger" title="Блок хийх">
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
        </div>
    );
}
