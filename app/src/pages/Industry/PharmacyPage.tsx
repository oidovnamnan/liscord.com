import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Pill, Plus, Clock, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'name', label: 'Эмийн нэр', type: 'text', required: true },
    { name: 'genericName', label: 'Ерөнхий нэр', type: 'text' },
    {
        name: 'category', label: 'Ангилал', type: 'select', options: [
            { value: 'prescription', label: 'Жороор' }, { value: 'otc', label: 'Жоргүй' }, { value: 'supplement', label: 'Нэмэлт тэжээл' },
        ]
    },
    { name: 'stock', label: 'Үлдэгдэл', type: 'number', required: true },
    { name: 'price', label: 'Үнэ', type: 'currency' },
    { name: 'expiryDate', label: 'Дуусах хугацаа', type: 'date' },
    { name: 'supplier', label: 'Нийлүүлэгч', type: 'text' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function PharmacyPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/pharmacyItems`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub">
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Pill size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Эмийн Сан</h3>
                            <div className="fds-hero-desc">Эмийн сангийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Эм нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт эм</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Package size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нөөц багатай</h4><div className="text-3xl font-black text-warning">{items.filter(i => (i.stock || 0) < 10).length}</div></div><div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хугацаа дуусах</h4><div className="text-3xl font-black text-danger">{items.filter(i => i.expiryDate).length}</div></div><div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><Clock size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Pharmacy</h4><div className="text-xl font-black">RX SYSTEM</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Pill size={28} /></div></div>
                </div>
                <div className="card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th className="pl-6">Эмийн нэр</th><th>Ангилал</th><th>Үлдэгдэл</th><th>Үнэ</th><th>Дуусах хугацаа</th><th>Төлөв</th></tr></thead><tbody>
                            {items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Эм олдсонгүй</td></tr> :
                                items.map(i => <tr key={i.id} className="hover:bg-surface-2 cursor-pointer" onClick={() => { setEditingItem(i); setShowModal(true) }}>
                                    <td className="pl-6 py-4 font-bold">{i.name}</td>
                                    <td className="text-[10px] font-black uppercase tracking-widest text-muted">{i.category || '-'}</td>
                                    <td className={`font-black ${(i.stock || 0) < 10 ? 'text-danger' : 'text-success'}`}>{i.stock || 0}</td>
                                    <td>{(i.price || 0).toLocaleString()}₮</td><td>{i.expiryDate || '-'}</td>
                                    <td><span className={`badge badge-${(i.stock || 0) < 10 ? 'danger' : 'success'} text-[10px] font-black uppercase`}>{(i.stock || 0) < 10 ? 'БАГА' : 'ХАНГАЛТТАЙ'}</span></td>
                                </tr>)}
                        </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Эмийн бүртгэл" icon={<Pill size={20} />} collectionPath="businesses/{bizId}/pharmacyItems" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
