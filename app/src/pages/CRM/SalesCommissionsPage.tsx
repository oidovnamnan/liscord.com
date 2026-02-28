import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    DollarSign,
    Search,
    TrendingUp,
    ArrowRight,
    Zap,
    Share2,
    Database,
    Percent,
    Trophy,
    Target,
    Calendar,
    Settings
} from 'lucide-react';

interface CommissionRecord {
    id: string;
    agent: string;
    salesVolume: number;
    commissionRate: number;
    amount: number;
    status: 'paid' | 'pending' | 'calculated';
    lastSale: string;
}

const MOCK_COMMISSIONS: CommissionRecord[] = [
    {
        id: 'COM-001',
        agent: 'Ц.Билгүүн',
        salesVolume: 125000000,
        commissionRate: 5,
        amount: 6250000,
        status: 'pending',
        lastSale: '2 hours ago'
    },
    {
        id: 'COM-002',
        agent: 'Н.Мишээл',
        salesVolume: 88000000,
        commissionRate: 3.5,
        amount: 3080000,
        status: 'calculated',
        lastSale: 'Just now'
    },
    {
        id: 'COM-003',
        agent: 'Б.Тэргэл',
        salesVolume: 2450000,
        commissionRate: 2,
        amount: 49000,
        status: 'paid',
        lastSale: '1 day ago'
    }
];

export function SalesCommissionsPage() {
    const [commissions] = useState<CommissionRecord[]>(MOCK_COMMISSIONS);

    return (
        <HubLayout hubId="crm-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Борлуулалтын Урамшуулал (Commissions)"
                    subtitle="Агент бүрийн борлуулалтын төлөвлөгөө, гүйцэтгэл болон хувь оноох систем"
                    action={{
                        label: "Тооцоолол шинэчлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт борлуулалт</h4>
                                <div className="text-3xl font-black text-primary">₮215.4M</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт урамшуулал</h4>
                                <div className="text-3xl font-black text-secondary">₮9.3M</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><DollarSign size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Top Agent</h4>
                                <div className="text-3xl font-black text-success">Ц.Билгүүн</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Growth Engine</h4>
                                <div className="text-xl font-black">+18% Target</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Target size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Агент, захиалгын дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх салбар</button>
                    </div>

                    {/* Commissions Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Агент & ID</th>
                                    <th>Борлуулалт</th>
                                    <th>Хувь (%)</th>
                                    <th>Урамшуулал (₮)</th>
                                    <th>Сүүлийн шинэчлэл</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map(c => (
                                    <tr key={c.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-all shadow-inner border border-border-color/10 font-black">
                                                    {c.agent.substring(0, 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm tracking-tight">{c.agent}</div>
                                                    <div className="text-[11px] font-black text-muted uppercase tracking-widest mt-0.5">{c.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-muted tracking-tighter">₮{c.salesVolume.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black text-primary border-primary/20 bg-primary/5 uppercase">
                                                <Percent size={10} className="mr-1" /> {c.commissionRate}%
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-primary tracking-tighter">₮{c.amount.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-[11px] font-black text-muted uppercase tracking-widest">
                                                <Calendar size={12} /> {c.lastSale}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${c.status === 'paid' ? 'success' :
                                                    c.status === 'pending' ? 'warning' : 'primary'
                                                }`}>
                                                {c.status === 'paid' ? 'ТӨЛӨГДСӨН' :
                                                    c.status === 'pending' ? 'ХҮЛЭЭГДЭЖ БУЙ' : 'ТООЦОЖ БУЙ'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2 text-muted">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors hover:bg-surface-3"><Settings size={18} /></button>
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

                    {/* Rule Setting Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Урамшууллын бодлого (Incentive Plan)</h3>
                                <p className="text-sm text-muted">Борлуулалтын шатлал болон бонус нэмэгдлийг автоматаар тохируулах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">БОДЛОГО ТОХИРУУЛАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
