import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    HeartPulse,
    Trophy,
    Activity,
    Shield,
    Calendar,
    Search,
    Filter,
    Plus,
    Users,
    ChevronRight
} from 'lucide-react';

interface BenefitRecord {
    id: string;
    employeeName: string;
    benefitType: 'health' | 'sport' | 'childcare' | 'bonus';
    amountUsage: number;
    status: 'active' | 'used' | 'expired';
    expiryDate: string;
}

const MOCK_BENEFITS: BenefitRecord[] = [
    {
        id: 'BEN-001',
        employeeName: 'Ууганбаяр',
        benefitType: 'health',
        amountUsage: 450000,
        status: 'active',
        expiryDate: '2024-12-31'
    },
    {
        id: 'BEN-002',
        employeeName: 'Хулан',
        benefitType: 'sport',
        amountUsage: 1200000,
        status: 'used',
        expiryDate: '2024-03-15'
    },
    {
        id: 'BEN-003',
        employeeName: 'Төгөлдөр',
        benefitType: 'childcare',
        amountUsage: 250000,
        status: 'active',
        expiryDate: '2024-06-30'
    }
];

export function BenefitsPage() {
    const [records] = useState<BenefitRecord[]>(MOCK_BENEFITS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Урамшууллын Багц"
                    subtitle="Ажилчдын эрүүл мэнд, спорт болон бусад урамшууллыг хянах, зардал төлөвлөх"
                    action={{
                        label: "Багц Тохируулах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Key Metrics */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <HeartPulse size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-danger" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Зарцуулалт (YTD)</h4>
                                <div className="text-2xl font-black">24.5М ₮</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger"><HeartPulse size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Users size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хамрагдсан Ажилчид</h4>
                                <div className="text-2xl font-black">112 хүн</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Users size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <Shield size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Эрүүл Мэндийн Даатгал</h4>
                                <div className="text-2xl font-black text-success">Active</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Хаан Даатгал ХХК</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success"><Shield size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Trophy size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ашиглалтын Хувь</h4>
                                <div className="text-2xl font-black text-warning">68.4%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><Activity size={24} /></div>
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="col-12 mt-4 grid grid-cols-4 gap-4">
                        {['Спорт & Фитнес', 'Мэргэжлийн Сургалт', 'Хүүхдийн Тусламж', 'Даатгал & Эрүүл мэнд'].map((category, i) => (
                            <div key={i} className="card p-4 bg-surface-1 border-none shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-surface-2 transition-all">
                                <div className="h-10 w-10 bg-surface-3 rounded-xl flex items-center justify-center font-black text-muted group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">0{i + 1}</div>
                                <div className="font-bold text-sm tracking-tight flex-1">{category}</div>
                                <ChevronRight size={16} className="text-border-color/20 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>


                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Багцын ID, Ажилтнаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Төрөл</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Хүсэлт Бүрхэх</button>
                        </div>
                    </div>

                    {/* Benefit Records List */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Ажилтан</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Төрөл</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Зарцуулсан Дүн</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Дуусах Огноо</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-black text-sm">{record.employeeName}</div>
                                                <div className="text-[10px] text-muted font-bold tracking-widest uppercase">{record.id}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {record.benefitType === 'health' && <HeartPulse size={14} className="text-danger" />}
                                                {record.benefitType === 'sport' && <Trophy size={14} className="text-warning" />}
                                                {record.benefitType === 'childcare' && <Users size={14} className="text-secondary" />}
                                                <span className="text-xs font-bold uppercase tracking-widest text-muted">{record.benefitType}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-black text-md">{record.amountUsage.toLocaleString()} ₮</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${record.status === 'active' ? 'bg-success/10 text-success' :
                                                record.status === 'used' ? 'bg-muted/10 text-muted' : 'bg-danger/10 text-danger'
                                                }`}>
                                                {record.status === 'active' ? 'ИДЭВХТЭЙ' :
                                                    record.status === 'used' ? 'АШИГЛАСАН' : 'ДУУССАН'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-end gap-1"><Calendar size={10} /> {record.expiryDate}</div>
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
