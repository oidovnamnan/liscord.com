import { useState, useEffect, useRef, useCallback } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Tag, Hash, Layers, Printer, Eye, Download, Check, Maximize2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import JsBarcode from 'jsbarcode';
import './BarcodeLabelsPage.css';

// ═══ Label Templates ═══
const LABEL_TEMPLATES = [
    {
        id: 'standard',
        name: 'Стандарт шошго',
        description: 'Бүтээгдэхүүний нэр, баркод, үнэтэй энгийн загвар',
        size: '50×25мм',
        type: 'barcode',
    },
    {
        id: 'price-tag',
        name: 'Үнийн шошго',
        description: 'Үнэ тод харагдах том загвар, дэлгүүрийн тавиурт',
        size: '100×38мм',
        type: 'price',
    },
    {
        id: 'qr-label',
        name: 'QR код шошго',
        description: 'QR код + мэдээлэл, бүтээгдэхүүний дэлгэрэнгүй',
        size: '50×50мм',
        type: 'qr',
    },
    {
        id: 'shipping',
        name: 'Хүргэлтийн шошго',
        description: 'Хүргэлтийн хаяг, захиалгын дугаар, баркод',
        size: '100×60мм',
        type: 'shipping',
    },
    {
        id: 'minimal',
        name: 'Энгийн баркод',
        description: 'Зөвхөн баркод, код — хамгийн бага зайн загвар',
        size: '30×20мм',
        type: 'barcode-only',
    },
    {
        id: 'jewelry',
        name: 'Үнэ засах шошго',
        description: 'Эрдэнийн чулуу, үнэт зүйлсийн загвар',
        size: '22×10мм',
        type: 'mini',
    },
];

const LABEL_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'barcode', label: 'Баркод', type: 'text', required: true },
    { name: 'price', label: 'Үнэ', type: 'currency' },
    { name: 'quantity', label: 'Хэвлэх тоо', type: 'number', defaultValue: '1' },
    {
        name: 'size', label: 'Хэмжээ', type: 'select', defaultValue: 'medium', options: [
            { value: 'small', label: 'Жижиг (30x20)' }, { value: 'medium', label: 'Дунд (50x25)' }, { value: 'large', label: 'Том (100x38)' },
        ]
    },
];

export function BarcodeLabelsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [previewItem, setPreviewItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/barcodeLabels`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const uniqueProducts = new Set(items.map(i => i.productName)).size;

    const handlePrint = () => {
        const printItems = previewItem ? [previewItem] : items;
        if (!printItems.length) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Generate label HTML for each item × quantity
        let labelsHtml = '';
        for (const item of printItems) {
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) {
                labelsHtml += generateLabelHtml(item, selectedTemplate);
            }
        }

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Шошго хэвлэх</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; font-family: -apple-system, 'Helvetica Neue', sans-serif; }
    
    .label {
        border: 1px solid #ccc;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        page-break-inside: avoid;
    }
    
    /* Template sizes */
    .label-standard { width: 200px; height: 120px; padding: 10px; }
    .label-price-tag { width: 380px; height: 150px; padding: 16px; flex-direction: row; justify-content: space-between; }
    .label-qr-label { width: 200px; height: 200px; padding: 16px; }
    .label-shipping { width: 380px; height: 230px; padding: 16px; }
    .label-minimal { width: 140px; height: 80px; padding: 6px; }
    .label-jewelry { width: 100px; height: 44px; padding: 4px; }
    
    .product-name { font-weight: 800; font-size: 11px; color: #111; text-transform: uppercase; letter-spacing: 1.5px; text-align: center; }
    .barcode-code { font-family: 'Courier New', monospace; font-size: 9px; color: #444; letter-spacing: 2px; text-align: center; }
    .price-text { font-weight: 900; font-size: 13px; color: #111; }
    
    /* CSS Barcode visual */
    .barcode-bars {
        display: flex;
        align-items: stretch;
        justify-content: center;
        gap: 0;
        height: 40px;
    }
    .barcode-bars .bar { background: #111; }
    .barcode-bars .space { background: #fff; }
    
    /* Price tag specific */
    .price-tag-left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .price-tag-right { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .price-big { font-size: 32px; font-weight: 900; color: #111; line-height: 1; }
    .price-currency { font-size: 14px; font-weight: 700; color: #666; }
    
    /* QR visual */
    .qr-box { width: 80px; height: 80px; border: 2px solid #111; border-radius: 4px; display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); overflow: hidden; }
    .qr-cell { background: #111; }
    .qr-empty { background: #fff; }
    
    /* Shipping */
    .ship-header { font-size: 8px; font-weight: 800; color: #888; letter-spacing: 3px; text-transform: uppercase; border-bottom: 1px dashed #ccc; padding-bottom: 6px; margin-bottom: 8px; width: 100%; text-align: center; }
    
    @media print {
        body { gap: 3px; padding: 4px; }
        .label { border: 0.5px solid #999; border-radius: 3px; }
    }
</style></head><body>${labelsHtml}</body></html>`);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 300);
    };

    // ═══ Generate real barcode SVG string using JsBarcode ═══
    const generateBarcodeSvg = useCallback((code: string, opts?: { height?: number; width?: number; displayValue?: boolean; fontSize?: number }) => {
        try {
            const svgNs = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNs, 'svg');
            JsBarcode(svg, code || '0000', {
                format: 'CODE128',
                width: opts?.width || 2,
                height: opts?.height || 40,
                displayValue: opts?.displayValue ?? false,
                fontSize: opts?.fontSize || 12,
                margin: 0,
                background: 'transparent',
            });
            return svg.outerHTML;
        } catch {
            // Fallback if code is invalid
            return `<div style="font-family:monospace;font-size:10px;color:#999;padding:4px">${code || 'N/A'}</div>`;
        }
    }, []);

    // Generate QR-like visual (placeholder — real QR would need a QR library)
    const generateQrHtml = () => {
        const cells: string[] = [];
        const pattern = [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1];
        for (const p of pattern) {
            cells.push(`<div class="${p ? 'qr-cell' : 'qr-empty'}"></div>`);
        }
        return `<div class="qr-box">${cells.join('')}</div>`;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateLabelHtml = (item: any, template: string): string => {
        const name = item.productName || 'Бүтээгдэхүүн';
        const code = item.barcode || '';
        const price = item.price ? Number(item.price).toLocaleString() + '₮' : '';
        const barcodeSvg = generateBarcodeSvg(code);

        switch (template) {
            case 'price-tag':
                return `<div class="label label-price-tag">
                    <div class="price-tag-left">
                        <div class="product-name" style="text-align:left;font-size:10px;margin-bottom:8px">${name}</div>
                        <div class="price-big">${price}</div>
                        <div class="barcode-code" style="text-align:left;margin-top:8px">${code}</div>
                    </div>
                    <div class="price-tag-right">
                        ${generateBarcodeSvg(code, { height: 60, width: 1 })}
                    </div>
                </div>`;
            case 'qr-label':
                return `<div class="label label-qr-label">
                    ${generateQrHtml()}
                    <div class="product-name" style="margin-top:12px;font-size:10px">${name}</div>
                    <div class="price-text" style="margin-top:4px">${price}</div>
                    <div class="barcode-code" style="margin-top:4px">${code}</div>
                </div>`;
            case 'shipping':
                return `<div class="label label-shipping">
                    <div class="ship-header">ХҮРГЭЛТИЙН ШОШГО</div>
                    <div class="product-name" style="font-size:14px;margin-bottom:12px">${name}</div>
                    ${generateBarcodeSvg(code, { height: 50, width: 2 })}
                    <div class="barcode-code" style="margin-top:6px;font-size:11px">${code}</div>
                    ${price ? `<div class="price-text" style="margin-top:8px">${price}</div>` : ''}
                </div>`;
            case 'minimal':
                return `<div class="label label-minimal">
                    ${generateBarcodeSvg(code, { height: 35, width: 1.5 })}
                    <div class="barcode-code" style="margin-top:4px;font-size:8px">${code}</div>
                </div>`;
            case 'jewelry':
                return `<div class="label label-jewelry">
                    <div style="font-weight:900;font-size:10px;color:#111">${price}</div>
                    <div style="font-size:6px;color:#888;font-family:monospace;margin-top:2px">${code.slice(-6)}</div>
                </div>`;
            default: // standard
                return `<div class="label label-standard">
                    <div class="product-name">${name}</div>
                    ${barcodeSvg}
                    <div class="barcode-code" style="margin-top:4px">${code}</div>
                    ${price ? `<div class="price-text" style="margin-top:2px">${price}</div>` : ''}
                </div>`;
        }
    };

    // ═══ Barcode SVG Preview Component (React) ═══
    const BarcodeSvgPreview = ({ code, height = 40, barWidth = 2, style }: { code: string; height?: number; barWidth?: number; style?: React.CSSProperties }) => {
        const svgRef = useRef<SVGSVGElement>(null);
        useEffect(() => {
            if (svgRef.current && code) {
                try {
                    JsBarcode(svgRef.current, code, {
                        format: 'CODE128',
                        width: barWidth,
                        height,
                        displayValue: false,
                        margin: 0,
                        background: 'transparent',
                    });
                } catch {
                    // Invalid barcode
                }
            }
        }, [code, height, barWidth]);
        return <svg ref={svgRef} style={style} />;
    };

    // ═══ Render label preview for template cards (React JSX) ═══
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderLabelPreview = (item: any, template: string, isLarge = false) => {
        const scale = isLarge ? 1.5 : 1;
        const name = item?.productName || 'Бүтээгдэхүүн';
        const code = item?.barcode || '4901234567890';
        const price = item?.price ? Number(item.price).toLocaleString() + '₮' : '50,000₮';

        switch (template) {
            case 'price-tag':
                return (
                    <div className="label-mockup" style={{ width: 220 * scale, height: 100 * scale, justifyContent: 'space-between', flexDirection: 'row', gap: 12, padding: '12px 16px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 8 * scale, fontWeight: 700, color: '#666', marginBottom: 4 }}>{name}</div>
                            <div style={{ fontSize: 22 * scale, fontWeight: 900, color: '#111' }}>{price}</div>
                            <div style={{ fontSize: 7 * scale, color: '#999', fontFamily: 'monospace', marginTop: 4 }}>{code}</div>
                        </div>
                        <BarcodeSvgPreview code={code} height={Math.round(60 * scale)} barWidth={1} style={{ flexShrink: 0, maxWidth: 50 * scale }} />
                    </div>
                );
            case 'qr-label':
                return (
                    <div className="label-mockup" style={{ width: 140 * scale, height: 140 * scale }}>
                        <div className="qr-visual" style={{ width: 56 * scale, height: 56 * scale }} />
                        <div className="mockup-text" style={{ fontSize: 8 * scale }}>{name}</div>
                        <div className="mockup-text-sm" style={{ fontSize: 7 * scale }}>{price}</div>
                    </div>
                );
            case 'shipping':
                return (
                    <div className="label-mockup shipping-mockup" style={{ width: 220 * scale, height: 140 * scale, padding: 12 * scale }}>
                        <div style={{ fontSize: 7 * scale, fontWeight: 800, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>ХҮРГЭЛТ</div>
                        <div style={{ fontSize: 10 * scale, fontWeight: 800, color: '#222', marginTop: 6 }}>{name}</div>
                        <BarcodeSvgPreview code={code} height={Math.round(30 * scale)} barWidth={1.5} style={{ width: '80%', marginTop: 8 }} />
                        <div style={{ fontSize: 8 * scale, fontFamily: 'monospace', color: '#555', marginTop: 4 }}>{code}</div>
                    </div>
                );
            case 'minimal':
                return (
                    <div className="label-mockup" style={{ width: 120 * scale, height: 70 * scale, padding: 8 }}>
                        <BarcodeSvgPreview code={code} height={Math.round(35 * scale)} barWidth={1} style={{ width: '100%' }} />
                        <div style={{ fontSize: 7 * scale, fontFamily: 'monospace', color: '#333', marginTop: 4, letterSpacing: 1.5 }}>{code}</div>
                    </div>
                );
            case 'jewelry':
                return (
                    <div className="label-mockup" style={{ width: 90 * scale, height: 40 * scale, padding: 4 }}>
                        <div style={{ fontSize: 6 * scale, fontWeight: 800, color: '#222' }}>{price}</div>
                        <div style={{ fontSize: 5 * scale, color: '#888', marginTop: 2 }}>{code.slice(-6)}</div>
                    </div>
                );
            default:
                return (
                    <div className="label-mockup" style={{ width: 200 * scale, height: 130 * scale }}>
                        <div className="mockup-text" style={{ fontSize: 9 * scale }}>{name}</div>
                        <BarcodeSvgPreview code={code} height={Math.round(50 * scale)} barWidth={2} style={{ width: '90%', marginTop: 8 }} />
                        <div className="mockup-text-sm" style={{ fontSize: 7 * scale, marginTop: 6 }}>{code} · {price}</div>
                    </div>
                );
        }
    };

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page animate-fade-in barcode-labels-page">
                {/* Hero */}
                <div className="page-hero" style={{ marginBottom: 8 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon"><Tag size={24} /></div>
                        <div>
                            <h2 className="page-hero-title">Шошго хэвлэх</h2>
                            <p className="page-hero-subtitle">Баркод, шошго бэлтгэх</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        + Шошго
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-grid-premium">
                    <div className="stat-card-v2">
                        <div className="stat-content"><h4>Нийт шошго</h4><div className="stat-value-large">{items.length}</div></div>
                        <div className="stat-icon-box icon-primary"><Tag size={24} /></div>
                    </div>
                    <div className="stat-card-v2">
                        <div className="stat-content"><h4>Бүтээгдэхүүн</h4><div className="stat-value-large">{uniqueProducts}</div></div>
                        <div className="stat-icon-box icon-cyan"><Layers size={24} /></div>
                    </div>
                    <div className="stat-card-v2">
                        <div className="stat-content"><h4>Хэвлэх тоо</h4><div className="stat-value-large">{totalQty}</div></div>
                        <div className="stat-icon-box icon-orange"><Printer size={24} /></div>
                    </div>
                    <div className="stat-card-v2">
                        <div className="stat-content"><h4>Баркодтой</h4><div className="stat-value-large">{items.filter(i => i.barcode).length}</div></div>
                        <div className="stat-icon-box icon-primary"><Hash size={24} /></div>
                    </div>
                </div>

                {/* ═══ Template Selection ═══ */}
                <div className="page-section-header" style={{ marginTop: 32 }}>
                    <div>
                        <h3 className="page-section-title">Загвар сонгох</h3>
                        <p className="page-section-subtitle">Хэвлэх шошгоны загвараа сонгоно уу</p>
                    </div>
                </div>

                <div className="template-grid-premium">
                    {LABEL_TEMPLATES.map(tmpl => (
                        <div
                            key={tmpl.id}
                            className={`template - card - premium ${selectedTemplate === tmpl.id ? 'selected' : ''} `}
                            onClick={() => setSelectedTemplate(tmpl.id)}
                            style={selectedTemplate === tmpl.id ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 2px var(--primary-light)' } : {}}
                        >
                            <div className="template-preview-premium">
                                {renderLabelPreview(previewItem || items[0], tmpl.id)}
                                <div className="preview-bg-icon"><Tag size={120} /></div>
                            </div>
                            <div className="template-details-premium">
                                <div className="template-header-row">
                                    <h4 className="template-name">{tmpl.name}</h4>
                                    {selectedTemplate === tmpl.id && (
                                        <span className="status-badge in-use" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                                            <Check size={10} /> СОНГОСОН
                                        </span>
                                    )}
                                </div>
                                <div className="template-meta-row">
                                    <span className="meta-badge"><Maximize2 size={10} /> {tmpl.size}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{tmpl.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══ Labels Table with Preview ═══ */}
                <div className="page-section-header" style={{ marginTop: 40 }}>
                    <div>
                        <h3 className="page-section-title">Шошгоны жагсаалт</h3>
                        <p className="page-section-subtitle">Шошго дээр дарж preview-г харах</p>
                    </div>
                    {items.length > 0 && (
                        <button className="btn-print" onClick={handlePrint} style={{ gap: 8, padding: '12px 24px' }}>
                            <Printer size={16} /> Бүгдийг хэвлэх
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: previewItem ? '1fr 360px' : '1fr', gap: 20, marginTop: 16 }}>
                    {/* Table */}
                    <div className="card" style={{ padding: 0 }}>
                        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                            <table className="table">
                                <thead><tr>
                                    <th>Бүтээгдэхүүн</th><th>Баркод</th><th>Үнэ</th><th>Тоо</th><th>Хэмжээ</th><th style={{ width: 80 }}>Үйлдэл</th>
                                </tr></thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Шошго олдсонгүй</td></tr>
                                    ) : items.map(i => (
                                        <tr key={i.id} style={{ cursor: 'pointer', background: previewItem?.id === i.id ? 'var(--primary-tint)' : undefined }}>
                                            <td style={{ fontWeight: 600 }} onClick={() => { setEditingItem(i); setShowModal(true); }}>{i.productName}</td>
                                            <td style={{ fontFamily: 'monospace' }}>{i.barcode}</td>
                                            <td>{i.price ? i.price.toLocaleString() + ' ₮' : '-'}</td>
                                            <td>{i.quantity || 1}</td>
                                            <td>{i.size === 'small' ? 'Жижиг' : i.size === 'large' ? 'Том' : 'Дунд'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn-download" style={{ padding: '6px 10px', borderRadius: 10, fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); setPreviewItem(previewItem?.id === i.id ? null : i); }}>
                                                        <Eye size={14} />
                                                    </button>
                                                    <button className="btn-download" style={{ padding: '6px 10px', borderRadius: 10, fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); setEditingItem(i); setShowModal(true); }}>
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Preview Panel */}
                    {previewItem && (
                        <div className="card" style={{ padding: 24, position: 'sticky', top: 120, alignSelf: 'start' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>Шошгоны Preview</h4>
                                <button onClick={() => setPreviewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>×</button>
                            </div>

                            <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                                {renderLabelPreview(previewItem, selectedTemplate, true)}
                            </div>

                            <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                                    <span>Бүтээгдэхүүн</span><strong>{previewItem.productName}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                                    <span>Баркод</span><strong style={{ fontFamily: 'monospace' }}>{previewItem.barcode}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                                    <span>Үнэ</span><strong>{previewItem.price ? previewItem.price.toLocaleString() + '₮' : '-'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                    <span>Тоо</span><strong>{previewItem.quantity || 1} ш</strong>
                                </div>
                            </div>

                            <div className="template-actions" style={{ marginTop: 16 }}>
                                <button className="btn-download" onClick={() => { setEditingItem(previewItem); setShowModal(true); }}>
                                    <Download size={14} /> Засах
                                </button>
                                <button className="btn-print" onClick={handlePrint}>
                                    <Printer size={14} /> Хэвлэх
                                </button>
                            </div>
                        </div>
                    )}
                </div>


            </div>
            {showModal && <GenericCrudModal title="Шошго" icon={<Tag size={20} />} collectionPath="businesses/{bizId}/barcodeLabels" fields={LABEL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
