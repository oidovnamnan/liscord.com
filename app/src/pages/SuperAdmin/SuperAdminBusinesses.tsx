import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    Clock,
    Lock
} from 'lucide-react';
import { businessService } from '../../services/db';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuthStore, useBusinessStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

export function SuperAdminBusinesses() {
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, setImpersonatedBusinessId } = useAuthStore();
    const { setBusiness, setEmployee } = useBusinessStore();
    const navigate = useNavigate();
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [selectedBiz, setSelectedBiz] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showDisabled, setShowDisabled] = useState(true);
    const [bulkSaving, setBulkSaving] = useState(false);

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

    const handleToggleStatus = async (biz: any) => {
        try {
            await businessService.toggleBusinessStatus(biz.id, !biz.isDisabled);
            toast.success(biz.isDisabled ? 'Бизнесийг идэвхжүүллээ' : 'Бизнесийг зогсоолоо');
            loadBusinesses();
        } catch (error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleBulkToggle = async (isDisabled: boolean) => {
        if (selectedIds.length === 0) return;
        setBulkSaving(true);
        try {
            await businessService.bulkToggleBusinesses(selectedIds, isDisabled);
            toast.success(`${selectedIds.length} бизнесийн төлөв шинэчлэгдлээ`);
            setSelectedIds([]);
            loadBusinesses();
        } catch (error) {
            toast.error('Үйлдэл амжилтгүй');
        } finally {
            setBulkSaving(false);
        }
    };

    const handleImpersonateClick = (biz: any) => {
        setSelectedBiz(biz);
        setShowSecurityModal(true);
    };

    const handleImpersonate = async () => {
        if (!user || !selectedBiz) return;
        setShowSecurityModal(false);
        const biz = selectedBiz;

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
            toast.dismiss();
            toast.error('Нэвтрэхэд алдаа гарлаа');
        } finally {
            setSelectedBiz(null);
        }
    };

    const filtered = businesses.filter(b => {
        const matchesSearch = b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showDisabled ? true : !b.isDisabled;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Бизнесийн удирдлага"
                subtitle={`Нийт ${businesses.length} бизнес бүртгэлтэй байна`}
            />

            <div className="page-content">
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
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold opacity-30 uppercase">Бүх бизнес</span>
                            <label className="ios-switch">
                                <input
                                    type="checkbox"
                                    checked={showDisabled}
                                    onChange={() => setShowDisabled(!showDisabled)}
                                />
                                <span className="ios-slider"></span>
                            </label>
                        </div>
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-fade-in px-3 py-1.5 rounded-xl bg-surface-2 border border-primary/10">
                                <span className="text-secondary text-xs font-bold">{selectedIds.length} сонгосон:</span>
                                <button className="btn btn-outline btn-xs text-success" onClick={() => handleBulkToggle(false)} disabled={bulkSaving}>Нээх</button>
                                <button className="btn btn-outline btn-xs text-danger" onClick={() => handleBulkToggle(true)} disabled={bulkSaving}>Хаах</button>
                            </div>
                        )}
                        <button className="btn btn-secondary">
                            <Filter size={18} /> Шүүлтүүр
                        </button>
                    </div>
                </div>

                <div className="card no-padding overflow-hidden">
                    <table className="super-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(filtered.map(b => b.id));
                                            else setSelectedIds([]);
                                        }}
                                    />
                                </th>
                                <th>Бизнес</th>
                                <th>Ангилал</th>
                                <th>Эзэмшигч</th>
                                <th>Төлөвлөгөө</th>
                                <th>Захиалга</th>
                                <th>Үүссэн</th>
                                <th>Төлөв</th>
                                <th className="text-right">Үйлдэл</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8">Уншиж байна...</td></tr>
                            ) : filtered.map(biz => (
                                <tr key={biz.id} className={biz.isDisabled ? 'opacity-50' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(biz.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds([...selectedIds, biz.id]);
                                                else setSelectedIds(selectedIds.filter(id => id !== biz.id));
                                            }}
                                        />
                                    </td>
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
                                        <span className={`badge badge-${biz.subscription?.plan === 'pro' ? 'primary' : 'soft'}`}>
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
                                        <div className="flex items-center gap-2">
                                            <label className="ios-switch" title={biz.isDisabled ? 'Нээх' : 'Хаах'}>
                                                <input
                                                    type="checkbox"
                                                    checked={!biz.isDisabled}
                                                    onChange={() => handleToggleStatus(biz)}
                                                />
                                                <span className="ios-slider"></span>
                                            </label>
                                            <span className={`text-[10px] font-heavy uppercase ${biz.isDisabled ? 'text-danger' : 'text-success'}`}>
                                                {biz.isDisabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="row-actions justify-end">
                                            <button
                                                className="btn-icon"
                                                title="Нэвтэрч орох"
                                                onClick={() => handleImpersonateClick(biz)}
                                            >
                                                <Lock size={16} />
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
                    onSuccess={handleImpersonate}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setSelectedBiz(null);
                    }}
                    title="Бизнес рүү нэвтрэх"
                    description={`${selectedBiz?.name} бизнес рүү нэвтрэхийн тулд нууц үгээ оруулна уу.`}
                />
            )}
        </div>
    );
}
