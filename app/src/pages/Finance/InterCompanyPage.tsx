import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Building2,
    ArrowRightLeft,
    Box,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock
} from 'lucide-react';

interface InterCompanyTransaction {
    id: string;
    fromCompany: string;
    toCompany: string;
    type: 'loan' | 'service' | 'product_transfer' | 'investment';
    amount: number;
    status: 'reconciled' | 'pending' | 'disputed';
    date: string;
}

const MOCK_TRANS: InterCompanyTransaction[] = [
    {
        id: 'ICT-001',
        fromCompany: 'Liscord Holdco',
        toCompany: 'Liscord Retail LLC',
        type: 'investment',
        amount: 250000000,
        status: 'reconciled',
        date: '2024-03-22'
    },
    {
        id: 'ICT-002',
        fromCompany: 'Liscord Tech',
        toCompany: 'Liscord Retail LLC',
        type: 'service',
        amount: 15400000,
        status: 'pending',
        date: '2024-03-21'
    },
    {
        id: 'ICT-003',
        fromCompany: 'Liscord Logistics',
        toCompany: 'Liscord Retail LLC',
        type: 'product_transfer',
        amount: 45000000,
        status: 'reconciled',
        date: '2024-03-20'
    }
];

export function InterCompanyPage() {
    const [transactions] = useState<InterCompanyTransaction[]>(MOCK_TRANS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Компани Хоорондын Төлбөр"
                    subtitle="Толгой болон охин компаниудын хоорондох гүйлгээ, хөрөнгө оруулалт болон тулгалт хянах"
                    action={{
                        label: "Гүйлгээ Үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Multi-Entity Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Компани</h4>
                                <div className="text-2xl font-black">6 Entities</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Building2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group border-l-4 border-success">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Тулгагдсан Гүйлгээ</h4>
                                <div className="text-2xl font-black text-success">94.2%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дотоод Гүйлгээ</h4>
                                <div className="text-2xl font-black text-warning">4.2Т ₮</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><BarChart3 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Pending Approval</h4>
                                <div className="text-2xl font-black text-muted">12</div>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Clock size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Компанийн нэр, гүйлгээний дугаараар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Төрөл</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Дотоод Нэхэмжлэх</button>
                        </div>
                    </div>

                    {/* Entity Map Preview */}
                    <div className="col-4 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Entity Relationship Map</h3>
                        <div className="card p-6 bg-surface-1 border-none shadow-sm min-h-[400px] flex flex-col gap-4">
                            <div className="p-4 bg-primary text-white rounded-2xl text-center font-black text-md shadow-lg shadow-primary/20">Liscord Holding</div>
                            <div className="flex justify-center h-8 w-px bg-border-color/20 mx-auto" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-surface-2 rounded-xl text-center text-xs font-bold border border-border-color/5">Liscord Tech</div>
                                <div className="p-3 bg-surface-2 rounded-xl text-center text-xs font-bold border border-border-color/5">Liscord Logistics</div>
                            </div>
                            <div className="flex justify-center h-8 w-px bg-border-color/20 mx-auto" />
                            <div className="p-4 bg-secondary text-white rounded-2xl text-center font-black text-sm">Liscord Retail LLC</div>
                            <div className="flex-1" />
                            <p className="text-[10px] font-bold text-muted text-center italic">Компани хоорондын бүх гүйлгээг энэ бүтцээр автоматжуулна.</p>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="col-8">
                        <div className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2 border-b border-border-color/10">
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Илгээгч / Хүлээн авагч</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Төрөл</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Дүн</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Огноо</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-black text-sm flex items-center gap-2">{tx.fromCompany} <ArrowRightLeft size={12} className="text-muted" /> {tx.toCompany}</div>
                                                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{tx.id}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-muted">{tx.type.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-black text-md text-primary">
                                                {tx.amount.toLocaleString()} ₮
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${tx.status === 'reconciled' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                                    }`}>
                                                    {tx.status === 'reconciled' ? 'ТУЛГАСАН' : 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{tx.date}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 text-center border-t border-border-color/5">
                                <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-2 mx-auto"><Box size={14} /> Нэгтгэсэн тайлан харах</button>
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="grid grid-cols-3 gap-6 mt-6">
                            <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-2">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase">Debt / Equity</h4>
                                <div className="text-2xl font-black">0.45</div>
                                <div className="flex items-center gap-1 text-success text-[10px] font-bold"><TrendingDown size={12} /> Optimization</div>
                            </div>
                            <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-2">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase">Internal Cash</h4>
                                <div className="text-2xl font-black">1.2М ₮</div>
                                <div className="flex items-center gap-1 text-primary text-[10px] font-bold"><TrendingUp size={12} /> Liquidity</div>
                            </div>
                            <div className="card p-6 bg-surface-1 border-none shadow-sm space-y-2">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase">Tax Liability</h4>
                                <div className="text-2xl font-black">45М ₮</div>
                                <div className="flex items-center gap-1 text-danger text-[10px] font-bold"><AlertTriangle size={12} /> Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
