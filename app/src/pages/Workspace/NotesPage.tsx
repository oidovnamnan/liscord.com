import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { StickyNote, Search, Star } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const NOTE_FIELDS: CrudField[] = [
    { name: 'title', label: 'Гарчиг', type: 'text', required: true, span: 2 },
    {
        name: 'category', label: 'Хавтас', type: 'select', options: [
            { value: 'general', label: 'Ерөнхий' },
            { value: 'meeting', label: 'Хурал' },
            { value: 'idea', label: '💡 Санаа' },
            { value: 'todo', label: '✅ Хийх зүйлс' },
            { value: 'personal', label: 'Хувийн' },
        ]
    },
    { name: 'isStarred', label: 'Тэмдэглэсэн', type: 'toggle' },
    { name: 'content', label: 'Агуулга', type: 'textarea', required: true, span: 2 },
];

export function NotesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/notes`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = notes.filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.content || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Тэмдэглэл" action={{ label: '+ Шинэ', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ margin: '20px 0' }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Тэмдэглэл хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><StickyNote size={48} color="var(--text-muted)" /><h3>Тэмдэглэл олдсонгүй</h3></div>
                    ) : (
                        filtered.map(n => (
                            <div key={n.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(n); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span className="badge">{n.category || 'Ерөнхий'}</span>
                                    {n.isStarred && <Star size={16} fill="#f1c40f" color="#f1c40f" />}
                                </div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{n.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Тэмдэглэл" icon={<StickyNote size={20} />} collectionPath="businesses/{bizId}/notes" fields={NOTE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
