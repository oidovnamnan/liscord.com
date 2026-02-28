import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Layout,
    Globe,
    Smartphone,
    CreditCard,
    Truck,
    Settings,
    ExternalLink,
    Palette,
    Eye,
    Save,
    ChevronRight,
    ShoppingBag
} from 'lucide-react';

export function EcommercePage() {
    const [enabled, setEnabled] = useState(true);
    const [storeUrl] = useState('https://my-store.liscord.com');

    // Mock theme data
    const themes = [
        { id: 1, name: 'Minimal Mono', category: 'Загвар', active: true, image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&q=80&w=400' },
        { id: 2, name: 'Fashion Pulse', category: 'Хувцас', active: false, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400' },
        { id: 3, name: 'Digital Hub', category: 'Технологи', active: false, image: 'https://images.unsplash.com/photo-1526733158272-a1b4212cd500?auto=format&fit=crop&q=80&w=400' },
    ];

    const stats = [
        { label: 'Зочин (Сар)', value: '12,408', icon: Globe, color: 'primary' },
        { label: 'Борлуулалт (₮нийт)', value: '₮42.1M', icon: ShoppingBag, color: 'success' },
        { label: 'Хөрвүүлэлт', value: '4.2%', icon: Layout, color: 'info' },
    ];

    return (
        <HubLayout hubId="retail-hub">
            <Header
                title="Онлайн Дэлгүүр"
                subtitle="Өөрийн вэб дэлгүүрийг кодгүйгээр тохируулж ажиллуулах"
            />

            <div className="page-content mt-6 flex flex-col gap-8 stagger-children animate-fade-in translate-y-0 opacity-100">
                {/* Store Activation Banner */}
                <div className="card p-0 overflow-hidden border shadow-xl bg-gradient-to-br from-indigo-600 via-primary to-primary-focus text-white relative group">
                    <Globe className="absolute -right-16 -bottom-16 text-white/10 group-hover:scale-110 transition-transform duration-1000" size={300} strokeWidth={1} />
                    <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Active Storefront</span>
                                <h3 className="m-0 text-3xl font-black tracking-tight">{enabled ? 'Дэлгүүр идэвхтэй' : 'Дэлгүүр түр зогссон'}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-4 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner group-hover:bg-black/30 transition-all cursor-pointer">
                                <Globe size={18} className="text-white/60" />
                                <code className="text-sm font-black tracking-wider flex-1 truncate">{storeUrl}</code>
                                <button className="btn btn-ghost btn-sm text-white hover:bg-white/20 px-4 flex items-center gap-2"><ExternalLink size={16} /> Вэб нээх</button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-center">
                            <div className="toggle-container scale-125 p-4 bg-white/10 rounded-2xl border border-white/20">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" />
                                    <div className="w-14 h-8 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success"></div>
                                </label>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Дэлгүүр унтраах</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid-3 gap-6">
                    {stats.map((s, i) => (
                        <div key={i} className="card p-6 border shadow-lg bg-white group hover-lift relative overflow-hidden animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex justify-between items-start relative z-10 mb-2">
                                <div className={`p-2 rounded-2xl bg-${s.color}-light text-${s.color} shadow-sm transform group-hover:-rotate-6 transition-transform`}>
                                    <s.icon size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted">{s.label}</span>
                            </div>
                            <div className="text-3xl font-black tracking-tighter text-gray-900 relative z-10">{s.value}</div>
                            <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                                <s.icon size={100} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid-2 gap-8">
                    {/* Theme Selector */}
                    <div className="flex flex-col gap-6 animate-slide-left">
                        <div className="card border shadow-xl flex flex-col p-0 overflow-hidden group">
                            <div className="p-6 border-b bg-surface-2 group-hover:bg-white/50 transition-all flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                <h4 className="m-0 text-[11px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Palette size={14} className="text-primary" /> Дэлгүүрийн загвар сонгох
                                </h4>
                                <button className="btn btn-ghost btn-xs text-[10px] font-black uppercase tracking-widest text-primary">Дэлгэрэнгүй &rarr;</button>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-6 bg-surface-3/30">
                                {themes.map(t => (
                                    <div key={t.id} className={`card p-1 overflow-hidden relative border shadow-sm group/theme hover-lift ${t.active ? 'ring-2 ring-primary bg-primary/5' : 'bg-white'}`}>
                                        <div className="aspect-[21/9] bg-surface-1 rounded-2xl overflow-hidden relative">
                                            <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover/theme:scale-110 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                                <h4 className="m-0 text-white font-black text-lg tracking-tight">{t.name}</h4>
                                                <button className={`btn btn-sm text-[10px] font-extrabold uppercase tracking-widest px-6 rounded-2xl shadow-xl ${t.active ? 'btn-primary' : 'btn-white text-gray-900 border-none'}`}>
                                                    {t.active ? 'Идэвхтэй' : 'Сонгох'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Settings & Tools */}
                    <div className="flex flex-col gap-8 animate-slide-right">
                        <div className="card p-8 border shadow-xl bg-gradient-to-br from-surface-2 to-white relative group overflow-hidden">
                            <Settings className="absolute -right-8 -bottom-8 text-black/5 group-hover:rotate-180 transition-transform duration-1000" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-widest mb-8 flex items-center gap-2">
                                <Settings size={14} className="text-primary" /> Хурдан тохиргоо
                            </h4>
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all transform group-hover/item:-rotate-12">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-gray-800 uppercase tracking-tight">Төлбөрийн хэлбэр</div>
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">QPay, SocialPay, Мост Ухаалаг</div>
                                    </div>
                                    <ChevronRight size={18} className="text-muted group-hover/item:text-primary transition-all group-hover/item:translate-x-1" />
                                </div>
                                <div className="p-5 bg-white border border-black/5 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group/item cursor-pointer flex items-center gap-4">
                                    <div className="p-3 bg-surface-2 rounded-2xl text-muted group-hover/item:bg-primary group-hover/item:text-white transition-all transform group-hover/item:-rotate-12">
                                        <Truck size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-gray-800 uppercase tracking-tight">Хүргэлтийн нөхцөл</div>
                                        <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">Бүсчлэл, хүргэлтийн үнэ</div>
                                    </div>
                                    <ChevronRight size={18} className="text-muted group-hover/item:text-primary transition-all group-hover/item:translate-x-1" />
                                </div>
                            </div>
                            <div className="mt-12 flex flex-col gap-3 relative z-10">
                                <button className="btn btn-primary w-full h-14 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                                    <Save size={18} /> Тохиргоо хадгалах
                                </button>
                                <button className="btn btn-outline w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                                    <Eye size={18} /> Урьдчилан харах
                                </button>
                            </div>
                        </div>

                        <div className="card p-8 bg-black text-white relative border shadow-2xl group overflow-hidden">
                            <Smartphone className="absolute -right-8 -bottom-8 text-white/5 group-hover:-translate-y-4 transition-transform duration-700" size={160} />
                            <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest mb-6">Дэлгүүрийн QR код</h4>
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-lg shadow-white/10 group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://my-store.liscord.com')] bg-cover"></div>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <p className="m-0 text-white/60 text-xs font-bold leading-relaxed uppercase tracking-tighter">Энэхүү QR-ыг хэвлэн касс дээрээ тавьж харилцагчдынхаа захиалгыг шууд аваарай.</p>
                                    <button className="btn btn-ghost btn-xs text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 p-0 text-left w-fit mt-2">Хэвлэж авах &rarr;</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
