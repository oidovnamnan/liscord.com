import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    UserPlus,
    Search,
    Filter,
    Briefcase,
    Users,
    FileText,
    Clock,
    CheckCircle2,
    ArrowRight,
    Plus,
    Tag,
    History
} from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    role: string;
    status: 'new' | 'screening' | 'technical' | 'hired' | 'rejected';
    experience: string;
    appliedDate: string;
}

const MOCK_CANDIDATES: Candidate[] = [
    {
        id: 'CAN-001',
        name: 'Т.Эрдэнэ',
        role: 'Ахлах Систем Архитект',
        status: 'technical',
        experience: '8 жил',
        appliedDate: '2026-02-25'
    },
    {
        id: 'CAN-002',
        name: 'О.Мишээл',
        role: 'Төслийн менежер',
        status: 'screening',
        experience: '4 жил',
        appliedDate: '2026-02-27'
    },
    {
        id: 'CAN-003',
        name: 'Б.Тулга',
        role: 'Маркетингийн ажилтан',
        status: 'new',
        experience: '2 жил',
        appliedDate: '2026-02-28'
    }
];

export function RecruitmentPage() {
    const [candidates] = useState<Candidate[]>(MOCK_CANDIDATES);

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Сонгон Шалгаруулалт (ATS)"
                    subtitle="Ажлын зар удирдах, горилогчдын мэдээлэл болон ярилцлагын үйл явц"
                    action={{
                        label: "Шинэ зар нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Recruitment Stats */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй зар</h4>
                                <div className="text-3xl font-black text-primary">8</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Briefcase size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт горилогч</h4>
                                <div className="text-3xl font-black text-secondary">245</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Users size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ярилцлага хийж буй</h4>
                                <div className="text-3xl font-black text-warning">14</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-success to-success-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Шинээр авсан</h4>
                                <div className="text-3xl font-black">12</div>
                            </div>
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Горилогчийн нэр, мэргэжил..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Бүх хэлтэс</button>
                    </div>

                    {/* Pipeline Board / List View */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {candidates.map(can => (
                            <div key={can.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[120px] bg-surface-2 ${can.status === 'hired' ? 'text-success' :
                                        can.status === 'technical' ? 'text-warning' :
                                            can.status === 'screening' ? 'text-secondary' : 'text-primary'
                                        }`}>
                                        <div className="h-16 w-16 rounded-full bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner">
                                            {can.name.substring(0, 1)}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{can.id}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{can.name}</h3>
                                                <span className={`badge badge-outline text-[10px] font-black uppercase tracking-widest`}>
                                                    {can.experience} ТУРШЛАГАТАЙ
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary"><Tag size={12} /> {can.role}</span>
                                                <span className="flex items-center gap-1"><History size={12} /> {can.appliedDate} ХҮСЭЛТ ГАРГАСАН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">ШАТЛАЛ</div>
                                                <span className={`badge badge-${can.status === 'hired' ? 'success' :
                                                    can.status === 'rejected' ? 'danger' :
                                                        can.status === 'technical' ? 'warning' : 'primary'
                                                    } font-black px-4`}>
                                                    {can.status === 'new' ? 'ШИНЭ ХҮСЭЛТ' :
                                                        can.status === 'screening' ? 'ХЯНАЖ БАЙНА' :
                                                            can.status === 'technical' ? 'ТЕХНИК ТЕСТ' : 'АМЖИЛТТАЙ'}
                                                </span>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10" />
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost p-3 rounded-xl bg-surface-3 hover:text-primary transition-colors"><FileText size={20} /></button>
                                                <button className="btn btn-primary h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="col-12 mt-4 flex gap-4">
                        <button className="btn btn-outline flex-1 py-6 border-dashed border-2 flex flex-col items-center gap-2 group hover:border-primary transition-all">
                            <Plus size={24} className="group-hover:scale-110 transition-transform" />
                            <div className="font-black text-sm">ШИНЭ ХҮСЭЛТ БҮРТГЭХ</div>
                            <p className="text-[10px] text-muted">Гараар горилогч нэмэх</p>
                        </button>
                        <button className="btn btn-outline flex-1 py-6 border-dashed border-2 flex flex-col items-center gap-2 group hover:border-secondary transition-all">
                            <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                            <div className="font-black text-sm">ЗАРЫН ГАДААД СҮЛЖЭЭ</div>
                            <p className="text-[10px] text-muted">LinkedIN / Zangia холбох</p>
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
