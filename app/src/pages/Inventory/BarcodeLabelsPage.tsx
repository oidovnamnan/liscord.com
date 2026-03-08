import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Tag, Printer } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const LABEL_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'barcode', label: 'Баркод', type: 'text', required: true },
    { name: 'price', label: 'Үнэ', type: 'currency' },
    { name: 'quantity', label: 'Хэвлэх тоо', type: 'number', defaultValue: '1' },
    {
        name: 'size', label: 'Хэмжээ', type: 'select', defaultValue: 'medium', options: [
            { value: 'small', label: 'Жижиг (30x20)' }, { value: 'medium', label: 'Дунд (50x25)' }, { value: 'large', label: 'Том (100x38)' },
        ]
    },
];

export function BarcodeLabelsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/barcodeLabels`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page animate-fade-in">
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Шошго хэвлэх</h2>
                            <p className="page-hero-subtitle">Баркод, шошго бэлтгэх</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        + Шошго
                    </button>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Баркод</th><th>Үнэ</th><th>Тоо</th><th>Хэмжээ</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Шошго олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td style={{ fontFamily: 'monospace' }}>{i.barcode}</td><td>{i.price ? i.price.toLocaleString() + ' ₮' : '-'}</td><td>{i.quantity || 1}</td><td>{i.size || 'Дунд'}</td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Шошго" icon={<Tag size={20} />} collectionPath="businesses/{bizId}/barcodeLabels" fields={LABEL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
