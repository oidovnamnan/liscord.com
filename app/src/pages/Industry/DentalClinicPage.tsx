// DentalClinicPage
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Stethoscope,
    Calendar,
    Users,
    FileText,
    Plus,
    Search,
    MoreVertical,
    ChevronRight,
    Activity,
    Clock,
    ShieldCheck,
    Smartphone
} from 'lucide-react';

export function DentalClinicPage() {
    const patients = [
        { id: 1, name: 'Б. Бат-Эрдэнэ', age: 34, lastVisit: '2024-02-15', status: 'In Treatment', doctor: 'Dr. Bold' },
        { id: 2, name: 'С. Туяа', age: 28, lastVisit: '2024-03-01', status: 'Checkup', doctor: 'Dr. Saruul' },
        { id: 3, name: 'Г. Гантулга', age: 45, lastVisit: '2023-12-20', status: 'Completed', doctor: 'Dr. Bold' },
    ];

    const appointments = [
        { time: '14:30', patient: 'Б. Бат-Эрдэнэ', treatment: 'Root Canal', doctor: 'Dr. Bold' },
        { time: '15:15', patient: 'М. Амар', treatment: 'Cleaning', doctor: 'Dr. Saruul' },
        { time: '16:00', patient: 'Л. Болор', treatment: 'Orthodontics', doctor: 'Dr. Bold' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Шүдний Эмнэлэг"
                subtitle="Өвчтөний түүх, эмчилгээний төлөвлөгөө болон эмчийн хуваарь"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Өнөөдрийн өвчтөн</span>
                            <div className="p-3 rounded-2xl bg-primary-light text-primary shadow-sm group-hover:rotate-6 transition-transform">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">18</div>
                        <div className="mt-2 text-[10px] font-bold text-success flex items-center gap-1 relative z-10">
                            <Activity size={12} /> +3 vs average
                        </div>
                        <Users className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Идэвхтэй эмчилгээ</span>
                            <div className="p-3 rounded-2xl bg-info-light text-info shadow-sm group-hover:rotate-6 transition-transform">
                                <Stethoscope size={24} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">42</div>
                        <div className="mt-2 text-[10px] font-bold text-info flex items-center gap-1 relative z-10">
                            <ShieldCheck size={12} /> 12 emergency
                        </div>
                        <Stethoscope className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                    </div>

                    <div className="card p-8 border shadow-xl bg-black text-white rounded-[2.5rem] relative overflow-hidden group animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <Calendar className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={180} />
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col">
                                <h4 className="m-0 text-xl font-black tracking-tight uppercase">Хүлээгдэж буй цаг</h4>
                                <p className="m-0 text-[10px] font-bold uppercase text-white/40 tracking-widest mt-1">Нийт 5 хүн хүлээж байна</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Clock size={20} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-sm font-black">Дараагийн: Б. Бат-Эрдэнэ</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">14:30 (Root Canal)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '300ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Plus size={32} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Бүртгэл нэмэх</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Patient List */}
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="card border shadow-xl bg-white rounded-[3rem] overflow-hidden group">
                            <div className="px-10 py-8 border-b flex justify-between items-center group/header">
                                <div className="flex items-center gap-4 group-hover/header:translate-x-1 transition-transform">
                                    <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg shadow-primary/10"><Users size={24} /></div>
                                    <h3 className="m-0 text-xl font-black text-gray-900 tracking-tighter uppercase">Өвчтөний жагсаалт</h3>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                    <input type="text" placeholder="Өвчтөн хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-surface-2">
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Өвчтөн</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Нас</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Сүүлийн үзлэг</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Төлөв</th>
                                            <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted text-right">Үйлдэл</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {patients.map((p) => (
                                            <tr key={p.id} className="hover:bg-surface-1 transition-colors group/row">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover/row:bg-primary group-hover/row:text-white transition-all">{p.name.charAt(0)}</div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-800 tracking-tight">{p.name}</span>
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{p.doctor}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-black text-gray-900">{p.age}</td>
                                                <td className="px-10 py-6 text-xs font-bold text-muted uppercase tracking-widest">{p.lastVisit}</td>
                                                <td className="px-10 py-6">
                                                    <span className={`badge ${p.status === 'In Treatment' ? 'badge-primary' : p.status === 'Checkup' ? 'badge-info' : 'badge-ghost'} font-black uppercase text-[8px] px-3 py-1 rounded-lg`}>{p.status}</span>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-primary shadow-sm"><FileText size={16} /></button>
                                                        <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 text-muted shadow-sm"><MoreVertical size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Appointments */}
                    <div className="w-full lg:w-[400px] flex flex-col gap-8">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Clock size={16} className="text-primary" /> Өнөөдрийн хуваарь
                                </h4>
                                <Activity size={16} className="text-muted" />
                            </div>

                            <div className="flex flex-col gap-6 relative z-10">
                                {appointments.map((a, i) => (
                                    <div key={i} className="flex gap-4 items-start group/app cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <div className="text-[10px] font-black text-gray-900 w-10 text-center">{a.time}</div>
                                            <div className="w-px h-12 bg-black/5 my-1"></div>
                                        </div>
                                        <div className="flex-1 p-4 bg-surface-2 rounded-2xl border border-black/5 group-hover/app:border-primary/20 transition-all">
                                            <div className="text-sm font-black text-gray-800 tracking-tight">{a.patient}</div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{a.treatment}</span>
                                                <span className="text-[10px] font-bold text-primary">{a.doctor}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-black/5 mt-2"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center gap-4 p-4 bg-primary-light rounded-2xl border border-primary/10 cursor-pointer hover:bg-primary hover:text-white transition-all group/btn">
                                    <Smartphone className="text-primary group-hover/btn:text-white" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">Digital Assistant</div>
                                        <div className="text-xs font-bold mt-0.5">Өвчтөнд мэдэгдэл илгээх</div>
                                    </div>
                                    <ChevronRight className="ml-auto opacity-40" size={16} />
                                </div>
                                <button className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2 mt-2">
                                    <Activity size={16} strokeWidth={3} /> Clinical View
                                </button>
                            </div>

                            <ShieldCheck className="absolute -right-8 -bottom-8 text-black/5 opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-1000" size={180} />
                        </div>

                        <div className="card p-8 bg-gradient-to-br from-info to-[#0ea5e9] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <FileText className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-1000" size={180} />
                            <div className="flex flex-col gap-6 relative z-10">
                                <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest">Medical Records</h4>
                                <p className="m-0 text-md font-black leading-relaxed tracking-tight underline-offset-4 decoration-white/20">Бүх рентген зураг, эмчилгээний түүхийг нэг дороос хянах боломжтой.</p>
                                <div className="flex items-center gap-4 py-4 border-t border-white/10 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Activity size={20} strokeWidth={2.5} /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sync Status</span>
                                        <span className="text-xs font-bold">Cloud records updated 1m ago</span>
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
