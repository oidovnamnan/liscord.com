import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CheckSquare,
    Search,
    Plus,
    MoreVertical,
    Clock,
    User,
    Filter,
    Grid,
    List,
    Calendar,
    ChevronRight,
    Play,
    Timer
} from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'backlog' | 'in-progress' | 'review' | 'done';
    assignee: string;
    dueDate: string;
}

const MOCK_TASKS: Task[] = [
    {
        id: 'TSK-101',
        title: 'Мод боловсруулах (Нарс)',
        description: 'Хаус-20 төслийн фасадын моднуудыг 5мм-ийн нарийвчлалтай зүсэх.',
        priority: 'high',
        status: 'in-progress',
        assignee: 'Э.Батболд',
        dueDate: '2026-02-28'
    },
    {
        id: 'TSK-102',
        title: 'Нугас угсралт',
        description: 'Төмөр хаалганы нугасуудыг гагнах болон цэвэрлэх.',
        priority: 'medium',
        status: 'backlog',
        assignee: 'Г.Тулга',
        dueDate: '2026-03-02'
    },
    {
        id: 'TSK-103',
        title: 'Бүрхүүл будалт',
        description: 'Эхний ээлжийн тавилгуудыг эко-лакаар бүрэх.',
        priority: 'low',
        status: 'review',
        assignee: 'Д.Тэмүүлэн',
        dueDate: '2026-03-01'
    }
];

export function TasksPage() {
    const [tasks] = useState<Task[]>(MOCK_TASKS);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ажил Үүрэг (Tasks)"
                    subtitle="Үйлдвэрлэлийн өдөр тутмын даалгавар, гүйцэтгэл болон багийн хяналт"
                    action={{
                        label: "Даалгавар нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Toolbar */}
                    <div className="col-12 flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Даалгавар хайх..." />
                        </div>
                        <div className="flex bg-surface-2 p-1 rounded-xl border border-border-color/10 shadow-inner">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    {/* Kanban Board Layout */}
                    {viewMode === 'kanban' ? (
                        <div className="col-12 grid grid-cols-4 gap-6">
                            {['backlog', 'in-progress', 'review', 'done'].map(status => (
                                <div key={status} className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${status === 'backlog' ? 'bg-muted' :
                                                    status === 'in-progress' ? 'bg-primary' :
                                                        status === 'review' ? 'bg-warning' : 'bg-success'
                                                }`} />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">
                                                {status.replace('-', ' ')} ({tasks.filter(t => t.status === status).length})
                                            </h3>
                                        </div>
                                        <button className="btn btn-ghost p-1 text-muted"><Plus size={14} /></button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {tasks.filter(t => t.status === status).map(task => (
                                            <div key={task.id} className="card p-5 bg-surface-1 hover-lift shadow-sm border-none flex flex-col gap-4 group">
                                                <div className="flex justify-between items-start">
                                                    <span className={`badge badge-outline text-[8px] font-black uppercase tracking-tighter ${task.priority === 'high' ? 'text-danger border-danger/20' :
                                                            task.priority === 'medium' ? 'text-warning border-warning/20' : 'text-primary border-primary/20'
                                                        }`}>
                                                        {task.priority === 'high' ? 'ЯАРАЛТАЙ' : task.priority === 'medium' ? 'ЭНГИЙН' : 'БАГА'}
                                                    </span>
                                                    <button className="btn btn-ghost p-1 opacity-10 group-hover:opacity-100 transition-opacity"><MoreVertical size={14} /></button>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black leading-snug group-hover:text-primary transition-colors cursor-pointer">{task.title}</h4>
                                                    <p className="text-[10px] text-muted font-bold mt-1 line-clamp-2">{task.description}</p>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-border-color/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-black text-primary border border-border-color/10">
                                                            {task.assignee.substring(0, 1)}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted">{task.assignee}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
                                                        <Calendar size={10} /> {task.dueDate.split('-').slice(1).join('/')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="col-12 card p-0 overflow-hidden shadow-sm">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Даалгавар</th>
                                        <th>Төлөв</th>
                                        <th>Хариуцагч</th>
                                        <th>Хугацаа</th>
                                        <th>Эрэмбэ</th>
                                        <th className="text-right">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(task => (
                                        <tr key={task.id} className="hover:bg-surface-2 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-surface-3 p-2 rounded-xl text-primary"><CheckSquare size={16} /></div>
                                                    <div className="font-bold text-sm">{task.title}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${task.status === 'in-progress' ? 'primary' :
                                                        task.status === 'review' ? 'warning' :
                                                            task.status === 'done' ? 'success' : 'outline'
                                                    } font-black uppercase text-[8px]`}>
                                                    {task.status.replace('-', ' ')}
                                                </span>
                                            </td>
                                            <td><div className="flex items-center gap-1 text-xs font-bold text-muted"><User size={12} /> {task.assignee}</div></td>
                                            <td><div className="flex items-center gap-1 text-xs font-bold text-muted"><Clock size={12} /> {task.dueDate}</div></td>
                                            <td>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'text-danger' :
                                                        task.priority === 'medium' ? 'text-warning' : 'text-primary'
                                                    }`}>
                                                    {task.priority}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button className="btn btn-ghost p-2"><ChevronRight size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Active Session Overlay (Bottom Bar) */}
                    <div className="col-12 mt-6 card p-4 bg-gradient-to-r from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md animate-pulse"><Timer size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black mb-1">Одоо ажиллаж буй: Мод боловсруулах</h3>
                                <p className="text-sm opacity-80 flex items-center gap-2">
                                    <Clock size={14} /> 01:45:22 зарцуулсан • Бат (Admin)
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-2xl border border-white/20">ЗОГСООХ</button>
                            <button className="btn bg-white text-primary font-black px-12 py-3 rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"><Play size={18} /> ДУУСГАХ</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
