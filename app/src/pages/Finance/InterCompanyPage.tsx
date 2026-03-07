import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Building2, ArrowRightLeft } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const INTERCO_FIELDS: CrudField[] = [
    { name: 'fromEntity', label: 'Илгээгч', type: 'text', required: true },
    { name: 'toEntity', label: 'Хүлээн авагч', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'transfer', label: 'Шилжүүлэг' }, { value: 'invoice', label: 'Нэхэмжлэл' },
            { value: 'loan', label: 'Дотоод зээл' }, { value: 'allocation', label: 'Хуваарилалт' },
        ]
    },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true },
    { name: 'date', label: 'Огноо', type: 'date' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'confirmed', label: 'Баталгаажсан' }, { value: 'settled', label: 'Тооцоогдсон' },
        ]
    },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function InterCompanyPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/interCompany`), orderBy('createdAt', 'desc'));
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
                <Header title="Дотоод Компаний Гүйлгээ" action={{ label: '+ Гүйлгээ', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Илгээгч</th><th>→</th><th>Хүлээн авагч</th><th>Төрөл</th><th>Дүн</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Гүйлгээ олдсонгүй</td></tr> :
                                items.map(i => (
                                    <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{i.fromEntity}</td><td><ArrowRightLeft size={14} /></td><td style={{ fontWeight: 600 }}>{i.toEntity}</td>
                                        <td>{i.type || '-'}</td><td style={{ fontWeight: 700 }}>{(i.amount || 0).toLocaleString()} ₮</td>
                                        <td><span className={`badge ${i.status === 'settled' ? 'badge-success' : i.status === 'confirmed' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'settled' ? 'Тооцоогдсон' : i.status === 'confirmed' ? 'Баталгаажсан' : 'Хүлээгдэж буй'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Дотоод гүйлгээ" icon={<Building2 size={20} />} collectionPath="businesses/{bizId}/interCompany" fields={INTERCO_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
