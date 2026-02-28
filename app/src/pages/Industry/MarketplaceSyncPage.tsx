import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Zap,
    RefreshCw,
    Globe,
    ShoppingBag,
    CheckCircle2,
    AlertCircle,
    ArrowRightLeft,
    TrendingUp,
    Settings,
    Search,
    Filter,
    ShoppingCart,
    Package,
    ArrowUpRight,
    History
} from 'lucide-react';

export function MarketplaceSyncPage() {
    const platforms = [
        { id: 'shoppy', name: 'Shoppy.mn', status: 'connected', sync: '2 мин өмнө', orders: 42, products: 124, icon: ShoppingBag, color: 'primary' },
        { id: 'facebook', name: 'FB Shop', status: 'connected', sync: '15 мин өмнө', orders: 12, products: 85, icon: Globe, color: 'info' },
        { id: 'instagram', name: 'Insta Shop', status: 'warning', sync: '2 цаг өмнө', orders: 8, products: 85, icon: Zap, color: 'warning' },
        { id: 'amazon', name: 'Amazon (US)', status: 'disconnected', sync: '-', orders: 0, products: 0, icon: Globe, color: 'muted' },
    ];

    const syncLogs = [
        { id: 1, platform: 'Shoppy', type: 'Order Sync', message: '3 Шинэ захиалга ирлээ', time: '14:22', status: 'success' },
        { id: 2, platform: 'FB Shop', type: 'Stock Sync', message: '12 Барааны үлдэгдэл шинэчлэгдэв', time: '14:15', status: 'success' },
        { id: 3, platform: 'Insta Shop', type: 'Price Sync', message: 'Холболтын алдаа (Auth Error)', time: '12:45', status: 'error' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Omni-channel Marketplace Sync"
                subtitle="Гадаад платформуудтай (Shoppy, FB, Amazon) бараа, үлдэгдэл, захиалга шууд синхрончлох"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Connection Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {platforms.map((p, i) => (
                        <div key={p.id} className="card p-8 border shadow-lg bg-white rounded-[2.5rem] group hover-lift animate-slide-up relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className={`p-4 rounded-2xl bg-${p.color}-light text-${p.color} shadow-sm group-hover:rotate-6 transition-transform`}>
                                    <p.icon size={28} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-success animate-pulse' : p.status === 'warning' ? 'bg-warning' : 'bg-gray-300'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-muted tracking-widest">{p.status}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 relative z-10">
                                <h4 className="m-0 text-xl font-black text-gray-900 tracking-tight">{p.name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-gray-800 tracking-tighter">{p.orders}</span>
                                        <span className="text-[9px] font-black uppercase text-muted tracking-widest mt-1">Захиалга</span>
                                    </div>
                                    <div className="w-px h-8 bg-black/5"></div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-gray-800 tracking-tighter">{p.products}</span>
                                        <span className="text-[9px] font-black uppercase text-muted tracking-widest mt-1">Бараа</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-black/5 flex justify-between items-center relative z-10">
                                <span className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-1"><RefreshCw size={12} /> {p.sync}</span>
                                <button className="btn btn-ghost btn-sm h-8 px-4 rounded-lg bg-surface-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Setup</button>
                            </div>

                            <ArrowRightLeft className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-125 transition-transform duration-1000" size={100} strokeWidth={1} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Synchronized Inventory Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-2 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-[1.5rem] shadow-lg shadow-primary/10"><RefreshCw size={24} /></div>
                                    <div>
                                        <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter">Синхрончлогдсон Бараанууд</h3>
                                        <p className="m-0 text-[10px] font-bold uppercase text-muted tracking-widest mt-1">Үлдэгдэл бүх сувгаар нэгэн зэрэг шинэчлэгдэнэ</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Бараа хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                    <button className="btn btn-outline h-12 w-12 rounded-2xl border-black/5 flex items-center justify-center"><Filter size={18} /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Бараа</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Нийт үлдэгдэл</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Сувгийн Төлөв</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Синхрон</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {[
                                            { name: 'Утсан Чихэвч Gen 4', stock: 124, platforms: ['shoppy', 'facebook'] },
                                            { name: 'Ухаалаг Цаг S8', stock: 45, platforms: ['shoppy', 'facebook', 'instagram'] },
                                            { name: 'Bluetooth Спикер', stock: 210, platforms: ['shoppy'] },
                                        ].map((item, i) => (
                                            <tr key={i} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-primary group-hover/row:rotate-6 transition-transform"><Package size={20} /></div>
                                                        <span className="font-black text-gray-800 tracking-tight">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-xl text-gray-900 tracking-tighter">{item.stock} ширхэг</td>
                                                <td className="px-10 py-6">
                                                    <div className="flex gap-2">
                                                        {item.platforms.map(p => (
                                                            <div key={p} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-muted border border-black/5">
                                                                <div className={`w-2 h-2 rounded-full ${p === 'shoppy' ? 'bg-primary' : p === 'facebook' ? 'bg-info' : 'bg-warning'}`}></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary shadow-sm"><RefreshCw size={16} /></button>
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted shadow-sm"><ArrowRightLeft size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard: Logs & Global Control */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <TrendingUp className="absolute -right-6 -top-6 text-black/5 group-hover:scale-110 transition-transform duration-1000" size={140} />
                            <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <History size={16} className="text-primary" /> Синхрончлолын бүртгэл
                            </h4>
                            <div className="flex flex-col gap-6 relative z-10">
                                {syncLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4 items-start group/log cursor-pointer">
                                        <div className={`p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover/log:rotate-12
                                            ${log.status === 'success' ? 'bg-success-light text-success' : 'bg-error-light text-error shadow-lg shadow-error/10'}`}>
                                            {log.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-muted tracking-widest">{log.platform} • {log.type}</span>
                                                <span className="text-[10px] font-black text-gray-400">{log.time}</span>
                                            </div>
                                            <div className="text-xs font-black text-gray-800 tracking-tight mt-1 line-clamp-1">{log.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="h-px bg-black/5 mt-2"></div>
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center gap-4 p-4 bg-surface-2 rounded-2xl border border-black/5">
                                    <ShoppingCart className="text-primary" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted">Бүх сувгийн захиалга</div>
                                        <div className="text-sm font-black tracking-tight">Нийт 62 шинэ захиалга</div>
                                    </div>
                                    <ArrowUpRight className="ml-auto text-primary" size={20} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <RefreshCw size={14} strokeWidth={3} /> Global Inventory Sync
                                </button>
                            </div>
                        </div>

                        <div className="card p-8 bg-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <Globe className="absolute -right-8 -bottom-8 text-white/5 group-hover:rotate-12 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="flex justify-between items-start">
                                    <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Global Marketplace</h4>
                                    <Settings size={16} className="text-white/20 hover:text-white transition-colors cursor-pointer" />
                                </div>
                                <p className="m-0 text-sm font-black leading-relaxed tracking-tight">Marketplace холболтоор дамжуулан борлуулалтаа <span className="text-primary tracking-tighter text-lg underline">250%</span> хүртэл өсгөх боломжтой.</p>
                                <div className="flex items-center gap-3 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary"><Zap size={20} strokeWidth={2.5} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Pro Tip</span>
                                        <span className="text-xs font-bold">Insta Shop холболт алдаатай байна!</span>
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
