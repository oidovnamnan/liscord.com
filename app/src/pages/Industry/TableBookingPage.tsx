import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Calendar,
    Users,
    Clock,
    Plus,
    MapPin,
    Settings,
    Layers,
    Table as TableIcon,
    Phone,
    Info,
    CheckCircle2
} from 'lucide-react';

export function TableBookingPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_view, _setView] = useState<'plan' | 'list'>('plan');

    const bookings = [
        { id: 1, name: 'Б.Зориг', table: 'T4', time: '18:30', guests: 4, phone: '99112233', status: 'confirmed' },
        { id: 2, name: 'С.Уянга', table: 'VIP-1', time: '19:00', guests: 8, phone: '88004455', status: 'confirmed' },
        { id: 3, name: 'Г.Болд', table: 'T12', time: '20:15', guests: 2, phone: '95123456', status: 'pending' },
    ];

    const stats = [
        { label: 'Өнөөдрийн захиалга', value: '12', icon: Calendar, color: 'primary' },
        { label: 'Нийт зочид', value: '45', icon: Users, color: 'info' },
        { label: 'Сул ширээ', value: '8/24', icon: TableIcon, color: 'success' },
    ];

    const sections = ['Main Hall', 'VIP Rooms', 'Outdoor Terrace', 'Bar Area'];

    const renderPlan = () => (
        <div className="flex flex-col gap-8 animate-fade-in translate-y-0 opacity-100 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Interactive Map */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="card p-4 border shadow-xl bg-white flex justify-between items-center rounded-[2rem]">
                        <div className="flex gap-2">
                            {sections.map((s, i) => (
                                <button key={s} className={`btn btn-sm h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest ${i === 0 ? 'btn-primary' : 'btn-ghost text-muted hover:bg-surface-2'}`}>{s}</button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm h-10 w-10 p-0 rounded-xl bg-surface-2"><Settings size={16} /></button>
                            <button className="btn btn-ghost btn-sm h-10 w-10 p-0 rounded-xl bg-surface-2"><Layers size={16} /></button>
                        </div>
                    </div>

                    <div className="card border-2 border-dashed border-black/5 bg-surface-2 h-[600px] relative overflow-hidden rounded-[3rem] group">
                        {/* Floor Plan Simulation */}
                        <div className="absolute inset-0 bg-[#f8f9fb] opacity-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"></div>

                        {/* Tables */}
                        {[
                            { id: 'T1', x: '15%', y: '20%', status: 'occupied' },
                            { id: 'T2', x: '35%', y: '20%', status: 'empty' },
                            { id: 'T3', x: '55%', y: '20%', status: 'empty' },
                            { id: 'T4', x: '15%', y: '50%', status: 'reserved' },
                            { id: 'T5', x: '35%', y: '50%', status: 'empty' },
                            { id: 'T6', x: '55%', y: '50%', status: 'occupied' },
                            { id: 'V1', x: '80%', y: '35%', status: 'reserved', type: 'large' },
                        ].map((table) => (
                            <div
                                key={table.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center
                                    ${table.type === 'large' ? 'w-32 h-20' : 'w-20 h-20'} 
                                    ${table.status === 'occupied' ? 'bg-primary text-white shadow-xl shadow-primary/20' :
                                        table.status === 'reserved' ? 'bg-warning text-white shadow-xl shadow-warning/20' : 'bg-white border-2 border-black/5 text-muted shadow-sm'}`}
                                style={{ left: table.x, top: table.y, borderRadius: table.id.startsWith('T') ? '2rem' : '1.5rem' }}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="font-black text-xs">{table.id}</span>
                                    {table.status === 'reserved' && <Clock size={12} className="mt-1 opacity-60" />}
                                </div>
                            </div>
                        ))}

                        <div className="absolute bottom-8 right-8 flex flex-col gap-3">
                            <button className="btn btn-primary h-14 w-14 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center p-0"><Plus size={24} strokeWidth={3} /></button>
                        </div>
                    </div>
                </div>

                {/* Right: Upcoming Bookings */}
                <div className="flex flex-col gap-6">
                    <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-primary" /> Өнөөдрийн хуваарь
                            </h4>
                            <span className="badge badge-primary-light font-black text-[10px] px-3 py-1 rounded-lg">3 Шинэ</span>
                        </div>

                        <div className="flex flex-col gap-4">
                            {bookings.map((b) => (
                                <div key={b.id} className="p-5 bg-surface-2 border border-black/5 rounded-3xl hover:bg-white hover:shadow-xl hover:border-transparent transition-all group cursor-pointer relative overflow-hidden">
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-md font-black text-gray-800 tracking-tight">{b.name}</div>
                                                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{b.table} • {b.guests} Хүн</div>
                                            </div>
                                            <div className="text-lg font-black text-primary tracking-tighter">{b.time}</div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-3 border-t border-black/5">
                                            <button className="text-[10px] font-black uppercase text-muted hover:text-primary transition-colors flex items-center gap-1"><Phone size={12} /> Залгах</button>
                                            <button className="text-[10px] font-black uppercase text-muted hover:text-success transition-colors flex items-center gap-1"><CheckCircle2 size={12} /> Ирсэн</button>
                                        </div>
                                    </div>
                                    <div className={`absolute top-0 right-0 w-1 h-full ${b.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}></div>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-outline w-full h-12 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[9px] mt-2">Бүх захиалга харах &rarr;</button>
                    </div>

                    <div className="card p-8 bg-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <Info className="absolute -right-6 -top-6 text-white/5 group-hover:rotate-12 transition-transform duration-700" size={120} />
                        <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest mb-6">Хүчин чадал</h4>
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span>Танхим дүүргэлт</span>
                                    <span>65%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[65%] rounded-full shadow-lg shadow-primary/40"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <MapPin className="text-warning" size={20} />
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Идэвхтэй бүс</div>
                                    <div className="text-sm font-black tracking-tight">Main Hall (Section A)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Ширээ Захиалга"
                subtitle="Захиалгын хяналт, ирэх зочдын хуваарь, сул ширээний менежмент"
            />

            <div className="page-content mt-6 h-full">
                {stats && (
                    <div className="grid-3 gap-6 mb-8">
                        {stats.map((s, i) => (
                            <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                                    <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm`}>
                                        <s.icon size={18} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                                <TableIcon className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={100} />
                            </div>
                        ))}
                    </div>
                )}
                {renderPlan()}
            </div>
        </HubLayout>
    );
}
