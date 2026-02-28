import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Search,
    ArrowRight,
    Filter,
    ShieldCheck,
    AlertCircle,
    FileText,
    Zap,
    Share2,
    Activity,
    Cpu,
    Layers,
    ClipboardCheck,
    ThumbsDown,
    ThumbsUp
} from 'lucide-react';

interface QCRecord {
    id: string;
    orderId: string;
    product: string;
    status: 'pass' | 'fail' | 'testing';
    inspector: string;
    date: string;
    score: number;
}

const MOCK_QC: QCRecord[] = [
    {
        id: 'QC-701',
        orderId: 'MO-9901',
        product: 'Liscord POS Terminal X1',
        status: 'pass',
        inspector: 'Э.Батболд',
        date: '2026-02-28',
        score: 98
    },
    {
        id: 'QC-702',
        orderId: 'MO-9902',
        product: 'Industrial Laser Cutter',
        status: 'testing',
        inspector: 'Г.Тулга',
        date: '2026-02-27',
        score: 0
    },
    {
        id: 'QC-703',
        orderId: 'MO-9910',
        product: 'Standard Battery Pack',
        status: 'fail',
        inspector: 'С.Баяр',
        date: '2026-02-20',
        score: 45
    }
];

export function QAPage() {
    const [records] = useState<QCRecord[]>(MOCK_QC);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Чанар Шалгалт (QA)"
                    subtitle="Үйлдвэрлэлийн шат дамжлагын чанарын хяналт болон гүйцэтгэлийн үнэлгээ"
                    action={{
                        label: "Шалгалт бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт шалгалт</h4>
                                <div className="text-3xl font-black text-primary">245</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><ClipboardCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Pass Rate</h4>
                                <div className="text-3xl font-black text-success">96.8%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><ThumbsUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Fail Rate</h4>
                                <div className="text-3xl font-black text-danger">3.2%</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><ThumbsDown size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI QA ASSISTANT</h4>
                                <div className="text-xl font-black">ACTIVE MONITOR</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><ShieldCheck size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Шалгалт, захиалга, бүтээгдэхүүнээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төрөл</button>
                    </div>

                    {/* Records Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Бүтээгдэхүүн</th>
                                    <th>Захиалга (MO)</th>
                                    <th>Хариуцагч</th>
                                    <th>Оноо %</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner border border-border-color/10">
                                                    {record.status === 'pass' ? <ShieldCheck size={20} className="text-success" /> :
                                                        record.status === 'fail' ? <AlertCircle size={20} className="text-danger" /> : <Activity size={20} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm">{record.product}</div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{record.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                <Layers size={10} className="mr-1" /> {record.orderId}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-black text-primary border border-border-color/10">
                                                    {record.inspector.substring(0, 1)}
                                                </div>
                                                <span className="text-xs font-bold text-muted uppercase tracking-widest">{record.inspector}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`text-sm font-black ${record.score > 90 ? 'text-success' : record.score > 50 ? 'text-warning' : 'text-danger'}`}>
                                                {record.status === 'testing' ? 'Testing...' : `${record.score}%`}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-block font-black text-[10px] px-6 py-2 uppercase tracking-widest badge-${record.status === 'pass' ? 'success' :
                                                    record.status === 'fail' ? 'danger' : 'warning'
                                                }`}>
                                                {record.status === 'pass' ? 'ТЭНЦСЭН' :
                                                    record.status === 'fail' ? 'ТАТГАЛЗСАН' : 'ТЕСТ ХИЙЖ БУЙ'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><FileText size={18} /></button>
                                                <button className="btn btn-primary p-2 h-10 w-10 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Machine Performance Alert / Action */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Cpu size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Автомат Чанар Шалгагч (Visual AI)</h3>
                                <p className="text-sm text-muted">Камер болон AI ашиглан бүтээгдэхүүний өнгө, хэлбэр, согогийг автоматаар илрүүлж бүртгэх систем.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">СИСТЕМ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
