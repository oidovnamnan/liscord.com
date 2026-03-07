import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Calculator } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const MRP_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'requiredQty', label: 'Шаардлагатай тоо', type: 'number', required: true },
    { name: 'currentStock', label: 'Одоогийн үлдэгдэл', type: 'number' },
    { name: 'toBuild', label: 'Үйлдвэрлэх', type: 'number' },
    { name: 'toPurchase', label: 'Худалдаж авах', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'planned', options: [
            { value: 'planned', label: 'Төлөвлөсөн' }, { value: 'ordered', label: 'Захиалсан' }, { value: 'received', label: 'Хүлээн авсан' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'dueDate', label: 'Хугацаа', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function MRPPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/mrp`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="MRP (Нөөц Төлөвлөлт)" action={{ label: '+ Төлөвлөлт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Шаардлага</th><th>Үлдэгдэл</th><th>Үйлдвэрлэх</th><th>Авах</th><th>Хугацаа</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td>{i.requiredQty}</td><td style={{ color: (i.currentStock || 0) < (i.requiredQty || 0) ? '#e74c3c' : '#2ecc71' }}>{i.currentStock || 0}</td><td>{i.toBuild || 0}</td><td>{i.toPurchase || 0}</td><td>{i.dueDate || '-'}</td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'received' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'received' ? 'Хүлээн авсан' : i.status === 'ordered' ? 'Захиалсан' : 'Төлөвлөсөн'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="MRP" icon={<Calculator size={20} />} collectionPath="businesses/{bizId}/mrp" fields={MRP_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
