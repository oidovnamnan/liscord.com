import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { FileText, Search, Folder, Clock, Star, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const DOC_FIELDS: CrudField[] = [
    { name: 'title', label: 'Баримтын нэр', type: 'text', required: true, span: 2 },
    {
        name: 'category', label: 'Ангилал', type: 'select', options: [
            { value: 'contract', label: '📄 Гэрээ' },
            { value: 'policy', label: '📋 Дотоод журам' },
            { value: 'report', label: '📊 Тайлан' },
            { value: 'template', label: '📝 Загвар' },
            { value: 'hr', label: '👤 Хүний нөөц' },
            { value: 'finance', label: '💰 Санхүү' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'published', label: 'Нийтлэгдсэн' },
            { value: 'archived', label: 'Архивласан' },
        ]
    },
    { name: 'isImportant', label: 'Чухал', type: 'toggle' },
    { name: 'content', label: 'Агуулга / Тэмдэглэл', type: 'textarea', span: 2 },
];

export function DocumentsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/documents`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = docs.filter(d => (d.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Баримт бичиг" action={{ label: '+ Шинэ баримт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ margin: '20px 0' }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Баримт хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Нэр</th><th>Ангилал</th><th>Төлөв</th><th></th></tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Баримт олдсонгүй</td></tr>
                                ) : (
                                    filtered.map(d => (
                                        <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(d); setShowModal(true); }}>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{d.isImportant ? <Star size={14} fill="#f1c40f" color="#f1c40f" /> : <FileText size={14} />}<span style={{ fontWeight: 600 }}>{d.title}</span></div></td>
                                            <td><span className="badge">{d.category || 'Бусад'}</span></td>
                                            <td><span className={`badge ${d.status === 'published' ? 'badge-success' : d.status === 'archived' ? 'badge-soft' : ''}`}>{d.status === 'published' ? 'Нийтлэгдсэн' : d.status === 'archived' ? 'Архивласан' : 'Ноорог'}</span></td>
                                            <td><button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(d); setShowModal(true); }}><Edit2 size={16} /></button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Баримт бичиг" icon={<FileText size={20} />} collectionPath="businesses/{bizId}/documents" fields={DOC_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
