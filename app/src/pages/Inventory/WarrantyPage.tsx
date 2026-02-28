import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    ShieldCheck,
    Search,
    Clock,
    ArrowRight,
    Filter,
    History,
    Zap,
    Share2,
    Database,
    QrCode,
    Barcode,
    Calendar,
    AlertTriangle,
    CheckCircle,
    User,
    AlertCircle
} from 'lucide-react';

interface WarrantyItem {
    id: string;
    product: string;
    serialNumber: string;
    status: 'active' | 'expired' | 'claimed' | 'void';
    startDate: string;
    endDate: string;
    customer: string;
}

const MOCK_WARRANTY: WarrantyItem[] = [
    {
        id: 'W-001',
        product: 'Liscord POS Terminal X1',
        serialNumber: 'SN-00921-2026',
        status: 'active',
        startDate: '2026-01-15',
        endDate: '2027-01-15',
        customer: 'Э.Батболд'
    },
    {
        id: 'W-002',
        product: 'Industrial Laser Cutter',
        serialNumber: 'SN-992-LC-01',
        status: 'claimed',
        startDate: '2025-05-10',
        endDate: '2026-05-10',
        customer: 'Metal Tech LLC'
    },
    {
        id: 'W-003',
        product: 'Smart Warehouse Shelving',
        serialNumber: 'SW-SHELF-03-91',
        status: 'expired',
        startDate: '2024-02-01',
        endDate: '2025-02-01',
        customer: 'Liscord Central'
    }
];

export function WarrantyPage() {
    const [warranties] = useState<WarrantyItem[]>(MOCK_WARRANTY);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Баталгаат Хугацаа (Warranty)"
                    subtitle="Барааны сериал дугаар, баталгаат хугацааны хяналт болон засварын түүх"
                    action={{
                        label: "Бүртгэл нэмэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт идэвхтэй</h4>
                                <div className="text-3xl font-black text-primary">1,245</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><ShieldCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Дуусах дөхсөн</h4>
                                <div className="text-3xl font-black text-warning">42</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Засварт буй</h4>
                                <div className="text-3xl font-black text-secondary">8</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Clock size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-success to-success-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <CheckCircle size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Нийт хамгаалалт</h4>
                                <div className="text-3xl font-black">₮4.2B</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Database size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Сериал дугаар, бүтээгдэхүүн, харилцагчийн нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Төлөв</button>
                    </div>

                    {/* Warranty Registry */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {warranties.map(item => (
                            <div key={item.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${item.status === 'active' ? 'text-success' :
                                            item.status === 'claimed' ? 'text-warning' :
                                                item.status === 'expired' ? 'text-danger' : 'text-muted'
                                        }`}>
                                        <div className="h-16 w-16 rounded-3xl bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner">
                                            {item.status === 'active' ? <ShieldCheck size={32} /> :
                                                item.status === 'claimed' ? <History size={32} /> :
                                                    item.status === 'expired' ? <AlertCircle size={32} /> : <AlertTriangle size={32} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-3 text-center leading-tight">{item.id}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{item.product}</h3>
                                                <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                    <Barcode size={10} className="mr-1" /> {item.serialNumber}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary lowercase"><User size={12} /> {item.customer}</span>
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {item.endDate} ХҮРТЭЛ</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">БАТАЛГАА</div>
                                                <span className={`badge badge-block font-black px-6 py-2 rounded-2xl badge-${item.status === 'active' ? 'success' :
                                                        item.status === 'expired' ? 'danger' :
                                                            item.status === 'claimed' ? 'warning' : 'primary'
                                                    }`}>
                                                    {item.status === 'active' ? 'ХҮЧИН ТӨГӨЛДӨР' :
                                                        item.status === 'claimed' ? 'НӨХӨН ТӨЛБӨРТЭЙ' :
                                                            item.status === 'expired' ? 'ХУГАЦАА ДУУССАН' : 'ХҮЧИНГҮЙ'}
                                                </span>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost p-4 rounded-xl bg-surface-3 hover:text-primary transition-colors"><QrCode size={20} /></button>
                                                <button className="btn btn-primary h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                                    <ArrowRight size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Expiration Alerts / Actions */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Баталгаат хугацааны систем</h3>
                                <p className="text-sm text-muted">Бүх сериал дугаартай барааны баталгааг нэг дороос хянах, засварын түүх харах.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТҮҮХ ХАРАХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
