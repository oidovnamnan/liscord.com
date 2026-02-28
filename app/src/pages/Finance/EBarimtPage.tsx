import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CloudIcon,
    CheckCircle2,
    AlertCircle,
    History,
    FileText,
    TrendingUp,
    BarChart3,
    QrCode,
    Settings,
    RefreshCw,
    Download,
    Mail,
    Search,
    Filter,
    Plus,
    XCircle
} from 'lucide-react';

interface EBarimtRecord {
    id: string;
    orderId: string;
    amount: number;
    vat: number;
    cityTax: number;
    status: 'success' | 'failed' | 'processing' | 'cancelled';
    date: string;
    lotteryNumber: string;
    qrData: string;
}

const MOCK_RECORDS: EBarimtRecord[] = [
    {
        id: 'EB-240322-001',
        orderId: 'ORD-9912',
        amount: 145000,
        vat: 13182,
        cityTax: 2636,
        status: 'success',
        date: '2024-03-22 14:20',
        lotteryNumber: '10293847',
        qrData: 'https://ebarimt.mn/q/12345'
    },
    {
        id: 'EB-240322-002',
        orderId: 'ORD-9913',
        amount: 25000,
        vat: 2273,
        cityTax: 454,
        status: 'success',
        date: '2024-03-22 15:05',
        lotteryNumber: '88127364',
        qrData: 'https://ebarimt.mn/q/67890'
    },
    {
        id: 'EB-240322-003',
        orderId: 'ORD-9914',
        amount: 68000,
        vat: 0,
        cityTax: 0,
        status: 'failed',
        date: '2024-03-22 16:15',
        lotteryNumber: '',
        qrData: ''
    }
];

export function EBarimtPage() {
    const [records] = useState<EBarimtRecord[]>(MOCK_RECORDS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="И-Баримт (НӨАТ)"
                    subtitle="Татварын системтэй шууд холбогдож баримт илгээх, сугалаа болон НӨАТ-ын тайлан хянах"
                    action={{
                        label: "Систем Шалгах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Status Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-success group-hover:scale-110 transition-transform"><CloudIcon size={48} /></div>
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Холболтын Төлөв</h4>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 bg-success rounded-full animate-pulse" />
                                <div className="text-xl font-black text-success">ХОЛБОГДСОН</div>
                            </div>
                            <div className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest">Үлдэгдэл: 45,210 баримт</div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Илгээсэн</h4>
                            <div className="text-3xl font-black">12,450</div>
                            <div className="flex items-center gap-1 text-success text-[10px] font-bold">
                                <TrendingUp size={12} /> +24 (Өнөөдөр)
                            </div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">НӨАТ (Сар)</h4>
                            <div className="text-3xl font-black">4.2М ₮</div>
                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Тайлант хугацаа: 03-р сар</div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4">
                            <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийслэлийн Татвар</h4>
                            <div className="text-3xl font-black">840,200 ₮</div>
                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 text-right">03/01 - 03/22</div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Баримтын дугаар, захиалгаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black"><Filter size={18} /> Шүүлтүүр</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center justify-center text-muted"><Settings size={18} /></button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black"><Plus size={18} /> Бөөнөөр илгээх</button>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="col-12 table-card">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Баримтын ID</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Борлуулалт</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Дүн</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">НӨАТ / НТ</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-all group">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-black text-sm">{record.id}</div>
                                                <div className="text-[10px] text-muted font-bold mt-0.5">{record.date}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-sm text-primary hover:underline cursor-pointer">{record.orderId}</td>
                                        <td className="p-4 text-right font-black">{record.amount.toLocaleString()} ₮</td>
                                        <td className="p-4 text-right">
                                            <div className="text-sm font-bold">{record.vat.toLocaleString()} ₮ / {record.cityTax.toLocaleString()} ₮</div>
                                            <div className="text-[8px] text-muted font-black uppercase tracking-tighter mt-1">VAT / CITY TAX</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${record.status === 'success' ? 'bg-success/10 text-success' :
                                                record.status === 'failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                                }`}>
                                                {record.status === 'success' ? <CheckCircle2 size={12} /> :
                                                    record.status === 'failed' ? <XCircle size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                                                {record.status === 'success' ? 'ИЛГЭЭГДСЭН' :
                                                    record.status === 'failed' ? 'АЛДАА' : 'ИЛГЭЭЖ БАЙНА'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {record.status === 'success' && (
                                                    <>
                                                        <button className="btn btn-ghost p-2 rounded-xl text-primary hover:bg-primary/10" title="QR Харах"><QrCode size={18} /></button>
                                                        <button className="btn btn-ghost p-2 rounded-xl text-secondary hover:bg-secondary/10" title="Хэвлэх"><Download size={18} /></button>
                                                        <button className="btn btn-ghost p-2 rounded-xl text-muted hover:bg-surface-3" title="Имэйл илгээх"><Mail size={18} /></button>
                                                    </>
                                                )}
                                                {record.status === 'failed' && (
                                                    <button className="btn btn-primary px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1"><RefreshCw size={12} /> ДАХИН ИЛГЭЭХ</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Report & Setup Cards */}
                    <div className="col-6 mt-4">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group hover:bg-surface-2 transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><BarChart3 size={28} /></div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Төсвийн Тайлан (Excel)</h3>
                                    <p className="text-sm font-bold text-muted">Сүүлийн 1 жилийн бүх баримтыг Excel-ээр татаж авах</p>
                                </div>
                            </div>
                            <History size={24} className="text-muted" />
                        </div>
                    </div>

                    <div className="col-6 mt-4">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group hover:bg-surface-2 transition-all cursor-pointer border-l-4 border-warning">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 bg-warning/10 rounded-2xl flex items-center justify-center text-warning group-hover:scale-110 transition-transform"><FileText size={28} /></div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Татварт мэдүүлэх (Form)</h3>
                                    <p className="text-sm font-bold text-muted">Сар бүрийн НӨАТ-ын тайланг автоматаар бэлтгэх</p>
                                </div>
                            </div>
                            <AlertCircle size={24} className="text-warning" />
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
