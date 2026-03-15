import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Truck, Plus, MapPin, Fuel, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'vehicleName', label: 'Тээврийн хэрэгсэл', type: 'text', required: true },
    { name: 'plateNumber', label: 'Улсын дугаар', type: 'text', required: true },
    { name: 'driver', label: 'Жолооч', type: 'text' },
    { name: 'type', label: 'Төрөл', type: 'select', options: [{ value: 'truck', label: 'Ачааны' }, { value: 'van', label: 'Фургон' }, { value: 'car', label: 'Суудлын' }] },
    { name: 'fuelLevel', label: 'Түлшний түвшин %', type: 'number' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'available', options: [{ value: 'available', label: 'Чөлөөтэй' }, { value: 'on-route', label: 'Маршрутад' }, { value: 'maintenance', label: 'Засварт' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function FleetManagementPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/fleetVehicles`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Truck size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Авто Парк</h3>
                            <div className="fds-hero-desc">Тээврийн хэрэгслийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Машин нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт машин</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Truck size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Маршрутад</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'on-route').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><MapPin size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Засварт</h4><div className="text-3xl font-black text-warning">{items.filter(i => i.status === 'maintenance').length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Fleet</h4><div className="text-xl font-black">GPS LIVE</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Fuel size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Машин</th><th>Улсын №</th><th>Жолооч</th><th>Түлш %</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Машин олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.vehicleName}</td><td className="font-black text-primary">{i.plateNumber}</td><td>{i.driver || '-'}</td><td>{i.fuelLevel || 0}%</td><td><span className={`badge badge-${i.status === 'on-route' ? 'success' : i.status === 'maintenance' ? 'warning' : 'secondary'} text-[10px] font-black uppercase`}>{i.status === 'on-route' ? 'МАРШРУТАД' : i.status === 'maintenance' ? 'ЗАСВАРТ' : 'ЧӨЛӨӨТЭЙ'}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Автопарк" icon={<Truck size={20} />} collectionPath="businesses/{bizId}/fleetVehicles" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
