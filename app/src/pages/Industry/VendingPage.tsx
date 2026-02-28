import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    AppWindow,
    Wifi,
    Battery,
    Thermometer,
    Zap,
    Package,
    AlertTriangle,
    ChevronRight,
    Search,
    Filter,
    Activity,
    Smartphone,
    CreditCard,
    DollarSign,
    RefreshCw,
    MapPin,
    BarChart3
} from 'lucide-react';

export function VendingPage() {
    const machines = [
        { id: 'VM-01', location: 'Төв салбар - Lobby', status: 'online', stock: 85, temp: '4°C', signal: 'Strong', battery: '100%' },
        { id: 'VM-02', location: 'Хан-Уул Салбар', status: 'online', stock: 42, temp: '5°C', signal: 'Medium', battery: '85%' },
        { id: 'VM-03', location: 'Нисэх - Gate 4', status: 'warning', stock: 12, temp: '4°C', signal: 'Weak', battery: '42%' },
        { id: 'VM-04', location: '1-р Дэлгүүр', status: 'offline', stock: 0, temp: '-', signal: '-', battery: '-' },
    ];

    const slots = [
        { id: 'A1', item: 'Кола 0.5', price: 3500, stock: 12, max: 15 },
        { id: 'A2', item: 'Ус 0.5', price: 2000, stock: 8, max: 15 },
        { id: 'B1', item: 'Сникерс', price: 4500, stock: 4, max: 20 },
        { id: 'B2', item: 'Lays Chips', price: 8500, stock: 15, max: 15 },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Автомат Машин (Vending) Удирдлага"
                subtitle="Зайнаас IoT төхөөрөмжийг хянах, бараа дүүргэлт, температур болон гүйлгээний удирдлага"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                <div className="grid-3 gap-6 mb-8">
                    <div className="card p-8 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Нийт гүйлгээ</span>
                            <div className="p-2 rounded-xl bg-primary-light text-primary shadow-sm">
                                <DollarSign size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">₮4.2M</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <BarChart3 size={12} /> +15.5% last week
                        </div>
                        <Activity className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Бараа дүүргэлт</span>
                            <div className="p-2 rounded-xl bg-warning-light text-warning shadow-sm">
                                <Package size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">3 Машин</div>
                        <div className="mt-2 text-[10px] font-bold text-warning flex items-center gap-1 relative z-10">
                            <AlertTriangle size={12} /> 20%-иас бага үлдэгдэлтэй
                        </div>
                        <AppWindow className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up shadow-primary/10" style={{ animationDelay: '200ms' }}>
                        <Wifi className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight">Төхөөрөмжийн Төлөв</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">Нийт 14 машин идэвхтэй</p>
                            </div>
                            <div className="flex gap-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-success"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">12 Online</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">2 Offline</span>
                                </div>
                            </div>
                            <button className="btn btn-primary h-12 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 mt-2"><Zap size={14} strokeWidth={3} /> Remote System Start</button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border shadow-sm">
                            <div className="flex gap-4">
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-6 rounded-xl">Бүх Машин</button>
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-muted hover:text-gray-900 px-6 rounded-xl">Low Stock</button>
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-muted hover:text-gray-900 px-6 rounded-xl">Offline</button>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-outline h-10 w-10 p-0 rounded-xl border-black/5 flex items-center justify-center"><Filter size={14} /></button>
                                <button className="btn btn-outline h-10 w-10 p-0 rounded-xl border-black/5 flex items-center justify-center"><Search size={14} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {machines.map((m, i) => (
                                <div key={m.id} className="card p-8 border shadow-sm bg-white hover:border-primary/20 transition-all group animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex flex-col md:flex-row gap-8 items-center">
                                        <div className={`p-5 rounded-[2rem] shadow-lg transition-transform group-hover:rotate-6 flex-shrink-0
                                            ${m.status === 'online' ? 'bg-primary-light text-primary shadow-primary/10' :
                                                m.status === 'warning' ? 'bg-warning-light text-warning shadow-warning/10' : 'bg-surface-2 text-muted shadow-inner'}`}>
                                            <AppWindow size={36} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="m-0 text-2xl font-black text-gray-900 tracking-tighter">{m.location}</h4>
                                                <span className={`badge ${m.status === 'online' ? 'badge-primary' : m.status === 'warning' ? 'badge-warning' : 'badge-ghost'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{m.id}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-6 mt-2">
                                                <div className="flex items-center gap-2 text-muted font-bold tracking-tight text-xs"><Thermometer size={14} /> {m.temp}</div>
                                                <div className="flex items-center gap-2 text-muted font-bold tracking-tight text-xs"><Wifi size={14} /> {m.signal}</div>
                                                <div className="flex items-center gap-2 text-muted font-bold tracking-tight text-xs"><Battery size={14} /> {m.battery}</div>
                                                <div className="flex items-center gap-2 text-muted font-bold tracking-tight text-xs"><MapPin size={14} /> Map</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black uppercase text-muted tracking-widest mb-2">Үлдэгдэл</span>
                                                <div className="w-32 h-2.5 bg-surface-2 rounded-full overflow-hidden border">
                                                    <div className={`h-full rounded-full ${m.stock > 50 ? 'bg-primary' : m.stock > 20 ? 'bg-warning' : 'bg-error'} shadow-lg`} style={{ width: `${m.stock}%` }}></div>
                                                </div>
                                                <span className="text-[11px] font-black text-gray-800 mt-2 tracking-tighter">{m.stock}% дүүрэн</span>
                                            </div>
                                            <button className="btn btn-ghost btn-icon h-14 w-14 rounded-2xl bg-surface-2 hover:bg-primary hover:text-white transition-all"><ChevronRight size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-2xl bg-white rounded-[2.5rem] flex flex-col gap-8 overflow-hidden relative group">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Package size={16} className="text-primary" /> VM-01: Бараа дүүргэлт
                                </h4>
                                <RefreshCw size={16} className="text-muted cursor-pointer hover:rotate-180 transition-transform duration-700" />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {slots.map((slot) => (
                                    <div key={slot.id} className="p-4 bg-surface-2 border border-black/5 rounded-2xl flex items-center justify-between group/item hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-gray-800 tracking-tighter shadow-sm">{slot.id}</div>
                                            <div>
                                                <div className="text-xs font-black text-gray-800 truncate w-32 tracking-tight">{slot.item}</div>
                                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">₮{slot.price.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`text-md font-black tracking-tighter ${slot.stock < 5 ? 'text-error animate-pulse' : 'text-gray-900'}`}>{slot.stock}/{slot.max}</div>
                                            <div className="h-1 w-12 bg-black/5 rounded-full overflow-hidden mt-1">
                                                <div className={`h-full rounded-full ${slot.stock < 5 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${(slot.stock / slot.max) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 relative z-10 mt-2">
                                <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 flex items-center justify-center gap-2">Remote Dispense</button>
                                <button className="btn btn-outline h-14 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2">Price Sync</button>
                            </div>

                            <CreditCard className="absolute -right-8 -bottom-8 text-black/5 opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-1000" size={160} />
                        </div>

                        <div className="card p-8 border shadow-xl bg-gradient-to-br from-[#1a1c22] to-black rounded-[2.5rem] text-white flex flex-col gap-6 group">
                            <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-primary" /> Сүүлийн гүйлгээ
                            </h4>
                            <div className="flex flex-col gap-4">
                                {[
                                    { item: 'Кола 0.5', price: '₮3,500', time: '18:45', method: 'App' },
                                    { item: 'Сникерс', price: '₮4,500', time: '18:32', method: 'Card' },
                                    { item: 'Ус 0.5', price: '₮2,000', time: '18:15', method: 'QR' },
                                ].map((tx, i) => (
                                    <div key={i} className="flex justify-between items-center group/item cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover/item:text-primary transition-colors">
                                                <Smartphone size={14} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black tracking-tight">{tx.item}</div>
                                                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{tx.method}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="text-xs font-black tracking-tight text-primary">{tx.price}</div>
                                            <div className="text-[10px] font-bold text-white/40">{tx.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
