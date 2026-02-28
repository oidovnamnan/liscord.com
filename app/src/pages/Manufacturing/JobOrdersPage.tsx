import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Search,
    Filter,
    User,
    Calendar,
    ArrowRight,
    Tag,
    Clock,
    CheckCircle2,
    QrCode,
    Printer,
    ClipboardList
} from 'lucide-react';

interface JobOrder {
    id: string;
    description: string;
    product: string;
    quantity: number;
    assignedTo: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'draft' | 'released' | 'active' | 'completed';
}

const MOCK_JOBS: JobOrder[] = [
    {
        id: 'JO-8821',
        description: 'Үйлдвэрийн тавилгын эсгүүр',
        product: 'Оффисын ширээ ST-20',
        quantity: 20,
        assignedTo: 'Э.Батболд',
        dueDate: '2026-03-05',
        priority: 'high',
        status: 'active'
    },
    {
        id: 'JO-8822',
        description: 'Лакны өмнөх бэлтгэл',
        product: 'Гал тогооны шүүгээ KW-05',
        quantity: 5,
        assignedTo: 'Г.Тулга',
        dueDate: '2026-03-02',
        priority: 'medium',
        status: 'released'
    },
    {
        id: 'JO-8823',
        description: 'Угсралтын шат',
        product: 'Номын тавиур BK-12',
        quantity: 15,
        assignedTo: 'Ч.Зориг',
        dueDate: '2026-03-10',
        priority: 'low',
        status: 'draft'
    }
];

export function JobOrdersPage() {
    const [jobs] = useState<JobOrder[]>(MOCK_JOBS);

    return (
        <HubLayout hubId="manufacturing-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Ажлын Даалгавар (Job Orders)"
                    subtitle="Цехийн ажилчид болон машин механизмын өдөр тутмын үйлдвэрлэлийн даалгавар хянах"
                    action={{
                        label: "Даалгавар үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="flex flex-col gap-6 mt-6">
                    {/* Filters & Search */}
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Даалгаврын дугаар, ажилтан, бүтээгдэхүүнээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">
                            <Filter size={16} className="mr-2" /> Сүүлийн 30 хоног
                        </button>
                        <button className="btn btn-outline h-10 px-4">
                            <Printer size={16} className="mr-2" /> Баркод хэвлэх
                        </button>
                    </div>

                    {/* Job Order Cards/List */}
                    <div className="grid-1 gap-4">
                        {jobs.map(job => (
                            <div key={job.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1">
                                <div className="flex bg-surface-2 p-5 border-b border-border-color/10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-black">{job.id}</span>
                                            <span className={`badge badge-${job.priority === 'high' ? 'danger' : job.priority === 'medium' ? 'warning' : 'outline'}`}>
                                                {job.priority === 'high' ? 'Яаралтай' : job.priority === 'medium' ? 'Энгийн' : 'Бага'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-primary">{job.description}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-ghost bg-surface-3 p-3 rounded-xl border border-border-color/10">
                                            <QrCode size={20} />
                                        </button>
                                        <button className="btn btn-ghost bg-surface-3 p-3 rounded-xl border border-border-color/10">
                                            <Printer size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 grid-12 gap-4 bg-surface-1">
                                    <div className="col-3 flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold tracking-widest uppercase">Бүтээгдэхүүн</span>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <Tag size={12} className="text-muted" /> {job.product}
                                        </div>
                                    </div>
                                    <div className="col-2 flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold tracking-widest uppercase">Тоо ширхэг</span>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <ClipboardList size={12} className="text-muted" /> {job.quantity} ш
                                        </div>
                                    </div>
                                    <div className="col-3 flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold tracking-widest uppercase">Хариуцагч</span>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            <User size={12} className="text-muted" /> {job.assignedTo}
                                        </div>
                                    </div>
                                    <div className="col-2 flex flex-col gap-1">
                                        <span className="text-[10px] text-muted font-bold tracking-widest uppercase">Дуусах хугацаа</span>
                                        <div className="flex items-center gap-2 font-bold text-sm text-danger">
                                            <Clock size={12} className="text-danger" /> {job.dueDate}
                                        </div>
                                    </div>
                                    <div className="col-2 flex flex-col justify-center items-end">
                                        <div className={`badge badge-${job.status === 'active' ? 'primary' : job.status === 'released' ? 'warning' : 'outline'}`} style={{ width: '100%', textAlign: 'center' }}>
                                            {job.status === 'active' ? 'Хийгдэж байна' :
                                                job.status === 'released' ? 'Гаргасан' : 'Ноорог'}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-surface-2 flex justify-between items-center text-xs">
                                    <div className="flex gap-4">
                                        <span className="text-muted flex items-center gap-1 font-bold">
                                            <Calendar size={12} /> 2026-02-27 10:45
                                        </span>
                                        <span className="text-muted flex items-center gap-1 font-bold">
                                            <CheckCircle2 size={12} /> ШАТ: ЭСГҮҮР (2/5)
                                        </span>
                                    </div>
                                    <button className="btn btn-link btn-xs flex items-center gap-2 p-0 h-auto font-black text-primary">
                                        Бүх шатлал харах <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
