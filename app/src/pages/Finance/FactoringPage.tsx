import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Handshake, FileText, DollarSign } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const FACTORING_FIELDS: CrudField[] = [
    { name: 'invoiceNumber', label: 'Нэхэмжлэл №', type: 'text', required: true },
    { name: 'customerName', label: 'Үйлчлүүлэгч', type: 'text', required: true },
    { name: 'invoiceAmount', label: 'Нэхэмжлэлийн дүн', type: 'currency', required: true },
    { name: 'factoringRate', label: 'Факторингийн хувь %', type: 'number' },
    { name: 'advanceAmount', label: 'Урьдчилгаа дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'submitted', options: [
            { value: 'submitted', label: 'Илгээсэн' }, { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'funded', label: 'Санхүүжсэн' }, { value: 'collected', label: 'Цуглуулсан' },
        ]
    },
    { name: 'dueDate', label: 'Хугацаа', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FactoringPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/factoring`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header title="Факторинг" action={{ label: '+ Хүсэлт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нэхэмжлэл</th><th>Үйлчлүүлэгч</th><th>Дүн</th><th>Урьдчилгаа</th><th>Хугацаа</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Факторинг олдсонгүй</td></tr> :
                                items.map(i => (
                                    <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{i.invoiceNumber}</td><td>{i.customerName}</td>
                                        <td>{(i.invoiceAmount || 0).toLocaleString()} ₮</td>
                                        <td style={{ fontWeight: 600, color: '#2ecc71' }}>{(i.advanceAmount || 0).toLocaleString()} ₮</td>
                                        <td>{i.dueDate || '-'}</td>
                                        <td><span className={`badge ${i.status === 'funded' ? 'badge-success' : i.status === 'collected' ? 'badge-soft' : i.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'funded' ? 'Санхүүжсэн' : i.status === 'collected' ? 'Цуглуулсан' : i.status === 'approved' ? 'Зөвшөөрсөн' : 'Илгээсэн'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Факторинг" icon={<Handshake size={20} />} collectionPath="businesses/{bizId}/factoring" fields={FACTORING_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
