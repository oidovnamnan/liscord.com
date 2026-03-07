import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Coffee, Plus, MapPin, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'machineName', label: 'Аппаратын нэр', type: 'text', required: true },
    { name: 'location', label: 'Байршил', type: 'text', required: true },
    { name: 'type', label: 'Төрөл', type: 'select', options: [{ value: 'snack', label: 'Зууш' }, { value: 'drink', label: 'Ундаа' }, { value: 'coffee', label: 'Кофе' }, { value: 'combo', label: 'Хосолсон' }] },
    { name: 'stockLevel', label: 'Нөөцийн түвшин %', type: 'number' },
    { name: 'revenue', label: 'Орлого', type: 'currency' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [{ value: 'active', label: 'Идэвхтэй' }, { value: 'low-stock', label: 'Нөөц бага' }, { value: 'offline', label: 'Салсан' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function VendingPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/vendingMachines`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="Вендинг аппарат" subtitle="Вендинг аппаратуудын нөөц, орлого, статус хянах" action={{ label: 'Аппарат нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Coffee size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'active').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нөөц бага</h4><div className="text-3xl font-black text-warning">{items.filter(i => i.status === 'low-stock').length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Vending</h4><div className="text-xl font-black">MACHINE NET</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><DollarSign size={28} /></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{loading ? <div className="col-span-3" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="col-span-3 card" style={{ padding: 60, textAlign: 'center' }}><Coffee size={48} color="var(--text-muted)" /><h3>Аппарат олдсонгүй</h3></div> :
                    items.map(i => (
                        <div key={i.id} className={`card p-6 border-2 cursor-pointer hover:scale-[1.02] transition-all ${i.status === 'active' ? 'border-success/30' : i.status === 'low-stock' ? 'border-warning/30' : 'border-danger/30'}`} onClick={() => { setEditingItem(i); setShowModal(true) }}>
                            <div className="flex justify-between items-center mb-4"><h4 className="m-0 font-black tracking-tight">{i.machineName}</h4><span className={`badge badge-${i.status === 'active' ? 'success' : i.status === 'low-stock' ? 'warning' : 'danger'} text-[10px] font-black uppercase`}>{i.status}</span></div>
                            <div className="text-xs text-muted mb-4 flex items-center gap-1"><MapPin size={12} />{i.location}</div>
                            <div className="flex justify-between items-center pt-3 border-t border-black/5"><div><div className="text-[10px] font-black uppercase text-muted tracking-widest">Нөөц</div><div className="text-lg font-black">{i.stockLevel || 0}%</div></div><div className="text-right"><div className="text-[10px] font-black uppercase text-muted tracking-widest">Орлого</div><div className="text-lg font-black text-primary">{(i.revenue || 0).toLocaleString()}₮</div></div></div>
                        </div>
                    ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Вендинг аппарат" icon={<Coffee size={20} />} collectionPath="businesses/{bizId}/vendingMachines" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
