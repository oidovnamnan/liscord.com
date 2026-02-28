import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Star, ShieldCheck, Clock, DollarSign, Award, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function VendorRatingPage() {
    const vendors = [
        { id: '1', name: 'M-Express', score: 4.8, count: 124, price: 5, speed: 4, safety: 5, status: 'preferred' },
        { id: '2', name: 'Global Logistics', score: 4.2, count: 56, price: 3, speed: 5, safety: 4, status: 'active' },
        { id: '3', name: 'Fast Track', score: 3.5, count: 22, price: 2, speed: 5, safety: 2, status: 'under_review' },
    ];

    const renderStars = (score: number) => {
        return (
            <div className="flex gap-0.5 text-warning">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} fill={i <= Math.floor(score) ? 'currentColor' : 'none'} />
                ))}
            </div>
        );
    };

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Тээвэрлэгчийн Үнэлгээ"
                subtitle="Гадаад болон дотоод тээврийн компаниудын гүйцэтгэлийн мониторинг"
                action={{
                    label: "Үнэлгээ нэмэх",
                    onClick: () => toast('Үнэлгээний форм удахгүй...')
                }}
            />

            <div className="page-content mt-6 flex flex-col gap-6">
                <div className="grid-3 gap-6">
                    <div className="card p-5 bg-surface-1 flex flex-col gap-2 border-b-4 border-b-success">
                        <div className="text-xs text-muted uppercase font-bold tracking-wider">Шилдэг тээвэрлэгч</div>
                        <div className="flex items-center gap-2">
                            <Award className="text-warning" />
                            <span className="text-lg font-bold">M-Express</span>
                        </div>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b bg-surface-2 flex justify-between items-center">
                        <h3 className="m-0 text-sm font-bold uppercase text-muted">Тээвэрлэгчдийн жагсаалт</h3>
                        <button className="btn btn-ghost btn-sm"><Filter size={14} /> Шүүх</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="text-left bg-surface-1 text-xs uppercase text-muted">
                                    <th className="p-4">Компани</th>
                                    <th className="p-4">Нийт оноо</th>
                                    <th className="p-4">Үнэ</th>
                                    <th className="p-4">Хурд</th>
                                    <th className="p-4">Аюулгүй байдал</th>
                                    <th className="p-4">Төлөв</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map(v => (
                                    <tr key={v.id} className="border-b hover:bg-surface-2 transition-colors">
                                        <td className="p-4 flex flex-col">
                                            <span className="font-bold">{v.name}</span>
                                            <span className="text-xs text-muted">{v.count} аялал хийсэн</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold">{v.score}</span>
                                                {renderStars(v.score)}
                                            </div>
                                        </td>
                                        <td className="p-4"><div className="flex gap-0.5 text-success">{Array(v.price).fill(<DollarSign size={12} />)}</div></td>
                                        <td className="p-4"><div className="flex gap-0.5 text-primary">{Array(v.speed).fill(<Clock size={12} />)}</div></td>
                                        <td className="p-4"><div className="flex gap-0.5 text-secondary">{Array(v.safety).fill(<ShieldCheck size={12} />)}</div></td>
                                        <td className="p-4">
                                            <span className={`badge badge-sm ${v.status === 'preferred' ? 'badge-success' : v.status === 'active' ? 'badge-primary' : 'badge-danger'}`}>
                                                {v.status === 'preferred' ? 'Онцлох' : v.status === 'active' ? 'Идэвхтэй' : 'Шалгаж буй'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="btn btn-ghost btn-sm"><ChevronRight size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
