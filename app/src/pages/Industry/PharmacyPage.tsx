// PharmacyPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Pill,
    ShoppingCart,
    Package,
    AlertTriangle,
    Plus,
    Search,
    ChevronRight,
    BarChart3,
    Activity,
    ClipboardList,
    Smartphone,
    RefreshCw,
    Scan,
    ArrowUpRight,
    History
} from 'lucide-react';

export function PharmacyPage() {
    const products = [
        { id: 'PH-01', name: 'Парацетамол 500мг', stock: 124, price: 3500, expiry: '2025-06', status: 'In Stock' },
        { id: 'PH-02', name: 'Витамин C 1000мг', stock: 15, price: 8500, expiry: '2024-12', status: 'Low Stock' },
        { id: 'PH-03', name: 'Аспирин 81мг', stock: 450, price: 2000, expiry: '2026-02', status: 'In Stock' },
        { id: 'PH-04', name: 'Хүүхдийн сироп', stock: 4, price: 12500, expiry: '2024-05', status: 'Expiring Soon' },
    ];

    const alerts = [
        { type: 'expiry', message: 'Хугацаа дуусах дөхсөн 12 бараа байна', icon: AlertTriangle, color: 'warning' },
        { type: 'stock', message: 'Үлдэгдэл багассан 5 бараа байна', icon: Package, color: 'error' },
        { type: 'order', message: 'E-Prescription шинээр 3 ирлээ', icon: ClipboardList, color: 'primary' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Эмийн Сан"
                subtitle="Эмийн бүртгэл, хугацааны хяналт болон цахим жорын удирдлага"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Pharmacy Stats & POS Quick Access */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Өнөөдрийн борлуулалт</span>
                            <div className="p-3 rounded-2xl bg-success-light text-success shadow-sm">
                                <BarChart3 size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">₮2.8M</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <Activity size={12} /> +12% vs yesterday
                        </div>
                        <ShoppingCart className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Нийт эм, бараа</span>
                            <div className="p-3 rounded-2xl bg-primary-light text-primary shadow-sm">
                                <Pill size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">1,240</div>
                        <div className="mt-2 text-[10px] font-bold text-muted flex items-center gap-1 relative z-10">
                            <Package size={12} /> 45 genres active
                        </div>
                        <Pill className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Scan className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight uppercase">Pharmacy POS</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">Түргэн борлуулалт хийх</p>
                            </div>
                            <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 mt-2">
                                <Scan size={16} strokeWidth={3} /> Баркод уншуулах
                            </button>
                        </div>
                    </div>

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Шинэ эм нэмэх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Inventory Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Pill size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Эмийн нөөц</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Эм хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                    <button className="btn btn-outline h-12 px-6 rounded-2xl border-black/5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><RefreshCw size={14} /> Full Sync</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Нэр / ID</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Үлдэгдэл</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Үнэ</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Хугацаа</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {products.map((p) => (
                                            <tr key={p.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-primary group-hover/row:rotate-12 transition-transform"><Pill size={18} /></div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{p.name}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{p.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-md font-black tracking-tighter ${p.stock < 20 ? 'text-error animate-pulse' : 'text-gray-900'}`}>{p.stock} ширхэг</span>
                                                        <div className="w-16 h-1 bg-black/5 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${p.stock < 20 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${Math.min(100, p.stock)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-800 tracking-tighter">₮{p.price.toLocaleString()}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge ${p.status === 'Expiring Soon' ? 'badge-error' : p.status === 'Low Stock' ? 'badge-warning' : 'badge-ghost'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{p.expiry}</span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary shadow-sm"><ArrowUpRight size={16} /></button>
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted shadow-sm"><History size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Pharmacy Alerts & E-Prescription */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-error" /> Мэдэгдэл ба Сэрэмжлүүлэг
                                </h4>
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {alerts.map((a, i) => (
                                    <div key={i} className={`p-5 rounded-2xl bg-${a.color}-light border border-${a.color}/10 flex items-center gap-4 group/alert cursor-pointer hover:translate-x-1 transition-transform`}>
                                        <div className={`p-2 rounded-xl bg-${a.color} text-white shadow-lg shadow-${a.color}/20 group-hover/alert:rotate-12 transition-transform`}>
                                            <a.icon size={16} />
                                        </div>
                                        <span className={`text-[11px] font-black tracking-tight text-${a.color === 'primary' ? 'primary' : a.color === 'error' ? 'error' : 'gray-700'}`}>{a.message}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-4 bg-surface-2 rounded-2xl border border-black/5 flex items-center gap-4 group/prescription cursor-pointer hover-lift">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-black/5"><ClipboardList size={24} /></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">Цахим жор хүлээгдэж байна</div>
                                        <div className="text-sm font-black tracking-tight">E-Prescription: #82410</div>
                                    </div>
                                    <ChevronRight className="ml-auto text-muted" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <Smartphone size={16} strokeWidth={3} /> Customer App Integration
                                </button>
                            </div>

                            <History className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-[#1a1c22] to-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <RefreshCw className="absolute -right-8 -top-8 text-white/5 group-hover:rotate-180 transition-transform duration-700" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Inventory Management</h4>
                                <p className="m-0 text-md font-black italic tracking-tight opacity-80">"Эмийн нөөц болон хадгалах хугацааг 100% автоматжуулан хялбарчилсан."</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-success animate-pulse"><Activity size={20} strokeWidth={2.5} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Global Stock</span>
                                        <span className="text-xs font-bold text-success">Live across 12 branches</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
