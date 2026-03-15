import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Calculator, Plus, DollarSign, TrendingUp, Utensils, UtensilsCrossed} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'recipeName', label: 'Хоолны нэр', type: 'text', required: true },
    { name: 'category', label: 'Ангилал', type: 'select', options: [{ value: 'main', label: 'Үндсэн' }, { value: 'soup', label: 'Шөл' }, { value: 'salad', label: 'Салат' }, { value: 'dessert', label: 'Амттан' }, { value: 'drink', label: 'Ундаа' }] },
    { name: 'ingredientCost', label: 'Орц найрлагын өртөг', type: 'currency', required: true },
    { name: 'sellingPrice', label: 'Зарах үнэ', type: 'currency', required: true },
    { name: 'margin', label: 'Ашиг %', type: 'number' },
    { name: 'portions', label: 'Порцын тоо', type: 'number' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function FoodCostingPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/foodCosting`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><UtensilsCrossed size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Хоолны Зардал</h3>
                            <div className="fds-hero-desc">Хоолны зардлын тооцоолол</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Хоол нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт хоол</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Utensils size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж ашиг</h4><div className="text-3xl font-black text-success">{items.length > 0 ? Math.round(items.reduce((s, c) => s + (c.margin || 0), 0) / items.length) : 0}%</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Food Cost</h4><div className="text-xl font-black">RECIPE ENGINE</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Calculator size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Хоол</th><th>Ангилал</th><th>Өртөг</th><th>Зарах үнэ</th><th>Ашиг %</th><th>Порц</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Хоол олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.recipeName}</td><td className="text-[10px] font-black uppercase tracking-widest text-muted">{i.category || '-'}</td><td>{(i.ingredientCost || 0).toLocaleString()}₮</td><td className="font-black text-primary">{(i.sellingPrice || 0).toLocaleString()}₮</td><td className="text-success font-black">+{i.margin || 0}%</td><td>{i.portions || '-'}</td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Хоолны өртөг" icon={<Utensils size={20} />} collectionPath="businesses/{bizId}/foodCosting" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
