import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { GraduationCap, BookOpen, CheckCircle2, Clock, Award } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const TRAINING_FIELDS: CrudField[] = [
    { name: 'title', label: 'Сургалтын нэр', type: 'text', required: true, span: 2 },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'onboarding', label: 'Шинэ ажилтан' },
            { value: 'technical', label: 'Техникийн' },
            { value: 'soft-skills', label: 'Зөөлөн ур чадвар' },
            { value: 'safety', label: 'Аюулгүй ажиллагаа' },
            { value: 'compliance', label: 'Дүрэм журам' },
            { value: 'certification', label: 'Гэрчилгээ' },
        ]
    },
    { name: 'instructor', label: 'Сургагч', type: 'text' },
    { name: 'duration', label: 'Хугацаа (цаг)', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'planned', options: [
            { value: 'planned', label: 'Төлөвлөсөн' },
            { value: 'in_progress', label: 'Явагдаж буй' },
            { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'maxParticipants', label: 'Хамрагдах хүн', type: 'number' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function TrainingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [trainings, setTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/trainings`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTrainings(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success"><CheckCircle2 size={12} /> Дууссан</span>;
            case 'in_progress': return <span className="badge badge-info"><Clock size={12} /> Явагдаж буй</span>;
            default: return <span className="badge badge-warning"><Clock size={12} /> Төлөвлөсөн</span>;
        }
    };

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header title="Сургалт & Хөгжил" action={{ label: '+ Сургалт нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : trainings.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
                            <GraduationCap size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Сургалт бүртгэгдээгүй</h3>
                            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ marginTop: 16 }}>Эхний сургалтаа нэмэх</button>
                        </div>
                    ) : (
                        trainings.map(t => (
                            <div key={t.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(t); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    {getStatusBadge(t.status)}
                                    {t.category === 'certification' && <Award size={18} color="#f1c40f" />}
                                </div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{t.title}</h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {t.instructor && <span><BookOpen size={12} /> {t.instructor}</span>}
                                    {t.duration && <span><Clock size={12} /> {t.duration}ц</span>}
                                    {t.date && <span>{t.date}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Сургалт" icon={<GraduationCap size={20} />} collectionPath="businesses/{bizId}/trainings" fields={TRAINING_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
