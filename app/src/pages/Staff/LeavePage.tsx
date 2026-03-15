import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { CheckCircle2, XCircle, Clock, Search, User, CalendarDays, CalendarOff} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const LEAVE_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтны нэр', type: 'text', required: true },
    {
        name: 'type', label: 'Чөлөөний төрөл', type: 'select', required: true, options: [
            { value: 'annual', label: 'Ээлжийн амралт' },
            { value: 'sick', label: 'Өвчтэй' },
            { value: 'personal', label: 'Хувийн чөлөө' },
            { value: 'maternity', label: 'Жирэмсний амралт' },
            { value: 'unpaid', label: 'Цалингүй чөлөө' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'startDate', label: 'Эхлэх', type: 'date', required: true },
    { name: 'endDate', label: 'Дуусах', type: 'date', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
        ]
    },
    { name: 'reason', label: 'Шалтгаан', type: 'textarea', span: 2 },
];

export function LeavePage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/leaves`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="badge badge-success"><CheckCircle2 size={12} /> Зөвшөөрсөн</span>;
            case 'rejected': return <span className="badge badge-danger"><XCircle size={12} /> Татгалзсан</span>;
            default: return <span className="badge badge-warning"><Clock size={12} /> Хүлээгдэж буй</span>;
        }
    };

    const filtered = leaves.filter(l => (l.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><CalendarOff size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Чөлөө</h3>
                            <div className="fds-hero-desc">Чөлөөний удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Хүсэлт
                    </button>
                </div>
            </div>
                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Ажилтны нэрээр хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Ажилтан</th><th>Төрөл</th><th>Огноо</th><th>Шалтгаан</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Хүсэлт олдсонгүй</td></tr>
                                ) : (
                                    filtered.map(l => (
                                        <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(l); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}><User size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{l.employeeName}</td>
                                            <td>{l.type || '-'}</td>
                                            <td>{l.startDate || '-'} → {l.endDate || '-'}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '-'}</td>
                                            <td>{getStatusBadge(l.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Чөлөө / Амралт" icon={<CalendarDays size={20} />} collectionPath="businesses/{bizId}/leaves" fields={LEAVE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
