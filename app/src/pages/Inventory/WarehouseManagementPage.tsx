import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Warehouse, MapPin, ArrowRightLeft, Package } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const WMS_FIELDS: CrudField[] = [
    { name: 'location', label: 'Байршил/Тавиур', type: 'text', required: true, placeholder: 'A-01-03' },
    { name: 'productName', label: 'Бараа', type: 'text', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    {
        name: 'zone', label: 'Бүс', type: 'select', options: [
            { value: 'receiving', label: 'Хүлээн авах' }, { value: 'storage', label: 'Хадгалах' }, { value: 'picking', label: 'Цуглуулах' }, { value: 'shipping', label: 'Илгээх' },
        ]
    },
    {
        name: 'type', label: 'Үйлдэл', type: 'select', options: [
            { value: 'put_away', label: 'Байрлуулах' }, { value: 'pick', label: 'Авах' }, { value: 'transfer', label: 'Шилжүүлэх' }, { value: 'count', label: 'Тоолох' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function WarehouseManagementPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/warehouseOps`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Агуулахын Удирдлага" action={{ label: '+ Үйлдэл', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Байршил</th><th>Бараа</th><th>Тоо</th><th>Бүс</th><th>Үйлдэл</th><th>Огноо</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{i.location}</td><td>{i.productName}</td><td>{i.quantity}</td><td><span className="badge">{i.zone || '-'}</span></td><td>{i.type || '-'}</td><td>{i.date || '-'}</td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Агуулах үйлдэл" icon={<Warehouse size={20} />} collectionPath="businesses/{bizId}/warehouseOps" fields={WMS_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
