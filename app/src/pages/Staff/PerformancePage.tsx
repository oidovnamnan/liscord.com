import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Target, Star } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const PERFORMANCE_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтны нэр', type: 'text', required: true },
    {
        name: 'period', label: 'Хугацаа', type: 'select', required: true, options: [
            { value: 'q1', label: 'Q1 (1-3 сар)' },
            { value: 'q2', label: 'Q2 (4-6 сар)' },
            { value: 'q3', label: 'Q3 (7-9 сар)' },
            { value: 'q4', label: 'Q4 (10-12 сар)' },
            { value: 'annual', label: 'Жилийн' },
        ]
    },
    { name: 'rating', label: 'Үнэлгээ (1-5)', type: 'number', required: true },
    { name: 'kpiScore', label: 'KPI оноо', type: 'number' },
    { name: 'strengths', label: 'Давуу тал', type: 'textarea' },
    { name: 'improvements', label: 'Сайжруулах', type: 'textarea' },
    { name: 'goals', label: 'Дараагийн зорилго', type: 'textarea', span: 2 },
];

export function PerformancePage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses / ${business.id}/performanceReviews`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const renderStars = (n: number) => Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < n ? '#f1c40f' : 'none'} color={i < n ? '#f1c40f' : '#ccc'} />);

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <Header title="Гүйцэтгэлийн Үнэлгээ" action={{ label: '+ Үнэлгээ', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Ажилтан</th><th>Хугацаа</th><th>Үнэлгээ</th><th>KPI</th><th>Давуу тал</th></tr></thead>
                            <tbody>
                                {reviews.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Үнэлгээ олдсонгүй</td></tr>
                                ) : (
                                    reviews.map(r => (
                                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(r); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>{r.employeeName}</td>
                                            <td>{r.period || '-'}</td>
                                            <td><div style={{ display: 'flex', gap: 2 }}>{renderStars(r.rating || 0)}</div></td>
                                            <td style={{ fontWeight: 700 }}>{r.kpiScore || '-'}</td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.strengths || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Гүйцэтгэлийн үнэлгээ" icon={<Target size={20} />} collectionPath="businesses/{bizId}/performanceReviews" fields={PERFORMANCE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
