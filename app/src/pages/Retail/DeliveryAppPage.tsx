import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Truck, MapPin, CheckCircle2, Clock, Package, TrendingUp, Activity, Plus, Navigation, Phone, MessageCircle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'customer', label: 'Хэрэглэгч', type: 'text', required: true },
    { name: 'address', label: 'Хаяг', type: 'text', required: true },
    { name: 'phone', label: 'Утас', type: 'phone' },
    { name: 'items', label: 'Бараанууд', type: 'text' },
    { name: 'driverName', label: 'Жолооч', type: 'text' },
    { name: 'scheduledTime', label: 'Товлосон цаг', type: 'text' },
    { name: 'distance', label: 'Зай (км)', type: 'text' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [{ value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'delivering', label: 'Хүргэж байна' }, { value: 'delivered', label: 'Хүргэсэн' }, { value: 'failed', label: 'Хүргэгдээгүй' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function DeliveryAppPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/deliveryTasks`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const stats = [
        { label: 'Өнөөдрийн хүргэлт', value: `${items.filter(i => i.status === 'delivered').length}/${items.length}`, icon: Truck, color: 'primary' },
        { label: 'Хүлээгдэж буй', value: String(items.filter(i => i.status === 'pending').length), icon: Clock, color: 'warning' },
        { label: 'Хүргэж байна', value: String(items.filter(i => i.status === 'delivering').length), icon: Navigation, color: 'info' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <Header title="Жолоочийн цонх" subtitle="Захиалга хүргэлтийн явц, жолоочийн ажлын орчин" action={{ label: 'Хүргэлт нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-8 animate-fade-in translate-y-0 opacity-100 h-full">
                <div className="flex flex-col gap-6 stagger-children">
                    <div className="grid-3 gap-6">
                        {stats.map((s, i) => (
                            <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex justify-between items-start mb-1 relative z-10"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span><div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm transform group-hover:rotate-12 transition-transform`}><s.icon size={20} strokeWidth={2.5} /></div></div>
                                <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                                <TrendingUp className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-125 transition-transform" size={100} />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-2"><h4 className="m-0 text-[11px] font-black uppercase text-muted tracking-[0.2em] flex items-center gap-2"><Activity size={14} className="text-primary" /> Хүргэлтийн даалгаварууд</h4><span className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-full">{items.filter(i => i.status === 'pending').length} хүлээгдэж буй</span></div>
                        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="card" style={{ padding: 60, textAlign: 'center' }}><Truck size={48} color="var(--text-muted)" /><h3>Хүргэлт олдсонгүй</h3></div> :
                            items.map((task, i) => (
                                <div key={task.id} className="card border shadow-sm p-6 hover-lift flex items-center justify-between group transition-all animate-slide-up bg-white cursor-pointer" style={{ animationDelay: `${i * 100}ms` }} onClick={() => { setEditingItem(task); setShowModal(true) }}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-black/5 flex items-center justify-center font-black text-lg text-muted">{task.scheduledTime || '--'}</div>
                                        <div>
                                            <h4 className="m-0 text-lg font-black tracking-tight text-gray-800">{task.customer}</h4>
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted mt-1 uppercase tracking-tight"><MapPin size={12} className="text-primary" /> {task.address || 'Хаяг тодорхойгүй'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`badge badge-${task.status === 'delivered' ? 'success' : task.status === 'delivering' ? 'primary' : task.status === 'failed' ? 'danger' : 'warning'} text-[10px] font-black uppercase`}>{task.status === 'delivered' ? 'Хүргэсэн' : task.status === 'delivering' ? 'Хүргэж байна' : task.status === 'failed' ? 'Амжилтгүй' : 'Хүлээгдэж буй'}</span>
                                        {task.distance && <span className="text-xs font-bold text-muted">{task.distance}</span>}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Хүргэлтийн даалгавар" icon={<Truck size={20} />} collectionPath="businesses/{bizId}/deliveryTasks" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
