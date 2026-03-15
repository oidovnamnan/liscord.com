import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Package, Store, Truck } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const DROP_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'supplierName', label: 'Нийлүүлэгч', type: 'text', required: true },
    { name: 'customerName', label: 'Захиалагч', type: 'text', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    { name: 'sellingPrice', label: 'Зарах үнэ', type: 'currency' },
    { name: 'costPrice', label: 'Өртөг', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'ordered', options: [
            { value: 'ordered', label: 'Захиалсан' }, { value: 'shipped', label: 'Илгээсэн' },
            { value: 'delivered', label: 'Хүргэсэн' }, { value: 'cancelled', label: 'Цуцалсан' },
        ]
    },
    { name: 'trackingNumber', label: 'Трекинг дугаар', type: 'text' },
];

export function DropShippingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/dropShipping`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Truck size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Дроп Шиппинг</h3>
                            <div className="fds-hero-desc">Дроп шиппингийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Захиалга
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Нийлүүлэгч</th><th>Захиалагч</th><th>Тоо</th><th>Ашиг</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Захиалга олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td>{i.supplierName}</td><td>{i.customerName}</td><td>{i.quantity}</td><td style={{ color: '#2ecc71', fontWeight: 600 }}>{((i.sellingPrice || 0) - (i.costPrice || 0)).toLocaleString()} ₮</td><td><span className={`badge ${i.status === 'delivered' ? 'badge-success' : i.status === 'shipped' ? 'badge-info' : i.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'delivered' ? 'Хүргэсэн' : i.status === 'shipped' ? 'Илгээсэн' : i.status === 'cancelled' ? 'Цуцалсан' : 'Захиалсан'}</span></td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Drop Shipping" icon={<Package size={20} />} collectionPath="businesses/{bizId}/dropShipping" fields={DROP_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
