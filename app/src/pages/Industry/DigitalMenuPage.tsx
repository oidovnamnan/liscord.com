import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    QrCode,
    Smartphone,
    Settings,
    Share2,
    Eye,
    Plus,
    Image,
    Layout,
    Search,
    ChevronRight,
    Utensils,
    Star,
    Zap
} from 'lucide-react';

export function DigitalMenuPage() {
    const [view, setView] = useState<'admin' | 'preview'>('admin');

    const menuItems = [
        { id: 1, name: 'Цуйван', price: '₮12,500', category: 'Main', image: '/media/img/foods/tsuivan.jpg', rating: 4.8 },
        { id: 2, name: 'Хуушуур', price: '₮2,500', category: 'Main', image: '/media/img/foods/khuushuur.jpg', rating: 4.9 },
        { id: 3, name: 'Стейк', price: '₮45,000', category: 'Main', image: '/media/img/foods/steak.jpg', rating: 4.7 },
        { id: 4, name: 'Ласи', price: '₮8,500', category: 'Drink', image: '/media/img/foods/lassi.jpg', rating: 4.5 },
    ];

    const stats = [
        { label: 'Цэсний хандалт', value: '1,240', icon: Eye, color: 'primary' },
        { label: 'Шууд захиалга (App)', value: '85', icon: Zap, color: 'success' },
        { label: 'QR Хэвлэлт', value: '24 ширхэг', icon: QrCode, color: 'info' },
    ];

    const renderAdmin = () => (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in translate-y-0 opacity-100">
            {/* Left: Menu Management */}
            <div className="flex-1 flex flex-col gap-8">
                <div className="flex justify-between items-center group">
                    <div className="flex gap-4">
                        {['All', 'Main', 'Soup', 'Drink', 'Dessert'].map((c, i) => (
                            <button key={c} className={`btn btn-sm h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest ${i === 0 ? 'btn-primary' : 'btn-ghost text-muted hover:bg-surface-2'}`}>{c}</button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-primary h-12 px-6 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"><Plus size={16} /> Шинэ хоол нэмэх</button>
                        <button className="btn btn-outline h-12 w-12 p-0 rounded-2xl border-black/5 hover:bg-surface-2"><Search size={18} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item, i) => (
                        <div key={item.id} className="card p-0 border shadow-lg bg-white rounded-[2rem] group hover-lift overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex h-36">
                                <div className="w-36 bg-surface-2 relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                                        <Image size={32} strokeWidth={1.5} />
                                    </div>
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="badge badge-primary font-black uppercase text-[8px] px-2 py-0.5 rounded-lg flex items-center gap-1"><Star size={8} /> {item.rating}</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="m-0 text-lg font-black tracking-tight text-gray-800">{item.name}</h4>
                                            <button className="text-muted hover:text-primary transition-colors"><Settings size={14} /></button>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-muted tracking-widest mt-1 block">{item.category}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-lg font-black text-primary tracking-tighter">{item.price}</div>
                                        <button className="btn btn-ghost btn-icon h-10 w-10 p-0 rounded-xl bg-surface-2 text-muted hover:text-primary transition-all group-hover:bg-primary group-hover:text-white"><ChevronRight size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: QR & Theme Config */}
            <div className="w-full lg:w-[400px] flex flex-col gap-8">
                <div className="card p-8 border shadow-xl bg-gradient-to-br from-[#1a1c22] to-black rounded-[2.5rem] text-white relative overflow-hidden group">
                    <QrCode className="absolute -right-8 -top-8 text-white/5 group-hover:scale-125 transition-transform duration-1000" size={200} />
                    <h4 className="m-0 text-[10px] font-black uppercase text-white/40 tracking-widest mb-8 flex items-center gap-2">
                        <Smartphone size={14} className="text-primary" /> QR Код удирдах
                    </h4>
                    <div className="flex flex-col items-center gap-8 relative z-10 py-4">
                        <div className="w-48 h-48 bg-white p-6 rounded-[2.5rem] shadow-2xl relative group-hover:rotate-1 transition-transform">
                            <QrCode size={144} className="text-black" strokeWidth={1.5} />
                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors rounded-[2.5rem]"></div>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <p className="m-0 text-center text-xs font-bold text-white/40 tracking-wide leading-relaxed">Харилцагч энэ кодыг уншуулснаар шууд цэс рүү үсэрч захиалга өгнө.</p>
                            <div className="h-px bg-white/10 my-2"></div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="btn btn-white h-14 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2"><Share2 size={16} /> Хуваалцах</button>
                                <button className="btn btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/40 flex items-center justify-center gap-2" onClick={() => setView('preview')}><Eye size={16} /> Харах</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card p-8 border shadow-xl bg-white rounded-[2.5rem] flex flex-col gap-6 group overflow-hidden">
                    <Layout className="absolute -right-6 -bottom-6 text-black/5 group-hover:rotate-12 transition-transform duration-700" size={140} />
                    <h4 className="m-0 text-[11px] font-black uppercase text-gray-500 tracking-widest mb-2">Загвар тохиргоо</h4>
                    <div className="flex flex-col gap-4 relative z-10">
                        {['Цайвар (Light)', 'Харанхуй (Dark)', 'Классик', 'Орчин үеийн'].map((t, i) => (
                            <div key={t} className={`p-4 border border-black/5 rounded-2xl hover:border-primary/20 hover:bg-surface-2 transition-all cursor-pointer flex items-center justify-between group/item ${i === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                                <div className="text-xs font-black uppercase tracking-tight text-gray-700">{t}</div>
                                <div className={`w-4 h-4 rounded-full border-2 border-primary-light flex items-center justify-center ${i === 0 ? 'bg-primary border-primary' : ''}`}>
                                    {i === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-outline w-full h-12 rounded-2xl border-black/5 font-black uppercase tracking-widest text-[9px] mt-2"><Smartphone size={14} /> Mobile Preview &rarr;</button>
                </div>
            </div>
        </div>
    );

    const renderPreview = () => (
        <div className="flex flex-col items-center gap-8 animate-slide-up h-full">
            <div className="w-[380px] h-[750px] bg-[#0f1115] rounded-[3.5rem] border-[8px] border-black shadow-2xl relative overflow-hidden flex flex-col group">
                {/* Mobile Screen Interaction */}
                <div className="absolute top-0 w-full h-6 bg-black flex justify-center items-end pb-1.5">
                    <div className="w-16 h-1 rounded-full bg-white/20"></div>
                </div>

                <div className="flex-1 overflow-y-auto pt-10 px-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white rotate-6"><Utensils size={24} /></div>
                            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Table: 04</div>
                        </div>
                        <h2 className="m-0 text-white text-3xl font-black mt-4 tracking-tighter">Liscord Kitchen</h2>
                        <p className="m-0 text-white/40 text-xs font-bold uppercase tracking-tight">Luxury Mongolian Dining</p>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {['Бүгд', 'Үндсэн', 'Шөл', 'Салат', 'Drink'].map((c, i) => (
                            <span key={c} className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white/5 text-white/40 border border-white/5'}`}>{c}</span>
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Үндсэн хоол</div>
                        {menuItems.filter(i => i.category === 'Main').map((item) => (
                            <div key={item.id} className="flex gap-4 group/item">
                                <div className="w-24 h-24 rounded-[1.5rem] bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover/item:scale-105 transition-transform duration-500">
                                    <Image className="text-white/10" size={24} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <div className="text-md font-black text-white tracking-tight">{item.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-primary font-black uppercase tracking-tighter mt-1"><Star size={10} fill="currentColor" /> {item.rating} • 15 мин</div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-lg font-black text-white tracking-tighter">{item.price}</div>
                                        <button className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"><Plus size={18} strokeWidth={3} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-black/80 backdrop-blur-xl border-t border-white/5 flex flex-col gap-4">
                    <button className="btn btn-primary w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 active:scale-95 transition-all">
                        Миний сагс (₮12,500) <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <button className="btn btn-ghost btn-sm font-black uppercase tracking-widest text-[10px] text-muted hover:text-primary transition-all flex items-center gap-2" onClick={() => setView('admin')}><Smartphone size={14} /> Удирдлагын цонх руу буцах</button>
        </div>
    );

    return (
        <HubLayout hubId="industry-hub">
            <Header
                title="QR Цэс & Дижитал Захиалга"
                subtitle="Харилцагч утаснаасаа шууд захиалга өгөх, цэсний тохиргоо, хандалтын хяналт"
            />

            <div className="page-content mt-6 h-full">
                {view === 'admin' && stats && (
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
                )}
                {view === 'admin' ? renderAdmin() : renderPreview()}
            </div>
        </HubLayout>
    );
}
