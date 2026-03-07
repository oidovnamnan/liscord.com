import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Hash, Search } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const SERIAL_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'serialNumber', label: 'Серийн дугаар', type: 'text', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'in_stock', options: [
            { value: 'in_stock', label: 'Нөөцөд' }, { value: 'sold', label: 'Зарагдсан' }, { value: 'returned', label: 'Буцаагдсан' }, { value: 'defective', label: 'Гэмтэлтэй' },
        ]
    },
    { name: 'purchaseDate', label: 'Авсан огноо', type: 'date' },
    { name: 'soldDate', label: 'Зарсан огноо', type: 'date' },
    { name: 'customer', label: 'Худалдан авагч', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function SerialTrackingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [search, setSearch] = useState('');
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/serialTracking`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    const filtered = items.filter(i => (i.productName || '').toLowerCase().includes(search.toLowerCase()) || (i.serialNumber || '').includes(search));
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Серийн дугаар" action={{ label: '+ Бүртгэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ margin: '20px 0' }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Серийн дугаар, бараа хайх..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Серийн №</th><th>Авсан</th><th>Зарсан</th><th>Худалдан авагч</th><th>Төлөв</th></tr></thead>
                            <tbody>{filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> :
                                filtered.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td style={{ fontFamily: 'monospace' }}>{i.serialNumber}</td><td>{i.purchaseDate || '-'}</td><td>{i.soldDate || '-'}</td><td>{i.customer || '-'}</td><td><span className={`badge ${i.status === 'in_stock' ? 'badge-success' : i.status === 'sold' ? 'badge-info' : i.status === 'defective' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'in_stock' ? 'Нөөцөд' : i.status === 'sold' ? 'Зарагдсан' : i.status === 'defective' ? 'Гэмтэлтэй' : 'Буцаагдсан'}</span></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Серийн дугаар" icon={<Hash size={20} />} collectionPath="businesses/{bizId}/serialTracking" fields={SERIAL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
