import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    TrendingUp,
    DollarSign,
    PieChart,
    MapPin,
    AlertCircle,
    ChevronRight,
    BarChart3,
    FileText,
    Settings,
    ShieldCheck,
    Briefcase,
    Activity,
    Users,
    Search,
    Filter,
    Percent
} from 'lucide-react';

export function FranchisePage() {
    const [period] = useState('2024 оны 3-р сар');

    // Mock branch data
    const branches = [
        { id: 1, name: 'Хан-Уул Салбар', owner: 'Г.Тулга', sales: '₮124,500,000', royalty: '₮3,735,000', rate: '3%', status: 'paid' },
        { id: 2, name: 'БЗД Салбар', owner: 'С.Болд', sales: '₮98,200,000', royalty: '₮2,946,000', rate: '3%', status: 'pending' },
        { id: 3, name: 'Сүхбаатар Салбар', owner: 'А.Уянга', sales: '₮85,600,000', royalty: '₮2,568,000', rate: '3%', status: 'pending' },
        { id: 4, name: 'СХД Салбар', owner: 'М.Бат', sales: '₮42,100,000', royalty: '₮1,263,000', rate: '3%', status: 'paid' },
    ];

    const stats = [
        { label: 'Нийт салбарын борлуулалт', value: '₮350.4M', icon: DollarSign, color: 'primary' },
        { label: 'Нийт Роялти (Орлого)', value: '₮10.5M', icon: TrendingUp, color: 'success' },
        { label: 'Идэвхтэй салбар', value: '14', icon: MapPin, color: 'info' },
        { label: 'Гэрээний нийцлэл', value: '98%', icon: ShieldCheck, color: 'warning' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <Header
                title="Франчайз Удирдлага"
                subtitle="Олон салбарын нэгдсэн хяналт, роялти хураамж тооцох систем"
            />

            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100 h-full">
                {/* Global Stats Grid */}
                <div className="grid-4 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-1 relative z-10 text-muted">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</span>
                                <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm transform group-hover:-rotate-12 transition-transform`}>
                                    <s.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                            <PieChart className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={100} />
                        </div>
                    ))}
                </div>

                <div className="grid-3-1 gap-8">
                    {/* Branch Financial Table */}
                    <div className="flex flex-col gap-6 animate-slide-left">
                        <div className="card border shadow-xl flex flex-col p-0 overflow-hidden group bg-white">
                            <div className="p-6 border-b bg-surface-2 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <BarChart3 size={14} className="text-primary" /> Салбаруудын гүйцэтгэл ({period})
                                </h4>
                                <div className="flex gap-2">
                                    <div className="relative group/search">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" size={14} />
                                        <input type="text" className="input input-sm h-10 pl-9 rounded-xl border-none ring-1 ring-black/5 focus:ring-primary/40" placeholder="Салбар хайх..." />
                                    </div>
                                    <button className="btn btn-outline btn-sm h-10 rounded-xl px-4 flex items-center gap-2 font-black uppercase tracking-widest text-[10px]"><Filter size={16} /> Шүүлтүүр</button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead>
                                        <tr className="bg-surface-3/50 text-xs font-black uppercase tracking-widest text-muted border-b">
                                            <th className="p-6 text-left">Салбар нэр</th>
                                            <th className="p-6 text-left">Эзэмшигч</th>
                                            <th className="p-6 text-right">Борлуулалт</th>
                                            <th className="p-6 text-right">Роялти</th>
                                            <th className="p-6 text-center">Төлөв</th>
                                            <th className="p-6"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {branches.map((b) => (
                                            <tr key={b.id} className="hover:bg-surface-2/50 transition-all group/row">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-black/5 flex items-center justify-center font-black text-gray-400 shadow-sm group-hover/row:bg-primary group-hover/row:text-white group-hover/row:-rotate-3 transition-all duration-300">
                                                            {b.id}
                                                        </div>
                                                        <span className="font-extrabold text-gray-800 tracking-tight">{b.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-sm font-bold text-muted">{b.owner}</td>
                                                <td className="p-6 text-right font-black text-gray-900 tracking-tight">{b.sales}</td>
                                                <td className="p-6 text-right">
                                                    <div className="font-black text-primary tracking-tight">{b.royalty}</div>
                                                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{b.rate} хувь</div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className={`badge uppercase font-black text-[10px] tracking-widest px-3 py-1.5 rounded-lg ${b.status === 'paid' ? 'badge-success-light' : 'badge-warning-light'}`}>
                                                        {b.status === 'paid' ? 'Төлөгдсөн' : 'Нэхэмжилсэн'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-black/5 group-hover/row:translate-x-1 transition-all">
                                                        <ChevronRight size={18} className="text-muted group-hover/row:text-primary transition-colors" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Side Info & Tools */}
                    <div className="flex flex-col gap-8 animate-slide-right">
                        <div className="card p-8 border shadow-xl bg-gradient-to-br from-surface-2 to-white relative group overflow-hidden">
                            <Briefcase className="absolute -right-8 -bottom-8 text-black/5 group-hover:rotate-12 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-8 flex items-center gap-2">
                                <Settings size={14} className="text-primary" /> Франчайзи тохиргоо
                            </h4>
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all transform group-hover/item:-rotate-12">
                                        <Percent size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-gray-800 uppercase tracking-tight">Роялти Хувь</div>
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Бүх салбарт 3.0%</div>
                                    </div>
                                    <ChevronRight size={18} className="text-muted group-hover/item:text-primary transition-all group-hover/item:translate-x-1" />
                                </div>
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all transform group-hover/item:-rotate-12">
                                        <Users size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-gray-800 uppercase tracking-tight">Нэвтрэх эрх</div>
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Салбар эзэмшигчдийн хандалт</div>
                                    </div>
                                    <ChevronRight size={18} className="text-muted group-hover/item:text-primary transition-all group-hover/item:translate-x-1" />
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 bg-black text-white relative border shadow-2xl group overflow-hidden">
                            <Activity className="absolute -right-8 -bottom-8 text-white/5 group-hover:-translate-y-4 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest mb-6 flex items-center gap-2">
                                <AlertCircle size={14} className="text-warning" /> Анхаарал хандуулах
                            </h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-error mt-1.5 animate-pulse"></div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-tight">Салбар 2 - Төлбөр хоцорсон</div>
                                        <div className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-tighter">2 хоногийн өмнө</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-pointer">
                                    <div className="w-2 h-2 rounded-full bg-warning mt-1.5 animate-pulse"></div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-tight">Салбар 8 - Бараа дууссан</div>
                                        <div className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-tighter">10 минутын өмнө</div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary w-full h-14 rounded-2xl mt-8 shadow-xl shadow-primary/40 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                                <FileText size={16} /> Нэгтгэсэн тайлан татах
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
