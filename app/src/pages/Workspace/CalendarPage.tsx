import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const CAL_FIELDS: CrudField[] = [
    { name: 'title', label: 'Үйл явдал', type: 'text', required: true, span: 2 },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'time', label: 'Цаг', type: 'text', placeholder: '09:00' },
    { name: 'endTime', label: 'Дуусах', type: 'text', placeholder: '10:00' },
    { name: 'location', label: 'Байршил', type: 'text' },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'meeting', label: '🤝 Хурал' }, { value: 'event', label: '🎉 Арга хэмжээ' }, { value: 'deadline', label: '⏰ Дэдлайн' },
            { value: 'reminder', label: '📌 Сануулга' }, { value: 'holiday', label: '🏖 Амралт' },
        ]
    },
    { name: 'participants', label: 'Оролцогчид', type: 'text' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];
export function CalendarPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/calendarEvents`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Хуанли" action={{ label: '+ Үйл явдал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                    {loading ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        events.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><CalendarDays size={48} color="var(--text-muted)" /><h3>Үйл явдал олдсонгүй</h3></div> :
                            events.map(e => (
                                <div key={e.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, borderLeft: e.type === 'deadline' ? '4px solid #e74c3c' : e.type === 'meeting' ? '4px solid #3498db' : 'none' }} onClick={() => { setEditingItem(e); setShowModal(true); }}>
                                    <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{e.date?.split('-')[2] || ''}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.date?.substring(0, 7) || ''}</div></div>
                                    <div style={{ flex: 1 }}><h4 style={{ margin: '0 0 4px' }}>{e.title}</h4><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>{e.time && <span><Clock size={12} /> {e.time}{e.endTime ? '-' + e.endTime : ''}</span>}{e.location && <span><MapPin size={12} /> {e.location}</span>}{e.participants && <span><Users size={12} /> {e.participants}</span>}</div></div>
                                    <span className="badge">{e.type || 'Бусад'}</span>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Үйл явдал" icon={<CalendarDays size={20} />} collectionPath="businesses/{bizId}/calendarEvents" fields={CAL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
