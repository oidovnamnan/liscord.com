import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Video,
    Mic,
    VideoOff,
    Monitor,
    PhoneOff,
    Users,
    Hand,
    MessageSquare,
    Settings,
    MoreVertical,
    Plus,
    Calendar,
    ArrowRight,
    Play,
    Share2,
    Lock,
    Filter,
    Clock
} from 'lucide-react';

interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string;
    attendees: number;
    host: string;
    status: 'upcoming' | 'ongoing' | 'recorded';
}

const MOCK_MEETINGS: Meeting[] = [
    {
        id: 'ME-001',
        title: 'Урамшуулалт олгох хүсэлт - 2026 Q1',
        startTime: '10:00',
        endTime: '11:00',
        date: '2026-02-27',
        attendees: 5,
        host: 'Э.Батболд',
        status: 'ongoing'
    },
    {
        id: 'ME-002',
        title: 'Зайсан төслийн явц хянах',
        startTime: '14:00',
        endTime: '15:00',
        date: '2026-02-27',
        attendees: 12,
        host: 'Г.Тулга',
        status: 'upcoming'
    },
    {
        id: 'ME-003',
        title: 'Шинэ ажилтан авах ярилцлага',
        startTime: '09:00',
        endTime: '10:00',
        date: '2026-02-25',
        attendees: 3,
        host: 'С.Баяр',
        status: 'recorded'
    }
];

export function VideoMeetingsPage() {
    const [meetings] = useState<Meeting[]>(MOCK_MEETINGS);
    const [inMeeting] = useState(false);

    if (inMeeting) {
        return (
            <div className="bg-surface-3 fixed inset-0 z-50 flex flex-col p-6 gap-6">
                <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-6 items-center">
                    {/* Simplified Video Grid Placeholder */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-surface-1 h-full w-full rounded-3xl border-2 border-border-color/10 relative overflow-hidden group">
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-primary opacity-20">LISC{i}</div>
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">Хэрэглэгч {i + 1}</div>
                        </div>
                    ))}
                    <div className="bg-surface-2 h-full w-full rounded-3xl border-2 border-primary/50 relative overflow-hidden group shadow-2xl flex items-center justify-center">
                        <span className="text-primary font-black animate-pulse">БИ (SELF)</span>
                        <div className="absolute bottom-4 left-4 bg-primary px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">ТАНЫ ДҮРС</div>
                    </div>
                </div>

                <div className="h-24 bg-surface-1 rounded-3xl border border-border-color/10 flex items-center justify-between px-12 shadow-2xl">
                    <div className="flex gap-4">
                        <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-primary-light transition-all"><Users size={24} /></button>
                        <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-primary-light transition-all"><MessageSquare size={24} /></button>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn btn-secondary p-5 rounded-full shadow-lg hover:scale-105 transition-transform"><Mic size={28} /></button>
                        <button className="btn btn-secondary p-5 rounded-full shadow-lg hover:scale-105 transition-transform"><Video size={28} /></button>
                        <button className="btn btn-ghost p-5 rounded-full bg-surface-3 hover:bg-primary-light transition-all"><Monitor size={28} /></button>
                        <button className="btn btn-danger p-5 rounded-full shadow-xl hover:scale-110 transition-transform"><PhoneOff size={28} /></button>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-primary-light transition-all"><Hand size={24} /></button>
                        <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-primary-light transition-all"><Settings size={24} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Видео Хурал (Liscord Meet)"
                    subtitle="Дотоод видео дуудлага, дэлгэц хуваалцах, онлайн хурал зохион байгуулах"
                    action={{
                        label: "Шинэ хурал эхлүүлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Video App Entry */}
                    <div className="col-12 card p-8 bg-gradient-to-r from-surface-2 to-surface-3 border-none flex items-center justify-between gap-12 overflow-hidden relative shadow-md">
                        <div className="flex-1 relative z-10">
                            <h2 className="text-3xl font-black mb-4">Шууд холбогдох боломжтой...</h2>
                            <p className="text-muted text-sm mb-8 max-w-lg leading-relaxed">Таны төлөвлөгөөт 12 хурал энэ сард байна. Одоогийн байдлаар нэг хурал үргэлжилж байна.</p>
                            <div className="flex gap-4">
                                <button className="btn btn-primary h-14 px-10 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                                    <Video size={24} /> ХУРАЛ ЭХЛҮҮЛЭХ
                                </button>
                                <button className="btn btn-outline h-14 px-10 font-black rounded-2xl border-primary text-primary hover:bg-primary-light transition-all">
                                    <Plus size={24} /> КОДООР ОРОХ
                                </button>
                            </div>
                        </div>
                        <div className="w-[450px] aspect-video bg-black rounded-3xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/40 transition-all cursor-pointer flex items-center justify-center">
                                <div className="bg-white p-6 rounded-full shadow-2xl group-hover:scale-110 transition-transform"><Video size={48} className="text-primary" /></div>
                                <div className="absolute bottom-6 left-6 text-white text-[10px] font-black uppercase tracking-widest bg-black/20 backdrop-blur-md px-4 py-1 rounded-full">КАМЕР ШАЛГАХ</div>
                            </div>
                            <VideoOff size={128} className="absolute -right-8 -bottom-8 opacity-5 text-white" />
                        </div>
                    </div>

                    <div className="col-12 grid grid-cols-2 gap-6 mt-4">
                        {/* Upcoming / Ongoing List */}
                        <div className="card p-0 overflow-hidden shadow-sm border-none bg-surface-1">
                            <div className="p-5 border-b border-border-color/10 bg-surface-2 flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">ТӨЛӨВЛӨГӨӨТ ХУРАЛУУД</h3>
                                <button className="btn btn-ghost p-1"><Filter size={16} /></button>
                            </div>
                            <div className="p-2 flex flex-col gap-2">
                                {meetings.filter(m => m.status !== 'recorded').map(m => (
                                    <div key={m.id} className="p-4 rounded-2xl hover:bg-surface-2 transition-all group cursor-pointer border border-border-color/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black shadow-inner ${m.status === 'ongoing' ? 'bg-primary text-white animate-pulse' : 'bg-surface-3 text-muted'}`}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{m.title}</h4>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                        <Clock size={10} /> {m.startTime} - {m.endTime} • {m.date}
                                                    </p>
                                                </div>
                                            </div>
                                            {m.status === 'ongoing' ? (
                                                <button className="btn btn-primary btn-sm px-6 font-black rounded-xl shadow-lg flex items-center gap-2 bg-success border-none">
                                                    ОРОХ <ArrowRight size={14} />
                                                </button>
                                            ) : (
                                                <button className="btn btn-ghost btn-sm p-3 rounded-xl bg-surface-3 border border-border-color/10"><MoreVertical size={16} /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Recordings */}
                        <div className="card p-0 overflow-hidden shadow-sm border-none bg-surface-1">
                            <div className="p-5 border-b border-border-color/10 bg-surface-2 flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">БИЧЛЭГҮҮД</h3>
                                <button className="btn btn-ghost p-1"><Video size={16} /></button>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                {meetings.filter(m => m.status === 'recorded').map(m => (
                                    <div key={m.id} className="flex items-center gap-6 p-4 bg-surface-2 rounded-2xl border border-border-color/10 hover-lift shadow-sm relative group overflow-hidden">
                                        <div className="w-24 aspect-video bg-black rounded-xl flex items-center justify-center text-white relative">
                                            <Play size={24} className="fill-current group-hover:scale-125 transition-all text-primary" />
                                            <div className="absolute top-1 right-1 bg-black/50 text-[8px] font-bold px-1 rounded">45:10</div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-1">{m.title}</h4>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-widest">
                                                <span>{m.date}</span>
                                                <span className="flex items-center gap-1"><Users size={12} /> {m.attendees}</span>
                                            </div>
                                        </div>
                                        <div className="icon-wrap p-2 text-muted group-hover:text-primary transition-colors">
                                            <Share2 size={16} />
                                        </div>
                                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Lock size={12} className="text-muted" />
                                        </div>
                                    </div>
                                ))}
                                <div className="card p-4 border-dashed border-2 bg-surface-2 flex items-center justify-center text-center group cursor-pointer hover:border-primary transition-all rounded-2xl">
                                    <p className="text-[10px] font-black text-muted group-hover:text-primary transition-colors uppercase tracking-widest">БҮХ БИЧЛЭГ ҮЗЭХ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
