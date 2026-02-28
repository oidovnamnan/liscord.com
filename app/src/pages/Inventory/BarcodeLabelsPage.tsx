import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import {
    Barcode,
    Search,
    Printer,
    QrCode,
    LayoutTemplate,
    Zap,
    Share2,
    Database,
    Maximize,
    Scan,
    Tag,
    Smartphone,
    Download,
    Clock
} from 'lucide-react';

interface LabelDesign {
    id: string;
    name: string;
    type: 'barcode' | 'qr' | 'address' | 'price';
    size: string;
    lastUsed: string;
}

const MOCK_LABELS: LabelDesign[] = [
    {
        id: 'LBL-01',
        name: 'Standard Product Barcode (EAN-13)',
        type: 'barcode',
        size: '50x30mm',
        lastUsed: '2026-02-28'
    },
    {
        id: 'LBL-02',
        name: 'Inventory QR (Dynamic)',
        type: 'qr',
        size: '25x25mm',
        lastUsed: '2026-02-27'
    },
    {
        id: 'LBL-03',
        name: 'Shipping Label (A6)',
        type: 'address',
        size: '100x150mm',
        lastUsed: '2026-02-20'
    }
];

export function BarcodeLabelsPage() {
    const [labels] = useState<LabelDesign[]>(MOCK_LABELS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header
                    title="Баркод & Шошго (Labels)"
                    subtitle="Барааны баркод, QR код үүсгэх, шошго хэвлэх загвар болон принтерийн тохиргоо"
                    action={{
                        label: "Шинэ загвар",
                        onClick: () => { }
                    }}
                />

                <div className="grid-12 gap-6 mt-6">
                    {/* Insights Hub */}
                    <div className="col-12 grid grid-cols-4 gap-6">
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Нийт загвар</h4>
                                <div className="text-3xl font-black text-primary">12</div>
                            </div>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:scale-110 transition-transform"><LayoutTemplate size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Хэвлэсэн тоо</h4>
                                <div className="text-3xl font-black text-secondary">4,250</div>
                            </div>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-secondary group-hover:scale-110 transition-transform"><Printer size={28} /></div>
                        </div>
                        <div className="card p-6 bg-surface-2 border-none shadow-sm flex items-center justify-between group cursor-pointer hover:bg-surface-3 transition-all">
                            <div>
                                <h4 className="text-[10px] text-muted font-black tracking-widest uppercase mb-1">Төхөөрөмжүүд</h4>
                                <div className="text-3xl font-black text-warning">3</div>
                            </div>
                            <div className="bg-warning/10 p-4 rounded-2xl text-warning group-hover:scale-110 transition-transform"><Scan size={28} /></div>
                        </div>
                        <div className="card p-6 bg-gradient-to-br from-primary to-primary-dark text-white border-none shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative">
                            <Zap size={64} className="absolute -bottom-4 -right-4 opacity-10" />
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-1 opacity-80">Cloud Print</h4>
                                <div className="text-xl font-black text-white">SYSTEM READY</div>
                            </div>
                            <div className="relative z-10 bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform"><Smartphone size={28} /></div>
                        </div>
                    </div>

                    <div className="col-12 flex gap-4 mt-2">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input className="input pl-10 h-10 w-full" placeholder="Загвар хайх..." />
                        </div>
                        <button className="btn btn-outline h-10 px-4">Сүүлийнх</button>
                    </div>

                    {/* Template Cards */}
                    <div className="col-12 grid grid-cols-3 gap-6">
                        {labels.map(label => (
                            <div key={label.id} className="card p-0 overflow-hidden hover-lift shadow-sm bg-surface-1 border-none group flex flex-col">
                                <div className="p-10 bg-surface-2 flex items-center justify-center relative overflow-hidden group-hover:bg-surface-3 transition-colors">
                                    <div className="absolute inset-0 opacity-[0.03] text-primary"><Database size={100} /></div>
                                    <div className="h-24 w-40 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center p-4 border-2 border-border-color/10 group-hover:scale-105 transition-transform">
                                        {label.type === 'barcode' ? <Barcode size={48} className="text-black" /> :
                                            label.type === 'qr' ? <QrCode size={48} className="text-black" /> : <Tag size={48} className="text-black" />}
                                        <div className="mt-2 text-[6px] font-black text-black opacity-40 uppercase tracking-widest">Liscord OS Label System</div>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-black group-hover:text-primary transition-colors">{label.name}</h3>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                <Maximize size={12} /> {label.size} • {label.id}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 text-xs font-bold text-muted uppercase tracking-widest border-t border-border-color/5 pt-4">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {label.lastUsed} СҮҮЛД ХЭВЛЭСЭН</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button className="btn btn-outline py-3 rounded-2xl font-black text-xs hover:bg-surface-2 transition-all flex items-center justify-center gap-2">
                                            <Download size={16} /> ТАТАХ
                                        </button>
                                        <button className="btn btn-primary py-3 rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                            <Printer size={16} /> ХЭВЛЭХ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Printer Config / Automation Alert */}
                    <div className="col-12 mt-6 card p-6 bg-surface-2 border-dashed border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-primary/5">
                        <div className="flex items-center gap-6">
                            <div className="bg-primary/5 p-4 rounded-2xl text-primary"><Zap size={32} /></div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Zebra & TSC Принтер Холболт</h3>
                                <p className="text-sm text-muted">Шууд хэвлэгч төхөөрөмжүүдийг холбож, баркодыг автоматаар хэвлэх тохиргоо.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-outline border-primary text-primary font-black px-10 py-3 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">ТОХИРГОО</button>
                            <button className="btn btn-ghost p-3 rounded-2xl bg-surface-3 border border-border-color/10"><Share2 size={24} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
