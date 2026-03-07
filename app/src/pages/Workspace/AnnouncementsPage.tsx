import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Bell, Search, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const ANNOUNCEMENT_FIELDS: CrudField[] = [
    { name: 'title', label: 'Гарчиг', type: 'text', required: true, span: 2 },
    {
        name: 'priority', label: 'Зэрэглэл', type: 'select', defaultValue: 'normal', options: [
            { value: 'urgent', label: '🔴 Яаралтай' },
            { value: 'important', label: '🟡 Чухал' },
            { value: 'normal', label: '🟢 Ердийн' },
        ]
    },
    {
        name: 'targetAudience', label: 'Хэнд', type: 'select', defaultValue: 'all', options: [
            { value: 'all', label: 'Бүх ажилтан' },
            { value: 'management', label: 'Удирдлага' },
            { value: 'department', label: 'Тодорхой хэлтэс' },
        ]
    },
    { name: 'content', label: 'Агуулга', type: 'textarea', required: true, span: 2 },
];

export function AnnouncementsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/announcements`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const getPriorityIcon = (p: string) => {
        if (p === 'urgent') return <AlertCircle size={16} color="#e74c3c" />;
        if (p === 'important') return <AlertCircle size={16} color="#f39c12" />;
        return <CheckCircle2 size={16} color="#2ecc71" />;
    };

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header title="Зарлал & Мэдэгдэл" action={{ label: '+ Шинэ зарлал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                    {loading ? (
                        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : items.length === 0 ? (
                        <div className="card" style={{ padding: 60, textAlign: 'center' }}><Bell size={48} color="var(--text-muted)" /><h3>Зарлал байхгүй</h3></div>
                    ) : (
                        items.map(a => (
                            <div key={a.id} className="card" style={{ padding: 20, cursor: 'pointer', borderLeft: a.priority === 'urgent' ? '4px solid #e74c3c' : a.priority === 'important' ? '4px solid #f39c12' : 'none' }} onClick={() => { setEditingItem(a); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {getPriorityIcon(a.priority)}
                                        <div>
                                            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{a.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 600 }}>{a.content?.substring(0, 150)}{(a.content?.length || 0) > 150 ? '...' : ''}</p>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ flexShrink: 0 }}>{a.targetAudience === 'all' ? 'Бүгдэд' : a.targetAudience}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Зарлал" icon={<Bell size={20} />} collectionPath="businesses/{bizId}/announcements" fields={ANNOUNCEMENT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
