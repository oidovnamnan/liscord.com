import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Activity,
    History,
    Plus,
    Calendar,
    Cog,
    Thermometer,
    Gauge
} from 'lucide-react';

interface Equipment {
    id: string;
    name: string;
    model: string;
    status: 'running' | 'maintenance' | 'offline';
    lastService: string;
    nextService: string;
    runtimeHours: number;
    health: number;
    metrics: { t: number; p: number };
}

const MOCK_EQUIPMENT: Equipment[] = [
    {
        id: 'EQ-01',
        name: 'Үйлдвэрийн таслагч (Laser)',
        model: 'Trumpf 3030',
        status: 'running',
        lastService: '2026-02-15',
        nextService: '2026-03-30',
        runtimeHours: 1245,
        health: 98,
        metrics: { t: 45, p: 6.2 }
    },
    {
        id: 'EQ-02',
        name: 'Угсралтын гар (Robot)',
        model: 'Universal Robotics UR10',
        status: 'maintenance',
        lastService: '2026-01-10',
        nextService: '2026-02-28',
        runtimeHours: 850,
        health: 72,
        metrics: { t: 38, p: 0 }
    },
    {
        id: 'EQ-03',
        name: 'Агаарын компрессор',
        model: 'Atlas Copco GA37',
        status: 'offline',
        lastService: '2025-12-01',
        nextService: '2026-02-25',
        runtimeHours: 4230,
        health: 45,
        metrics: { t: 15, p: 0.2 }
    }
];

export function EquipmentPage() {
    const [equipments] = useState<Equipment[]>(MOCK_EQUIPMENT);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Тоног Төхөөрөмж (CMMS)"
                    subtitle="Үйлдвэрийн машин механизмын ажиллагаа, засвар үйлчилгээ болон IoT хяналт"
                    action={{
                        label: "Засвар бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Real-time Health Monitor */}
                    <div className="col-12 card p-6 bg-surface-2 overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-secondary animate-pulse" />
                            <h3 className="text-lg font-bold">Системийн төлөв байдал (Live)</h3>
                        </div>
                        <div className="flex gap-12">
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs text-muted uppercase font-bold tracking-widest">Нийт эрүүл мэнд</span>
                                <span className="text-4xl font-black text-secondary">82%</span>
                            </div>
                            <div className="h-14 w-px bg-border-color" />
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs text-muted uppercase font-bold tracking-widest">Ажиллаж буй</span>
                                <span className="text-4xl font-black text-success">4/5</span>
                            </div>
                            <div className="h-14 w-px bg-border-color" />
                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs text-muted uppercase font-bold tracking-widest">Эрчим хүч (kW)</span>
                                <span className="text-4xl font-black text-warning">124.5</span>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Cards */}
                    {equipments.map(eq => (
                        <div key={eq.id} className="col-4 card p-0 overflow-hidden hover-lift shadow-sm transition-all border-l-4" style={{
                            borderLeftColor: eq.status === 'running' ? 'var(--success-color)' :
                                eq.status === 'maintenance' ? 'var(--warning-color)' : 'var(--danger-color)'
                        }}>
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="bg-surface-3 p-3 rounded-2xl">
                                        <Cog size={28} className={eq.status === 'running' ? 'text-success' : 'text-muted'} />
                                    </div>
                                    <span className={`badge badge-outline`}>{eq.id}</span>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold leading-tight">{eq.name}</h3>
                                    <p className="text-sm text-muted">{eq.model}</p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center bg-surface-2 p-3 rounded-xl border border-border-color/10">
                                        <div className="flex items-center gap-2 text-xs text-muted font-bold">
                                            <Thermometer size={14} /> ТЕМПЕРАТУР
                                        </div>
                                        <span className="font-bold">{eq.metrics.t}°C</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-surface-2 p-3 rounded-xl border border-border-color/10">
                                        <div className="flex items-center gap-2 text-xs text-muted font-bold">
                                            <Gauge size={14} /> ДАРАЛТ (Bar)
                                        </div>
                                        <span className="font-bold">{eq.metrics.p}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-2">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-muted">АШИГЛАЛТЫН ЦАГ</span>
                                        <span>{eq.runtimeHours}ч / 10,000ч</span>
                                    </div>
                                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${(eq.runtimeHours / 10000) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-between items-center mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Дараагийн засвар</span>
                                        <span className="text-xs font-bold flex items-center gap-1">
                                            <Calendar size={10} /> {eq.nextService}
                                        </span>
                                    </div>
                                    <button className="btn btn-ghost btn-xs text-primary px-3 py-2 rounded-lg bg-primary-light">
                                        Харах
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="col-12 mt-4 flex gap-4">
                        <button className="btn btn-outline flex-1 py-4 border-dashed border-2 text-muted hover:border-primary hover:text-primary transition-all">
                            <Plus size={20} className="mb-1" />
                            <div className="text-xs font-bold uppercase tracking-widest">Шинэ техник бүртгэх</div>
                        </button>
                        <button className="btn btn-outline flex-1 py-4 border-dashed border-2 text-muted hover:border-secondary hover:text-secondary transition-all">
                            <History size={20} className="mb-1" />
                            <div className="text-xs font-bold uppercase tracking-widest">Засварын түүх</div>
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
