// SalonSpaPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Scissors,
    Sparkles,
    Calendar,
    Plus,
    Search,
    Star,
    Clock,
    Zap,
    Heart,
    Smartphone,
    ArrowUpRight,
    ShoppingBag
} from 'lucide-react';

export function SalonSpaPage() {
    const appointments = [
        { id: 'APP-101', customer: 'Г. Солонго', service: 'Hair Styling', staff: 'Sara', time: '14:30', status: 'In Service' },
        { id: 'APP-102', customer: 'М. Ану', service: 'Manicure', staff: 'Boldo', time: '15:15', status: 'Waiting' },
        { id: 'APP-103', customer: 'Б. Лхагва', service: 'Full Spa', staff: 'Haliun', time: '16:00', status: 'Confirmed' },
        { id: 'APP-104', customer: 'Э. Тэмүүлэн', service: 'Facial', staff: 'Sara', time: '17:30', status: 'Confirmed' },
    ];

    const staffStats = [
        { name: 'Sara', rating: 4.9, bookings: 12, efficiency: '95%' },
        { name: 'Boldo', rating: 4.7, bookings: 8, efficiency: '88%' },
        { name: 'Haliun', rating: 5.0, bookings: 15, efficiency: '98%' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Салон & Спа"
                subtitle="Гоо сайханчдын хуваарь, үйлчилгээний төрөл болон харилцагчийн үнэлгээ хянах"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Salon Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Өнөөдрийн орлого</span>
                            <div className="p-3 rounded-2xl bg-primary-light text-primary shadow-sm group-hover:rotate-12 transition-transform">
                                <ShoppingBag size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">₮1.5M</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <Zap size={12} /> +20% vs last week
                        </div>
                        <Sparkles className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Идэвхтэй захиалга</span>
                            <div className="p-3 rounded-2xl bg-info-light text-info shadow-sm group-hover:rotate-12 transition-transform">
                                <Calendar size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">24</div>
                        <div className="mt-2 text-[10px] font-bold text-info flex items-center gap-1 relative z-10">
                            <Clock size={12} /> Next in 15 mins
                        </div>
                        <Calendar className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Scissors className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight uppercase underline decoration-primary decoration-4 underline-offset-8">Staff Utilization</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">Ажилчдын ачаалал: 85%</p>
                            </div>
                            <div className="flex gap-4">
                                {staffStats.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-primary border border-white/5">{s.name.charAt(0)}</div>
                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest text-white/40">{s.efficiency}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Үйлчилгээ нэмэх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Appointments Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Calendar size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Өнөөдрийн захиалгууд</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Захиалга хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Үйлчлүүлэгч</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Үйлчилгээ</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Ажилтан</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Цаг</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Төлөв</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {appointments.map((a) => (
                                            <tr key={a.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover/row:bg-primary group-hover/row:text-white transition-all">{a.customer.charAt(0)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{a.customer}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{a.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-900 tracking-tight">{a.service}</td>
                                                <td className="px-10 py-6 text-xs font-bold text-muted uppercase tracking-widest">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">{a.staff.charAt(0)}</div>
                                                        {a.staff}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-800 tracking-tighter text-xs">{a.time}</td>
                                                <td className="px-10 py-6 text-right">
                                                    <span className={`badge ${a.status === 'In Service' ? 'badge-primary animate-pulse' : a.status === 'Waiting' ? 'badge-info' : 'badge-ghost'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{a.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Highly Rated Staff & Shop */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Star size={16} className="text-warning fill-warning" /> Мастерүүд
                                </h4>
                                <Heart size={16} className="text-error" />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {staffStats.map((s, i) => (
                                    <div key={i} className="p-5 bg-surface-2 rounded-2xl border border-black/5 group/staff cursor-pointer hover-lift">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black text-primary shadow-sm border border-black/5 text-lg">{s.name.charAt(0)}</div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-800 tracking-tight">Coach {s.name}</div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Star size={10} className="text-warning fill-warning" />
                                                        <span className="text-[10px] font-bold text-muted">{s.rating} • {s.bookings} bookings</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[11px] font-black italic text-primary">{s.efficiency}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-4 bg-primary-light rounded-2xl border border-primary/10 flex items-center gap-4 group/msg cursor-pointer hover:bg-primary hover:text-white transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-black/5"><Smartphone size={24} /></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Self-Booking Link</div>
                                        <div className="text-xs font-bold mt-0.5">Линк хуулж авах</div>
                                    </div>
                                    <ArrowUpRight className="ml-auto opacity-40" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <Plus size={16} strokeWidth={3} /> Quick Appointment
                                </button>
                            </div>

                            <Scissors className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-primary to-[#d946ef] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <Sparkles className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Salon Aesthetics</h4>
                                <p className="m-0 text-md font-black leading-tight tracking-tight underline-offset-4 decoration-white/20">"Liscord ашигласнаар цаг захиалгын алдааг 95% бууруулж чадлаа."</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Star size={20} className="fill-white" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Top Rated</span>
                                        <span className="text-xs font-bold font-mono">5.0 Star Professional Studio</span>
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
