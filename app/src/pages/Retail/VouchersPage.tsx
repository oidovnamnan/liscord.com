import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Ticket, Plus, Calendar, Clock, TrendingUp, DollarSign, Search, Filter, Copy, Tag, ChevronRight, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const F: CrudField[] = [
    { name: 'code', label: 'Купон код', type: 'text', required: true },
    { name: 'type', label: 'Төрөл', type: 'select', required: true, options: [{ value: 'percentage', label: 'Хувь (%)' }, { value: 'fixed', label: 'Тогтмол дүн (₮)' }, { value: 'freeShipping', label: 'Үнэгүй хүргэлт' }] },
    { name: 'value', label: 'Хэмжээ', type: 'number', required: true },
    { name: 'usageLimit', label: 'Хэрэглэх хязгаар', type: 'number' },
    { name: 'usageCount', label: 'Ашиглагдсан', type: 'number', defaultValue: 0 },
    { name: 'expiry', label: 'Дуусах хугацаа', type: 'date' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [{ value: 'active', label: 'Идэвхтэй' }, { value: 'expired', label: 'Хугацаа дууссан' }, { value: 'scheduled', label: 'Товлогдсон' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function VouchersPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/vouchers`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const stats = [
        { label: 'Нийт ашиглалт', value: items.reduce((s, c) => s + (c.usageCount || 0), 0).toLocaleString(), icon: Users, color: 'primary' },
        { label: 'Идэвхтэй купон', value: String(items.filter(i => i.status === 'active').length), icon: Ticket, color: 'info' },
        { label: 'Хэмнэсэн дүн', value: `₮${items.reduce((s, c) => s + (c.type === 'fixed' ? (c.value || 0) * (c.usageCount || 0) : 0), 0).toLocaleString()}`, icon: DollarSign, color: 'success' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Ticket size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Купон</h3>
                            <div className="fds-hero-desc">Купон, хямдрал удирдлага</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-8 h-full">
                <div className="flex flex-col gap-6 stagger-children animate-fade-in translate-y-0 opacity-100 h-full">
                    <div className="grid-3 gap-6">
                        {stats.map((s, i) => (
                            <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                                    <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm group-hover:rotate-12 transition-transform`}><s.icon size={20} strokeWidth={2.5} /></div>
                                </div>
                                <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                                <TrendingUp className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-125 transition-transform" size={100} />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 bg-surface-2 p-4 rounded-3xl border shadow-inner shadow-black/5">
                        <div className="relative flex-1 group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} /><input type="text" className="input h-14 pl-12 rounded-2xl bg-white border-none ring-1 ring-black/5 focus:ring-primary/40 text-lg font-bold" placeholder="Купон код хайх..." /></div>
                        <div className="flex gap-3">
                            <button className="btn btn-outline h-14 rounded-2xl px-6 flex items-center gap-2"><Filter size={20} /> Шүүлтүүр</button>
                            <button className="btn btn-primary h-14 rounded-2xl px-8 flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => { setEditingItem(null); setShowModal(true) }}><Plus size={24} strokeWidth={3} /> Шинэ купон</button>
                        </div>
                    </div>

                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.length === 0 ? <div className="col-span-3 card" style={{ padding: 60, textAlign: 'center' }}><Ticket size={48} color="var(--text-muted)" /><h3>Купон олдсонгүй</h3></div> :
                                items.map((v, i) => (
                                    <div key={v.id} className={`card p-0 relative border-2 shadow-lg hover-lift group overflow-hidden cursor-pointer ${v.status === 'expired' ? 'opacity-60 grayscale border-dashed border-gray-300' : 'bg-white border-surface-2 hover:border-primary/20'} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }} onClick={() => { setEditingItem(v); setShowModal(true) }}>
                                        <div className={`p-6 border-b flex justify-between items-center ${v.status === 'active' ? 'bg-primary text-white' : 'bg-surface-2 text-muted'}`}>
                                            <div className="flex items-center gap-3"><Tag size={20} /><h4 className="m-0 text-xl font-black tracking-widest">{v.code}</h4></div>
                                            <Copy className="cursor-pointer hover:scale-110 active:scale-90 transition-all" size={18} />
                                        </div>
                                        <div className="p-8 pb-4 relative">
                                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-surface-3 rounded-full -translate-y-1/2 border-r-2 border-surface-2 z-10"></div>
                                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-surface-3 rounded-full -translate-y-1/2 border-l-2 border-surface-2 z-10"></div>
                                            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-dashed border-gray-100 -translate-y-1/2 pointer-events-none"></div>
                                            <div className="grid grid-cols-2 gap-8 mb-4">
                                                <div className="flex flex-col gap-1"><span className="text-[10px] uppercase font-black tracking-widest text-muted">Хэмжээ</span><div className="text-4xl font-black tracking-tighter text-gray-900">{v.type === 'percentage' ? `${v.value}%` : `₮${((v.value || 0) / 1000).toFixed(0)}k`}</div></div>
                                                <div className="flex flex-col gap-1 text-right"><span className="text-[10px] uppercase font-black tracking-widest text-muted">Ашиглалт</span><div className="text-xl font-black tracking-tight text-primary">{v.usageCount || 0}/{v.usageLimit || '∞'}</div></div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-surface-2/50 border-t flex items-center justify-between group-hover:bg-white transition-all">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted"><Clock size={14} /> Дуусах: {v.expiry || 'Тодорхойгүй'}</div>
                                            <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl"><ChevronRight size={20} /></button>
                                        </div>
                                    </div>
                                ))}
                        </div>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Купон / Бэлгийн Карт" icon={<Ticket size={20} />} collectionPath="businesses/{bizId}/vouchers" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
