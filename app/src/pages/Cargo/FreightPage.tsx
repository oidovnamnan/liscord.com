import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Ship,
    Search,
    Globe,
    Truck,
    ArrowRight,
    Zap,
    CheckCircle2,
    Database,
    Activity,
    Anchor,
    Plane,
    Box,
    Calendar,
    Share2,
    MoreVertical
} from 'lucide-react';

interface FreightShipment {
    id: string;
    origin: string;
    destination: string;
    mode: 'sea' | 'air' | 'road' | 'rail';
    status: 'at-sea' | 'loading' | 'arrived' | 'cleared';
    eta: string;
    containerNum: string;
}

const MOCK_FREIGHT: FreightShipment[] = [
    {
        id: 'FR-901',
        origin: 'Tianjin, China',
        destination: 'Ulaanbaatar, Mongolia',
        mode: 'rail',
        status: 'at-sea',
        eta: '2026-03-12',
        containerNum: 'TCNU-8822910'
    },
    {
        id: 'FR-902',
        origin: 'Busan, South Korea',
        destination: 'Ulaanbaatar, Mongolia',
        mode: 'sea',
        status: 'loading',
        eta: '2026-03-25',
        containerNum: 'MSKU-1122334'
    },
    {
        id: 'FR-903',
        origin: 'Frankfurt, Germany',
        destination: 'Ulaanbaatar, Mongolia',
        mode: 'air',
        status: 'arrived',
        eta: '2026-02-28',
        containerNum: 'AWB-778-112'
    }
];

export function FreightPage() {
    const [shipments] = useState<FreightShipment[]>(MOCK_FREIGHT);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Олон Улсын Тээвэр (Freight)"
                    subtitle="Усан зам, агаар, төмөр зам болон авто тээврийн нэгдсэн хяналт, карго менежмент"
                    action={{
                        label: "Шинэ тээвэр",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тээвэр</h4>
                                <div className="text-3xl font-black text-primary">12</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Замд яваа</h4>
                                <div className="text-3xl font-black text-secondary">8</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Ship size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Ирсэн</h4>
                                <div className="text-3xl font-black text-success">4</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Freight Tracking</h4>
                                <div className="text-xl font-black">MULTI-HUB SYNC</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Контейнер номер, ачааны төрөл, ID хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Төрөл</button>
                    </div>

                    {/* Freight List View */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {shipments.map(s => (
                            <div key={s.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${s.status === 'cleared' ? 'text-success' :
                                            s.status === 'at-sea' ? 'text-primary' :
                                                s.status === 'loading' ? 'text-warning' : 'text-secondary'
                                        }`}>
                                        <div className="h-14 w-14 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner rotate-3 group-hover:rotate-0 transition-all">
                                            {s.mode === 'sea' ? <Anchor size={24} /> :
                                                s.mode === 'air' ? <Plane size={24} /> :
                                                    s.mode === 'rail' ? <Ship size={24} /> : <Truck size={24} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{s.mode}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-black">{s.origin}</h3>
                                                <ArrowRight size={20} className="text-muted" />
                                                <h3 className="text-xl font-black">{s.destination}</h3>
                                            </div>
                                            <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                                                <span className="flex items-center gap-1 text-primary"><Box size={12} /> {s.containerNum}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {s.eta} ETA</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <span className={`badge font-black text-[10px] px-6 py-2 uppercase tracking-widest badge-${s.status === 'cleared' ? 'success' :
                                                    s.status === 'at-sea' ? 'primary' :
                                                        s.status === 'loading' ? 'warning' : 'secondary'
                                                }`}>
                                                {s.status === 'cleared' ? 'ТАТВАР ТӨЛСӨН' :
                                                    s.status === 'at-sea' ? 'ТЭЭВЭРТ' :
                                                        s.status === 'loading' ? 'АЧИЖ БУЙ' : 'ХҮЛЭЭН АВСАН'}
                                            </span>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                <MoreVertical size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AIS Global Tracker Alert / Sync */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Database size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Global AIS/Flight Tracking</h3>
                                <p className="text-sm text-muted">Олон улсын усан болон агаарын тээврийн байршлыг AIS/FlightRadar системээр бодит хугацаанд хянах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">СИСТЕМ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
