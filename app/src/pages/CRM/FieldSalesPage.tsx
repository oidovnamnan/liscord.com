import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { MapPin, Phone, Navigation, CheckCircle2, Users, Plus, Star, TrendingUp } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'salesRep', label: 'Борлуулагч', type: 'text', required: true },
    { name: 'customerName', label: 'Хэрэглэгч', type: 'text', required: true },
    { name: 'address', label: 'Хаяг', type: 'text' },
    { name: 'phone', label: 'Утас', type: 'phone' },
    { name: 'visitDate', label: 'Зочилсон огноо', type: 'date' },
    { name: 'result', label: 'Үр дүн', type: 'select', defaultValue: 'visited', options: [{ value: 'visited', label: 'Зочилсон' }, { value: 'sold', label: 'Борлуулалт хийсэн' }, { value: 'followup', label: 'Дахин холбогдох' }, { value: 'rejected', label: 'Татгалзсан' }] },
    { name: 'amount', label: 'Борлуулалтын дүн', type: 'currency' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function FieldSalesPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/fieldSalesVisits`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    return (
        <HubLayout hubId="crm-hub">
            <Header title="Газар дээрхи борлуулалт" subtitle="Борлуулагчдын зочилсон газар, үр дүн, маршрутыг хянах" action={{ label: 'Зочилт бүртгэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт зочилт</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary"><MapPin size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Борлуулалт</h4><div className="text-3xl font-black text-success">{items.filter(i => i.result === 'sold').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт дүн</h4><div className="text-3xl font-black text-info">₮{(items.reduce((s, c) => s + (c.amount || 0), 0) / 1000000).toFixed(1)}M</div></div><div className="bg-info/10 p-4 rounded-2xl text-info"><TrendingUp size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Field</h4><div className="text-xl font-black">SALES</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md"><Star size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Борлуулагч</th><th>Хэрэглэгч</th><th>Хаяг</th><th>Огноо</th><th>Үр дүн</th><th>Дүн</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Зочилт олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.salesRep}</td><td>{i.customerName}</td><td className="text-sm text-muted">{i.address || '-'}</td><td>{i.visitDate || '-'}</td><td><span className={`badge badge-${i.result === 'sold' ? 'success' : i.result === 'followup' ? 'warning' : i.result === 'rejected' ? 'danger' : 'primary'} text-[10px] font-black uppercase`}>{i.result}</span></td><td className="font-black text-primary">₮{(i.amount || 0).toLocaleString()}</td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Газар дээрхи борлуулалт" icon={<MapPin size={20} />} collectionPath="businesses/{bizId}/fieldSalesVisits" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
