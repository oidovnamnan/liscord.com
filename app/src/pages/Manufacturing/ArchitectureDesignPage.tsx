import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    PenTool,
    Layers,
    Plus,
    Search,
    CloudDownload,
    History,
    Share2,
    Maximize2,
    FileText,
    Code
} from 'lucide-react';

interface ProjectDesign {
    id: string;
    title: string;
    category: string;
    version: string;
    lastUpdated: string;
    preview?: string;
}

const MOCK_DESIGNS: ProjectDesign[] = [
    {
        id: 'ARC-01',
        title: 'Хаус-20 Төслийн Архитектур',
        category: 'Архитектур',
        version: 'v4.2',
        lastUpdated: '2026-02-27',
    },
    {
        id: 'ARC-02',
        title: 'Оффисын ширээний 3D модел',
        category: 'Бүтээгдэхүүн',
        version: 'v1.1',
        lastUpdated: '2026-02-25',
    },
    {
        id: 'ARC-03',
        title: 'Төлөвлөлтийн зураг (Зайсан)',
        category: 'Зураг төсөл',
        version: 'v2.0',
        lastUpdated: '2026-02-20',
    }
];

export function ArchitectureDesignPage() {
    const [designs] = useState<ProjectDesign[]>(MOCK_DESIGNS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Зураг Төсөл & Архитектур"
                    subtitle="Инженерчлэлийн зураг, архитектурын төлөвлөгөө, хувилбарын хяналт болон 3D модел харах"
                    action={{
                        label: "Зураг нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    <div className="col-12 flex gap-4">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Зураг, модел дугаараар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх төсөл</button>
                    </div>

                    <div className="col-12 grid-3 gap-6">
                        {designs.map(design => (
                            <div key={design.id} className="card p-0 overflow-hidden hover-lift shadow-sm group">
                                <div className="aspect-video bg-surface-2 flex items-center justify-center border-b border-border-color/10 group-hover:bg-primary-light transition-all">
                                    <div className="bg-surface-3 p-4 rounded-3xl group-hover:bg-primary group-hover:scale-110 transition-all">
                                        <Layers size={48} className="text-muted group-hover:text-white" />
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="btn btn-ghost p-2 bg-surface-1 shadow-lg rounded-full"><Maximize2 size={16} /></button>
                                        <button className="btn btn-ghost p-2 bg-surface-1 shadow-lg rounded-full"><Share2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="p-5 bg-surface-1 flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-lg font-black leading-tight mb-1">{design.title}</h3>
                                        <div className="flex justify-between items-center text-[10px] font-black text-muted uppercase tracking-widest">
                                            <span>{design.id}</span>
                                            <span className="bg-surface-2 px-2 py-1 rounded-md">{design.version}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pb-4 border-b border-dashed border-border-color/10">
                                        <div className="flex items-center gap-2 text-xs font-bold">
                                            <PenTool size={12} className="text-primary" /> {design.category}
                                        </div>
                                        <div className="text-xs font-bold text-muted flex items-center gap-1">
                                            <History size={12} /> {design.lastUpdated}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="btn btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2">
                                            Зураг харах <CloudDownload size={16} />
                                        </button>
                                        <button className="btn btn-ghost bg-surface-2 p-3 rounded-xl border border-border-color/10">
                                            <FileText size={20} className="text-muted" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="col-1 card p-6 border-dashed border-2 bg-surface-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-all">
                            <Plus size={32} className="text-muted mb-2" />
                            <h4 className="font-bold">Шинэ модел оруулах</h4>
                            <p className="text-[10px] text-muted font-bold tracking-widest mt-1">.DWG, .RVN, .STEP</p>
                        </div>
                    </div>

                    <div className="col-12 card p-6 bg-surface-2 flex items-center gap-6 border-none shadow-md overflow-hidden relative">
                        <div className="bg-primary/5 p-4 rounded-3xl text-primary">
                            <Code size={32} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black leading-tight">AI CAD Analyze</h3>
                            <p className="text-sm text-muted">Таны зурсан зураг дээрх материалыг AI ашиглан автоматаар таньж BOM үүсгэх боломжтой.</p>
                        </div>
                        <button className="btn btn-primary h-12 px-8 font-black rounded-xl">Ажиллуулах</button>
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-primary/5 rounded-full blur-2xl" />
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
