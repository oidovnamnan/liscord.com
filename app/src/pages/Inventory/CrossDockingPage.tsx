import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Zap,
    Search,
    Filter,
    ArrowRight,
    Package,
    Clock,
    Layout,
    Share2,
    MoreVertical,
    CheckCircle2,
    Navigation,
    Database,
    AlertCircle,
    Layers,
    Flag,
    Calendar
} from 'lucide-react';

interface CrossDockBatch {
    id: string;
    origin: string;
    destination: string;
    status: 'arrived' | 'sorting' | 'dispatched' | 'pending';
    itemCount: number;
    arrivalDate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

const MOCK_BATCHES: CrossDockBatch[] = [
    {
        id: 'CD-1001',
        origin: 'Factory A',
        destination: 'Hub-01 (South)',
        status: 'arrived',
        itemCount: 450,
        arrivalDate: '2026-02-28 09:30',
        priority: 'high'
    },
    {
        id: 'CD-1002',
        origin: 'Vendor X',
        destination: 'Hub-02 (North)',
        status: 'sorting',
        itemCount: 120,
        arrivalDate: '2026-02-28 10:45',
        priority: 'critical'
    },
    {
        id: 'CD-1003',
        origin: 'Import Port',
        destination: 'Main Warehouse',
        status: 'pending',
        itemCount: 890,
        arrivalDate: '2026-03-01 08:00',
        priority: 'medium'
    }
];

export function CrossDockingPage() {
    const [batches] = useState<CrossDockBatch[]>(MOCK_BATCHES);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Хурдан Түгээлт (Cross-Docking)"
                    subtitle="Барааг агуулахад хадгалахгүйгээр шууд ангилж, түгээлт рүү шилжүүлэх үйл явц"
                    action={{
                        label: "Багц үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт багц</h4>
                                <div className="text-3xl font-black text-primary">24</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Layers size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Одоо ангилж буй</h4>
                                <div className="text-3xl font-black text-secondary">8</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дундаж хүлээлт</h4>
                                <div className="text-3xl font-black text-warning">45м</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Efficiency</h4>
                                <div className="text-xl font-black text-white">FAST TRACK ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Багц, эх сурвалж, хүрэх цэгээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төрөл</button>
                    </div>

                    {/* Batches Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">Багц / Огноо</th>
                                    <th>Эх сурвалж</th>
                                    <th>Хүрэх цэг</th>
                                    <th>Тоо ширхэг</th>
                                    <th>Төлөв</th>
                                    <th>Эрэмбэ</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map(batch => (
                                    <tr key={batch.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-sm tracking-widest">{batch.id}</div>
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <Calendar size={10} /> {batch.arrivalDate}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                <Navigation size={10} className="mr-1" /> {batch.origin}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                <Flag size={10} className="mr-1" /> {batch.destination}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Package size={14} className="text-muted" />
                                                <span className="text-sm font-black">{batch.itemCount}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${batch.status === 'dispatched' ? 'success' :
                                                    batch.status === 'sorting' ? 'warning' :
                                                        batch.status === 'arrived' ? 'primary' : 'secondary'
                                                }`}>
                                                {batch.status === 'dispatched' ? 'ТҮГЭЭГДСЭН' :
                                                    batch.status === 'sorting' ? 'АНГИЛЖ БУЙ' :
                                                        batch.status === 'arrived' ? 'ИРСЭН' : 'ХҮЛЭЭГДЭЖ БУЙ'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${batch.priority === 'critical' ? 'text-danger' :
                                                    batch.priority === 'high' ? 'text-primary' : 'text-muted'
                                                }`}>
                                                {batch.priority === 'critical' ? <AlertCircle size={12} /> : null} {batch.priority}
                                            </div>
                                        </td>
                                        <td className="pr-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="btn btn-ghost p-2 rounded-xl group-hover:text-primary transition-colors"><MoreVertical size={18} /></button>
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

                    {/* Sorting Automation Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Layout size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Ангилах Систем (Sorter Sync)</h3>
                                <p className="text-sm text-muted">Туузан дамжуулагч болон автомат ангилах төхөөрөмжтэй холбогдож бодит хугацаанд хянах.</p>
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
