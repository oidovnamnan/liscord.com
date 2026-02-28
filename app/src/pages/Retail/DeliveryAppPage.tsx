import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Truck,
    Navigation,
    MapPin,
    CheckCircle2,
    Camera,
    Phone,
    MessageCircle,
    Clock,
    Package,
    TrendingUp,
    CreditCard,
    Activity
} from 'lucide-react';

export function DeliveryAppPage() {
    const [view, setView] = useState<'tasks' | 'active'>('tasks');

    // Mock active delivery
    const activeDelivery = {
        id: 'DEL-1024',
        customer: 'Б.Золбоо',
        address: 'Хан-Уул, Жаргалан хотхон, 12-р байр, 45 тоот',
        phone: '99110022',
        items: 'Сүү (2), Талх (1), Жүүс (3)',
        paymentStatus: 'Төлөгдсөн',
        cod: 0,
        distance: '4.2 км',
        estimatedTime: '15 мин'
    };

    // Mock delivery list
    const tasks = [
        { id: 'DEL-1025', customer: 'С.Уянга', address: 'Сүхбаатар, Бага тойруу', time: '14:30', status: 'pending' },
        { id: 'DEL-1026', customer: 'Т.Бат', address: 'БЗД, 13-р хороолол', time: '15:15', status: 'pending' },
        { id: 'DEL-1027', customer: 'Г.Болд', address: 'СХД, 1-р хороолол', time: '16:00', status: 'pending' },
    ];

    const stats = [
        { label: 'Өнөөдрийн хүргэлт', value: '12/15', icon: Truck, color: 'primary' },
        { label: 'Нийт гүйлт', value: '42.5 км', icon: MapPin, color: 'info' },
        { label: 'Ажлын цаг', value: '6.5 ц', icon: Clock, color: 'success' },
    ];

    const renderTasks = () => (
        <div className="flex flex-col gap-6 stagger-children animate-fade-in translate-y-0 opacity-100">
            {/* Stats Hub */}
            <div className="grid-3 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between items-start mb-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                            <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm transform group-hover:rotate-12 transition-transform`}>
                                <s.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                        <TrendingUp className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-125 transition-transform" size={100} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <h4 className="m-0 text-[11px] font-black uppercase text-muted tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-primary" /> Хүргэлтийн даалгаварууд
                    </h4>
                    <span className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-full">3 хүлээгдэж буй</span>
                </div>
                {tasks.map((task, i) => (
                    <div key={task.id} className="card border shadow-sm p-6 hover-lift flex items-center justify-between group transition-all animate-slide-up bg-white" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-black/5 flex items-center justify-center font-black text-lg text-muted pulse-subtle">
                                {task.time}
                            </div>
                            <div>
                                <h4 className="m-0 text-lg font-black tracking-tight text-gray-800">{task.customer}</h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted mt-1 uppercase tracking-tight">
                                    <MapPin size={12} className="text-primary" /> {task.address}
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary h-11 px-8 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => setView('active')}>
                            Хүргэлт эхлэх <Navigation size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderActive = () => (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in translate-y-0 opacity-100">
            <div className="card p-0 overflow-hidden border shadow-2xl bg-white flex flex-col md:flex-row h-full max-h-[700px]">
                {/* Left: Map & Info */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Navigation Map Placeholder */}
                    <div className="h-64 bg-surface-2 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=47.9188,106.9176&zoom=15&size=800x400&sensor=false')] bg-cover opacity-80 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end relative z-10 text-white">
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <span className="badge badge-primary rounded-lg font-black">{activeDelivery.distance}</span>
                                    <span className="badge badge-accent rounded-lg font-black">{activeDelivery.estimatedTime}</span>
                                </div>
                                <h3 className="m-0 text-2xl font-black tracking-tight drop-shadow-lg">Хүргэгдэж байна...</h3>
                            </div>
                            <button className="btn btn-white h-12 px-6 rounded-2xl text-gray-900 border-none font-black shadow-xl animate-bounce-subtle flex items-center gap-2"><Navigation size={18} className="text-primary" /> Газрын зураг нээх</button>
                        </div>
                        <button className="absolute top-6 left-6 btn btn-ghost btn-sm bg-black/20 text-white backdrop-blur-md rounded-xl hover:bg-black/40" onClick={() => setView('tasks')}>&larr; Буцах</button>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto bg-gradient-to-b from-white to-surface-3/30">
                        <div className="flex flex-col gap-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2">Харилцагч мэдээлэл</div>
                                    <h2 className="m-0 text-3xl font-black tracking-tight text-gray-900">{activeDelivery.customer}</h2>
                                    <p className="mt-2 text-md font-bold text-gray-600 max-w-sm flex items-start gap-3">
                                        <MapPin className="text-primary flex-shrink-0 mt-1" size={18} />
                                        {activeDelivery.address}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="btn btn-primary h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center p-0 active:scale-95 transition-all"><Phone size={24} /></button>
                                    <button className="btn btn-info h-14 w-14 rounded-2xl shadow-xl shadow-info/20 flex items-center justify-center p-0 active:scale-95 transition-all text-white"><MessageCircle size={24} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="card border shadow-sm p-5 bg-white flex flex-col gap-2 hover:border-primary/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-surface-2 rounded-xl text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <Package size={20} />
                                        </div>
                                        <h4 className="m-0 text-[10px] font-black uppercase text-muted tracking-widest">Бараанууд</h4>
                                    </div>
                                    <div className="font-bold text-gray-800">{activeDelivery.items}</div>
                                </div>
                                <div className="card border shadow-sm p-5 bg-white flex flex-col gap-2 hover:border-primary/20 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-surface-2 rounded-xl text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <CreditCard size={20} />
                                        </div>
                                        <h4 className="m-0 text-[10px] font-black uppercase text-muted tracking-widest">Төлбөр</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{activeDelivery.paymentStatus}</span>
                                        <span className="badge badge-success-light text-[10px] font-black">Success</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions (Completion) */}
                <div className="w-full md:w-[350px] border-l p-8 bg-surface-2 flex flex-col gap-8 shadow-inner shadow-black/5 items-center justify-center relative overflow-hidden">
                    <CheckCircle2 className="absolute -right-8 -top-8 text-black/5 pointer-events-none" size={200} />

                    <div className="text-center flex flex-col items-center gap-6 relative z-10 w-full">
                        <div className="w-32 h-32 rounded-3xl bg-white border shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group overflow-hidden border-2 border-dashed hover:border-primary">
                            <div className="flex flex-col items-center gap-2">
                                <Camera size={32} className="text-muted group-hover:text-primary transition-colors duration-500" />
                                <span className="text-[10px] font-black uppercase text-muted tracking-widest">Зураг авах</span>
                            </div>
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <p className="m-0 text-[10px] font-black text-muted uppercase tracking-widest max-w-[200px] leading-relaxed">Хүргэлтийг баталгаажуулахын тулд зураг дарна уу.</p>

                        <div className="w-full h-1 border-t border-dashed border-gray-300 my-4"></div>

                        <div className="w-full flex flex-col gap-3">
                            <button className="btn btn-primary w-full h-20 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/30 active:scale-95 transition-all border-b-8 border-primary-focus group overflow-hidden">
                                <CheckCircle2 size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Хүргэсэн
                            </button>
                            <button className="btn btn-outline w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs border-error/20 text-error hover:bg-error/10">
                                <Clock size={18} /> Хүлээлгэх (Хоцролт)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="retail-hub">
            <Header
                title="Жолоочийн цонх"
                subtitle="Захиалга хүргэлтийн явц, жолоочийн ажлын орчин"
            />

            <div className="page-content mt-6 flex flex-col gap-8 animate-fade-in translate-y-0 opacity-100 h-full">
                {view === 'tasks' ? renderTasks() : renderActive()}
            </div>
        </HubLayout>
    );
}
