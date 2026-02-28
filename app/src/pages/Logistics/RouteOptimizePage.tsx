import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Zap,
    Search,
    MapPin,
    Navigation,
    Clock,
    TrendingDown,
    Activity,
    Fuel,
    Share2,
    Layers,
    BrainCircuit,
    Route as RouteIcon,
    Maximize,
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';

interface OptimizedRoute {
    id: string;
    driver: string;
    pointsCount: number;
    distance: string;
    estimatedTime: string;
    savings: string;
    status: 'optimized' | 'active' | 'pending';
}

const MOCK_ROUTES: OptimizedRoute[] = [
    {
        id: 'RT-101',
        driver: 'Э.Бат-Эрдэнэ',
        pointsCount: 15,
        distance: '24.2 km',
        estimatedTime: '1:45 hr',
        savings: '12% Fuel',
        status: 'active'
    },
    {
        id: 'RT-102',
        driver: 'С.Болд',
        pointsCount: 22,
        distance: '38.5 km',
        estimatedTime: '3:12 hr',
        savings: '18% Fuel',
        status: 'optimized'
    },
    {
        id: 'RT-103',
        driver: 'М.Тэмүүжин',
        pointsCount: 8,
        distance: '12.4 km',
        estimatedTime: '0:45 hr',
        savings: '5% Fuel',
        status: 'pending'
    }
];

export function RouteOptimizePage() {
    const [routes] = useState<OptimizedRoute[]>(MOCK_ROUTES);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Маршрут Оновчлол (AI Route)"
                    subtitle="Хүргэлтийн хамгийн дөт замыг AI ашиглан тооцоолж, цаг болон түлш хэмнэх"
                    action={{
                        label: "AI Тооцоолол",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт маршрут</h4>
                                <div className="text-3xl font-black text-primary">45</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><RouteIcon size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хэмнэсэн цаг</h4>
                                <div className="text-3xl font-black text-secondary">24.5ч</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хэмнэсэн түлш</h4>
                                <div className="text-3xl font-black text-success">15%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><Fuel size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <BrainCircuit size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Engine</h4>
                                <div className="text-xl font-black text-white">L-ROUTE V2</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Zap size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Маршрут, жолоочийн нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх бүс</button>
                    </div>

                    {/* Route List & Map Container */}
                    <div className="col-12 grid grid-cols-12 gap-6">
                        <div className="col-span-4 space-y-4">
                            {routes.map(route => (
                                <div key={route.id} className={`card p-6 cursor-pointer transition-all border-none hover-lift shadow-sm ${route.status === 'active' ? 'bg-primary/5 ring-1 ring-primary' : 'bg-surface-1'
                                    }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest">{route.id} / {route.driver}</div>
                                            <h3 className="text-lg font-black leading-tight">Маршрут #{route.id.split('-')[1]}</h3>
                                        </div>
                                        <div className={`p-2 rounded-xl ${route.status === 'active' ? 'bg-primary text-white' : 'bg-surface-2 text-muted'}`}>
                                            <Navigation size={20} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-2/50 p-2 rounded-xl text-center">
                                            <div className="text-[8px] font-black text-muted uppercase mb-1">ЦЭГИЙН ТОО</div>
                                            <div className="text-sm font-black text-primary">{route.pointsCount}</div>
                                        </div>
                                        <div className="bg-surface-2/50 p-2 rounded-xl text-center">
                                            <div className="text-[8px] font-black text-muted uppercase mb-1">ХУГАЦАА</div>
                                            <div className="text-sm font-black text-primary">{route.estimatedTime}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border-color/10 flex justify-between items-center">
                                        <div className="flex items-center gap-1 text-[10px] font-black text-success uppercase tracking-widest">
                                            <TrendingDown size={12} /> {route.savings} ХЭМНЭЛТ
                                        </div>
                                        <span className={`badge font-black text-[10px] px-2 py-0.5 uppercase tracking-widest badge-${route.status === 'active' ? 'success' :
                                                route.status === 'optimized' ? 'primary' : 'secondary'
                                            }`}>
                                            {route.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Route Map Simulation */}
                        <div className="col-span-8 card p-0 overflow-hidden bg-surface-2 h-[550px] shadow-lg relative border-none flex flex-col group">
                            <div className="p-4 bg-surface-1 border-b flex justify-between items-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted">Интерактив маршрут зураглал</h3>
                                <div className="flex gap-2">
                                    <button className="btn btn-ghost btn-sm h-10 w-10 p-0 rounded-xl bg-surface-2"><SearchIcon size={18} /></button>
                                    <button className="btn btn-ghost btn-sm h-10 w-10 p-0 rounded-xl bg-surface-2"><Maximize size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 relative flex items-center justify-center border-dashed border-2 m-4 rounded-3xl border-border-color/20">
                                <MapPin size={128} className="absolute inset-0 m-auto opacity-[0.03] text-primary" />
                                <div className="relative z-10 flex flex-col items-center gap-6">
                                    <div className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/30 shadow-2xl group-hover:scale-110 transition-transform">
                                        <Activity size={48} className="text-primary animate-pulse" />
                                    </div>
                                    <div className="text-center max-w-sm">
                                        <h3 className="text-2xl font-black mb-2">Live Route Mapping</h3>
                                        <p className="text-sm text-muted font-bold leading-relaxed uppercase tracking-tighter">AI Оновчлол хийгдсэн 15 цэгийн хамгийн дөт замыг энд графикаар харуулна.</p>
                                    </div>
                                    <button className="btn btn-primary px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                                        МАРШРУТ ИДЭВХЖҮҮЛЭХ <ChevronRight size={24} />
                                    </button>
                                </div>

                                {/* Floating indicators */}
                                <div className="absolute top-8 left-8 card px-4 py-2 bg-white/80 backdrop-blur border-none shadow-sm flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-success animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">System Live</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Google Maps / OSM Sync Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Layers size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Map Data & Traffic Sync</h3>
                                <p className="text-sm text-muted">Google Maps болон замын хөдөлгөөний дата дээр үндэслэн саатлыг урьдчилан таамаглаж зам өөрчлөх.</p>
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
