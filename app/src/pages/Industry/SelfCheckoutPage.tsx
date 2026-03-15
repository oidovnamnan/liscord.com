import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { ScanLine, Plus, ShoppingCart, CreditCard, CheckCircle2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const F: CrudField[] = [
    { name: 'kioskName', label: 'Киоскийн нэр', type: 'text', required: true },
    { name: 'location', label: 'Байршил', type: 'text' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'online', options: [{ value: 'online', label: 'Идэвхтэй' }, { value: 'offline', label: 'Салсан' }, { value: 'maintenance', label: 'Засварт' }] },
    { name: 'todaySales', label: 'Өнөөдрийн борлуулалт', type: 'currency' },
    { name: 'transactions', label: 'Гүйлгээний тоо', type: 'number' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function SelfCheckoutPage() {
    const { business } = useBusinessStore();
    const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/selfCheckoutKiosks`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line
    return (
        <HubLayout hubId="industry-hub"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><ShoppingCart size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Self Checkout</h3>
                            <div className="fds-hero-desc">Өөрөө тооцоо хийх систем</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        Киоск нэмэх
                    </button>
                </div>
            </div>
            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-4 gap-6">
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт киоск</h4><div className="text-3xl font-black text-primary">{items.length}</div></div><div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><ScanLine size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4><div className="text-3xl font-black text-success">{items.filter(i => i.status === 'online').length}</div></div><div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div></div>
                    <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group hover:bg-surface-3 transition-all"><div><h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт борлуулалт</h4><div className="text-3xl font-black text-info">{items.reduce((s, c) => s + (c.todaySales || 0), 0).toLocaleString()}₮</div></div><div className="bg-info/10 p-4 rounded-2xl text-info group-hover:scale-110 transition-transform"><CreditCard size={28} /></div></div>
                    <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-transform"><div><h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Self-Checkout</h4><div className="text-xl font-black">KIOSK SYS</div></div><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><ShoppingCart size={28} /></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{loading ? <div className="col-span-3" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : items.length === 0 ? <div className="col-span-3 card" style={{ padding: 60, textAlign: 'center' }}><ScanLine size={48} color="var(--text-muted)" /><h3>Киоск олдсонгүй</h3></div> :
                    items.map(i => (
                        <div key={i.id} className={`card p-6 border-2 cursor-pointer hover:scale-[1.02] transition-all ${i.status === 'online' ? 'border-success/30 bg-success/5' : i.status === 'offline' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'}`} onClick={() => { setEditingItem(i); setShowModal(true) }}>
                            <div className="flex justify-between items-center mb-4"><h4 className="m-0 font-black tracking-tight">{i.kioskName}</h4><span className={`badge badge-${i.status === 'online' ? 'success' : i.status === 'offline' ? 'danger' : 'warning'} text-[10px] font-black uppercase`}>{i.status === 'online' ? 'ИДЭВХТЭЙ' : i.status === 'offline' ? 'САЛСАН' : 'ЗАСВАРТ'}</span></div>
                            <div className="text-xs text-muted mb-4">{i.location || 'Тодорхойгүй'}</div>
                            <div className="flex justify-between items-center pt-3 border-t border-black/5"><div><div className="text-[10px] font-black uppercase text-muted tracking-widest">Борлуулалт</div><div className="text-lg font-black text-primary">{(i.todaySales || 0).toLocaleString()}₮</div></div><div className="text-right"><div className="text-[10px] font-black uppercase text-muted tracking-widest">Гүйлгээ</div><div className="text-lg font-black">{i.transactions || 0}</div></div></div>
                        </div>
                    ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Self-Checkout Киоск" icon={<ScanLine size={20} />} collectionPath="businesses/{bizId}/selfCheckoutKiosks" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
