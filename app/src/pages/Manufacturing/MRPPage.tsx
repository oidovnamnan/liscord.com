import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    TrendingUp,
    AlertCircle,
    ArrowRight,
    Package,
    Layers,
    ClipboardList,
    CheckCircle2,
    Cpu
} from 'lucide-react';

interface MRPRequirement {
    id: string;
    item: string;
    description: string;
    requiredQty: number;
    availableQty: number;
    shortage: number;
    leadTime: string;
    status: 'on-track' | 'warning' | 'critical';
}

const MOCK_REQUIREMENTS: MRPRequirement[] = [
    {
        id: 'MRP-001',
        item: 'Модны бэлдэц (S)',
        description: 'Хатаасан нарс мод',
        requiredQty: 500,
        availableQty: 120,
        shortage: 380,
        leadTime: '5 хоног',
        status: 'critical'
    },
    {
        id: 'MRP-002',
        item: 'Төмөр нугас',
        description: 'Зэвэрдэггүй ган',
        requiredQty: 200,
        availableQty: 180,
        shortage: 20,
        leadTime: '2 хоног',
        status: 'warning'
    },
    {
        id: 'MRP-003',
        item: 'Лак / Будаг',
        description: 'Эко-лак (Glossy)',
        requiredQty: 50,
        availableQty: 65,
        shortage: 0,
        leadTime: '3 хоног',
        status: 'on-track'
    }
];

export function MRPPage() {
    const [requirements] = useState<MRPRequirement[]>(MOCK_REQUIREMENTS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Материал Төлөвлөлт (MRP)"
                    subtitle="Түүхий эдийн хэрэгцээ, үлдэгдэл болон нийлүүлэлтийн таамаглал"
                    action={{
                        label: "AI Таамаглал ажиллуулах",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Stats */}
                    <div className="col-3 card p-5 flex items-center gap-4 bg-primary-light border-none">
                        <div className="icon-wrap bg-primary p-3 rounded-xl text-white">
                            <Layers size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-primary mb-1 font-semibold">Нийт зүйлс</div>
                            <div className="text-2xl font-bold">124</div>
                        </div>
                    </div>

                    <div className="col-3 card p-5 flex items-center gap-4 bg-danger-light border-none">
                        <div className="icon-wrap bg-danger p-3 rounded-xl text-white">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-danger mb-1 font-semibold">Дутагдалтай</div>
                            <div className="text-2xl font-bold">12</div>
                        </div>
                    </div>

                    <div className="col-3 card p-5 flex items-center gap-4 bg-warning-light border-none">
                        <div className="icon-wrap bg-warning p-3 rounded-xl text-white">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-warning mb-1 font-semibold">Ирэх долоо хоногт</div>
                            <div className="text-2xl font-bold">+85%</div>
                        </div>
                    </div>

                    <div className="col-3 card p-5 flex items-center gap-4 bg-success-light border-none">
                        <div className="icon-wrap bg-success p-3 rounded-xl text-white">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-success mb-1 font-semibold">Оновчлол</div>
                            <div className="text-2xl font-bold">Төгс</div>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-surface-2">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <ClipboardList size={16} /> Хэрэгцээний тооцоолол
                            </h3>
                            <div className="flex gap-2">
                                <span className="badge badge-outline">Сүүлийн шинэчлэл: Саяхан</span>
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Материал</th>
                                        <th>Шаардлагатай</th>
                                        <th>Одоо байгаа</th>
                                        <th>Дутагдал</th>
                                        <th>Хугацаа</th>
                                        <th>Төлөв</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-surface-3 p-2 rounded-lg">
                                                        <Package size={16} className="text-muted" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{req.item}</div>
                                                        <div className="text-xs text-muted">{req.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="font-semibold">{req.requiredQty} ш</td>
                                            <td>{req.availableQty} ш</td>
                                            <td className={req.shortage > 0 ? 'text-danger font-bold' : ''}>
                                                {req.shortage > 0 ? `-${req.shortage} ш` : 'Дутагдалгүй'}
                                            </td>
                                            <td>{req.leadTime}</td>
                                            <td>
                                                <span className={`badge badge-${req.status}`}>
                                                    {req.status === 'critical' ? 'Нэн яаралтай' :
                                                        req.status === 'warning' ? 'Анхаарах' : 'Хэвийн'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm">
                                                    Захиалах <ArrowRight size={14} className="ml-2" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AI Suggestions Sidebar/Section */}
                    <div className="col-12 card p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Cpu className="text-primary animate-pulse" />
                            <h3 className="text-lg font-bold">AI Таамаглал & Оновчлол</h3>
                        </div>
                        <p className="text-muted mb-4 max-w-2xl">
                            Таны үйлдвэрлэлийн сүүлийн 3 сарын түүх болон ирж буй захиалгууд дээр үндэслэн
                            дараах материалуудад нөөц бүрдүүлэхийг зөвлөж байна.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-surface-1 p-4 rounded-xl border border-dashed border-primary/30">
                                <div className="font-bold mb-1">Нийлүүлэлтийн гинжин хэлхээ</div>
                                <div className="text-sm text-muted">Тээвэрлэлтийн саатал гарах магадлал: 12%</div>
                            </div>
                            <div className="flex-1 bg-surface-1 p-4 rounded-xl border border-dashed border-primary/30">
                                <div className="font-bold mb-1">Зардал хэмнэлт</div>
                                <div className="text-sm text-muted">Бөөний худалдан авалтаар $1,200 хэмнэх боломжтой.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
