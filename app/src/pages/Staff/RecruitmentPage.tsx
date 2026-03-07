import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { UserPlus, Briefcase } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const RECRUITMENT_FIELDS: CrudField[] = [
    { name: 'position', label: 'Албан тушаал', type: 'text', required: true, placeholder: 'Менежер, Дизайнер гэх мэт' },
    { name: 'department', label: 'Хэлтэс', type: 'text', placeholder: 'Маркетинг' },
    { name: 'openings', label: 'Орон тоо', type: 'number', defaultValue: '1' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'open', options: [
            { value: 'open', label: 'Нээлттэй' },
            { value: 'interviewing', label: 'Ярилцлага' },
            { value: 'offered', label: 'Санал тавьсан' },
            { value: 'filled', label: 'Бөглөгдсөн' },
            { value: 'closed', label: 'Хаагдсан' },
        ]
    },
    { name: 'salaryRange', label: 'Цалингийн хүрээ', type: 'text', placeholder: '1.5M - 2.5M' },
    { name: 'deadline', label: 'Эцсийн хугацаа', type: 'date' },
    { name: 'requirements', label: 'Шаардлага', type: 'textarea', span: 2 },
];

export function RecruitmentPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/recruitment`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className="badge badge-success">Нээлттэй</span>;
            case 'interviewing': return <span className="badge badge-info">Ярилцлага</span>;
            case 'offered': return <span className="badge badge-warning">Санал тавьсан</span>;
            case 'filled': return <span className="badge badge-soft">Бөглөгдсөн</span>;
            case 'closed': return <span className="badge">Хаагдсан</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <Header title="Ажилд авах" action={{ label: '+ Шинэ зар', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Албан тушаал</th><th>Хэлтэс</th><th>Орон тоо</th><th>Цалин</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {jobs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Зар олдсонгүй</td></tr>
                                ) : (
                                    jobs.map(j => (
                                        <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(j); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}><Briefcase size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{j.position}</td>
                                            <td>{j.department || '-'}</td>
                                            <td>{j.openings || 1}</td>
                                            <td>{j.salaryRange || '-'}</td>
                                            <td>{getStatusBadge(j.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Ажилд авах зар" icon={<UserPlus size={20} />} collectionPath="businesses/{bizId}/recruitment" fields={RECRUITMENT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
