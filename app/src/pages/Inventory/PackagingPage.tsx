import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Box, Package} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const PKG_FIELDS: CrudField[] = [
    { name: 'name', label: 'Сав боодлын нэр', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'box', label: '📦 Хайрцаг' }, { value: 'bag', label: '🛍 Уут' }, { value: 'pallet', label: '🪵 Шал тавцан' }, { value: 'envelope', label: '✉️ Дугтуй' },
        ]
    },
    { name: 'dimensions', label: 'Хэмжээ (СxӨxД)', type: 'text', placeholder: '30x20x15 см' },
    { name: 'weight', label: 'Жин (кг)', type: 'number' },
    { name: 'cost', label: 'Өртөг', type: 'currency' },
    { name: 'stock', label: 'Үлдэгдэл', type: 'number' },
];

export function PackagingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/packaging`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Package size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Савлагаа</h3>
                            <div className="fds-hero-desc">Савлагааны удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Нэмэх
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нэр</th><th>Төрөл</th><th>Хэмжээ</th><th>Жин</th><th>Өртөг</th><th>Үлдэгдэл</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.name}</td><td>{i.type || '-'}</td><td>{i.dimensions || '-'}</td><td>{i.weight || '-'} кг</td><td>{i.cost ? i.cost.toLocaleString() + ' ₮' : '-'}</td><td>{i.stock || 0}</td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Сав боодол" icon={<Box size={20} />} collectionPath="businesses/{bizId}/packaging" fields={PKG_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
