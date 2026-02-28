import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    MonitorSmartphone,
    MousePointer2,
    Keyboard,
    Activity,
    Video,
    Clock,
    Camera,
    AlertCircle,
    Search,
    Filter,
    Settings,
    UserCircle,
    MapPin,
    Eye
} from 'lucide-react';

interface RemoteWorker {
    id: string;
    employeeName: string;
    role: string;
    location: string;
    activityScore: number;
    currentTime: string;
    status: 'active' | 'idle' | 'offline';
    lastScreenshot: string; // URL mock
}

const MOCK_WORKERS: RemoteWorker[] = [
    {
        id: 'RW-001',
        employeeName: 'Хулан',
        role: 'Вэб Дизайнер',
        location: 'Гэрээсээ (Cloud)',
        activityScore: 84,
        currentTime: '4ц 12м',
        status: 'active',
        lastScreenshot: 'Figma - Liscord Design'
    },
    {
        id: 'RW-002',
        employeeName: 'Дэмбэрэл',
        role: 'Back-end Хөгжүүлэгч',
        location: 'Истанбул (Remote)',
        activityScore: 12,
        currentTime: '2ц 45м',
        status: 'idle',
        lastScreenshot: 'VS Code'
    },
    {
        id: 'RW-003',
        employeeName: 'Золбоо',
        role: 'Digital Marketer',
        location: 'Кафе (Remote)',
        activityScore: 0,
        currentTime: '0ц 0м',
        status: 'offline',
        lastScreenshot: 'Хаалттай'
    }
];

export function RemoteTrackerPage() {
    const [workers] = useState<RemoteWorker[]>(MOCK_WORKERS);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Зайны Хяналт"
                    subtitle="Зайнаас ажиллах багийн бүтээмжийг дэлгэцийн зураг болон үйлдлээр хянах"
                    action={{
                        label: "Тохиргоо",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Activity Dashboard */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-success">
                            <MonitorSmartphone size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй Ажилчид</h4>
                                <div className="flex items-center gap-2">
                                    <div className="text-2xl font-black text-success">14 хүн</div>
                                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                </div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><Activity size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Clock size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж Цаг (Өнөөдөр)</h4>
                                <div className="text-2xl font-black">4 цаг 15 мин</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Clock size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <MousePointer2 size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-warning" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж Идэвх</h4>
                                <div className="text-2xl font-black text-warning">76%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><Keyboard size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative border-l-4 border-danger">
                            <AlertCircle size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform text-danger" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөрчил Илэрсэн</h4>
                                <div className="text-2xl font-black text-danger">3 удаа</div>
                                <div className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest">Ажлын бус сайт</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger"><AlertCircle size={24} /></div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Нэр эсвэл хэлтсээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Хэлтэс</button>
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Settings size={18} /></button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black shadow-lg shadow-primary/20 bg-dark text-white border-dark"><Video size={18} /> Live Monitor</button>
                        </div>
                    </div>

                    {/* Remote Workers Grid */}
                    <div className="col-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {workers.map(worker => (
                            <div key={worker.id} className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden group">
                                <div className="p-4 border-b border-border-color/10 flex justify-between items-center bg-surface-2/20">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-surface-3 flex items-center justify-center text-primary"><UserCircle size={20} /></div>
                                            <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-surface-1 ${worker.status === 'active' ? 'bg-success' :
                                                    worker.status === 'idle' ? 'bg-warning' : 'bg-muted'
                                                }`} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm">{worker.employeeName}</span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5 max-w-[120px] truncate">{worker.role}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-lg font-black">{worker.currentTime}</div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${worker.status === 'active' ? 'bg-success/10 text-success' :
                                                worker.status === 'idle' ? 'bg-warning/10 text-warning' : 'bg-muted/10 text-muted'
                                            }`}>
                                            {worker.status === 'active' ? 'ИДЭВХТЭЙ' :
                                                worker.status === 'idle' ? 'СУЛ ЗОГСОЛТ' : 'ОФЛАЙН'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 relative">
                                    <div className="aspect-video bg-surface-2 rounded-xl border border-border-color/10 flex items-center justify-center relative overflow-hidden group/screen cursor-pointer">
                                        {worker.status !== 'offline' ? (
                                            <>
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
                                                <div className="absolute bottom-3 left-3 z-20">
                                                    <div className="text-white text-[10px] font-black uppercase tracking-widest break-all line-clamp-1">{worker.lastScreenshot}</div>
                                                    <div className="text-white/70 text-[8px] font-bold mt-1 flex items-center gap-1"><Camera size={10} /> 5 мин өмнө</div>
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/screen:opacity-100 z-30 transition-opacity bg-black/20 backdrop-blur-sm">
                                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-primary shadow-lg"><Eye size={20} /></div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-muted"><MonitorSmartphone size={32} className="opacity-20" /></div>
                                        )}
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                                                <span className="text-muted">Идэвх</span>
                                                <span className={worker.activityScore > 50 ? 'text-success' : worker.activityScore > 0 ? 'text-warning' : 'text-muted'}>{worker.activityScore}%</span>
                                            </div>
                                            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden shadow-inner w-full border border-border-color/5">
                                                <div className={`h-full rounded-full transition-all ${worker.activityScore > 50 ? 'bg-success' : worker.activityScore > 0 ? 'bg-warning' : 'bg-muted'
                                                    }`} style={{ width: `${worker.activityScore}%` }} />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center justify-end gap-1 mb-1.5"><MapPin size={10} className="text-primary" /> Байршил</div>
                                            <div className="text-xs font-bold truncate max-w-[120px] ml-auto" title={worker.location}>{worker.location}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </HubLayout>
    );
}
