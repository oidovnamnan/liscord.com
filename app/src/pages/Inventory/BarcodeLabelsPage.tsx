import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import './BarcodeLabelsPage.css';
import {
    Search,
    Printer,
    LayoutTemplate,
    Zap,
    Share2,
    Database,
    Maximize,
    Scan,
    Tag,
    Smartphone,
    Download,
    Clock,
    CheckCircle2,
    Settings,
    MoreVertical
} from 'lucide-react';

interface LabelDesign {
    id: string;
    name: string;
    type: 'barcode' | 'qr' | 'address' | 'price';
    size: string;
    lastUsed: string;
    status: 'Ready' | 'In Use';
}

const MOCK_LABELS: LabelDesign[] = [
    {
        id: 'LBL-01',
        name: 'Standard Product Barcode (EAN-13)',
        type: 'barcode',
        size: '50x30mm',
        lastUsed: '2026-02-28',
        status: 'Ready'
    },
    {
        id: 'LBL-02',
        name: 'Inventory QR (Dynamic)',
        type: 'qr',
        size: '25x25mm',
        lastUsed: '2026-02-27',
        status: 'In Use'
    },
    {
        id: 'LBL-03',
        name: 'Shipping Label (A6)',
        type: 'address',
        size: '100x150mm',
        lastUsed: '2026-02-20',
        status: 'Ready'
    }
];

export function BarcodeLabelsPage() {
    const [labels] = useState<LabelDesign[]>(MOCK_LABELS);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="barcode-labels-page animate-fade-in">
                <Header
                    title="Баркод & Шошго (Labels)"
                    subtitle="Барааны баркод, QR код үүсгэх, шошго хэвлэх загвар болон принтерийн тохиргоо"
                    action={{
                        label: "Шинэ загвар",
                        onClick: () => { }
                    }}
                />

                <div className="stats-grid-premium">
                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Нийт загвар</h4>
                            <div className="stat-value-large">12</div>
                        </div>
                        <div className="stat-icon-box bg-primary/10 text-primary">
                            <LayoutTemplate size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Хэвлэсэн тоо</h4>
                            <div className="stat-value-large">4,250</div>
                        </div>
                        <div className="stat-icon-box bg-secondary/10 text-secondary">
                            <Printer size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Төхөөрөмжүүд</h4>
                            <div className="stat-value-large">3</div>
                        </div>
                        <div className="stat-icon-box bg-warning/10 text-warning">
                            <Scan size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2 cloud-print-active shadow-glow">
                        <div className="stat-content">
                            <h4>Cloud Print</h4>
                            <div className="status-indicator">
                                <div className="pulse-circle"></div>
                                SYSTEM READY
                            </div>
                        </div>
                        <div className="stat-icon-box">
                            <Smartphone size={28} />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 items-center">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input className="input pl-12 h-12 w-full rounded-2xl bg-surface-2 border-transparent focus:bg-surface-3 transition-all" placeholder="Загвар хайх..." />
                    </div>
                    <button className="btn btn-secondary h-12 px-6 rounded-2xl font-bold flex items-center gap-2">
                        <Clock size={18} /> Сүүлийнх
                    </button>
                    <button className="btn btn-secondary h-12 w-12 p-0 rounded-2xl">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* Template Cards */}
                <div className="template-grid-premium">
                    {labels.map(label => (
                        <div key={label.id} className="template-card-premium">
                            <div className="template-preview-premium group">
                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
                                    <Database size={240} className="absolute -right-20 -bottom-20 rotate-12" />
                                </div>

                                <div className="label-mockup-floating">
                                    {label.type === 'barcode' ? (
                                        <div className="w-full h-full flex flex-col items-center">
                                            <div className="barcode-placeholder" />
                                            <div className="text-[10px] text-black font-black uppercase tracking-[3px] mt-1">Liscord OS Label</div>
                                        </div>
                                    ) : label.type === 'qr' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <div className="qr-placeholder" />
                                            <div className="text-[8px] text-black font-bold mt-2">Dynamic System QR</div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-black">
                                            <Tag size={32} />
                                            <div className="mt-2 text-[10px] font-black underline">SHIPPING TRACKING</div>
                                            <div className="text-[8px] mt-1 opacity-60">ID: {label.id}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="template-details-premium">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black">{label.name}</h3>
                                    <div className="badge badge-info bg-cyan-tint text-[10px] py-1 border-none font-black">{label.status}</div>
                                </div>

                                <div className="template-badge-row">
                                    <div className="badge bg-surface-2 text-muted border-none text-[10px] flex items-center gap-1 font-black">
                                        <Maximize size={12} /> {label.size}
                                    </div>
                                    <div className="badge bg-surface-2 text-muted border-none text-[10px] flex items-center gap-1 font-black">
                                        <Database size={12} /> {label.id}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-muted uppercase tracking-wider">
                                    <Clock size={12} />
                                    <span>Сүүлд: {label.lastUsed}</span>
                                    <CheckCircle2 size={12} className="text-accent-green ml-auto" />
                                </div>

                                <div className="action-buttons-premium">
                                    <button className="btn btn-secondary py-4 rounded-2xl font-black text-xs hover:bg-surface-3 border-transparent transition-all flex items-center justify-center gap-2 bg-surface-2">
                                        <Download size={18} className="text-secondary" /> ТАТАХ
                                    </button>
                                    <button className="btn btn-primary py-4 rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                                        <Printer size={18} /> ХЭВЛЭХ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Zebra Section */}
                <div className="zebra-integration-card">
                    <div className="zebra-content">
                        <div className="stat-icon-box bg-primary/10 text-primary">
                            <Zap size={36} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white">Zebra & TSC Принтер Холболт</h3>
                            <p className="text-sm text-muted max-w-md">Төвлөрсөн Cloud Print системээр хэвлэгч төхөөрөмжүүдийг алсаас удирдаж, шууд хэвлэх модуль.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn btn-outline border-border-primary text-white font-black px-12 py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2">
                            <Settings size={20} /> ТОХИРГОО
                        </button>
                        <button className="btn btn-secondary p-4 rounded-2xl bg-surface-3 border-none shadow-xl">
                            <Share2 size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
