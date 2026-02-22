import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Clock,
    Lock,
    ExternalLink
} from 'lucide-react';
import { businessService } from '../../services/db';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore, useBusinessStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './SuperAdmin.css';

export function SuperAdminBusinesses() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, setImpersonatedBusinessId } = useAuthStore();
    const { setBusiness, setEmployee } = useBusinessStore();
    const navigate = useNavigate();

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        try {
            const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setBusinesses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (biz: any) => {
        if (!user) return;
        try {
            toast.loading(`${biz.name} рүү нэвтэрч байна...`);
            const [bizData, empData] = await Promise.all([
                businessService.getBusiness(biz.id),
                businessService.getEmployeeProfile(biz.id, biz.ownerId) // Impersonate as owner
            ]);

            setImpersonatedBusinessId(biz.id);
            setBusiness(bizData);
            setEmployee(empData);

            toast.dismiss();
            navigate('/app');
            toast.success(`Та ${biz.name} бизнесийг хянаж байна`);
        } catch (error) {
            toast.error('Нэвтрэхэд алдаа гарлаа');
        }
    };

    const filtered = businesses.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="super-admin-page">
            <header className="super-header">
                <div>
                    <h1 className="page-title">🏢 Бизнесийн удирдлага</h1>
                    <p className="text-secondary">Нийт {businesses.length} бизнес бүртгэлтэй байна</p>
                </div>
            </header>

            <div className="table-actions">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Бизнес эсвэл эзэмшигч хайх..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-secondary">
                    <Filter size={18} /> Шүүлтүүр
                </button>
            </div>

            <div className="card no-padding overflow-hidden">
                <table className="super-table">
                    <thead>
                        <tr>
                            <th>Бизнес</th>
                            <th>Ангилал</th>
                            <th>Эзэмшигч</th>
                            <th>Төлөвлөгөө</th>
                            <th>Захиалга</th>
                            <th>Үүссэн</th>
                            <th>Төлөв</th>
                            <th>Хийх</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8">Уншиж байна...</td></tr>
                        ) : filtered.map(biz => (
                            <tr key={biz.id}>
                                <td>
                                    <div className="biz-cell">
                                        <div className="biz-avatar">{biz.name?.charAt(0)}</div>
                                        <div className="biz-info">
                                            <div className="biz-name">{biz.name}</div>
                                            <div className="biz-id">{biz.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="category-tag">
                                        {biz.category}
                                    </span>
                                </td>
                                <td>{biz.ownerName || 'Тодорхойгүй'}</td>
                                <td>
                                    <span className={`plan-tag ${biz.subscription?.plan}`}>
                                        {biz.subscription?.plan?.toUpperCase()}
                                    </span>
                                </td>
                                <td>{biz.stats?.totalOrders || 0}</td>
                                <td>
                                    <div className="date-cell">
                                        <Clock size={14} />
                                        {biz.createdAt?.toDate ? biz.createdAt.toDate().toLocaleDateString() : '—'}
                                    </div>
                                </td>
                                <td>
                                    <span className="status-badge active">Идэвхтэй</span>
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <button
                                            className="btn-icon"
                                            title="Нэвтэрч орох"
                                            onClick={() => handleImpersonate(biz)}
                                        >
                                            <Lock size={16} />
                                        </button>
                                        <button className="btn-icon" title="Засах">
                                            <ExternalLink size={16} />
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
    );
}
