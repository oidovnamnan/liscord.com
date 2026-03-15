import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Wrench } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const EQUIP_FIELDS: CrudField[] = [
    { name: 'name', label: 'Тоноглолын нэр', type: 'text', required: true },
    { name: 'serialNumber', label: 'Серийн дугаар', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'operational', options: [
            { value: 'operational', label: '✅ Хэвийн' }, { value: 'maintenance', label: '🔧 Засварт' }, { value: 'broken', label: '❌ Эвдэрсэн' }, { value: 'retired', label: '📦 Ашиглахгүй' },
        ]
    },
    { name: 'location', label: 'Байршил', type: 'text' },
    { name: 'lastMaintenance', label: 'Сүүлийн засвар', type: 'date' },
    { name: 'nextMaintenance', label: 'Дараагийн засвар', type: 'date' },
    { name: 'purchaseDate', label: 'Авсан огноо', type: 'date' },
    { name: 'value', label: 'Үнэ', type: 'currency' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function EquipmentPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/equipment`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Wrench size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Тоног Төхөөрөмж</h3>
                            <div className="fds-hero-desc">Тоног төхөөрөмжийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Тоноглол
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Нэр</th><th>Серийн №</th><th>Байршил</th><th>Сүүлийн засвар</th><th>Дараагийн</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.name}</td><td style={{ fontFamily: 'monospace' }}>{i.serialNumber || '-'}</td><td>{i.location || '-'}</td><td>{i.lastMaintenance || '-'}</td><td>{i.nextMaintenance || '-'}</td><td><span className={`badge ${i.status === 'operational' ? 'badge-success' : i.status === 'broken' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'operational' ? 'Хэвийн' : i.status === 'broken' ? 'Эвдэрсэн' : i.status === 'maintenance' ? 'Засварт' : 'Ашиглахгүй'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Тоноглол" icon={<Wrench size={20} />} collectionPath="businesses/{bizId}/equipment" fields={EQUIP_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
