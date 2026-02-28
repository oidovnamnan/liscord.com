import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Handshake,
    FileText,
    DollarSign,
    TrendingUp,
    ShieldCheck,
    Clock,
    Search,
    Filter,
    Plus,
    CheckCircle2,
    ChevronRight,
    Briefcase,
    Zap,
    AlertCircle,
    ArrowUpRight,
    BarChart3
} from 'lucide-react';

interface FactoringDeal {
    id: string;
    invoiceId: string;
    customer: string;
    amount: number;
    fundingAmount: number;
    fee: number;
    status: 'pending' | 'funded' | 'completed' | 'rejected';
    dueDate: string;
    daysLeft: number;
}

const MOCK_DEALS: FactoringDeal[] = [
    {
        id: 'FAC-001',
        invoiceId: 'INV-4412',
        customer: 'MCS Group',
        amount: 45000000,
        fundingAmount: 40500000,
        fee: 900000,
        status: 'funded',
        dueDate: '2024-04-15',
        daysLeft: 24
    },
    {
        id: 'FAC-002',
        invoiceId: 'INV-4413',
        customer: 'APU JSC',
        amount: 120000000,
        fundingAmount: 108000000,
        fee: 2400000,
        status: 'pending',
        dueDate: '2024-05-10',
        daysLeft: 49
    },
    {
        id: 'FAC-003',
        invoiceId: 'INV-4410',
        customer: 'Unitel LLC',
        amount: 15000000,
        fundingAmount: 13500000,
        fee: 300000,
        status: 'completed',
        dueDate: '2024-03-10',
        daysLeft: 0
    }
];

export function FactoringPage() {
    const [deals] = useState<FactoringDeal[]>(MOCK_DEALS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Факторинг"
                    subtitle="Нэхэмжлэх барьцаалсан санхүүжилт авах, бэлэн мөнгөний урсгалыг хурдасгах"
                    action={{
                        label: "Санхүүжилт Хүсэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Summary Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Санхүүжилт</h4>
                                <div className="text-2xl font-black">2.4Т ₮</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Handshake size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group border-l-4 border-success">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Олгогдсон</h4>
                                <div className="text-2xl font-black text-success">1.8Т ₮</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Zap size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж Шимтгэл</h4>
                                <div className="text-2xl font-black text-warning">1.2%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><BarChart3 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Одоо Хүлээгдэж буй</h4>
                                <div className="text-2xl font-black text-muted">120М ₮</div>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Харилцагч, нэхэмжлэхээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Төлөв</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Хүсэлт Илгээх</button>
                        </div>
                    </div>

                    {/* Deals List */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {deals.map(deal => (
                            <div key={deal.id} className="card p-6 bg-surface-1 border-none shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner border border-border-color/10">
                                            <FileText size={32} />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-[250px]">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black">{deal.customer}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${deal.status === 'funded' ? 'bg-success/10 text-success' :
                                                        deal.status === 'pending' ? 'bg-warning/10 text-warning' :
                                                            deal.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                                                    }`}>
                                                    {deal.status === 'funded' ? 'САНХҮҮЖҮҮЛСЭН' :
                                                        deal.status === 'pending' ? 'ХҮЛЭЭГДЭЖ БУЙ' :
                                                            deal.status === 'completed' ? 'ДУУССАН' : 'ТАТГАЛЗСАН'}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-muted flex items-center gap-2">
                                                <Briefcase size={14} /> Нэхэмжлэх: {deal.invoiceId}
                                                <span className="opacity-50">•</span>
                                                Хугацаа: {deal.dueDate} ({deal.daysLeft} хоног үлдсэн)
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8 flex-1 border-l border-border-color/5 pl-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70"><DollarSign size={10} /> ГҮЙЛГЭЭНИЙ ДҮН</div>
                                                <div className="text-lg font-black">{deal.amount.toLocaleString()} ₮</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1 opacity-70"><ArrowUpRight size={10} /> ОЛГОХ ДҮН</div>
                                                <div className="text-lg font-black text-success">{deal.fundingAmount.toLocaleString()} ₮</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-danger uppercase tracking-widest flex items-center gap-1 opacity-70"><AlertCircle size={10} /> ШИМТГЭЛ</div>
                                                <div className="text-lg font-black text-danger">{deal.fee.toLocaleString()} ₮</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-6 flex items-center gap-2">
                                        <button className="h-12 w-12 bg-surface-2 rounded-2xl flex items-center justify-center text-muted group-hover:text-primary transition-all hover:bg-primary/10 border border-border-color/10">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* How it works Information */}
                    <div className="col-12 mt-4 grid grid-cols-3 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ShieldCheck size={24} /></div>
                            <h3 className="text-md font-black">Найдвартай холболт</h3>
                            <p className="text-xs font-bold text-muted">Монголын тэргүүлэгч банкууд болон ББСБ-уудтай шууд холбогдсон.</p>
                        </div>
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary"><CheckCircle2 size={24} /></div>
                            <h3 className="text-md font-black">90% хүртэл олголт</h3>
                            <p className="text-xs font-bold text-muted">Нэхэмжлэх дүнгийн 90 хүртэлх хувийг ажлын 24 цагт багтаан олгоно.</p>
                        </div>
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <div className="h-12 w-12 bg-warning/10 rounded-xl flex items-center justify-center text-warning"><TrendingUp size={24} /></div>
                            <h3 className="text-md font-black">Давуу тал</h3>
                            <p className="text-xs font-bold text-muted">Бэлэн мөнгөний тасалдлаас сэргийлж, бизнесийн эргэлтээ нэмэгдүүлнэ.</p>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
