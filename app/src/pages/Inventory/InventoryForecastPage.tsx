import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    LineChart,
    Search,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    BrainCircuit,
    Activity,
    Database,
    ArrowRightLeft,
    CheckCircle2,
    RefreshCw,
    Share2,
    AlertTriangle,
    Layers
} from 'lucide-react';

interface ForecastData {
    id: string;
    product: string;
    currentStock: number;
    predictedDemand: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    recommendation: string;
}

const MOCK_FORECASTS: ForecastData[] = [
    {
        id: 'F-101',
        product: 'Liscord POS Terminal X1',
        currentStock: 45,
        predictedDemand: 120,
        confidence: 94,
        trend: 'up',
        recommendation: 'Order 80 units'
    },
    {
        id: 'F-102',
        product: 'Wireless Keyboard K1',
        currentStock: 250,
        predictedDemand: 150,
        confidence: 88,
        trend: 'down',
        recommendation: 'Reduce reorder'
    },
    {
        id: 'F-103',
        product: 'Standard Battery Pack',
        currentStock: 12,
        predictedDemand: 80,
        confidence: 96,
        trend: 'up',
        recommendation: 'Urgent buy!'
    }
];

export function InventoryForecastPage() {
    const [forecasts] = useState<ForecastData[]>(MOCK_FORECASTS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Нөөцийн Таамаглал (AI Inventory)"
                    subtitle="Хиймэл оюун ухаан ашиглан борлуулалт, нөөцийн хэрэгцээг урьдчилан таамаглах"
                    action={{
                        label: "Модел шинэчлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нарийвчлал</h4>
                                <div className="text-3xl font-black text-primary">94.2%</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дутагдах эрсдэл</h4>
                                <div className="text-3xl font-black text-danger">12</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Илүүдэл нөөц</h4>
                                <div className="text-3xl font-black text-warning">8</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <BrainCircuit size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Engine</h4>
                                <div className="text-xl font-black">L-FORECAST V4</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Бараа хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Бүх Ангилал</button>
                    </div>

                    {/* Predictions Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Бүтээгдэхүүн</th>
                                    <th>Одоогийн нөөц</th>
                                    <th>Таамаглаж буй (30 хоног)</th>
                                    <th>Трэндийн төрөл</th>
                                    <th>Найдвартай байдал %</th>
                                    <th>AI Зөвлөмж</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forecasts.map(f => (
                                    <tr key={f.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner border border-border-color/10">
                                                    <LineChart size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm tracking-tight">{f.product}</div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{f.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                <Database size={10} className="mr-1" /> {f.currentStock} ш
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-secondary">{f.predictedDemand} ш</div>
                                        </td>
                                        <td>
                                            <div className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest ${f.trend === 'up' ? 'text-danger' : f.trend === 'down' ? 'text-success' : 'text-muted'
                                                }`}>
                                                {f.trend === 'up' ? <TrendingUp size={14} /> :
                                                    f.trend === 'down' ? <TrendingDown size={14} /> : <ArrowRightLeft size={14} />}
                                                {f.trend}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-black text-primary">{f.confidence}%</div>
                                        </td>
                                        <td>
                                            <div className="text-xs font-bold text-muted italic">{f.recommendation}</div>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><RefreshCw size={18} /></button>
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

                    {/* Machine Learning Insight */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><BrainCircuit size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">AI Сургалтын Өгөгдөл</h3>
                                <p className="text-sm text-muted">Сүүлийн 2 жилийн борлуулалтын түүх болон гадаад нөлөөллүүд дээр үндэслэн таамаглалыг сайжруулсан.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ӨГӨГДӨЛ ОРУУЛАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
