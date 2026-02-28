import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Warehouse,
    MapPin,
    ArrowRightLeft,
    Box,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    Plus,
    Search,
    Filter
} from 'lucide-react';

interface WarehouseLocation {
    id: string;
    name: string;
    location: string;
    manager: string;
    totalStock: number;
    status: 'active' | 'full' | 'maintenance';
    lastInventory: string;
    capacity: number;
}

const MOCK_WAREHOUSES: WarehouseLocation[] = [
    {
        id: 'WH-001',
        name: 'Төв Агуулах',
        location: 'Улаанбаатар, СХД',
        manager: 'Б.Болд',
        totalStock: 12450,
        status: 'active',
        lastInventory: '2024-03-20',
        capacity: 15000
    },
    {
        id: 'WH-002',
        name: 'Баруун Салбар',
        location: 'Улаанбаатар, БГД',
        manager: 'Г.Туул',
        totalStock: 4200,
        status: 'active',
        lastInventory: '2024-03-18',
        capacity: 5000
    },
    {
        id: 'WH-003',
        name: 'Дархан Салбар',
        location: 'Дархан-Уул аймаг',
        manager: 'Д.Бат',
        totalStock: 8900,
        status: 'full',
        lastInventory: '2024-03-15',
        capacity: 9000
    }
];

export function MultiWarehousePage() {
    const [warehouses] = useState<WarehouseLocation[]>(MOCK_WAREHOUSES);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Олон Агуулахын Удирдлага"
                    subtitle="Байгууллагын бүх агуулах, салбарын нөөцийг нэг дороос хянах, шилжүүлэх"
                    action={{
                        label: "Агуулах нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Stat Cards */}
                    <div className="col-3 card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Warehouse size={24} /></div>
                            <div className="flex items-center gap-1 text-success text-xs font-bold"><TrendingUp size={14} /> +1</div>
                        </div>
                        <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mt-4">Нийт агуулах</h4>
                        <div className="text-3xl font-black">{warehouses.length}</div>
                    </div>

                    <div className="col-3 card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="bg-secondary/10 p-3 rounded-2xl text-secondary"><Box size={24} /></div>
                            <div className="flex items-center gap-1 text-success text-xs font-bold"><TrendingUp size={14} /> 12%</div>
                        </div>
                        <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mt-4">Нийт бараа</h4>
                        <div className="text-3xl font-black">25,550</div>
                    </div>

                    <div className="col-3 card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="bg-warning/10 p-3 rounded-2xl text-warning"><ArrowRightLeft size={24} /></div>
                            <div className="flex items-center gap-1 text-muted text-xs font-bold">Today</div>
                        </div>
                        <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mt-4">Шилжүүлэг</h4>
                        <div className="text-3xl font-black">14</div>
                    </div>

                    <div className="col-3 card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="bg-danger/10 p-3 rounded-2xl text-danger"><AlertTriangle size={24} /></div>
                            <div className="flex items-center gap-1 text-danger text-xs font-bold"><TrendingUp size={14} /> 2</div>
                        </div>
                        <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mt-4">Дуусах дөхсөн</h4>
                        <div className="text-3xl font-black">8</div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Агуулахын нэр, байршлаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2"><Filter size={18} /> Шүүлтүүр</button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black"><Plus size={18} /> Шилжүүлэг үүсгэх</button>
                        </div>
                    </div>

                    {/* Warehouse List */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {warehouses.map(wh => (
                            <div key={wh.id} className="card p-6 hover-lift bg-surface-1 border-none flex flex-col gap-6 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-surface-2 rounded-2xl flex items-center justify-center text-primary border border-border-color/10 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                            <Warehouse size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors">{wh.name}</h3>
                                            <div className="flex items-center gap-1 text-xs font-bold text-muted mt-1">
                                                <MapPin size={14} /> {wh.location}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${wh.status === 'active' ? 'bg-success/10 text-success' :
                                        wh.status === 'full' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                                        }`}>
                                        {wh.status === 'active' ? 'АЖИЛЛАЖ БАЙНА' : wh.status === 'full' ? 'ДҮҮРСЭН' : 'ЗАСВАРТАЙ'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-muted">Ашиглалт</span>
                                            <span className="text-primary">{Math.round((wh.totalStock / wh.capacity) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-surface-2 rounded-full overflow-hidden shadow-inner border border-border-color/5">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                                style={{ width: `${(wh.totalStock / wh.capacity) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-2 p-4 rounded-2xl border border-border-color/5">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">НИЙТ НӨӨЦ</div>
                                            <div className="text-lg font-black">{wh.totalStock.toLocaleString()}</div>
                                        </div>
                                        <div className="bg-surface-2 p-4 rounded-2xl border border-border-color/5">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">МЕНЕЖЕР</div>
                                            <div className="text-md font-black">{wh.manager}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-bold text-muted bg-surface-2 p-3 rounded-xl border border-border-color/5">
                                        <CheckCircle2 size={14} className="text-success" />
                                        Сүүлчийн тооллого: {wh.lastInventory}
                                    </div>
                                </div>

                                <button className="btn btn-ghost w-full bg-surface-2 border border-border-color/10 py-4 rounded-2xl font-black text-xs hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                                    ДЭЛГЭРЭНГҮЙ ХАРАХ <ChevronRight size={18} />
                                </button>
                            </div>
                        ))}

                        {/* Add New Placeholder */}
                        <div className="card p-6 border-dashed border-2 border-border-color/20 bg-transparent flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all min-h-[400px]">
                            <div className="bg-surface-2 p-6 rounded-full text-muted"><Plus size={48} /></div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-muted">Шинэ агуулах нэмэх</h3>
                                <p className="text-xs font-bold text-muted/60 mt-1">Орон нутаг эсвэл салбарын <br />агуулах бүртгэх</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
