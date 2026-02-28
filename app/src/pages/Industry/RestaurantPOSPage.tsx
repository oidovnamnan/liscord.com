import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Users,
    Clock,
    Table as TableIcon,
    Plus,
    Minus,
    DollarSign,
    Split,
    Printer,
    ChefHat
} from 'lucide-react';

export function RestaurantPOSPage() {
    const [view, setView] = useState<'floor' | 'order'>('floor');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTable, setSelectedTable] = useState<any>(null);

    // Mock Floor Plan Data
    const tables = [
        { id: 'T1', name: 'Ширээ 1', capacity: 4, status: 'occupied', guests: 2, section: 'Main', total: '₮45,000' },
        { id: 'T2', name: 'Ширээ 2', capacity: 2, status: 'empty', guests: 0, section: 'Main', total: '₮0' },
        { id: 'T3', name: 'Ширээ 3', capacity: 6, status: 'reserved', guests: 0, section: 'Main', total: '₮0' },
        { id: 'T4', name: 'Ширээ 4', capacity: 4, status: 'dirty', guests: 0, section: 'Main', total: '₮0' },
        { id: 'V1', name: 'VIP 1', capacity: 10, status: 'occupied', guests: 8, section: 'VIP', total: '₮280,000' },
        { id: 'V2', name: 'VIP 2', capacity: 10, status: 'empty', guests: 0, section: 'VIP', total: '₮0' },
        { id: 'T5', name: 'Баар 1', capacity: 1, status: 'occupied', guests: 1, section: 'Bar', total: '₮12,500' },
        { id: 'T6', name: 'Баар 2', capacity: 1, status: 'empty', guests: 0, section: 'Bar', total: '₮0' },
    ];

    const currentOrder = [
        { id: 1, name: 'Цуйван', quantity: 2, price: 25000 },
        { id: 3, name: 'Нийслэл салат', quantity: 1, price: 8500 },
        { id: 4, name: 'Кола 0.5', quantity: 3, price: 10500 },
    ];

    const renderFloor = () => (
        <div className="flex flex-col gap-8 animate-fade-in translate-y-0 opacity-100">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <button className="btn btn-primary rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Бүгд</button>
                    <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Танхим</button>
                    <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">VIP Өрөө</button>
                    <button className="btn btn-outline rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">Баар</button>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success"></div>
                        <span className="text-[10px] font-black uppercase text-muted tracking-tighter">Сул</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-[10px] font-black uppercase text-muted tracking-tighter">Суусан</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                        <span className="text-[10px] font-black uppercase text-muted tracking-tighter">Захиалгатай</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {tables.map((t) => (
                    <div
                        key={t.id}
                        onClick={() => { setSelectedTable(t); setView('order'); }}
                        className={`card p-6 border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 flex flex-col items-center gap-4 relative overflow-hidden group
                            ${t.status === 'occupied' ? 'border-primary bg-primary/5' :
                                t.status === 'reserved' ? 'border-warning bg-warning/5' :
                                    t.status === 'dirty' ? 'border-gray-300 bg-gray-50' : 'border-black/5 bg-white'}`}
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform
                            ${t.status === 'occupied' ? 'bg-primary text-white' :
                                t.status === 'reserved' ? 'bg-warning text-white' :
                                    t.status === 'dirty' ? 'bg-gray-400 text-white' : 'bg-surface-2 text-muted'}`}>
                            <TableIcon size={32} />
                        </div>
                        <div className="text-center relative z-10">
                            <h4 className="m-0 font-black text-gray-900 tracking-tight">{t.name}</h4>
                            <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                                <Users size={12} /> {t.guests}/{t.capacity}
                            </div>
                        </div>
                        {t.status === 'occupied' && (
                            <div className="w-full mt-2 pt-2 border-t border-black/5 text-center">
                                <span className="font-black text-primary tracking-tighter text-sm">{t.total}</span>
                            </div>
                        )}
                        {t.status === 'dirty' && (
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="badge badge-accent font-black uppercase text-[10px] px-3 py-1">Цэвэрлэх</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button className="btn btn-primary btn-lg h-20 rounded-3xl w-full max-w-xs mx-auto mt-8 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em]">
                <Plus size={24} strokeWidth={3} /> Шинэ захиалга
            </button>
        </div>
    );

    const renderOrder = () => (
        <div className="flex flex-col md:flex-row gap-8 animate-slide-up h-[calc(100vh-250px)]">
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <button className="btn btn-ghost btn-sm font-black uppercase tracking-widest text-[10px] text-muted" onClick={() => setView('floor')}>&larr; Танхим руу буцах</button>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-primary font-black uppercase text-[10px] px-4 py-2 rounded-xl">{selectedTable?.name}</span>
                        <span className="text-xs font-black text-muted uppercase tracking-widest flex items-center gap-1"><Clock size={14} /> 24 мин</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                    {currentOrder.map((item) => (
                        <div key={item.id} className="card p-4 border shadow-sm bg-white flex items-center justify-between hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center font-black text-gray-400 group-hover:bg-primary-light group-hover:text-primary transition-colors">
                                    {item.quantity}
                                </div>
                                <div>
                                    <h4 className="m-0 font-black text-gray-800 tracking-tight">{item.name}</h4>
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">₮{(item.price / item.quantity).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-gray-900 tracking-tighter">₮{item.price.toLocaleString()}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="btn btn-ghost btn-icon h-8 w-8 rounded-lg bg-surface-2"><Minus size={14} /></button>
                                    <button className="btn btn-ghost btn-icon h-8 w-8 rounded-lg bg-surface-2"><Plus size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {['Шөл', 'Үндсэн', 'Салат', 'Ундаа'].map((cat) => (
                        <button key={cat} className="btn btn-outline h-16 rounded-2xl font-black uppercase tracking-widest text-[10px]">{cat}</button>
                    ))}
                </div>
            </div>

            <div className="w-full md:w-[380px] flex flex-col gap-6">
                <div className="card p-8 border shadow-xl bg-surface-2 flex flex-col gap-8 flex-1">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-muted">
                            <span className="text-[10px] font-black uppercase tracking-widest">Дэд дүн</span>
                            <span className="font-bold">₮38,500</span>
                        </div>
                        <div className="flex justify-between items-center text-muted">
                            <span className="text-[10px] font-black uppercase tracking-widest">Үйлчилгээ (10%)</span>
                            <span className="font-bold">₮3,850</span>
                        </div>
                        <div className="h-px bg-black/5"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Нийт төлөх</span>
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">₮42,350</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-auto">
                        <button className="btn btn-primary h-20 rounded-3xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm">
                            <DollarSign size={24} /> Төлбөр авах
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="btn btn-outline h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]">
                                <Split size={16} /> Хуваах
                            </button>
                            <button className="btn btn-outline h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]">
                                <Printer size={16} /> Билл хэвлэх
                            </button>
                        </div>
                        <button className="btn btn-accent h-16 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-accent/20">
                            <ChefHat size={20} /> Гал тогоо руу илгээх
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Рестораны ПОС"
                subtitle="Ширээ удирдах, захиалга авах, тооцоо бодох"
            />

            <div className="page-content mt-6 h-full">
                {view === 'floor' ? renderFloor() : renderOrder()}
            </div>
        </HubLayout>
    );
}
