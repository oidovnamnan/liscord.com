import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Timer,
    User,
    Briefcase,
    ChevronDown,
    Plus,
    Search,
    Printer,
    Clock,
    Filter,
    ArrowUpRight
} from 'lucide-react';

interface TimesheetRecord {
    id: string;
    employee: string;
    project: string;
    task: string;
    date: string;
    hours: number;
    hourlyRate: number;
    status: 'billed' | 'unbilled' | 'pending';
    totalAmount: number;
}

const MOCK_RECORDS: TimesheetRecord[] = [
    {
        id: 'TS-301',
        employee: 'Г.Тулга (Инженер)',
        project: 'Хаус-20 Төсөл',
        task: 'Зураг төсөл боловсруулах',
        date: '2026-02-27',
        hours: 6.5,
        hourlyRate: 25000,
        status: 'unbilled',
        totalAmount: 162500
    },
    {
        id: 'TS-302',
        employee: 'Э.Батболд (Дизйанер)',
        project: 'Оффисын ширээ ST-20',
        task: '3D Моделчлол',
        date: '2026-02-27',
        hours: 4.0,
        hourlyRate: 18000,
        status: 'unbilled',
        totalAmount: 72000
    },
    {
        id: 'TS-303',
        employee: 'Г.Тулга (Инженер)',
        project: 'Хаус-20 Төсөл',
        task: 'Газар дээрх хяналт',
        date: '2026-02-25',
        hours: 8.0,
        hourlyRate: 25000,
        status: 'billed',
        totalAmount: 200000
    }
];

export function TimesheetBillingPage() {
    const [records] = useState<TimesheetRecord[]>(MOCK_RECORDS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Цагийн Нэхэмжлэл"
                    subtitle="Инженерүүд болон мэргэжилтнүүдийн зарцуулсан цагийг бүртгэж, нэхэмжлэх"
                    action={{
                        label: "Цаг бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights */}
                    <div className="col-12 card p-6 bg-surface-2 grid-12 gap-8 border-none">
                        <div className="col-4 flex flex-col gap-2">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Нэхэмжлэгдээгүй нийт</span>
                            <div className="text-3xl font-black text-primary">2,410,500 ₮</div>
                            <div className="text-xs text-muted font-bold flex items-center gap-1">
                                <Clock size={12} /> 124.5 Цаг бүртгэгдсэн
                            </div>
                        </div>
                        <div className="col-4 flex flex-col gap-2">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Энэ сарын нийт</span>
                            <div className="text-3xl font-black text-secondary">8,102,000 ₮</div>
                            <div className="text-xs text-success font-bold flex items-center gap-1">
                                <ArrowUpRight size={12} /> Өмнөх сараас +12%
                            </div>
                        </div>
                        <div className="col-4 flex flex-col gap-2">
                            <span className="text-[10px] text-muted font-black tracking-widest uppercase">Дундаж үнэлгээ (цаг)</span>
                            <div className="text-3xl font-black text-warning">21,400 ₮</div>
                            <div className="text-xs text-muted font-bold flex items-center gap-1">
                                <User size={12} /> 15 Идэвхтэй ажилтан
                            </div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Ажилтан, төсөл, ажил үүргээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сар</button>
                        <button className="btn btn-primary h-10 px-6 font-bold flex items-center gap-2">
                            Нэхэмжлэх үүсгэх <ArrowUpRight size={16} />
                        </button>
                    </div>

                    {/* Records Table */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-surface-3">
                            <h3 className="text-xs font-bold flex items-center gap-2 text-muted tracking-widest uppercase">
                                <Clock size={14} className="text-primary" /> Сүүлийн бүртгэлүүд
                            </h3>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost p-2 opacity-50 hover:opacity-100"><Printer size={16} /></button>
                                <button className="btn btn-ghost p-2 opacity-50 hover:opacity-100"><Plus size={16} /></button>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Ажилтан</th>
                                        <th>Төсөл & Үүрэг</th>
                                        <th>Огноо</th>
                                        <th>Цаг</th>
                                        <th>Мөнгөн Дүн</th>
                                        <th>Төлөв</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(rec => (
                                        <tr key={rec.id} className="hover:bg-surface-3 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-surface-3 h-10 w-10 flex items-center justify-center rounded-xl text-primary font-black">
                                                        {rec.employee.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm">{rec.employee}</div>
                                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{rec.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="font-bold text-sm flex items-center gap-1">
                                                        <Briefcase size={12} className="text-muted" /> {rec.project}
                                                    </div>
                                                    <div className="text-xs text-muted">{rec.task}</div>
                                                </div>
                                            </td>
                                            <td className="text-xs font-bold text-muted uppercase tracking-widest">{rec.date}</td>
                                            <td>
                                                <div className="flex items-center gap-1 font-black">
                                                    <Timer size={14} className="text-primary" /> {rec.hours}ч
                                                </div>
                                                <div className="text-[10px] text-muted">{rec.hourlyRate.toLocaleString()} ₮/цаг</div>
                                            </td>
                                            <td className="font-black text-secondary">
                                                {rec.totalAmount.toLocaleString()} ₮
                                            </td>
                                            <td>
                                                <span className={`badge badge-${rec.status === 'billed' ? 'success' : rec.status === 'unbilled' ? 'warning' : 'outline'} font-black px-3`}>
                                                    {rec.status === 'billed' ? 'Нэхэмжилсэн' :
                                                        rec.status === 'unbilled' ? 'Нэхэмжлээгүй' : 'Хүлээгдэж буй'}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <button className="btn btn-ghost p-2 group hover:bg-primary-light">
                                                    <ChevronDown size={16} className="text-muted group-hover:text-primary transition-colors" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
