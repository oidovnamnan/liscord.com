import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Receipt,
    Camera,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    Search,
    Filter,
    Plus,
    Calendar,
    Settings,
    MoreHorizontal,
    MapPin
} from 'lucide-react';

interface ExpenseClaim {
    id: string;
    employeeName: string;
    department: string;
    amount: number;
    category: 'travel' | 'food' | 'supplies' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    date: string;
    receiptCount: number;
}

const MOCK_CLAIMS: ExpenseClaim[] = [
    {
        id: 'EXP-001',
        employeeName: 'Жавхлан',
        department: 'Борлуулалт',
        amount: 45000,
        category: 'travel',
        status: 'pending',
        date: '2024-03-22',
        receiptCount: 2
    },
    {
        id: 'EXP-002',
        employeeName: 'Саруул',
        department: 'Маркетинг',
        amount: 120000,
        category: 'supplies',
        status: 'approved',
        date: '2024-03-22',
        receiptCount: 1
    },
    {
        id: 'EXP-003',
        employeeName: 'Номин',
        department: 'Үйл ажиллагаа',
        amount: 350000,
        category: 'other',
        status: 'paid',
        date: '2024-03-21',
        receiptCount: 4
    }
];

export function ExpensesClaimPage() {
    const [claims] = useState<ExpenseClaim[]>(MOCK_CLAIMS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Зардлын Нэхэмжлэл"
                    subtitle="Ажилтны жижиг зардал, томилолт болон бусад нөхөн олгох зардлын хүсэлт"
                    action={{
                        label: "Зардал Үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Claims Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-warning">
                            <AlertCircle size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-warning" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээгдэж Буй</h4>
                                <div className="text-2xl font-black text-warning">14 хүсэлт</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><AlertCircle size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <CheckCircle2 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Батлагдсан (Төлөөгүй)</h4>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-black text-primary">6 хүсэлт</div>
                                </div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <Receipt size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Олгосон (Сард)</h4>
                                <div className="text-2xl font-black text-success">4.2M ₮</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><Receipt size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Camera size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-muted" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Баримтын Бүрдэл</h4>
                                <div className="text-2xl font-black text-muted">98%</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Асуудалгүй</div>
                            </div>
                            <div className="bg-surface-3 p-4 rounded-2xl text-muted"><Camera size={24} /></div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Нэхэмжлэлийн ID, ажилтнаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Ангилал</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Settings size={18} /></button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black shadow-lg shadow-primary/20 bg-dark text-white border-dark"><Plus size={18} /> Хүсэлт</button>
                        </div>
                    </div>

                    {/* Claims List */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Хүсэлт / Ажилтан</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Ангилал</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Хүссэн Дүн</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Баримт</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Огноо</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {claims.map(claim => (
                                    <tr key={claim.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-primary"><UserCircle size={16} /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm">{claim.employeeName}</span>
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{claim.id} • {claim.department}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded inline-flex items-center gap-1">
                                                {claim.category === 'travel' && <MapPin size={10} />}
                                                {claim.category === 'travel' ? 'ТОМИЛОЛТ' : claim.category === 'food' ? 'ХООЛНЫ' : claim.category === 'supplies' ? 'БИЧИГ ХЭРЭГ' : 'БУСАД'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-black text-md block leading-none">{claim.amount.toLocaleString()} ₮</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${claim.status === 'paid' ? 'bg-success/10 text-success' :
                                                claim.status === 'approved' ? 'bg-primary/10 text-primary' :
                                                    claim.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                                                }`}>
                                                {claim.status === 'paid' ? 'ТӨЛСӨН' :
                                                    claim.status === 'approved' ? 'БАТЛАСАН' :
                                                        claim.status === 'pending' ? 'ХҮЛЭЭГДЭЖ БУЙ' : 'ТАТГАЛЗСАН'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[10px] font-bold rounded-lg border border-border-color/10 px-2 py-1 bg-surface-2 inline-flex items-center gap-1">
                                                <Camera size={10} className="text-muted" /> {claim.receiptCount} баримт
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-end gap-1"><Calendar size={10} /> {claim.date}</div>
                                        </td>
                                        <td className="p-4 w-12 text-center text-primary">
                                            <button className="btn btn-ghost h-8 w-8 hover:bg-primary/10 rounded-xl flex items-center justify-center p-0"><MoreHorizontal size={18} /></button>
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
