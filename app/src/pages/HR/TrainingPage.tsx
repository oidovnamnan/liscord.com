import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Clock,
    PlayCircle,
    Award,
    Star,
    MonitorPlay,
    TrendingUp,
    Search,
    Filter,
    Plus,
    Users
} from 'lucide-react';

interface Course {
    id: string;
    title: string;
    category: 'onboarding' | 'skill' | 'compliance' | 'leadership';
    status: 'mandatory' | 'optional';
    progress: number;
    duration: string;
    enrolled: number;
}

const MOCK_COURSES: Course[] = [
    {
        id: 'LMS-001',
        title: 'Шинэ ажилтны чиглүүлэх хөтөлбөр (Onboarding)',
        category: 'onboarding',
        status: 'mandatory',
        progress: 85,
        duration: '4 цаг 30 мин',
        enrolled: 12
    },
    {
        id: 'LMS-002',
        title: 'Мэдээллийн аюулгүй байдлын суурь',
        category: 'compliance',
        status: 'mandatory',
        progress: 100,
        duration: '1 цаг 15 мин',
        enrolled: 145
    },
    {
        id: 'LMS-003',
        title: 'Борлуулалтын ур чадвар: Харилцагчийн үйлчилгээ',
        category: 'skill',
        status: 'optional',
        progress: 32,
        duration: '2 цаг 45 мин',
        enrolled: 48
    }
];

export function TrainingPage() {
    const [courses] = useState<Course[]>(MOCK_COURSES);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Дотоод Сургалт (LMS)"
                    subtitle="Ажилтнуудын мэдлэг, ур чадварыг дээшлүүлэх, сертификатжуулах систем"
                    action={{
                        label: "Сургалт Нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Stats */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <GraduationCap size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Сургалт</h4>
                                <div className="text-2xl font-black">24 цогц</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary"><BookOpen size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group overflow-hidden relative">
                            <Users size={48} className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform" />
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй Суралцагчид</h4>
                                <div className="text-2xl font-black">156</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary"><MonitorPlay size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group border-l-4 border-success relative overflow-hidden">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Курс Дүүргэлт</h4>
                                <div className="text-2xl font-black text-success">84.5%</div>
                            </div>
                            <div className="bg-success text-white p-4 rounded-2xl shadow-lg shadow-success/20"><CheckCircle2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group relative overflow-hidden">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Олгосон Сертификат</h4>
                                <div className="text-2xl font-black text-warning">480</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning"><Award size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Хичээлийн нэр, багшаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Ангилал</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><Plus size={18} /> Хуваарь Үүсгэх</button>
                        </div>
                    </div>

                    {/* Course Lists */}
                    <div className="col-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course.id} className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                <div className="h-32 bg-surface-2 relative overflow-hidden flex items-center justify-center">
                                    <PlayCircle size={48} className="text-primary opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all z-10" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`px-2 py-0.5 border border-border-color/10 rounded text-[9px] font-black uppercase tracking-widest ${course.status === 'mandatory' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                                            }`}>
                                            {course.status === 'mandatory' ? 'ЗААВАЛ СУДЛАХ' : 'СОНГОН СУДЛАХ'}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest bg-surface-2 px-2 py-0.5 rounded">{course.category}</span>
                                    </div>
                                    <h3 className="font-black text-lg h-14 line-clamp-2 leading-tight">{course.title}</h3>

                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                            <span>Дүүргэлт</span>
                                            <span className="text-primary">{course.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden shadow-inner w-full">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${course.progress}%` }} />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border-color/5 flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                                        <span className="flex items-center gap-1"><Users size={12} /> {course.enrolled}</span>
                                        <span className="flex items-center gap-1 text-warning"><Star size={12} /> 4.8</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Analytics Preview */}
                    <div className="col-12 mt-4 grid grid-cols-2 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Сургалтын Үр Дүн</h3>
                                <p className="text-xs font-bold text-muted mt-1">Ажилчдын ур чадварын өсөлт: +12.4%</p>
                            </div>
                            <button className="btn btn-ghost h-10 px-4 text-xs font-black text-primary hover:bg-primary/10 transition-colors">ДЭЛГЭРЭНГҮЙ ТАЙЛАН</button>
                        </div>
                        <div className="card p-6 bg-gradient-to-r from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative">
                            <Award size={128} className="absolute -right-8 -top-8 opacity-10 group-hover:scale-110 transition-transform" />
                            <div className="z-10 relative">
                                <h3 className="text-sm font-black flex items-center gap-2 tracking-tight"><Award size={18} /> Сертификатны Дизайн Тохиргоо</h3>
                                <p className="text-xs font-bold text-white/70 mt-1">Курс төгссөн ажилчдад очих цахим батламж</p>
                            </div>
                            <button className="btn bg-white/20 hover:bg-white/30 text-white border-none h-10 px-6 font-black rounded-xl text-xs backdrop-blur-md relative z-10 transition-colors">ТОХИРУУЛАХ</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
