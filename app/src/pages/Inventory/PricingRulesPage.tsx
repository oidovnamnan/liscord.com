import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Tag } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const PRICING_FIELDS: CrudField[] = [
    { name: 'name', label: 'Дүрмийн нэр', type: 'text', required: true, span: 2 },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'discount', label: '🏷 Хөнгөлөлт' }, { value: 'markup', label: '📈 Нэмэлт' }, { value: 'tiered', label: '📊 Шатлал' }, { value: 'volume', label: '📦 Хэмжээгээр' },
        ]
    },
    { name: 'value', label: 'Хувь / Дүн', type: 'number', required: true },
    { name: 'isPercent', label: 'Хувиар тооцох', type: 'toggle', defaultValue: true },
    {
        name: 'applyTo', label: 'Хамрах', type: 'select', options: [
            { value: 'all', label: 'Бүх бараа' }, { value: 'category', label: 'Ангилал' }, { value: 'specific', label: 'Тусгай' },
        ]
    },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
    { name: 'startDate', label: 'Эхлэх', type: 'date' },
    { name: 'endDate', label: 'Дуусах', type: 'date' },
];
export function PricingRulesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/pricingRules`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Tag size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Үнийн Дүрэм</h3>
                            <div className="fds-hero-desc">Үнийн автомат дүрмүүд</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Дүрэм
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нэр</th><th>Төрөл</th><th>Утга</th><th>Хамрах</th><th>Хугацаа</th><th>Идэвхтэй</th></tr></thead>
                            <tbody>{rules.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Дүрэм олдсонгүй</td></tr> :
                                rules.map(r => (<tr key={r.id} style={{ cursor: 'pointer', opacity: r.isActive === false ? 0.5 : 1 }} onClick={() => { setEditingItem(r); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{r.name}</td><td><span className="badge">{r.type}</span></td><td style={{ fontWeight: 700 }}>{r.value}{r.isPercent !== false ? '%' : ' ₮'}</td><td>{r.applyTo || 'Бүгд'}</td><td>{r.startDate || '-'} → {r.endDate || '-'}</td><td>{r.isActive !== false ? '✅' : '❌'}</td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Үнийн дүрэм" icon={<Tag size={20} />} collectionPath="businesses/{bizId}/pricingRules" fields={PRICING_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
