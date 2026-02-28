import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Truck,
    Search,
    Zap,
    ArrowRight,
    Filter,
    Ship,
    Activity,
    Globe,
    ShieldCheck,
    Database,
    MoreVertical,
    Smartphone
} from 'lucide-react';

interface DropShipOrder {
    id: string;
    originalOrderId: string;
    vendor: string;
    items: string[];
    price: number;
    status: 'pending-vendor' | 'vendor-shipped' | 'delivered';
    trackingNum: string;
}

const MOCK_DROPSHIPS: DropShipOrder[] = [
    {
        id: 'DSP-001',
        originalOrderId: 'ORD-9901',
        vendor: 'Alibaba Direct',
        items: ['USB Hubs x 50'],
        price: 1250.00,
        status: 'pending-vendor',
        trackingNum: 'TBC'
    },
    {
        id: 'DSP-002',
        originalOrderId: 'ORD-9905',
        vendor: 'Amazon FBA',
        items: ['Laptop Sleeves x 20'],
        price: 450.00,
        status: 'vendor-shipped',
        trackingNum: 'UPS-11223344'
    },
    {
        id: 'DSP-003',
        originalOrderId: 'ORD-9920',
        vendor: 'Local Supplier',
        items: ['Paper Packs x 100'],
        price: 85.00,
        status: 'delivered',
        trackingNum: 'LOCAL-88'
    }
];

export function DropShippingPage() {
    const [orders] = useState<DropShipOrder[]>(MOCK_DROPSHIPS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Дропшиппинг (Drop-Shipping)"
                    subtitle="Агуулахад бараа өөрөө хадгалалгүйгээр нийлүүлэгчээс шууд хэрэглэгчид хүргэх захиалгын хяналт"
                    action={{
                        label: "Дропшип захиалга",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт захиалга</h4>
                                <div className="text-3xl font-black text-primary">245</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Truck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Тээвэрлэлтэнд</h4>
                                <div className="text-3xl font-black text-secondary">82</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Ship size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Гүйцэтгэл (%)</h4>
                                <div className="text-3xl font-black text-success">98%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><ShieldCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Sync Engine</h4>
                                <div className="text-xl font-black text-white">AUTO-VENDOR HUB</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Захиалгын ID, нийлүүлэгч, трэкинг дугаар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    {/* DropShip Orders List */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {orders.map(order => (
                            <div key={order.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className="p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[150px] bg-surface-2">
                                        <div className="h-12 w-12 rounded-xl bg-surface-3 border border-border-color/10 flex items-center justify-center font-black text-primary text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                            {order.vendor.substring(0, 1)}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{order.vendor}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black tracking-tight">{order.originalOrderId}</h3>
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest">/ {order.trackingNum}</div>
                                            </div>
                                            <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <span className="flex items-center gap-1 text-primary"><Globe size={12} /> {order.items[0]}</span>
                                                <span className="flex items-center gap-1">₮{order.price.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <span className={`badge font-black text-[10px] px-6 py-2 uppercase tracking-widest badge-${order.status === 'delivered' ? 'success' :
                                                    order.status === 'vendor-shipped' ? 'primary' : 'warning'
                                                }`}>
                                                {order.status === 'delivered' ? 'ХҮРГЭГДСЭН' :
                                                    order.status === 'vendor-shipped' ? 'ТЭЭВЭРТ' : 'НИЙЛҮҮЛЭГЧИД'}
                                            </span>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost p-3 rounded-xl border border-border-color/10 text-muted hover:text-primary"><MoreVertical size={20} /></button>
                                                <button className="btn btn-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vendor API Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Vendor Direct API Sync</h3>
                                <p className="text-sm text-muted">Нийлүүлэгч талын системтэй (Shopify, Amazon, Alibaba) шууд холбогдож захиалга автоматаар дамжуулах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">API ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Smartphone size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
