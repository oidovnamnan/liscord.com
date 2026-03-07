import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Warehouse, Plus, Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'client', label: 'Үйлчлүүлэгч', type: 'text', required: true },
    { name: 'origin', label: 'Гарах газар', type: 'text', required: true },
    { name: 'destination', label: 'Хүрэх газар', type: 'text', required: true },
    { name: 'weight', label: 'Жин (кг)', type: 'number' },
    { name: 'service', label: 'Үйлчилгээ', type: 'select', options: [{ value: 'warehouse', label: 'Агуулахын' }, { value: 'transport', label: 'Тээвэр' }, { value: 'fulfillment', label: 'Гүйцэтгэл' }] },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'received', options: [{ value: 'received', label: 'Хүлээн авсан' }, { value: 'processing', label: 'Боловсруулж буй' }, { value: 'shipped', label: 'Илгээсэн' }, { value: 'delivered', label: 'Хүргэсэн' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function Logistics3PLPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/logistics3pl`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="3PL Логистик" subtitle="Гуравдагч талын логистик үйлчилгээний удирдлага" action={{ label: 'Захиалга нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Package size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүргэсэн</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'delivered').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Боловсруулж буй</h4><div className="text-3xl font-black text-warning">{items.filter(i => i.status === 'processing').length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">3PL</h4><div className="text-xl font-black">FULFILL SYS</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Warehouse size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Үйлчлүүлэгч</th><th>Гарах</th><th>Хүрэх</th><th>Жин</th><th>Үйлчилгээ</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Захиалга олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.client}</td><td>{i.origin}</td><td>{i.destination}</td><td>{i.weight || '-'} кг</td><td className="text-[10px] font-black uppercase tracking-widest text-muted">{i.service || '-'}</td><td><span className={`badge badge-${i.status === 'delivered' ? 'success' : i.status === 'shipped' ? 'primary' : i.status === 'processing' ? 'warning' : 'secondary'} text-[10px] font-black uppercase`}>{i.status || 'received'}</span></td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="3PL захиалга" icon={<Warehouse size={20} />} collectionPath="businesses/{bizId}/logistics3pl" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
