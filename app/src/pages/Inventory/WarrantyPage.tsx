import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const WARRANTY_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'serialNumber', label: 'Серийн №', type: 'text' },
    { name: 'customerName', label: 'Үйлчлүүлэгч', type: 'text' },
    {
        name: 'warrantyType', label: 'Төрөл', type: 'select', options: [
            { value: 'standard', label: 'Стандарт' }, { value: 'extended', label: 'Сунгасан' }, { value: 'limited', label: 'Хязгаарлагдмал' },
        ]
    },
    { name: 'startDate', label: 'Эхлэх', type: 'date', required: true },
    { name: 'endDate', label: 'Дуусах', type: 'date', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' }, { value: 'expired', label: 'Дууссан' }, { value: 'claimed', label: 'Нэхэмжлэсэн' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function WarrantyPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/warranties`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Баталгаат хугацаа" action={{ label: '+ Баталгаа', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Серийн №</th><th>Үйлчлүүлэгч</th><th>Төрөл</th><th>Хугацаа</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td style={{ fontFamily: 'monospace' }}>{i.serialNumber || '-'}</td><td>{i.customerName || '-'}</td><td>{i.warrantyType || '-'}</td><td>{i.startDate || '-'} → {i.endDate || '-'}</td><td><span className={`badge ${i.status === 'active' ? 'badge-success' : i.status === 'expired' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'active' ? 'Идэвхтэй' : i.status === 'expired' ? 'Дууссан' : 'Нэхэмжлэсэн'}</span></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Баталгаат хугацаа" icon={<ShieldCheck size={20} />} collectionPath="businesses/{bizId}/warranties" fields={WARRANTY_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
