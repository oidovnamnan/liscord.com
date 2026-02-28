import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Undo2,
    Search,
    Clock,
    User,
    ArrowRight,
    Filter,
    CheckCircle2,
    History,
    Zap,
    Share2,
    Wrench,
    RotateCcw,
    RefreshCw,
    PackageSearch,
    Package
} from 'lucide-react';

interface RMARequest {
    id: string;
    product: string;
    customer: string;
    reason: string;
    type: 'refund' | 'repair' | 'replace';
    status: 'pending' | 'received' | 'processing' | 'completed' | 'rejected';
    date: string;
}

const MOCK_RMA: RMARequest[] = [
    {
        id: 'RMA-501',
        product: 'Liscord POS Terminal X1',
        customer: 'Э.Батболд',
        reason: 'Дэлгэц асахгүй байна',
        type: 'repair',
        status: 'processing',
        date: '2026-02-28'
    },
    {
        id: 'RMA-502',
        product: 'Industrial Laser Cutter',
        customer: 'Metal Tech LLC',
        reason: 'Дутуу эд анги ирсэн',
        type: 'replace',
        status: 'pending',
        date: '2026-02-27'
    },
    {
        id: 'RMA-503',
        product: 'Eco-Friendly Sofa Frame',
        customer: 'С.Баяр',
        reason: 'Хэмжээ зөрсөн',
        type: 'refund',
        status: 'completed',
        date: '2026-02-20'
    }
];

export function RMAPage() {
    const [requests] = useState<RMARequest[]>(MOCK_RMA);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Барааны Буцаалт (RMA)"
                    subtitle="Бараа буцаах, солих, засварлах хүсэлт болон үйл явцын түүх"
                    action={{
                        label: "RMA үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт хүсэлт</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Undo2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Явцад буй</h4>
                                <div className="text-3xl font-black text-warning">8</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Татгалзсан</h4>
                                <div className="text-3xl font-black text-danger">3</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><Zap size={28} className="rotate-180" /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-success to-success-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <CheckCircle2 size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Шийдвэрлэсэн</h4>
                                <div className="text-3xl font-black">113</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="RMA дугаар, бүтээгдэхүүн, харилцагчийн нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Бүх төрөл</button>
                    </div>

                    {/* RMA Pipeline */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {requests.map(rma => (
                            <div key={rma.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${rma.status === 'completed' ? 'text-success' :
                                            rma.status === 'processing' ? 'text-warning' :
                                                rma.status === 'pending' ? 'text-primary' : 'text-danger'
                                        }`}>
                                        <div className="h-16 w-16 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner">
                                            {rma.type === 'repair' ? <Wrench size={32} /> :
                                                rma.type === 'replace' ? <RefreshCw size={32} /> : <RotateCcw size={32} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-3 text-center leading-tight">{rma.id}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{rma.product}</h3>
                                                <div className="badge badge-block text-[10px] font-black uppercase tracking-widest px-4 py-1.5">
                                                    {rma.type}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Package size={10} /> {rma.reason}</p>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary lowercase"><User size={12} /> {rma.customer}</span>
                                                <span className="flex items-center gap-1"><History size={12} /> {rma.date} ХҮСЭЛТ ГАРГАСАН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">ТӨЛӨВ</div>
                                                <span className={`badge badge-block font-black px-6 py-2 rounded-2xl badge-${rma.status === 'completed' ? 'success' :
                                                        rma.status === 'processing' ? 'warning' :
                                                            rma.status === 'pending' ? 'primary' : 'danger'
                                                    }`}>
                                                    {rma.status === 'pending' ? 'ШИНЭ ХҮСЭЛТ' :
                                                        rma.status === 'processing' ? 'ЗАСВАРЛАЖ БАЙНА' :
                                                            rma.status === 'completed' ? 'ШИЙДВЭРЛЭСЭН' : 'ТАТГАЛЗСАН'}
                                                </span>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><PackageSearch size={20} /></button>
                                            <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <ArrowRight size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RMA Workflow Actions */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Харилцагчийн сэтгэл ханамж</h3>
                                <p className="text-sm text-muted">Бүх буцаалтыг шийдвэрлэсний дараа харилцагчийн сэтгэл ханамжийг нэмэгдүүлэх мессеж илгээнэ үү.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ДУУСГАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
