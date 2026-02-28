import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Tv,
    Monitor,
    Smartphone,
    Settings,
    Play,
    ShoppingBag,
    Image,
    CreditCard,
    Zap,
    Tag,
    QrCode,
    Sparkles,
    Clock,
    Plus,
    RefreshCw,
    X
} from 'lucide-react';

export function PoleDisplayPage() {
    const [cart] = useState([
        { id: 1, name: 'Americano (L)', price: 8500, quantity: 1 },
        { id: 2, name: 'Croissant', price: 6500, quantity: 2 },
    ]);

    const stats = [
        { label: 'Active Screens', value: '4 Displays', icon: Tv, color: 'success' },
        { label: 'Ad Performance', value: '+12% Upsell', icon: Zap, color: 'warning' },
        { label: 'Status', value: 'Synced', icon: RefreshCw, color: 'primary' },
    ];

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const renderLivePreview = () => (
        <div className="flex flex-col gap-10 animate-fade-in py-10">
            <div className="flex items-center justify-between bg-white px-10 py-6 rounded-[2.5rem] border shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center text-primary shadow-2xl rotate-3 group-hover:rotate-0 transition-transform"><Monitor size={40} strokeWidth={2.5} /></div>
                    <div>
                        <h3 className="m-0 text-3xl font-black text-gray-900 tracking-tighter uppercase">Customer Facing Display</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></div>
                            <span className="text-[12px] font-black uppercase text-muted tracking-widest">Live: Terminal 01 (Display Mode: Checkout)</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-ghost h-14 px-8 rounded-2xl border border-black/5 flex items-center gap-3 font-black uppercase text-[11px] tracking-widest text-muted hover-lift"><RefreshCw size={18} /> Refresh Display</button>
                    <button className="btn btn-ghost h-14 w-14 rounded-2xl border border-black/5 flex items-center justify-center text-muted hover-lift"><Settings size={22} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 w-full h-[650px]">
                <div className="card border-8 border-gray-900 bg-black rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group">
                    <div className="h-2/3 w-full bg-gradient-to-br from-gray-800 to-black relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm scale-110 group-hover:scale-100 transition-transform duration-1000">
                            <Image size={100} className="w-full h-full text-white/10" />
                        </div>
                        <div className="relative text-center flex flex-col items-center gap-6 px-12 z-10">
                            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-3xl flex items-center justify-center text-primary border border-primary/20 shadow-2xl animate-bounce"><Sparkles size={40} strokeWidth={2.5} /></div>
                            <h4 className="m-0 text-4xl font-black text-white leading-tight tracking-tight uppercase">Special Offer: <span className="text-primary italic">Latte + Cake</span> only ₮12k!</h4>
                            <p className="m-0 text-white/50 font-bold uppercase tracking-widest text-sm">Valid until Friday. Ask our staff for details.</p>
                        </div>
                        <div className="absolute top-8 left-8 flex items-center gap-3 py-2 px-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                            <Tag size={16} className="text-primary" />
                            <span className="text-xs font-black text-white/80 uppercase tracking-widest">Promotion</span>
                        </div>
                    </div>

                    <div className="h-1/3 w-full bg-white flex flex-col justify-center px-12 relative overflow-hidden group/bar">
                        <div className="flex justify-between items-end relative z-10">
                            <div className="flex flex-col gap-2">
                                <span className="text-[12px] font-black uppercase text-muted tracking-widest">Scan to Pay or Earn Points</span>
                                <h5 className="m-0 text-2xl font-black text-gray-900 tracking-tighter uppercase">Download Liscord App</h5>
                            </div>
                            <div className="w-28 h-28 bg-white border-2 border-black/5 rounded-2xl flex items-center justify-center p-3 shadow-xl group-hover/bar:scale-110 transition-transform cursor-pointer">
                                <QrCode size={80} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="absolute -left-10 -bottom-10 opacity-5 group-hover/bar:rotate-45 transition-transform duration-1000">
                            <Zap size={200} />
                        </div>
                    </div>
                </div>

                <div className="card p-12 border shadow-2xl bg-white rounded-[3rem] flex flex-col gap-10 relative overflow-hidden group">
                    <div className="flex justify-between items-center group/header">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-light text-primary rounded-2xl shadow-lg transition-transform group-hover/header:rotate-6"><ShoppingBag size={28} /></div>
                            <h3 className="m-0 text-3xl font-black tracking-tighter text-gray-900 translate-x-0 group-hover/header:translate-x-1 transition-transform">Your Order</h3>
                        </div>
                        <Plus size={24} className="text-primary animate-pulse" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-4 no-scrollbar">
                        {cart.map((item) => (
                            <div key={item.id} className="flex items-center justify-between group/item hover-lift card p-6 border-black/5 bg-surface-1 rounded-3xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-black text-primary shadow-sm border group-hover/item:rotate-12 transition-transform">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-xl font-black text-gray-800 tracking-tight">{item.name}</h4>
                                        <span className="text-[11px] font-black text-muted uppercase tracking-widest mt-1">₮{item.price.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-gray-900 tracking-tighter text-2xl">₮{(item.price * item.quantity).toLocaleString()}</span>
                                    <button className="btn btn-ghost btn-icon h-10 w-10 text-error opacity-0 group-hover/item:opacity-100 transition-opacity"><X size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-10">
                        <div className="h-px bg-black/5"></div>
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-1">
                                <span className="text-[14px] font-black uppercase tracking-[0.3em] text-muted">Amount Due</span>
                                <div className="flex items-center gap-3">
                                    <CreditCard size={28} className="text-primary" />
                                    <span className="text-6xl font-black text-gray-900 tracking-tighter">₮{total.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-[10px] font-bold text-success flex items-center gap-1 uppercase tracking-widest"><Sparkles size={12} /> Earn 120 pts</div>
                                <div className="p-3 bg-surface-2 rounded-2xl text-[11px] font-black text-muted uppercase tracking-widest">Terminal Locked</div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-10 right-10 rotate-12 opacity-5 group-hover:rotate-45 transition-transform duration-1000 pointer-events-none">
                        <Tv size={240} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="2nd Display (Pole Display)"
                subtitle="Харилцагч талын 2-р дэлгэцийн агуулга, сурталчилгаа болон сагсны хяналт"
            />

            <div className="page-content mt-6 h-full flex flex-col gap-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-8 border shadow-lg bg-primary text-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up flex flex-col justify-center items-center gap-4 cursor-pointer">
                        <Tv size={48} className="relative z-10 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                        <span className="font-black uppercase tracking-widest text-[11px] relative z-10">Display Manager</span>
                        <Zap className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform duration-1000" size={120} />
                    </div>
                    {stats.map((s, i) => (
                        <div key={i} className="card p-8 border shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                                <div className={`p-4 rounded-2xl bg-${s.color}-light text-${s.color} shadow-sm group-hover:rotate-6 transition-transform`}>
                                    <s.icon size={28} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-gray-900 relative z-10">{s.value}</div>
                            <div className="mt-2 text-[10px] font-bold text-muted flex items-center gap-1 relative z-10">
                                <Clock size={12} /> Last updated: Just now
                            </div>
                            <s.icon className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-110 transition-transform" size={100} />
                        </div>
                    ))}
                    <div className="card p-8 border border-dashed border-gray-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all animate-slide-up group" style={{ animationDelay: '400ms' }}>
                        <div className="p-4 bg-surface-1 rounded-2xl text-muted group-hover:scale-110 transition-transform"><Smartphone size={28} strokeWidth={2.5} /></div>
                        <span className="font-black uppercase tracking-widest text-[11px] text-muted">Add Device</span>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary text-white rounded-xl shadow-lg"><Play size={20} fill="currentColor" /></div>
                            <h4 className="m-0 text-2xl font-black text-gray-900 tracking-tighter uppercase">Live Simulation</h4>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-outline h-12 px-8 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[11px] hover-lift">Full Screen</button>
                            <button className="btn btn-outline h-12 px-8 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[11px] hover-lift">Change Mode</button>
                        </div>
                    </div>
                    {renderLivePreview()}
                </div>
            </div>
        </HubLayout>
    );
}
