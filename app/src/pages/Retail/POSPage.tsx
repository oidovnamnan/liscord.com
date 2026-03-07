import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, QrCode, Barcode, Save, User, Menu } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const F: CrudField[] = [
    { name: 'name', label: 'Барааны нэр', type: 'text', required: true },
    { name: 'price', label: 'Үнэ', type: 'currency', required: true },
    { name: 'category', label: 'Ангилал', type: 'select', options: [{ value: 'food', label: 'Хүнс' }, { value: 'drink', label: 'Ундаа' }, { value: 'household', label: 'Ахуй' }, { value: 'stationery', label: 'Бичиг' }, { value: 'other', label: 'Бусад' }] },
    { name: 'image', label: 'Emoji', type: 'text', defaultValue: '📦' },
    { name: 'barcode', label: 'Баркод', type: 'text' },
    { name: 'stock', label: 'Нөөц', type: 'number' },
];

export function POSPage() {
    const { business } = useBusinessStore();
    const [products, setProducts] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [cart, setCart] = useState<any[]>([]);

    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/posProducts`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, s => { setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]); // eslint-disable-line

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToCart = (p: any) => { setCart(prev => { const e = prev.find(i => i.id === p.id); if (e) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { ...p, qty: 1 }]; }); };
    const updateQty = (id: string, delta: number) => { setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)); };
    const removeFromCart = (id: string) => { setCart(prev => prev.filter(i => i.id !== id)); };
    const subtotal = cart.reduce((acc, i) => acc + ((i.price || 0) * i.qty), 0);

    return (
        <HubLayout hubId="retail-hub">
            <div className="flex flex-col h-full gap-4 -mt-6">
                <Header title="ПОС Касс" subtitle="Жижиглэн борлуулалт, кассын үйлчилгээ" action={{ label: "Бараа нэмэх", onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="flex-1 flex gap-6 overflow-hidden min-h-[600px] pb-6">
                    {/* Left: Product Grid */}
                    <div className="flex-1 flex flex-col gap-6 animate-fade-in">
                        <div className="flex gap-4 p-4 bg-white rounded-3xl border shadow-xl shadow-black/5 ring-1 ring-black/5">
                            <div className="relative flex-1 group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} /><input type="text" className="input h-14 pl-12 rounded-2xl bg-surface-2 border-none ring-1 ring-black/5 focus:ring-primary/40 text-lg font-bold" placeholder="Бараа хайх эсвэл баркод скан хийх..." /></div>
                            <div className="flex gap-2"><button className="btn btn-outline h-14 w-14 rounded-2xl flex items-center justify-center p-0"><Barcode size={24} /></button><button className="btn btn-outline h-14 rounded-2xl flex items-center gap-2 px-6"><Menu size={20} /> Ангилал</button></div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 gap-6">{loading ? <div className="col-span-3" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : products.length === 0 ? <div className="col-span-3 card" style={{ padding: 60, textAlign: 'center' }}><ShoppingCart size={48} color="var(--text-muted)" /><h3>Бараа олдсонгүй</h3><p className="text-muted text-sm">Дээрх "Бараа нэмэх" товч дарж бараа нэмнэ үү</p></div> :
                            products.map((p, i) => (
                                <div key={p.id} className="card group hover-lift p-1 overflow-hidden relative border shadow-lg hover:shadow-primary/10 transition-all cursor-pointer select-none active:scale-[0.98] animate-slide-up" style={{ animationDelay: `${i * 50}ms` }} onClick={() => addToCart(p)}>
                                    <div className="aspect-square bg-surface-2 rounded-2xl flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">{p.image || '📦'}</div>
                                    <div className="p-4 flex flex-col gap-1">
                                        <div className="flex justify-between items-start"><span className="text-[10px] font-black uppercase tracking-widest text-muted">{p.category || 'Бусад'}</span><Plus className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} strokeWidth={3} /></div>
                                        <h4 className="m-0 text-gray-800 font-extrabold tracking-tight truncate">{p.name}</h4>
                                        <div className="text-xl font-black text-primary tracking-tighter">₮{(p.price || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg scale-0 group-active:scale-125 transition-transform">+1</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Right: Cart */}
                    <div className="w-[450px] flex flex-col gap-6 animate-slide-right">
                        <div className="flex-1 card border shadow-2xl p-0 flex flex-col overflow-hidden group">
                            <div className="p-6 border-b bg-surface-2 flex justify-between items-center"><h4 className="m-0 text-sm font-black uppercase text-gray-500 tracking-widest flex items-center gap-2"><ShoppingCart size={18} className="text-primary" /> Сагс</h4><div className="badge badge-primary rounded-lg font-black">{cart.length} бараа</div></div>
                            <div className="flex-1 overflow-y-auto bg-white">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-muted gap-4 px-12 text-center"><div className="w-24 h-24 rounded-full bg-surface-3 flex items-center justify-center border-4 border-dashed animate-pulse"><ShoppingCart size={40} className="opacity-20" /></div><div><h4 className="m-0 font-black text-xs uppercase tracking-widest">Сагс хоосон байна</h4></div></div>) : (<div className="divide-y">{cart.map(i => (<div key={i.id} className="p-5 flex items-center justify-between hover:bg-surface-2 transition-all group/item"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-surface-1 flex items-center justify-center text-2xl shadow-sm border border-black/5">{i.image || '📦'}</div><div><div className="font-extrabold text-gray-800 leading-none mb-1">{i.name}</div><div className="text-xs font-bold text-muted uppercase tracking-tighter">₮{(i.price || 0).toLocaleString()} х {i.qty}</div></div></div><div className="flex items-center gap-3"><div className="flex items-center bg-white rounded-xl shadow-sm border p-1"><button className="btn btn-icon btn-xs hover:bg-surface-2" onClick={() => updateQty(i.id, -1)}><Minus size={14} /></button><span className="w-8 text-center font-black text-sm">{i.qty}</span><button className="btn btn-icon btn-xs hover:bg-surface-2 text-primary" onClick={() => updateQty(i.id, 1)}><Plus size={14} /></button></div><button className="btn btn-icon btn-xs text-error opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={() => removeFromCart(i.id)}><Trash2 size={14} /></button></div></div>))}</div>)}</div>
                            <div className="p-8 bg-surface-3 border-t flex flex-col gap-6"><div className="space-y-3"><div className="flex justify-between items-center text-xs font-bold uppercase text-muted tracking-widest"><span>Нийт дүн</span></div><div className="flex justify-between items-center pt-3 border-t"><span className="text-sm font-black uppercase text-gray-900">Төлөх</span><span className="text-4xl font-black text-primary tracking-tighter">₮{subtotal.toLocaleString()}</span></div></div><div className="grid grid-cols-2 gap-4"><button className="btn btn-outline h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black uppercase tracking-widest text-[10px]"><User size={20} /> Харилцагч</button><button className="btn btn-outline h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black uppercase tracking-widest text-[10px]"><Save size={20} /> Түр хадгалах</button></div></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button className="btn btn-primary h-28 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all group border-b-8 border-primary-focus"><QrCode size={32} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">QPay / QR</span></button>
                            <button className="btn btn-primary h-28 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all group border-b-8 border-primary-focus"><DollarSign size={32} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Бэлэн мөнгө</span></button>
                            <button className="btn btn-primary h-28 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all group border-b-8 border-primary-focus"><CreditCard size={32} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Карт</span></button>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && <GenericCrudModal title="POS бараа" icon={<ShoppingCart size={20} />} collectionPath="businesses/{bizId}/posProducts" fields={F} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
