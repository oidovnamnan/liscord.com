import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Box,
    Search,
    Zap,
    ArrowRight,
    Filter,
    CheckCircle2,
    Clock,
    Activity,
    ClipboardCheck,
    Barcode,
    Maximize,
    Layers,
    MoreVertical,
    Smartphone, Package} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const PACKING_FIELDS: CrudField[] = [
    { name: 'orderId', label: 'Захиалгын дугаар', type: 'text', required: true },
    { name: 'items', label: 'Барааны тоо', type: 'number', required: true },
    {
        name: 'boxType', label: 'Хайрцагны төрөл', type: 'select', defaultValue: 'standard', options: [
            { value: 'standard', label: 'Стандарт' },
            { value: 'large', label: 'Том' },
            { value: 'fragile', label: 'Эмзэг бараа' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'sorting', label: 'Ангилж буй' },
            { value: 'packed', label: 'Савлагдсан' },
            { value: 'checked', label: 'Шалгагдсан' },
        ]
    },
    {
        name: 'priority', label: 'Эрэмбэ', type: 'select', defaultValue: 'normal', options: [
            { value: 'high', label: 'Яаралтай' },
            { value: 'normal', label: 'Ердийн' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function PackingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/packing`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Package size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Савлагаа</h3>
                            <div className="fds-hero-desc">Савлагааны удирдлага</div>
                        </div>
                    </div>
                </div>
            </div>

                <div className="grid-12 gap-6 mt-6">
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт захиалга</h4>
                                <div className="text-3xl font-black text-primary">{orders.length}</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Box size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Амжилттай</h4>
                                <div className="text-3xl font-black text-success">{orders.filter(o => o.status === 'packed' || o.status === 'checked').length}</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээгдэж буй</h4>
                                <div className="text-3xl font-black text-warning">{orders.filter(o => o.status === 'pending' || o.status === 'sorting').length}</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Efficiency</h4>
                                <div className="text-xl font-black">FAST PACK ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Захиалгын дугаар, баркодоор хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    <div className="col-12 grid grid-cols-1 gap-4">
                        {loading ? (
                            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                        ) : orders.length === 0 ? (
                            <div className="card" style={{ padding: 60, textAlign: 'center' }}><Box size={48} color="var(--text-muted)" /><h3>Савлагааны захиалга олдсонгүй</h3></div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none group" onClick={() => { setEditingItem(order); setShowModal(true); }} style={{ cursor: 'pointer' }}>
                                    <div className="flex items-stretch border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                        <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-6">
                                            <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">
                                                {order.boxType === 'fragile' ? <Activity size={32} /> : <Box size={32} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black tracking-tight">{order.orderId}</h3>
                                                    <div className="badge badge-outline text-[10px] font-black border-border-color/20 uppercase">{order.boxType || 'standard'}</div>
                                                </div>
                                                <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                    <span className="flex items-center gap-1 text-primary"><Layers size={12} /> {order.items || 0} ШИРХЭГ</span>
                                                    <span className="flex items-center gap-1"><ClipboardCheck size={12} /> {order.priority === 'high' ? 'ЯАРАЛТАЙ' : 'ЕРДИЙН'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 w-full md:w-auto">
                                                <span className={`badge font-black text-[10px] px-6 py-2 uppercase tracking-widest badge-${order.status === 'packed' ? 'success' :
                                                    order.status === 'sorting' ? 'warning' :
                                                        order.status === 'checked' ? 'primary' : 'secondary'
                                                    }`}>
                                                    {order.status === 'packed' ? 'САВЛАГДСАН' :
                                                        order.status === 'sorting' ? 'АНГИЛЖ БУЙ' :
                                                            order.status === 'checked' ? 'ШАЛГАГДСАН' : 'ХҮЛЭЭГДЭЖ БУЙ'}
                                                </span>
                                                <div className="h-10 w-px bg-border-color/10 mx-2" />
                                                <div className="flex gap-2">
                                                    <button className="btn btn-ghost p-3 rounded-xl hover:text-primary transition-colors border border-border-color/10"><Barcode size={20} /></button>
                                                    <button className="btn btn-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                        <ArrowRight size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-12 bg-surface-2 flex items-center justify-center border-l border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                            <button className="text-muted"><MoreVertical size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Maximize size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Савлагааны заавар (Packing Logic)</h3>
                                <p className="text-sm text-muted">Хайрцаглах заавар болон савлагааны хасах жин/хэмжээг автоматаар тохируулах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ЗААВАР ХАРАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Smartphone size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && <GenericCrudModal title="Савлагаа" icon={<Box size={20} />} collectionPath="businesses/{bizId}/packing" fields={PACKING_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
