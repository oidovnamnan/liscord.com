import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { CheckSquare, Circle, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const TASK_FIELDS: CrudField[] = [
    { name: 'title', label: 'Даалгавар', type: 'text', required: true, span: 2 },
    { name: 'assignee', label: 'Хариуцагч', type: 'text' },
    {
        name: 'priority', label: 'Ач холбогдол', type: 'select', options: [
            { value: 'low', label: '🟢 Бага' }, { value: 'medium', label: '🟡 Дунд' }, { value: 'high', label: '🟠 Өндөр' }, { value: 'urgent', label: '🔴 Яаралтай' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'todo', options: [
            { value: 'todo', label: 'Хийх' }, { value: 'in_progress', label: 'Явагдаж буй' }, { value: 'review', label: 'Шалгах' }, { value: 'done', label: 'Дууссан' },
        ]
    },
    { name: 'dueDate', label: 'Хугацаа', type: 'date' },
    { name: 'project', label: 'Төсөл', type: 'text' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];
export function TasksPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/tasks`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="Даалгаврууд" action={{ label: '+ Даалгавар', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>{loading ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><CheckSquare size={48} color="var(--text-muted)" /><h3>Даалгавар олдсонгүй</h3></div> : items.map(i => (
                <div key={i.id} className="card" style={{ padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                    {i.status === 'done' ? <CheckCircle2 size={20} color="#2ecc71" /> : <Circle size={20} color="var(--text-muted)" />}
                    <div style={{ flex: 1, textDecoration: i.status === 'done' ? 'line-through' : 'none' }}><div style={{ fontWeight: 600 }}>{i.title}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i.assignee || ''} {i.dueDate ? '• ' + i.dueDate : ''} {i.project ? '• ' + i.project : ''}</div></div>
                    <span className={`badge ${i.priority === 'urgent' ? 'badge-danger' : i.priority === 'high' ? 'badge-warning' : ''}`}>{i.priority || 'Дунд'}</span>
                    <span className={`badge ${i.status === 'done' ? 'badge-success' : i.status === 'in_progress' ? 'badge-info' : i.status === 'review' ? 'badge-warning' : ''}`}>{i.status === 'done' ? 'Дууссан' : i.status === 'in_progress' ? 'Явагдаж буй' : i.status === 'review' ? 'Шалгах' : 'Хийх'}</span>
                </div>))}</div>
        </div>{showModal && <GenericCrudModal title="Даалгавар" icon={<CheckSquare size={20} />} collectionPath="businesses/{bizId}/tasks" fields={TASK_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
