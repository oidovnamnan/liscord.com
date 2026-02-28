import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    ClipboardCheck,
    Search,
    Clock,
    User,
    ArrowRight,
    Filter,
    CheckCircle2,
    History,
    Zap,
    Share2,
    Boxes,
    AlertTriangle,
    Calculator
} from 'lucide-react';

interface AuditItem {
    id: string;
    warehouse: string;
    itemsCount: number;
    status: 'planned' | 'in-progress' | 'completed' | 'adjusting';
    auditor: string;
    date: string;
    discrepancy: number;
}

const MOCK_AUDITS: AuditItem[] = [
    {
        id: 'AUD-901',
        warehouse: 'Main Warehouse (A)',
        itemsCount: 1240,
        status: 'in-progress',
        auditor: 'Э.Батболд',
        date: '2026-02-28',
        discrepancy: 12
    },
    {
        id: 'AUD-902',
        warehouse: 'Small Branch - Zaisan',
        itemsCount: 150,
        status: 'completed',
        auditor: 'Г.Тулга',
        date: '2026-02-25',
        discrepancy: 0
    },
    {
        id: 'AUD-903',
        warehouse: 'Central Distribution',
        itemsCount: 5400,
        status: 'planned',
        auditor: 'С.Баяр',
        date: '2026-03-05',
        discrepancy: 0
    }
];

export function InventoryAuditPage() {
    const [audits] = useState<AuditItem[]>(MOCK_AUDITS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Агуулахын Тооллого (Audit)"
                    subtitle="Бараа материалын бодит үлдэгдэл тулгах, тооллого зохион байгуулах болон зөрүү арилгах"
                    action={{
                        label: "Тооллого эхлэх",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт тооллого</h4>
                                <div className="text-3xl font-black text-primary">48</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><ClipboardCheck size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөрүүгүй %</h4>
                                <div className="text-3xl font-black text-success">94.2%</div>
                            </div>
                            <div className="bg-success/10 p-4 rounded-2xl text-success group-hover:scale-110 transition-transform"><CheckCircle2 size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Зөрүү илэрсэн</h4>
                                <div className="text-3xl font-black text-danger">₮4.5M</div>
                            </div>
                            <div className="bg-danger/10 p-4 rounded-2xl text-danger group-hover:scale-110 transition-transform"><AlertTriangle size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Calculator size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Нийт тоолсон</h4>
                                <div className="text-3xl font-black">124K</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Boxes size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Тооллого, агуулах, хариуцагчийн нэрээр хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4"><Filter size={16} className="mr-2" /> Сүүлийнх</button>
                    </div>

                    {/* Audit Pipeline */}
                    <div className="col-12 grid grid-cols-1 gap-4">
                        {audits.map(audit => (
                            <div key={audit.id} className="card p-0 overflow-hidden hover-shadow transition-shadow border-none bg-surface-1 group">
                                <div className="flex flex-col md:flex-row items-stretch">
                                    <div className={`p-6 flex flex-col justify-center items-center border-r border-border-color/10 min-w-[140px] bg-surface-2 ${audit.status === 'completed' ? 'text-success' :
                                            audit.status === 'in-progress' ? 'text-warning' :
                                                audit.status === 'planned' ? 'text-primary' : 'text-secondary'
                                        }`}>
                                        <div className="h-16 w-16 rounded-full bg-surface-3 border-2 border-border-color/10 flex items-center justify-center font-black text-xl text-primary shadow-inner">
                                            {audit.status === 'completed' ? <CheckCircle2 size={32} /> :
                                                audit.status === 'in-progress' ? <Zap size={32} /> :
                                                    audit.status === 'planned' ? <History size={32} /> : <History size={32} />}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest mt-3 text-center leading-tight">{audit.id}</div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black leading-tight hover:text-primary transition-colors cursor-pointer">{audit.warehouse}</h3>
                                                <div className="badge badge-outline text-[10px] font-black uppercase tracking-widest border-border-color">
                                                    {audit.itemsCount} НЭР ТӨРӨЛ
                                                </div>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest mt-2">
                                                <span className="flex items-center gap-1 text-primary lowercase"><User size={12} /> {audit.auditor}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {audit.date} ЭХЭЛСЭН</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">ЗӨРҮҮ</div>
                                                <div className={`text-2xl font-black ${audit.discrepancy > 0 ? 'text-danger' : 'text-success'}`}>
                                                    {audit.discrepancy > 0 ? `-${audit.discrepancy}` : '0'}
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-border-color/10 mx-2" />
                                            <div className="flex gap-2">
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

                    {/* Audit Scanner Feature / Actions */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Гар утсаар тоолох (App Sync)</h3>
                                <p className="text-sm text-muted">Liscord аппликейшн ашиглан баркод уншуулж тооллогыг хурдасгаж, зөрүүг шууд илрүүлнэ.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">АПП ХОЛБОХ</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
