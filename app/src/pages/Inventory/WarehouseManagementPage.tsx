import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Warehouse, MapPin, Layers, ArrowLeftRight, ClipboardList } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import './InventoryPage.css';

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

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/warehouseOps`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const uniqueLocations = new Set(items.map(i => i.location)).size;
    const uniqueProducts = new Set(items.map(i => i.productName)).size;
    const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

    return (
        <HubLayout hubId="inventory-hub">
            <div style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                {/* ── Premium Hero ── */}
                <div className="inv-hero wms-hero">
                    <div className="inv-hero-top">
                        <div className="inv-hero-left">
                            <div className="inv-hero-icon"><Warehouse size={24} /></div>
                            <div>
                                <h2 className="inv-hero-title">Агуулахын Удирдлага</h2>
                                <div className="inv-hero-desc">Бараа материалын байршил, хөдөлгөөн хянах</div>
                            </div>
                        </div>
                        <button className="inv-hero-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                            + Үйлдэл
                        </button>
                    </div>
                    <div className="inv-hero-stats">
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{items.length}</div>
                            <div className="inv-hero-stat-label">Нийт үйлдэл</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{uniqueLocations}</div>
                            <div className="inv-hero-stat-label">Байршил</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{uniqueProducts}</div>
                            <div className="inv-hero-stat-label">Бараа төрөл</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{totalQty}</div>
                            <div className="inv-hero-stat-label">Нийт тоо</div>
                        </div>
                    </div>
                </div>

                {/* ── Card: Table ── */}
                <div className="inv-page-card">
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Байршил</th><th>Бараа</th><th>Тоо</th><th>Бүс</th><th>Үйлдэл</th><th>Огноо</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{i.location}</td><td>{i.productName}</td><td>{i.quantity}</td><td><span className="badge">{i.zone || '-'}</span></td><td>{i.type || '-'}</td><td>{i.date || '-'}</td></tr>))}
                            </tbody></table>)}
                </div>
                </div>{/* /inv-page-card */}
            </div>
            {showModal && <GenericCrudModal title="Агуулах үйлдэл" icon={<Warehouse size={20} />} collectionPath="businesses/{bizId}/warehouseOps" fields={WMS_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
