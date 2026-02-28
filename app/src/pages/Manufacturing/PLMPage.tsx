import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    FlaskConical,
    Search,
    User,
    Filter,
    History,
    Layers,
    AlertCircle,
    FileText,
    Settings,
    Share2,
    CheckCircle2,
    Eye,
    Hammer,
    Database,
    Cpu
} from 'lucide-react';

interface ProductVersion {
    id: string;
    name: string;
    version: string;
    status: 'prototype' | 'testing' | 'production' | 'retired';
    updatedAt: string;
    owner: string;
}

const MOCK_VERSIONS: ProductVersion[] = [
    {
        id: 'PRD-721',
        name: 'Smart Liscord Box V2',
        version: 'v2.1.0-RC',
        status: 'testing',
        updatedAt: '2026-02-28',
        owner: 'Г.Тулга'
    },
    {
        id: 'PRD-722',
        name: 'Eco-Friendly Sofa Frame',
        version: 'v1.4.2',
        status: 'production',
        updatedAt: '2026-02-20',
        owner: 'Э.Батболд'
    },
    {
        id: 'PRD-723',
        name: 'Modular Partition System',
        version: 'v0.9.5-Alpha',
        status: 'prototype',
        updatedAt: '2026-02-15',
        owner: 'С.Баяр'
    }
];

export function PLMPage() {
    const [versions] = useState<ProductVersion[]>(MOCK_VERSIONS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Бүтээгдэхүүн Хөгжүүлэлт (PLM)"
                    subtitle="Бүтээгдэхүүний амьдралын мөчлөг, шинэ санаа, туршилт болон хувилбарын хяналт"
                    action={{
                        label: "Шинэ бүтээгдэхүүн",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт бүтээгдэхүүн</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Прототайп</h4>
                                <div className="text-3xl font-black text-warning">14</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><FlaskConical size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Туршилт (Unit Test)</h4>
                                <div className="text-3xl font-black text-secondary">8</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Cpu size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-success to-success-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <CheckCircle2 size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Үйлдвэрлэлд буй</h4>
                                <div className="text-3xl font-black">102</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Hammer size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Бүтээгдэхүүн, хувилбар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Хувилбар</button>
                    </div>

                    {/* Versions Pipeline */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {versions.map(v => (
                            <div key={v.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${v.status === 'production' ? 'text-success' :
                                            v.status === 'testing' ? 'text-warning' :
                                                v.status === 'prototype' ? 'text-primary' : 'text-muted'
                                        }`}>
                                        <div className="h-14 w-14 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner rotate-3 group-hover:rotate-0 transition-all">
                                            {v.status === 'production' ? <Hammer size={24} /> :
                                                v.status === 'testing' ? <FlaskConical size={24} /> :
                                                    v.status === 'prototype' ? <Layers size={24} /> : <FileText size={24} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{v.status}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{v.name}</h3>
                                                <span className={`badge badge-block font-black text-[10px] uppercase tracking-widest px-4 py-1.5`}>
                                                    {v.version}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary"><User size={12} /> {v.owner}</span>
                                                <span className="flex items-center gap-1"><History size={12} /> {v.updatedAt} СҮҮЛД ЗАССАН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><FileText size={20} /></button>
                                                <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><Settings size={20} /></button>
                                                <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><Share2 size={20} /></button>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10" />
                                            <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <Eye size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Change Registry Cards */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                        <div className="flex items-center gap-6">
                            <div className="bg-warning/5 p-4 rounded-2xl text-warning"><AlertCircle size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Engineering Change Order (ECO)</h3>
                                <p className="text-sm text-muted">Бүтээгдэхүүний өөрчлөлтийн хүсэлт болон хувилбарын баталгаажуулалт.</p>
                            </div>
                        </div>
                        <button className="btn btn-outline border-warning text-warning font-black px-10 py-3 rounded-2xl hover:bg-warning hover:text-white transition-all shadow-sm">
                            ӨӨРЧЛӨЛТ БҮРТГЭХ
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
