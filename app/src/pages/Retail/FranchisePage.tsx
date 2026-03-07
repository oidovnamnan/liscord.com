import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { TrendingUp, DollarSign, PieChart, MapPin, AlertCircle, ChevronRight, BarChart3, Settings, ShieldCheck, Briefcase, Activity, Users, Search, Filter, Percent, Plus } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'name', label: 'Салбар нэр', type: 'text', required: true },
    { name: 'owner', label: 'Эзэмшигч', type: 'text', required: true },
    { name: 'location', label: 'Байршил', type: 'text' },
    { name: 'sales', label: 'Борлуулалт', type: 'currency' },
    { name: 'royaltyRate', label: 'Роялти хувь %', type: 'number', defaultValue: 3 },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [{ value: 'paid', label: 'Төлөгдсөн' }, { value: 'pending', label: 'Нэхэмжилсэн' }, { value: 'overdue', label: 'Хоцорсон' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FranchisePage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/franchiseBranches`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const stats = [
        { label: 'Нийт салбарын борлуулалт', value: `₮${items.reduce((s, c) => s + (c.sales || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'primary' },
        { label: 'Нийт Роялти (Орлого)', value: `₮${items.reduce((s, c) => s + ((c.sales || 0) * (c.royaltyRate || 3) / 100), 0).toLocaleString()}`, icon: TrendingUp, color: 'success' },
        { label: 'Идэвхтэй салбар', value: String(items.length), icon: MapPin, color: 'info' },
        { label: 'Гэрээний нийцлэл', value: `${items.length > 0 ? Math.round(items.filter(i => i.status === 'paid').length / items.length * 100) : 0}%`, icon: ShieldCheck, color: 'warning' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <Header title="Франчайз Удирдлага" subtitle="Олон салбарын нэгдсэн хяналт, роялти хураамж тооцох систем" />
            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100 h-full">
                <div className="grid-4 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-1 relative z-10 text-muted">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                                <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm transform group-hover:-rotate-12 transition-transform`}><s.icon size={20} strokeWidth={2.5} /></div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                            <PieChart className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={100} />
                        </div>
                    ))}
                </div>

                <div className="grid-3-1 gap-8">
                    <div className="flex flex-col gap-6 animate-slide-left">
                        <div className="card border shadow-xl flex flex-col p-0 overflow-hidden group bg-white">
                            <div className="p-6 border-b bg-surface-2 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><BarChart3 size={14} className="text-primary" /> Салбаруудын гүйцэтгэл</h4>
                                <div className="flex gap-2">
                                    <div className="relative group/search"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" size={14} /><input type="text" className="input input-sm h-10 pl-9 rounded-xl border-none ring-1 ring-black/5 focus:ring-primary/40" placeholder="Салбар хайх..." /></div>
                                    <button className="btn btn-outline btn-sm h-10 rounded-xl px-4 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"><Filter size={16} /> Шүүлтүүр</button>
                                    <button className="btn btn-primary btn-sm h-10 rounded-xl px-4 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]" onClick={() => { setEditingItem(null); setShowModal(true) }}><Plus size={16} /> Салбар</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                                    <table className="table w-full"><thead><tr className="bg-surface-3/50 text-xs font-black uppercase tracking-widest text-muted border-b"><th className="p-6 text-left">Салбар нэр</th><th className="p-6 text-left">Эзэмшигч</th><th className="p-6 text-right">Борлуулалт</th><th className="p-6 text-right">Роялти</th><th className="p-6 text-center">Төлөв</th><th className="p-6"></th></tr></thead>
                                        <tbody className="divide-y">
                                            {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Салбар олдсонгүй</td></tr> :
                                                items.map(b => (
                                                    <tr key={b.id} className="hover:bg-surface-2/50 transition-all group/row cursor-pointer" onClick={() => { setEditingItem(b); setShowModal(true) }}>
                                                        <td className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-surface-1 border border-black/5 flex items-center justify-center font-black text-gray-400 shadow-sm group-hover/row:bg-primary group-hover/row:text-white transition-all">{(b.name || '?').charAt(0)}</div><span className="font-extrabold text-gray-800 tracking-tight">{b.name}</span></div></td>
                                                        <td className="p-6 text-sm font-bold text-muted">{b.owner}</td>
                                                        <td className="p-6 text-right font-black text-gray-900 tracking-tight">₮{(b.sales || 0).toLocaleString()}</td>
                                                        <td className="p-6 text-right"><div className="font-black text-primary tracking-tight">₮{((b.sales || 0) * (b.royaltyRate || 3) / 100).toLocaleString()}</div><div className="text-[10px] text-muted font-bold uppercase tracking-widest">{b.royaltyRate || 3}% хувь</div></td>
                                                        <td className="p-6 text-center"><span className={`badge uppercase font-black text-[10px] tracking-widest px-3 py-1.5 rounded-lg ${b.status === 'paid' ? 'badge-success-light' : b.status === 'overdue' ? 'badge-danger-light' : 'badge-warning-light'}`}>{b.status === 'paid' ? 'Төлөгдсөн' : b.status === 'overdue' ? 'Хоцорсон' : 'Нэхэмжилсэн'}</span></td>
                                                        <td className="p-6 text-right"><button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl"><ChevronRight size={18} className="text-muted" /></button></td>
                                                    </tr>
                                                ))}
                                        </tbody></table>)}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 animate-slide-right">
                        <div className="card p-8 border shadow-xl bg-gradient-to-br from-surface-2 to-white relative group overflow-hidden">
                            <Briefcase className="absolute -right-8 -bottom-8 text-black/5 group-hover:rotate-12 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-8 flex items-center gap-2"><Settings size={14} className="text-primary" /> Франчайзи тохиргоо</h4>
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all"><Percent size={20} /></div>
                                    <div className="flex-1"><div className="text-sm font-black text-gray-800 uppercase tracking-tight">Роялти Хувь</div><div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Бүх салбарт тохируулах</div></div>
                                    <ChevronRight size={18} className="text-muted" />
                                </div>
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all"><Users size={20} /></div>
                                    <div className="flex-1"><div className="text-sm font-black text-gray-800 uppercase tracking-tight">Нэвтрэх эрх</div><div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Салбар эзэмшигчдийн хандалт</div></div>
                                    <ChevronRight size={18} className="text-muted" />
                                </div>
                            </div>
                        </div>
                        <div className="card p-8 bg-black text-white relative border shadow-2xl group overflow-hidden">
                            <Activity className="absolute -right-8 -bottom-8 text-white/5 group-hover:-translate-y-4 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest mb-6 flex items-center gap-2"><AlertCircle size={14} className="text-warning" /> Анхаарал хандуулах</h4>
                            <div className="space-y-4 relative z-10">
                                {items.filter(i => i.status === 'overdue' || i.status === 'pending').slice(0, 3).map(i => (
                                    <div key={i.id} className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-pointer">
                                        <div className={`w-2 h-2 rounded-full ${i.status === 'overdue' ? 'bg-error' : 'bg-warning'} mt-1.5 animate-pulse`}></div>
                                        <div><div className="text-xs font-black uppercase tracking-tight">{i.name} - {i.status === 'overdue' ? 'Төлбөр хоцорсон' : 'Нэхэмжилсэн'}</div></div>
                                    </div>
                                ))}
                                {items.filter(i => i.status === 'overdue' || i.status === 'pending').length === 0 && <div className="text-white/40 text-xs">Анхааруулга байхгүй</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="Франчайз салбар" icon={<Briefcase size={20} />} collectionPath="businesses/{bizId}/franchiseBranches" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
