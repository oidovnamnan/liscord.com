import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Search,
    Filter,
    ArrowRight,
    User,
    FileText,
    CheckSquare,
    History,
    Zap,
    Download,
    MessageSquare,
    Send
} from 'lucide-react';

interface Approval {
    id: string;
    title: string;
    status: 'approved' | 'pending' | 'rejected' | 'draft';
    requestedBy: string;
    requestedAt: string;
    priority: 'low' | 'medium' | 'high';
    category: 'expense' | 'leave' | 'purchase' | 'contract';
    amount?: number;
}

const MOCK_APPROVALS: Approval[] = [
    {
        id: 'APP-5021',
        title: 'Урамшуулалт олгох хүсэлт - 2026 Q1',
        status: 'pending',
        requestedBy: 'Э.Батболд',
        requestedAt: '2026-02-27',
        priority: 'high',
        category: 'expense',
        amount: 2500000
    },
    {
        id: 'APP-5022',
        title: 'Чөлөө авах - Д.Тэмүүлэн (3 хоног)',
        status: 'pending',
        requestedBy: 'Д.Тэмүүлэн',
        requestedAt: '2026-02-27',
        priority: 'medium',
        category: 'leave'
    },
    {
        id: 'APP-5023',
        title: 'Барилгын материалын захиалга (Зайсан)',
        status: 'approved',
        requestedBy: 'Г.Тулга',
        requestedAt: '2026-02-25',
        priority: 'high',
        category: 'purchase',
        amount: 14500000
    }
];

export function ApprovalsPage() {
    const [approvals] = useState<Approval[]>(MOCK_APPROVALS);

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Зөвшөөрөл (Approvals)"
                    subtitle="Байгууллагын зардлын хүсэлт, чөлөө олголт болон шийдвэр гаргах үйл явц"
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
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Шийдээгүй</h4>
                                <div className="text-3xl font-black text-warning">12</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөвшөөрсөн</h4>
                                <div className="text-3xl font-black text-success">148</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Татгалзсан</h4>
                                <div className="text-3xl font-black text-danger">4</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><XCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Шуурхай Шилжилт</h4>
                                <div className="text-xl font-black">AI REVIEW</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><ArrowRight size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Хүсэлтийн гарчиг, дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сар</button>
                    </div>

                    {/* Approvals List */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {approvals.map(app => (
                            <div key={app.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[120px] bg-surface-2 ${app.priority === 'high' ? 'text-danger' :
                                        app.priority === 'medium' ? 'text-warning' : 'text-primary'
                                        }`}>
                                        {app.category === 'expense' ? <Download size={32} /> :
                                            app.category === 'leave' ? <History size={32} /> :
                                                app.category === 'purchase' ? <CheckSquare size={32} /> : <FileText size={32} />}
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{app.category}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{app.title}</h3>
                                                <span className={`badge badge-outline text-[10px] font-black uppercase tracking-widest border-${app.priority === 'high' ? 'danger' : 'border-color'}`}>
                                                    {app.priority === 'high' ? 'ЯАРАЛТАЙ' : app.priority === 'medium' ? 'ЭНГИЙН' : 'БАГА'}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1"><User size={12} className="text-primary" /> {app.requestedBy}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {app.requestedAt}</span>
                                                {app.amount && <span className="flex items-center gap-1 font-black text-secondary"><AlertCircle size={12} /> {app.amount.toLocaleString()} ₮</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {app.status === 'pending' ? (
                                                <>
                                                    <button className="btn btn-ghost p-4 rounded-2xl bg-surface-3 hover:bg-danger-light hover:text-danger transition-all group">
                                                        <XCircle size={24} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                    <button className="btn btn-primary h-14 px-8 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">
                                                        ЗӨВШӨӨРӨХ <CheckCircle2 size={24} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className={`badge badge-block badge-${app.status === 'approved' ? 'success' : 'danger'} py-4 px-8 font-black rounded-2xl`}>
                                                    {app.status === 'approved' ? 'ЗӨВШӨӨРСӨН' : 'ТАТГАЛЗСАН'}
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
                                <h3 className="text-lg font-black leading-tight">Бүгдийг нэг дор зөвшөөрөх</h3>
                                <p className="text-sm text-muted">Таны хүлээж буй 12 хүсэлтийг бүгдийг зөвшөөрөх бол дарна уу.</p>
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
