import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { ClipboardList, BarChart2, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const SURVEY_FIELDS: CrudField[] = [
    { name: 'title', label: 'Судалгааны нэр', type: 'text', required: true, span: 2 },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'satisfaction', label: 'Сэтгэл ханамж' },
            { value: 'engagement', label: 'Оролцоо' },
            { value: 'feedback', label: 'Санал хүсэлт' },
            { value: 'exit', label: 'Гарах үеийн' },
            { value: 'pulse', label: 'Хурдан судалгаа' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'active', label: 'Явагдаж буй' },
            { value: 'closed', label: 'Хаагдсан' },
        ]
    },
    {
        name: 'targetAudience', label: 'Хамрагдагсад', type: 'select', options: [
            { value: 'all', label: 'Бүх ажилтан' },
            { value: 'department', label: 'Хэлтэс' },
            { value: 'management', label: 'Удирдлага' },
        ]
    },
    { name: 'deadline', label: 'Хугацаа', type: 'date' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function SurveysPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/surveys`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setSurveys(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header title="Дотоод Судалгаа" action={{ label: '+ Судалгаа', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        surveys.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><ClipboardList size={48} color="var(--text-muted)" /><h3>Судалгаа байхгүй</h3><button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>Эхлэх</button></div> :
                            surveys.map(s => (
                                <div key={s.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(s); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'closed' ? 'badge-soft' : ''}`}>{s.status === 'active' ? 'Явагдаж буй' : s.status === 'closed' ? 'Хаагдсан' : 'Ноорог'}</span>
                                        <BarChart2 size={18} color="var(--primary)" />
                                    </div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>{s.title}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.type || 'Судалгаа'} • {s.targetAudience || 'Бүгд'}</div>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Судалгаа" icon={<ClipboardList size={20} />} collectionPath="businesses/{bizId}/surveys" fields={SURVEY_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
