import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Monitor, Plus, ShoppingCart, DollarSign, Repeat } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const F: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'price', label: 'Үнэ', type: 'currency', required: true },
    { name: 'quantity', label: 'Тоо', type: 'number', required: true },
    { name: 'displayText', label: 'Дэлгэцийн текст', type: 'text' },
    { name: 'adsImage', label: 'Сурталчилгааны зураг URL', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function PoleDisplayPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/poleDisplayItems`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><Header title="Pole Display / Хэрэглэгчийн дэлгэц" subtitle="POS-ийн хэрэглэгч рүү харсан дэлгэцийн тохиргоо, үнийн мэдээлэл" action={{ label: 'Зүйл нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт зүйл</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><ShoppingCart size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт дүн</h4><div className="text-3xl font-black text-success">{items.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0).toLocaleString()}₮</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><DollarSign size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Display</h4><div className="text-xl font-black">POLE SYS</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Monitor size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th className="pl-6">Бүтээгдэхүүн</th><th>Үнэ</th><th>Тоо</th><th>Дэлгэцийн текст</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Зүйл олдсонгүй</td></tr> : items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}><td className="pl-6 py-4 font-bold">{i.productName}</td><td className="font-black text-primary">{(i.price || 0).toLocaleString()}₮</td><td>{i.quantity || 1}</td><td className="text-muted">{i.displayText || '-'}</td></tr>)}</tbody></table>)}</div>
            </div>
            {showModal && <GenericCrudModal title="Pole Display" icon={<Monitor size={20} />} collectionPath="businesses/{bizId}/poleDisplayItems" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
