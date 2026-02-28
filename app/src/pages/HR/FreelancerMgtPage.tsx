import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Briefcase,
    Users,
    Clock,
    DollarSign,
    CheckCircle2,
    Calendar,
    Search,
    Filter,
    Plus,
    FileText,
    ArrowUpRight
} from 'lucide-react';

interface Freelancer {
    id: string;
    name: string;
    specialty: string;
    hourlyRate: number;
    hoursWorked: number;
    status: 'active' | 'completed' | 'on_hold';
    rating: number;
    nextPaymentDat: string;
}

const MOCK_FREELANCERS: Freelancer[] = [
    {
        id: 'FL-001',
        name: 'Оргил',
        specialty: 'UI/UX Дизайн',
        hourlyRate: 45000,
        hoursWorked: 32,
        status: 'active',
        rating: 4.8,
        nextPaymentDat: '2024-03-30'
    },
    {
        id: 'FL-002',
        name: 'Анужин',
        specialty: 'Контент бичигч',
        hourlyRate: 25000,
        hoursWorked: 15,
        status: 'active',
        rating: 4.5,
        nextPaymentDat: '2024-03-25'
    },
    {
        id: 'FL-003',
        name: 'Төгөлдөр',
        specialty: 'Систем админ',
        hourlyRate: 60000,
        hoursWorked: 0,
        status: 'completed',
        rating: 5.0,
        nextPaymentDat: '-'
    }
];

export function FreelancerMgtPage() {
    const [freelancers] = useState<Freelancer[]>(MOCK_FREELANCERS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Гэрээт Ажилтан"
                    subtitle="Хагас цагийн болон туслан гүйцэтгэгч (Freelancer) нарын гэрээ, цагийн хуваарь, төлбөр"
                    action={{
                        label: "Шинэ Гэрээт Ажилтан",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Key Metrics */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-primary">
                            <Users size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй Гэрээтүүд</h4>
                                <div className="text-2xl font-black text-primary">12 хүн</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Users size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Clock size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-secondary" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Гүйцэтгэсэн (Сар)</h4>
                                <div className="text-2xl font-black text-secondary">340 цаг</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary"><Clock size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <DollarSign size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-danger" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Цалингийн Өглөг</h4>
                                <div className="text-2xl font-black text-danger">3.4M ₮</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger"><DollarSign size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <CheckCircle2 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Төсвийн Гүйцэтгэл</h4>
                                <div className="text-2xl font-black text-success">85%</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest text-success">Хэвийн</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><CheckCircle2 size={24} /></div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Нэр, ур чадвар эсвэл ID..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Статус</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Гэрээ</button>
                        </div>
                    </div>

                    {/* Freelancers List Container */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Ажилтан</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Мэргэжил</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Цагийн Хөлс</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Зарцуулсан/Нийт</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Дараагийн Төлбөр</th>
                                </tr>
                            </thead>
                            <tbody>
                                {freelancers.map(freelancer => (
                                    <tr key={freelancer.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group cursor-pointer">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-black text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                                                    {freelancer.name} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="text-[10px] text-muted font-bold tracking-widest uppercase flex items-center gap-1 mt-1">
                                                    {freelancer.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-muted uppercase bg-surface-3 px-2 py-1 rounded inline-flex items-center gap-1">
                                                <Briefcase size={10} /> {freelancer.specialty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-black text-sm leading-none">{freelancer.hourlyRate.toLocaleString()} ₮</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-black text-md">
                                                <span className={freelancer.hoursWorked > 0 ? 'text-primary' : ''}>{freelancer.hoursWorked}ц</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${freelancer.status === 'active' ? 'bg-success/10 text-success' :
                                                freelancer.status === 'completed' ? 'bg-muted/10 text-muted' : 'bg-warning/10 text-warning'
                                                }`}>
                                                {freelancer.status === 'active' ? 'ИДЭВХТЭЙ' :
                                                    freelancer.status === 'completed' ? 'ДУУССАН' : 'ЗОГССОН'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-end gap-1"><Calendar size={10} /> {freelancer.nextPaymentDat}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="col-12 mt-2 card p-4 bg-surface-1 border border-border-color/10 hover:border-primary/50 shadow-sm flex items-center justify-between cursor-pointer transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="text-secondary"><FileText size={24} /></div>
                            <div>
                                <h3 className="font-black text-sm">Гэрээний Загварууд</h3>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Хуулийн салбарт нийцсэн 14 загвар</div>
                            </div>
                        </div>
                        <button className="btn btn-ghost h-10 px-6 font-black text-primary hover:bg-primary/10 transition-colors uppercase tracking-widest text-[10px]">Татах & Өөрчлөх</button>
                    </div>

                </div>
            </div>
        </HubLayout>
    );
}
