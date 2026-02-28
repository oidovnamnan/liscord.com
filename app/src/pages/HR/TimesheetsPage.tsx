import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Clock,
    UserCircle,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    BarChart3,
    Calendar,
    Settings,
    Briefcase
} from 'lucide-react';

interface TimesheetRecord {
    id: string;
    employeeName: string;
    project: string;
    date: string;
    hours: number;
    location: string;
    status: 'approved' | 'pending' | 'rejected';
}

const MOCK_RECORDS: TimesheetRecord[] = [
    {
        id: 'TS-001',
        employeeName: 'Жавхлан',
        project: 'Liscord V3 хөгжүүлэлт',
        date: '2024-03-22',
        hours: 8,
        location: 'Үндсэн оффис',
        status: 'approved'
    },
    {
        id: 'TS-002',
        employeeName: 'Энэрэл',
        project: 'Үйлчлүүлэгчтэй уулзалт',
        date: '2024-03-22',
        hours: 4.5,
        location: 'Зүүн хараа салбар',
        status: 'pending'
    },
    {
        id: 'TS-003',
        employeeName: 'Тэмүүлэн',
        project: 'Сервер тохиргоо',
        date: '2024-03-21',
        hours: 10,
        location: 'Дата төв',
        status: 'approved'
    }
];

export function TimesheetsPage() {
    const [records] = useState<TimesheetRecord[]>(MOCK_RECORDS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Цагийн Лог"
                    subtitle="Төсөл, харилцагч дээр ажилласан цаг бүртгэх болон батлах урсгал"
                    action={{
                        label: "Цаг Бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Time Overview */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-primary">
                            <Clock size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Өнөөдөр (Бүх Цаг)</h4>
                                <div className="text-2xl font-black text-primary">124.5 цаг</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Clock size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <CheckCircle2 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Батлагдсан (Сар)</h4>
                                <div className="text-2xl font-black">1,420 цаг</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Briefcase size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй Төслүүд</h4>
                                <div className="text-2xl font-black">14 төсөл</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><Briefcase size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-warning">
                            <AlertCircle size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээгдэж Буй Цаг</h4>
                                <div className="text-2xl font-black text-warning">48 цаг</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest text-warning">Батлах шаардлагатай</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><AlertCircle size={24} /></div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Ажилтан, төсөл эсвэл харилцагчаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Calendar size={18} /> Энэ долоо хоног</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /></button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Цаг Бүртгэх</button>
                        </div>
                    </div>

                    {/* Timesheet List */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Огноо / Ажилтан</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Төсөл / Ажил</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Зарцуулсан Цаг</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Байршил</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-primary"><UserCircle size={16} /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm">{record.employeeName}</span>
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{record.date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-sm">
                                            {record.project}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-3 py-1 bg-surface-3 rounded-lg font-black text-md ${record.hours > 8 ? 'text-primary' : ''}`}>
                                                {record.hours} цаг
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[10px] font-bold rounded-lg border border-border-color/10 px-2 py-1 bg-surface-2 inline-flex items-center gap-1"><MapPin size={10} className="text-muted" /> {record.location}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${record.status === 'approved' ? 'bg-success/10 text-success' :
                                                    record.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                                                }`}>
                                                {record.status === 'approved' ? 'БАТЛАСАН' :
                                                    record.status === 'pending' ? 'ХҮЛЭЭГДЭЖ БУЙ' : 'ТАТГАЛЗСАН'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="col-12 mt-2 card p-4 bg-primary/5 border border-primary/20 shadow-sm flex items-center justify-between group cursor-pointer transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="text-primary"><BarChart3 size={24} /></div>
                            <div>
                                <h3 className="font-black text-sm">Цагийн Тайлан: Liscord V3 хөгжүүлэлт</h3>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Энэ сард 420 цаг зарцуулагдсан байна. Төсөвт цагийн 84%.</div>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm px-6 h-10 font-black shadow-none"><Settings size={16} className="mr-2" /> ТАЙЛАН ЗАДЛАХ</button>
                    </div>

                </div>
            </div>
        </HubLayout>
    );
}
