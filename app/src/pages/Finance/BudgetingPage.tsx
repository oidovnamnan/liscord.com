import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    Search,
    Filter,
    Plus,
    BarChart3,
    PieChart,
    Settings,
    Building2,
    Users,
    Laptop,
    Truck,
    Briefcase
} from 'lucide-react';

interface DepartmentBudget {
    id: string;
    name: string;
    category: 'it' | 'marketing' | 'ops' | 'hr' | 'admin';
    allocated: number;
    spent: number;
    remaining: number;
    status: 'on-track' | 'warning' | 'over-budget';
    lastUpdated: string;
    fiscalYear: string;
}

const MOCK_BUDGETS: DepartmentBudget[] = [
    {
        id: 'BGT-2024-IT',
        name: 'Мэдээлэл Технологи (IT)',
        category: 'it',
        allocated: 150000000,
        spent: 112500000,
        remaining: 37500000,
        status: 'warning',
        lastUpdated: '2024-03-22',
        fiscalYear: '2024'
    },
    {
        id: 'BGT-2024-MKT',
        name: 'Маркетинг & Борлуулалт',
        category: 'marketing',
        allocated: 280000000,
        spent: 85400000,
        remaining: 194600000,
        status: 'on-track',
        lastUpdated: '2024-03-20',
        fiscalYear: '2024'
    },
    {
        id: 'BGT-2024-OPS',
        name: 'Үйл Ажиллагаа (Operations)',
        category: 'ops',
        allocated: 500000000,
        spent: 542000000,
        remaining: -42000000,
        status: 'over-budget',
        lastUpdated: '2024-03-21',
        fiscalYear: '2024'
    }
];

export function BudgetingPage() {
    const [budgets] = useState<DepartmentBudget[]>(MOCK_BUDGETS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Төсвийн Хяналт"
                    subtitle="Байгууллагын алба тус бүрийн төсөв хуваарилалт, гүйцэтгэл болон зардлын хязгаарлалт"
                    action={{
                        label: "Төсөв Төлөвлөх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* High-Level Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:scale-110 transition-transform"><Target size={48} /></div>
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Төсөв (2024)</h4>
                            <div className="text-3xl font-black">1.2Т ₮</div>
                            <div className="flex items-center gap-1 text-primary text-[10px] font-bold mt-2 uppercase tracking-widest">Төлөвлөснөөс: 84% зарцуулсан</div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Зарцуулсан</h4>
                            <div className="text-3xl font-black">940.5М ₮</div>
                            <div className="flex items-center gap-1 text-danger text-[10px] font-bold">
                                <TrendingUp size={12} /> +12% (Өнгөрсөн сараас)
                            </div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Сул Үлдэгдэл</h4>
                            <div className="text-3xl font-black text-success">259.5М ₮</div>
                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Одоогийн бэлэн мөнгө</div>
                        </div>

                        <div className="card p-6 bg-danger/5 border-none shadow-sm flex flex-col gap-4 border border-danger/20">
                            <div className="flex justify-between items-center text-danger">
                                <AlertTriangle size={24} />
                                <span className="bg-danger/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Шүүмж</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Төсөв хэтэрсэн</h4>
                                <div className="text-3xl font-black text-danger">2 алба</div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Алба, тайлангийн нэрээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Хугацаа</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center justify-center text-muted"><Settings size={18} /></button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black"><Plus size={18} /> Шинэ Төсөв</button>
                        </div>
                    </div>

                    {/* Budget Breakdown */}
                    <div className="col-12 grid grid-cols-1 gap-6">
                        {budgets.map(budget => (
                            <div key={budget.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group relative overflow-hidden">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner border border-border-color/10">
                                            {budget.category === 'it' ? <Laptop size={32} /> :
                                                budget.category === 'marketing' ? <BarChart3 size={32} /> :
                                                    budget.category === 'ops' ? <Truck size={32} /> :
                                                        budget.category === 'hr' ? <Users size={32} /> : <Briefcase size={32} />}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-[300px]">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black">{budget.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${budget.status === 'on-track' ? 'bg-success/10 text-success' :
                                                    budget.status === 'warning' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                                                    }`}>
                                                    {budget.status === 'on-track' ? 'ХЭВИЙН' :
                                                        budget.status === 'warning' ? 'АНХААР' : 'ХЭТЭРСЭН'}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-muted flex items-center gap-2">
                                                <Calendar size={14} /> Санхүүгийн жил: {budget.fiscalYear}
                                                <span className="opacity-50">•</span>
                                                Сүүлчийн өөрчлөлт: {budget.lastUpdated}
                                            </div>
                                        </div>

                                        <div className="flex-1 px-8 space-y-4">
                                            <div className="p-4 bg-surface-2 rounded-2xl space-y-3 border border-border-color/5">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-muted">Гүйцэтгэл</span>
                                                    <span className={budget.spent > budget.allocated ? 'text-danger' : 'text-primary'}>
                                                        {Math.round((budget.spent / budget.allocated) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-surface-3 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${budget.spent > budget.allocated ? 'bg-danger' :
                                                            (budget.spent / budget.allocated) > 0.8 ? 'bg-warning' : 'bg-primary'
                                                            }`}
                                                        style={{ width: `${Math.min((budget.spent / budget.allocated) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 min-w-[350px]">
                                            <div className="bg-surface-2 p-4 rounded-2xl border border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 opacity-70">ТӨЛӨВЛӨСӨН</div>
                                                <div className="text-lg font-black">{budget.allocated.toLocaleString()} ₮</div>
                                            </div>
                                            <div className="bg-surface-2 p-4 rounded-2xl border border-border-color/5 group-hover:bg-surface-3 transition-colors">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 opacity-70">ЗАРЦУУЛСАН</div>
                                                <div className={`text-lg font-black ${budget.spent > budget.allocated ? 'text-danger' : ''}`}>
                                                    {budget.spent.toLocaleString()} ₮
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-6 flex items-center gap-2">
                                        <button className="h-12 w-12 bg-surface-2 rounded-2xl flex items-center justify-center text-muted group-hover:text-primary transition-all hover:bg-primary/10">
                                            <ArrowUpRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analytics Section Preview */}
                    <div className="col-12 mt-4 grid grid-cols-2 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center gap-6 group cursor-pointer hover:bg-surface-2 transition-all">
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><PieChart size={32} /></div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black tracking-tight">Зардлын Төрөлжүүлэлт</h3>
                                <p className="text-sm font-bold text-muted">Бүх салбарын зардлыг төрлөөр нь ангилсан дугуй график</p>
                            </div>
                            <CheckCircle2 size={24} className="text-muted" />
                        </div>
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center gap-6 group cursor-pointer hover:bg-surface-2 transition-all">
                            <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"><Building2 size={32} /></div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black tracking-tight">Салбарын Анализ</h3>
                                <p className="text-sm font-bold text-muted">Салбар нэгжүүдийн ашигт ажиллагаа болон төсвийн харьцуулалт</p>
                            </div>
                            <CheckCircle2 size={24} className="text-muted" />
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
