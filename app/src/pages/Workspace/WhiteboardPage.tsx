import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { PenLine, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const WB_FIELDS: CrudField[] = [
    { name: 'title', label: 'Нэр', type: 'text', required: true, span: 2 },
    {
        name: 'category', label: 'Ангилал', type: 'select', options: [
            { value: 'brainstorm', label: '💡 Brainstorm' }, { value: 'wireframe', label: '📐 Wireframe' },
            { value: 'diagram', label: '📊 Диаграм' }, { value: 'meeting', label: '🤝 Хурал' }, { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'participants', label: 'Оролцогчид', type: 'text' },
    { name: 'content', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function WhiteboardPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [boards, setBoards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/whiteboards`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setBoards(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Цагаан Самбар" action={{ label: '+ Шинэ самбар', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        boards.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><PenLine size={48} color="var(--text-muted)" /><h3>Самбар олдсонгүй</h3></div> :
                            boards.map(b => (
                                <div key={b.id} className="card" style={{ padding: 20, cursor: 'pointer', minHeight: 120 }} onClick={() => { setEditingItem(b); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span className="badge">{b.category || 'Бусад'}</span></div>
                                    <h4 style={{ margin: '0 0 8px' }}>{b.title}</h4>
                                    {b.participants && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><Users size={12} /> {b.participants}</div>}
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Цагаан самбар" icon={<PenLine size={20} />} collectionPath="businesses/{bizId}/whiteboards" fields={WB_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
