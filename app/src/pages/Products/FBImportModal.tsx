import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Facebook, Calendar, Loader2, CheckCircle2, AlertTriangle,
    ChevronRight, Download, ImageIcon, Sparkles, X, RefreshCw, ArrowLeft,
    Edit3, Package, SkipForward, Replace, Merge, Square, Tag, ArrowUpDown
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, categoryService, cargoService } from '../../services/db';
import {
    fetchFBPageId, fetchFBPosts, extractProductsFromPosts,
    detectDuplicates, uploadAllImages, extractImagesFromPost,
    downloadAndUploadImage,
    type FBExtractedProduct, type FBPost
} from '../../services/ai/fbImportService';
import { globalSettingsService } from '../../services/db';
import type { Product, Category, CargoType } from '../../types';
import { toast } from 'react-hot-toast';

// ===== Robust category matching to prevent duplicates =====
// Known semantic equivalents (Mongolian category synonyms)
const CATEGORY_SYNONYMS: Record<string, string[]> = {
    'алкоголь': ['спирттэй ундаа', 'архи', 'согтууруулах ундаа'],
    'спирттэй ундаа': ['алкоголь', 'архи', 'согтууруулах ундаа'],
    'гэр ахуйн бараа': ['гэр ахуйн хэрэгсэл', 'гэрийн бараа', 'ахуйн бараа'],
    'гэр ахуйн хэрэгсэл': ['гэр ахуйн бараа', 'гэрийн хэрэгсэл', 'ахуйн хэрэгсэл'],
    'хувийн ариун цэвэр': ['хувийн арчилгаа', 'биеийн арчилгаа'],
    'хувийн арчилгаа': ['хувийн ариун цэвэр', 'биеийн арчилгаа'],
    'гоо сайхны хэрэгсэл': ['гоо сайхан', 'эрүүл мэнд, гоо сайхан', 'косметик'],
    'эрүүл мэнд, гоо сайхан': ['гоо сайхны хэрэгсэл', 'гоо сайхан'],
    'хүүхдийн тоглоом': ['тоглоом'],
    'тоглоом': ['хүүхдийн тоглоом'],
    'гар ахуйн бараа': ['гар ахуйн хэрэгсэл'],
    'гар ахуйн хэрэгсэл': ['гар ахуйн бараа'],
    'бичиг хэрэг': ['бичиг хэрэгсэл', 'бичгийн хэрэг'],
    'эрүүл ахуй': ['эрүүл мэнд', 'эмийн бараа'],
};

function tokenizeCategory(name: string): string[] {
    return name.toLowerCase().replace(/[^а-яөүёa-z0-9\s,]/gi, ' ').split(/[\s,]+/).filter(w => w.length > 1);
}

function findBestCategoryMatch(aiCategoryName: string, existingCategories: Category[]): Category | null {
    if (!aiCategoryName || existingCategories.length === 0) return null;
    const aiLower = aiCategoryName.toLowerCase().trim();
    const aiWords = tokenizeCategory(aiCategoryName);

    let bestMatch: Category | null = null;
    let bestScore = 0;

    for (const cat of existingCategories) {
        const catLower = cat.name.toLowerCase().trim();
        let score = 0;

        // Signal 1: Exact match (100%)
        if (aiLower === catLower) return cat;

        // Signal 2: Synonym match (90%)
        const synonyms = CATEGORY_SYNONYMS[aiLower] || [];
        if (synonyms.includes(catLower)) { score = 90; }

        // Signal 3: Substring containment (70%)
        if (score < 70) {
            if (aiLower.includes(catLower) || catLower.includes(aiLower)) {
                score = Math.max(score, 70);
            }
        }

        // Signal 4: Word overlap (proportional)
        if (score < 60) {
            const catWords = tokenizeCategory(cat.name);
            if (catWords.length > 0 && aiWords.length > 0) {
                let matches = 0;
                for (const w of aiWords) {
                    if (catWords.some(cw => cw === w || (w.length > 3 && cw.length > 3 && (cw.includes(w) || w.includes(cw))))) {
                        matches++;
                    }
                }
                const overlap = matches / Math.max(aiWords.length, catWords.length);
                score = Math.max(score, overlap * 80);
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = cat;
        }
    }

    // Threshold: 40%+ → match, under 40% → truly new category
    return bestScore >= 40 ? bestMatch : null;
}

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
    const [importAsHidden, setImportAsHidden] = useState(false);
    const [importProductType, setImportProductType] = useState<'preorder' | 'ready'>('preorder');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [importTags, setImportTags] = useState(localStorage.getItem('fb_import_tags') || 'FB импорт');

    // Processing
    const [_, setPosts] = useState<FBPost[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
    const [currentProduct, setCurrentProduct] = useState<FBExtractedProduct | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Review
    const [products, setProducts] = useState<FBExtractedProduct[]>([]);
    const [existingProducts, setExistingProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'duplicates'>('new');
    const [categories, setCategories] = useState<Category[]>([]);

    // Import progress
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
    const [importingProduct, setImportingProduct] = useState<string>('');

    // Cargo types
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);

    const isFetching = step === 'fetching' || step === 'processing';

    // Load data
    useEffect(() => {
        if (!business?.id) return;
        const u1 = productService.subscribeProducts(business.id, setExistingProducts);
        const u2 = categoryService.subscribeCategories(business.id, setCategories);
        const u3 = cargoService.subscribeCargoTypes(business.id, setCargoTypes);

        // Fetch global Gemini API key
        globalSettingsService.getSettings().then(settings => {
            if (settings.geminiApiKey) {
                setGeminiApiKey(settings.geminiApiKey);
            }
        });

        return () => { u1(); u2(); u3(); };
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
        localStorage.setItem('fb_import_tags', importTags);
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
        setCurrentProduct(null);

        // Create abort controller for cancellation
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const pageId = await fetchFBPageId(pageUrl, accessToken);
            setProgress({ current: 0, total: 0, message: `Page олдлоо! Постууд татаж байна...` });

            const fetchedPosts = await fetchFBPosts(
                pageId,
                accessToken,
                new Date(startDate),
                new Date(endDate + 'T23:59:59'),
                sortOrder
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
            const categoryNames = categories.map(c => c.name);
            const cargoForAI = cargoTypes.map(ct => ({ id: ct.id, name: ct.name, fee: ct.fee }));
            const extracted = await extractProductsFromPosts(fetchedPosts, geminiApiKey, (current, total, product) => {
                setProgress({
                    current,
                    total,
                    message: product
                        ? `${current}/${total} — "${product.name}" олдлоо`
                        : `${current}/${total} пост задалж байна...`
                });
                if (product) setCurrentProduct(product);
            }, categoryNames, cargoForAI, controller.signal);

            if (extracted.length === 0) {
                toast.error('Барааны мэдээлэл бүхий пост олдсонгүй');
                setStep('setup');
                return;
            }

            // Detect duplicates
            const withDuplicates = detectDuplicates(
                extracted,
                existingProducts.map(p => ({ id: p.id, name: p.name, description: p.description, sku: p.sku, images: p.images }))
            );

            setProducts(withDuplicates);
            setCurrentProduct(null);
            setStep('review');
            const wasCancelled = controller.signal.aborted;
            toast.success(`${extracted.length} бараа олдлоо!${wasCancelled ? ' (зогсоосон)' : ''}`);

        } catch (error: any) {
            console.error('FB Import error:', error);
            toast.error(error.message || 'Алдаа гарлаа');
            setStep('setup');
        }
    };

    // ===== FIX IMAGES: Fast mode — no AI, just match & download =====
    const handleFixImages = async () => {
        if (!pageUrl || !accessToken || !startDate || !endDate) {
            toast.error('Page URL, Token, огноо бөглөнө үү');
            return;
        }
        if (!business?.id) return;

        saveSettings();
        setStep('fetching');
        setProgress({ current: 0, total: 0, message: 'Зураггүй бараа хайж байна...' });

        try {
            // 1. Find products with no images
            const imagelessProducts = existingProducts.filter(p =>
                !p.isDeleted && (!p.images || p.images.length === 0 || p.images.every(img => !img))
            );

            if (imagelessProducts.length === 0) {
                toast.success('Бүх бараанд зураг байна! ✅');
                setStep('setup');
                return;
            }

            setProgress({ current: 0, total: 0, message: `${imagelessProducts.length} зураггүй бараа олдлоо. FB постууд татаж байна...` });

            // 2. Fetch FB posts
            const pageId = await fetchFBPageId(pageUrl, accessToken);
            const fetchedPosts = await fetchFBPosts(
                pageId, accessToken,
                new Date(startDate),
                new Date(endDate + 'T23:59:59'),
                'newest'
            );

            if (fetchedPosts.length === 0) {
                toast.error('Тухайн хугацаанд пост олдсонгүй');
                setStep('setup');
                return;
            }

            // 3. Tokenize function for matching
            const tokenize = (text: string): string[] =>
                text.toLowerCase().replace(/[^\u0400-\u04ffa-z0-9\s]/gi, ' ')
                    .split(/\s+/).filter(w => w.length > 2);

            // 4. Match each imageless product to FB posts
            setStep('processing');
            let fixed = 0;
            let noMatch = 0;

            for (let i = 0; i < imagelessProducts.length; i++) {
                const product = imagelessProducts[i];
                setProgress({
                    current: i + 1,
                    total: imagelessProducts.length,
                    message: `${i + 1}/${imagelessProducts.length} — "${product.name}" зураг хайж байна...`
                });

                const productWords = tokenize(product.name);
                if (productWords.length === 0) { noMatch++; continue; }

                // Find best matching post by name overlap
                let bestPost: FBPost | null = null;
                let bestScore = 0;

                for (const post of fetchedPosts) {
                    const postText = (post.message || '').toLowerCase();
                    const postWords = tokenize(postText);
                    if (postWords.length === 0) continue;

                    let matches = 0;
                    for (const pw of productWords) {
                        if (postWords.some(w => w === pw || (w.length > 3 && pw.length > 3 && (w.includes(pw) || pw.includes(w))))) {
                            matches++;
                        }
                    }
                    const score = matches / productWords.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestPost = post;
                    }
                }

                // Require at least 50% word match
                if (!bestPost || bestScore < 0.5) {
                    noMatch++;
                    continue;
                }

                // Extract images from matched post
                const postImages = extractImagesFromPost(bestPost);
                if (postImages.length === 0) { noMatch++; continue; }

                // Download & upload images
                const uploadedUrls: string[] = [];
                for (const imgUrl of postImages) {
                    const uploaded = await downloadAndUploadImage(imgUrl, business.id);
                    if (uploaded) uploadedUrls.push(uploaded);
                }

                if (uploadedUrls.length > 0) {
                    await productService.updateProduct(business.id, product.id, { images: uploadedUrls });
                    fixed++;
                } else {
                    noMatch++;
                }

                await new Promise(r => setTimeout(r, 200));
            }

            toast.success(
                `Зураг засвар дууслаа!\n✅ ${fixed} бараанд зураг нэмсэн\n❌ ${noMatch} тохирох пост олдсонгүй`,
                { duration: 8000 }
            );
            setStep('setup');

        } catch (error: any) {
            console.error('Fix images error:', error);
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
            p.fbPostId === fbPostId ? { ...p, duplicateAction: action } : p
        ));
    };

    // Update individual product field
    const updateProduct = (fbPostId: string, field: keyof FBExtractedProduct, value: any) => {
        setProducts(prev => prev.map(p => {
            if (p.fbPostId !== fbPostId) return p;
            const updated = { ...p, [field]: value };
            // Auto-recalculate cargoFee if cargoTypeId changes
            if (field === 'cargoTypeId') {
                const ct = cargoTypes.find(c => c.id === value);
                if (ct) {
                    updated.cargoFee = ct.fee;
                    updated.cargoSizeCategory = ct.name;
                }
            }
            return updated;
        }));
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
                setImportingProduct(product.name);

                // Upload images to Firebase Storage via server proxy
                let finalImages: string[] = [];
                try {
                    const uploadedImages = await uploadAllImages(product.images, business.id);
                    finalImages = uploadedImages; // Only use successfully uploaded Firebase URLs
                } catch (imgErr) {
                    console.warn('[FB Import] Image upload failed:', imgErr);
                    finalImages = []; // Never fall back to Facebook CDN URLs
                }

                // Find or create category (robust multi-signal match)
                let categoryId = '';
                let matchedCatName = product.categoryName || 'Бусад';

                const bestMatch = findBestCategoryMatch(matchedCatName, categories);
                if (bestMatch) {
                    categoryId = bestMatch.id;
                    matchedCatName = bestMatch.name;
                } else {
                    // Truly new category — no existing match found
                    categoryId = await categoryService.createCategory(business.id, {
                        name: matchedCatName,
                        description: ''
                    });
                }



                // Build product data, removing undefined values (Firestore rejects them)
                const productData: Record<string, any> = {
                    name: product.name,
                    description: product.description,
                    categoryId,
                    categoryName: matchedCatName,
                    sku: product.sku || '',
                    barcode: '',
                    images: finalImages,
                    pricing: {
                        salePrice: product.salePrice || 0,
                        costPrice: product.costPrice || 0,
                        wholesalePrice: product.salePrice || 0
                    },
                    productType: importProductType,
                    stock: {
                        quantity: importProductType === 'ready' ? (product.variations?.length ? product.variations.reduce((s, v) => s + v.quantity, 0) : 0) : 0,
                        lowStockThreshold: 3,
                        trackInventory: importProductType === 'ready'
                    },
                    variations: (product.variations && product.variations.length > 0) ? product.variations : [],
                    unitType: 'ш',
                    isActive: true,
                    isHidden: importAsHidden,
                    stats: { totalSold: 0, totalRevenue: 0 },
                    isDeleted: false,
                    tags: importTags ? importTags.split(',').map(t => t.trim()).filter(Boolean) : []
                };

                // Only add cargoFee if it exists (avoid undefined in Firestore)
                if (product.cargoFee && product.cargoFee > 0) {
                    productData.cargoFee = {
                        amount: product.cargoFee,
                        isIncluded: false,
                        cargoTypeId: product.cargoTypeId || '',
                        cargoValue: product.cargoFee,
                    };
                }

                await productService.createProduct(business.id, productData);

                success++;
            } catch (error: any) {
                console.error('[FB Import] Product creation FAILED:', product.name, error);
                if (failed === 0) {
                    // Capture first error for display
                    toast.error(`Алдаа: ${error?.message || error}`);
                }
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

                            <div className="modal-section-card">
                                <div className="modal-section-title">Тохиргоо</div>
                                <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Барааг нууцлагдмал оруулах</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Нийтэд харагдахгүй, зөвхөн админ засаж харна</div>
                                    </div>
                                    <div
                                        className={`products-mini-toggle ${importAsHidden ? 'active' : ''}`}
                                        onClick={() => setImportAsHidden(!importAsHidden)}
                                    >
                                        <div className="toggle" />
                                    </div>
                                </div>

                                {/* Fetch order */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <ArrowUpDown size={14} /> Пост эрэмбэ
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {sortOrder === 'newest' ? 'Шинэ постоос эхэлж задлана' : 'Хуучин постоос эхэлж задлана'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, background: 'var(--bg-soft)', borderRadius: 10, padding: 3 }}>
                                        <button type="button" onClick={() => setSortOrder('newest')} style={{
                                            padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                                            background: sortOrder === 'newest' ? 'var(--primary)' : 'transparent',
                                            color: sortOrder === 'newest' ? '#fff' : 'var(--text-muted)'
                                        }}>Шинэ</button>
                                        <button type="button" onClick={() => setSortOrder('oldest')} style={{
                                            padding: '5px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                                            background: sortOrder === 'oldest' ? 'var(--primary)' : 'transparent',
                                            color: sortOrder === 'oldest' ? '#fff' : 'var(--text-muted)'
                                        }}>Хуучин</button>
                                    </div>
                                </div>

                                {/* Import tags */}
                                <div className="input-group" style={{ marginTop: 0 }}>
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Tag size={13} /> Импортын шошго (tag)
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="FB импорт, КОСТКО"
                                        value={importTags}
                                        onChange={e => setImportTags(e.target.value)}
                                        style={{ height: 38, fontSize: '0.85rem' }}
                                    />
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        Олон шошгыг таслалаар тусгаарлана. Жишээ: FB импорт, КОСТКО
                                    </p>
                                </div>
                            </div>

                            <div className="modal-section-card">
                                <div className="modal-section-title">Барааны төрөл</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setImportProductType('preorder')}
                                        style={{
                                            flex: 1, padding: '12px 16px', borderRadius: 12,
                                            border: `2px solid ${importProductType === 'preorder' ? 'var(--primary)' : 'var(--border)'}`,
                                            background: importProductType === 'preorder' ? 'var(--primary-soft, rgba(99,102,241,0.08))' : 'transparent',
                                            cursor: 'pointer', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: importProductType === 'preorder' ? 'var(--primary)' : 'var(--text)' }}>📦 Захиалгын бараа</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Захиалгаар авах боломжтой</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImportProductType('ready')}
                                        style={{
                                            flex: 1, padding: '12px 16px', borderRadius: 12,
                                            border: `2px solid ${importProductType === 'ready' ? 'var(--primary)' : 'var(--border)'}`,
                                            background: importProductType === 'ready' ? 'var(--primary-soft, rgba(99,102,241,0.08))' : 'transparent',
                                            cursor: 'pointer', textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: importProductType === 'ready' ? 'var(--primary)' : 'var(--text)' }}>✅ Бэлэн бараа</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Нөөцөд байгаа, шууд борлуулна</div>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-primary gradient-btn premium-btn"
                                    onClick={handleStartFetch}
                                    disabled={isFetching}
                                    style={{ flex: 1, height: 50, borderRadius: 16, fontWeight: 800 }}
                                >
                                    <Sparkles size={20} />
                                    AI Импорт
                                    <ChevronRight size={18} />
                                </button>
                                <button
                                    className="btn"
                                    onClick={handleFixImages}
                                    disabled={isFetching}
                                    style={{
                                        height: 50, borderRadius: 16, fontWeight: 800,
                                        background: '#059669', color: 'white', border: 'none',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '0 16px', whiteSpace: 'nowrap'
                                    }}
                                >
                                    <ImageIcon size={18} />
                                    Зураг татах
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== FETCHING / PROCESSING ===== */}
                    {(step === 'fetching' || step === 'processing') && (
                        <div className="animate-fade-in" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', minHeight: 350, gap: 20, textAlign: 'center'
                        }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.05))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                            </div>

                            <div>
                                <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>
                                    {step === 'fetching' ? 'Постууд татаж байна' : 'AI задалж байна'}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {progress.message}
                                </p>
                            </div>

                            {/* Real-time current product display */}
                            {currentProduct && step === 'processing' && (
                                <div style={{
                                    width: '100%', maxWidth: 420, padding: 12, borderRadius: 14,
                                    background: 'var(--bg-soft)', display: 'flex', gap: 12, alignItems: 'center',
                                    textAlign: 'left', animation: 'fadeIn 0.3s ease'
                                }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                                        background: 'var(--surface-1)', flexShrink: 0
                                    }}>
                                        {currentProduct.images[0] ? (
                                            <img src={currentProduct.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={18} style={{ color: 'var(--text-muted)' }} /></div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {currentProduct.name}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {currentProduct.salePrice > 0 && <span style={{ fontWeight: 700 }}>₮{currentProduct.salePrice.toLocaleString()}</span>}
                                            <span className="badge badge-soft" style={{ fontSize: '0.6rem' }}>{currentProduct.categoryName}</span>
                                            {currentProduct.cargoFee && currentProduct.cargoFee > 0 && (
                                                <span style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Package size={10} />₮{currentProduct.cargoFee.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {progress.total > 0 && (
                                <div style={{ width: '100%', maxWidth: 420 }}>
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

                            {/* Stop button */}
                            {step === 'processing' && progress.current > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        abortControllerRef.current?.abort();
                                        toast.success('Зогсоож байна...');
                                    }}
                                    style={{
                                        borderRadius: 12, fontWeight: 700, gap: 6,
                                        border: '2px solid var(--accent-red)', color: 'var(--accent-red)',
                                        background: 'rgba(239, 68, 68, 0.06)'
                                    }}
                                >
                                    <Square size={14} />
                                    Зогсоож, олдсон барааг шалгах
                                </button>
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
                                                onUpdate={(field, val) => updateProduct(product.fbPostId, field, val)}
                                                cargoTypes={cargoTypes}
                                                categories={categories}
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
                                    {importingProduct ? `"${importingProduct}" оруулж байна...` : 'Зургууд хуулж байна...'} {importProgress.current}/{importProgress.total}
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
function ProductCard({ product, onToggle, onUpdate, cargoTypes, categories }: {
    product: FBExtractedProduct;
    onToggle: () => void;
    onUpdate: (field: keyof FBExtractedProduct, value: any) => void;
    cargoTypes: CargoType[];
    categories: Category[];
}) {
    const [expanded, setExpanded] = useState(false);
    const [catSearch, setCatSearch] = useState('');
    const [catOpen, setCatOpen] = useState(false);
    const profit = product.salePrice - (product.costPrice || 0) - (product.cargoFee || 0);
    const profitPercent = product.salePrice > 0 ? Math.round((profit / product.salePrice) * 100) : 0;

    return (
        <div
            className="modal-section-card"
            style={{
                padding: 12, display: 'flex', flexDirection: 'column', gap: 0,
                opacity: product.isSelected ? 1 : 0.5,
                border: product.isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease'
            }}
        >
            {/* Main Row */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }} onClick={onToggle}>
                {/* Image */}
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0 }}>
                    {product.images[0] ? (
                        <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} style={{ color: 'var(--text-muted)' }} /></div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} title="Засах" style={{ width: 28, height: 28 }}>
                                <Edit3 size={14} />
                            </button>
                            <input type="checkbox" checked={product.isSelected} onChange={onToggle} onClick={e => e.stopPropagation()} style={{ accentColor: 'var(--primary)' }} />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-soft" style={{ fontSize: '0.62rem' }}>{product.categoryName}</span>
                        {product.salePrice > 0 && <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>₮{product.salePrice.toLocaleString()}</span>}
                        {product.costPrice > 0 && <span style={{ color: 'var(--text-muted)' }}>Өртөг: ₮{product.costPrice.toLocaleString()}</span>}
                        {product.cargoFee && product.cargoFee > 0 && <span style={{ color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: 2 }}><Package size={10} />₮{product.cargoFee.toLocaleString()}</span>}
                        {product.salePrice > 0 && <span style={{ fontWeight: 700, color: profit > 0 ? '#10b981' : '#ef4444' }}>Ашиг: {profit > 0 ? '+' : ''}₮{profit.toLocaleString()} ({profitPercent}%)</span>}
                        <span style={{ fontSize: '0.62rem', color: product.confidence > 70 ? '#10b981' : 'var(--accent-orange)' }}>AI {product.confidence}%</span>
                    </div>
                </div>
            </div>

            {/* Expanded Edit Fields */}
            {expanded && product.isSelected && (
                <div className="animate-fade-in" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
                    <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.7rem' }}>Нэр</label>
                        <input className="input" value={product.name} onChange={e => onUpdate('name', e.target.value)} style={{ height: 36, fontSize: '0.85rem' }} />
                    </div>
                    <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.7rem' }}>Ангилал</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input"
                                value={catOpen ? catSearch : product.categoryName}
                                onChange={e => {
                                    setCatSearch(e.target.value);
                                    if (!catOpen) setCatOpen(true);
                                }}
                                onFocus={() => { setCatOpen(true); setCatSearch(product.categoryName || ''); }}
                                onBlur={() => setTimeout(() => setCatOpen(false), 200)}
                                placeholder="Ангилал сонгох эсвэл бичих..."
                                style={{ height: 36, fontSize: '0.85rem' }}
                            />
                            {catOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                    background: 'var(--surface-1)', border: '1.5px solid var(--border-primary)',
                                    borderRadius: 12, marginTop: 4, maxHeight: 180, overflowY: 'auto',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                }}>
                                    {categories
                                        .filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))
                                        .map(c => (
                                            <div
                                                key={c.id}
                                                onMouseDown={() => {
                                                    onUpdate('categoryName', c.name);
                                                    setCatOpen(false);
                                                    setCatSearch('');
                                                }}
                                                style={{
                                                    padding: '8px 14px', cursor: 'pointer',
                                                    fontSize: '0.82rem', fontWeight: 600,
                                                    background: product.categoryName === c.name ? 'rgba(99,102,241,0.08)' : 'transparent',
                                                    color: product.categoryName === c.name ? 'var(--primary)' : 'var(--text-primary)',
                                                    borderBottom: '1px solid var(--border-primary)',
                                                }}
                                            >
                                                {c.name}
                                            </div>
                                        ))}
                                    {catSearch && !categories.some(c => c.name.toLowerCase() === catSearch.toLowerCase()) && (
                                        <div
                                            onMouseDown={() => {
                                                onUpdate('categoryName', catSearch.trim());
                                                setCatOpen(false);
                                                setCatSearch('');
                                            }}
                                            style={{
                                                padding: '8px 14px', cursor: 'pointer',
                                                fontSize: '0.82rem', fontWeight: 700,
                                                color: 'var(--primary)',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}
                                        >
                                            + "{catSearch.trim()}" шинээр үүсгэх
                                        </div>
                                    )}
                                    {categories.filter(c => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && !catSearch && (
                                        <div style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            Ангилал байхгүй
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Зарах үнэ (₮)</label>
                            <input className="input" type="number" value={product.salePrice} onChange={e => onUpdate('salePrice', Number(e.target.value))} style={{ height: 36, fontSize: '0.85rem' }} />
                        </div>
                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Өртөг (₮)</label>
                            <input className="input" type="number" value={product.costPrice} onChange={e => onUpdate('costPrice', Number(e.target.value))} style={{ height: 36, fontSize: '0.85rem' }} />
                        </div>
                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Карго (₮)</label>
                            <input className="input" type="number" value={product.cargoFee || 0} onChange={e => onUpdate('cargoFee', Number(e.target.value))} style={{ height: 36, fontSize: '0.85rem' }} />
                        </div>
                    </div>
                    {cargoTypes.length > 0 && (
                        <div className="input-group">
                            <label className="input-label" style={{ fontSize: '0.7rem' }}>Карго төрөл</label>
                            <select className="input select" value={product.cargoTypeId || ''} onChange={e => onUpdate('cargoTypeId', e.target.value)} style={{ height: 36, fontSize: '0.85rem' }}>
                                <option value="">Сонгох...</option>
                                {cargoTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name} (₮{ct.fee.toLocaleString()})</option>)}
                            </select>
                        </div>
                    )}
                    {product.salePrice > 0 && (
                        <div style={{ padding: '8px 12px', borderRadius: 10, background: profit > 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Цэвэр ашиг:</span>
                            <span style={{ fontWeight: 800, color: profit > 0 ? '#10b981' : '#ef4444' }}>
                                {profit > 0 ? '+' : ''}₮{profit.toLocaleString()} ({profitPercent}%)
                            </span>
                        </div>
                    )}
                </div>
            )}
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
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, wordBreak: 'break-word' as const }}>{product.name}</div>
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
