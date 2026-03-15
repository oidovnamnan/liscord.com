import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Flag, CheckCircle2, Circle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const MS_FIELDS: CrudField[] = [
    { name: 'title', label: 'Чухал үе шат', type: 'text', required: true, span: 2 },
    { name: 'project', label: 'Төсөл', type: 'text' },
    { name: 'dueDate', label: 'Хугацаа', type: 'date', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'in_progress', label: 'Явагдаж буй' }, { value: 'completed', label: 'Дууссан' }, { value: 'overdue', label: 'Хоцорсон' },
        ]
    },
    { name: 'assignee', label: 'Хариуцагч', type: 'text' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];
export function MilestonesPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/milestones`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Flag size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Чухал Үе Шат</h3>
                            <div className="fds-hero-desc">Төслийн чухал цэгүүд</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Milestone
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>{loading ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><Flag size={48} color="var(--text-muted)" /><h3>Milestone олдсонгүй</h3></div> : items.map(i => (
                <div key={i.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, borderLeft: i.status === 'completed' ? '4px solid #2ecc71' : i.status === 'overdue' ? '4px solid #e74c3c' : '4px solid #f39c12' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                    {i.status === 'completed' ? <CheckCircle2 size={24} color="#2ecc71" /> : <Circle size={24} color={i.status === 'overdue' ? '#e74c3c' : '#f39c12'} />}
                    <div style={{ flex: 1 }}><h4 style={{ margin: 0 }}>{i.title}</h4><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.project || ''} • {i.dueDate || '-'} • {i.assignee || ''}</div></div>
                    <span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'overdue' ? 'badge-danger' : i.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'overdue' ? 'Хоцорсон' : i.status === 'in_progress' ? 'Явагдаж буй' : 'Хүлээгдэж буй'}</span>
                </div>))}</div>
        </div>{showModal && <GenericCrudModal title="Milestone" icon={<Flag size={20} />} collectionPath="businesses/{bizId}/milestones" fields={MS_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
