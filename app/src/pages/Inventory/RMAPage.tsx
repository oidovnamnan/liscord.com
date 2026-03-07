import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { RotateCcw } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const RMA_FIELDS: CrudField[] = [
    { name: 'customerName', label: 'Үйлчлүүлэгч', type: 'text', required: true },
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    {
        name: 'reason', label: 'Шалтгаан', type: 'select', required: true, options: [
            { value: 'defective', label: 'Гэмтэлтэй' }, { value: 'wrong_item', label: 'Буруу бараа' }, { value: 'not_as_described', label: 'Тайлбарт нийцээгүй' }, { value: 'changed_mind', label: 'Бодлоо өөрчилсөн' },
        ]
    },
    {
        name: 'action', label: 'Арга хэмжээ', type: 'select', options: [
            { value: 'refund', label: 'Буцаалт' }, { value: 'exchange', label: 'Солилцоо' }, { value: 'repair', label: 'Засвар' },
        ]
    },
    { name: 'amount', label: 'Дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'approved', label: 'Зөвшөөрсөн' }, { value: 'completed', label: 'Дууссан' }, { value: 'rejected', label: 'Татгалзсан' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function RMAPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/rma`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Буцаалт (RMA)" action={{ label: '+ Хүсэлт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Үйлчлүүлэгч</th><th>Бүтээгдэхүүн</th><th>Шалтгаан</th><th>Арга</th><th>Дүн</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>RMA олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.customerName}</td><td>{i.productName}</td><td>{i.reason || '-'}</td><td>{i.action || '-'}</td><td>{i.amount ? i.amount.toLocaleString() + ' ₮' : '-'}</td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'rejected' ? 'badge-danger' : i.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'rejected' ? 'Татгалзсан' : i.status === 'approved' ? 'Зөвшөөрсөн' : 'Хүлээгдэж буй'}</span></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Буцаалт (RMA)" icon={<RotateCcw size={20} />} collectionPath="businesses/{bizId}/rma" fields={RMA_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
