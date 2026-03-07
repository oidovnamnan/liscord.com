import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { ArrowRightLeft, Truck, Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const CROSSDOCK_FIELDS: CrudField[] = [
    { name: 'shipmentId', label: 'Ачааны дугаар', type: 'text', required: true },
    { name: 'origin', label: 'Хаанаас', type: 'text', required: true },
    { name: 'destination', label: 'Хаашаа', type: 'text', required: true },
    { name: 'items', label: 'Барааны тоо', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'received', options: [
            { value: 'received', label: 'Хүлээн авсан' }, { value: 'sorting', label: 'Ангилж буй' },
            { value: 'dispatched', label: 'Илгээсэн' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function CrossDockingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/crossDocking`), orderBy('createdAt', 'desc'));
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
                <Header title="Cross-Docking" action={{ label: '+ Шинэ', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Ачаа №</th><th>Хаанаас</th><th>Хаашаа</th><th>Тоо</th><th>Огноо</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.shipmentId}</td><td>{i.origin}</td><td>{i.destination}</td><td>{i.items || 0}</td><td>{i.date || '-'}</td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'dispatched' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'dispatched' ? 'Илгээсэн' : i.status === 'sorting' ? 'Ангилж буй' : 'Хүлээн авсан'}</span></td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Cross-Docking" icon={<ArrowRightLeft size={20} />} collectionPath="businesses/{bizId}/crossDocking" fields={CROSSDOCK_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
