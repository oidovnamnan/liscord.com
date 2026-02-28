import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Calculator,
    Search,
    Zap,
    ArrowRight,
    Globe,
    Truck,
    RefreshCw,
    Download,
    Activity,
    Landmark,
    ClipboardList,
    TrendingUp
} from 'lucide-react';

interface LandedCost {
    id: string;
    product: string;
    fobPrice: number;
    shipping: number;
    duty: number;
    totalCost: number;
    margin: number;
    status: 'calculated' | 'approved' | 'draft';
}

const MOCK_COSTS: LandedCost[] = [
    {
        id: 'LC-001',
        product: 'Liscord POS Terminal X1',
        fobPrice: 450,
        shipping: 45,
        duty: 22.5,
        totalCost: 517.5,
        margin: 35,
        status: 'approved'
    },
    {
        id: 'LC-002',
        product: 'Industrial Laser Cutter',
        fobPrice: 12500,
        shipping: 1200,
        duty: 625,
        totalCost: 14325,
        margin: 42,
        status: 'calculated'
    },
    {
        id: 'LC-003',
        product: 'Standard Battery Pack',
        fobPrice: 12,
        shipping: 2.5,
        duty: 0.6,
        totalCost: 15.1,
        margin: 28,
        status: 'draft'
    }
];

export function ImportCostPage() {
    const [costs] = useState<LandedCost[]>(MOCK_COSTS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Өртөг Тооцоолол (Landed Cost)"
                    subtitle="Импортын барааны анхны үнэ, тээвэр, татвар болон бусад зардлыг нэгтгэсэн бодит өртөг тооцоолох"
                    action={{
                        label: "Шинэ тооцоолол",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тооцоолол</h4>
                                <div className="text-3xl font-black text-primary">45</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Calculator size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Валютын ханш</h4>
                                <div className="text-3xl font-black text-secondary">3,450₮</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж ашиг</h4>
                                <div className="text-3xl font-black text-warning">32%</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI COGS</h4>
                                <div className="text-xl font-black">AUTO-LANDED ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Бүтээгдэхүүн, тооцооллын ID хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Сүүлийнх</button>
                    </div>

                    {/* Landed Cost Table */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Бүтээгдэхүүн / ID</th>
                                    <th>FOB Үнэ (USD)</th>
                                    <th>Тээвэр & Логистик</th>
                                    <th>Татвар & Гааль</th>
                                    <th>Нийт өртөг (Landed)</th>
                                    <th>Ашиг %</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costs.map(cost => (
                                    <tr key={cost.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-sm tracking-tight">{cost.product}</div>
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{cost.id}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-muted">${cost.fobPrice.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest">
                                                <Truck size={12} className="text-primary" /> ${cost.shipping.toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-warning uppercase tracking-widest">
                                                <Landmark size={12} className="text-warning" /> ${cost.duty.toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-primary-dark tracking-tighter">${cost.totalCost.toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black text-success border-success/20">
                                                +{cost.margin}%
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${cost.status === 'approved' ? 'success' :
                                                cost.status === 'calculated' ? 'primary' : 'secondary'
                                                }`}>
                                                {cost.status === 'approved' ? 'БАТАЛГААЖСАН' :
                                                    cost.status === 'calculated' ? 'ТООЦОЖ ДУУССАН' : 'НООРОГ'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><Download size={18} /></button>
                                                <button className="btn btn-primary p-2 h-10 w-10 rounded-xl shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Custom Tax Config Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><ClipboardList size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Гаалийн тарифын тохиргоо (HS Codes)</h3>
                                <p className="text-sm text-muted">Барааны HS кодыг ашиглан гааль, НӨАТ болон бусад татварыг автоматаар тохируулах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТАРИФ ТОХИРУУЛАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><RefreshCw size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
