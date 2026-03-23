import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../Inventory/InventoryPage.css';
import { ImageUpload } from '../../components/common/ImageUpload';
import {
    Grid3X3, List, Plus, Search, MoreVertical, AlertTriangle, Loader2,
    Eye, EyeOff, Bot, Target, ShieldCheck, Sparkles, CheckCircle2, Facebook,
    Package, Clock, Check, Trash2, Image as ImageIcon, Link2, X, MessageSquare, Zap
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, categoryService, cargoService } from '../../services/db';
import { storageService as storage } from '../../services/storage';
import type { Product, Category, CargoType, ProductVariation, StockInquiry } from '../../types';
import { FBImportModal } from './FBImportModal';
import { CargoEstimatorModal } from './CargoEstimatorModal';
import { CreateInquiryModal } from '../StockInquiry/CreateInquiryModal';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../../components/common/PermissionGate';
import { collection, query, where, getCountFromServer, limit, onSnapshot, getDocs, type QueryConstraint } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { globalSettingsService } from '../../services/adminService';
import './ProductsPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ProductsPage() {


    const { business } = useBusinessStore();
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCreate, setShowCreate] = useState(false);
    const [showFBImport, setShowFBImport] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLimit, setProductsLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        low: 0,
        out: 0,
        value: 0
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isBulkTagging, setIsBulkTagging] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [showCargoEstimator, setShowCargoEstimator] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [allCargoTypes, setAllCargoTypes] = useState<CargoType[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'expensive' | 'cheapest'>('newest');

    useEffect(() => {
        if (!business?.id) return;
        const bizId = business.id;

        setTimeout(() => setLoading(true), 0);

        // Build Firestore query with category filter
        const ref = collection(db, 'businesses', bizId, 'products');
        const constraints: QueryConstraint[] = [where('isDeleted', '==', false)];

        // When a category is selected, filter at Firestore level by ID (stable)
        if (categoryFilter !== 'all') {
            constraints.push(where('categoryId', '==', categoryFilter));
        }

        // For price sorting we need ALL products, not limited
        const needsAllProducts = sortBy === 'expensive' || sortBy === 'cheapest';
        if (!needsAllProducts) {
            constraints.push(limit(productsLimit));
        }
        const q = query(ref, ...constraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            // Sort based on current sortBy
            data.sort((a, b) => {
                switch (sortBy) {
                    case 'newest': {
                        const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                        const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                        return tB - tA;
                    }
                    case 'oldest': {
                        const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                        const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                        return tA - tB;
                    }
                    case 'expensive':
                        return (b.pricing?.salePrice || 0) - (a.pricing?.salePrice || 0);
                    case 'cheapest':
                        return (a.pricing?.salePrice || 0) - (b.pricing?.salePrice || 0);
                    default:
                        return 0;
                }
            });
            setProducts(data);
            setHasMore(!needsAllProducts && data.length === productsLimit);
            setLoading(false);
        }, () => {
            setProducts([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id, productsLimit, categoryFilter, categories, sortBy]);

    // Subscribe to all categories independently
    useEffect(() => {
        if (!business?.id) return;
        const unsub = categoryService.subscribeCategories(business.id, setCategories);
        return () => unsub();
    }, [business?.id]);

    // Load Gemini API key + cargo types for estimator
    useEffect(() => {
        globalSettingsService.getSettings().then(s => {
            if (s.geminiApiKey) setGeminiApiKey(s.geminiApiKey);
        });
    }, []);

    useEffect(() => {
        if (!business?.id) return;
        const unsub = cargoService.subscribeCargoTypes(business.id, setAllCargoTypes);
        return () => unsub();
    }, [business?.id]);

    // Handle AI tool navigation from AI Agent page
    useEffect(() => {
        const aiAction = searchParams.get('ai');
        if (!aiAction) return;
        if (aiAction === 'fb-import') setShowFBImport(true);
        if (aiAction === 'auto-tag') handleBulkAutoTag();
        if (aiAction === 'cargo-fee') setShowCargoEstimator(true);
        setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Fetch real total product count (not limited by pagination)
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, 'businesses', business.id, 'products'),
            where('isDeleted', '==', false)
        );
        getCountFromServer(q).then(snap => {
            setTotalCount(snap.data().count);
        }).catch(() => { /* fallback to products.length */ });
    }, [business?.id, products.length]);

    useEffect(() => {
        const realTotal = totalCount ?? products.length;
        // Preorder бараа нь агуулахын нөөцтэй хамааралгүй — шүүнэ
        const stockTracked = products.filter(p => p.productType !== 'preorder' && !p.isDeleted && p.stock?.trackInventory !== false);
        const low = stockTracked.filter(p => (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) && (p.stock?.quantity || 0) > 0).length;
        const out = stockTracked.filter(p => (p.stock?.quantity || 0) === 0).length;
        const value = stockTracked.reduce((sum, p) => sum + ((p.pricing?.costPrice || 0) * (p.stock?.quantity || 0)), 0);

        setStats({ total: realTotal, low, out, value });
    }, [products, totalCount]);

    const filtered = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.categoryName || '').toLowerCase().includes(search.toLowerCase());

        const selectedCat = categoryFilter !== 'all' ? categories.find(c => c.id === categoryFilter) : null;
        const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter || (selectedCat && p.categoryName === selectedCat.name);

        return matchSearch && matchCategory;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'newest': {
                const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                return tB - tA;
            }
            case 'oldest': {
                const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime?.() || 0;
                return tA - tB;
            }
            case 'expensive':
                return (b.pricing?.salePrice || 0) - (a.pricing?.salePrice || 0);
            case 'cheapest':
                return (a.pricing?.salePrice || 0) - (b.pricing?.salePrice || 0);
            default:
                return 0;
        }
    });

    // Flash deal product lookup
    const flashDealMap = useMemo(() => {
        const fd = (business?.settings as any)?.storefront?.flashDeal;
        if (!fd?.enabled || !fd.products?.length) return new Map<string, number>();
        const map = new Map<string, number>();
        const now = Date.now();
        const globalEnd = fd.endsAt?.toDate?.()?.getTime?.() || new Date(fd.endsAt).getTime();
        for (const fp of fd.products) {
            const productEnd = fp.endsAt ? (fp.endsAt?.toDate?.()?.getTime?.() || new Date(fp.endsAt).getTime()) : globalEnd;
            if (productEnd > now) {
                map.set(fp.productId, fp.flashPrice);
            }
        }
        return map;
    }, [business?.settings]);

    const handleBulkAutoTag = async () => {
        if (!business) return;
        
        setIsBulkTagging(true);
        const toastId = toast.loading('Бүх барааг шалгаж байна...');

        try {
            const q = query(
                collection(db, 'businesses', business.id, 'products'),
                where('isDeleted', '==', false)
            );
            const snapshot = await getDocs(q);
            const allProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            
            const productsToTag = allProducts.filter(p => p.images?.length > 0 && (!p.tags || p.tags.length === 0));
            
            if (productsToTag.length === 0) {
                toast.success('Бүх зурагтай бараанууд хэдийнэ түлхүүр үгтэй байна!', { id: toastId });
                setIsBulkTagging(false);
                return;
            }

            if (!confirm(`Нийт ${productsToTag.length} бараанд AI ашиглан түлхүүр үг үүсгэх үү? Энэ нь хэдэн минут шаардаж магадгүй.`)) {
                toast.dismiss(toastId);
                setIsBulkTagging(false);
                return;
            }

            let successCount = 0;
            for (let i = 0; i < productsToTag.length; i++) {
                const p = productsToTag[i];
                toast.loading(`${productsToTag.length} бараанаас ${i+1}-г нь таньж байна...`, { id: toastId });
                
                try {
                    const res = await fetch('/api/fb-ai-tags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrls: [p.images[0]],
                            name: p.name,
                            description: p.description
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.tags && data.tags.length > 0) {
                            await productService.updateProduct(business.id, p.id, { tags: data.tags });
                            successCount++;
                        }
                    }
                } catch (e) {
                    console.error('Failed to tag product', p.id, e);
                }
                
                await new Promise(r => setTimeout(r, 800)); // Delay to prevent rate limits
            }
            
            toast.success(`Амжилттай! Нийт ${successCount} бараанд түлхүүр үг нэмэгдлээ ✨`, { id: toastId });
        } catch (error) {
            toast.error('Алдаа гарлаа', { id: toastId });
        } finally {
            setIsBulkTagging(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!business || !confirm('Энэ барааг устгахдаа итгэлтэй байна уу?')) return;
        try {
            await productService.updateProduct(business.id, id, { isDeleted: true });
            toast.success('Бараа устгагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === sorted.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sorted.map(p => p.id));
        }
    };

    const handleBulkUpdate = async (updates: Partial<Product>) => {
        if (!business || selectedIds.length === 0) return;

        setIsBulkUpdating(true);
        const toastId = toast.loading(`${selectedIds.length} барааг шинэчилж байна...`);

        try {
            await productService.bulkUpdateProducts(business.id, selectedIds, updates);
            toast.success('Амжилттай шинэчлэгдлээ', { id: toastId });
            setSelectedIds([]);
        } catch (error) {
            console.error('Bulk update error:', error);
            toast.error('Алдаа гарлаа', { id: toastId });
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!business || selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length} барааг устгахдаа итгэлтэй байна уу?`)) return;

        handleBulkUpdate({ isDeleted: true });
    };

    return (
        <>
            <div className="animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                {/* ── Gradient Hero ── */}
                <div className="prd-hero">
                    <div className="prd-hero-top">
                        <div className="prd-hero-left">
                            <div className="prd-hero-icon">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="prd-hero-title">Бараа Материал</h3>
                                <div className="prd-hero-desc">
                                    {loading ? 'Уншиж байна...' : `Нийт ${totalCount ?? products.length} төрлийн бараа`}
                                </div>
                            </div>
                        </div>
                        <div className="prd-hero-actions">
                            <PermissionGate permission="products.edit">
                                <button 
                                    className="prd-hero-btn" 
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                                    onClick={handleBulkAutoTag}
                                    disabled={isBulkTagging}
                                >
                                    {isBulkTagging ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
                                    AI Auto-Tag
                                </button>
                            </PermissionGate>
                            <PermissionGate permission="products.edit">
                                <button
                                    className="prd-hero-btn"
                                    style={{ background: '#f59e0b', color: 'white', border: 'none' }}
                                    onClick={() => setShowCargoEstimator(true)}
                                >
                                    <Package size={16} /> Карго
                                </button>
                            </PermissionGate>
                            <PermissionGate permission="products.create">
                                <button className="prd-hero-btn fb-btn" onClick={() => setShowFBImport(true)}>
                                    <Facebook size={16} /> FB
                                </button>
                            </PermissionGate>
                            <PermissionGate permission="products.create">
                                <button className="prd-hero-btn" onClick={() => setShowCreate(true)}>
                                    <Plus size={16} /> Шинэ бараа
                                </button>
                            </PermissionGate>
                        </div>
                    </div>

                    <div className="prd-hero-stats">
                        <div className="prd-hero-stat">
                            <div className="prd-hero-stat-value">{stats.total}</div>
                            <div className="prd-hero-stat-label">Нийт бараа</div>
                        </div>
                        <div className="prd-hero-stat clickable" onClick={() => setSearch('нөөц бага')}>
                            <div className="prd-hero-stat-value">{stats.low}</div>
                            <div className="prd-hero-stat-label">Нөөц бага</div>
                        </div>
                        <div className="prd-hero-stat clickable" onClick={() => setSearch('дууссан')}>
                            <div className="prd-hero-stat-value">{stats.out}</div>
                            <div className="prd-hero-stat-label">Дууссан</div>
                        </div>
                        <div className="prd-hero-stat">
                            <div className="prd-hero-stat-value">{fmt(stats.value)}</div>
                            <div className="prd-hero-stat-label">Нөөцийн үнэ</div>
                        </div>
                    </div>
                </div>

                {/* ── Card Container ── */}
                <div className="prd-card">
                    <div className="orders-toolbar animate-fade-in">
                        <div className="orders-search">
                            <Search size={18} className="orders-search-icon" />
                            <input className="input orders-search-input" placeholder="Бараа, SKU хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {categories.length > 0 && (
                                <select
                                    className="input"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ minWidth: 140, height: 42, borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 12px', background: 'var(--surface-1)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="all">Бүгд ангилал</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                            <select
                                className="input"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                style={{ minWidth: 130, height: 42, borderRadius: 12, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 12px', background: 'var(--surface-1)', border: '1.5px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="newest">Сүүлд нэмсэн</option>
                                <option value="oldest">Эхэнд нэмсэн</option>
                                <option value="expensive">Үнэтэй нь</option>
                                <option value="cheapest">Хямд нь</option>
                            </select>
                            <div className="products-view-toggle">
                                <button className={`btn btn-ghost ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={18} /></button>
                                <button className={`btn btn-ghost ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                            </div>
                        </div>
                    </div>

                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Бараа ачаалж байна...</p>
                    </div>
                ) : (
                    <>

                        {/* Grid / List */}
                        {sorted.length === 0 ? (
                            <div className="empty-state animate-fade-in">
                                <div className="empty-state-icon">📦</div>
                                <h3>{products.length === 0 ? 'Одоогоор бараа үүсгээгүй байна' : 'Бараа олдсонгүй'}</h3>
                                <p>{products.length === 0 ? 'Та "Шинэ бараа" товч дээр дарж анхны бараагаа нэмнэ үү.' : 'Хайлтын нөхцөлөө өөрчилнө үү'}</p>
                                {products.length === 0 && hasPermission('products.create') && (
                                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
                                        <Plus size={18} /> Шинэ бараа нэмэх
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {selectedIds.length > 0 && (
                                    <div className="bulk-selection-bar animate-slide-up">
                                        <div className="bulk-info">
                                            <div
                                                className={`selection-checkbox ${selectedIds.length === sorted.length ? 'checked' : ''}`}
                                                onClick={toggleSelectAll}
                                                style={{ cursor: 'pointer', width: 24, height: 24 }}
                                            >
                                                {selectedIds.length === sorted.length && <Check size={12} />}
                                            </div>
                                            <div className="bulk-count">{selectedIds.length} сонгосон</div>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])} disabled={isBulkUpdating}>Цэвэрлэх</button>
                                        </div>
                                        <div className="bulk-actions">
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkUpdate({ isHidden: false })} title="Идэвхжүүлэх (Харуулах)" disabled={isBulkUpdating}>
                                                <Eye size={16} /> <span className="hide-mobile">Идэвхжүүлэх</span>
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkUpdate({ isHidden: true })} title="Нуух (Идэвхгүй)" disabled={isBulkUpdating}>
                                                <EyeOff size={16} /> <span className="hide-mobile">Нуух</span>
                                            </button>
                                            <div className="bulk-divider" />
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkUpdate({ productType: 'ready' })} title="Бэлэн бараа" disabled={isBulkUpdating}>
                                                <Package size={16} /> <span className="hide-mobile">Бэлэн</span>
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkUpdate({ productType: 'preorder' })} title="Захиалгын бараа" disabled={isBulkUpdating}>
                                                <Clock size={16} /> <span className="hide-mobile">Захиалга</span>
                                            </button>
                                            <div className="bulk-divider" />
                                            {hasPermission('products.delete') && (
                                                <button className="btn btn-secondary btn-sm text-danger" onClick={handleBulkDelete} title="Устгах" disabled={isBulkUpdating}>
                                                    <Trash2 size={16} /> <span className="hide-mobile">Устгах</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className={`${viewMode === 'grid' ? 'products-grid' : 'products-list'} ${selectedIds.length > 0 ? 'selection-mode' : ''}`}>
                                    {sorted.map(p => (
                                        <div
                                            key={p.id}
                                            className={`product-card card-clickable ${(p.stock?.quantity || 0) === 0 ? 'product-out' : ''} ${selectedIds.includes(p.id) ? 'selected' : ''}`}
                                            onClick={() => setEditingProduct(p)}
                                        >
                                            <div className="product-selection-overlay" onClick={(e) => toggleSelect(p.id, e)}>
                                                <div className={`selection-checkbox ${selectedIds.includes(p.id) ? 'checked' : ''}`}>
                                                    {selectedIds.includes(p.id) && <Check size={14} />}
                                                </div>
                                            </div>

                                            <div className="product-card-image-wrapper">
                                                {p.images?.[0] ? (
                                                    <>
                                                        <img src={p.images[0]} alt={p.name} className="product-card-image" />
                                                        {p.images.length > 1 && (
                                                            <div className="product-image-count" title={`${p.images.length} зураг байна`}>
                                                                <ImageIcon size={12} strokeWidth={2.5} />
                                                                {p.images.length}
                                                            </div>
                                                        )}

                                                    </>
                                                ) : (
                                                    <div className="product-card-placeholder">📦</div>
                                                )}
                                            </div>

                                            <div className="product-card-badges">
                                                {flashDealMap.has(p.id) && (
                                                    <span className="badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700 }}>
                                                        <Zap size={10} /> {fmt(flashDealMap.get(p.id)!)}
                                                    </span>
                                                )}
                                                {p.productType === 'preorder' ? (
                                                    <span className="badge badge-info">♾️ Захиалга</span>
                                                ) : (p.stock?.quantity || 0) === 0 ? (
                                                    <span className="badge badge-cancelled">Дууссан</span>
                                                ) : (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) ? (
                                                    <span className="badge badge-preparing">⚠️ {p.stock.quantity} ш</span>
                                                ) : (
                                                    <span className="badge badge-delivered">{p.stock.quantity} ш</span>
                                                )}
                                            </div>

                                            <div className="product-card-actions">
                                                <button
                                                    className={`product-action-btn ${openDropdownId === p.id ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>

                                                {openDropdownId === p.id && (
                                                    <div className="product-card-dropdown" onClick={e => e.stopPropagation()}>
                                                        {business?.slug && (
                                                            <div className="dropdown-action-item" onClick={() => {
                                                                const url = `${window.location.origin}/${business.slug}?product=${p.id}`;
                                                                navigator.clipboard.writeText(url).then(() => toast.success('Линк хуулагдлаа!')).catch(() => toast.error('Хуулж чадсангүй'));
                                                                setOpenDropdownId(null);
                                                            }}>
                                                                <Link2 size={14} /> Линк хуулах
                                                            </div>
                                                        )}
                                                        <div className="dropdown-action-item" onClick={() => {
                                                            setInquiryProduct(p);
                                                            setOpenDropdownId(null);
                                                        }}>
                                                            <MessageSquare size={14} /> Лавлагаа үүсгэх
                                                        </div>
                                                        {hasPermission('products.edit') && (
                                                            <div className="dropdown-action-item" onClick={() => { setEditingProduct(p); setOpenDropdownId(null); }}>
                                                                <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> Засах
                                                            </div>
                                                        )}
                                                        {hasPermission('products.delete') && (
                                                            <div className="dropdown-action-item danger" onClick={() => { handleDelete(p.id); setOpenDropdownId(null); }}>
                                                                <AlertTriangle size={14} /> Устгах
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="product-card-content">
                                                <div className="product-card-name">{p.name}</div>
                                                <div className="product-card-meta">
                                                    <span className="badge badge-soft" style={{ fontSize: '0.65rem' }}>{p.categoryName || 'АНГИЛАЛГҮЙ'}</span>
                                                    <span>•</span>
                                                    <span className="sku-text">{p.sku || '-'}</span>
                                                    {p.isHidden && (
                                                        <>
                                                            <span>•</span>
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <EyeOff size={10} /> НУУЦЛАГДМАЛ
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="product-card-price-section">
                                                    <div className="product-card-prices">
                                                        <div className="product-card-sale-price">{fmt(p.pricing?.salePrice || 0)}</div>
                                                        {p.pricing?.costPrice && (
                                                            <div className="product-card-cost-row">
                                                                <span className="product-card-cost-price">{fmt(p.pricing.costPrice)}</span>
                                                                <span className="product-card-profit">+{Math.round((p.pricing.salePrice - p.pricing.costPrice) / p.pricing.costPrice * 100)}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {hasMore && products.length > 0 && (
                                    <div className="flex justify-center py-6 mt-4">
                                        <button
                                            className="btn btn-secondary"
                                            style={{ minWidth: '200px', margin: '20px auto', display: 'block' }}
                                            onClick={() => setProductsLimit(prev => prev + 50)}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : `Дараагийн 50 бараа (Одоо ${products.length})`}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
                </div>{/* /prd-card */}
            </div>

            {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
            {showFBImport && <FBImportModal onClose={() => setShowFBImport(false)} />}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                />
            )}
            {inquiryProduct && (
                <CreateInquiryModal
                    product={inquiryProduct}
                    onClose={() => setInquiryProduct(null)}
                />
            )}
            {showCargoEstimator && business?.id && (
                <CargoEstimatorModal
                    isOpen={showCargoEstimator}
                    onClose={() => setShowCargoEstimator(false)}
                    products={products}
                    cargoTypes={allCargoTypes}
                    bizId={business.id}
                    geminiApiKey={geminiApiKey}
                />
            )}
        </>
    );
}

function CreateProductModal({ onClose }: { onClose: () => void }) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [productType, setProductType] = useState<'ready' | 'preorder'>('ready');

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryInput, setCategoryInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Tags
    const [tags, setTags] = useState<string[]>([]);
    const [tagsInput, setTagsInput] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);

    // Smart Features States
    const [sku, setSku] = useState('');
    const [costPrice, setCostPrice] = useState<string>('');
    const [salePrice, setSalePrice] = useState<string>('');
    const [margin, setMargin] = useState<string>(localStorage.getItem('liscord_last_margin') || '20');

    // Cargo Features
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
    const [cargoInput, setCargoInput] = useState('');
    const [selectedCargoTypeId, setSelectedCargoTypeId] = useState<string>('');
    const [showCargoDropdown, setShowCargoDropdown] = useState(false);
    const [showCreateCargoType, setShowCreateCargoType] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [cargoValue, setCargoValue] = useState<string>('1');
    const [cargoFee, setCargoFee] = useState<string>(business?.settings?.cargoConfig?.defaultFee?.toString() || '');
    const [isCargoIncluded, setIsCargoIncluded] = useState(business?.settings?.cargoConfig?.isIncludedByDefault || false);

    const [isHidden, setIsHidden] = useState(true);
    const [activeTab, setActiveTab] = useState<'basic' | 'price' | 'variations' | 'advanced'>('basic');
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [description, setDescription] = useState('');
    const [productName, setProductName] = useState('');

    const generateAIDescription = () => {
        if (!productName) {
            toast.error('Эхлээд барааны нэрээ оруулна уу');
            return;
        }
        setIsGeneratingAI(true);
        // Simulate AI call
        setTimeout(() => {
            const mockDescriptions = [
                `${productName} - Танд дээд зэргийн чанар, шинэлэг загварыг санал болгож байна.Өдөр тутамд ашиглахад маш тохиромжтой.`,
                `${productName} бол бидний хамгийн сүүлчийн загвар бөгөөд хэрэглэгчдийн дунд маш их эрэлттэй байгаа бүтээгдэхүүн юм.`,
                `Дээд зэрэглэлийн материал, нарийн хийцтэй ${productName}. Таны хэрэгцээг бүрэн хангана.`
            ];
            setDescription(mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)]);
            setIsGeneratingAI(false);
            toast.success('Тайлбар бэлэн боллоо');
        }, 1500);
    };

    const generateAITags = async () => {
        if (!imageFiles.length && !existingImages.length) {
            toast.error('Эхлээд барааны зураг оруулна уу');
            return;
        }
        setIsGeneratingTags(true);
        try {
            let base64Image = '';
            if (imageFiles.length > 0) {
                const reader = new FileReader();
                reader.readAsDataURL(imageFiles[0]);
                base64Image = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
                });
            }

            const res = await fetch('/api/fb-ai-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrls: existingImages.length > 0 ? [existingImages[0]] : [],
                    imageBase64: base64Image,
                    name: productName,
                    description
                })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            if (data.tags) {
                setTags(prev => [...new Set([...prev, ...data.tags])]);
                toast.success('Түлхүүр үгс нэмэгдлээ ✨');
            }
        } catch(e) {
            toast.error('AI танихад алдаа гарлаа');
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const addVariation = () => {
        const id = Math.random().toString(36).substring(2, 9);
        setVariations([...variations, { id, name: '', sku: `${sku} -${variations.length + 1} `, quantity: 0 }]);
    };

    const removeVariation = (id: string) => {
        setVariations(variations.filter(v => v.id !== id));
    };

    const updateVariation = (id: string, updates: Partial<ProductVariation>) => {
        setVariations(variations.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    useEffect(() => {
        if (!business?.id) return;
        const u1 = categoryService.subscribeCategories(business.id, setCategories);
        const u2 = cargoService.subscribeCargoTypes(business.id, setCargoTypes);
        return () => { u1(); u2(); };
    }, [business?.id]);

    const handleCargoTypeChange = (id: string, name: string) => {
        setSelectedCargoTypeId(id);
        setCargoInput(name);
        const selected = cargoTypes.find(t => t.id === id);
        if (selected) {
            const val = Number(cargoValue) || 1;
            setCargoFee(Math.round(selected.fee * val).toString());
        }
        setShowCargoDropdown(false);
    };

    const handleCargoValueChange = (val: string) => {
        setCargoValue(val);
        const selected = cargoTypes.find(t => t.id === selectedCargoTypeId);
        if (selected) {
            const numVal = Number(val) || 0;
            setCargoFee(Math.round(selected.fee * numVal).toString());
        }
    };

    useEffect(() => {
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        setSku(`LSC - ${rand()} -${rand()} `);
    }, []);

    const calculateSaleFromCost = (cost: number, m: number) => {
        if (!cost) return '';
        return Math.round(cost * (1 + m / 100)).toString();
    };

    const calculateCostFromSale = (sale: number, m: number) => {
        if (!sale) return '';
        return Math.round(sale / (1 + m / 100)).toString();
    };

    const handleCostChange = (val: string) => {
        setCostPrice(val);
        const costNum = Number(val);
        const marginNum = Number(margin);
        if (!isNaN(costNum) && !isNaN(marginNum)) {
            setSalePrice(calculateSaleFromCost(costNum, marginNum));
        }
    };

    const handleSaleChange = (val: string) => {
        setSalePrice(val);
        const saleNum = Number(val);
        const marginNum = Number(margin);
        if (!isNaN(saleNum) && !isNaN(marginNum)) {
            setCostPrice(calculateCostFromSale(saleNum, marginNum));
        }
    };

    const handleMarginChange = (val: string) => {
        setMargin(val);
        localStorage.setItem('liscord_last_margin', val);
        const costNum = Number(costPrice);
        const marginNum = Number(val);
        if (!isNaN(costNum) && !isNaN(marginNum)) {
            setSalePrice(calculateSaleFromCost(costNum, marginNum));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business || !user) return;

        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const description = fd.get('description') as string;
        const finalSalePrice = Number(salePrice);
        const finalCostPrice = Number(costPrice);
        const stockQty = productType === 'preorder' ? 999999 : Number(fd.get('stock'));

        if (!name || isNaN(finalSalePrice)) {
            toast.error('Мэдээллээ бүрэн оруулна уу');
            return;
        }

        setLoading(true);
        try {
            let imageUrls = [...existingImages];
            if (imageFiles.length > 0) {
                const uploadedUrls = await storage.uploadProductImages(business.id, imageFiles);
                imageUrls = [...imageUrls, ...uploadedUrls];
            }

            let categoryId = selectedCategory?.id || 'general';
            let categoryName = selectedCategory?.name || categoryInput || 'Бусад';

            if (!selectedCategory && categoryInput) {
                const existing = categories.find(c => c.name.toLowerCase() === categoryInput.toLowerCase());
                if (existing) {
                    categoryId = existing.id;
                    categoryName = existing.name;
                } else {
                    categoryId = await categoryService.createCategory(business.id, {
                        name: categoryInput,
                        description: ''
                    });
                }
            }

            let finalCargoTypeId = selectedCargoTypeId;
            if (productType === 'preorder' && !selectedCargoTypeId && cargoInput) {
                const existing = cargoTypes.find(c => c.name.toLowerCase() === cargoInput.toLowerCase());
                if (existing) {
                    finalCargoTypeId = existing.id;
                } else {
                    finalCargoTypeId = await cargoService.createCargoType(business.id, {
                        name: cargoInput,
                        fee: Number(cargoFee) || 0,
                    });
                }
            }

            await productService.createProduct(business.id, {
                name,
                categoryId,
                categoryName,
                sku: sku || '',
                barcode: '',
                description: description || '',
                images: imageUrls,
                pricing: {
                    salePrice: finalSalePrice,
                    costPrice: finalCostPrice,
                    wholesalePrice: finalSalePrice
                },
                productType,
                stock: {
                    quantity: variations.length > 0 ? variations.reduce((s, v) => s + v.quantity, 0) : stockQty,
                    lowStockThreshold: 3,
                    trackInventory: productType === 'ready'
                },
                tags,
                variations: variations.length > 0 ? variations : [],
                ...(productType === 'preorder' ? {
                    cargoFee: {
                        amount: Number(cargoFee) || 0,
                        isIncluded: isCargoIncluded,
                        ...(finalCargoTypeId ? { cargoTypeId: finalCargoTypeId } : {}),
                        cargoValue: Number(cargoValue) || 1
                    }
                } : {}),
                unitType: 'ш',
                isActive: true,
                isHidden,
                stats: { totalSold: 0, totalRevenue: 0 },
                isDeleted: false
            });
            onClose();
            toast.success('Бараа амжилттай нэмэгдлээ');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const filteredCats = categories.filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()));
    const filteredCargo = cargoTypes.filter(c => c.name.toLowerCase().includes(cargoInput.toLowerCase()));

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Шинэ бараа</h2>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button type="button" className={`tab-item ${activeTab === 'basic' ? 'active' : ''} `} onClick={() => setActiveTab('basic')}>
                        <Bot size={18} /> Үндсэн
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'price' ? 'active' : ''} `} onClick={() => setActiveTab('price')}>
                        <Target size={18} /> Үнэ & Нөөц
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'variations' ? 'active' : ''} `} onClick={() => setActiveTab('variations')}>
                        <Grid3X3 size={18} /> Хувилбарууд {variations.length > 0 && <span className="tab-badge">{variations.length}</span>}
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'advanced' ? 'active' : ''} `} onClick={() => setActiveTab('advanced')}>
                        <ShieldCheck size={18} /> Бусад
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400 }}>

                        {activeTab === 'basic' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="modal-section-card">
                                    <div className="modal-section-title">Ерөнхий мэдээлэл</div>
                                    <div className="input-group">
                                        <label className="input-label">Барааны нэр <span className="required">*</span></label>
                                        <input
                                            className="input"
                                            name="name"
                                            placeholder="iPhone 15 Pro"
                                            value={productName}
                                            onChange={e => setProductName(e.target.value)}
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <ImageUpload
                                        images={existingImages}
                                        onImagesChange={setExistingImages}
                                        onFilesChange={setImageFiles}
                                    />
                                </div>

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Дэлгэрэнгүй</div>
                                    <div className="input-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <label className="input-label" style={{ marginBottom: 0 }}>Тайлбар / Танилцуулга</label>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost gradient-btn-alt"
                                                onClick={generateAIDescription}
                                                disabled={isGeneratingAI}
                                                style={{ color: 'var(--primary)', fontWeight: 800, gap: 8, padding: '4px 12px', borderRadius: 8, background: 'rgba(var(--primary-rgb), 0.05)' }}
                                            >
                                                {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> AI бичүүлэх</>}
                                            </button>
                                        </div>
                                        <textarea
                                            className="input"
                                            name="description"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Барааны дэлгэрэнгүй мэдээлэл, хэмжээ, материал г.м"
                                            style={{ minHeight: 140, padding: '14px', resize: 'vertical', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="input-group" style={{ position: 'relative' }}>
                                            <label className="input-label">Ангилал</label>
                                            <div className="input-with" onClick={() => setShowCategoryDropdown(true)}>
                                                <input
                                                    className="input"
                                                    placeholder="Ангилал сонгох..."
                                                    value={categoryInput}
                                                    onChange={e => {
                                                        setCategoryInput(e.target.value);
                                                        setSelectedCategory(null);
                                                        setShowCategoryDropdown(true);
                                                    }}
                                                    onFocus={() => setShowCategoryDropdown(true)}
                                                />
                                            </div>
                                            {showCategoryDropdown && (categoryInput || categories.length > 0) && (
                                                <>
                                                    <div className="dropdown-backdrop" onClick={() => setShowCategoryDropdown(false)} />
                                                    <div className="dropdown-menu show shadow-xl" style={{
                                                        width: '100%', top: '100%', left: 0, marginTop: 8,
                                                        maxHeight: 280, overflowY: 'auto', borderRadius: 14,
                                                        border: '1px solid var(--border-secondary)', padding: '6px',
                                                        zIndex: 100, background: 'var(--surface-1)', backdropFilter: 'blur(10px)'
                                                    }}>
                                                        {filteredCats.map(c => (
                                                            <div key={c.id} className="dropdown-item" style={{ borderRadius: 10, padding: '10px 12px', fontWeight: 600 }} onClick={() => {
                                                                setSelectedCategory(c);
                                                                setCategoryInput(c.name);
                                                                setShowCategoryDropdown(false);
                                                            }}>
                                                                {c.name}
                                                            </div>
                                                        ))}
                                                        {categoryInput && !categories.some(c => c.name.toLowerCase() === categoryInput.toLowerCase()) && (
                                                            <div className="dropdown-item" style={{ color: 'var(--primary)', fontWeight: 800, borderRadius: 10, padding: '10px 12px' }} onClick={() => setShowCategoryDropdown(false)}>
                                                                <Plus size={16} /> Шинээр: "{categoryInput}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">SKU</label>
                                            <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="Автоматаар..." />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginTop: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <label className="input-label" style={{ marginBottom: 0 }}>Түлхүүр үгс (Tags)</label>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-ghost gradient-btn-alt"
                                                onClick={generateAITags}
                                                disabled={isGeneratingTags}
                                                style={{ color: 'var(--primary)', fontWeight: 800, gap: 8, padding: '4px 12px', borderRadius: 8, background: 'rgba(var(--primary-rgb), 0.05)' }}
                                            >
                                                {isGeneratingTags ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> ✨ AI Auto Tag</>}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                            {tags.map((tag, i) => (
                                                <span key={i} className="badge badge-soft" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6 }}>
                                                    {tag}
                                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            className="input"
                                            value={tagsInput}
                                            onChange={e => setTagsInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    if (tagsInput.trim()) {
                                                        const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                                        setTags(prev => [...new Set([...prev, ...newTags])]);
                                                        setTagsInput('');
                                                    }
                                                }
                                            }}
                                            placeholder="Жишээ нь: цүнх, арьсан, жижиг (Enter дарж нэмнэ)"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'price' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="modal-section-card">
                                    <div className="modal-section-title">Үнэ тогтоох</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="input-group">
                                            <label className="input-label">Өртөг (₮)</label>
                                            <input className="input" type="number" value={costPrice} onChange={e => handleCostChange(e.target.value)} placeholder="0" />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Ашиг (%)</label>
                                            <input className="input" type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="price-preview-card">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Зарах үнэ</div>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: -1 }}>{fmt(Number(salePrice) || 0)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Бодит ашиг</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                                                +{fmt((Number(salePrice) || 0) - (Number(costPrice) || 0))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                        <input className="input" type="number" value={salePrice} onChange={e => handleSaleChange(e.target.value)} required style={{ fontSize: '1.1rem', fontWeight: 700 }} />
                                    </div>
                                </div>

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Барааны нөөц</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="input-group">
                                            <label className="input-label">Төрөл</label>
                                            <select className="input select" value={productType} onChange={e => setProductType(e.target.value as 'ready' | 'preorder')}>
                                                <option value="ready">Бэлэн байгаа</option>
                                                <option value="preorder">Захиалгаар</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{productType === 'ready' ? 'Үлдэгдэл' : 'Захиалга'}</label>
                                            <input className="input" name="stock" type="number" disabled={productType === 'preorder' || variations.length > 0} placeholder={productType === 'preorder' ? '∞' : variations.length > 0 ? 'Хувилбараас..' : '0'} />
                                            {variations.length > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>Хувилбаруудын нийлбэрээр бодогдоно</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'variations' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="modal-section-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>Барааны хувилбар</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Өнгө, хэмжээ зэрэг олон төрөл нэмэх</div>
                                        </div>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={addVariation}>
                                            <Plus size={14} /> Хувилбар нэмэх
                                        </button>
                                    </div>

                                    {variations.length === 0 ? (
                                        <div style={{ padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Хувилбар нэмээгүй байна
                                        </div>
                                    ) : (
                                        <div className="variations-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {variations.map((v) => (
                                                <div key={v.id} className="variation-item" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 44px', gap: 12, alignItems: 'center', background: 'var(--bg-soft)', padding: 12, borderRadius: 14 }}>
                                                    <input
                                                        className="input input-sm"
                                                        placeholder="Улаан / XL"
                                                        value={v.name}
                                                        onChange={e => updateVariation(v.id, { name: e.target.value })}
                                                    />
                                                    <input
                                                        className="input input-sm"
                                                        placeholder="SKU"
                                                        value={v.sku}
                                                        onChange={e => updateVariation(v.id, { sku: e.target.value })}
                                                    />
                                                    <input
                                                        className="input input-sm"
                                                        type="number"
                                                        placeholder="Тоо"
                                                        value={v.quantity}
                                                        onChange={e => updateVariation(v.id, { quantity: Number(e.target.value) })}
                                                    />
                                                    <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeVariation(v.id)}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {productType === 'preorder' && (
                                    <div className="modal-section-card">
                                        <div className="modal-section-title">Карго тохиргоо</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 12 }}>
                                                <div className="input-with" style={{ position: 'relative' }}>
                                                    <label className="input-label">Каргоны төрөл</label>
                                                    <div onClick={() => setShowCargoDropdown(true)}>
                                                        <input
                                                            className="input"
                                                            placeholder="Жин/хэмжээ"
                                                            value={cargoInput}
                                                            onChange={e => {
                                                                setCargoInput(e.target.value);
                                                                setSelectedCargoTypeId('');
                                                                setShowCargoDropdown(true);
                                                            }}
                                                            onFocus={() => setShowCargoDropdown(true)}
                                                        />
                                                    </div>
                                                    {showCargoDropdown && (cargoInput || cargoTypes.length > 0) && (
                                                        <>
                                                            <div className="dropdown-backdrop" onClick={() => setShowCargoDropdown(false)} />
                                                            <div className="dropdown-menu show shadow-xl" style={{
                                                                width: '100%', top: '100%', left: 0, marginTop: 4,
                                                                maxHeight: 240, overflowY: 'auto', borderRadius: 12,
                                                                border: '1px solid var(--border-color)', padding: '6px',
                                                                zIndex: 100, background: 'var(--bg-main)'
                                                            }}>
                                                                {filteredCargo.map(c => (
                                                                    <div key={c.id} className="dropdown-item" onClick={() => handleCargoTypeChange(c.id, c.name)}>
                                                                        {c.name} ({fmt(c.fee)}/нэгж)
                                                                    </div>
                                                                ))}
                                                                {cargoInput && !cargoTypes.some(c => c.name.toLowerCase() === cargoInput.toLowerCase()) && (
                                                                    <div className="dropdown-item" style={{ color: 'var(--primary)', fontWeight: 800, borderRadius: 10, padding: '10px 12px' }} onClick={() => {
                                                                        setShowCargoDropdown(false);
                                                                        setShowCreateCargoType(true);
                                                                    }}>
                                                                        <Plus size={16} /> Шинээр үүсгэх: "{cargoInput}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Тоо/Жин</label>
                                                    <input className="input" type="number" value={cargoValue} onChange={e => handleCargoValueChange(e.target.value)} placeholder="1" />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Төлбөр (₮)</label>
                                                    <input className="input" type="number" value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="premium-toggle">
                                                <div
                                                    className={`toggle-item ${!isCargoIncluded ? 'active' : ''} `}
                                                    onClick={() => setIsCargoIncluded(false)}
                                                >
                                                    Тусдаа бодогдоно
                                                </div>
                                                <div
                                                    className={`toggle-item ${isCargoIncluded ? 'active' : ''} `}
                                                    onClick={() => setIsCargoIncluded(true)}
                                                >
                                                    Үнэд багтсан
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Харагдах байдал</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-soft)', padding: '16px', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Веб дэлгүүрт харуулах?</div>
                                            <div style={{ fontSize: '0.8rem', color: isHidden ? 'var(--text-muted)' : 'var(--primary)', fontWeight: isHidden ? 500 : 700 }}>
                                                {isHidden ? 'Одоогоор хэрэглэгчдэд харагдахгүй (Hide)' : 'Хэрэглэгчдэд нээлттэй харагдаж байна (Public)'}
                                            </div>
                                        </div>
                                        <div
                                            className={`products-mini-toggle ${!isHidden ? 'active' : ''}`}
                                            onClick={() => setIsHidden(!isHidden)}
                                        >
                                            <div className="toggle" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Үүсгэх</>}
                        </button>
                    </div>
                </form>
            </div>
            {showCreateCargoType && (
                <CreateCargoTypeModal
                    initialName={cargoInput}
                    onClose={() => setShowCreateCargoType(false)}
                    onSuccess={(id, name, fee) => {
                        setSelectedCargoTypeId(id);
                        setCargoInput(name);
                        setCargoFee(fee.toString());
                        setShowCreateCargoType(false);
                    }}
                />
            )}
        </div>,
        document.body
    );
}

function EditProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [productType, setProductType] = useState(product.productType);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryInput, setCategoryInput] = useState(product.categoryName || '');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Tags
    const [tags, setTags] = useState<string[]>(product.tags || []);
    const [tagsInput, setTagsInput] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);

    // Prices
    const [sku, setSku] = useState(product.sku || '');
    const [costPrice, setCostPrice] = useState<string>(product.pricing.costPrice?.toString() || '');
    const [salePrice, setSalePrice] = useState<string>(product.pricing.salePrice.toString());
    const [margin, setMargin] = useState<string>('20'); // Should calc from current

    // Images
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>(product.images || []);

    // Cargo
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
    const [cargoInput, setCargoInput] = useState('');
    const [selectedCargoTypeId, setSelectedCargoTypeId] = useState<string>(product.cargoFee?.cargoTypeId || '');
    const [showCargoDropdown, setShowCargoDropdown] = useState(false);
    const [showCreateCargoType, setShowCreateCargoType] = useState(false);
    const [cargoValue, setCargoValue] = useState<string>(product.cargoFee?.cargoValue?.toString() || '1');
    const [cargoFee, setCargoFee] = useState<string>(product.cargoFee?.amount?.toString() || '');
    const [isCargoIncluded, setIsCargoIncluded] = useState(product.cargoFee?.isIncluded || false);

    // Visibility
    const [isHidden, setIsHidden] = useState(product.isHidden || false);

    const [activeTab, setActiveTab] = useState<'basic' | 'price' | 'variations' | 'advanced' | 'inquiries'>('basic');
    const [inquiries, setInquiries] = useState<StockInquiry[]>([]);
    const [variations, setVariations] = useState<ProductVariation[]>(product.variations || []);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [description, setDescription] = useState(product.description || '');
    const [productName, setProductName] = useState(product.name || '');

    useEffect(() => {
        if (activeTab !== 'inquiries' || !product.id || !business?.id) return;
        setLoading(true);
        const q = query(collection(db, `businesses/${business.id}/stockInquiries`), where('productId', '==', product.id));
        const unsub = onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as StockInquiry));
            data.sort((a,b) => ((b.createdAt as any)?.seconds || 0) - ((a.createdAt as any)?.seconds || 0));
            setInquiries(data);
            setLoading(false);
        });
        return () => unsub();
    }, [activeTab, product.id, business?.id]);

    useEffect(() => {
        if (!business?.id) return;
        const u1 = categoryService.subscribeCategories(business.id, setCategories);
        const u2 = cargoService.subscribeCargoTypes(business.id, setCargoTypes);

        // Find current category
        if (product.categoryId) {
            categoryService.subscribeCategories(business.id, (cats) => {
                const found = cats.find(c => c.id === product.categoryId);
                if (found) setSelectedCategory(found);
            });
        }

        // Find current cargo
        if (product.cargoFee?.cargoTypeId) {
            cargoService.subscribeCargoTypes(business.id, (types) => {
                const found = types.find(t => t.id === product.cargoFee?.cargoTypeId);
                if (found) setCargoInput(found.name);
            });
        }

        // Set margin
        if (product.pricing.costPrice && product.pricing.salePrice) {
            const m = Math.round((product.pricing.salePrice - product.pricing.costPrice) / product.pricing.costPrice * 100);
            setMargin(m.toString());
        }

        return () => { u1(); u2(); };
    }, [business?.id, product]);

    const handleCargoTypeChange = (id: string, name: string) => {
        setSelectedCargoTypeId(id);
        setCargoInput(name);
        const selected = cargoTypes.find(t => t.id === id);
        if (selected) {
            const val = Number(cargoValue) || 1;
            setCargoFee(Math.round(selected.fee * val).toString());
        }
        setShowCargoDropdown(false);
    };

    const handleCargoValueChange = (val: string) => {
        setCargoValue(val);
        const selected = cargoTypes.find(t => t.id === selectedCargoTypeId);
        if (selected) {
            const numVal = Number(val) || 0;
            setCargoFee(Math.round(selected.fee * numVal).toString());
        }
    };

    const handleCostChange = (val: string) => {
        setCostPrice(val);
        const c = Number(val) || 0;
        const m = Number(margin) || 0;
        if (m > 0) setSalePrice(Math.round(c * (1 + m / 100)).toString());
    };

    const handleMarginChange = (val: string) => {
        setMargin(val);
        const c = Number(costPrice) || 0;
        const m = Number(val) || 0;
        setSalePrice(Math.round(c * (1 + m / 100)).toString());
    };

    const handleSaleChange = (val: string) => {
        setSalePrice(val);
        const s = Number(val) || 0;
        const c = Number(costPrice) || 0;
        if (c > 0) setMargin(Math.round(((s - c) / c) * 100).toString());
    };

    const generateAIDescription = () => {
        if (!productName) return;
        setIsGeneratingAI(true);
        setTimeout(() => {
            setDescription(`${productName} - Амжилтыг тань тодотгох шилдэг сонголт.Чанар ба үнэ цэнийг эрхэмлэгч танд зориулав.`);
            setIsGeneratingAI(false);
            toast.success('Тайлбар бэлэн боллоо');
        }, 1200);
    };

    const generateAITags = async () => {
        if (!imageFiles.length && !existingImages.length) {
            toast.error('Эхлээд барааны зураг оруулна уу');
            return;
        }
        setIsGeneratingTags(true);
        try {
            let base64Image = '';
            if (imageFiles.length > 0) {
                const reader = new FileReader();
                reader.readAsDataURL(imageFiles[0]);
                base64Image = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
                });
            }

            const res = await fetch('/api/fb-ai-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrls: existingImages.length > 0 ? [existingImages[0]] : [],
                    imageBase64: base64Image,
                    name: productName,
                    description
                })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            if (data.tags) {
                setTags(prev => [...new Set([...prev, ...data.tags])]);
                toast.success('Түлхүүр үгс нэмэгдлээ ✨');
            }
        } catch(e) {
            toast.error('AI танихад алдаа гарлаа');
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const addVariation = () => {
        const id = Math.random().toString(36).substring(2, 9);
        setVariations([...variations, { id, name: '', sku: `${sku} -${variations.length + 1} `, quantity: 0 }]);
    };

    const removeVariation = (id: string) => {
        setVariations(variations.filter(v => v.id !== id));
    };

    const updateVariation = (id: string, updates: Partial<ProductVariation>) => {
        setVariations(variations.map(v => v.id === id ? { ...v, ...updates } : v));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;

        setLoading(true);
        try {
            let imageUrls = [...existingImages];
            if (imageFiles.length > 0) {
                const uploadedUrls = await storage.uploadProductImages(business.id, imageFiles);
                imageUrls = [...imageUrls, ...uploadedUrls];
            }

            const categoryId = selectedCategory?.id || product.categoryId || 'general';
            const categoryName = selectedCategory?.name || categoryInput || 'Бусад';

            let finalCargoTypeId = selectedCargoTypeId;
            if (productType === 'preorder' && !selectedCargoTypeId && cargoInput) {
                const existing = cargoTypes.find(c => c.name.toLowerCase() === cargoInput.toLowerCase());
                if (existing) {
                    finalCargoTypeId = existing.id;
                } else {
                    finalCargoTypeId = await cargoService.createCargoType(business.id, {
                        name: cargoInput,
                        fee: Number(cargoFee) || 0,
                    });
                }
            }

            await productService.updateProduct(business.id, product.id, {
                name: productName,
                categoryId,
                categoryName,
                sku: sku || '',
                description: description || '',
                images: imageUrls,
                pricing: {
                    salePrice: Number(salePrice),
                    costPrice: Number(costPrice),
                    wholesalePrice: Number(salePrice)
                },
                productType,
                stock: {
                    quantity: variations.length > 0 ? variations.reduce((s, v) => s + v.quantity, 0) : Number((e.currentTarget.elements.namedItem('stock') as HTMLInputElement)?.value || 0),
                    lowStockThreshold: 3,
                    trackInventory: productType === 'ready'
                },
                tags,
                variations: variations.length > 0 ? variations : [],
                ...(productType === 'preorder' ? {
                    cargoFee: {
                        amount: Number(cargoFee) || 0,
                        isIncluded: isCargoIncluded,
                        ...(finalCargoTypeId ? { cargoTypeId: finalCargoTypeId } : {}),
                        cargoValue: Number(cargoValue) || 1
                    }
                } : {}),
                updatedAt: new Date(),
                isHidden
            });

            toast.success('Амжилттай шинэчлэгдлээ');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Шинэчлэхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const filteredCats = categories.filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()));
    const filteredCargo = cargoTypes.filter(c => c.name.toLowerCase().includes(cargoInput.toLowerCase()));

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal premium-product-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Бараа засах</h2>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button type="button" className={`tab-item ${activeTab === 'basic' ? 'active' : ''} `} onClick={() => setActiveTab('basic')}>
                        <Bot size={18} /> Үндсэн
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'price' ? 'active' : ''} `} onClick={() => setActiveTab('price')}>
                        <Target size={18} /> Үнэ & Нөөц
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'variations' ? 'active' : ''} `} onClick={() => setActiveTab('variations')}>
                        <ShieldCheck size={18} /> Хувилбарууд {variations.length > 0 && <span className="tab-badge">{variations.length}</span>}
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'advanced' ? 'active' : ''} `} onClick={() => setActiveTab('advanced')}>
                        <Sparkles size={18} /> Бусад
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'inquiries' ? 'active' : ''} `} onClick={() => setActiveTab('inquiries')}>
                        <MessageSquare size={18} /> Лавлагаа
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {activeTab === 'basic' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="modal-section-card">
                                    <div className="modal-section-title">Ерөнхий мэдээлэл</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className="input-group">
                                            <label className="input-label">Барааны нэр <span className="required">*</span></label>
                                            <input
                                                className="input"
                                                name="name"
                                                value={productName}
                                                onChange={e => setProductName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <ImageUpload
                                            images={existingImages}
                                            onImagesChange={setExistingImages}
                                            onFilesChange={setImageFiles}
                                        />
                                    </div>
                                </div>

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Тайлбар & Ангилал</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <label className="input-label" style={{ marginBottom: 0 }}>Дэлгэрэнгүй тайлбар</label>
                                                <button
                                                    type="button"
                                                    className="gradient-btn-alt"
                                                    onClick={generateAIDescription}
                                                    disabled={isGeneratingAI}
                                                >
                                                    {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                    <span>AI Тайлбар</span>
                                                </button>
                                            </div>
                                            <textarea
                                                className="input h-32"
                                                name="description"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Барааны дэлгэрэнгүй мэдээлэл..."
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div className="input-with" style={{ position: 'relative' }}>
                                                <label className="input-label">Ангилал</label>
                                                <div onClick={() => setShowCategoryDropdown(true)}>
                                                    <input
                                                        className="input"
                                                        placeholder="Ангилал сонгох..."
                                                        value={categoryInput}
                                                        onChange={e => {
                                                            setCategoryInput(e.target.value);
                                                            setSelectedCategory(null);
                                                            setShowCategoryDropdown(true);
                                                        }}
                                                        onFocus={() => setShowCategoryDropdown(true)}
                                                    />
                                                </div>
                                                {showCategoryDropdown && (categoryInput || categories.length > 0) && (
                                                    <>
                                                        <div className="dropdown-backdrop" onClick={() => setShowCategoryDropdown(false)} />
                                                        <div className="dropdown-menu show shadow-xl" style={{
                                                            width: '100%', top: '100%', left: 0, marginTop: 4,
                                                            maxHeight: 240, overflowY: 'auto', borderRadius: 12,
                                                            border: '1px solid var(--border-color)', padding: '6px',
                                                            zIndex: 100, background: 'var(--bg-main)'
                                                        }}>
                                                            {filteredCats.map(c => (
                                                                <div key={c.id} className="dropdown-item" onClick={() => {
                                                                    setSelectedCategory(c);
                                                                    setCategoryInput(c.name);
                                                                    setShowCategoryDropdown(false);
                                                                }}>
                                                                    {c.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">SKU (Код)</label>
                                                <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="Жишээ: B-001" />
                                            </div>
                                        </div>

                                        <div className="input-group" style={{ marginTop: 4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <label className="input-label" style={{ marginBottom: 0 }}>Түлхүүр үгс (Tags)</label>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-ghost gradient-btn-alt"
                                                    onClick={generateAITags}
                                                    disabled={isGeneratingTags}
                                                    style={{ color: 'var(--primary)', fontWeight: 800, gap: 8, padding: '4px 12px', borderRadius: 8, background: 'rgba(var(--primary-rgb), 0.05)' }}
                                                >
                                                    {isGeneratingTags ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> ✨ AI Auto Tag</>}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                                {tags.map((tag, i) => (
                                                    <span key={i} className="badge badge-soft" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6 }}>
                                                        {tag}
                                                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                className="input"
                                                value={tagsInput}
                                                onChange={e => setTagsInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' || e.key === ',') {
                                                        e.preventDefault();
                                                        if (tagsInput.trim()) {
                                                            const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                                            setTags(prev => [...new Set([...prev, ...newTags])]);
                                                            setTagsInput('');
                                                        }
                                                    }
                                                }}
                                                placeholder="Жишээ нь: цүнх, арьсан, жижиг (Enter дарж нэмнэ)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'price' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="modal-section-card">
                                    <div className="modal-section-title">Үнэ тохиргоо</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        <div className="input-group">
                                            <label className="input-label">Өртөг (₮)</label>
                                            <input className="input" type="number" value={costPrice} onChange={e => handleCostChange(e.target.value)} placeholder="0" />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Ашиг (%)</label>
                                            <input className="input" type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} placeholder="20" />
                                        </div>
                                    </div>

                                    <div className="price-preview-card">
                                        <div className="preview-item">
                                            <div className="preview-label">Зарах үнэ</div>
                                            <div className="preview-value">{fmt(Number(salePrice) || 0)}</div>
                                        </div>
                                        <div className="preview-divider" />
                                        <div className="preview-item align-right">
                                            <div className="preview-label">Цэвэр ашиг</div>
                                            <div className="preview-value highlight">
                                                +{fmt((Number(salePrice) || 0) - (Number(costPrice) || 0))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginTop: 20 }}>
                                        <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                        <input className="input primary" type="number" value={salePrice} onChange={e => handleSaleChange(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Төрөл & Нөөц</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="input-group">
                                            <label className="input-label">Барааны төрөл</label>
                                            <select className="input select" value={productType} onChange={e => setProductType(e.target.value as 'ready' | 'preorder')}>
                                                <option value="ready">Бэлэн байгаа (Ready)</option>
                                                <option value="preorder">Захиалгаар (Pre-order)</option>
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">{productType === 'ready' ? 'Боломжит тоо' : 'Захиалга авах'}</label>
                                            <input
                                                className="input"
                                                name="stock"
                                                type="number"
                                                defaultValue={product.stock?.quantity}
                                                disabled={productType === 'preorder' || variations.length > 0}
                                                placeholder={productType === 'preorder' ? '∞' : '0'}
                                            />
                                        </div>
                                    </div>
                                    {variations.length > 0 && (
                                        <div className="info-msg" style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 4 }}>
                                            <CheckCircle2 size={12} /> Тоо хэмжээ хувилбаруудын нийлбэрээр бодогдоно
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'variations' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>Барааны хувилбар</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Өнгө, хэмжээ зэрэг олон төрөл нэмэх</div>
                                    </div>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={addVariation}>
                                        <Plus size={14} /> Хувилбар нэмэх
                                    </button>
                                </div>

                                {variations.length === 0 ? (
                                    <div style={{ padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Хувилбар нэмээгүй байна
                                    </div>
                                ) : (
                                    <div className="variations-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {variations.map((v) => (
                                            <div key={v.id} className="variation-item" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 40px', gap: 10, alignItems: 'center', background: 'var(--bg-soft)', padding: 10, borderRadius: 12 }}>
                                                <input
                                                    className="input input-sm"
                                                    placeholder="Улаан / XL"
                                                    value={v.name}
                                                    onChange={e => updateVariation(v.id, { name: e.target.value })}
                                                />
                                                <input
                                                    className="input input-sm"
                                                    placeholder="SKU"
                                                    value={v.sku}
                                                    onChange={e => updateVariation(v.id, { sku: e.target.value })}
                                                />
                                                <input
                                                    className="input input-sm"
                                                    type="number"
                                                    placeholder="Тоо"
                                                    value={v.quantity}
                                                    onChange={e => updateVariation(v.id, { quantity: Number(e.target.value) })}
                                                />
                                                <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => removeVariation(v.id)}>
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {productType === 'preorder' && (
                                    <div className="modal-section-card">
                                        <div className="modal-section-title">Карго тохиргоо</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 12 }}>
                                                <div className="input-with" style={{ position: 'relative' }}>
                                                    <label className="input-label">Каргоны төрөл</label>
                                                    <div onClick={() => setShowCargoDropdown(true)}>
                                                        <input
                                                            className="input"
                                                            placeholder="Жин/хэмжээ"
                                                            value={cargoInput}
                                                            onChange={e => {
                                                                setCargoInput(e.target.value);
                                                                setSelectedCargoTypeId('');
                                                                setShowCargoDropdown(true);
                                                            }}
                                                            onFocus={() => setShowCargoDropdown(true)}
                                                        />
                                                    </div>
                                                    {showCargoDropdown && (cargoInput || cargoTypes.length > 0) && (
                                                        <>
                                                            <div className="dropdown-backdrop" onClick={() => setShowCargoDropdown(false)} />
                                                            <div className="dropdown-menu show shadow-xl" style={{
                                                                width: '100%', top: '100%', left: 0, marginTop: 4,
                                                                maxHeight: 240, overflowY: 'auto', borderRadius: 12,
                                                                border: '1px solid var(--border-color)', padding: '6px',
                                                                zIndex: 100, background: 'var(--bg-main)'
                                                            }}>
                                                                {filteredCargo.map(c => (
                                                                    <div key={c.id} className="dropdown-item" onClick={() => handleCargoTypeChange(c.id, c.name)}>
                                                                        {c.name} ({fmt(c.fee)}/нэгж)
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Тоо/Жин</label>
                                                    <input className="input" type="number" value={cargoValue} onChange={e => handleCargoValueChange(e.target.value)} placeholder="1" />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Төлбөр (₮)</label>
                                                    <input className="input" type="number" value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="premium-toggle">
                                                <div
                                                    className={`toggle-item ${!isCargoIncluded ? 'active' : ''} `}
                                                    onClick={() => setIsCargoIncluded(false)}
                                                >
                                                    Тусдаа бодогдоно
                                                </div>
                                                <div
                                                    className={`toggle-item ${isCargoIncluded ? 'active' : ''} `}
                                                    onClick={() => setIsCargoIncluded(true)}
                                                >
                                                    Үнэд багтсан
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="modal-section-card">
                                    <div className="modal-section-title">Харагдах байдал</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-soft)', padding: '16px', borderRadius: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Веб дэлгүүрт харуулах?</div>
                                            <div style={{ fontSize: '0.8rem', color: isHidden ? 'var(--text-muted)' : 'var(--primary)', fontWeight: isHidden ? 500 : 700 }}>
                                                {isHidden ? 'Одоогоор хэрэглэгчдэд харагдахгүй (Hide)' : 'Хэрэглэгчдэд нээлттэй харагдаж байна (Public)'}
                                            </div>
                                        </div>
                                        <div
                                            className={`products-mini-toggle ${!isHidden ? 'active' : ''}`}
                                            onClick={() => setIsHidden(!isHidden)}
                                        >
                                            <div className="toggle" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inquiries' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className="modal-section-card">
                                    <div className="modal-section-title">Лавлагааны түүх</div>
                                    {inquiries.length === 0 ? (
                                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: 16 }} />
                                            <div>Одоогоор энэ бараан дээр лавлагаа гараагүй байна</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {inquiries.map(inq => (
                                                <div key={inq.id} style={{ 
                                                    padding: 16, border: '1px solid var(--border)', borderRadius: 12, 
                                                    background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: 8 
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                            {inq.source === 'operator' ? `Оператор: ${inq.operatorName || 'Тодорхойгүй'}` : `Харилцагч: ${inq.customerPhone}`}
                                                        </div>
                                                        <span style={{ 
                                                            fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                                                            background: (inq.status === 'updated' || inq.status === 'no_change') ? 'rgba(34,197,94,0.1)' : inq.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(100,100,100,0.1)',
                                                            color: (inq.status === 'updated' || inq.status === 'no_change') ? '#22c55e' : inq.status === 'pending' ? '#eab308' : '#666'
                                                        }}>
                                                            {(inq.status === 'updated' || inq.status === 'no_change') ? 'Хариу өгсөн' : inq.status === 'pending' ? 'Хүлээгдэж буй' : inq.status}
                                                        </span>
                                                    </div>
                                                    {inq.operatorNote && (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-soft)', padding: '8px 12px', borderRadius: 8 }}>
                                                            Тэмдэглэл: {inq.operatorNote}
                                                        </div>
                                                    )}
                                                    {inq.changes?.note && (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(34,197,94,0.05)', padding: '8px 12px', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 8 }}>
                                                            Хариу: {inq.changes.note}
                                                        </div>
                                                    )}
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                                        {inq.createdAt ? new Date((inq.createdAt as any).seconds * 1000).toLocaleString('mn-MN') : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
            {showCreateCargoType && (
                <CreateCargoTypeModal
                    initialName={cargoInput}
                    onClose={() => setShowCreateCargoType(false)}
                    onSuccess={(id, name, fee) => {
                        setSelectedCargoTypeId(id);
                        setCargoInput(name);
                        setCargoFee(fee.toString());
                        setShowCreateCargoType(false);
                    }}
                />
            )}
        </div>,
        document.body
    );
}

function CreateCargoTypeModal({ initialName, onClose, onSuccess }: { initialName: string, onClose: () => void, onSuccess: (id: string, name: string, fee: number) => void }) {
    const { business } = useBusinessStore();
    const [name, setName] = useState(initialName);
    const [fee, setFee] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business) return;
        setLoading(true);
        try {
            const numFee = Number(fee) || 0;
            const id = await cargoService.createCargoType(business.id, {
                name,
                fee: numFee
            });
            toast.success('Каргоны төрөл амжилттай үүсгэлээ');
            onSuccess(id, name, numFee);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose}>
            <div className="modal modal-sm" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Шинэ карго төрөл</h2>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Төрлийн нэр <span className="required">*</span></label>
                            <input className="input" value={name} onChange={e => setName(e.target.value)} required autoFocus placeholder="Жнь: 1 кг, Овортой..." />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Үндсэн үнэ (₮) <span className="required">*</span></label>
                            <input className="input" type="number" value={fee} onChange={e => setFee(e.target.value)} required placeholder="Төлбөрийн хэмжээг оруулна уу" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Үүсгэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

