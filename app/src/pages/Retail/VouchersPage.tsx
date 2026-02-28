import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Ticket,
    Plus,
    Calendar,
    Clock,
    TrendingUp,
    DollarSign,
    Search,
    Filter,
    Copy,
    Settings,
    Tag,
    ChevronRight,
    Users
} from 'lucide-react';

export function VouchersPage() {
    const [view, setView] = useState<'list' | 'create'>('list');

    // Mock voucher data
    const vouchers = [
        { id: 1, code: 'NEWYEAR20', type: 'percentage', value: 20, usage: '1.2k/5k', status: 'active', expiry: '2024-12-31' },
        { id: 2, code: 'LISC-10K', type: 'fixed', value: 10000, usage: '45/100', status: 'active', expiry: '2024-03-31' },
        { id: 3, code: 'WELCOME-FREE', type: 'percentage', value: 100, usage: '20/20', status: 'expired', expiry: '2024-01-01' },
        { id: 4, code: 'SUMMER-VIBE', type: 'percentage', value: 15, usage: '0/1k', status: 'scheduled', expiry: '2024-06-01' },
    ];

    const stats = [
        { label: 'Нийт ашиглалт', value: '1.4k', icon: Users, color: 'primary' },
        { label: 'Хэмнэсэн дүн', value: '₮12.4M', icon: DollarSign, color: 'success' },
        { label: 'Идэвхтэй купон', value: '8', icon: Ticket, color: 'info' },
    ];

    const renderList = () => (
        <div className="flex flex-col gap-6 stagger-children animate-fade-in translate-y-0 opacity-100 h-full">
            {/* KPI Cards */}
            <div className="grid-3 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="card p-6 border shadow-lg bg-white relative overflow-hidden group hover-lift animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between items-start mb-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{s.label}</span>
                            <div className={`p-2 rounded-xl bg-${s.color}-light text-${s.color} shadow-sm group-hover:rotate-12 transition-transform`}>
                                <s.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className="text-3xl font-black tracking-tighter text-gray-900 mt-2 relative z-10">{s.value}</div>
                        <TrendingUp className="absolute -right-4 -bottom-4 text-black/5 group-hover:scale-125 transition-transform" size={100} />
                    </div>
                ))}
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-surface-2 p-4 rounded-3xl border shadow-inner shadow-black/5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input type="text" className="input h-14 pl-12 rounded-2xl bg-white border-none ring-1 ring-black/5 focus:ring-primary/40 text-lg font-bold" placeholder="Купон код хайх..." />
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-outline h-14 rounded-2xl px-6 flex items-center gap-2"><Filter size={20} /> Шүүлтүүр</button>
                    <button className="btn btn-primary h-14 rounded-2xl px-8 flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all" onClick={() => setView('create')}>
                        <Plus size={24} strokeWidth={3} /> Шинэ купон
                    </button>
                </div>
            </div>

            {/* Voucher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vouchers.map((v, i) => (
                    <div key={v.id} className={`card p-0 relative border-2 shadow-lg hover-lift group overflow-hidden ${v.status === 'expired' ? 'opacity-60 grayscale border-dashed border-gray-300' : 'bg-white border-surface-2 hover:border-primary/20'} animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                        <div className={`p-6 border-b flex justify-between items-center ${v.status === 'active' ? 'bg-primary text-white' : 'bg-surface-2 text-muted'}`}>
                            <div className="flex items-center gap-3">
                                <Tag size={20} className={v.status === 'active' ? 'text-white' : 'text-muted'} />
                                <h4 className="m-0 text-xl font-black tracking-widest">{v.code}</h4>
                            </div>
                            <Copy className="cursor-pointer hover:scale-110 active:scale-90 transition-all" size={18} />
                        </div>

                        <div className="p-8 pb-4 relative">
                            {/* Decorative Cutouts */}
                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-surface-3 rounded-full -translate-y-1/2 border-r-2 border-surface-2 z-10"></div>
                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-surface-3 rounded-full -translate-y-1/2 border-l-2 border-surface-2 z-10"></div>
                            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-dashed border-gray-100 -translate-y-1/2 pointer-events-none"></div>

                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted">Хэмжээ</span>
                                    <div className="text-4xl font-black tracking-tighter text-gray-900">
                                        {v.type === 'percentage' ? `${v.value}%` : `₮${(v.value / 1000).toFixed(0)}k`}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted">Ашиглалт</span>
                                    <div className="text-xl font-black tracking-tight text-primary">{v.usage}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-surface-2/50 border-t flex items-center justify-between group-hover:bg-white transition-all">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted">
                                <Clock size={14} /> Дуусах: {v.expiry}
                            </div>
                            <button className="btn btn-ghost btn-icon h-10 w-10 rounded-xl hover:bg-surface-1 text-muted hover:text-primary active:scale-90 transition-all border border-transparent hover:border-black/5">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCreate = () => (
        <div className="card p-0 flex flex-col h-full border shadow-2xl relative animate-fade-in translate-y-0 opacity-100 overflow-hidden">
            <div className="p-6 border-b bg-surface-2 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>&larr; Буцах</button>
                    <h3 className="m-0 font-extrabold tracking-tight">Шинэ купон үүсгэх</h3>
                </div>
                <button className="btn btn-primary btn-sm flex items-center gap-2 shadow-lg shadow-primary/20 px-8 rounded-xl h-12">Хадгалах</button>
            </div>

            <div className="flex-1 p-12 overflow-y-auto bg-gradient-to-br from-white to-surface-3/30">
                <div className="max-w-2xl mx-auto flex flex-col gap-12">
                    {/* Preview Card */}
                    <div className="flex flex-col items-center gap-6">
                        <span className="text-[10px] font-black uppercase text-muted tracking-widest bg-white/60 px-4 py-1 rounded-full border shadow-sm">Урьдчилан харах</span>
                        <div className="card p-0 w-80 bg-primary text-white shadow-2xl skew-x-1 hover:rotate-2 transition-transform duration-700 overflow-hidden relative border-4 border-white">
                            <Ticket className="absolute -right-20 -bottom-20 text-white/5 opacity-40" size={300} strokeWidth={1} />
                            <div className="p-8 text-center flex flex-col gap-6 relative z-10">
                                <div className="text-5xl font-black tracking-[0.3em] font-mono drop-shadow-lg">NEW-25</div>
                                <div className="w-full border-t border-dashed border-white/20"></div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs uppercase font-black tracking-widest opacity-60">Хөнгөлөлт</span>
                                    <div className="text-6xl font-black tracking-tighter">25%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="form-group flex flex-col gap-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                <Tag size={14} className="text-primary" /> Купон Код
                            </label>
                            <input type="text" className="input h-14 rounded-2xl bg-white border-2 border-gray-100 focus:border-primary shadow-sm hover:shadow-lg focus:shadow-xl transition-all font-black text-xl uppercase tracking-widest p-6" placeholder="Жишээ: SUMMER20" />
                        </div>
                        <div className="form-group flex flex-col gap-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                <Settings size={14} className="text-primary" /> Төрөл
                            </label>
                            <select className="select h-14 rounded-2xl bg-white border-2 border-gray-100 focus:border-primary shadow-sm font-bold p-4">
                                <option>Хувь (%)</option>
                                <option>Тогтмол дүн (₮)</option>
                                <option>Үнэгүй хүргэлт</option>
                            </select>
                        </div>
                        <div className="form-group flex flex-col gap-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                <DollarSign size={14} className="text-primary" /> Хэмжээ
                            </label>
                            <input type="number" className="input h-14 rounded-2xl bg-white border-2 border-gray-100 focus:border-primary shadow-sm font-black p-4 text-center text-xl" defaultValue={20} />
                        </div>
                        <div className="form-group flex flex-col gap-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                <Calendar size={14} className="text-primary" /> Хүчинтэй хугацаа
                            </label>
                            <input type="date" className="input h-14 rounded-2xl bg-white border-2 border-gray-100 focus:border-primary shadow-sm font-bold p-4 text-center" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="retail-hub">
            <Header
                title="Бэлгийн Карт & Купон"
                subtitle="Борлуулалтыг дэмжих хөнгөлөлтийн код, бэлгийн карт үүсгэж удирдах"
            />

            <div className="page-content mt-6 flex flex-col gap-8 h-full">
                {view === 'list' ? renderList() : renderCreate()}
            </div>
        </HubLayout>
    );
}
