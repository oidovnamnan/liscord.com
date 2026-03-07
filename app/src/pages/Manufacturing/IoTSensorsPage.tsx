import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Radio, Activity } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const IOT_FIELDS: CrudField[] = [
    { name: 'sensorName', label: 'Мэдрэгчийн нэр', type: 'text', required: true },
    { name: 'sensorId', label: 'ID', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', options: [
            { value: 'temperature', label: '🌡 Температур' }, { value: 'humidity', label: '💧 Чийгшил' }, { value: 'pressure', label: '📊 Даралт' },
            { value: 'vibration', label: '📳 Чичиргээ' }, { value: 'flow', label: '💨 Урсгал' }, { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'location', label: 'Байршил', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' }, { value: 'inactive', label: 'Идэвхгүй' }, { value: 'error', label: 'Алдаатай' },
        ]
    },
    { name: 'isActive', label: 'Асаалттай', type: 'toggle', defaultValue: true },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function IoTSensorsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sensors, setSensors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/iotSensors`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setSensors(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="IoT Мэдрэгч" action={{ label: '+ Мэдрэгч', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>{loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : sensors.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Radio size={48} color="var(--text-muted)" /><h3>Мэдрэгч олдсонгүй</h3></div> : sensors.map(s => (
                <div key={s.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(s); setShowModal(true); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'error' ? 'badge-danger' : 'badge-soft'}`}>{s.status === 'active' ? '● Идэвхтэй' : s.status === 'error' ? '⚠ Алдаатай' : 'Идэвхгүй'}</span><Activity size={16} color="var(--primary)" /></div>
                    <h4 style={{ margin: '0 0 4px' }}>{s.sensorName}</h4><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.type || 'Бусад'} • {s.location || '-'}</div>
                </div>))}</div>
        </div>{showModal && <GenericCrudModal title="IoT мэдрэгч" icon={<Radio size={20} />} collectionPath="businesses/{bizId}/iotSensors" fields={IOT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
