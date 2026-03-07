import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Video, Users, Clock, Link } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const MEETING_FIELDS: CrudField[] = [
    { name: 'title', label: 'Хурлын нэр', type: 'text', required: true, span: 2 },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'time', label: 'Цаг', type: 'text', placeholder: '14:00' },
    { name: 'duration', label: 'Хугацаа (мин)', type: 'number', defaultValue: '30' },
    { name: 'meetingLink', label: 'Линк', type: 'text', placeholder: 'https://meet.google.com/...' },
    { name: 'participants', label: 'Оролцогчид', type: 'text', span: 2 },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function VideoMeetingsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/meetings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Видео Хурал" action={{ label: '+ Хурал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                    {loading ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        meetings.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><Video size={48} color="var(--text-muted)" /><h3>Хурал байхгүй</h3></div> :
                            meetings.map(m => (
                                <div key={m.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(m); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><h3 style={{ margin: 0, fontSize: '1.05rem' }}>{m.title}</h3><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 16 }}><span><Clock size={12} /> {m.date} {m.time || ''}</span><span>{m.duration || 30} мин</span>{m.participants && <span><Users size={12} /> {m.participants}</span>}</div></div>
                                        {m.meetingLink && <a href={m.meetingLink} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontSize: '0.85rem', textDecoration: 'none' }}>Нэгдэх</a>}
                                    </div>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Видео хурал" icon={<Video size={20} />} collectionPath="businesses/{bizId}/meetings" fields={MEETING_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
