import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { 
    Plus, 
    ChevronLeft, 
    ChevronRight, 
    Bell, 
    Settings, 
    CheckCircle2
} from 'lucide-react';

interface Event {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string;
    type: 'meeting' | 'task' | 'project' | 'personal';
    location?: string;
    attendees?: string[];
}

const MOCK_EVENTS: Event[] = [
    {
        id: 'EV-001',
        title: 'Урамшуулалт олгох хүсэлт - 2026 Q1',
        startTime: '10:00',
        endTime: '11:30',
        date: '2026-02-27',
        type: 'meeting',
        location: 'Zoom Meeting',
        attendees: ['Э.Батболд', 'Г.Тулга']
    },
    {
        id: 'EV-002',
        title: 'Зайсан төслийн явц хянах',
        startTime: '14:00',
        endTime: '16:00',
        date: '2026-02-27',
        type: 'project',
        location: 'Зайсан талбай #12',
        attendees: ['Д.Тэмүүлэн']
    },
    {
        id: 'EV-003',
        title: 'Шинэ ажилтан авах ярилцлага',
        startTime: '09:00',
        endTime: '10:00',
        date: '2026-02-25',
        type: 'personal',
        location: 'Оффис 302'
    }
];

export function CalendarPage() {
    const [events] = useState<Event[]>(MOCK_EVENTS);
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                <Header
                    title="Хуанли (Calendar)"
                    subtitle="Ажилтнуудын уулзалт, төслийн хугацаа болон байгууллагын үйл ажиллагаа төлөвлөх"
                    action={{
                        label: "Үйл ажиллагаа нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6 flex-1 overflow-hidden">
                    {/* Calendar Sidebar */}
                    <div className="col-3 flex flex-col gap-6 overflow-hidden">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Бяцхан Хуанли</h3>
                                <div className="flex gap-1">
                                    <button className="btn btn-ghost p-1"><ChevronLeft size={16} /></button>
                                    <button className="btn btn-ghost p-1"><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-muted uppercase tracking-widest mb-4">
                                <span>Н</span><span>Д</span><span>М</span><span>Л</span><span>П</span><span>Б</span><span>Ш</span>
                            </div>
                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
                                {Array.from({ length: 31 }).map((_, i) => (
                                    <div key={i} className={`p-2 rounded-xl cursor-pointer transition-all hover:bg-primary hover:text-white ${i === 26 ? 'bg-primary text-white shadow-lg scale-110' : 'bg-surface-3'}`}>
                                        {i + 1}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 h-px bg-border-color/10 mb-6" />

                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Төрөл</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 bg-primary rounded-full" />
                                    <span className="text-xs font-bold text-muted">Уулзалт</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 bg-secondary rounded-full" />
                                    <span className="text-xs font-bold text-muted">Төсөл</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 bg-warning rounded-full" />
                                    <span className="text-xs font-bold text-muted">Хувийн</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 bg-success rounded-full" />
                                    <span className="text-xs font-bold text-muted">Ажил</span>
                                </div>
                            </div>

                            <div className="mt-12 p-4 bg-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center text-center group cursor-pointer hover:scale-105 transition-transform">
                                <Plus size={32} className="mb-2" />
                                <h4 className="font-black text-sm">Шинэ арга хэмжээ</h4>
                            </div>
                        </div>
                    </div>

                    {/* Main Calendar View */}
                    <div className="col-9 card p-0 overflow-hidden flex flex-col shadow-2xl border-none bg-surface-1">
                        <div className="p-4 border-b border-border-color/10 bg-surface-2 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <h3 className="text-2xl font-black">2026 ОНЫ 2-Р САР</h3>
                                <div className="flex bg-surface-3 rounded-xl p-1 border border-border-color/10 shadow-inner">
                                    <button
                                        onClick={() => setView('month')}
                                        className={`px-4 py-2 font-black text-[10px] rounded-lg transition-all ${view === 'month' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                                    >САР</button>
                                    <button
                                        onClick={() => setView('week')}
                                        className={`px-4 py-2 font-black text-[10px] rounded-lg transition-all ${view === 'week' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                                    >ДОЛОО ХОНОГ</button>
                                    <button
                                        onClick={() => setView('day')}
                                        className={`px-4 py-2 font-black text-[10px] rounded-lg transition-all ${view === 'day' ? 'bg-surface-1 text-primary shadow-sm' : 'text-muted'}`}
                                    >ӨДӨР</button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost p-3 bg-surface-3 border border-border-color/10 rounded-xl"><Bell size={18} /></button>
                                <button className="btn btn-ghost p-3 bg-surface-3 border border-border-color/10 rounded-xl"><Settings size={18} /></button>
                            </div>
                        </div>

                        {/* Month Grid */}
                        <div className="flex-1 overflow-y-auto grid-12 h-full bg-gradient-to-br from-surface-1 to-surface-2">
                            {/* Days Header */}
                            <div className="col-12 grid grid-cols-7 border-b border-border-color/10 h-10 divide-x divide-border-color/5 bg-surface-3">
                                {['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'].map(day => (
                                    <div key={day} className="flex-center text-[10px] font-black text-muted uppercase tracking-widest">{day}</div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="col-12 grid grid-cols-7 flex-1 divide-x divide-y divide-border-color/5 h-full overflow-hidden">
                                {Array.from({ length: 31 }).map((_, i) => (
                                    <div key={i} className="min-h-[140px] p-2 hover:bg-surface-3 transition-all relative group cursor-pointer overflow-visible">
                                        <div className={`p-2 h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${i === 26 ? 'bg-primary text-white shadow-lg' : 'text-muted'}`}>
                                            {i + 1}
                                        </div>

                                        {/* Render Events */}
                                        <div className="flex flex-col gap-1 mt-2">
                                            {events.filter(e => parseInt(e.date.split('-')[2]) === i + 1).map(ev => (
                                                <div key={ev.id} className={`p-2 rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 transition-all hover:scale-[1.05] z-10 ${ev.type === 'meeting' ? 'bg-primary text-white shadow-primary/20' :
                                                        ev.type === 'project' ? 'bg-secondary text-white shadow-secondary/20' :
                                                            'bg-warning text-white shadow-warning/20'
                                                    }`}>
                                                    <div className="h-1.5 w-1.5 bg-white rounded-full flex-shrink-0" />
                                                    <span className="truncate">{ev.title}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="btn btn-ghost p-1 rounded-lg text-primary"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Day / Detail View (Optional sidebar or overlay) - Handled through interactivity */}
                        <div className="p-4 bg-surface-2 border-t border-border-color/10 flex justify-between items-center shadow-inner">
                            <div className="flex gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-2xl text-primary font-black shadow-sm">12</div>
                                    <div className="text-xs font-bold text-muted tracking-tight">Өнөөдрийн нийт арга хэмжээ</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center bg-success/10 rounded-2xl text-success font-black shadow-sm"><CheckCircle2 size={24} /></div>
                                    <div className="text-xs font-bold text-muted tracking-tight">Дууссан ажилбарууд</div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex -space-x-3">
                                    <div className="h-10 w-10 bg-surface-3 rounded-full border-2 border-white flex items-center justify-center font-black text-xs shadow-sm">Б</div>
                                    <div className="h-10 w-10 bg-primary rounded-full border-2 border-white flex items-center justify-center font-black text-xs text-white shadow-sm">Т</div>
                                    <div className="h-10 w-10 bg-secondary rounded-full border-2 border-white flex items-center justify-center font-black text-xs text-white shadow-sm">+8</div>
                                </div>
                                <button className="btn btn-outline h-10 px-6 font-black rounded-xl">Тайлан Гаргах</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .grid-cols-7 {
                    display: grid;
                    grid-template-columns: repeat(7, minmax(0, 1fr));
                }
                .flex-center {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </HubLayout>
    );
}
