import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { ClipboardList } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const JOB_FIELDS: CrudField[] = [
    { name: 'title', label: 'Ажлын нэр', type: 'text', required: true, span: 2 },
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    {
        name: 'priority', label: 'Ач холбогдол', type: 'select', options: [
            { value: 'low', label: 'Бага' }, { value: 'medium', label: 'Дунд' }, { value: 'high', label: 'Өндөр' }, { value: 'urgent', label: 'Яаралтай' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'planned', options: [
            { value: 'planned', label: 'Төлөвлөсөн' }, { value: 'in_progress', label: 'Явагдаж буй' }, { value: 'completed', label: 'Дууссан' }, { value: 'cancelled', label: 'Цуцалсан' },
        ]
    },
    { name: 'startDate', label: 'Эхлэх', type: 'date' },
    { name: 'endDate', label: 'Дуусах', type: 'date' },
    { name: 'assignee', label: 'Хариуцагч', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function JobOrdersPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/jobOrders`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><ClipboardList size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Ажлын Захиалга</h3>
                            <div className="fds-hero-desc">Ажлын захиалгын удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Захиалга
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Нэр</th><th>Бүтээгдэхүүн</th><th>Тоо</th><th>Хариуцагч</th><th>Хугацаа</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.title}</td><td>{i.productName}</td><td>{i.quantity}</td><td>{i.assignee || '-'}</td><td>{i.startDate || '-'} → {i.endDate || '-'}</td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'in_progress' ? 'badge-info' : i.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'in_progress' ? 'Явагдаж буй' : i.status === 'cancelled' ? 'Цуцалсан' : 'Төлөвлөсөн'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Ажлын захиалга" icon={<ClipboardList size={20} />} collectionPath="businesses/{bizId}/jobOrders" fields={JOB_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
