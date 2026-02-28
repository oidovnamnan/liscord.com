import { useState } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CheckCircle2,
    AlertCircle,
    ChefHat,
    Utensils,
    Grid,
    List,
    Play,
    Timer
} from 'lucide-react';

export function KDSPage() {
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const orders = [
        {
            id: 'KDS-001',
            table: 'T4',
            time: '05:12',
            status: 'preparing',
            priority: 'normal',
            items: [
                { name: 'Цуйван', quantity: 2, status: 'cooking' },
                { name: 'Гуляш', quantity: 1, status: 'pending' },
                { name: 'Кола', quantity: 3, status: 'ready' }
            ]
        },
        {
            id: 'KDS-002',
            table: 'VIP-1',
            time: '12:45',
            status: 'preparing',
            priority: 'urgent',
            items: [
                { name: 'Хорхог (1кг)', quantity: 2, status: 'cooking' },
                { name: 'Шарсан хавирга', quantity: 4, status: 'cooking' }
            ]
        },
        {
            id: 'KDS-003',
            table: 'Bar 3',
            time: '02:30',
            status: 'new',
            priority: 'low',
            items: [
                { name: 'Бууз (5ш)', quantity: 2, status: 'pending' }
            ]
        },
        {
            id: 'KDS-004',
            table: 'T12',
            time: '18:20',
            status: 'ready',
            priority: 'normal',
            items: [
                { name: 'Нийслэл салат', quantity: 2, status: 'ready' },
                { name: 'Пирожки', quantity: 5, status: 'ready' }
            ]
        }
    ];

    return (
        <HubLayout hubId="industry-hub">
            <div className="bg-[#0f1115] min-h-screen text-gray-100 -m-8 p-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="m-0 text-3xl font-black tracking-tighter flex items-center gap-3">
                            <ChefHat className="text-primary" size={32} /> Гал Тогооны Дэлгэц (KDS)
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Нийт 4 идэвхтэй захиалга байна</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
                            <button
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${view === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                onClick={() => setView('grid')}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${view === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                onClick={() => setView('list')}
                            >
                                <List size={20} />
                            </button>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Одоогийн цаг</span>
                            <span className="text-xl font-black tracking-widest">19:45:22</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {orders.map((order, i) => (
                        <div
                            key={order.id}
                            className={`flex flex-col rounded-[2.5rem] border-2 overflow-hidden transition-all hover:scale-[1.02] active:scale-98 animate-slide-up bg-[#161920] shadow-2xl
                                ${order.priority === 'urgent' ? 'border-error/40 shadow-error/10' :
                                    order.status === 'ready' ? 'border-success/40 shadow-success/10' : 'border-white/5 shadow-black/40'}`}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            {/* Header */}
                            <div className={`p-6 flex justify-between items-start ${order.priority === 'urgent' ? 'bg-error/10' : order.status === 'ready' ? 'bg-success/10' : 'bg-white/5'}`}>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{order.id}</div>
                                    <h3 className="m-0 text-3xl font-black tracking-tighter">{order.table}</h3>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2
                                        ${order.priority === 'urgent' ? 'bg-error text-white animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
                                        <Timer size={12} /> {order.time}
                                    </div>
                                    {order.priority === 'urgent' && <AlertCircle size={20} className="text-error" />}
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="flex-1 p-8 space-y-6">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-start justify-between group">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs
                                                ${item.status === 'ready' ? 'bg-success/20 text-success' : 'bg-white/10 text-gray-400'}`}>
                                                {item.quantity}
                                            </div>
                                            <div>
                                                <div className={`font-black text-lg tracking-tight ${item.status === 'ready' ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                                                    {item.name}
                                                </div>
                                                {item.status === 'cooking' && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></div>
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Бэлдэж байна</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {item.status !== 'ready' && (
                                            <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center text-gray-600">
                                                <Play size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-8 pt-0 mt-auto">
                                <button className={`w-full h-16 rounded-[1.5rem] flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl
                                    ${order.status === 'ready' ? 'bg-success text-white shadow-success/20' : 'bg-primary text-white shadow-primary/20'}`}>
                                    {order.status === 'ready' ? <CheckCircle2 size={24} /> : <Play size={24} />}
                                    {order.status === 'ready' ? 'Гарсан' : 'Бэлэн боллоо'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend / Tooltips */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-3xl px-10 py-6 rounded-[2rem] border border-white/10 flex items-center gap-12 shadow-2xl z-50">
                    <div className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                        <div className="w-4 h-4 rounded-full bg-error"></div> Яаралтай
                    </div>
                    <div className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                        <div className="w-4 h-4 rounded-full bg-primary"></div> Бэлтгэгдэж буй
                    </div>
                    <div className="flex items-center gap-3 text-sm font-black text-gray-400 uppercase tracking-widest">
                        <div className="w-4 h-4 rounded-full bg-success"></div> Бэлэн болсон
                    </div>
                    <div className="h-6 w-px bg-white/10"></div>
                    <div className="flex items-center gap-4 text-gray-400 font-bold">
                        <Utensils size={20} className="text-primary" /> 12 Идэвхтэй хоол
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
