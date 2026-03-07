import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { UserCog, Star } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const FREELANCER_FIELDS: CrudField[] = [
    { name: 'name', label: 'Нэр', type: 'text', required: true },
    { name: 'specialty', label: 'Мэргэжил', type: 'text', required: true, placeholder: 'Дизайнер, Програмчин гэх мэт' },
    { name: 'email', label: 'И-мэйл', type: 'email' },
    { name: 'phone', label: 'Утас', type: 'phone' },
    { name: 'rate', label: 'Цагийн хөлс', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'available', options: [
            { value: 'available', label: 'Чөлөөтэй' },
            { value: 'busy', label: 'Завгүй' },
            { value: 'inactive', label: 'Идэвхгүй' },
        ]
    },
    { name: 'rating', label: 'Үнэлгээ (1-5)', type: 'number' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FreelancerMgtPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/freelancers`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setFreelancers(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header title="Гэрээт ажилтан" action={{ label: '+ Нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        freelancers.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><UserCog size={48} color="var(--text-muted)" /><h3>Гэрээт ажилтан байхгүй</h3></div> :
                            freelancers.map(f => (
                                <div key={f.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(f); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className={`badge ${f.status === 'available' ? 'badge-success' : f.status === 'busy' ? 'badge-warning' : 'badge-soft'}`}>{f.status === 'available' ? 'Чөлөөтэй' : f.status === 'busy' ? 'Завгүй' : 'Идэвхгүй'}</span>
                                        {f.rating && <div style={{ display: 'flex', gap: 2 }}>{Array.from({ length: f.rating }).map((_, i) => <Star key={i} size={12} fill="#f1c40f" color="#f1c40f" />)}</div>}
                                    </div>
                                    <h4 style={{ margin: '0 0 4px' }}>{f.name}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.specialty}</div>
                                    {f.rate && <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--primary)' }}>{f.rate.toLocaleString()} ₮/цаг</div>}
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Гэрээт ажилтан" icon={<UserCog size={20} />} collectionPath="businesses/{bizId}/freelancers" fields={FREELANCER_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
