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
        size: '50×30mm',
        lastUsed: '2026-02-28',
        status: 'Ready'
    },
    {
        id: 'LBL-02',
        name: 'Inventory QR (Dynamic)',
        type: 'qr',
        size: '25×25mm',
        lastUsed: '2026-02-27',
        status: 'In Use'
    },
    {
        id: 'LBL-03',
        name: 'Shipping Label (A6)',
        type: 'address',
        size: '100×150mm',
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

                {/* ====== Stats Grid ====== */}
                <div className="stats-grid-premium">
                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Нийт загвар</h4>
                            <div className="stat-value-large">12</div>
                        </div>
                        <div className="stat-icon-box icon-primary">
                            <LayoutTemplate size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Хэвлэсэн тоо</h4>
                            <div className="stat-value-large">4,250</div>
                        </div>
                        <div className="stat-icon-box icon-cyan">
                            <Printer size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-content">
                            <h4>Төхөөрөмжүүд</h4>
                            <div className="stat-value-large">3</div>
                        </div>
                        <div className="stat-icon-box icon-orange">
                            <Scan size={28} />
                        </div>
                    </div>

                    <div className="stat-card-v2 cloud-print-card">
                        <div className="stat-content">
                            <h4>Cloud Print</h4>
                            <div className="status-indicator">
                                <div className="pulse-dot" />
                                SYSTEM READY
                            </div>
                        </div>
                        <div className="stat-icon-box">
                            <Smartphone size={28} />
                        </div>
                    </div>
                </div>

                {/* ====== Search Toolbar ====== */}
                <div className="search-toolbar-premium">
                    <div className="search-input-wrap">
                        <Search size={18} className="search-icon" />
                        <input className="search-input-premium" placeholder="Загвар хайх..." />
                    </div>
                    <button className="toolbar-btn">
                        <Clock size={18} /> Сүүлийнх
                    </button>
                    <button className="toolbar-btn toolbar-btn-icon">
                        <MoreVertical size={20} />
                    </button>
                </div>

                {/* ====== Template Cards ====== */}
                <div className="template-grid-premium">
                    {labels.map(label => (
                        <div key={label.id} className="template-card-premium">
                            <div className="template-preview-premium">
                                <div className="preview-bg-icon">
                                    <Database size={200} />
                                </div>

                                <div className="label-mockup">
                                    {label.type === 'barcode' ? (
                                        <>
                                            <div className="barcode-visual" />
                                            <div className="mockup-text">Liscord OS Label</div>
                                        </>
                                    ) : label.type === 'qr' ? (
                                        <>
                                            <div className="qr-visual" />
                                            <div className="mockup-text-sm">Dynamic System QR</div>
                                        </>
                                    ) : (
                                        <div className="shipping-mockup">
                                            <Tag size={28} />
                                            <div className="shipping-mockup-label">SHIPPING TRACKING</div>
                                            <div className="shipping-mockup-id">ID: {label.id}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="template-details-premium">
                                <div className="template-header-row">
                                    <div className="template-name">{label.name}</div>
                                    <div className={`status-badge ${label.status === 'In Use' ? 'in-use' : 'ready'}`}>
                                        {label.status}
                                    </div>
                                </div>

                                <div className="template-meta-row">
                                    <div className="meta-badge">
                                        <Maximize size={11} /> {label.size}
                                    </div>
                                    <div className="meta-badge">
                                        <Database size={11} /> {label.id}
                                    </div>
                                </div>

                                <div className="template-date-row">
                                    <Clock size={12} />
                                    <span>Сүүлд: {label.lastUsed}</span>
                                    <CheckCircle2 size={13} className="checkmark" />
                                </div>

                                <div className="template-actions">
                                    <button className="btn-download">
                                        <Download size={16} /> ТАТАХ
                                    </button>
                                    <button className="btn-print">
                                        <Printer size={16} /> ХЭВЛЭХ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ====== Zebra Integration ====== */}
                <div className="zebra-section">
                    <div className="zebra-info">
                        <div className="zebra-icon-box">
                            <Zap size={32} />
                        </div>
                        <div>
                            <div className="zebra-title">Zebra & TSC Принтер Холболт</div>
                            <div className="zebra-desc">Төвлөрсөн Cloud Print системээр хэвлэгч төхөөрөмжүүдийг алсаас удирдаж, шууд хэвлэх модуль.</div>
                        </div>
                    </div>
                    <div className="zebra-actions">
                        <button className="btn-config">
                            <Settings size={18} /> ТОХИРГОО
                        </button>
                        <button className="btn-share">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
