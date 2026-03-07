import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Warehouse, MapPin, Package } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const WH_FIELDS: CrudField[] = [
    { name: 'name', label: 'Агуулахын нэр', type: 'text', required: true },
    { name: 'location', label: 'Байршил', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'main', label: 'Үндсэн' }, { value: 'branch', label: 'Салбар' }, { value: 'transit', label: 'Тээвэр' },
        ]
    },
    { name: 'capacity', label: 'Багтаамж', type: 'number' },
    { name: 'currentStock', label: 'Одоогийн нөөц', type: 'number' },
    { name: 'isActive', label: 'Идэвхтэй', type: 'toggle', defaultValue: true },
    { name: 'manager', label: 'Менежер', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function MultiWarehousePage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/warehouses`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Олон Агуулах" action={{ label: '+ Агуулах', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        warehouses.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Warehouse size={48} color="var(--text-muted)" /><h3>Агуулах олдсонгүй</h3></div> :
                            warehouses.map(w => (
                                <div key={w.id} className="card" style={{ padding: 20, cursor: 'pointer', opacity: w.isActive === false ? 0.6 : 1 }} onClick={() => { setEditingItem(w); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className={`badge ${w.type === 'main' ? 'badge-success' : 'badge-info'}`}>{w.type === 'main' ? 'Үндсэн' : w.type === 'transit' ? 'Тээвэр' : 'Салбар'}</span>
                                        <Package size={18} color="var(--primary)" />
                                    </div>
                                    <h4 style={{ margin: '0 0 4px' }}>{w.name}</h4>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><MapPin size={12} /> {w.location}</div>
                                    {w.capacity && <div style={{ marginTop: 12 }}><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{w.currentStock || 0} / {w.capacity}</div><div style={{ height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(((w.currentStock || 0) / w.capacity) * 100, 100)}%`, background: ((w.currentStock || 0) / w.capacity) > 0.9 ? '#e74c3c' : '#2ecc71', borderRadius: 3 }} /></div></div>}
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Агуулах" icon={<Warehouse size={20} />} collectionPath="businesses/{bizId}/warehouses" fields={WH_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
