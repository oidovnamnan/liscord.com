// RentalPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Key,
    Car,
    Calendar,
    ShieldCheck,
    Plus,
    Search,
    ChevronRight,
    Activity,
    Clock,
    Zap,
    Smartphone,
    ArrowUpRight,
    ClipboardList,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';

export function RentalPage() {
    const assets = [
        { id: 'RN-101', name: 'Land Cruiser 200', type: 'SUV', status: 'Rented', due: '2024-03-05', customer: 'Б. Бат-Эрдэнэ' },
        { id: 'RN-102', name: 'Hyundai Sonata', type: 'Sedan', status: 'Available', due: '-', customer: '-' },
        { id: 'RN-103', name: 'Generator 50kW', type: 'Equipment', status: 'Maintenance', due: '2024-03-10', customer: '-' },
        { id: 'RN-104', name: 'Ford Ranger', type: 'Pickup', status: 'Rented', due: 'Өнөөдөр', customer: 'С. Халиун' },
    ];

    const stats = [
        { label: 'Түрээслэсэн', value: '18', icon: Key, color: 'primary' },
        { label: 'Ашиглалт', value: '85%', icon: Activity, color: 'success' },
        { label: 'Хүлээгдэж буй', value: '4', icon: Clock, color: 'warning' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Түрээсийн Үйлчилгээ"
                subtitle="Тээврийн хэрэгсэл, тоног төхөөрөмж түрээс болон эргэн ирэх хугацаа хянах"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Rental Overview Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                                <div className={`p-3 rounded-2xl bg-${s.color}-light text-${s.color} shadow-sm group-hover:rotate-12 transition-transform`}>
                                    <s.icon size={24} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">{s.value}</div>
                            <div className="mt-2 text-[10px] font-bold text-muted flex items-center gap-1 relative z-10">
                                <Plus size={12} /> 3 new tasks
                            </div>
                            <s.icon className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                        </div>
                    ))}

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Түрээс нэмэх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Rental Assets Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Car size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Түрээсийн хөрөнгүүд</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Хөрөнгө хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                    <button className="btn btn-outline h-12 w-12 rounded-2xl border-black/5 flex items-center justify-center"><Calendar size={18} /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Хөрөнгө / ID</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Төрөл</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Төлөв</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Хугацаа / Харилцагч</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {assets.map((a) => (
                                            <tr key={a.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover/row:bg-primary group-hover/row:text-white transition-all"><Key size={18} /></div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{a.name}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{a.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge badge-ghost font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{a.type}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge ${a.status === 'Available' ? 'badge-primary' : a.status === 'Rented' ? 'badge-info' : 'badge-warning'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{a.status}</span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-black tracking-tight ${a.due === 'Өнөөдөр' ? 'text-error animate-pulse' : 'text-gray-800'}`}>{a.due}</span>
                                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{a.customer}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary shadow-sm"><ArrowUpRight size={16} /></button>
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted shadow-sm"><ClipboardList size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Rental Reminders & Fleet Control */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-warning" /> Анхаарах түрээсүүд
                                </h4>
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {[
                                    { item: 'Land Cruiser 200', message: 'Хугацаа хэтрэхэд 1 хоног үлдлээ', status: 'Warning' },
                                    { item: 'Ford Ranger', message: 'Өнөөдөр эргэж ирэх хуваарьтай', status: 'Due Today' },
                                ].map((msg, i) => (
                                    <div key={i} className="p-5 bg-surface-2 rounded-2xl border border-black/5 group/msg cursor-pointer hover-lift">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-black text-gray-800 tracking-tight">{msg.item}</div>
                                                <div className="text-[10px] font-bold text-muted mt-0.5">{msg.message}</div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${msg.status === 'Due Today' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>{msg.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-4 bg-primary-light rounded-2xl border border-primary/10 flex items-center gap-4 group/msg cursor-pointer hover:bg-primary hover:text-white transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-black/5"><Smartphone size={24} /></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Mobile Digital Key</div>
                                        <div className="text-xs font-bold mt-0.5">Түрээслэгчид илгээх</div>
                                    </div>
                                    <ChevronRight className="ml-auto opacity-40" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <RefreshCw size={16} strokeWidth={3} /> Fleet Availability Sync
                                </button>
                            </div>

                            <Key className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-[#1a1c22] to-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <ShieldCheck className="absolute -right-8 -top-8 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Rental Protection</h4>
                                <p className="m-0 text-md font-black leading-tight tracking-tight underline-offset-4 decoration-white/20">Бүх түрээсийн хөрөнгө даатгал болон барьцаа төлбөрийн хяналттай.</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary"><Zap size={20} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Risk Mgmt</span>
                                        <span className="text-xs font-bold font-mono">Real-time GPS Monitoring</span>
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
