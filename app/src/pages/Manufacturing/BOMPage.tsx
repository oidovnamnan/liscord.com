import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layers,
    Box,
    Search,
    Settings,
    ChevronRight,
    ArrowRightLeft,
    PieChart,
    Cpu
} from 'lucide-react';

interface BOMItem {
    id: string;
    product: string;
    description: string;
    version: string;
    totalCost: number;
    components: number;
    status: 'active' | 'archived' | 'draft';
}

const MOCK_BOMS: BOMItem[] = [
    {
        id: 'BOM-101',
        product: 'Оффисын ширээ ST-20',
        description: 'Хатаасан нарс мод, төмөр нугастай',
        version: 'v2.1',
        totalCost: 125000,
        components: 12,
        status: 'active'
    },
    {
        id: 'BOM-102',
        product: 'Гал тогооны шүүгээ KW-05',
        description: 'Байгалийн мод, эко-лак',
        version: 'v1.4',
        totalCost: 350000,
        components: 24,
        status: 'active'
    }
];

export function BOMPage() {
    const [boms] = useState<BOMItem[]>(MOCK_BOMS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Жорын Бүрдэл (BOM)"
                    subtitle="Нэгж бүтээгдэхүүний стандарт жор, түүхий эдийн задгай тооцоолол"
                    action={{
                        label: "Жор үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    <div className="col-12 flex gap-4">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Барааны нэр, BOM дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-11 px-5">
                            <Layers size={18} className="mr-2" /> Сүүлийн хувилбар
                        </button>
                    </div>

                    <div className="col-12 grid-12 gap-6">
                        {/* BOM Cards */}
                        {boms.map(bom => (
                            <div key={bom.id} className="col-6 card p-0 overflow-hidden hover-lift shadow-sm">
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary-light p-3 rounded-2xl text-primary">
                                                <Box size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black leading-tight">{bom.product}</h3>
                                                <p className="text-xs text-muted font-bold tracking-widest uppercase">{bom.id} • {bom.version}</p>
                                            </div>
                                        </div>
                                        <div className="badge badge-success-light text-success font-black border-none">Идэвхтэй</div>
                                    </div>

                                    <p className="text-sm text-muted">{bom.description}</p>

                                    <div className="grid-2 gap-4 bg-surface-2 p-4 rounded-2xl border border-border-color/10">
                                        <div>
                                            <div className="text-[10px] text-muted font-bold uppercase mb-1">Нийт бүрэлдэхүүн</div>
                                            <div className="text-xl font-black">{bom.components} <span className="text-sm font-normal text-muted">зүйл</span></div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-muted font-bold uppercase mb-1">Нийт зардал (₮)</div>
                                            <div className="text-xl font-black">{bom.totalCost.toLocaleString()} ₮</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="btn btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2">
                                            Жор задлах <ChevronRight size={16} />
                                        </button>
                                        <button className="btn btn-ghost bg-surface-3 p-3 rounded-xl border border-border-color/20">
                                            <Settings size={20} className="text-muted" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Summary / Stats / Trends */}
                        <div className="col-12 card p-6 bg-surface-2 grid-12 gap-4">
                            <div className="col-4 flex flex-col items-center justify-center border-r border-border-color/10 p-4">
                                <PieChart size={32} className="text-primary mb-2" />
                                <div className="text-sm font-bold text-muted uppercase tracking-widest">Зардал Хүснэгт</div>
                                <div className="text-2xl font-black mt-1">124 BOM</div>
                            </div>
                            <div className="col-4 flex flex-col items-center justify-center border-r border-border-color/10 p-4">
                                <ArrowRightLeft size={32} className="text-secondary mb-2" />
                                <div className="text-sm font-bold text-muted uppercase tracking-widest">Хувилбарын Түүх</div>
                                <div className="text-2xl font-black mt-1">2,410 Шат</div>
                            </div>
                            <div className="col-4 flex flex-col items-center justify-center p-4">
                                <Cpu size={32} className="text-warning mb-2 animate-pulse" />
                                <div className="text-sm font-bold text-muted uppercase tracking-widest">AI AI Оновчлол</div>
                                <div className="text-lg font-black mt-1 text-success">Бэлэн байна</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
