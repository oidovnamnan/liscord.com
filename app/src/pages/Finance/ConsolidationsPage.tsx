import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    LayoutDashboard,
    PieChart,
    BarChart3,
    TrendingUp,
    Calendar,
    Search,
    Filter,
    Plus,
    Download,
    FileText,
    Activity,
    AlertCircle,
    ArrowUpRight,
    Globe,
    Briefcase,
    Zap,
    Building2,
    ArrowRightCircle
} from 'lucide-react';

interface ConsolidationReport {
    id: string;
    period: string;
    entitiesCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    status: 'finalized' | 'draft' | 'auditing';
    lastUpdated: string;
}

const MOCK_REPORTS: ConsolidationReport[] = [
    {
        id: 'CON-2024-Q1',
        period: '2024 - I Улирал',
        entitiesCount: 6,
        totalRevenue: 1250000000,
        totalExpenses: 840000000,
        netProfit: 410000000,
        status: 'auditing',
        lastUpdated: '2024-03-22'
    },
    {
        id: 'CON-2023-FY',
        period: '2023 - Жилийн Тайлан',
        entitiesCount: 5,
        totalRevenue: 4850000000,
        totalExpenses: 3200000000,
        netProfit: 1650000000,
        status: 'finalized',
        lastUpdated: '2024-01-15'
    },
    {
        id: 'CON-2024-MAR',
        period: '2024 - 03-р сар',
        entitiesCount: 6,
        totalRevenue: 420000000,
        totalExpenses: 280000000,
        netProfit: 140000000,
        status: 'draft',
        lastUpdated: '2024-03-20'
    }
];

export function ConsolidationsPage() {
    const [reports] = useState<ConsolidationReport[]>(MOCK_REPORTS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Нэгтгэсэн Тайлан"
                    subtitle="Групп компанийн санхүүгийн үзүүлэлтүүдийг нэгтгэн дүгнэх, нэгдсэн баланс болон ашиг алдагдлыг хянах"
                    action={{
                        label: "Тайлан Нэгтгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* High-Level Consolidated Stats */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Globe size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Групп Орлого (YTD)</h4>
                                <div className="text-2xl font-black">5.4Т ₮</div>
                                <div className="flex items-center gap-1 text-success text-[10px] font-bold mt-1">
                                    <TrendingUp size={12} /> +14.2% (Vs Prev Year)
                                </div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><BarChart3 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Activity size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ашигт Ажиллагаа</h4>
                                <div className="text-2xl font-black text-success">32.4%</div>
                                <div className="flex items-center gap-1 text-success text-[10px] font-bold mt-1 uppercase tracking-widest">Target: 30%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success"><PieChart size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Briefcase size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Хөрөнгийн Дүн</h4>
                                <div className="text-2xl font-black">12.8Т ₮</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><Building2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-primary">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Бэлэн Мөнгө</h4>
                                <div className="text-2xl font-black text-primary">840.5М ₮</div>
                            </div>
                            <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20"><Zap size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Тайлангийн нэр, санхүүгийн жил хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Хугацаа</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Шинэ Тайлан</button>
                        </div>
                    </div>

                    {/* Reports List */}
                    <div className="col-12 space-y-4">
                        {reports.map(report => (
                            <div key={report.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-surface-2 rounded-2xl flex items-center justify-center text-primary border border-border-color/10 group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner">
                                            <FileText size={28} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black tracking-tight">{report.period}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${report.status === 'finalized' ? 'bg-success/10 text-success' :
                                                    report.status === 'auditing' ? 'bg-warning/10 text-warning' : 'bg-muted/10 text-muted'
                                                    }`}>
                                                    {report.status === 'finalized' ? 'БАТАЛГААЖСАН' :
                                                        report.status === 'auditing' ? 'ШАЛГАЖ БАЙНА' : 'НООРОГ'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2 mt-1">
                                                <Building2 size={12} /> {report.entitiesCount} Компани нэгтгэсэн
                                                <span className="opacity-50">•</span>
                                                <Calendar size={12} /> {report.lastUpdated}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-12 grid grid-cols-3 gap-8 border-l border-border-color/5 ml-8">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70">ОРЛОГО</div>
                                            <div className="text-lg font-black">{report.totalRevenue.toLocaleString()} ₮</div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70">ЗАРДАЛ</div>
                                            <div className="text-lg font-black">{report.totalExpenses.toLocaleString()} ₮</div>
                                        </div>
                                        <div className="flex flex-col gap-1 border-l-2 border-success pl-4 bg-success/5 rounded-r-xl">
                                            <div className="text-[9px] font-black text-success uppercase tracking-widest flex items-center gap-1 opacity-70">ЦЭВЭР АШИГ</div>
                                            <div className="text-lg font-black text-success">{report.netProfit.toLocaleString()} ₮</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button className="btn btn-ghost h-12 w-12 rounded-2xl border border-border-color/10 hover:bg-surface-3 transition-all"><Download size={20} /></button>
                                        <button className="btn btn-ghost h-12 w-12 rounded-2xl border border-border-color/10 hover:bg-surface-3 transition-all text-primary"><ArrowRightCircle size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analytics Section */}
                    <div className="col-8 mt-4">
                        <div className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden min-h-[400px]">
                            <div className="p-4 border-b border-border-color/10 flex justify-between items-center bg-surface-2/20">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Revenue Breakdown by Entity</h3>
                                <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"><LayoutDashboard size={14} /> View Dashboard</button>
                            </div>
                            <div className="p-8 flex flex-col gap-8">
                                {/* Profit Bars */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span>Liscord Retail</span>
                                            <span>42%</span>
                                        </div>
                                        <div className="h-4 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '42%' }} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span>Liscord Tech</span>
                                            <span>28%</span>
                                        </div>
                                        <div className="h-4 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                            <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: '28%' }} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span>Liscord Logistics</span>
                                            <span>18%</span>
                                        </div>
                                        <div className="h-4 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                            <div className="h-full bg-warning rounded-full transition-all duration-1000" style={{ width: '18%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-4 mt-4 space-y-6">
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex flex-col gap-6 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><BarChart3 size={128} /></div>
                            <h3 className="text-xl font-black relative z-10">Тайлангийн Модуль</h3>
                            <p className="text-xs font-bold opacity-80 relative z-10 leading-relaxed">Олон улсын санхүүгийн тайлагналын стандарт (IFRS)-д нийцсэн нэгтгэсэн тайланг автоматаар бэлтгэх.</p>
                            <button className="btn bg-white/20 hover:bg-white/30 text-white border-none w-full font-black py-4 rounded-2xl text-xs backdrop-blur-md relative z-10 uppercase tracking-widest flex items-center justify-center gap-2">
                                СЕТАП ХИЙХ <ArrowUpRight size={18} />
                            </button>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase flex items-center gap-2"><AlertCircle size={14} className="text-warning" /> Анхааруулга</h4>
                            <div className="p-4 bg-warning/10 rounded-xl border-l-4 border-warning">
                                <p className="text-[10px] font-bold text-muted leading-relaxed">Сүүлчийн улирлын тайланд 2 компанийн өгөгдөл дутуу байна. Процессыг дуусгахын тулд өгөгдлөө шалгана уу.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
