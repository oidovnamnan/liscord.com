import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Globe, Palette, Settings, CreditCard, Truck, ChevronRight, Eye, Save, ExternalLink, ShoppingBag, Layout, Smartphone, Plus } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'settingKey', label: 'Тохиргооны түлхүүр', type: 'text', required: true },
    { name: 'settingValue', label: 'Утга', type: 'text', required: true },
    { name: 'category', label: 'Ангилал', type: 'select', options: [{ value: 'general', label: 'Ерөнхий' }, { value: 'payment', label: 'Төлбөр' }, { value: 'delivery', label: 'Хүргэлт' }, { value: 'theme', label: 'Загвар' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function EcommercePage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [enabled, setEnabled] = useState(true);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/ecommerceSettings`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    const stats = [
        { label: 'Тохиргоо', value: String(items.length), icon: Settings, color: 'primary' },
        { label: 'Төлбөрийн', value: String(items.filter(i => i.category === 'payment').length), icon: CreditCard, color: 'success' },
        { label: 'Хүргэлтийн', value: String(items.filter(i => i.category === 'delivery').length), icon: Truck, color: 'info' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <Header title="Онлайн Дэлгүүр" subtitle="Өөрийн вэб дэлгүүрийг кодгүйгээр тохируулж ажиллуулах" />
            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100">
                <div className="card p-0 overflow-hidden border shadow-xl bg-gradient-to-br from-indigo-600 via-primary to-primary-focus text-white relative group">
                    <Globe className="absolute -right-16 -bottom-16 text-white/10 group-hover:scale-110 transition-transform duration-1000" size={300} strokeWidth={1} />
                    <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3"><span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Active Storefront</span><h3 className="m-0 text-3xl font-black tracking-tight">{enabled ? 'Дэлгүүр идэвхтэй' : 'Дэлгүүр түр зогссон'}</h3></div>
                            <div className="flex items-center gap-2 mt-4 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md"><Globe size={18} className="text-white/60" /><code className="text-sm font-black tracking-wider flex-1 truncate">https://my-store.liscord.com</code><button className="btn btn-ghost btn-sm text-white hover:bg-white/20 px-4 flex items-center gap-2"><ExternalLink size={16} /> Вэб нээх</button></div>
                        </div>
                        <div className="flex flex-col gap-3 items-center"><div className="scale-125 p-4 bg-white/10 rounded-2xl border border-white/20"><label className="inline-flex items-center cursor-pointer"><input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" /><div className="w-14 h-8 bg-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success"></div></label></div></div>
                    </div>
                </div>
                <div className="grid-3 gap-6">
                    {stats.map((s, i) => (<div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift"><div className="flex justify-between items-start mb-1 relative z-10"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span><div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm`}><s.icon size={20} strokeWidth={2.5} /></div></div><div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div></div>))}
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                    <div className="p-4 border-b flex justify-between items-center"><h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><Settings size={14} className="text-primary" /> Тохиргоонууд</h4><button className="btn btn-primary btn-sm" onClick={() => { setEditingItem(null); setShowModal(true) }}><Plus size={16} /> Тохиргоо нэмэх</button></div>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Түлхүүр</th><th>Утга</th><th>Ангилал</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тохиргоо олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.settingKey}</td><td>{i.settingValue}</td><td><span className="badge badge-outline text-[10px] font-black uppercase">{i.category || 'general'}</span></td></tr>)}</tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Ecommerce тохиргоо" icon={<Globe size={20} />} collectionPath="businesses/{bizId}/ecommerceSettings" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
