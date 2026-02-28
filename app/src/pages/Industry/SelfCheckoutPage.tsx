import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    CupSoda,
    Smartphone,
    CreditCard,
    Plus,
    ShoppingBag,
    HelpCircle,
    Globe,
    Zap,
    Image,
    Monitor,
    X
} from 'lucide-react';

export function SelfCheckoutPage() {
    const [cart] = useState([
        { id: 1, name: 'Сүүн цай', price: 3500, quantity: 2 },
        { id: 2, name: 'Бууз (5ш)', price: 10500, quantity: 1 },
    ]);

    const stats = [
        { label: 'Киоск-1 Төлөв', value: 'Идэвхтэй', icon: Smartphone, color: 'success' },
        { label: 'Өнөөдрийн гүйлгээ', value: '₮184,000', icon: CreditCard, color: 'primary' },
        { label: 'Ашиглалт', value: '45 хүнтэй', icon: ShoppingBag, color: 'info' },
    ];

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const renderKiosk = () => (
        <div className="flex flex-col items-center gap-12 animate-fade-in translate-y-0 opacity-100 max-w-6xl mx-auto py-10">
            <div className="w-full flex justify-between items-center bg-white px-10 py-6 rounded-[2.5rem] border shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white rotate-6 shadow-xl shadow-primary/20"><CupSoda size={32} /></div>
                    <div>
                        <h2 className="m-0 text-2xl font-black text-gray-900 tracking-tighter uppercase">Liscord Express</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-muted tracking-widest">Self-Service Terminal 01</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-ghost h-12 px-6 rounded-xl border border-black/5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-muted hover-lift"><Globe size={16} /> Монгол</button>
                    <button className="btn btn-ghost h-12 w-12 rounded-xl border border-black/5 flex items-center justify-center text-muted hover-lift"><HelpCircle size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full h-[700px]">
                <div className="flex flex-col gap-8">
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {['All', 'Drinks', 'Hot Food', 'Snacks', 'Bakery'].map((c, i) => (
                            <button key={c} className={`btn h-16 px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-lg transition-all ${i === 0 ? 'btn-primary' : 'bg-white text-muted hover:bg-white border hover:border-primary/20'}`}>{c}</button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2 pb-10">
                        {[
                            { id: 1, name: 'Кола 0.5', price: '₮3,500' },
                            { id: 2, name: 'Цусны салат', price: '₮8,500' },
                            { id: 3, name: 'Пирожки', price: '₮1,500' },
                            { id: 4, name: 'Сүүн цай', price: '₮2,500' },
                            { id: 5, name: 'Бургер', price: '₮14,500' },
                            { id: 6, name: 'Кофе', price: '₮12,000' },
                        ].map((p, i) => (
                            <div key={p.id} className="card p-0 border shadow-sm bg-white rounded-[2rem] hover:border-primary/20 transition-all cursor-pointer group animate-slide-up relative overflow-hidden h-52 flex flex-col items-center justify-center gap-4" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="w-24 h-24 rounded-full bg-surface-2 flex items-center justify-center text-gray-300 group-hover:bg-primary-light group-hover:text-primary transition-all duration-500">
                                    <Image size={40} strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                    <h4 className="m-0 font-black text-gray-800 tracking-tight">{p.name}</h4>
                                    <span className="text-sm font-black text-primary tracking-tighter mt-1">{p.price}</span>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"><Plus size={16} strokeWidth={3} /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-10 border shadow-2xl bg-[#f8f9fb] rounded-[3rem] flex flex-col gap-10 relative overflow-hidden group">
                    <div className="flex justify-between items-center group">
                        <h3 className="m-0 text-3xl font-black tracking-tighter text-gray-900 group-hover:translate-x-1 transition-transform">Миний Сагс</h3>
                        <span className="badge badge-primary font-black uppercase text-[10px] px-4 py-2 rounded-xl shadow-lg shadow-primary/20">{cart.length} Бараа</span>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
                        {cart.map((item) => (
                            <div key={item.id} className="card p-6 border shadow-sm bg-white rounded-3xl flex items-center justify-between hover-lift group/item">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center font-black text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                        {item.quantity}
                                    </div>
                                    <div>
                                        <h4 className="m-0 font-black text-gray-800 tracking-tight">{item.name}</h4>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">₮{item.price.toLocaleString()} / нэгж</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-gray-900 tracking-tighter text-lg">₮{(item.price * item.quantity).toLocaleString()}</span>
                                    <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl bg-surface-2 opacity-0 group-hover/item:opacity-100 transition-opacity text-error hover:bg-error-light hover:text-error"><X size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="h-px bg-black/5"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-black uppercase tracking-[0.2em] text-muted">Нийт дүн</span>
                            <span className="text-5xl font-black text-gray-900 tracking-tighter">₮{total.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <button className="btn btn-primary h-24 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] text-lg active:scale-95 transition-all">
                                <CreditCard size={32} /> Төлөх
                            </button>
                            <button className="btn btn-ghost h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-muted hover:text-gray-900 flex items-center justify-center gap-2 group/btn">
                                <Monitor size={16} className="group-hover/btn:rotate-12 transition-transform" /> Admin Dashboard &rarr;
                            </button>
                        </div>
                    </div>

                    <div className="absolute top-10 right-10 rotate-12 opacity-5 pointer-events-none group-hover:rotate-45 transition-transform duration-1000">
                        <Zap size={200} strokeWidth={1} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="Self-Checkout Kiosk"
                subtitle="Киоск төхөөрөмжийн ажиллагаа, төлбөр тооцоо, ашиглалт хянах"
            />

            <div className="page-content mt-6 h-full">
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
                            <Smartphone className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={100} />
                        </div>
                    ))}
                </div>
                {renderKiosk()}
            </div>
        </HubLayout>
    );
}
