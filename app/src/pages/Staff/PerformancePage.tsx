import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Target,
    TrendingUp,
    Award,
    Users,
    ArrowRight,
    Star,
    Zap,
    PieChart,
    Activity
} from 'lucide-react';

interface EmployeePerformance {
    id: string;
    employee: string;
    score: number;
    kpis: { name: string; value: number }[];
    status: 'excellent' | 'good' | 'average' | 'review';
}

const MOCK_PERFORMANCE: EmployeePerformance[] = [
    {
        id: 'EMP-01',
        employee: 'Э.Батболд',
        score: 94,
        status: 'excellent',
        kpis: [
            { name: 'Борлуулалт', value: 98 },
            { name: 'Харилцаа холбоо', value: 92 },
            { name: 'Сахилга бат', value: 100 }
        ]
    },
    {
        id: 'EMP-02',
        employee: 'Д.Тэмүүлэн',
        score: 82,
        status: 'good',
        kpis: [
            { name: 'Төслийн явц', value: 85 },
            { name: 'Багийн ажиллагаа', value: 78 }
        ]
    },
    {
        id: 'EMP-03',
        employee: 'Г.Тулга',
        score: 65,
        status: 'review',
        kpis: [
            { name: 'Чанар', value: 60 },
            { name: 'Хурд', value: 70 }
        ]
    }
];

export function PerformancePage() {
    const [performance] = useState<EmployeePerformance[]>(MOCK_PERFORMANCE);

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="KPI & Гүйцэтгэл (OKR)"
                    subtitle="Ажилтнуудын ажлын үр дүн, KPI болон байгууллагын стратеги зорилтууд"
                    action={{
                        label: "Үнэлгээ хийх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж оноо</h4>
                                <div className="text-3xl font-black text-primary">82.4%</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Target size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Өсөлт (Q1)</h4>
                                <div className="text-3xl font-black text-success">+12%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт зорилт</h4>
                                <div className="text-3xl font-black text-warning">48</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Award size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Шилдэг ажилтан</h4>
                                <div className="text-xl font-black text-white uppercase">Э.БАТБОЛД</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Star size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 mt-4 grid grid-cols-3 gap-6">
                        {performance.map(perf => (
                            <div key={perf.id} className="card p-6 hover-lift shadow-sm bg-surface-1 border-none flex flex-col gap-6 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-surface-2 rounded-2xl flex items-center justify-center font-black text-primary border border-border-color/10 shadow-inner">
                                            {perf.employee.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black group-hover:text-primary transition-colors">{perf.employee}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <Users size={12} /> {perf.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-3xl font-black text-2xl shadow-inner ${perf.score >= 90 ? 'text-success bg-success-light' :
                                        perf.score >= 80 ? 'text-primary bg-primary-light' :
                                            'text-danger bg-danger-light'
                                        }`}>
                                        {perf.score}%
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {perf.kpis.map((kpi, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                                                <span>{kpi.name}</span>
                                                <span>{kpi.value}%</span>
                                            </div>
                                            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${kpi.value >= 90 ? 'bg-success' : kpi.value >= 70 ? 'bg-primary' : 'bg-danger'
                                                    }`} style={{ width: `${kpi.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="btn btn-ghost w-full bg-surface-2 border border-border-color/10 py-3 rounded-2xl font-black text-xs hover:bg-primary-light hover:text-primary transition-all flex items-center justify-center gap-2">
                                    ДЭЛГЭРЭНГҮЙ <ArrowRight size={16} />
                                </button>

                                <Activity size={128} className="absolute -bottom-8 -right-8 opacity-5 text-muted group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>

                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Target size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black">Байгууллагын OKR (Objective & Key Results)</h3>
                                <p className="text-sm text-muted">2026 оны эхний хагас жилийн стратегийн зорилтууд.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-8 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all">ХҮРЭХ ЗОРИЛТ</button>
                            <button className="btn btn-primary px-8 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2"><PieChart size={18} /> ТАЙЛАН</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
