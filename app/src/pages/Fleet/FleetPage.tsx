import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Truck, Search, MapPin, Fuel, AlertCircle, Wrench, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const FLEET_FIELDS: CrudField[] = [
    { name: 'name', label: 'Тээврийн хэрэгслийн нэр', type: 'text', required: true },
    { name: 'plateNumber', label: 'Улсын дугаар', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'car', label: '🚗 Суудлын' },
            { value: 'van', label: '🚐 Ачааны бага' },
            { value: 'truck', label: '🚛 Ачааны том' },
            { value: 'motorcycle', label: '🏍 Мотоцикль' },
            { value: 'bus', label: '🚌 Автобус' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Ашиглагдаж буй' },
            { value: 'maintenance', label: 'Засварт' },
            { value: 'parked', label: 'Зогссон' },
            { value: 'retired', label: 'Устгасан' },
        ]
    },
    {
        name: 'fuelType', label: 'Шатахуун', type: 'select', options: [
            { value: 'gasoline', label: 'Бензин' },
            { value: 'diesel', label: 'Дизель' },
            { value: 'electric', label: 'Цахилгаан' },
            { value: 'hybrid', label: 'Хайбрид' },
        ]
    },
    { name: 'mileage', label: 'Км тоолуур', type: 'number' },
    { name: 'assignedDriver', label: 'Жолооч', type: 'text' },
    { name: 'lastMaintenance', label: 'Сүүлийн засвар', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FleetPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/fleet`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = vehicles.filter(v => (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (v.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header title="Автопарк" action={{ label: '+ Шинэ машин', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Truck size={20} color="var(--primary)" /><div><div style={{ fontWeight: 700 }}>{vehicles.length}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Нийт</div></div></div></div>
                    <div className="card" style={{ padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle2 size={20} color="#2ecc71" /><div><div style={{ fontWeight: 700 }}>{vehicles.filter(v => v.status === 'active').length}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ашиглагдаж буй</div></div></div></div>
                    <div className="card" style={{ padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Wrench size={20} color="#f39c12" /><div><div style={{ fontWeight: 700 }}>{vehicles.filter(v => v.status === 'maintenance').length}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Засварт</div></div></div></div>
                </div>
                <div style={{ marginBottom: 16 }}><div className="search-box" style={{ maxWidth: 400 }}><Search size={18} /><input type="text" placeholder="Нэр, дугаараар хайх..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Truck size={48} color="var(--text-muted)" /><h3>Машин олдсонгүй</h3></div>
                    ) : (
                        filtered.map(v => (
                            <div key={v.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(v); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span className={`badge ${v.status === 'active' ? 'badge-success' : v.status === 'maintenance' ? 'badge-warning' : 'badge-soft'}`}>{v.status === 'active' ? 'Идэвхтэй' : v.status === 'maintenance' ? 'Засварт' : v.status || 'Бусад'}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{v.plateNumber}</span>
                                </div>
                                <h4 style={{ margin: '0 0 8px' }}>{v.name}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {v.fuelType && <span><Fuel size={12} /> {v.fuelType}</span>}
                                    {v.mileage && <span><MapPin size={12} /> {v.mileage.toLocaleString()} км</span>}
                                    {v.assignedDriver && <span>{v.assignedDriver}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Автопарк" icon={<Truck size={20} />} collectionPath="businesses/{bizId}/fleet" fields={FLEET_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
