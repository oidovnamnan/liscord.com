import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { MonitorSmartphone, Plus, Clock, CheckCircle2, ChefHat, AlertTriangle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'orderNumber', label: 'Захиалгын дугаар', type: 'text', required: true },
    { name: 'items', label: 'Хоол (нэрс)', type: 'text', required: true },
    { name: 'table', label: 'Ширээ', type: 'text' },
    { name: 'priority', label: 'Эрэмбэ', type: 'select', defaultValue: 'normal', options: [{ value: 'urgent', label: 'Яаралтай' }, { value: 'normal', label: 'Ердийн' }] },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'new', options: [{ value: 'new', label: 'Шинэ' }, { value: 'cooking', label: 'Хийж буй' }, { value: 'ready', label: 'Бэлэн' }, { value: 'served', label: 'Гаргасан' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function KDSPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/kdsOrders`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="KDS (Kitchen Display)" subtitle="Гал тогооны дэлгэцийн систем - захиалгын урсгал хянах" action={{ label: 'Захиалга нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><MonitorSmartphone size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хийж буй</h4><div className="text-3xl font-black text-warning">{items.filter(i => i.status === 'cooking' || i.status === 'new').length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Бэлэн</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'ready' || i.status === 'served').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Kitchen</h4><div className="text-xl font-black">KDS LIVE</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><ChefHat size={28} /></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading ? <div className="col-span-4" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="col-span-4 card" style={{ padding: 60, textAlign: 'center' }}><ChefHat size={48} color="var(--text-muted)" /><h3>Захиалга олдсонгүй</h3></div> :
                        items.map(i => (
                            <div key={i.id} className={`card p-6 border-2 cursor-pointer hover:scale-[1.02] transition-all ${i.status === 'new' ? 'border-danger bg-danger/5' : i.status === 'cooking' ? 'border-warning bg-warning/5' : i.status === 'ready' ? 'border-success bg-success/5' : 'border-border-color/10'}`} onClick={() => { setEditingItem(i); setShowModal(true) }}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-black text-primary">#{i.orderNumber}</span>
                                    <span className={`badge badge-${i.status === 'new' ? 'danger' : i.status === 'cooking' ? 'warning' : i.status === 'ready' ? 'success' : 'secondary'} text-[10px] font-black uppercase`}>{i.status === 'new' ? 'ШИНЭ' : i.status === 'cooking' ? 'ХИЙЖ БУЙ' : i.status === 'ready' ? 'БЭЛЭН' : 'ГАРГАСАН'}</span>
                                </div>
                                <div className="text-sm font-bold mb-2">{i.items}</div>
                                <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-widest">
                                    <span>Ширээ: {i.table || '-'}</span>
                                    {i.priority === 'urgent' && <span className="text-danger flex items-center gap-1"><AlertTriangle size={10} /> ЯАРАЛТАЙ</span>}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="KDS Захиалга" icon={<ChefHat size={20} />} collectionPath="businesses/{bizId}/kdsOrders" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
