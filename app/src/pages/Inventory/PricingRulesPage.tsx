import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Scissors,
    Search,
    Zap,
    ArrowRight,
    Filter,
    Target,
    Calendar,
    Database,
    Share2,
    ArrowRightLeft,
    CheckCircle2,
    AlertCircle,
    Layers,
    Play
} from 'lucide-react';

interface PricingRule {
    id: string;
    name: string;
    type: 'discount' | 'surcharge' | 'seasonal' | 'bulk';
    status: 'active' | 'scheduled' | 'expired';
    value: string;
    target: string;
}

const MOCK_RULES: PricingRule[] = [
    {
        id: 'PR-401',
        name: 'Spring Sale 20% Off',
        type: 'seasonal',
        status: 'active',
        value: '-20%',
        target: 'All Categories'
    },
    {
        id: 'PR-402',
        name: 'Bulk Purchase Bonus',
        type: 'bulk',
        status: 'active',
        value: '-5%',
        target: 'Units > 100'
    },
    {
        id: 'PR-403',
        name: 'Logistics Surcharge',
        type: 'surcharge',
        status: 'scheduled',
        value: '+5,000₮',
        target: 'Oversized Items'
    }
];

export function PricingRulesPage() {
    const [rules] = useState<PricingRule[]>(MOCK_RULES);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Үнийн Бодлого (Pricing Rules)"
                    subtitle="Хөнгөлөлт, урамшуулал, улирлын чанартай үнийн өөрчлөлт болон автомат дүрэм"
                    action={{
                        label: "Шинэ дүрэм",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт дүрэм</h4>
                                <div className="text-3xl font-black text-primary">15</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Идэвхтэй</h4>
                                <div className="text-3xl font-black text-success">6</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Төлөвлөсөн</h4>
                                <div className="text-3xl font-black text-warning">4</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Calendar size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Dynamic Pricing</h4>
                                <div className="text-xl font-black">SYSTEM LIVE</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Target size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Дүрмийн нэр, төрөл хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Суваг</button>
                    </div>

                    {/* Rules Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Дүрмийн нэр</th>
                                    <th>Төрөл</th>
                                    <th>Хэрэгжих утга</th>
                                    <th>Хамрах хүрээ</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner border border-border-color/10">
                                                    {rule.type === 'discount' ? <Scissors size={20} /> :
                                                        rule.type === 'surcharge' ? <ArrowRightLeft size={20} /> : <Play size={20} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm tracking-tight">{rule.name}</div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{rule.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                {rule.type}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`text-sm font-black ${rule.type === 'discount' || rule.type === 'seasonal' ? 'text-danger' : 'text-primary'}`}>
                                                {rule.value}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest">
                                                <Database size={10} /> {rule.target}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${rule.status === 'active' ? 'success' :
                                                    rule.status === 'scheduled' ? 'warning' : 'secondary'
                                                }`}>
                                                {rule.status === 'active' ? 'ИДЭВХТЭЙ' :
                                                    rule.status === 'scheduled' ? 'ТӨЛӨВЛӨСӨН' : 'ДУУССАН'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><AlertCircle size={18} /></button>
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

                    {/* AI Dynamic Pricing Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Target size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">AI Суурьтай Динамик Үнэ</h3>
                                <p className="text-sm text-muted">Өрсөлдөгчдийн үнэ болон эрэлт дээр үндэслэн үнийг автоматаар өөрчлөх систем.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">СИСТЕМ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
