import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Image as ImageIcon, Check, Download, Sparkles, Copy, CheckCircle,
    Loader2, Search, ChevronRight, Package, Palette, Wand2, X, ArrowLeft,
    Filter, ArrowUpDown, TrendingUp, FolderDown, FileImage
} from 'lucide-react';
import JSZip from 'jszip';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import { globalSettingsService } from '../../services/adminService';
import { AD_TEMPLATES, loadImage, renderAdImage } from './adTemplates';
import type { AdTemplate, AdProduct, AdOptions, LabelPosition } from './adTemplates';
import { generateProductAdCopy, generateBulkAdCopy } from './adAiService';
import toast from 'react-hot-toast';
import './AdCreatorPage.css';

interface SimpleProduct {
    id: string;
    name: string;
    price: number;
    comparePrice?: number;
    description?: string;
    categoryName?: string;
    image: string | null;
    totalSold?: number;
}

interface GeneratedAd {
    productId: string;
    productName: string;
    dataUrl: string;
    template: AdTemplate;
}

// ============ MAIN COMPONENT ============

export function AdCreatorPage() {
    const { business } = useBusinessStore();
    const businessId = business?.id || '';
    const [geminiApiKey, setGeminiApiKey] = useState('');

    // Fetch Gemini API key
    useEffect(() => {
        globalSettingsService.getSettings().then(settings => {
            if (settings.geminiApiKey) setGeminiApiKey(settings.geminiApiKey);
        });
    }, []);

    // Step state
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1: Products
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'popular'>('name');

    // Step 2: Template
    const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate>(AD_TEMPLATES[0]);
    const [templatePreview, setTemplatePreview] = useState<string | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Step 2: Options
    const [badgeText, setBadgeText] = useState('');
    const [promoText, setPromoText] = useState('');
    const [labelPosition, setLabelPosition] = useState<LabelPosition>('bottom-right');
    const [labelOpacity, setLabelOpacity] = useState(95);

    // Step 3: Generated
    const [generated, setGenerated] = useState<GeneratedAd[]>([]);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Download options
    type ImageFormat = 'png' | 'jpeg' | 'webp';
    const [downloadFormat, setDownloadFormat] = useState<ImageFormat>('png');
    const [downloadQuality, setDownloadQuality] = useState(92);

    // AI Copy
    const [aiCopy, setAiCopy] = useState('');
    const [aiCopyLoading, setAiCopyLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Load products
    useEffect(() => {
        if (!businessId) return;
        (async () => {
            setLoadingProducts(true);
            try {
                const snap = await getDocs(query(
                    collection(db, 'businesses', businessId, 'products'),
                    where('isDeleted', '==', false),
                    where('isActive', '==', true)
                ));
                const list: SimpleProduct[] = snap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        name: data.name || '',
                        price: data.pricing?.salePrice || 0,
                        comparePrice: data.pricing?.comparePrice || undefined,
                        description: data.description || '',
                        categoryName: data.categoryName || '',
                        image: data.images?.[0] || null,
                        totalSold: data.stats?.totalSold || 0,
                    };
                });
                setProducts(list.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (e) { console.error(e); }
            setLoadingProducts(false);
        })();
    }, [businessId]);

    // Unique categories for filter
    const categories = useMemo(() => {
        const cats = [...new Set(products.map(p => p.categoryName).filter(Boolean))] as string[];
        return cats.sort((a, b) => a.localeCompare(b));
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = products;
        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(p => p.categoryName === categoryFilter);
        }
        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }
        // Sort
        switch (sortBy) {
            case 'price_asc': result = [...result].sort((a, b) => a.price - b.price); break;
            case 'price_desc': result = [...result].sort((a, b) => b.price - a.price); break;
            case 'popular': result = [...result].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0)); break;
            default: result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        }
        return result;
    }, [products, searchQuery, categoryFilter, sortBy]);

    const selectedProducts = useMemo(() =>
        products.filter(p => selectedIds.has(p.id)),
        [products, selectedIds]
    );

    const toggleProduct = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    // Template preview
    useEffect(() => {
        if (step !== 2 || selectedProducts.length === 0) return;
        const first = selectedProducts[0];
        (async () => {
            let img: HTMLImageElement | null = null;
            if (first.image) {
                try { img = await loadImage(first.image); } catch { /* */ }
            }
            const adProduct: AdProduct = {
                name: first.name,
                price: first.price,
                comparePrice: first.comparePrice,
                image: img,
                description: first.description,
            };
            const options: AdOptions = {
                businessName: business?.name || '',
                badgeText: badgeText || undefined,
                promoText: promoText || undefined,
                storefront: business?.slug ? `liscord.com/${business.slug}` : undefined,
                labelPosition,
                labelOpacity,
            };
            const dataUrl = await renderAdImage(selectedTemplate, adProduct, options);
            setTemplatePreview(dataUrl);
        })();
    }, [step, selectedTemplate, selectedProducts, badgeText, promoText, business, labelPosition, labelOpacity]);

    // Generate all
    const handleGenerate = useCallback(async () => {
        if (selectedProducts.length === 0) return;
        setGenerating(true);
        setProgress(0);
        setStep(3);
        const results: GeneratedAd[] = [];

        for (let i = 0; i < selectedProducts.length; i++) {
            const p = selectedProducts[i];
            let img: HTMLImageElement | null = null;
            if (p.image) {
                try { img = await loadImage(p.image); } catch { /* */ }
            }
            const adProduct: AdProduct = {
                name: p.name,
                price: p.price,
                comparePrice: p.comparePrice,
                image: img,
                description: p.description,
            };
            const options: AdOptions = {
                businessName: business?.name || '',
                badgeText: badgeText || undefined,
                promoText: promoText || undefined,
                storefront: business?.slug ? `liscord.com/${business.slug}` : undefined,
                labelPosition,
                labelOpacity,
            };
            const dataUrl = await renderAdImage(selectedTemplate, adProduct, options);
            results.push({ productId: p.id, productName: p.name, dataUrl, template: selectedTemplate });
            setProgress(Math.round(((i + 1) / selectedProducts.length) * 100));
        }

        setGenerated(results);
        setGenerating(false);
        toast.success(`${results.length} зар зураг бэлэн боллоо!`);
    }, [selectedProducts, selectedTemplate, badgeText, promoText, business]);

    // Convert data URL to target format
    const convertDataUrl = useCallback((dataUrl: string, format: ImageFormat, quality: number): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                if (format === 'jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (blob) => resolve(blob!),
                    `image/${format}`,
                    quality / 100
                );
            };
            img.src = dataUrl;
        });
    }, []);

    const getExt = (f: ImageFormat) => f === 'jpeg' ? 'jpg' : f;

    // Download single — uses showSaveFilePicker for location choice
    const downloadImage = useCallback(async (ad: GeneratedAd) => {
        const ext = getExt(downloadFormat);
        const fileName = `ad_${ad.productName.replace(/\s+/g, '_').substring(0, 30)}.${ext}`;
        const blob = await convertDataUrl(ad.dataUrl, downloadFormat, downloadQuality);

        // Try File System Access API (shows save location picker)
        if ('showSaveFilePicker' in window) {
            try {
                const mimeMap: Record<ImageFormat, string> = {
                    png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp'
                };
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: `${ext.toUpperCase()} Image`,
                        accept: { [mimeMap[downloadFormat]]: [`.${ext}`] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                toast.success(`${fileName} хадгалагдлаа!`);
                return;
            } catch (e: any) {
                if (e.name === 'AbortError') return; // user cancelled
            }
        }

        // Fallback: regular download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${fileName} татагдлаа!`);
    }, [downloadFormat, downloadQuality, convertDataUrl]);

    // Download all as ZIP
    const downloadAll = useCallback(async () => {
        const ext = getExt(downloadFormat);
        const zip = new JSZip();
        const folder = zip.folder('ad_images')!;

        toast.loading('ZIP бэлтгэж байна...', { id: 'zip' });

        for (let i = 0; i < generated.length; i++) {
            const ad = generated[i];
            const blob = await convertDataUrl(ad.dataUrl, downloadFormat, downloadQuality);
            const name = `${(i + 1).toString().padStart(2, '0')}_${ad.productName.replace(/\s+/g, '_').substring(0, 25)}.${ext}`;
            folder.file(name, blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Try File System Access API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: 'ad_images.zip',
                    types: [{
                        description: 'ZIP Archive',
                        accept: { 'application/zip': ['.zip'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(zipBlob);
                await writable.close();
                toast.success(`${generated.length} зураг ZIP-д хадгалагдлаа!`, { id: 'zip' });
                return;
            } catch (e: any) {
                if (e.name === 'AbortError') { toast.dismiss('zip'); return; }
            }
        }

        // Fallback
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ad_images.zip';
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${generated.length} зураг ZIP-д татагдлаа!`, { id: 'zip' });
    }, [generated, downloadFormat, downloadQuality, convertDataUrl]);

    // AI Copy
    const handleAiCopy = async (mode: 'bulk' | 'single') => {
        if (!geminiApiKey) { toast.error('Gemini API Key тохируулаагүй'); return; }
        const apiKey = geminiApiKey;
        setAiCopyLoading(true);
        try {
            const storefront = business?.slug ? `liscord.com/${business.slug}` : undefined;
            if (mode === 'bulk') {
                const text = await generateBulkAdCopy(apiKey, selectedProducts.map(p => ({
                    name: p.name, price: p.price, comparePrice: p.comparePrice,
                    description: p.description, categoryName: p.categoryName,
                })), business?.name || '', storefront);
                setAiCopy(text);
            } else {
                const first = selectedProducts[0];
                if (!first) return;
                const text = await generateProductAdCopy(apiKey, {
                    name: first.name, price: first.price, comparePrice: first.comparePrice,
                    description: first.description, categoryName: first.categoryName,
                }, business?.name || '', storefront);
                setAiCopy(text);
            }
            toast.success('AI текст үүсгэгдлээ!');
        } catch (e: any) {
            toast.error(e.message || 'AI алдаа');
        }
        setAiCopyLoading(false);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.success('Хуулагдлаа!');
    };

    // ──────── RENDER ────────

    return (
        <div className="ad-creator-page">
            {/* Hero */}
            <div className="adc-hero">
                <div className="adc-hero-content">
                    <div className="adc-hero-icon"><Palette size={28} /></div>
                    <div>
                        <h1 className="adc-hero-title">🎨 Зар зураг үүсгэгч</h1>
                        <p className="adc-hero-desc">Бараа сонгож, загвар сонгоод, автомат зураг үүсгэ</p>
                    </div>
                </div>
            </div>

            {/* Steps indicator */}
            <div className="adc-steps">
                <button className={`adc-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} onClick={() => step > 1 && setStep(1)}>
                    <span className="adc-step-num">{step > 1 ? <Check size={16} /> : '1'}</span>
                    <span className="adc-step-label">Бараа сонгох</span>
                </button>
                <ChevronRight size={16} className="adc-step-arrow" />
                <button className={`adc-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`} onClick={() => step > 2 && setStep(2)} disabled={step < 2}>
                    <span className="adc-step-num">{step > 2 ? <Check size={16} /> : '2'}</span>
                    <span className="adc-step-label">Загвар & тохиргоо</span>
                </button>
                <ChevronRight size={16} className="adc-step-arrow" />
                <button className={`adc-step ${step >= 3 ? 'active' : ''}`} disabled={step < 3}>
                    <span className="adc-step-num">3</span>
                    <span className="adc-step-label">Бэлэн зурагнууд</span>
                </button>
            </div>

            {/* ──── STEP 1: Product Picker ──── */}
            {step === 1 && (
                <div className="adc-card animate-fade-in">
                    <div className="adc-card-header">
                        <div className="adc-card-title"><Package size={20} /> Бараа сонгох</div>
                        <span className="adc-count-badge">{selectedIds.size} сонгосон</span>
                    </div>

                    <div className="adc-search-row">
                        <div className="adc-search-wrap">
                            <Search size={16} className="adc-search-icon" />
                            <input
                                className="adc-search-input"
                                placeholder="Бараа хайх..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && <button className="adc-search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>}
                        </div>
                        <div className="adc-sort-wrap">
                            <ArrowUpDown size={14} />
                            <select className="adc-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                                <option value="name">Нэрээр</option>
                                <option value="popular">Эрэлттэй</option>
                                <option value="price_asc">Үнэ ↑</option>
                                <option value="price_desc">Үнэ ↓</option>
                            </select>
                        </div>
                        <button className="adc-btn-sm" onClick={selectAll}>
                            {selectedIds.size === filteredProducts.length ? 'Болих' : 'Бүгдийг'}
                        </button>
                    </div>

                    {/* Category filter chips */}
                    {categories.length > 1 && (
                        <div className="adc-category-chips">
                            <Filter size={14} className="adc-filter-icon" />
                            <button
                                className={`adc-cat-chip ${categoryFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setCategoryFilter('all')}
                            >
                                Бүгд ({products.length})
                            </button>
                            {categories.map(cat => {
                                const count = products.filter(p => p.categoryName === cat).length;
                                return (
                                    <button
                                        key={cat}
                                        className={`adc-cat-chip ${categoryFilter === cat ? 'active' : ''}`}
                                        onClick={() => setCategoryFilter(cat)}
                                    >
                                        {cat} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {loadingProducts ? (
                        <div className="adc-loading"><Loader2 size={24} className="animate-spin" /> Ачаалж байна...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="adc-empty">Бараа олдсонгүй</div>
                    ) : (
                        <div className="adc-product-grid">
                            {filteredProducts.map(p => (
                                <div
                                    key={p.id}
                                    className={`adc-product-card ${selectedIds.has(p.id) ? 'selected' : ''}`}
                                    onClick={() => toggleProduct(p.id)}
                                >
                                    <div className="adc-product-img">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} loading="lazy" />
                                        ) : (
                                            <ImageIcon size={20} />
                                        )}
                                        {selectedIds.has(p.id) && (
                                            <div className="adc-product-check"><CheckCircle size={20} /></div>
                                        )}
                                    </div>
                                    <div className="adc-product-info">
                                        <div className="adc-product-name">{p.name}</div>
                                        <div className="adc-product-meta">
                                            <span className="adc-product-price">{p.price.toLocaleString()}₮</span>
                                            {sortBy === 'popular' && p.totalSold ? (
                                                <span className="adc-product-sold"><TrendingUp size={12} /> {p.totalSold}ш</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="adc-card-footer">
                        <div />
                        <button className="adc-btn-primary" onClick={() => setStep(2)} disabled={selectedIds.size === 0}>
                            Дараагийн алхам <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ──── STEP 2: Template + Settings ──── */}
            {step === 2 && (
                <div className="adc-step2-layout animate-fade-in">
                    {/* Left: Template gallery + settings */}
                    <div className="adc-step2-left">
                        <div className="adc-card">
                            <div className="adc-card-header">
                                <div className="adc-card-title"><Palette size={20} /> Загвар сонгох</div>
                                <span className="adc-count-badge">{selectedIds.size} бараа</span>
                            </div>

                            {/* Template categories — grouped by overlay vs classic, then by size */}
                            {(() => {
                                const overlayTemplates = AD_TEMPLATES.filter(t => t.isOverlay);
                                const classicTemplates = AD_TEMPLATES.filter(t => !t.isOverlay);
                                return (
                                    <>
                                        <div className="adc-template-section">
                                            <div className="adc-template-section-title">🏷️ Шошгоны загвар (Overlay)</div>
                                            <div className="adc-template-row">
                                                {overlayTemplates.map(t => (
                                                    <button
                                                        key={t.id}
                                                        className={`adc-template-chip ${selectedTemplate.id === t.id ? 'active' : ''}`}
                                                        onClick={() => setSelectedTemplate(t)}
                                                    >
                                                        <span className="adc-template-emoji">{t.emoji}</span>
                                                        <span className="adc-template-name">{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="adc-template-section">
                                            <div className="adc-template-section-title">📐 Классик загвар</div>
                                            <div className="adc-template-row">
                                                {classicTemplates.map(t => (
                                                    <button
                                                        key={t.id}
                                                        className={`adc-template-chip ${selectedTemplate.id === t.id ? 'active' : ''}`}
                                                        onClick={() => setSelectedTemplate(t)}
                                                    >
                                                        <span className="adc-template-emoji">{t.emoji}</span>
                                                        <span className="adc-template-name">{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {/* Overlay label controls — only show for overlay templates */}
                            {selectedTemplate.isOverlay && (
                                <div className="adc-settings-section">
                                    <div className="adc-section-title">📍 Шошгоны байршил & тунгалагшилт</div>
                                    <div className="adc-position-grid">
                                        {([
                                            { value: 'top-left' as const, label: '↖ Зүүн дээд' },
                                            { value: 'top-right' as const, label: '↗ Баруун дээд' },
                                            { value: 'center' as const, label: '⊙ Голд' },
                                            { value: 'bottom-center' as const, label: '↓ Доод гол' },
                                            { value: 'bottom-left' as const, label: '↙ Зүүн доод' },
                                            { value: 'bottom-right' as const, label: '↘ Баруун доод' },
                                        ]).map(pos => (
                                            <button
                                                key={pos.value}
                                                className={`adc-pos-chip ${labelPosition === pos.value ? 'active' : ''}`}
                                                onClick={() => setLabelPosition(pos.value)}
                                            >
                                                {pos.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="adc-opacity-row">
                                        <label className="adc-label">Тунгалагшилт: {labelOpacity}%</label>
                                        <input
                                            type="range"
                                            min={20}
                                            max={100}
                                            value={labelOpacity}
                                            onChange={e => setLabelOpacity(Number(e.target.value))}
                                            className="adc-opacity-slider"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Optional settings */}
                            <div className="adc-settings-section">
                                <div className="adc-section-title">⚙️ Нэмэлт тохиргоо</div>
                                <div className="adc-settings-grid">
                                    <div className="adc-input-group">
                                        <label className="adc-label">Badge текст</label>
                                        <input
                                            className="adc-input"
                                            placeholder="жишээ: ХЯМДРАЛ, ШИНЭ, -30%"
                                            value={badgeText}
                                            onChange={e => setBadgeText(e.target.value)}
                                        />
                                    </div>
                                    <div className="adc-input-group">
                                        <label className="adc-label">Нэмэлт текст</label>
                                        <input
                                            className="adc-input"
                                            placeholder="жишээ: Үнэгүй хүргэлт"
                                            value={promoText}
                                            onChange={e => setPromoText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="adc-card-footer">
                                <button className="adc-btn-secondary" onClick={() => setStep(1)}>
                                    <ArrowLeft size={16} /> Буцах
                                </button>
                                <button className="adc-btn-primary" onClick={handleGenerate}>
                                    <Sparkles size={16} /> {selectedIds.size} зураг үүсгэх
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="adc-step2-right">
                        <div className="adc-preview-card">
                            <div className="adc-preview-label">Урьдчилан харах</div>
                            {templatePreview ? (
                                <img src={templatePreview} alt="Preview" className="adc-preview-img" />
                            ) : (
                                <div className="adc-preview-placeholder">
                                    <Palette size={40} />
                                    <p>Загвар сонгоход preview гарна</p>
                                </div>
                            )}
                            <div className="adc-preview-meta">
                                <span>{selectedTemplate.emoji} {selectedTemplate.name}</span>
                                <span>{selectedTemplate.width}×{selectedTemplate.height}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ──── STEP 3: Generated Output ──── */}
            {step === 3 && (
                <div className="adc-card animate-fade-in">
                    {generating ? (
                        <div className="adc-generating">
                            <Loader2 size={32} className="animate-spin" />
                            <div className="adc-gen-text">Зураг үүсгэж байна... {progress}%</div>
                            <div className="adc-gen-bar">
                                <div className="adc-gen-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="adc-card-header">
                                <div className="adc-card-title"><ImageIcon size={20} /> Бэлэн зурагнууд ({generated.length})</div>
                                {generated.length > 1 && (
                                    <button className="adc-btn-primary" onClick={downloadAll} style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                                        <FolderDown size={16} /> ZIP татах ({generated.length})
                                    </button>
                                )}
                            </div>

                            {/* Format & Quality Bar */}
                            <div className="adc-download-bar">
                                <div className="adc-format-group">
                                    <FileImage size={14} />
                                    <span className="adc-label" style={{ margin: 0 }}>Формат:</span>
                                    {(['png', 'jpeg', 'webp'] as ImageFormat[]).map(f => (
                                        <button
                                            key={f}
                                            className={`adc-format-chip ${downloadFormat === f ? 'active' : ''}`}
                                            onClick={() => setDownloadFormat(f)}
                                        >
                                            {f === 'jpeg' ? 'JPG' : f.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                {downloadFormat !== 'png' && (
                                    <div className="adc-quality-group">
                                        <span className="adc-label" style={{ margin: 0 }}>Чанар: {downloadQuality}%</span>
                                        <input
                                            type="range"
                                            min={50}
                                            max={100}
                                            value={downloadQuality}
                                            onChange={e => setDownloadQuality(Number(e.target.value))}
                                            className="adc-opacity-slider"
                                            style={{ width: 120 }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* AI Copy Section */}
                            <div className="adc-ai-section">
                                <div className="adc-ai-header">
                                    <Wand2 size={18} />
                                    <span className="adc-ai-title">🤖 AI сурталчилгааны текст</span>
                                    <div className="adc-ai-actions">
                                        {selectedProducts.length === 1 ? (
                                            <button className="adc-btn-sm adc-btn-ai" onClick={() => handleAiCopy('single')} disabled={aiCopyLoading}>
                                                {aiCopyLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                Текст үүсгэх
                                            </button>
                                        ) : (
                                            <>
                                                <button className="adc-btn-sm adc-btn-ai" onClick={() => handleAiCopy('bulk')} disabled={aiCopyLoading}>
                                                    {aiCopyLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                                    Ерөнхий текст
                                                </button>
                                                <button className="adc-btn-sm adc-btn-ai" onClick={() => handleAiCopy('single')} disabled={aiCopyLoading}>
                                                    Эхний бараанд
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {aiCopy && (
                                    <div className="adc-ai-result">
                                        <pre className="adc-ai-text">{aiCopy}</pre>
                                        <button
                                            className="adc-copy-btn"
                                            onClick={() => copyToClipboard(aiCopy, 'ai')}
                                        >
                                            {copiedField === 'ai' ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            {copiedField === 'ai' ? 'Хуулагдсан!' : 'Хуулах'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gallery */}
                            <div className="adc-gallery">
                                {generated.map((ad, i) => (
                                    <div key={i} className="adc-gallery-item">
                                        <img src={ad.dataUrl} alt={ad.productName} className="adc-gallery-img" />
                                        <div className="adc-gallery-footer">
                                            <span className="adc-gallery-name">{ad.productName}</span>
                                            <button className="adc-btn-sm" onClick={() => downloadImage(ad)} title={`${getExt(downloadFormat).toUpperCase()} хадгалах`}>
                                                <Download size={14} /> .{getExt(downloadFormat)}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="adc-card-footer">
                                <button className="adc-btn-secondary" onClick={() => { setStep(2); setGenerated([]); setAiCopy(''); }}>
                                    <ArrowLeft size={16} /> Загвар солих
                                </button>
                                <button className="adc-btn-secondary" onClick={() => { setStep(1); setGenerated([]); setAiCopy(''); setSelectedIds(new Set()); }}>
                                    Шинээр эхлэх
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Hidden canvas for rendering */}
            <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
        </div>
    );
}
