import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Calendar as CalendarIcon,
    Clock,
    Users,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    Copy,
    Search,
    Plus,
    BarChart3,
    TrendingUp,
    Settings,
    MoreHorizontal
} from 'lucide-react';

interface Shift {
    id: string;
    employeeName: string;
    role: string;
    date: string;
    shiftType: 'morning' | 'afternoon' | 'night' | 'day-off';
    status: 'scheduled' | 'attended' | 'missed';
    hours: number;
}

const MOCK_SHIFTS: Shift[] = [
    {
        id: 'SH-001',
        employeeName: 'Бат-Эрдэнэ',
        role: 'Ахлах кассчин',
        date: '2024-03-22',
        shiftType: 'morning',
        status: 'attended',
        hours: 8
    },
    {
        id: 'SH-002',
        employeeName: 'Саруул',
        role: 'Менежер',
        date: '2024-03-22',
        shiftType: 'night',
        status: 'scheduled',
        hours: 12
    },
    {
        id: 'SH-003',
        employeeName: 'Гэрэлээ',
        role: 'Худалдагч',
        date: '2024-03-22',
        shiftType: 'day-off',
        status: 'scheduled',
        hours: 0
    }
];

export function ShiftsPage() {
    const [shifts] = useState<Shift[]>(MOCK_SHIFTS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ээлжийн Хуваарь"
                    subtitle="24/7 ажиллах хүчний хуваарилалт, илтгэлцүүр тооцоолох ба цагийн менежмент"
                    action={{
                        label: "Автомат Хуваарь",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Top Stats */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Users size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Ээлжийн Ажилтан</h4>
                                <div className="text-2xl font-black">42 хүн</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Users size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <Clock size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Өнөөдрийн Хуваарь</h4>
                                <div className="text-2xl font-black text-success">100%</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Асуудалгүй</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-warning">
                            <AlertCircle size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөрчилтэй Хуваарь</h4>
                                <div className="text-2xl font-black text-warning">2 хүн</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Давхардсан/Хоосон</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><AlertCircle size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <TrendingUp size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Илүү Цаг (Сард)</h4>
                                <div className="text-2xl font-black text-danger">124 цаг</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger"><BarChart3 size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Ажилтны нэр, албан тушаалаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Settings size={18} /></button>
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><CalendarIcon size={18} /> 03/22 - 03/28</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Copy size={18} /> Хувилах</button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Нэмэх</button>
                        </div>
                    </div>

                    {/* Weekly Timeline view placeholder */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <div className="grid grid-cols-8 border-b border-border-color/10 bg-surface-2 text-[10px] font-black uppercase tracking-widest text-muted">
                            <div className="p-4 border-r border-border-color/5">Ажилтан</div>
                            <div className="p-4 border-r border-border-color/5 text-center">Дав (21)</div>
                            <div className="p-4 border-r border-border-color/5 text-center bg-primary/5 text-primary">Мяг (22)</div>
                            <div className="p-4 border-r border-border-color/5 text-center">Лха (23)</div>
                            <div className="p-4 border-r border-border-color/5 text-center">Пүр (24)</div>
                            <div className="p-4 border-r border-border-color/5 text-center">Баа (25)</div>
                            <div className="p-4 border-r border-border-color/5 text-center text-danger">Бям (26)</div>
                            <div className="p-4 text-center text-danger">Ням (27)</div>
                        </div>

                        {shifts.map(shift => (
                            <div key={shift.id} className="grid grid-cols-8 border-b border-border-color/5 hover:bg-surface-2 transition-colors">
                                <div className="p-4 border-r border-border-color/5 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-primary"><UserCircle size={18} /></div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm">{shift.employeeName}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{shift.role}</span>
                                    </div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-warning bg-warning/10 p-2 rounded uppercase tracking-widest">16:00 - 00:00</div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center bg-primary/5">
                                    <div className="w-full text-center text-[10px] font-black text-success bg-success/10 p-2 rounded uppercase tracking-widest border border-success/20">08:00 - 16:00</div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-success bg-success/10 p-2 rounded uppercase tracking-widest">08:00 - 16:00</div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-muted bg-surface-3 p-2 rounded uppercase tracking-widest">OFF</div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-primary bg-primary/10 p-2 rounded uppercase tracking-widest">16:00 - 00:00</div>
                                </div>
                                <div className="p-2 border-r border-border-color/5 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-danger bg-danger/10 p-2 rounded uppercase tracking-widest border border-danger/20 hover:scale-105 cursor-pointer shadow-sm">00:00 - 08:00</div>
                                </div>
                                <div className="p-2 flex items-center justify-center">
                                    <div className="w-full text-center text-[10px] font-black text-muted bg-surface-3 p-2 rounded uppercase tracking-widest">OFF</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="col-12 mt-2 flex justify-end">
                        <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1">Дэлгэрэнгүй тайлан <MoreHorizontal size={14} /></button>
                    </div>

                </div>
            </div>
        </HubLayout>
    );
}
