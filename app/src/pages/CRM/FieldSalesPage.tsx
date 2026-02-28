import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    MapPin,
    ShoppingCart,
    CheckCircle2,
    Calendar,
    Navigation,
    Plus,
    Search,
    Clock,
    User,
    ChevronRight,
    TrendingUp,
    Briefcase,
    Activity
} from 'lucide-react';

export function FieldSalesPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_view, _setView] = useState<'route' | 'customers'>('route');

    // Mock route data
    const todayRoutes = [
        { id: 1, customer: 'Номин Супермаркет', address: 'Хан-Уул, 15-р хороо', time: '09:30', status: 'completed' },
        { id: 2, customer: 'CU Сөүл салбар', address: 'Сүхбаатар, Бага тойруу', time: '11:00', status: 'completed' },
        { id: 3, customer: 'Миний Дэлгүүр', address: 'БЗД, Жуковын талбай', time: '14:30', status: 'pending' },
        { id: 4, customer: 'Оргил Шилтгээн', address: 'ХУД, Зайсан', time: '16:00', status: 'pending' },
    ];

    const stats = [
        { label: 'Өнөөдрийн байршил', value: '4/8', icon: MapPin, color: 'primary' },
        { label: 'Цуглуулсан захиалга', value: '₮12.4M', icon: ShoppingCart, color: 'success' },
        { label: 'Ажилласан цаг', value: '5.2ц', icon: Clock, color: 'info' },
    ];

    const renderRoute = () => (
        <div className="flex flex-col gap-6 stagger-children animate-fade-in translate-y-0 opacity-100">
            {/* Map Placeholder */}
            <div className="card h-64 bg-surface-2 border shadow-lg overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=47.9188,106.9176&zoom=13&size=800x400&sensor=false')] bg-cover opacity-80 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white relative z-10">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/80">Таны одоогийн маршрут</div>
                        <h3 className="m-0 text-xl font-black tracking-tight">Улаанбаатар, Төв бүс</h3>
                    </div>
                    <button className="btn btn-primary btn-sm flex items-center gap-2 rounded-full shadow-lg shadow-primary/30"><Navigation size={14} /> Навигаци эхлүүлэх</button>
                </div>
            </div>

            {/* Target List */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <h4 className="m-0 text-[11px] font-black uppercase text-muted tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} className="text-primary" /> Өнөөдрийн төлөвлөгөө
                    </h4>
                    <span className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-full">50% Гүйцэтгэсэн</span>
                </div>
                {todayRoutes.map((r, i) => (
                    <div key={r.id} className={`card border shadow-sm p-6 hover-lift flex items-center justify-between group transition-all animate-slide-up ${r.status === 'completed' ? 'bg-surface-2/50 opacity-80' : 'bg-white'}`} style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${r.status === 'completed' ? 'bg-success/10 text-success border border-success/20' : 'bg-surface-2 text-muted border border-black/5 pulse-subtle'}`}>
                                {r.status === 'completed' ? <CheckCircle2 size={28} /> : r.time}
                            </div>
                            <div>
                                <h4 className="m-0 text-lg font-black tracking-tight text-gray-800">{r.customer}</h4>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted mt-1 uppercase tracking-tight">
                                    <MapPin size={12} className="text-primary" /> {r.address}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {r.status === 'pending' && (
                                <button className="btn btn-primary btn-sm h-11 px-6 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                    Очих <ShoppingCart size={14} />
                                </button>
                            )}
                            <button className="btn btn-ghost btn-icon h-11 w-11 rounded-2xl hover:bg-surface-2 border border-transparent hover:border-black/5 transition-all group-hover:translate-x-1 duration-300">
                                <ChevronRight size={20} className="text-muted group-hover:text-primary transition-colors" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <HubLayout hubId="crm-hub">
            <Header
                title="Хээрийн Борлуулалт"
                subtitle="Гадуур ажиллаж буй борлуулалтын төлөөлөгчдийн ажлын орчин"
            />

            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100">
                {/* Rep KPI Bar */}
                <div className="grid-3">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-down" style={{ animationDelay: `${i * 100}ms` }}>
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

                {/* Main View Area */}
                <div className="grid-3-1 gap-8">
                    <div className="flex flex-col gap-6">
                        {renderRoute()}
                    </div>

                    <div className="flex flex-col gap-6 animate-slide-right">
                        {/* Quick Order Button */}
                        <button className="btn btn-primary w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl shadow-primary/30 active:scale-95 transition-all group overflow-hidden border-2 border-primary-focus">
                            <Plus className="group-hover:rotate-90 transition-transform duration-500" size={28} strokeWidth={3} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Шууд захиалга авах</span>
                        </button>

                        <div className="card border shadow-lg p-6 bg-gradient-to-br from-white to-surface-2 relative group">
                            <Briefcase className="absolute -right-4 -bottom-4 text-black/5 group-hover:rotate-12 transition-transform duration-700" size={100} />
                            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-6 flex items-center gap-2">
                                <User size={14} className="text-primary" /> Ойролцоох харилцагчид
                            </h4>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input type="text" className="input input-sm pl-10 h-10 rounded-xl bg-white border shadow-inner ring-1 ring-black/5 focus:ring-primary/40 w-full" placeholder="Хайх..." />
                            </div>
                            <div className="space-y-3 relative z-10">
                                {['Миний дэлгүүр (200м)', 'Номин (1.2км)', 'Оргил (2.4км)'].map(shop => (
                                    <div key={shop} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/30 cursor-pointer shadow-sm hover:shadow-lg transition-all active:scale-95 group">
                                        <span className="text-xs font-extrabold text-gray-700">{shop}</span>
                                        <ChevronRight size={14} className="text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card border shadow-lg p-6 bg-surface-2 border-dashed flex flex-col items-center justify-center gap-4 text-center grayscale opacity-80 group hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                            <Calendar className="text-muted group-hover:text-primary transition-colors duration-500" size={48} strokeWidth={1} />
                            <div>
                                <h5 className="m-0 text-xs font-black uppercase tracking-widest text-muted group-hover:text-gray-900 transition-colors">Маргаашийн хуваарь</h5>
                                <p className="m-0 text-[10px] font-bold text-muted/60 mt-1 uppercase tracking-tighter">Төлөвлөгөө хараахан гараагүй</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
