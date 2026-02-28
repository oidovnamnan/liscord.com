import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Key,
    Activity,
    History,
    Search,
    Filter,
    QrCode,
    CheckCircle2,
    Package,
    ArrowRightCircle,
    Smartphone,
    Cpu,
    Monitor,
    Maximize,
    Navigation,
    Calendar,
    User,
    ChevronDown,
    Plus
} from 'lucide-react';

interface SerialNumberRecord {
    serialNumber: string;
    productName: string;
    productId: string;
    status: 'available' | 'sold' | 'returned' | 'broken';
    location: string;
    warrantyUntil: string;
    lastAction: string;
    lastActionDate: string;
    customer?: string;
}

const MOCK_SERIALS: SerialNumberRecord[] = [
    {
        serialNumber: 'SN-IPH-13-99812',
        productName: 'iPhone 13 Pro Max - Silver',
        productId: 'PRD-IPH13',
        status: 'sold',
        location: 'Branch A',
        warrantyUntil: '2025-03-22',
        lastAction: 'Борлуулсан',
        lastActionDate: '2024-03-22',
        customer: 'Б.Бат-Эрдэнэ'
    },
    {
        serialNumber: 'SN-MAC-M2-10293',
        productName: 'MacBook Air M2 13-inch',
        productId: 'PRD-MBAIR-M2',
        status: 'available',
        location: 'Төв Агуулах',
        warrantyUntil: '2025-05-10',
        lastAction: 'Бэлэн',
        lastActionDate: '2024-05-10'
    },
    {
        serialNumber: 'SN-SONY-WH-8812',
        productName: 'Sony WH-1000XM5 Black',
        productId: 'PRD-SN-1000XM5',
        status: 'returned',
        location: 'Service Center',
        warrantyUntil: '2024-12-05',
        lastAction: 'Буцаагдсан',
        lastActionDate: '2023-12-05',
        customer: 'Г.Ану'
    },
    {
        serialNumber: 'SN-GALAXY-S23-4411',
        productName: 'Samsung Galaxy S23 Ultra',
        productId: 'PRD-S23-ULT',
        status: 'broken',
        location: 'Warehouse B',
        warrantyUntil: '2025-01-15',
        lastAction: 'Эвдэрсэн',
        lastActionDate: '2024-01-15'
    }
];

export function SerialTrackingPage() {
    const [serials] = useState<SerialNumberRecord[]>(MOCK_SERIALS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Сериал Мөрдөлт"
                    subtitle="Бараа тус бүрийг сериал дугаараар мөрдөх, баталгаат хугацаа болон түүх хянах"
                    action={{
                        label: "Сериал бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Summary Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Сериал</h4>
                                <div className="text-3xl font-black">42,109</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-inner"><Key size={28} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Бэлэн Бараа</h4>
                                <div className="text-3xl font-black">12,450</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform shadow-inner"><CheckCircle2 size={28} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Борлуулсан</h4>
                                <div className="text-3xl font-black text-foreground opacity-90">28,900</div>
                            </div>
                            <div className="bg-muted/10 p-4 rounded-2xl text-muted group-hover:scale-110 transition-transform shadow-inner"><Activity size={28} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group">
                            <div className="flex flex-col">
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Баталгаат Хугацаа</h4>
                                <div className="text-3xl font-black text-warning">842</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform shadow-inner"><History size={28} /></div>
                        </div>
                    </div>

                    {/* Filter Section */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Сериал дугаар эсвэл барааны нэрээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-6 flex items-center gap-2 font-black border-border-color/10 hover:bg-surface-2"><Filter size={18} /> Шүүлтүүр</button>
                            <button className="btn btn-primary h-11 px-8 flex items-center gap-2 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"><QrCode size={18} /> Сканнердах</button>
                        </div>
                    </div>

                    {/* Quick Search Categories */}
                    <div className="col-12 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        <button className="px-4 py-2 bg-primary text-white text-xs font-black rounded-xl shadow-md border-none flex items-center gap-2 whitespace-nowrap"><Key size={14} /> Бүх Сериал</button>
                        <button className="px-4 py-2 bg-surface-2 text-muted text-xs font-black rounded-xl border border-border-color/5 hover:bg-surface-3 transition-colors flex items-center gap-2 whitespace-nowrap"><Smartphone size={14} /> Утас</button>
                        <button className="px-4 py-2 bg-surface-2 text-muted text-xs font-black rounded-xl border border-border-color/5 hover:bg-surface-3 transition-colors flex items-center gap-2 whitespace-nowrap"><Cpu size={14} /> Компьютер</button>
                        <button className="px-4 py-2 bg-surface-2 text-muted text-xs font-black rounded-xl border border-border-color/5 hover:bg-surface-3 transition-colors flex items-center gap-2 whitespace-nowrap"><Monitor size={14} /> Электрон Бараа</button>
                        <button className="px-4 py-2 bg-surface-2 text-muted text-xs font-black rounded-xl border border-border-color/5 hover:bg-surface-3 transition-colors flex items-center gap-2 whitespace-nowrap"><Plus size={14} /> Бусад</button>
                    </div>

                    {/* Serial Records List */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {serials.map(serial => (
                            <div key={serial.serialNumber} className="card p-6 bg-surface-1 border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-surface-2/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="h-16 w-16 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner border border-border-color/10">
                                            <Package size={32} />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-[300px]">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black">{serial.serialNumber}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${serial.status === 'available' ? 'bg-success/10 text-success' :
                                                    serial.status === 'sold' ? 'bg-primary/10 text-primary' :
                                                        serial.status === 'returned' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                                                    }`}>
                                                    {serial.status === 'available' ? 'БЭЛЭН' :
                                                        serial.status === 'sold' ? 'БОРЛУУЛСАН' :
                                                            serial.status === 'returned' ? 'БУЦААГДСАН' : 'ЭВДЭРСЭН'}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-muted">{serial.productName}</div>
                                            <div className="text-[10px] text-muted/60 font-black uppercase tracking-tighter">{serial.productId}</div>
                                        </div>

                                        <div className="hidden lg:grid grid-cols-3 gap-8 flex-1 border-l border-border-color/5 pl-8">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70"><Navigation size={10} /> БАЙРШИЛ</div>
                                                <div className="text-sm font-black">{serial.location}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70"><Calendar size={10} /> БАТАЛГАА ХҮРТЭЛ</div>
                                                <div className="text-sm font-black">{serial.warrantyUntil}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70"><User size={10} /> ХҮЛЭЭН АВАГЧ</div>
                                                <div className="text-sm font-black">{serial.customer || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-xs font-black">{serial.lastAction}</div>
                                            <div className="text-[10px] text-muted font-bold mt-0.5">{serial.lastActionDate}</div>
                                        </div>
                                        <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-muted group-hover:text-primary transition-colors hover:bg-primary/10">
                                            <ArrowRightCircle size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination / Load More */}
                        <div className="flex justify-center mt-4">
                            <button className="btn btn-ghost text-muted font-black text-xs flex items-center gap-2 hover:text-primary uppercase tracking-widest">
                                ЦААШ ҮЗЭХ (40,000+) <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Advanced Traceability Panel */}
                    <div className="col-12 mt-4 grid grid-cols-2 gap-6">
                        <div className="card p-6 bg-gradient-to-br from-secondary/20 to-transparent border-secondary/5 flex flex-col gap-4 relative overflow-hidden group">
                            <Activity size={128} className="absolute -bottom-8 -right-8 opacity-5 text-secondary group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black relative z-10 flex items-center gap-2">Traceability AI <span className="bg-secondary text-white text-[8px] px-2 py-0.5 rounded-full">BETA</span></h3>
                            <p className="text-sm font-bold text-muted/80 max-w-[80%] relative z-10">Сериал дугаарын түүх болон нийлүүлэлтийн шугамын алдааг AI-аар шинжлэх.</p>
                            <button className="btn btn-secondary w-fit font-black px-6 rounded-2xl relative z-10">АНАЛИЗ ЭХЛҮҮЛЭХ</button>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary/20 to-transparent border-primary/5 flex flex-col gap-4 relative overflow-hidden group">
                            <Maximize size={128} className="absolute -bottom-8 -right-8 opacity-5 text-primary group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black relative z-10 flex items-center gap-2">Бөөнөөр Импортлох</h3>
                            <p className="text-sm font-bold text-muted/80 max-w-[80%] relative z-10">Excel эсвэл CSV файлаар 10,000+ сериал дугаарыг нэг дор бүртгэх.</p>
                            <button className="btn btn-primary w-fit font-black px-6 rounded-2xl relative z-10 font-black">ФАЙЛ СОНГОХ</button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
