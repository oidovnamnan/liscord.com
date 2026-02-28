import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layout,
    Search,
    MapPin,
    ArrowRight,
    Grid,
    Layers,
    Zap,
    Navigation,
    Database,
    Maximize,
    ChevronRight,
    QrCode,
    AlertCircle
} from 'lucide-react';

interface WarehouseZone {
    id: string;
    name: string;
    capacity: string;
    occupancy: number;
    type: 'cold' | 'dry' | 'hazardous' | 'racking';
    itemsCount: number;
}

const MOCK_ZONES: WarehouseZone[] = [
    {
        id: 'ZONE-A',
        name: 'Main Racking (A1-A20)',
        capacity: '500 Pallets',
        occupancy: 82,
        type: 'racking',
        itemsCount: 1240
    },
    {
        id: 'ZONE-B',
        name: 'Cold Storage (B1)',
        capacity: '100m³',
        occupancy: 45,
        type: 'cold',
        itemsCount: 82
    },
    {
        id: 'ZONE-C',
        name: 'Dry Goods (C1-C5)',
        capacity: '1000 Units',
        occupancy: 15,
        type: 'dry',
        itemsCount: 150
    }
];

export function WarehouseManagementPage() {
    const [zones] = useState<WarehouseZone[]>(MOCK_ZONES);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Агуулахын Бүсчлэл (WMS)"
                    subtitle="Агуулахын дотоод зохион байгуулалт, тавиурын хаягжилт болон багтаамжийн хяналт"
                    action={{
                        label: "Бүс нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт агуулах</h4>
                                <div className="text-3xl font-black text-primary">4</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт бүс</h4>
                                <div className="text-3xl font-black text-secondary">24</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж дүүргэлт</h4>
                                <div className="text-3xl font-black text-warning">64%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Maximize size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Оновчлол</h4>
                                <div className="text-xl font-black text-white">AI OPTIMIZED</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Navigation size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Бүс, тавиурын дугаар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Төрөл</button>
                    </div>

                    {/* Zone Cards */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {zones.map(zone => (
                            <div key={zone.id} className="card p-6 hover-lift shadow-sm bg-surface-1 border-none flex flex-col gap-6 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 bg-surface-2 rounded-2xl flex items-center justify-center font-black border border-border-color/10 shadow-inner group-hover:bg-primary-light group-hover:text-primary transition-all ${zone.type === 'cold' ? 'text-secondary' : zone.type === 'hazardous' ? 'text-danger' : 'text-primary'
                                            }`}>
                                            {zone.type === 'cold' ? <Zap size={24} /> :
                                                zone.type === 'hazardous' ? <AlertCircle size={24} /> : <Layout size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors">{zone.name}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <MapPin size={12} /> {zone.id}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-muted">Дүүргэлт</span>
                                            <span className={zone.occupancy > 80 ? 'text-danger' : 'text-primary'}>{zone.occupancy}%</span>
                                        </div>
                                        <div className="h-2 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${zone.occupancy > 80 ? 'bg-danger' : zone.occupancy > 50 ? 'bg-warning' : 'bg-primary'
                                                }`} style={{ width: `${zone.occupancy}%` }} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-2 p-3 rounded-2xl border border-border-color/5">
                                            <div className="text-[8px] font-black text-muted uppercase tracking-tighter mb-1">БАГТААМЖ</div>
                                            <div className="text-sm font-black">{zone.capacity}</div>
                                        </div>
                                        <div className="bg-surface-2 p-3 rounded-2xl border border-border-color/5">
                                            <div className="text-[8px] font-black text-muted uppercase tracking-tighter mb-1">БАРАА</div>
                                            <div className="text-sm font-black">{zone.itemsCount}</div>
                                        </div>
                                    </div>
                                </div>

                                <button className="btn btn-ghost w-full bg-surface-2 border border-border-color/10 py-3 rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                                    БҮСИЙН ДОТОРХИЙГ ХАРАХ <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Warehouse Floor Plan Preview */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col items-center justify-center gap-6 min-h-[300px] shadow-inner relative overflow-hidden group">
                        <Grid size={128} className="absolute inset-0 opacity-[0.03] text-primary" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-6 rounded-full text-primary mb-4 group-hover:scale-110 transition-transform"><QrCode size={48} /></div>
                            <h3 className="text-2xl font-black mb-2">Агуулахын 2D/3D Зураглал</h3>
                            <p className="max-w-md text-muted font-bold text-sm">Бүх бүс болон тавиурын байршлыг графикаар харж, бараа олох процессыг хурдасгана уу.</p>
                        </div>
                        <button className="relative z-10 btn btn-primary px-12 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                            ГРАФИК ХАРАХ <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
