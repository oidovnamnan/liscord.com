import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    DoorOpen,
    ClipboardCheck,
    AlertTriangle,
    CheckCircle2,
    Briefcase,
    Settings,
    Search,
    Filter,
    Plus,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

interface OffboardingTask {
    id: string;
    employeeName: string;
    department: string;
    progress: number;
    tasksTotal: number;
    tasksCompleted: number;
    exitDate: string;
    status: 'pending' | 'in_progress' | 'completed';
}

const MOCK_TASKS: OffboardingTask[] = [
    {
        id: 'OFF-001',
        employeeName: 'Батбаяр',
        department: 'Борлуулалт',
        progress: 80,
        tasksTotal: 10,
        tasksCompleted: 8,
        exitDate: '2024-03-31',
        status: 'in_progress'
    },
    {
        id: 'OFF-002',
        employeeName: 'Дөлгөөн',
        department: 'Дизайн',
        progress: 100,
        tasksTotal: 8,
        tasksCompleted: 8,
        exitDate: '2024-03-20',
        status: 'completed'
    },
    {
        id: 'OFF-003',
        employeeName: 'Сүрэн',
        department: 'Маркетинг',
        progress: 0,
        tasksTotal: 12,
        tasksCompleted: 0,
        exitDate: '2024-04-15',
        status: 'pending'
    }
];

export function OffboardingPage() {
    const [tasks] = useState<OffboardingTask[]>(MOCK_TASKS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ажлаас Гарах үйл явц"
                    subtitle="Тойрох хуудас батлах, эд хөрөнгө хүлээлцэх болон эрх хасах ажлууд"
                    action={{
                        label: "Процесс Эхлүүлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Summary */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <DoorOpen size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй Процесс</h4>
                                <div className="text-2xl font-black">2 хүн</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><DoorOpen size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-warning">
                            <ClipboardCheck size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээгдэж Буй Чекист</h4>
                                <div className="text-2xl font-black text-warning">14 Task</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><ClipboardCheck size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <CheckCircle2 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Бүрэн Дууссан</h4>
                                <div className="text-2xl font-black text-success">1 хүн</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Энэ сард</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <AlertTriangle size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-danger" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Эрсдэл</h4>
                                <div className="text-2xl font-black text-danger">Тоног Төхөөрөмж</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Хүлээлгэж өгөөгүй 1 хүн</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger"><AlertTriangle size={24} /></div>
                        </div>
                    </div>

                    {/* Navigation/Filters */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Ажилтны нэрээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Хэлтэс</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center justify-center border-border-color/10"><Settings size={18} /></button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Процесс</button>
                        </div>
                    </div>

                    {/* Offboarding List */}
                    <div className="col-12 card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border-color/10">
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Ажилтан</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Хэлтэс</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Тойрох хуудас</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Төлөв</th>
                                    <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Гарах Огноо</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group cursor-pointer">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="font-black text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                                                    {task.employeeName}
                                                </div>
                                                <div className="text-[10px] text-muted font-bold tracking-widest uppercase flex items-center gap-1 mt-1">
                                                    {task.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-sm font-bold text-muted justify-center gap-1"><Briefcase size={12} /> {task.department}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center gap-4 justify-center">
                                                <div className="w-24 bg-surface-3 h-2 rounded-full overflow-hidden border border-border-color/10">
                                                    <div className={`h-full rounded-full transition-all ${task.progress === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${task.progress}%` }} />
                                                </div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-muted">{task.tasksCompleted}/{task.tasksTotal}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${task.status === 'completed' ? 'bg-success/10 text-success' :
                                                task.status === 'in_progress' ? 'bg-warning/10 text-warning' : 'bg-muted/10 text-muted'
                                                }`}>
                                                {task.status === 'completed' ? 'ДУУССАН' :
                                                    task.status === 'in_progress' ? 'ХИЙГДЭЖ БАЙНА' : 'ХҮЛЭЭГДЭЖ БУЙ'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-end gap-1"><Calendar size={10} /> {task.exitDate}</div>
                                        </td>
                                        <td className="p-4 w-12 text-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="btn btn-ghost h-8 w-8 hover:bg-primary/10 rounded-xl flex items-center justify-center p-0"><ArrowUpRight size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="col-12 mt-2 space-y-4">
                        <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Шаардлагатай арга хэмжээ</h4>
                        <div className="card p-4 bg-surface-1 border border-border-color/10 hover:border-primary/50 shadow-sm flex items-center justify-between cursor-pointer transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white transition-all"><AlertTriangle size={20} /></div>
                                <div>
                                    <div className="text-sm font-black">Батбаяр: Үндсэн Хөрөнгө хүлээлгэж өгөөгүй</div>
                                    <div className="text-[10px] text-muted font-bold tracking-widest uppercase flex items-center gap-1"><Briefcase size={10} /> MacBook Pro M1 14" • Зөрчил</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost h-8 px-4 text-[10px] font-black">САНУУЛАХ</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
