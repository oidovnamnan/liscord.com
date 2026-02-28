import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layers,
    TrendingUp,
    AlertTriangle,
    ChefHat,
    Search,
    ChevronRight,
    Scale,
    DollarSign,
    PieChart,
    History,
    FileText,
    Settings
} from 'lucide-react';

export function FoodCostingPage() {
    const recipes = [
        { id: 1, name: 'Цуйван', cost: 4200, price: 12500, margin: 66, status: 'profitable', ingredients: 6 },
        { id: 2, name: 'Хуушуур', cost: 850, price: 2500, margin: 66, status: 'profitable', ingredients: 5 },
        { id: 3, name: 'Стейк (Ribeye)', cost: 28500, price: 45000, margin: 38, status: 'warning', ingredients: 3 },
        { id: 4, name: 'Нийслэл салат', cost: 3100, price: 8500, margin: 63, status: 'profitable', ingredients: 8 },
        { id: 5, name: 'Пирожки', cost: 1200, price: 1500, margin: 20, status: 'danger', ingredients: 4 },
    ];

    const stats = [
        { label: 'Дундаж ашиг', value: '54.2%', icon: TrendingUp, color: 'success', trend: '+2.4%' },
        { label: 'Эрсдэлтэй хоол', value: '2 Ширхэг', icon: AlertTriangle, color: 'error', trend: 'Маржин < 30%' },
        { label: 'Нийт орц', value: '145 төрөл', icon: Layers, color: 'primary', trend: 'Идэвхтэй' },
    ];

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Хоолны Өртөг & Жор"
                subtitle="Борлуулалтын үнэ, өртөг, цэвэр ашгийн тооцоолол болон жор удирдах"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-8">
                <div className="grid-3 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-8 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                                <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm`}>
                                    <s.icon size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="text-4xl font-black tracking-tighter text-gray-900 relative z-10">{s.value}</div>
                            <div className={`mt-2 text-[10px] font-bold text-${s.color} flex items-center gap-1 relative z-10`}>
                                {s.trend}
                            </div>
                            <s.icon className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={120} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 flex flex-col gap-6 w-full">
                        <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border shadow-sm">
                            <div className="flex gap-4">
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-6 rounded-xl">Бүх Жор</button>
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-muted hover:text-gray-900 px-6 rounded-xl">Материал</button>
                                <button className="btn btn-ghost text-[10px] font-black uppercase tracking-widest text-muted hover:text-gray-900 px-6 rounded-xl">Хаягдал</button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input type="text" placeholder="Жор хайх..." className="pl-12 pr-6 py-3 bg-surface-2 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 w-64" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {recipes.map((r, i) => (
                                <div key={r.id} className="card p-6 border shadow-sm bg-white hover:border-primary/20 transition-all group flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-lg transition-transform group-hover:rotate-6
                                            ${r.status === 'danger' ? 'bg-error shadow-error/20' : r.status === 'warning' ? 'bg-warning shadow-warning/20' : 'bg-success shadow-success/20'}`}>
                                            <ChefHat size={28} />
                                        </div>
                                        <div>
                                            <h4 className="m-0 text-lg font-black text-gray-800 tracking-tight">{r.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-1"><Layers size={12} /> {r.ingredients} орц</span>
                                                <span className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-1"><History size={12} /> 3 хоногийн өмнө шинэчилсэн</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Өртөг</span>
                                            <span className="text-md font-black text-gray-900 tracking-tighter">₮{r.cost.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Маржин</span>
                                            <span className={`text-xl font-black tracking-tighter ${r.status === 'danger' ? 'text-error' : r.status === 'warning' ? 'text-warning' : 'text-success'}`}>{r.margin}%</span>
                                        </div>
                                        <button className="btn btn-ghost btn-icon h-12 w-12 rounded-2xl bg-surface-2 group-hover:bg-primary group-hover:text-white transition-all"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] flex flex-col gap-6">
                        <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-8 group">
                            <div className="flex justify-between items-center">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Scale size={16} className="text-primary" strokeWidth={3} /> Өртгийн Тооцоолуур
                                </h4>
                                <Settings size={16} className="text-muted cursor-pointer hover:rotate-90 transition-transform duration-500" />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="p-5 bg-surface-2 rounded-3xl border border-black/5 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight">Үндсэн үнэ</span>
                                        <span className="font-black text-primary">₮12,500</span>
                                    </div>
                                    <div className="h-px bg-black/5"></div>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <span>Орц зардлууд</span>
                                            <span>-₮4,200</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <span>Цалин/Ажиллагаа (15%)</span>
                                            <span>-₮1,875</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                                            <span>Нэмүү өртөг (10%)</span>
                                            <span>-₮1,250</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-black/5"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-success uppercase tracking-[0.1em]">Цэвэр ашиг</span>
                                        <span className="text-2xl font-black text-success tracking-tighter">₮5,175</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><DollarSign size={16} /> Үнэ тогтоох</button>
                                    <button className="btn btn-outline h-14 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"><FileText size={16} /> Recipe Export</button>
                                </div>
                            </div>
                        </div>

                        <div className="card p-8 bg-[#1a1c22] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <PieChart className="absolute -right-6 -bottom-6 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={120} />
                            <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Зах зээлийн харьцуулалт</h4>
                            <div className="flex flex-col gap-6 relative z-10">
                                <p className="m-0 text-xs font-bold leading-relaxed text-white/60">Манай дундаж маржин (54%) салбарын дундажтай (45%) харьцуулахад <span className="text-primary font-black uppercase">Маш сайн</span> байна.</p>
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <TrendingUp className="text-success" size={20} />
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Потенциал</div>
                                        <div className="text-sm font-black tracking-tight">+12% ашиг нэмэх боломж</div>
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
