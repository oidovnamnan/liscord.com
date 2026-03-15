import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Barcode, Search, ScanLine} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const BARCODE_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'barcode', label: 'Баркод', type: 'text', required: true },
    { name: 'sku', label: 'SKU', type: 'text' },
    {
        name: 'type', label: 'Төрөл', type: 'select', defaultValue: 'ean13', options: [
            { value: 'ean13', label: 'EAN-13' }, { value: 'upc', label: 'UPC' }, { value: 'code128', label: 'Code 128' }, { value: 'qr', label: 'QR Code' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function BarcodesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/barcodes`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = items.filter(i => (i.productName || '').toLowerCase().includes(search.toLowerCase()) || (i.barcode || '').includes(search));

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><ScanLine size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Баркод</h3>
                            <div className="fds-hero-desc">Баркод сканнер, үүсгэгч</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Баркод
                    </button>
                </div>
            </div>
                <div style={{ margin: '20px 0' }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Бүтээгдэхүүн, баркод хайх..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Баркод</th><th>SKU</th><th>Төрөл</th></tr></thead>
                            <tbody>{filtered.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Баркод олдсонгүй</td></tr> :
                                filtered.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td style={{ fontFamily: 'monospace' }}>{i.barcode}</td><td>{i.sku || '-'}</td><td><span className="badge">{i.type || 'EAN-13'}</span></td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Баркод" icon={<Barcode size={20} />} collectionPath="businesses/{bizId}/barcodes" fields={BARCODE_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
