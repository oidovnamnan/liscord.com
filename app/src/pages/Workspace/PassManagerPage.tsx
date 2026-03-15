import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { KeyRound, Search } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const PASS_FIELDS: CrudField[] = [
    { name: 'title', label: 'Нэр', type: 'text', required: true, placeholder: 'Facebook бизнес аккаунт' },
    {
        name: 'category', label: 'Ангилал', type: 'select', options: [
            { value: 'social', label: '📱 Сошиал' }, { value: 'bank', label: '🏦 Банк' }, { value: 'email', label: '📧 И-мэйл' },
            { value: 'website', label: '🌐 Вебсайт' }, { value: 'system', label: '💻 Систем' }, { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'username', label: 'Хэрэглэгчийн нэр', type: 'text' },
    { name: 'password', label: 'Нууц үг', type: 'text' },
    { name: 'url', label: 'URL', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function PassManagerPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [search, setSearch] = useState('');
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/passwords`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    const filtered = items.filter(i => (i.title || '').toLowerCase().includes(search.toLowerCase()));
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><KeyRound size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Нууц Үг</h3>
                            <div className="fds-hero-desc">Нууц үгийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Нэмэх
                    </button>
                </div>
            </div>
                <div style={{ margin: '20px 0' }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Хайх..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        filtered.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><KeyRound size={48} color="var(--text-muted)" /><h3>Нууц үг олдсонгүй</h3></div> :
                            filtered.map(i => (
                                <div key={i.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span className="badge">{i.category || 'Бусад'}</span><KeyRound size={16} color="var(--primary)" /></div>
                                    <h4 style={{ margin: '0 0 4px' }}>{i.title}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i.username || ''}</div>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Нууц үг" icon={<KeyRound size={20} />} collectionPath="businesses/{bizId}/passwords" fields={PASS_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
