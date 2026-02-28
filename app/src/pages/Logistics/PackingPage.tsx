import { useState } from 'react';
import { Header } from '../../components/layout/Header';
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
    Smartphone
} from 'lucide-react';

interface PackingOrder {
    id: string;
    orderId: string;
    items: number;
    boxType: 'standard' | 'large' | 'fragile';
    status: 'pending' | 'sorting' | 'packed' | 'checked';
    priority: 'high' | 'normal';
}

const MOCK_PACKING: PackingOrder[] = [
    {
        id: 'PCK-101',
        orderId: 'ORD-5501',
        items: 12,
        boxType: 'standard',
        status: 'packed',
        priority: 'high'
    },
    {
        id: 'PCK-102',
        orderId: 'ORD-5502',
        items: 45,
        boxType: 'large',
        status: 'sorting',
        priority: 'normal'
    },
    {
        id: 'PCK-103',
        orderId: 'ORD-5510',
        items: 2,
        boxType: 'fragile',
        status: 'pending',
        priority: 'normal'
    }
];

export function PackingPage() {
    const [orders] = useState<PackingOrder[]>(MOCK_PACKING);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ангилалт & Савлагаа (Packing)"
                    subtitle="Агуулахаас гарсан барааг ангилан савлах, хайрцаглах болон чанар шалгах үйл явц"
                    action={{
                        label: "Савлагаа эхлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт захиалга</h4>
                                <div className="text-3xl font-black text-primary">85</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Box size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Амжилттай</h4>
                                <div className="text-3xl font-black text-success">64</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж хугацаа</h4>
                                <div className="text-3xl font-black text-warning">4м</div>
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

                    {/* Orders Status Grid */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {orders.map(order => (
                            <div key={order.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none group">
                                <div className="flex items-stretch border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                    <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-6">
                                        <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">
                                            {order.boxType === 'fragile' ? <Activity size={32} /> : <Box size={32} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black tracking-tight">{order.orderId}</h3>
                                                <div className="badge badge-outline text-[10px] font-black border-border-color/20 uppercase">{order.boxType}</div>
                                            </div>
                                            <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <span className="flex items-center gap-1 text-primary"><Layers size={12} /> {order.items} ШИРХЭГ</span>
                                                <span className="flex items-center gap-1"><ClipboardCheck size={12} /> ID: {order.id}</span>
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
                        ))}
                    </div>

                    {/* Layout / Box Config Alert */}
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
        </HubLayout>
    );
}
