// GymFitnessPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Dumbbell,
    Users,
    Calendar,
    CreditCard,
    Plus,
    Search,
    ChevronRight,
    Activity,
    Clock,
    Flame,
    Zap,
    Trophy,
    ArrowUpRight,
    QrCode
} from 'lucide-react';

export function GymFitnessPage() {
    const members = [
        { id: 'GYM-2401', name: 'Б. Тэмүүлэн', plan: 'Gold Member', status: 'Active', checkIn: '18:45', trainer: 'Coach Jack' },
        { id: 'GYM-2402', name: 'С. Халиун', plan: 'Trial', status: 'Expired', checkIn: '-', trainer: 'Self-Training' },
        { id: 'GYM-2403', name: 'Г. Мөнх-Эрдэнэ', plan: 'Family Plan', status: 'Active', checkIn: '17:30', trainer: 'Coach Bold' },
        { id: 'GYM-2404', name: 'П. Анударь', plan: 'Yoga Only', status: 'Active', checkIn: '19:05', trainer: 'Coach Sara' },
    ];

    const classes = [
        { time: '18:00', name: 'HIIT Training', room: 'Room A', joined: 12, max: 15, coach: 'Jack' },
        { time: '19:00', name: 'Power Yoga', room: 'Room B', joined: 8, max: 20, coach: 'Sara' },
        { time: '20:15', name: 'Bodybuilding', room: 'Main Hall', joined: 24, max: 30, coach: 'Bold' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Фитнес & Клуб"
                subtitle="Гишүүнчлэлийн бүртгэл, сургалтын хуваарь болон заалны ачаалал хянах"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Gym Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Одоогоор зааланд</span>
                            <div className="p-3 rounded-2xl bg-primary-light text-primary shadow-sm group-hover:rotate-12 transition-transform">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">42 хүн</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <Activity size={12} /> 75% capacity utilized
                        </div>
                        <Users className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Шинэ гишүүнчлэл</span>
                            <div className="p-3 rounded-2xl bg-warning-light text-warning shadow-sm group-hover:rotate-12 transition-transform">
                                <Trophy size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">124</div>
                        <div className="mt-2 text-[10px] font-bold text-warning flex items-center gap-1 relative z-10">
                            <Flame size={12} /> +25% this month
                        </div>
                        <Dumbbell className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Zap className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight uppercase">Check-in Terminal</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">QR эсвэл Картаар уншуулах</p>
                            </div>
                            <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 mt-2">
                                <QrCode size={16} strokeWidth={3} /> QR Уншуулах
                            </button>
                        </div>
                    </div>

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Гишүүн нэмэх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Membership Table */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Users size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Бүртгэлтэй гишүүд</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                        <input type="text" placeholder="Гишүүн хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                    </div>
                                    <button className="btn btn-outline h-12 w-12 rounded-2xl border-black/5 flex items-center justify-center"><Calendar size={18} /></button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Гишүүн</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Багц</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Төлөв</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Check-in</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {members.map((m) => (
                                            <tr key={m.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover/row:bg-primary group-hover/row:text-white transition-all">{m.name.charAt(0)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{m.name}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{m.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-gray-900 tracking-tight">{m.plan}</span>
                                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{m.trainer}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge ${m.status === 'Active' ? 'badge-primary' : 'badge-error'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{m.status}</span>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-800 tracking-tighter text-xs">{m.checkIn}</td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary shadow-sm"><ArrowUpRight size={16} /></button>
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted shadow-sm"><CreditCard size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Classes & Schedule */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" /> Өнөөдрийн хичээлүүд
                                </h4>
                                <Clock size={16} className="text-muted" />
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {classes.map((c, i) => (
                                    <div key={i} className="p-5 bg-surface-2 rounded-2xl border border-black/5 group/app cursor-pointer hover-lift">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{c.time} • {c.room}</span>
                                                <div className="text-sm font-black text-gray-800 tracking-tight mt-0.5">{c.name}</div>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-xs shadow-sm border">{c.joined}/{c.max}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-black/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(c.joined / c.max) * 100}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Coach {c.coach}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-4 bg-primary-light rounded-2xl border border-primary/10 flex items-center gap-4 group/msg cursor-pointer hover:bg-primary hover:text-white transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-black/5"><CreditCard size={24} /></div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Төлбөр Шалгах</div>
                                        <div className="text-xs font-bold mt-0.5">Гишүүний QR код уншуулах</div>
                                    </div>
                                    <ChevronRight className="ml-auto opacity-40" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <Zap size={16} strokeWidth={3} /> Attendance Automation
                                </button>
                            </div>

                            <Activity className="absolute -right-8 -bottom-8 text-black/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-warning to-orange-500 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <Trophy className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Club Excellence</h4>
                                <p className="m-0 text-md font-black leading-tight tracking-tight underline-offset-4 decoration-white/20">Өнөөдөр 12 хүн гишүүнчлэлээ сунгаж, 4 шинэ хүн нэгдлээ.</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Flame size={20} strokeWidth={2.5} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Growth Trend</span>
                                        <span className="text-xs font-bold font-mono">+12.4% vs last week</span>
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
