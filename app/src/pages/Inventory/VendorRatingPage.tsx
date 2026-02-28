import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Star,
    Search,
    Zap,
    ArrowRight,
    Filter,
    Clock,
    Database,
    Activity,
    ShieldCheck,
    ThumbsUp,
    ThumbsDown,
    AlertCircle,
    Share2,
    Target
} from 'lucide-react';

interface VendorRating {
    id: string;
    name: string;
    category: string;
    rating: number;
    deliveryTime: string;
    qualityScore: number;
    status: 'preferred' | 'standard' | 'watch-list' | 'blocked';
}

const MOCK_RATINGS: VendorRating[] = [
    {
        id: 'VEN-001',
        name: 'Tech Supplier Co.',
        category: 'Electronics',
        rating: 4.8,
        deliveryTime: '2.5 days',
        qualityScore: 98,
        status: 'preferred'
    },
    {
        id: 'VEN-002',
        name: 'Global Logistics',
        category: 'Freight',
        rating: 4.2,
        deliveryTime: '5.0 days',
        qualityScore: 85,
        status: 'standard'
    },
    {
        id: 'VEN-003',
        name: 'Standard Mart',
        category: 'General Goods',
        rating: 2.5,
        deliveryTime: '12 days',
        qualityScore: 45,
        status: 'watch-list'
    }
];

export function VendorRatingPage() {
    const [ratings] = useState<VendorRating[]>(MOCK_RATINGS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Нийлүүлэгчийн Үнэлгээ (Vendor Rating)"
                    subtitle="Нийлүүлэгчдийн бараа нийлүүлэлтийн хугацаа, чанар болон хамтын ажиллагааны гүйцэтгэлийн оноо"
                    action={{
                        label: "Үнэлгээ шинэчлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт нийлүүлэгч</h4>
                                <div className="text-3xl font-black text-primary">48</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж оноо</h4>
                                <div className="text-3xl font-black text-secondary">4.2</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Star size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Эрсдэлтэй</h4>
                                <div className="text-3xl font-black text-danger">3</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertCircle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI Scoring</h4>
                                <div className="text-xl font-black">PREDICTIVE SCORE ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Нийлүүлэгчийн нэр, төрлөөр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Ангилал</button>
                    </div>

                    {/* Vendor Ratings Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Нийлүүлэгч</th>
                                    <th>Ангилал</th>
                                    <th>Оноо (1-5)</th>
                                    <th>Нийлүүлэх хугацаа</th>
                                    <th>Чанарын оноо %</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ratings.map(r => (
                                    <tr key={r.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-surface-2 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-all shadow-inner border border-border-color/10">
                                                    {r.status === 'preferred' ? <ShieldCheck size={20} className="text-success" /> : <Database size={20} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-sm">{r.name}</div>
                                                    <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 font-mono">{r.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color/20">
                                                {r.category}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-black text-primary">{r.rating}</span>
                                                <div className="flex text-warning">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} fill={i < Math.floor(r.rating) ? 'currentColor' : 'none'} className={i < Math.floor(r.rating) ? 'text-warning' : 'text-muted/20'} />
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest">
                                                <Clock size={12} /> {r.deliveryTime}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-surface-2 rounded-full overflow-hidden border border-border-color/5">
                                                    <div className={`h-full rounded-full ${r.qualityScore > 80 ? 'bg-success' : r.qualityScore > 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${r.qualityScore}%` }} />
                                                </div>
                                                <span className="text-xs font-black">{r.qualityScore}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${r.status === 'preferred' ? 'success' :
                                                    r.status === 'watch-list' ? 'danger' :
                                                        r.status === 'blocked' ? 'danger' : 'secondary'
                                                }`}>
                                                {r.status === 'preferred' ? 'ДАВУУ ЭРХТ' :
                                                    r.status === 'watch-list' ? 'АНХААРАХ' :
                                                        r.status === 'blocked' ? 'ХААГДСАН' : 'ХЭВИЙН'}
                                            </span>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2 text-muted">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors hover:bg-surface-3">{r.qualityScore > 80 ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}</button>
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

                    {/* Sourcing Performance Alert / Action */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Target size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Supply Chain Performance (BI)</h3>
                                <p className="text-sm text-muted">Нийлүүлэгчдийн түүхэн өгөгдөл дээр үндэслэн хамгийн оновчтой нийлүүлэлтийн сувгийг сонгох зөвлөмж.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТАЙЛАН ХАРАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
