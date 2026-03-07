import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Layers, Package } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const BOM_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true, span: 2 },
    { name: 'materialName', label: 'Түүхий эд', type: 'text', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    {
        name: 'unit', label: 'Нэгж', type: 'select', options: [
            { value: 'pcs', label: 'Ширхэг' }, { value: 'kg', label: 'Кг' }, { value: 'liter', label: 'Литр' }, { value: 'meter', label: 'Метр' }, { value: 'sqm', label: 'м²' },
        ]
    },
    { name: 'unitCost', label: 'Нэгж өртөг', type: 'currency' },
    { name: 'supplier', label: 'Нийлүүлэгч', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function BOMPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/bom`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="Материалын Жагсаалт (BOM)" action={{ label: '+ Материал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Түүхий эд</th><th>Тоо</th><th>Нэгж</th><th>Өртөг</th><th>Нийлүүлэгч</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td>{i.materialName}</td><td>{i.quantity}</td><td>{i.unit || '-'}</td><td>{i.unitCost ? i.unitCost.toLocaleString() + ' ₮' : '-'}</td><td>{i.supplier || '-'}</td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="BOM" icon={<Layers size={20} />} collectionPath="businesses/{bizId}/bom" fields={BOM_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
