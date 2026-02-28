import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Truck,
    Search,
    MapPin,
    Fuel,
    Zap,
    AlertCircle,
    TrendingUp,
    Activity,
    CheckCircle2,
    Clock,
    MoreVertical,
    ArrowRight,
    Smartphone,
    Database,
    Shield,
    Share2
} from 'lucide-react';

interface Vehicle {
    id: string;
    model: string;
    plate: string;
    type: 'truck' | 'van' | 'car';
    status: 'moving' | 'idle' | 'warning' | 'offline';
    lastUpdate: string;
    fuelLevel: number;
    odometer: string;
}

const MOCK_VEHICLES: Vehicle[] = [
    {
        id: 'FL-001',
        model: 'Hyundai Porter II',
        plate: '88-99 УБA',
        type: 'truck',
        status: 'moving',
        lastUpdate: '2 mins ago',
        fuelLevel: 65,
        odometer: '12,450 km'
    },
    {
        id: 'FL-002',
        model: 'Toyota Hiace',
        plate: '11-22 УББ',
        type: 'van',
        status: 'idle',
        lastUpdate: '15 mins ago',
        fuelLevel: 42,
        odometer: '45,800 km'
    },
    {
        id: 'FL-003',
        model: 'Ford Transit',
        plate: '55-66 УБГ',
        type: 'truck',
        status: 'warning',
        lastUpdate: 'Just now',
        fuelLevel: 12,
        odometer: '8,200 km'
    }
];

export function FleetPage() {
    const [vehicles] = useState<Vehicle[]>(MOCK_VEHICLES);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Парк Удирдлага (Fleet)"
                    subtitle="Тээврийн хэрэгслийн байршил, шатахуун, техникийн байдал болон GPS хяналт"
                    action={{
                        label: "Техник нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Fleet Insights */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт техник</h4>
                                <div className="text-3xl font-black text-primary">24</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Truck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4>
                                <div className="text-3xl font-black text-success">18</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөрчил / Засвар</h4>
                                <div className="text-3xl font-black text-danger">3</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Efficiency</h4>
                                <div className="text-xl font-black">94% OPTIMIZED</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Улсын дугаар, жолооч, загвараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх салбар</button>
                    </div>

                    {/* Fleet List & Map Preview */}
                    <div className="col-12 grid grid-cols-12 gap-6">
                        <div className="col-span-8 space-y-4">
                            {vehicles.map(v => (
                                <div key={v.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none group">
                                    <div className="flex items-stretch border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                        <div className="p-6 flex-1 flex items-center gap-6">
                                            <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-border-color/10">
                                                <Truck size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black tracking-tight">{v.model}</h3>
                                                    <div className="badge badge-outline text-[10px] font-black border-border-color/20">{v.plate}</div>
                                                </div>
                                                <div className="flex gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Database size={12} /> {v.odometer}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {v.lastUpdate}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3 min-w-[150px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-muted uppercase mb-1">Шатахуун</span>
                                                        <div className="h-1.5 w-24 bg-surface-2 rounded-full overflow-hidden border border-border-color/5">
                                                            <div className={`h-full rounded-full ${v.fuelLevel < 20 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${v.fuelLevel}%` }} />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-black w-8">{v.fuelLevel}%</span>
                                                </div>
                                                <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${v.status === 'moving' ? 'success' :
                                                    v.status === 'warning' ? 'danger' :
                                                        v.status === 'idle' ? 'warning' : 'secondary'
                                                    }`}>
                                                    {v.status === 'moving' ? 'ХӨДӨЛГӨӨНТЭЙ' :
                                                        v.status === 'idle' ? 'ЗОГСООЛД' :
                                                            v.status === 'warning' ? 'ШАЛГАЛТ ХЭРЭГТЭЙ' : 'OFFLINE'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-20 bg-surface-2 flex items-center justify-center border-l border-border-color/5 group-hover:bg-primary transition-colors">
                                            <button className="text-muted group-hover:text-white transition-colors"><MoreVertical size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Map Widget */}
                        <div className="col-span-4 flex flex-col gap-6">
                            <div className="card p-0 overflow-hidden bg-surface-2 h-[400px] shadow-lg relative border-none flex items-center justify-center border-dashed border-2">
                                <MapPin size={128} className="absolute inset-0 m-auto opacity-[0.03] text-primary" />
                                <div className="relative z-10 text-center p-6">
                                    <div className="bg-primary/10 p-4 rounded-full text-primary inline-flex mb-4"><Activity size={32} /></div>
                                    <h3 className="text-xl font-black mb-2">GPS Бодит хугацааны газрын зураг</h3>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest leading-relaxed">System Ready for Live Tracking</p>
                                    <button className="btn btn-primary mt-6 w-full py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                        ГАЗРЫН ЗУРАГ НЭЭХ <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="card p-6 bg-surface-2 border-none flex items-center gap-4 group cursor-pointer hover:bg-surface-3 transition-all">
                                <div className="bg-warning/10 p-3 rounded-xl text-warning group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-black uppercase">Даатгал & Оношлогоо</h4>
                                    <p className="text-[10px] text-muted font-bold tracking-widest">2 ТЕХНИК ХУГАЦАА ДҮҮСЭХ ДӨХСӨН</p>
                                </div>
                                <Smartphone size={20} className="text-muted" />
                            </div>
                        </div>
                    </div>

                    {/* Fleet Automation / Fuel Sync */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Fuel size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Шатахуун Дамжуулалт (Fuel Sync)</h3>
                                <p className="text-sm text-muted">Шатахуун түгээх станцын картын системтэй холбож зарцуулалтыг автоматаар хянах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">КАРТ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
