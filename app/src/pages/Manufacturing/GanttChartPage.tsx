import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Calendar,
    Clock,
    Filter,
    Plus,
    PlayCircle,
    ArrowRightCircle,
    Layers,
    Search
} from 'lucide-react';

interface Task {
    id: string;
    title: string;
    start: string;
    duration: number;
    progress: number;
    color: string;
    dependencies: string[];
}

const MOCK_TASKS: Task[] = [
    {
        id: 'T-01',
        title: 'Төслийн бэлтгэл',
        start: '2026-03-01',
        duration: 5,
        progress: 100,
        color: 'var(--success-color)',
        dependencies: []
    },
    {
        id: 'T-02',
        title: 'Материал захиалах',
        start: '2026-03-03',
        duration: 7,
        progress: 35,
        color: 'var(--primary)',
        dependencies: ['T-01']
    },
    {
        id: 'T-03',
        title: 'Угсралтын ажил',
        start: '2026-03-08',
        duration: 10,
        progress: 0,
        color: 'var(--warning-color)',
        dependencies: ['T-02']
    }
];

export function GanttChartPage() {
    const [tasks] = useState<Task[]>(MOCK_TASKS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <Header
                    title="Гантт Диаграм (Gantt)"
                    subtitle="Төслийн цаг хуваарийг Гантт диаграмаар хянаж, олон ажил хоорондын уялдааг харах"
                    action={{
                        label: "Бүтэн дэлгэц",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6 flex-1 overflow-hidden">
                    {/* Controls Bar */}
                    <div className="col-12 card p-4 flex justify-between items-center bg-surface-2 border-none">
                        <div className="flex gap-4 items-center">
                            <div className="flex bg-surface-3 rounded-xl p-1 border border-border-color/10">
                                <button className="btn btn-ghost px-4 py-2 font-bold text-xs rounded-lg bg-surface-1">ӨДӨР</button>
                                <button className="btn btn-ghost px-4 py-2 font-bold text-xs rounded-lg">ДОЛОО ХОНОГ</button>
                                <button className="btn btn-ghost px-4 py-2 font-bold text-xs rounded-lg">САР</button>
                            </div>
                            <div className="h-6 w-px bg-border-color/10 mx-2" />
                            <span className="text-sm font-black flex items-center gap-2">
                                <Calendar size={16} /> 2026-03-01 - 2026-03-31
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                <input className="input pl-9 h-9 w-48 text-xs font-bold" placeholder="Ажил хайх..." />
                            </div>
                            <button className="btn btn-outline h-9 px-3 rounded-lg"><Filter size={14} /></button>
                        </div>
                    </div>

                    {/* Gantt Area */}
                    <div className="col-12 card p-0 overflow-hidden flex flex-1 shadow-2xl border-none">
                        {/* Sidebar (Task List) */}
                        <div className="w-[320px] bg-surface-2 border-r border-border-color/10 flex flex-col">
                            <div className="p-4 border-b border-border-color/10 bg-surface-3 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Ажил үүрэг</h3>
                                <button className="btn btn-ghost p-1"><Plus size={14} /></button>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {tasks.map(t => (
                                    <div key={t.id} className="p-4 border-b border-border-color/10 hover:bg-surface-3 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-black">{t.id}</span>
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                        </div>
                                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{t.title}</h4>
                                        <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-muted">
                                            <span className="flex items-center gap-1 uppercase tracking-widest"><Clock size={10} /> {t.duration} ХОНОГ</span>
                                            <span className="bg-surface-1 py-1 px-2 rounded-md transition-all group-hover:bg-primary group-hover:text-white">{t.progress}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1 bg-surface-1 relative overflow-x-auto overflow-y-hidden">
                            {/* Gantt Grid Header */}
                            <div className="grid grid-cols-31 border-b border-border-color/10 h-10 divide-x divide-border-color/10 bg-surface-2">
                                {Array.from({ length: 31 }).map((_, i) => (
                                    <div key={i} className="flex-center text-[10px] font-black text-muted">{i + 1}</div>
                                ))}
                            </div>

                            {/* Gantt Grid Body */}
                            <div className="relative group/grid" style={{ height: '100%', backgroundSize: 'calc(100% / 31) 100%', backgroundImage: 'linear-gradient(90deg, var(--border-color) 0px, transparent 1px)' }}>
                                {tasks.map((t, idx) => (
                                    <div key={t.id} className="relative h-20 border-b border-border-color/5 group/row hover:bg-surface-3 transition-colors">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full shadow-lg p-1 group/bar cursor-pointer hover:h-10 transition-all"
                                            style={{
                                                left: `calc(${idx * 2 + 1} * (100% / 31))`,
                                                width: `calc(${t.duration} * (100% / 31))`,
                                                backgroundColor: t.color + '22',
                                                border: `2px solid ${t.color}`
                                            }}
                                        >
                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${t.progress}%`, backgroundColor: t.color }}>
                                                <div className="h-full flex items-center justify-end px-3">
                                                    <span className="text-[10px] font-black text-white mix-contrast opacity-0 group-hover/bar:opacity-100">{t.progress}%</span>
                                                </div>
                                            </div>
                                            {/* Tooltip-like Info */}
                                            <div className="absolute top-[100%] left-0 bg-surface-1 p-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity z-50 border border-border-color/10 mt-2 min-w-[150px]">
                                                <div className="font-bold text-xs border-b border-border-color/5 pb-1 mb-1">{t.title}</div>
                                                <div className="text-[10px] text-muted font-bold flex justify-between">
                                                    <span>START: {t.start}</span>
                                                    <span>DUR: {t.duration}d</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Today Line */}
                                <div className="absolute top-0 bottom-0 w-px bg-primary z-10 animate-fade-in" style={{ left: 'calc(15 * (100% / 31))' }}>
                                    <div className="absolute -top-3 -translate-x-1/2 bg-primary text-white text-[8px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">ӨНӨӨДӨР</div>
                                    <div className="h-full w-[10px] -translate-x-1/2 bg-primary/5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info Hub */}
                    <div className="col-12 card p-6 bg-surface-2 grid-12 gap-4 border-none shadow-md">
                        <div className="col-3 flex flex-col gap-2 border-r border-border-color/10">
                            <div className="flex items-center gap-2 text-primary font-bold"><PlayCircle size={16} /> БОДИТ УРСГАЛ</div>
                            <div className="text-xl font-black">8 Ажил идэвхтэй</div>
                        </div>
                        <div className="col-3 flex flex-col gap-2 border-r border-border-color/10">
                            <div className="flex items-center gap-2 text-warning font-bold"><Clock size={16} /> СААТАЛ</div>
                            <div className="text-xl font-black">2 Ажил хоцролттой</div>
                        </div>
                        <div className="col-3 flex flex-col gap-2 border-r border-border-color/10">
                            <div className="flex items-center gap-2 text-success font-bold"><ArrowRightCircle size={16} /> ГҮЙЦЭТГЭЛ</div>
                            <div className="text-xl font-black">74.2% Бүтээмж</div>
                        </div>
                        <div className="col-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-muted font-bold"><Layers size={16} /> ХҮЧИН ЧАДАЛ</div>
                            <div className="text-xl font-black">12 Хүн оноосон</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .grid-cols-31 {
                    display: grid;
                    grid-template-columns: repeat(31, minmax(0, 1fr));
                }
                .flex-center {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mix-contrast {
                    filter: contrast(150%) brightness(150%);
                }
            `}</style>
        </HubLayout>
    );
}
