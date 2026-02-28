import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Search,
    Filter,
    ArrowRight,
    User,
    MapPin,
    Zap,
    CheckCircle2,
    Clock,
    MoreVertical,
    Smartphone,
    Share2,
    Activity,
    Navigation,
    Flag
} from 'lucide-react';

interface DispatchOrder {
    id: string;
    customer: string;
    address: string;
    driver: string;
    status: 'assigned' | 'picked-up' | 'delivered' | 'failed';
    priority: 'high' | 'normal';
    time: string;
}

const MOCK_DISPATCH: DispatchOrder[] = [
    {
        id: 'DIS-101',
        customer: 'Б.Тулга',
        address: 'СБД, 1-р хороо, 40-р байр',
        driver: 'Э.Бат-Эрдэнэ',
        status: 'picked-up',
        priority: 'high',
        time: '12:45'
    },
    {
        id: 'DIS-102',
        customer: 'Г.Марал',
        address: 'БЗД, 26-р хороо, Parkside',
        driver: 'С.Болд',
        status: 'assigned',
        priority: 'normal',
        time: '14:20'
    },
    {
        id: 'DIS-103',
        customer: 'Д.Тэмүүлэн',
        address: 'ХУД, Ривер Гарден 1',
        driver: 'М.Тэмүүжин',
        status: 'delivered',
        priority: 'normal',
        time: '11:15'
    }
];

export function DispatchPage() {
    const [orders] = useState<DispatchOrder[]>(MOCK_DISPATCH);

    return (
        <HubLayout hubId="logistics-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Дотоод Хүргэлт (Dispatch)"
                    subtitle="Хотын хүргэлтийн захиалгыг жолоочид оноох, замыг хянах, гүйцэтгэл шалгах"
                    action={{
                        label: "Илгээлт үүсгэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт хүргэлт</h4>
                                <div className="text-3xl font-black text-primary">124</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><Navigation size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Амжилттай</h4>
                                <div className="text-3xl font-black text-success">112</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Жолооч (Online)</h4>
                                <div className="text-3xl font-black text-warning">8</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><User size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">AI DISPATCH</h4>
                                <div className="text-xl font-black">AUTO-ASSIGN ON</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Activity size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Хэрэглэгч, жолооч, хаягаар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Бүс</button>
                    </div>

                    {/* Dispatch Table Layout */}
                    <div className="col-12 card p-0 overflow-hidden shadow-sm bg-surface-1 border-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="pl-6 py-4">ID / Цаг</th>
                                    <th>Хэрэглэгч & Хаяг</th>
                                    <th>Жолооч</th>
                                    <th>Эрэмбэ</th>
                                    <th>Төлөв</th>
                                    <th className="pr-6 text-right">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-surface-2 transition-all group">
                                        <td className="pl-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-sm tracking-tight">{order.id}</div>
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <Clock size={10} /> {order.time}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-black uppercase tracking-widest">{order.customer}</div>
                                                <div className="text-[10px] text-muted flex items-center gap-1">
                                                    <MapPin size={10} className="text-primary" /> {order.address}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-black text-primary border border-border-color/10">
                                                    {order.driver.substring(0, 1)}
                                                </div>
                                                <span className="text-xs font-bold text-muted uppercase tracking-widest">{order.driver}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${order.priority === 'high' ? 'text-danger' : 'text-muted'}`}>
                                                {order.priority === 'high' ? <Flag size={12} /> : null} {order.priority}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-black text-[10px] px-3 py-1 uppercase tracking-widest badge-${order.status === 'delivered' ? 'success' :
                                                order.status === 'picked-up' ? 'warning' :
                                                    order.status === 'failed' ? 'danger' : 'primary'
                                                }`}>
                                                {order.status === 'delivered' ? 'ХҮРГЭГДСЭН' :
                                                    order.status === 'picked-up' ? 'ЗАМД ЯВАА' :
                                                        order.status === 'failed' ? 'ГҮЙЦЭТГЭЛГҮЙ' : 'ОНООСОН'}
                                            </span>
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

                    {/* Driver App Alert / Sync */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Smartphone size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Driver App Integration</h3>
                                <p className="text-sm text-muted">Жолоочийн гар утасны системтэй холбож, захиалгын төлвийг бодит хугацаанд солилцох.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ЖОЛООЧ ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
