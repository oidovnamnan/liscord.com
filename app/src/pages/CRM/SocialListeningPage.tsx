import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Radio, MessageSquare, TrendingUp, Eye, ThumbsUp } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const SOCIAL_FIELDS: CrudField[] = [
    { name: 'keyword', label: 'Түлхүүр үг', type: 'text', required: true, span: 2 },
    {
        name: 'platform', label: 'Платформ', type: 'select', required: true, options: [
            { value: 'facebook', label: 'Facebook' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'twitter', label: 'Twitter/X' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'google', label: 'Google' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'sentiment', label: 'Хандлага', type: 'select', options: [
            { value: 'positive', label: '😊 Эерэг' },
            { value: 'neutral', label: '😐 Дунд' },
            { value: 'negative', label: '😞 Сөрөг' },
        ]
    },
    { name: 'mentions', label: 'Дурдалтын тоо', type: 'number' },
    { name: 'isActive', label: 'Идэвхтэй хянах', type: 'toggle', defaultValue: true },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function SocialListeningPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/socialListening`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="crm-hub">
            <div className="page-container animate-fade-in">
                <Header title="Сошиал Хяналт" action={{ label: '+ Түлхүүр үг', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        items.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Radio size={48} color="var(--text-muted)" /><h3>Түлхүүр үг нэмнэ үү</h3></div> :
                            items.map(i => (
                                <div key={i.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className="badge badge-info">{i.platform || 'Social'}</span>
                                        <span style={{ fontSize: '1.1rem' }}>{i.sentiment === 'positive' ? '😊' : i.sentiment === 'negative' ? '😞' : '😐'}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 8px' }}>#{i.keyword}</h4>
                                    <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span><Eye size={14} /> {i.mentions || 0} дурдалт</span>
                                        {i.isActive !== false && <span style={{ color: '#2ecc71' }}>● Хянаж буй</span>}
                                    </div>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Сошиал хяналт" icon={<Radio size={20} />} collectionPath="businesses/{bizId}/socialListening" fields={SOCIAL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
