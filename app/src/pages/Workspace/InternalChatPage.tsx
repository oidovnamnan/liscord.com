import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { MessageCircle, Search, Users, Hash } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const CHANNEL_FIELDS: CrudField[] = [
    { name: 'name', label: 'Суваг', type: 'text', required: true, placeholder: '#ерөнхий' },
    { name: 'description', label: 'Тайлбар', type: 'text' },
    {
        name: 'type', label: 'Төрөл', type: 'select', defaultValue: 'public', options: [
            { value: 'public', label: 'Нээлттэй' }, { value: 'private', label: 'Хаалттай' }, { value: 'direct', label: 'Шууд' },
        ]
    },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
];
export function InternalChatPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [channels, setChannels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/chatChannels`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Дотоод Чат" action={{ label: '+ Суваг', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                    {loading ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        channels.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><MessageCircle size={48} color="var(--text-muted)" /><h3>Суваг байхгүй</h3></div> :
                            channels.map(c => (
                                <div key={c.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, opacity: c.isActive === false ? 0.5 : 1 }} onClick={() => { setEditingItem(c); setShowModal(true); }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={20} color="var(--primary)" /></div>
                                    <div><h4 style={{ margin: 0 }}>{c.name}</h4>{c.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>}</div>
                                    <span className={`badge ${c.type === 'private' ? 'badge-warning' : 'badge-success'}`} style={{ marginLeft: 'auto' }}>{c.type === 'private' ? '🔒 Хаалттай' : c.type === 'direct' ? 'Шууд' : 'Нээлттэй'}</span>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Чат суваг" icon={<MessageCircle size={20} />} collectionPath="businesses/{bizId}/chatChannels" fields={CHANNEL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
