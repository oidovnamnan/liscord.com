import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { GanttChartSquare, GanttChart} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const GANTT_FIELDS: CrudField[] = [
    { name: 'taskName', label: 'Ажлын нэр', type: 'text', required: true, span: 2 },
    { name: 'project', label: 'Төсөл', type: 'text' },
    { name: 'assignee', label: 'Хариуцагч', type: 'text' },
    { name: 'startDate', label: 'Эхлэх', type: 'date', required: true },
    { name: 'endDate', label: 'Дуусах', type: 'date', required: true },
    { name: 'progress', label: 'Ахиц (%)', type: 'number', defaultValue: '0' },
    { name: 'dependency', label: 'Хамаарал', type: 'text', placeholder: 'Өмнөх ажлын нэр' },
    {
        name: 'priority', label: 'Ач холбогдол', type: 'select', options: [
            { value: 'low', label: 'Бага' }, { value: 'medium', label: 'Дунд' }, { value: 'high', label: 'Өндөр' },
        ]
    },
];
export function GanttChartPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/ganttTasks`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><GanttChart size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Ганнт Диаграм</h3>
                            <div className="fds-hero-desc">Төслийн цаг хугацааны диаграм</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Ажил
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Ажил</th><th>Төсөл</th><th>Хариуцагч</th><th>Эхлэх</th><th>Дуусах</th><th>Ахиц</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.taskName}</td><td>{i.project || '-'}</td><td>{i.assignee || '-'}</td><td>{i.startDate || '-'}</td><td>{i.endDate || '-'}</td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-hover)' }}><div style={{ height: '100%', width: `${i.progress || 0}%`, background: (i.progress || 0) === 100 ? '#2ecc71' : 'var(--primary)', borderRadius: 3 }} /></div><span style={{ fontSize: '0.8rem' }}>{i.progress || 0}%</span></div></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Гант ажил" icon={<GanttChartSquare size={20} />} collectionPath="businesses/{bizId}/ganttTasks" fields={GANTT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
