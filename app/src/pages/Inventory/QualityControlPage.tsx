import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    SearchCheck,
    Search,
    User,
    ArrowRight,
    Filter,
    AlertCircle,
    FileText,
    History,
    Zap,
    Share2,
    ShieldCheck,
    XCircle,
    Layers,
    Activity,
    Cpu,
    CheckCircle
} from 'lucide-react';

interface QCReport {
    id: string;
    product: string;
    batch: string;
    status: 'pass' | 'fail' | 'testing';
    inspector: string;
    date: string;
    score: number;
}

const MOCK_QC: QCReport[] = [
    {
        id: 'QC-001',
        product: 'Liscord POS Terminal X1',
        batch: 'BATCH-2026-02',
        status: 'pass',
        inspector: 'Э.Батболд',
        date: '2026-02-28',
        score: 98
    },
    {
        id: 'QC-002',
        product: 'Industrial Laser Cutter',
        batch: 'BATCH-METAL-01',
        status: 'testing',
        inspector: 'Г.Тулга',
        date: '2026-02-27',
        score: 0
    },
    {
        id: 'QC-003',
        product: 'Standard Battery Pack',
        batch: 'BATT-9921',
        status: 'fail',
        inspector: 'С.Баяр',
        date: '2026-02-20',
        score: 45
    }
];

export function QualityControlPage() {
    const [reports] = useState<QCReport[]>(MOCK_QC);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Чанарын Шалгалт (Quality Control)"
                    subtitle="Ирсэн бараа болон бэлэн бүтээгдэхүүний чанарын тест, шат дараалсан шалгалт"
                    action={{
                        label: "Шалгалт эхлүүлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт шалгалт</h4>
                                <div className="text-3xl font-black text-primary">2,450</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><SearchCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Тэнцсэн %</h4>
                                <div className="text-3xl font-black text-success">96.8%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Татгалзсан</h4>
                                <div className="text-3xl font-black text-danger">75</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><XCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Дундаж оноо</h4>
                                <div className="text-3xl font-black">92/100</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><ShieldCheck size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Багц дугаар, бүтээгдэхүүнээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Багц</button>
                    </div>

                    {/* QC Pipeline */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {reports.map(report => (
                            <div key={report.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${report.status === 'pass' ? 'text-success' :
                                            report.status === 'testing' ? 'text-warning' :
                                                report.status === 'fail' ? 'text-danger' : 'text-primary'
                                        }`}>
                                        <div className="h-16 w-16 rounded-full bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner">
                                            {report.status === 'pass' ? <ShieldCheck size={32} /> :
                                                report.status === 'testing' ? <Activity size={32} /> :
                                                    report.status === 'fail' ? <XCircle size={32} /> : <AlertCircle size={32} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-3 text-center leading-tight">{report.id}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{report.product}</h3>
                                                <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                    <Layers size={10} className="mr-1" /> {report.batch}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary lowercase"><User size={12} /> {report.inspector}</span>
                                                <span className="flex items-center gap-1"><History size={12} /> {report.date} ШАЛГАСАН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">ОНОО</div>
                                                <div className={`text-2xl font-black ${report.status === 'pass' ? 'text-success' :
                                                        report.status === 'fail' ? 'text-danger' : 'text-warning'
                                                    }`}>
                                                    {report.status === 'testing' ? '--' : `${report.score}%`}
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><FileText size={20} /></button>
                                                <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                    <ArrowRight size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* QC Policy / Dashboard Call */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Cpu size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Автомат чанарын хяналт</h3>
                                <p className="text-sm text-muted">IoT төхөөрөмж болон камерын тусламжтайгаар автоматаар чанар шалгах тохиргоо.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТОХИРГОО</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
