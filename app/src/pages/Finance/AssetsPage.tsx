import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Laptop,
    Building2,
    Truck,
    Briefcase,
    Plus,
    Search,
    Filter,
    ArrowRightCircle,
    Calendar,
    User,
    DollarSign,
    TrendingDown,
    Activity,
    QrCode,
    History,
    CheckCircle2,
    Clock,
    Shield
} from 'lucide-react';

interface AssetRecord {
    id: string;
    name: string;
    category: 'electronics' | 'furniture' | 'vehicle' | 'real-estate';
    value: number;
    purchaseDate: string;
    assignedTo: string;
    location: string;
    condition: 'new' | 'good' | 'fair' | 'poor' | 'broken';
    depreciationYears: number;
    currentValue: number;
}

const MOCK_ASSETS: AssetRecord[] = [
    {
        id: 'AST-OFF-001',
        name: 'MacBook Pro M3 Max 14-inch',
        category: 'electronics',
        value: 12500000,
        purchaseDate: '2024-01-15',
        assignedTo: 'Б.Болд (Product Manager)',
        location: 'UB Office',
        condition: 'new',
        depreciationYears: 3,
        currentValue: 11200000
    },
    {
        id: 'AST-OFF-002',
        name: 'Herman Miller Embody Chair',
        category: 'furniture',
        value: 4800000,
        purchaseDate: '2023-11-20',
        assignedTo: 'Г.Туул (Lead Dev)',
        location: 'UB Office',
        condition: 'good',
        depreciationYears: 5,
        currentValue: 4200000
    },
    {
        id: 'AST-VEH-001',
        name: 'Toyota Land Cruiser 300',
        category: 'vehicle',
        value: 350000000,
        purchaseDate: '2023-05-10',
        assignedTo: 'Executive Fleet',
        location: 'UB Garage',
        condition: 'good',
        depreciationYears: 7,
        currentValue: 280000000
    }
];

export function AssetsPage() {
    const [assets] = useState<AssetRecord[]>(MOCK_ASSETS);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Үндсэн Хөрөнгө"
                    subtitle="Байгууллагын үндсэн хөрөнгийн бүртгэл, элэгдэл тооцоолол болон хариуцагчийн хяналт"
                    action={{
                        label: "Хөрөнгө нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Value Summary Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Хөрөнгө</h4>
                                <div className="text-2xl font-black">1.2Т ₮</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform shadow-inner"><Building2 size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Эрүүл Мэнд</h4>
                                <div className="text-2xl font-black text-success">98.5%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform shadow-inner"><Shield size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Элэгдэл</h4>
                                <div className="text-2xl font-black text-warning">142М ₮</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform shadow-inner"><TrendingDown size={24} /></div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-2 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Засвартай</h4>
                                <div className="text-2xl font-black text-danger">4</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform shadow-inner"><Activity size={24} /></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Хөрөнгийн нэр, сериал, хариуцагчаар хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black border-border-color/10"><Filter size={18} /> Ангилал</button>
                            <button className="btn btn-primary h-11 px-4 flex items-center gap-2 font-black shadow-lg shadow-primary/20"><QrCode size={18} /> Бараа Тоолох</button>
                        </div>
                    </div>

                    {/* Assets Grid */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {assets.map(asset => (
                            <div key={asset.id} className="card p-6 bg-surface-1 border-none shadow-sm hover-lift group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-surface-2 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform shadow-inner border border-border-color/10">
                                            {asset.category === 'electronics' ? <Laptop size={28} /> :
                                                asset.category === 'vehicle' ? <Truck size={28} /> :
                                                    asset.category === 'furniture' ? <Briefcase size={28} /> : <Building2 size={28} />}
                                        </div>
                                        <div>
                                            <h3 className="text-md font-black group-hover:text-primary transition-colors leading-tight">{asset.name}</h3>
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">{asset.id}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${asset.condition === 'new' ? 'bg-success/10 text-success' :
                                            asset.condition === 'good' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {asset.condition === 'new' ? 'ШИНЭ' : asset.condition === 'good' ? 'ХЭВИЙН' : 'ДУНДАЖ'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1 b-surface-2 p-3 rounded-xl border border-border-color/5">
                                        <div className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1 opacity-70"><User size={12} /> ХАРИУЦАГЧ</div>
                                        <div className="text-sm font-bold truncate">{asset.assignedTo}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-surface-2 p-3 rounded-xl border border-border-color/5">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={10} /> ӨРТӨГ</div>
                                            <div className="text-md font-black">{asset.value.toLocaleString()} ₮</div>
                                        </div>
                                        <div className="bg-surface-2 p-3 rounded-xl border border-border-color/5 border-l-2 border-warning">
                                            <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 flex items-center gap-1 text-warning"><TrendingDown size={10} /> ЭЛЭГДЭЛ</div>
                                            <div className="text-md font-black">{asset.currentValue.toLocaleString()} ₮</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-bold text-muted mt-2">
                                        <Calendar size={14} /> Авсан огноо: {asset.purchaseDate}
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button className="btn btn-ghost flex-1 py-3 text-xs font-black bg-surface-2 rounded-2xl border border-border-color/10 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                        ТҮҮХ <History size={16} />
                                    </button>
                                    <button className="btn btn-ghost flex-1 py-3 text-xs font-black bg-surface-2 rounded-2xl border border-border-color/10 hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                        ХАРАХ <ArrowRightCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Inventory Card */}
                        <div className="card p-6 border-dashed border-2 border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-all min-h-[380px] group">
                            <div className="bg-white p-6 rounded-full text-primary shadow-xl group-hover:scale-110 transition-transform"><CheckCircle2 size={48} /></div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-primary">Хөрөнгийн Тооллого</h3>
                                <p className="text-xs font-bold text-muted mt-1 max-w-[200px]">QR кодоор хөрөнгийн <br />тооллого хийж тайлан гаргах</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] font-black text-muted bg-surface-2 px-3 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> 3 сар дутам</span>
                                <span className="text-[10px] font-black text-success bg-success/10 px-3 py-1 rounded-full flex items-center gap-1"><Plus size={10} /> ЭХЛЭХ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
