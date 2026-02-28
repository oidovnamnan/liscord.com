// AutoRepairPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Wrench,
    Car,
    Settings,
    History,
    Plus,
    Search,
    Activity,
    Zap,
    Bluetooth,
    CheckCircle2,
    ArrowUpRight,
    ClipboardList,
    Smartphone
} from 'lucide-react';

export function AutoRepairPage() {
    const jobs = [
        { id: 'JOB-201', plate: '12-34 УБA', model: 'Toyota Prius 30', service: 'Oil Change', status: 'In Progress', technician: 'Bat' },
        { id: 'JOB-202', plate: '99-00 УБС', model: 'Lexus RX 350', service: 'Brake Repair', status: 'Waiting', technician: 'Bold' },
        { id: 'JOB-203', plate: '45-67 УНП', model: 'Hyundai Sonata', service: 'Engine Diagnostic', status: 'Completed', technician: 'Saruul' },
    ];

    const inventory = [
        { item: 'Oil Filter 5W30', stock: 42, min: 10, price: '₮45,000' },
        { item: 'Brake Pad (Front)', stock: 5, min: 8, price: '₮120,000' },
        { item: 'Spark Plug Platinum', stock: 120, min: 20, price: '₮25,000' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Авто Засвар"
                subtitle="Ажлын хуудас, сэлбэгийн үлдэгдэл болон засварын түүх хянах"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Workshop Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Засварлаж буй</span>
                            <div className="p-3 rounded-2xl bg-primary-light text-primary shadow-sm group-hover:rotate-12 transition-transform">
                                <Wrench size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">12</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <Activity size={12} /> 4 Lifts active
                        </div>
                        <Car className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Сэлбэгийн захиалга</span>
                            <div className="p-3 rounded-2xl bg-warning-light text-warning shadow-sm group-hover:rotate-12 transition-transform">
                                <ClipboardList size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">4</div>
                        <div className="mt-2 text-[10px] font-bold text-warning flex items-center gap-1 relative z-10">
                            <Zap size={12} /> 2 critical out
                        </div>
                        <Settings className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Bluetooth className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight uppercase">OBD II Scanner</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">Төхөөрөмж холбогдсон</p>
                            </div>
                            <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 mt-2">
                                <Activity size={16} strokeWidth={3} /> Зайнаас оношлох
                            </button>
                        </div>
                    </div>

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Ажлын хуудас нээх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Repair Jobs Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Wrench size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Засварлаж буй тээврийн хэрэгсэл</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Улсын дугаараар хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Тээврийн хэрэгсэл</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Засвар үйлчилгээ</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Техникч</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Төлөв</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {jobs.map((j) => (
                                            <tr key={j.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover/row:bg-primary group-hover/row:text-white transition-all"><Car size={18} /></div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{j.plate}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{j.model}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-900 tracking-tight">{j.service}</td>
                                                <td className="px-10 py-6 text-xs font-bold text-muted uppercase tracking-widest">{j.technician}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge ${j.status === 'In Progress' ? 'badge-primary' : j.status === 'Waiting' ? 'badge-info' : 'badge-ghost'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{j.status}</span>
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

                    {/* Spare Parts Inventory & Alerts */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Settings size={16} className="text-primary" /> Сэлбэгийн үлдэгдэл
                                </h4>
                                <History size={16} className="text-muted" />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {inventory.map((item, i) => (
                                    <div key={i} className="p-4 bg-surface-2 rounded-2xl border border-black/5 group/item cursor-pointer hover-lift">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-black text-gray-800 tracking-tight">{item.item}</div>
                                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{item.price}</div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className={`text-md font-black tracking-tighter ${item.stock < item.min ? 'text-error animate-pulse' : 'text-gray-900'}`}>{item.stock}</div>
                                                <div className="text-[8px] font-bold text-muted uppercase">Min: {item.min}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-4 bg-primary-light rounded-2xl border border-primary/10 flex items-center gap-4 group/msg cursor-pointer hover:bg-primary hover:text-white transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-black/5"><Smartphone size={24} /></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Digital Assistant</div>
                                        <div className="text-xs font-bold mt-0.5">Харилцагчид мэдэгдэх</div>
                                    </div>
                                    <CheckCircle2 className="ml-auto opacity-40" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <ClipboardList size={16} strokeWidth={3} /> Inventory Sync
                                </button>
                            </div>

                            <Settings className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-info to-blue-600 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <History className="absolute -right-8 -top-8 text-white/5 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Service History</h4>
                                <p className="m-0 text-md font-black leading-tight tracking-tight underline-offset-4 decoration-white/20">Тээврийн хэрэгслийн засварын түүхийг улсын дугаараар нэг дороос хянах боломжтой.</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><CheckCircle2 size={20} strokeWidth={2.5} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Quality Assurance</span>
                                        <span className="text-xs font-bold font-mono">Verified by Liscord AI</span>
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
