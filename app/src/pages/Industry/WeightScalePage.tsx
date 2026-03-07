import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Scale, Plus, Package, CheckCircle2, Activity } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'weight', label: 'Жин (кг)', type: 'number', required: true },
    { name: 'pricePerKg', label: 'Кг-ийн үнэ', type: 'currency', required: true },
    { name: 'totalPrice', label: 'Нийт үнэ', type: 'currency' },
    { name: 'barcode', label: 'Баркод', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function WeightScalePage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/weightScaleRecords`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="Жинлүүр / Weight Scale" subtitle="Жингээр зарах бараа бүтээгдэхүүний үнэ тооцоо, баркод хэвлэх" action={{ label: 'Бүртгэл нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт бүртгэл</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Package size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт жин</h4><div className="text-3xl font-black text-success">{items.reduce((s, c) => s + (c.weight || 0), 0).toFixed(1)} кг</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Scale size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Scale</h4><div className="text-xl font-black">WEIGHT SYS</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Бүтээгдэхүүн</th><th>Жин (кг)</th><th>Кг үнэ</th><th>Нийт</th><th>Баркод</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.productName}</td><td className="font-black">{i.weight} кг</td><td>{(i.pricePerKg || 0).toLocaleString()}₮</td><td className="font-black text-primary">{(i.totalPrice || (i.weight || 0) * (i.pricePerKg || 0)).toLocaleString()}₮</td><td className="text-[10px] text-muted font-mono">{i.barcode || '-'}</td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Жинлүүр" icon={<Scale size={20} />} collectionPath="businesses/{bizId}/weightScaleRecords" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
