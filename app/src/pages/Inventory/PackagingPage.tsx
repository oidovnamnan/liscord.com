import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Box,
    Calculator,
    AlertTriangle,
    Zap,
    TrendingDown,
    Plus,
    Search,
    Filter,
    Layers,
    ShoppingBag,
    Printer,
    Edit3,
    Trash2
} from 'lucide-react';

interface PackagingItem {
    id: string;
    name: string;
    type: 'box' | 'bag' | 'tape' | 'padding';
    dimension: string;
    stock: number;
    minStock: number;
    unitPrice: number;
    unit: string;
}

const MOCK_PACKAGING: PackagingItem[] = [
    {
        id: 'PKG-001',
        name: 'Main Cardboard Box (L)',
        type: 'box',
        dimension: '60x40x40cm',
        stock: 1250,
        minStock: 500,
        unitPrice: 1500,
        unit: 'ш'
    },
    {
        id: 'PKG-002',
        name: 'Small Bubble Mailer',
        type: 'bag',
        dimension: '20x15cm',
        stock: 85,
        minStock: 200,
        unitPrice: 350,
        unit: 'ш'
    },
    {
        id: 'PKG-003',
        name: 'Eco-friendly Paper Bag',
        type: 'bag',
        dimension: '35x25cm',
        stock: 5400,
        minStock: 1000,
        unitPrice: 200,
        unit: 'ш'
    },
    {
        id: 'PKG-004',
        name: 'Branded Packing Tape',
        type: 'tape',
        dimension: '50m roll',
        stock: 12,
        minStock: 20,
        unitPrice: 4500,
        unit: 'roll'
    }
];

export function PackagingPage() {
    const [items] = useState<PackagingItem[]>(MOCK_PACKAGING);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Савлагаа & Материал"
                    subtitle="Бараа савлалтын материал, хайрцаг, уутны нөөц болон өртөг хяналт"
                    action={{
                        label: "Материал бүртгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Packaging Insights */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4 group">
                            <div className="flex justify-between items-center text-primary">
                                <Box size={24} />
                                <span className="bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Хайрцаг</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Хайрцаг</h4>
                                <div className="text-3xl font-black">2,450 <span className="text-sm text-muted font-bold opacity-50 uppercase">ш</span></div>
                            </div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4 group">
                            <div className="flex justify-between items-center text-secondary">
                                <ShoppingBag size={24} />
                                <span className="bg-secondary/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Уут</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Уут</h4>
                                <div className="text-3xl font-black">8,900 <span className="text-sm text-muted font-bold opacity-50 uppercase">ш</span></div>
                            </div>
                        </div>

                        <div className="card p-6 bg-surface-1 border-none shadow-sm flex flex-col gap-4 group">
                            <div className="flex justify-between items-center text-warning">
                                <Calculator size={24} />
                                <span className="bg-warning/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Зардал</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт Өртөг (Сар)</h4>
                                <div className="text-3xl font-black">1.4М <span className="text-sm text-muted font-bold opacity-50 uppercase">₮</span></div>
                            </div>
                        </div>

                        <div className="card p-6 bg-danger/5 border-none shadow-sm flex flex-col gap-4 group border border-danger/20">
                            <div className="flex justify-between items-center text-danger">
                                <AlertTriangle size={24} />
                                <span className="bg-danger/10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Анхааруулга</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нөөц дууссан</h4>
                                <div className="text-3xl font-black text-danger">3</div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="col-12 flex items-center justify-between gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-11 w-full" placeholder="Материалын нэр, хэмжээгээр хайх..." />
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-outline h-11 px-4 flex items-center gap-2 font-black"><Filter size={18} /> Төрөл</button>
                            <button className="btn btn-primary h-11 px-6 flex items-center gap-2 font-black"><Plus size={18} /> Захиалга үүсгэх</button>
                        </div>
                    </div>

                    {/* Packaging Table */}
                    <div className="col-12">
                        <div className="card p-0 bg-surface-1 border-none shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2 border-b border-border-color/10">
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Материал</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Төрөл</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest">Хэмжээ</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Нөөц</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Үнэ</th>
                                        <th className="p-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className="border-b border-border-color/5 hover:bg-surface-2 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-surface-3 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        {item.type === 'box' ? <Box size={20} /> :
                                                            item.type === 'bag' ? <ShoppingBag size={20} /> :
                                                                item.type === 'tape' ? <Zap size={20} /> : <Layers size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-md">{item.name}</div>
                                                        <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{item.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${item.type === 'box' ? 'bg-primary/10 text-primary' :
                                                    item.type === 'bag' ? 'bg-secondary/10 text-secondary' :
                                                        'bg-muted/10 text-muted'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-sm text-muted">{item.dimension}</td>
                                            <td className="p-4 text-right">
                                                <div className={`font-black text-md ${item.stock < item.minStock ? 'text-danger' : 'text-foreground'}`}>
                                                    {item.stock.toLocaleString()} {item.unit}
                                                </div>
                                                {item.stock < item.minStock && (
                                                    <div className="flex items-center justify-end gap-1 text-[10px] font-black text-danger uppercase tracking-widest mt-1">
                                                        <TrendingDown size={10} /> БОСГО ХҮРСЭН
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="font-black text-md">{item.unitPrice.toLocaleString()} ₮</div>
                                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">НЭГЖ ҮНЭ</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="btn btn-ghost p-2 rounded-xl text-primary hover:bg-primary/10"><Edit3 size={18} /></button>
                                                    <button className="btn btn-ghost p-2 rounded-xl text-warning hover:bg-warning/10"><Printer size={18} /></button>
                                                    <button className="btn btn-ghost p-2 rounded-xl text-danger hover:bg-danger/10"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
