import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { QrCode, Plus, Utensils, Eye, Tag } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'name', label: 'Хоолны нэр', type: 'text', required: true },
    { name: 'category', label: 'Ангилал', type: 'select', required: true, options: [{ value: 'appetizer', label: 'Зууш' }, { value: 'main', label: 'Үндсэн' }, { value: 'soup', label: 'Шөл' }, { value: 'dessert', label: 'Амттан' }, { value: 'drink', label: 'Ундаа' }] },
    { name: 'price', label: 'Үнэ', type: 'currency', required: true },
    { name: 'description', label: 'Тайлбар', type: 'text' },
    { name: 'isAvailable', label: 'Бэлэн эсэх', type: 'select', defaultValue: 'yes', options: [{ value: 'yes', label: 'Тийм' }, { value: 'no', label: 'Үгүй' }] },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function DigitalMenuPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/digitalMenu`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><QrCode size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Цахим Цэс</h3>
                            <div className="fds-hero-desc">QR цэсний удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Хоол нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Цэсийн зүйл</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Utensils size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Бэлэн</h4><div className="text-3xl font-black text-success">{items.filter(i => i.isAvailable === 'yes').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Eye size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Digital</h4><div className="text-xl font-black">QR MENU</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><QrCode size={28} /></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{loading ? <div className="col-span-3" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="col-span-3 card" style={{ padding: 60, textAlign: 'center' }}><Utensils size={48} color="var(--text-muted)" /><h3>Цэс хоосон</h3></div> :
                    items.map(i => (
                        <div key={i.id} className="card p-6 border hover:shadow-lg cursor-pointer transition-all hover:border-primary/20 group" onClick={() => { setEditingItem(i); setShowModal(true) }}>
                            <div className="flex justify-between items-start mb-3"><span className="badge badge-outline text-[10px] font-black uppercase tracking-widest">{i.category}</span>{i.isAvailable === 'no' && <span className="badge badge-danger text-[10px]">ДУУССАН</span>}</div>
                            <h4 className="m-0 font-black text-gray-900 tracking-tight text-lg">{i.name}</h4>
                            {i.description && <p className="text-xs text-muted mt-1 mb-3">{i.description}</p>}
                            <div className="flex justify-between items-center mt-auto pt-3 border-t border-black/5"><span className="text-xl font-black text-primary">{(i.price || 0).toLocaleString()}₮</span><Tag size={14} className="text-muted group-hover:text-primary transition-colors" /></div>
                        </div>
                    ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Цэсийн зүйл" icon={<QrCode size={20} />} collectionPath="businesses/{bizId}/digitalMenu" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
