import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { HeartPulse, Shield, Users, CheckCircle2, Gift} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const BENEFIT_FIELDS: CrudField[] = [
    { name: 'name', label: 'Нэр', type: 'text', required: true, span: 2, placeholder: 'Эрүүл мэндийн даатгал' },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'insurance', label: '🏥 Даатгал' },
            { value: 'bonus', label: '💰 Урамшуулал' },
            { value: 'wellness', label: '❤️ Эрүүл мэнд' },
            { value: 'education', label: '📚 Боловсрол' },
            { value: 'transport', label: '🚗 Тээвэр' },
            { value: 'food', label: '🍽 Хоол' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'coverageAmount', label: 'Хамрах дүн', type: 'currency' },
    {
        name: 'eligibility', label: 'Хамрах хүрээ', type: 'select', options: [
            { value: 'all', label: 'Бүх ажилтан' },
            { value: 'fulltime', label: 'Бүтэн цагийн' },
            { value: 'management', label: 'Удирдлага' },
            { value: 'senior', label: '3+ жил ажилласан' },
        ]
    },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function BenefitsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [benefits, setBenefits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/benefits`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setBenefits(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Gift size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Тэтгэмж</h3>
                            <div className="fds-hero-desc">Ажилтны тэтгэмжийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Нэмэх
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 20 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : benefits.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
                            <HeartPulse size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Урамшуулал бүртгэгдээгүй</h3>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>Нэмэх</button>
                        </div>
                    ) : (
                        benefits.map(b => (
                            <div key={b.id} className="card" style={{ padding: 20, cursor: 'pointer', opacity: b.isActive === false ? 0.6 : 1 }} onClick={() => { setEditingItem(b); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span className={`badge ${b.isActive !== false ? 'badge-success' : 'badge-soft'}`}>
                                        {b.isActive !== false ? <><CheckCircle2 size={12} /> Идэвхтэй</> : 'Идэвхгүй'}
                                    </span>
                                    <Shield size={18} color="var(--primary)" />
                                </div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>{b.name}</h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                                    <span>{b.category}</span>
                                    {b.coverageAmount && <span style={{ fontWeight: 600 }}>{b.coverageAmount?.toLocaleString()} ₮</span>}
                                </div>
                                {b.eligibility && <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}><Users size={12} /> {b.eligibility}</div>}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal title="Урамшуулал / Хамгаалал" icon={<HeartPulse size={20} />} collectionPath="businesses/{bizId}/benefits" fields={BENEFIT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />
            )}
        </HubLayout>
    );
}
