import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Cog, CheckCircle2, Timer, PlayCircle, Factory } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const ORDER_FIELDS: CrudField[] = [
    { name: 'product', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    { name: 'client', label: 'Захиалагч', type: 'text', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: '⏳ Хүлээгдэж буй' }, { value: 'cutting', label: '✂️ Зүсэж буй' },
            { value: 'assembling', label: '🔧 Угсарч буй' }, { value: 'finished', label: '✅ Дууссан' },
        ]
    },
    { name: 'deadline', label: 'Хугацаа', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function ManufacturingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/productionOrders`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const statusIcons: Record<string, React.ReactNode> = { pending: <Timer size={16} color="#f39c12" />, cutting: <Cog size={16} color="#3498db" />, assembling: <PlayCircle size={16} color="#9b59b6" />, finished: <CheckCircle2 size={16} color="#2ecc71" /> };
    const statusLabels: Record<string, string> = { pending: 'Хүлээгдэж буй', cutting: 'Зүсэж буй', assembling: 'Угсарч буй', finished: 'Дууссан' };

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header title="Үйлдвэрлэл" action={{ label: '+ Захиалга', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'flex', gap: 8, margin: '20px 0', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'cutting', 'assembling', 'finished'].map(s => (
                        <button key={s} className={`btn ${filter === s ? 'btn-primary' : ''}`} onClick={() => setFilter(s)} style={{ fontSize: '0.85rem' }}>
                            {s === 'all' ? `Бүгд (${orders.length})` : `${statusLabels[s]} (${orders.filter(o => o.status === s).length})`}
                        </button>
                    ))}
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table">
                            <thead><tr><th>Бүтээгдэхүүн</th><th>Тоо</th><th>Захиалагч</th><th>Хугацаа</th><th>Төлөв</th></tr></thead>
                            <tbody>{filtered.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Захиалга олдсонгүй</td></tr> :
                                filtered.map(o => (
                                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(o); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{o.product}</td>
                                        <td>{o.quantity}</td>
                                        <td>{o.client}</td>
                                        <td>{o.deadline || '-'}</td>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{statusIcons[o.status]}<span>{statusLabels[o.status] || o.status}</span></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Үйлдвэрлэлийн захиалга" icon={<Factory size={20} />} collectionPath="businesses/{bizId}/productionOrders" fields={ORDER_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
