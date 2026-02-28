import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Flag,
    Search,
    CheckCircle2,
    History,
    Zap,
    Share2,
    Database,
    Target,
    Calendar,
    ChevronRight,
    Trophy,
    AlertCircle,
    Play,
    User
} from 'lucide-react';

interface Milestone {
    id: string;
    name: string;
    project: string;
    status: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
    dueDate: string;
    progress: number;
}

const MOCK_MILESTONES: Milestone[] = [
    {
        id: 'MS-501',
        name: 'Prototype Completion',
        project: 'Smart Liscord Box V2',
        status: 'completed',
        dueDate: '2026-02-20',
        progress: 100
    },
    {
        id: 'MS-502',
        name: 'Main Production Run',
        project: 'Smart Liscord Box V2',
        status: 'in-progress',
        dueDate: '2026-03-15',
        progress: 65
    },
    {
        id: 'MS-503',
        name: 'Regional Rollout',
        project: 'Smart Liscord Box V2',
        status: 'upcoming',
        dueDate: '2026-04-01',
        progress: 0
    }
];

export function MilestonesPage() {
    const [milestones] = useState<Milestone[]>(MOCK_MILESTONES);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Төслийн Үе Шатууд (Milestones)"
                    subtitle="Томоохон төслийн явц, чухал үе шатууд болон гүйцэтгэлийн хяналт"
                    action={{
                        label: "Үе шат нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт үе шат</h4>
                                <div className="text-3xl font-black text-primary">12</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Flag size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дууссан</h4>
                                <div className="text-3xl font-black text-success">8</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хоцорсон</h4>
                                <div className="text-3xl font-black text-danger">1</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Progress Score</h4>
                                <div className="text-xl font-black">78% Overall</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Target size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Үе шат, төслийн нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх Төсөл</button>
                    </div>

                    {/* Timeline Tracker Layout */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {milestones.map(ms => (
                            <div key={ms.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${ms.status === 'completed' ? 'text-success' :
                                            ms.status === 'in-progress' ? 'text-warning' :
                                                ms.status === 'delayed' ? 'text-danger' : 'text-primary'
                                        }`}>
                                        <div className="h-14 w-14 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner rotate-3 group-hover:rotate-0 transition-all">
                                            {ms.status === 'completed' ? <CheckCircle2 size={24} /> :
                                                ms.status === 'in-progress' ? <Play size={24} /> :
                                                    ms.status === 'delayed' ? <AlertCircle size={24} /> : <History size={24} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{ms.status}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <Database size={10} /> {ms.project}
                                                </div>
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{ms.name}</h3>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary lowercase"><User size={12} /> OWNER</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {ms.dueDate} ДУУСАХ</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <div className="flex flex-col gap-2 min-w-[150px]">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-muted text-[8px]">ГҮЙЦЭТГЭЛ</span>
                                                    <span className="text-primary">{ms.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                                    <div className={`h-full rounded-full transition-all duration-1000 bg-primary`} style={{ width: `${ms.progress}%` }} />
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline / Roadmap Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Roadmap Visualization</h3>
                                <p className="text-sm text-muted">Бүх төслийн үе шатыг хугацааны дарааллаар (Gantt chart) харах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ГАНТТ ЧАРТ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
