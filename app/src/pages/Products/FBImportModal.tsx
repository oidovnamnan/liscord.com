import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Facebook, Calendar, Loader2, CheckCircle2, AlertTriangle,
    ChevronRight, Download, ImageIcon, Sparkles, X, RefreshCw, ArrowLeft,
    SkipForward, Merge, Replace
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, categoryService } from '../../services/db';
import {
    fetchFBPageId, fetchFBPosts, extractProductsFromPosts,
    detectDuplicates, uploadAllImages,
    type FBExtractedProduct, type FBPost
} from '../../services/ai/fbImportService';
import { globalSettingsService } from '../../services/db';
import type { Product, Category } from '../../types';
import { toast } from 'react-hot-toast';

type ImportStep = 'setup' | 'fetching' | 'processing' | 'review' | 'importing' | 'done';

interface FBImportModalProps {
    onClose: () => void;
}

export function FBImportModal({ onClose }: FBImportModalProps) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();

    // Step state
    const [step, setStep] = useState<ImportStep>('setup');

    // Setup
    const [pageUrl, setPageUrl] = useState(localStorage.getItem('fb_import_url') || '');
    const [accessToken, setAccessToken] = useState(localStorage.getItem('fb_import_token') || '');
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [startDate, setStartDate] = useState(localStorage.getItem('fb_import_start') || '');
    const [endDate, setEndDate] = useState(localStorage.getItem('fb_import_end') || '');

    // Processing
    const [_, setPosts] = useState<FBPost[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });

    // Review
    const [products, setProducts] = useState<FBExtractedProduct[]>([]);
    const [existingProducts, setExistingProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'duplicates'>('new');
    const [categories, setCategories] = useState<Category[]>([]);

    // Import progress
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

    // Load data
    useEffect(() => {
        if (!business?.id) return;
        const u1 = productService.subscribeProducts(business.id, setExistingProducts);
        const u2 = categoryService.subscribeCategories(business.id, setCategories);

        // Fetch global Gemini API key
        globalSettingsService.getSettings().then(settings => {
            if (settings.geminiApiKey) {
                setGeminiApiKey(settings.geminiApiKey);
            }
        });

        return () => { u1(); u2(); };
    }, [business?.id]);

    // Set default dates if not in storage
    useEffect(() => {
        if (!startDate || !endDate) {
            const now = new Date();
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (!endDate) setEndDate(now.toISOString().split('T')[0]);
            if (!startDate) setStartDate(oneMonthAgo.toISOString().split('T')[0]);
        }
    }, []);

    const newProducts = products.filter(p => p.status === 'new' || p.status === 'approved');
    const duplicateProducts = products.filter(p => p.status === 'duplicate');

    // Save to storage helper
    const saveSettings = () => {
        localStorage.setItem('fb_import_url', pageUrl);
        localStorage.setItem('fb_import_token', accessToken);
        localStorage.setItem('fb_import_start', startDate);
        localStorage.setItem('fb_import_end', endDate);
    };

    // ===== STEP 1: SETUP & FETCH =====
    const handleStartFetch = async () => {
        if (!pageUrl || !accessToken || !startDate || !endDate) {
            toast.error('Бүх талбарыг бөглөнө үү');
            return;
        }

        if (!geminiApiKey) {
            toast.error('AI тохиргоо (Gemini API Key) дутуу байна. Super Admin-д хандана уу.');
            return;
        }

        saveSettings();
        setStep('fetching');
        setProgress({ current: 0, total: 0, message: 'Page мэдээлэл татаж байна...' });

        try {
            const pageId = await fetchFBPageId(pageUrl, accessToken);
            setProgress({ current: 0, total: 0, message: `Page олдлоо! Постууд татаж байна...` });

            const fetchedPosts = await fetchFBPosts(
                pageId,
                accessToken,
                new Date(startDate),
                new Date(endDate + 'T23:59:59')
            );

            if (fetchedPosts.length === 0) {
                toast.error('Тухайн хугацаанд пост олдсонгүй');
                setStep('setup');
                return;
            }

            setPosts(fetchedPosts);
            setProgress({ current: 0, total: fetchedPosts.length, message: `${fetchedPosts.length} пост олдлоо. AI задалж байна...` });

            // Start AI processing
            setStep('processing');
            const extracted = await extractProductsFromPosts(fetchedPosts, geminiApiKey, (current, total, product) => {
                setProgress({
                    current,
                    total,
                    message: product
                        ? `${current}/${total} — "${product.name}" олдлоо`
                        : `${current}/${total} пост задалж байна...`
                });
            });

            if (extracted.length === 0) {
                toast.error('Барааны мэдээлэл бүхий пост олдсонгүй');
                setStep('setup');
                return;
            }

            // Detect duplicates
            const withDuplicates = detectDuplicates(
                extracted,
                existingProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku, images: p.images }))
            );

            setProducts(withDuplicates);
            setStep('review');
            toast.success(`${extracted.length} бараа олдлоо!`);

        } catch (error: any) {
            console.error('FB Import error:', error);
            toast.error(error.message || 'Алдаа гарлаа');
            setStep('setup');
        }
    };

    // ===== STEP 2: REVIEW ACTIONS =====
    const toggleProduct = (fbPostId: string) => {
        setProducts(prev => prev.map(p =>
            p.fbPostId === fbPostId ? { ...p, isSelected: !p.isSelected } : p
        ));
    };

    const toggleAllNew = (selected: boolean) => {
        setProducts(prev => prev.map(p =>
            p.status === 'new' ? { ...p, isSelected: selected } : p
        ));
    };

    const setDuplicateAction = (fbPostId: string, action: 'skip' | 'update' | 'merge') => {
        setProducts(prev => prev.map(p =>
            p.fbPostId === fbPostId ? { ...p, duplicateAction: action, isSelected: action !== 'skip' } : p
        ));
    };

    // ===== STEP 3: IMPORT =====
    const handleImport = async () => {
        if (!business?.id || !user) return;

        const toImport = products.filter(p => p.isSelected && (p.status === 'new' || p.status === 'approved'));
        const toUpdate = products.filter(p => p.isSelected && p.status === 'duplicate' && p.duplicateAction === 'update');
        const toMerge = products.filter(p => p.isSelected && p.status === 'duplicate' && p.duplicateAction === 'merge');

        const totalItems = toImport.length + toUpdate.length + toMerge.length;
        if (totalItems === 0) {
            toast.error('Импортлох бараа сонгоогүй байна');
            return;
        }

        setStep('importing');
        setImportProgress({ current: 0, total: totalItems });

        let success = 0;
        let failed = 0;
        let processed = 0;

        // Import new products
        for (const product of toImport) {
            try {
                processed++;
                setImportProgress({ current: processed, total: totalItems });

                // Upload images to Firebase Storage
                const uploadedImages = await uploadAllImages(product.images, business.id);

                // Find or create category
                let categoryId = 'general';
                const existingCat = categories.find(c => c.name.toLowerCase() === product.categoryName.toLowerCase());
                if (existingCat) {
                    categoryId = existingCat.id;
                } else if (product.categoryName && product.categoryName !== 'Бусад') {
                    categoryId = await categoryService.createCategory(business.id, {
                        name: product.categoryName,
                        description: ''
                    });
                }

                await productService.createProduct(business.id, {
                    name: product.name,
                    description: product.description,
                    categoryId,
                    categoryName: product.categoryName,
                    sku: '',
                    barcode: '',
                    images: uploadedImages,
                    pricing: {
                        salePrice: product.salePrice,
                        costPrice: product.costPrice,
                        wholesalePrice: product.salePrice
                    },
                    productType: 'ready',
                    stock: { quantity: 0, lowStockThreshold: 3, trackInventory: true },
                    unitType: 'ш',
                    isActive: true,
                    isHidden: true,
                    stats: { totalSold: 0, totalRevenue: 0 },
                    isDeleted: false
                });
                success++;
            } catch (error) {
                console.error('Import error:', error);
                failed++;
            }
        }

        // Update duplicates
        for (const product of toUpdate) {
            try {
                processed++;
                setImportProgress({ current: processed, total: totalItems });

                if (!product.duplicateOf) continue;

                const uploadedImages = await uploadAllImages(product.images, business.id);

                await productService.updateProduct(business.id, product.duplicateOf, {
                    name: product.name,
                    description: product.description,
                    images: uploadedImages,
                    pricing: {
                        salePrice: product.salePrice,
                        costPrice: product.costPrice,
                        wholesalePrice: product.salePrice
                    }
                });
                success++;
            } catch (error) {
                console.error('Update error:', error);
                failed++;
            }
        }

        // Merge duplicates (add images only)
        for (const product of toMerge) {
            try {
                processed++;
                setImportProgress({ current: processed, total: totalItems });

                if (!product.duplicateOf) continue;

                const existing = existingProducts.find(p => p.id === product.duplicateOf);
                if (!existing) continue;

                const uploadedImages = await uploadAllImages(product.images, business.id);
                const mergedImages = [...(existing.images || []), ...uploadedImages];

                await productService.updateProduct(business.id, product.duplicateOf, {
                    images: mergedImages,
                    description: existing.description
                        ? `${existing.description}\n\n--- FB ---\n${product.description}`
                        : product.description
                });
                success++;
            } catch (error) {
                console.error('Merge error:', error);
                failed++;
            }
        }

        setImportResults({ success, failed });
        setStep('done');
        toast.success(`${success} бараа амжилттай импортлогдлоо!`);
    };

    // ===== RENDER =====
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '95vw' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {step !== 'setup' && step !== 'done' && (
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setStep('setup')}>
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 12,
                                background: 'linear-gradient(135deg, #1877f2, #42b72a)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Facebook size={20} color="white" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Facebook Импорт</h2>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {step === 'setup' && 'Page-ийн постоос бараа автоматаар оруулах'}
                                    {step === 'fetching' && 'Постууд татаж байна...'}
                                    {step === 'processing' && 'AI задалж байна...'}
                                    {step === 'review' && `${products.length} бараа олдлоо`}
                                    {step === 'importing' && 'Импортлож байна...'}
                                    {step === 'done' && 'Дууслаа!'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ minHeight: 400 }}>

                    {/* ===== SETUP ===== */}
                    {step === 'setup' && (
                        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="modal-section-card">
                                <div className="modal-section-title">Facebook Page</div>
                                <div className="input-group">
                                    <label className="input-label">Page URL <span className="required">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="https://facebook.com/myshop"
                                        value={pageUrl}
                                        onChange={e => setPageUrl(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group" style={{ marginTop: 12 }}>
                                    <label className="input-label">
                                        Page Access Token <span className="required">*</span>
                                    </label>
                                    <input
                                        className="input"
                                        type="password"
                                        placeholder="EAAxxxxxxxx..."
                                        value={accessToken}
                                        onChange={e => setAccessToken(e.target.value)}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                        <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer"
                                            style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                            Graph API Explorer
                                        </a> → pages_read_engagement permission → Generate Access Token
                                    </p>
                                </div>
                            </div>

                            <div className="modal-section-card">
                                <div className="modal-section-title">
                                    <Calendar size={16} style={{ marginRight: 6 }} />
                                    Хугацааны хүрээ
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="input-group">
                                        <label className="input-label">Эхлэх огноо</label>
                                        <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Дуусах огноо</label>
                                        <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary gradient-btn premium-btn"
                                onClick={handleStartFetch}
                                style={{ height: 52, borderRadius: 16, fontSize: '1rem', fontWeight: 800, gap: 10 }}
                            >
                                <Sparkles size={20} />
                                AI Импорт эхлүүлэх
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* ===== FETCHING / PROCESSING ===== */}
                    {(step === 'fetching' || step === 'processing') && (
                        <div className="animate-fade-in" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', minHeight: 350, gap: 24, textAlign: 'center'
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 24,
                                background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
                            </div>

                            <div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>
                                    {step === 'fetching' ? 'Постууд татаж байна' : 'AI задалж байна'}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {progress.message}
                                </p>
                            </div>

                            {progress.total > 0 && (
                                <div style={{ width: '100%', maxWidth: 400 }}>
                                    <div style={{
                                        height: 8, borderRadius: 4, background: 'var(--bg-soft)', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: 'linear-gradient(90deg, var(--primary), #42b72a)',
                                            width: `${(progress.current / progress.total) * 100}%`,
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {progress.current} / {progress.total}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== REVIEW ===== */}
                    {step === 'review' && (
                        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Tabs */}
                            <div className="modal-tabs" style={{ margin: 0 }}>
                                <button
                                    type="button"
                                    className={`tab-item ${activeTab === 'new' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('new')}
                                >
                                    <CheckCircle2 size={16} />
                                    Шинэ ({newProducts.length})
                                </button>
                                <button
                                    type="button"
                                    className={`tab-item ${activeTab === 'duplicates' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('duplicates')}
                                    style={duplicateProducts.length > 0 ? { color: 'var(--accent-orange)' } : {}}
                                >
                                    <AlertTriangle size={16} />
                                    Давхардсан ({duplicateProducts.length})
                                </button>
                            </div>

                            {/* New Products Tab */}
                            {activeTab === 'new' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={newProducts.every(p => p.isSelected)}
                                                onChange={e => toggleAllNew(e.target.checked)}
                                                style={{ accentColor: 'var(--primary)' }}
                                            />
                                            Бүгдийг сонгох
                                        </label>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {newProducts.filter(p => p.isSelected).length} сонгогдсон
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                                        {newProducts.length === 0 ? (
                                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                                Шинэ бараа олдсонгүй
                                            </div>
                                        ) : newProducts.map(product => (
                                            <ProductCard
                                                key={product.fbPostId}
                                                product={product}
                                                onToggle={() => toggleProduct(product.fbPostId)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Duplicates Tab */}
                            {activeTab === 'duplicates' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 450, overflowY: 'auto' }}>
                                    {duplicateProducts.length === 0 ? (
                                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: 8 }} />
                                            <p>Давхардсан бараа байхгүй!</p>
                                        </div>
                                    ) : duplicateProducts.map(product => (
                                        <DuplicateCard
                                            key={product.fbPostId}
                                            product={product}
                                            onActionChange={(action) => setDuplicateAction(product.fbPostId, action)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== IMPORTING ===== */}
                    {step === 'importing' && (
                        <div className="animate-fade-in" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', minHeight: 350, gap: 24
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 24,
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Download size={36} className="animate-pulse" style={{ color: '#10b981' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>Бараа импортлож байна</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Зургууд хуулж, бараа нэмж байна... {importProgress.current}/{importProgress.total}
                                </p>
                            </div>
                            <div style={{ width: '100%', maxWidth: 400 }}>
                                <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-soft)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 4,
                                        background: 'linear-gradient(90deg, #10b981, #059669)',
                                        width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== DONE ===== */}
                    {step === 'done' && (
                        <div className="animate-fade-in" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', minHeight: 350, gap: 24
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 24,
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <CheckCircle2 size={40} style={{ color: '#10b981' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.2rem' }}>Импорт дууслаа! 🎉</h3>
                                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{importResults.success}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Амжилттай</div>
                                    </div>
                                    {importResults.failed > 0 && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-red)' }}>{importResults.failed}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Алдаатай</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-secondary" onClick={() => { setStep('setup'); setProducts([]); }}>
                                    <RefreshCw size={16} /> Дахин импорт
                                </button>
                                <button className="btn btn-primary gradient-btn" onClick={onClose}>
                                    Хаах
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Import button */}
                {step === 'review' && (
                    <div className="modal-footer" style={{
                        padding: '16px 24px', borderTop: '1px solid var(--border-color)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {newProducts.filter(p => p.isSelected).length + duplicateProducts.filter(p => p.isSelected && p.duplicateAction !== 'skip').length} бараа импортлох бэлэн
                        </span>
                        <button
                            className="btn btn-primary gradient-btn premium-btn"
                            onClick={handleImport}
                            style={{ height: 46, borderRadius: 14, padding: '0 28px', fontWeight: 800, gap: 8 }}
                        >
                            <Download size={18} />
                            Импортлох
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

// ===== Product Review Card =====
function ProductCard({ product, onToggle }: { product: FBExtractedProduct; onToggle: () => void }) {
    return (
        <div
            className="modal-section-card"
            style={{
                padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                opacity: product.isSelected ? 1 : 0.5,
                border: product.isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease'
            }}
            onClick={onToggle}
        >
            {/* Image */}
            <div style={{
                width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                background: 'var(--bg-soft)', flexShrink: 0
            }}>
                {product.images[0] ? (
                    <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{product.name}</div>
                    <input
                        type="checkbox"
                        checked={product.isSelected}
                        onChange={onToggle}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor: 'var(--primary)', marginLeft: 8 }}
                    />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-soft" style={{ fontSize: '0.65rem' }}>{product.categoryName}</span>
                    {product.salePrice > 0 && <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>₮{product.salePrice.toLocaleString()}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <ImageIcon size={10} /> {product.images.length}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: product.confidence > 70 ? '#10b981' : 'var(--accent-orange)' }}>
                        AI {product.confidence}%
                    </span>
                </div>
                {product.description && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.description}
                    </p>
                )}
            </div>
        </div>
    );
}

// ===== Duplicate Card =====
function DuplicateCard({ product, onActionChange }: { product: FBExtractedProduct; onActionChange: (a: 'skip' | 'update' | 'merge') => void }) {
    return (
        <div className="modal-section-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                    background: 'var(--bg-soft)', flexShrink: 0
                }}>
                    {product.images[0] ? (
                        <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{product.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 600, marginTop: 2 }}>
                        ⚠️ "{product.duplicateOfName}" бараатай давхардаж байна
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                    type="button"
                    className={`btn btn-sm ${product.duplicateAction === 'skip' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onActionChange('skip')}
                    style={{ borderRadius: 10, fontWeight: 700, gap: 4, fontSize: '0.75rem' }}
                >
                    <SkipForward size={14} /> Алгасах
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${product.duplicateAction === 'update' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onActionChange('update')}
                    style={{ borderRadius: 10, fontWeight: 700, gap: 4, fontSize: '0.75rem' }}
                >
                    <Replace size={14} /> Шинэчлэх
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${product.duplicateAction === 'merge' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onActionChange('merge')}
                    style={{ borderRadius: 10, fontWeight: 700, gap: 4, fontSize: '0.75rem' }}
                >
                    <Merge size={14} /> Нэгтгэх
                </button>
            </div>
        </div>
    );
}
