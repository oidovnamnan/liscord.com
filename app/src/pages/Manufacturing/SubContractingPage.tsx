import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Users,
    Search,
    Zap,
    ArrowRight,
    Filter,
    CheckCircle2,
    Clock,
    Database,
    Activity,
    ClipboardCheck,
    Layout,
    Share2,
    Target
} from 'lucide-react';

interface SubContractor {
    id: string;
    company: string;
    items: string[];
    status: 'active' | 'pending' | 'completed';
    rating: number;
    completionDate: string;
}

const MOCK_CONTRACTORS: SubContractor[] = [
    {
        id: 'CON-001',
        company: 'Elite Garment LLC',
        items: ['Cotton T-Shirts', 'Hoodies'],
        status: 'active',
        rating: 4.8,
        completionDate: '2026-03-15'
    },
    {
        id: 'CON-002',
        company: 'Prime Plastics Co.',
        items: ['Packaging Bags'],
        status: 'pending',
        rating: 4.2,
        completionDate: '2026-03-20'
    },
    {
        id: 'CON-003',
        company: 'Global Metal Works',
        items: ['Steel Frames'],
        status: 'completed',
        rating: 4.9,
        completionDate: '2026-02-10'
    }
];

export function SubContractingPage() {
    const [contractors] = useState<SubContractor[]>(MOCK_CONTRACTORS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Гэрээт Үйлдвэрлэл (Sub-Contracting)"
                    subtitle="Гэрээт үйлдвэрлэгчдийн захиалга, түүхий эдийн зарцуулалт болон гүйцэтгэлийн хяналт"
                    action={{
                        label: "Гэрээт захиалга нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт гэрээт</h4>
                                <div className="text-3xl font-black text-primary">12</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Users size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй захиалга</h4>
                                <div className="text-3xl font-black text-secondary">8</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><ClipboardCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Гүйцэтгэл (%)</h4>
                                <div className="text-3xl font-black text-success">94%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Supply Reliability</h4>
                                <div className="text-xl font-black text-white">L-TRUST ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Компани, барааны нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    {/* Sub-contractors Grid Layout */}
                    <div className="col-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contractors.map(con => (
                            <div key={con.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10 font-black text-xl">
                                            {con.company.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">{con.company}</h3>
                                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">ID: {con.id}</div>
                                        </div>
                                    </div>
                                    <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${con.status === 'active' ? 'primary' :
                                            con.status === 'completed' ? 'success' : 'warning'
                                        }`}>
                                        {con.status === 'active' ? 'ЯВАГДАЖ БУЙ' :
                                            con.status === 'completed' ? 'ДУУССАН' : 'ХҮЛЭЭГДЭЖ БУЙ'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {con.items.map((item, idx) => (
                                            <span key={idx} className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color/20">
                                                {item}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="bg-surface-2/50 p-4 rounded-2xl border border-border-color/5">
                                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Clock size={12} /> ДУУСАХ ХУГАЦАА</div>
                                            <div className="text-sm font-black text-primary">{con.completionDate}</div>
                                        </div>
                                        <div className="bg-surface-2/50 p-4 rounded-2xl border border-border-color/5">
                                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={12} /> ГҮЙЦЭТГЭЛИЙН ҮНЭЛГЭЭ</div>
                                            <div className="text-sm font-black text-secondary">{con.rating}/5.0</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <button className="btn btn-outline flex-1 py-4 rounded-2xl font-black border-border-color/20 flex items-center justify-center gap-2">
                                        <Layout size={18} /> ХЯНАХ
                                    </button>
                                    <button className="btn btn-primary p-4 rounded-2xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                        <ArrowRight size={24} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Subcontractor Portal Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Sub-contractor Hub Portal</h3>
                                <p className="text-sm text-muted">Гэрээт үйлдвэрлэгчид өөрсдөө гүйцэтгэлээ бүртгэх болон түүхий эдийн үлдэгдэлээ хянах тусдаа портал.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ПОРТАЛ РУУ ҮСРЭХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
