import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Ship, Plane, Globe, Search, MoreHorizontal, ChevronRight, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FreightPage() {
    const [view, setView] = useState<'list' | 'tracking'>('list');

    const mockShipments = [
        { id: '1', number: 'F-2026-001', mode: 'sea', origin: 'Xingang, China', destination: 'Ulaanbaatar, MN', status: 'at_port', date: '2026-03-15' },
        { id: '2', number: 'F-2026-002', mode: 'air', origin: 'Incheon, Korea', destination: 'Ulaanbaatar, MN', status: 'shipped', date: '2026-02-28' },
    ];

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; cls: string }> = {
            'shipped': { label: 'Ачигдсан', cls: 'badge-shipping' },
            'at_port': { label: 'Боомт дээр', cls: 'badge-preparing' },
            'customs': { label: 'Гааль дээр', cls: 'badge-confirmed' },
            'arrived': { label: 'Ирсэн', cls: 'badge-delivered' },
        };
        const s = config[status] || { label: status, cls: 'badge-preparing' };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
    };

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Олон Улсын Тээвэр"
                subtitle="Далай, агаар болон авто тээврийн аялалуудыг хянах"
                action={{
                    label: "Шинэ тээвэр бүртгэх",
                    onClick: () => toast('Шинэ тээвэр бүртгэх хэсэг удахгүй...')
                }}
            />

            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="flex gap-4">
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4">
                        <div className="p-3 bg-primary-light rounded-lg text-primary"><Ship size={24} /></div>
                        <div>
                            <div className="text-xl font-bold">12</div>
                            <div className="text-xs text-muted">Далайн тээвэр</div>
                        </div>
                    </div>
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4">
                        <div className="p-3 bg-secondary-light rounded-lg text-secondary"><Plane size={24} /></div>
                        <div>
                            <div className="text-xl font-bold">5</div>
                            <div className="text-xs text-muted">Агаарын тээвэр</div>
                        </div>
                    </div>
                    <div className="card flex-1 p-4 bg-surface-1 flex items-center gap-4">
                        <div className="p-3 bg-success-light rounded-lg text-success"><Globe size={24} /></div>
                        <div>
                            <div className="text-xl font-bold">₮84.2M</div>
                            <div className="text-xs text-muted">Нийт тээвэрлэлтийн үнэ</div>
                        </div>
                    </div>
                </div>

                <div className="card p-0">
                    <div className="p-4 border-b flex justify-between items-center">
                        <div className="search-wrap flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input type="text" className="input pl-10" placeholder="Билл дугаар, контейнер дугаар..." />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm">Шүүлтүүр</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="p-4 text-left">Тээврийн №</th>
                                    <th className="p-4 text-left">Төрөл</th>
                                    <th className="p-4 text-left">Маршрут</th>
                                    <th className="p-4 text-left">Төлөв</th>
                                    <th className="p-4 text-left">Төлөвлөсөн огноо</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockShipments.map(s => (
                                    <tr key={s.id} className="hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => setView('tracking')}>
                                        <td className="p-4 font-bold">{s.number}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {s.mode === 'sea' ? <Ship size={14} className="text-primary" /> : <Plane size={14} className="text-secondary" />}
                                                <span className="capitalize">{s.mode}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span>{s.origin}</span>
                                                <ChevronRight size={12} className="text-muted" />
                                                <span>{s.destination}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{getStatusBadge(s.status)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                <Calendar size={14} /> {s.date}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="btn btn-ghost btn-sm"><MoreHorizontal size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {view === 'tracking' && (
                    <div className="tracking-timeline card p-6 mt-4 border-l-4 border-l-primary animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="m-0">Тээвэрлэлтийн түүх: F-2026-001</h3>
                            <button className="btn btn-sm btn-ghost" onClick={() => setView('list')}>Хаах</button>
                        </div>
                        <div className="flex flex-col gap-6 relative">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-color"></div>

                            {[
                                { status: 'At Port', loc: 'Tianjin Port', date: '2026-02-15 10:20', done: true },
                                { status: 'Departed', loc: 'Tianjin Port', date: '2026-02-16 14:00', done: true },
                                { status: 'Arrival at Custom', loc: 'Erenhot', date: '2026-02-25 09:00', done: false },
                                { status: 'Delivered', loc: 'Ulaanbaatar Hub', date: 'TBD', done: false },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-start relative z-10">
                                    <div className={`w-4 h-4 rounded-full mt-1.5 ${step.done ? 'bg-primary' : 'bg-surface-3 border-2 border-border-color'}`}></div>
                                    <div>
                                        <div className={`font-bold ${step.done ? 'text-primary' : 'text-muted'}`}>{step.status}</div>
                                        <div className="text-xs text-muted flex items-center gap-1"><MapPin size={10} /> {step.loc} • {step.date}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
