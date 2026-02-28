import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    User,
    FileText,
    History,
    Zap,
    MessageSquare,
    Send,
    Coffee,
    Plane,
    Stethoscope
} from 'lucide-react';

interface LeaveRequest {
    id: string;
    employee: string;
    type: 'vacation' | 'sick' | 'personal' | 'unpaid';
    status: 'approved' | 'pending' | 'rejected';
    startDate: string;
    endDate: string;
    days: number;
}

const MOCK_LEAVE: LeaveRequest[] = [
    {
        id: 'L-520',
        employee: 'Э.Батболд',
        type: 'vacation',
        status: 'pending',
        startDate: '2026-03-05',
        endDate: '2026-03-12',
        days: 7
    },
    {
        id: 'L-521',
        employee: 'Д.Тэмүүлэн',
        type: 'sick',
        status: 'approved',
        startDate: '2026-02-27',
        endDate: '2026-02-28',
        days: 1
    },
    {
        id: 'L-522',
        employee: 'Г.Тулга',
        type: 'personal',
        status: 'rejected',
        startDate: '2026-02-20',
        endDate: '2026-02-22',
        days: 2
    }
];

export function LeavePage() {
    const [requests] = useState<LeaveRequest[]>(MOCK_LEAVE);

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Амралт & Чөлөө (Leave)"
                    subtitle="Ажилтнуудын чөлөө авах хүсэлтийг хянах, үлдэгдэл шалгах болон батлах"
                    action={{
                        label: "Хүсэлт гаргах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт ажилтан</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><User size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Одоо амарч буй</h4>
                                <div className="text-3xl font-black text-success">12</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Plane size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хүлээгдэж буй</h4>
                                <div className="text-3xl font-black text-warning">4</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Дундаж амралт</h4>
                                <div className="text-xl font-black text-white">18.5 ХОНОГ</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><History size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Ажилтны нэр, хүсэлтийн дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сар</button>
                    </div>

                    {/* Approvals List */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[120px] bg-surface-2 ${req.type === 'vacation' ? 'text-success' :
                                        req.type === 'sick' ? 'text-danger' : 'text-primary'
                                        }`}>
                                        {req.type === 'vacation' ? <Plane size={32} /> :
                                            req.type === 'sick' ? <Stethoscope size={32} /> :
                                                req.type === 'personal' ? <Coffee size={32} /> : <FileText size={32} />}
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{req.type}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{req.employee}</h3>
                                                <span className={`badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color`}>
                                                    {req.days} ХОНОГ / {req.startDate} - {req.endDate}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {req.startDate} ХҮСЭЛТ ГАРГАСАН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-danger-light hover:text-danger transition-all group">
                                                        <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                    <button className="btn btn-primary h-14 px-8 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">
                                                        ЗӨВШӨӨРӨХ <CheckCircle2 size={24} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className={`badge badge-block badge-${req.status === 'approved' ? 'success' : 'danger'} py-4 px-8 font-black rounded-2xl`}>
                                                    {req.status === 'approved' ? 'ЗӨВШӨӨРСӨН' : 'ТАТГАЛЗСАН'}
                                                </div>
                                            )}
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <button className="btn btn-ghost p-4 rounded-xl hover:bg-surface-3 transition-colors"><MessageSquare size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pending Actions */}
                    <div className="col-12 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md mt-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Send size={32} /></div>
                            <div>
                                <h3 className="text-lg font-black leading-tight">Системд бүртгэлтэй ажилчид</h3>
                                <p className="text-sm text-muted">Таны хүлээж буй 4 хүсэлтийг бүгдийг зөвшөөрөх бол дарна уу.</p>
                            </div>
                        </div>
                        <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
                            МАСС ЗӨВШӨӨРӨЛ
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
