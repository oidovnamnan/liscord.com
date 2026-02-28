import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Edit3,
    MousePointer2,
    Type,
    Image as ImageIcon,
    Square,
    Circle,
    Minus,
    History,
    Share2,
    Download,
    Layout,
    Trash2,
    Search,
    Plus,
    MoreVertical,
    Clock,
    User,
    ArrowRight
} from 'lucide-react';

interface Board {
    id: string;
    title: string;
    owner: string;
    updatedAt: string;
    members: number;
    preview?: string;
}

const MOCK_BOARDS: Board[] = [
    {
        id: 'WB-001',
        title: 'Хаус-20 Бүтээцийн Санаа',
        owner: 'Э.Батболд',
        updatedAt: '2026-02-27',
        members: 5
    },
    {
        id: 'WB-002',
        title: 'Бүтээгдэхүүний замын зураг 2026',
        owner: 'Г.Тулга',
        updatedAt: '2026-02-20',
        members: 12
    },
    {
        id: 'WB-003',
        title: 'Уулзалтын тэмдэглэл (Brainstorm)',
        owner: 'С.Баяр',
        updatedAt: '2026-02-15',
        members: 2
    }
];

export function WhiteboardPage() {
    const [boards] = useState<Board[]>(MOCK_BOARDS);
    const [isDrawing] = useState(false);

    if (isDrawing) {
        return (
            <div className="bg-surface-3 fixed inset-0 z-50 flex flex-col p-0">
                {/* Whiteboard Toolbar (Floating) */}
                <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-surface-1 p-2 rounded-3xl shadow-2xl flex flex-col gap-2 border border-border-color/10 z-10 scale-110">
                    <button className="btn btn-primary p-4 rounded-2xl shadow-lg"><MousePointer2 size={24} /></button>
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><Edit3 size={24} /></button>
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><Type size={24} /></button>
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><ImageIcon size={24} /></button>
                    <div className="h-px bg-border-color/10 my-2" />
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><Square size={24} /></button>
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><Circle size={24} /></button>
                    <button className="btn btn-ghost p-4 rounded-2xl hover:bg-surface-3 transition-all"><Minus size={24} /></button>
                </div>

                {/* Top Controls */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-surface-1 px-8 py-3 rounded-full shadow-2xl flex items-center gap-8 border border-border-color/10 z-10 max-w-[90%] overflow-hidden">
                    <h2 className="text-xl font-black text-primary truncate max-w-[250px]">Хаус-20 Бүтээцийн Санаа</h2>
                    <div className="h-6 w-px bg-border-color/10" />
                    <div className="flex -space-x-3 items-center">
                        <div className="h-8 w-8 rounded-full bg-primary border-2 border-surface-1 flex items-center justify-center font-black text-[10px] text-white">Б</div>
                        <div className="h-8 w-8 rounded-full bg-secondary border-2 border-surface-1 flex items-center justify-center font-black text-[10px] text-white">Т</div>
                        <div className="h-8 w-8 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center font-black text-[10px] text-muted">+4</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-ghost p-2 rounded-xl bg-surface-3 border border-border-color/10"><Share2 size={18} /></button>
                        <button className="btn btn-ghost p-2 rounded-xl bg-surface-3 border border-border-color/10"><Download size={18} /></button>
                        <button className="btn btn-ghost p-2 rounded-xl bg-surface-3 border border-border-color/10"><History size={18} /></button>
                    </div>
                    <button className="btn btn-danger btn-sm rounded-xl font-black px-6 py-2 shadow-lg">ХААХ</button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-surface-1 relative" style={{ backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                    {/* Simplified Drawing Overlay */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-30">
                        <path d="M 100 100 L 500 500 M 500 100 L 100 500" stroke="var(--primary)" strokeWidth="4" fill="none" />
                        <circle cx="300" cy="300" r="150" stroke="var(--secondary)" strokeWidth="4" fill="none" strokeDasharray="10 10" />
                    </svg>

                    {/* Bottom Right Zoom Controls */}
                    <div className="absolute bottom-8 right-8 bg-surface-1 p-2 rounded-2xl shadow-xl flex items-center gap-4 border border-border-color/10">
                        <button className="btn btn-ghost p-2 text-xl font-black">-</button>
                        <span className="text-sm font-black text-muted">100%</span>
                        <button className="btn btn-ghost p-2 text-xl font-black">+</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ухаалаг Самбар (Liscord Board)"
                    subtitle="Хамтын ажиллагааны виртуал самбар, зураглал болон тархины дайралт хийх"
                    action={{
                        label: "Шинэ самбар үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Controls Bar */}
                    <div className="col-12 flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Самбар хайх..." />
                        </div>
                        <div className="flex bg-surface-2 p-1 rounded-xl border border-border-color/10 shadow-inner">
                            <button className="p-2 rounded-lg bg-surface-1 text-primary shadow-sm"><Layout size={18} /></button>
                            <button className="p-2 rounded-lg text-muted"><History size={18} /></button>
                        </div>
                        <button className="btn btn-primary h-10 px-6 font-black rounded-xl shadow-lg flex items-center gap-2">
                            <Plus size={18} /> Шинэ Самбар
                        </button>
                    </div>

                    {/* Boards Grid */}
                    <div className="col-12 grid grid-cols-3 gap-8">
                        {boards.map(board => (
                            <div key={board.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none group relative cursor-pointer">
                                <div className="aspect-[16/9] bg-surface-2 flex items-center justify-center border-b border-border-color/10 relative overflow-hidden bg-gradient-to-br from-surface-2 to-surface-3">
                                    {/* Simplified Canvas Thumbnail */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                    <div className="bg-surface-3 p-4 rounded-3xl text-muted group-hover:text-primary transition-all group-hover:scale-110 shadow-inner">
                                        <Edit3 size={48} />
                                    </div>
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <button className="btn btn-ghost p-2 bg-surface-1 shadow-lg rounded-full"><Share2 size={16} /></button>
                                        <button className="btn btn-ghost p-2 bg-surface-1 shadow-lg rounded-full"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex -space-x-2">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="h-8 w-8 rounded-full border-2 border-surface-2 bg-surface-3 flex items-center justify-center font-black text-[8px] text-muted">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">{board.title}</h3>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest mt-2 px-1">
                                            <span className="flex items-center gap-1"><User size={12} className="text-primary" /> {board.owner}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {board.updatedAt}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary h-12 w-full rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all text-sm group-hover:bg-primary-dark">
                                        ЗУРАХ <ArrowRight size={20} />
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={18} className="text-muted" />
                                </div>
                            </div>
                        ))}

                        <div className="card aspect-[16/9] border-dashed border-2 bg-surface-2 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary transition-all rounded-3xl">
                            <Plus size={32} className="text-muted group-hover:text-primary transition-colors mb-2" />
                            <h4 className="font-bold">Шинэ Самбар</h4>
                            <p className="text-xs text-muted max-w-[150px] mt-1">Хамтын санаагаа дүрслэх</p>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
