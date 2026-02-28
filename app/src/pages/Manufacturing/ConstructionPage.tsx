import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Truck,
    Layers,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Warehouse,
    TrendingUp,
    LayoutGrid
} from 'lucide-react';

interface Material {
    id: string;
    item: string;
    description: string;
    requiredQty: number;
    deliveredQty: number;
    status: 'pending' | 'delivered' | 'partial';
}

const MOCK_MATERIALS: Material[] = [
    {
        id: 'MAT-501',
        item: 'Цемент (Premium)',
        description: 'Портланд цемент 40кг',
        requiredQty: 500,
        deliveredQty: 250,
        status: 'partial'
    },
    {
        id: 'MAT-502',
        item: 'Төмөр арматур',
        description: 'Ф12 арматур (12м)',
        requiredQty: 200,
        deliveredQty: 200,
        status: 'delivered'
    },
    {
        id: 'MAT-503',
        item: 'Элс',
        description: 'Цэвэр элс (Бөөний)',
        requiredQty: 10,
        deliveredQty: 4,
        status: 'partial'
    }
];

export function ConstructionPage() {
    const [materials] = useState<Material[]>(MOCK_MATERIALS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Барилга (Construction)"
                    subtitle="Барилгын талбайн удирдлага, материалын зарцуулалт, гүйцэтгэл хянах"
                    action={{
                        label: "Талбайн мэдээ",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Site Status Dashboard */}
                    <div className="col-12 card p-6 bg-surface-2 overflow-hidden relative border-none">
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="text-primary animate-bounce-subtle" />
                            <h3 className="text-xl font-black">Хаус-20 Төсөл (Зайсанд) - ТАЛБАЙ #12</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-12">
                            <div className="flex flex-col gap-1 items-center bg-surface-3 p-4 rounded-2xl">
                                <span className="text-[10px] text-muted font-black tracking-widest uppercase">Талбайн ажилчид</span>
                                <span className="text-4xl font-black text-secondary">42</span>
                            </div>
                            <div className="flex flex-col gap-1 items-center bg-surface-3 p-4 rounded-2xl">
                                <span className="text-[10px] text-muted font-black tracking-widest uppercase">Материалын явц</span>
                                <span className="text-4xl font-black text-success">65.2%</span>
                            </div>
                            <div className="flex flex-col gap-1 items-center bg-surface-3 p-4 rounded-2xl">
                                <span className="text-[10px] text-muted font-black tracking-widest uppercase">Хяналтын алдаа</span>
                                <span className="text-4xl font-black text-danger">0</span>
                            </div>
                            <div className="flex flex-col gap-1 items-center bg-surface-3 p-4 rounded-2xl">
                                <span className="text-[10px] text-muted font-black tracking-widest uppercase">Цаг агаар (Today)</span>
                                <span className="text-4xl font-black text-warning font-black">-12°C</span>
                            </div>
                        </div>
                    </div>

                    {/* Left: Material Tracking */}
                    <div className="col-8 card p-0 overflow-hidden shadow-lg border-none bg-surface-1">
                        <div className="p-5 border-b flex justify-between items-center bg-surface-2">
                            <h3 className="text-sm font-black flex items-center gap-2 tracking-widest uppercase">
                                <Warehouse size={18} className="text-primary" /> Материалын ханган нийлүүлэлт
                            </h3>
                            <button className="btn btn-ghost p-1"><LayoutGrid size={16} /></button>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Материал</th>
                                        <th>Шаардлагатай</th>
                                        <th>Хүлээж авсан</th>
                                        <th>Үлдэгдэл</th>
                                        <th>Төлөв</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materials.map(mat => (
                                        <tr key={mat.id} className="hover:bg-surface-2 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-surface-3 p-3 rounded-2xl text-muted font-black">
                                                        <Layers size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm">{mat.item}</div>
                                                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest">{mat.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="font-black">{mat.requiredQty}</td>
                                            <td className="font-black text-primary">{mat.deliveredQty}</td>
                                            <td className="font-bold text-muted">{mat.requiredQty - mat.deliveredQty}</td>
                                            <td>
                                                <span className={`badge badge-${mat.status === 'delivered' ? 'success' : mat.status === 'partial' ? 'warning' : 'outline'} font-black px-3`}>
                                                    {mat.status === 'delivered' ? 'Бүрэн' :
                                                        mat.status === 'partial' ? 'Дутуу' : 'Хүлээгдэж буй'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost p-2 opacity-50 hover:opacity-100 hover:text-primary transition-all">
                                                    <Truck size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Site Logs & Safety */}
                    <div className="col-4 flex flex-col gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="text-warning animate-pulse" />
                                <h3 className="text-lg font-black uppercase tracking-widest">Аюулгүй ажиллагаа</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-surface-3 rounded-2xl border border-border-color/10">
                                    <div className="text-sm font-bold flex-1">Дуулга хамгаалалт хэрэглэх</div>
                                    <button className="btn btn-ghost p-1 text-success"><CheckCircle2 size={16} /></button>
                                </div>
                                <div className="flex gap-4 p-4 bg-surface-3 rounded-2xl border border-border-color/10">
                                    <div className="text-sm font-bold flex-1">Оройн ээлжийн гэрэлтүүлэг</div>
                                    <button className="btn btn-ghost p-1 text-success"><CheckCircle2 size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 border-none shadow-lg bg-primary text-white">
                            <h3 className="text-lg font-black mb-1">Гүйцэтгэлийн Тайлан</h3>
                            <p className="text-xs opacity-70 mb-4">Өнөөдрийн байдлаар төлөвлөсөн ажил 104% гүйцэтгэлтэй байна.</p>
                            <button className="btn btn-outline border-white text-white hover:bg-white hover:text-primary font-black py-3 rounded-xl flex items-center justify-center gap-2">
                                Тайлан харах <TrendingUp size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </HubLayout>
    );
}
