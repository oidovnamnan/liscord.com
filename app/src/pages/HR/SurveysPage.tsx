import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    ClipboardList,
    TrendingUp,
    Users,
    MessageSquare,
    PieChart,
    Calendar,
    Search,
    Filter,
    Plus,
    BarChart3,
    ArrowUpRight,
    Star
} from 'lucide-react';

interface SurveyRecord {
    id: string;
    title: string;
    targetAudience: string;
    responses: number;
    completionRate: number;
    status: 'active' | 'closed' | 'draft';
    endDate: string;
}

const MOCK_SURVEYS: SurveyRecord[] = [
    {
        id: 'SRV-001',
        title: 'Q1 Сотко ажиллах орчны санал асуулга',
        targetAudience: 'Бүх ажилчид',
        responses: 84,
        completionRate: 65,
        status: 'active',
        endDate: '2024-03-30'
    },
    {
        id: 'SRV-002',
        title: 'Шинэ цайны газрын цэсний сонголт',
        targetAudience: 'Улаанбаатар салбар',
        responses: 112,
        completionRate: 95,
        status: 'closed',
        endDate: '2024-03-15'
    },
    {
        id: 'SRV-003',
        title: 'Ажилтнуудын халамж үйлчилгээний хэрэгцээ',
        targetAudience: 'Удирдах ажилтнууд',
        responses: 0,
        completionRate: 0,
        status: 'draft',
        endDate: '2024-04-10'
    }
];

export function SurveysPage() {
    const [surveys] = useState<SurveyRecord[]>(MOCK_SURVEYS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Санал Асуулга"
                    subtitle="Дотоод Pulse survey, ажилчдын сэтгэл ханамж болон санал хүсэлт цуглуулах"
                    action={{
                        label: "Санал Асуулга Үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <MessageSquare size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-primary" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Санал Асуулга</h4>
                                <div className="text-2xl font-black">12ш</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><ClipboardList size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <PieChart size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-secondary" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Оролцооны Хувь</h4>
                                <div className="text-2xl font-black text-secondary">78.4%</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary"><Users size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-success" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">eNPS Оноо</h4>
                                <div className="text-2xl font-black text-success">+42</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Great (Excellent is &gt;50)</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><Star size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <BarChart3 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-warning" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Сүүлийн Асуулга</h4>
                                <div className="text-2xl font-black text-warning">84 Хариу</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><BarChart3 size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Санал асуулгын нэр, бүтээгчээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Төлөв</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Шинэ टेंплэйт</button>
                        </div>
                    </div>

                    {/* Surveys List */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Асуулгын Нэр</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Оролцоо</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Хариулт</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Хаагдах Огноо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveys.map(item => (
                                    <tr key={item.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group cursor-pointer">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-black text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                                                    {item.title} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="text-[10px] text-muted font-bold tracking-widest uppercase flex items-center gap-1 mt-1">
                                                    <Users size={10} /> {item.targetAudience}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="w-24 bg-surface-3 h-2 rounded-full overflow-hidden mx-auto border border-border-color/10">
                                                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${item.completionRate}%` }} />
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-primary mt-1">{item.completionRate}%</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-black text-md">{item.responses}</div>
                                            <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Нийт</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.status === 'active' ? 'bg-success/10 text-success' :
                                                item.status === 'draft' ? 'bg-muted/10 text-muted' : 'bg-danger/10 text-danger'
                                                }`}>
                                                {item.status === 'active' ? 'ИДЭВХТЭЙ' :
                                                    item.status === 'closed' ? 'ХААГДСАН' : 'НООРОГ'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-end gap-1"><Calendar size={10} /> {item.endDate}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
