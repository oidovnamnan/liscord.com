import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { ImageUpload } from '../../components/common/ImageUpload';
import { Search, Plus, AlertTriangle, Grid3X3, List, Loader2, MoreVertical, Globe, EyeOff } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, categoryService, cargoService } from '../../services/db';
import { storageService as storage } from '../../services/storage';
import type { Product, Category, CargoType, ProductVariation } from '../../types';
import { toast } from 'react-hot-toast';
import './ProductsPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ProductsPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCreate, setShowCreate] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        low: 0,
        out: 0,
        value: 0
    });

    useEffect(() => {
        if (!business?.id) return;

        setTimeout(() => setLoading(true), 0);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    useEffect(() => {
        const total = products.length;
        const low = products.filter(p => (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) && (p.stock?.quantity || 0) > 0).length;
        const out = products.filter(p => (p.stock?.quantity || 0) === 0).length;
        const value = products.reduce((sum, p) => sum + ((p.pricing?.costPrice || 0) * (p.stock?.quantity || 0)), 0);

        setStats({ total, low, out, value });
    }, [products]);

    const filtered = products.filter(p => {
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.categoryName || '').toLowerCase().includes(search.toLowerCase());

        const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;

        return matchSearch && matchCategory;
    });

    const categories = Array.from(new Set(products.map(p => ({ id: p.categoryId || 'general', name: p.categoryName || 'АНГИЛАЛГҮЙ' }))))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

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

    return (
        <>
            <Header
                title="Бараа Материал"
                subtitle={loading ? 'Уншиж байна...' : `Нийт ${products.length} төрлийн бараа`}
            />
            <div className="page">
                {/* Stats Summary Section */}
                <div className="orders-stats-summary animate-fade-in">
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <Grid3X3 size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Нийт бараа</span>
                            <span className="stat-value">{stats.total} төрөл</span>
                        </div>
                    </div>
                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSearch('нөөц бага')}>
                        <div className="stat-icon orange">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Нөөц бага</span>
                            <span className="stat-value">{stats.low} ширхэг</span>
                        </div>
                    </div>
                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSearch('дууссан')}>
                        <div className="stat-icon red" style={{ background: '#fef2f2', color: '#ef4444' }}>
                            <MoreVertical size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Дууссан</span>
                            <span className="stat-value">{stats.out} ширхэг</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <Plus size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Нөөцийн үнэ</span>
                            <span className="stat-value">{fmt(stats.value)}</span>
                        </div>
                    </div>
                </div>

                <div className="orders-toolbar animate-fade-in">
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={() => setShowCreate(true)}
                        style={{ height: '42px', padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        <span style={{ fontWeight: 700 }}>Шинэ бараа</span>
                    </button>

                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Бараа, SKU хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="products-view-toggle">
                        <button className={`btn btn-ghost ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={18} /></button>
                        <button className={`btn btn-ghost ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                    </div>
                </div>

                {/* Category Filter Chips */}
                {categories.length > 0 && (
                    <div className="category-chips-wrapper animate-fade-in" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 16px', scrollbarWidth: 'none' }}>
                        <button
                            className={`date-chip ${categoryFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setCategoryFilter('all')}
                        >
                            Бүгд
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`date-chip ${categoryFilter === cat.id ? 'active' : ''}`}
                                onClick={() => setCategoryFilter(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Бараа ачаалж байна...</p>
                    </div>
                ) : (
                    <>

                        {/* Grid / List */}
                        {filtered.length === 0 ? (
                            <div className="empty-state animate-fade-in">
                                <div className="empty-state-icon">📦</div>
                                <h3>{products.length === 0 ? 'Одоогоор бараа үүсгээгүй байна' : 'Бараа олдсонгүй'}</h3>
                                <p>{products.length === 0 ? 'Та "Шинэ бараа" товч дээр дарж анхны бараагаа нэмнэ үү.' : 'Хайлтын нөхцөлөө өөрчилнө үү'}</p>
                                {products.length === 0 && (
                                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
                                        <Plus size={18} /> Шинэ бараа нэмэх
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
                                {filtered.map(p => (
                                    <div key={p.id} className={`product-card card-clickable ${(p.stock?.quantity || 0) === 0 ? 'product-out' : ''}`}>
                                        <div className="product-card-image-wrapper" onClick={() => setEditingProduct(p)}>
                                            {p.images?.[0] ? (
                                                <img src={p.images[0]} alt={p.name} className="product-card-image" />
                                            ) : (
                                                <div className="product-card-placeholder">📦</div>
                                            )}
                                        </div>

                                        <div className="product-card-badges">
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
                                                    <div className="dropdown-action-item" onClick={() => { setEditingProduct(p); setOpenDropdownId(null); }}>
                                                        <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> Засах
                                                    </div>
                                                    <div className="dropdown-action-item danger" onClick={() => { handleDelete(p.id); setOpenDropdownId(null); }}>
                                                        <AlertTriangle size={14} /> Устгах
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="product-card-content" onClick={() => setEditingProduct(p)}>
                                            <div className="product-card-name">{p.name}</div>
                                            <div className="product-card-meta">
                                                <span className="badge badge-soft" style={{ fontSize: '0.65rem' }}>{p.categoryName || 'АНГИЛАЛГҮЙ'}</span>
                                                <span>•</span>
                                                <span className="sku-text">{p.sku || '-'}</span>
                                                {p.isHidden && (
                                                    <>
                                                        <span>•</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <EyeOff size={10} /> НУУЦЛАГДМАН
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
                        )}
                    </>
                )}
            </div>

            {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
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

    const [isHidden, setIsHidden] = useState(false);
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
                `${productName} - Танд дээд зэргийн чанар, шинэлэг загварыг санал болгож байна. Өдөр тутамд ашиглахад маш тохиромжтой.`,
                `${productName} бол бидний хамгийн сүүлчийн загвар бөгөөд хэрэглэгчдийн дунд маш их эрэлттэй байгаа бүтээгдэхүүн юм.`,
                `Дээд зэрэглэлийн материал, нарийн хийцтэй ${productName}. Таны хэрэгцээг бүрэн хангана.`
            ];
            setDescription(mockDescriptions[Math.floor(Math.random() * mockDescriptions.length)]);
            setIsGeneratingAI(false);
            toast.success('Тайлбар бэлэн боллоо');
        }, 1500);
    };

    const addVariation = () => {
        const id = Math.random().toString(36).substring(2, 9);
        setVariations([...variations, { id, name: '', sku: `${sku}-${variations.length + 1}`, quantity: 0 }]);
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
        setSku(`LSC-${rand()}-${rand()}`);
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
                variations: variations.length > 0 ? variations : undefined,
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
                    <button type="button" className={`tab-item ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Үндсэн</button>
                    <button type="button" className={`tab-item ${activeTab === 'price' ? 'active' : ''}`} onClick={() => setActiveTab('price')}>Үнэ & Нөөц</button>
                    <button type="button" className={`tab-item ${activeTab === 'variations' ? 'active' : ''}`} onClick={() => setActiveTab('variations')}>
                        Хувилбарууд {variations.length > 0 && <span className="tab-badge">{variations.length}</span>}
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Бусад</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400 }}>

                        {activeTab === 'basic' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                                <div className="input-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <label className="input-label" style={{ marginBottom: 0 }}>Тайлбар / Танилцуулга</label>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-ghost"
                                            onClick={generateAIDescription}
                                            disabled={isGeneratingAI}
                                            style={{ color: 'var(--primary)', fontWeight: 600, gap: 6 }}
                                        >
                                            {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : '🪄 AI бичүүлэх'}
                                        </button>
                                    </div>
                                    <textarea
                                        className="input"
                                        name="description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Барааны дэлгэрэнгүй мэдээлэл, хэмжээ, материал г.м"
                                        style={{ minHeight: 120, padding: '10px 12px', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                                                <div className="dropdown-menu show shadow-lg" style={{
                                                    width: '100%', top: '100%', left: 0, marginTop: 4,
                                                    maxHeight: 240, overflowY: 'auto', borderRadius: 10,
                                                    border: '1px solid var(--border-color)', padding: '4px',
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
                                                    {categoryInput && !categories.some(c => c.name.toLowerCase() === categoryInput.toLowerCase()) && (
                                                        <div className="dropdown-item" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={() => setShowCategoryDropdown(false)}>
                                                            <Plus size={16} /> Шинээр: "{categoryInput}"
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">SKU</label>
                                        <input className="input" value={sku} onChange={e => setSku(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'price' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                                <div className="price-preview-card" style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Зарах үнэ</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(Number(salePrice) || 0)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Бодит ашиг</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                            +{fmt((Number(salePrice) || 0) - (Number(costPrice) || 0))}
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                    <input className="input" type="number" value={salePrice} onChange={e => handleSaleChange(e.target.value)} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                                        {variations.length > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Хувилбаруудын нийлбэрээр бодогдоно</p>}
                                    </div>
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
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {productType === 'preorder' && (
                                    <div className="cargo-fee-section" style={{
                                        background: 'var(--bg-soft)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)',
                                        display: 'flex', flexDirection: 'column', gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <Globe size={16} /> Каргоны тохиргоо
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 12 }}>
                                            <div className="input-group" style={{ position: 'relative' }}>
                                                <div className="input-with" onClick={() => setShowCargoDropdown(true)}>
                                                    <input
                                                        className="input"
                                                        placeholder="Төрөл (жишээ: 1 кг)"
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
                                                        <div className="dropdown-menu show shadow-lg" style={{
                                                            width: '100%', top: '100%', left: 0, marginTop: 4,
                                                            maxHeight: 240, overflowY: 'auto', borderRadius: 10,
                                                            border: '1px solid var(--border-color)', padding: '4px',
                                                            zIndex: 100, background: 'var(--bg-main)'
                                                        }}>
                                                            {filteredCargo.map(c => (
                                                                <div key={c.id} className="dropdown-item" onClick={() => handleCargoTypeChange(c.id, c.name)}>
                                                                    {c.name} ({fmt(c.fee)}/нэгж)
                                                                </div>
                                                            ))}
                                                            {cargoInput && !cargoTypes.some(c => c.name.toLowerCase() === cargoInput.toLowerCase()) && (
                                                                <div className="dropdown-item" style={{ color: 'var(--primary)', fontWeight: 600 }} onClick={() => {
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
                                                <input className="input" type="number" value={cargoValue} onChange={e => handleCargoValueChange(e.target.value)} placeholder="1" />
                                            </div>
                                            <div className="input-group">
                                                <input className="input" type="number" value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div
                                                className={`input select-custom ${isCargoIncluded ? 'active' : ''}`}
                                                onClick={() => setIsCargoIncluded(!isCargoIncluded)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: 42, background: isCargoIncluded ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-input)', borderColor: isCargoIncluded ? 'var(--primary)' : 'var(--border-color)', borderRadius: 8, border: '1px solid' }}
                                            >
                                                {isCargoIncluded ? '✅ Үнэд багтсан' : '📦 Тусдаа бодогдоно'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isHidden ? 'var(--bg-hover)' : 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Онлайн дэлгүүрт харуулах эсэх?</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Энэ барааг хэрэглэгчийн веб хуудаснаас нуух</div>
                                    </div>
                                    <div className={`input select-custom ${isHidden ? 'active' : ''}`} onClick={() => setIsHidden(!isHidden)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: isHidden ? 'var(--accent-orange)' : 'var(--border-color)', background: isHidden ? 'rgba(255,159,67,0.1)' : 'transparent', color: isHidden ? 'var(--accent-orange)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {isHidden ? <><EyeOff size={14} /> НУУГДСАН</> : <><Globe size={14} /> НЭЭЛТТЭЙ</>}
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

    const [activeTab, setActiveTab] = useState<'basic' | 'price' | 'variations' | 'advanced'>('basic');
    const [variations, setVariations] = useState<ProductVariation[]>(product.variations || []);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [description, setDescription] = useState(product.description || '');
    const [productName, setProductName] = useState(product.name || '');

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
            setDescription(`${productName} - Амжилтыг тань тодотгох шилдэг сонголт. Чанар ба үнэ цэнийг эрхэмлэгч танд зориулав.`);
            setIsGeneratingAI(false);
            toast.success('Тайлбар бэлэн боллоо');
        }, 1200);
    };

    const addVariation = () => {
        const id = Math.random().toString(36).substring(2, 9);
        setVariations([...variations, { id, name: '', sku: `${sku}-${variations.length + 1}`, quantity: 0 }]);
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
                variations: variations.length > 0 ? variations : undefined,
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
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Бараа засах</h2>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button type="button" className={`tab-item ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Үндсэн</button>
                    <button type="button" className={`tab-item ${activeTab === 'price' ? 'active' : ''}`} onClick={() => setActiveTab('price')}>Үнэ & Нөөц</button>
                    <button type="button" className={`tab-item ${activeTab === 'variations' ? 'active' : ''}`} onClick={() => setActiveTab('variations')}>
                        Хувилбарууд {variations.length > 0 && <span className="tab-badge">{variations.length}</span>}
                    </button>
                    <button type="button" className={`tab-item ${activeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveTab('advanced')}>Бусад</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 400 }}>

                        {activeTab === 'basic' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                                <div className="input-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <label className="input-label" style={{ marginBottom: 0 }}>Тайлбар / Танилцуулга</label>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-ghost"
                                            onClick={generateAIDescription}
                                            disabled={isGeneratingAI}
                                            style={{ color: 'var(--primary)', fontWeight: 600, gap: 6 }}
                                        >
                                            {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : '🪄 AI бичүүлэх'}
                                        </button>
                                    </div>
                                    <textarea
                                        className="input"
                                        name="description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Барааны дэлгэрэнгүй мэдээлэл..."
                                        style={{ minHeight: 120, padding: '10px 12px', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                                                <div className="dropdown-menu show shadow-lg" style={{
                                                    width: '100%', top: '100%', left: 0, marginTop: 4,
                                                    maxHeight: 240, overflowY: 'auto', borderRadius: 10,
                                                    border: '1px solid var(--border-color)', padding: '4px',
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
                                        <label className="input-label">SKU</label>
                                        <input className="input" value={sku} onChange={e => setSku(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'price' && (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="input-group">
                                        <label className="input-label">Өртөг (₮)</label>
                                        <input className="input" type="number" value={costPrice} onChange={e => handleCostChange(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Ашиг (%)</label>
                                        <input className="input" type="number" value={margin} onChange={e => handleMarginChange(e.target.value)} />
                                    </div>
                                </div>

                                <div className="price-preview-card" style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Зарах үнэ</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{fmt(Number(salePrice) || 0)}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Бодит ашиг</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                            +{fmt((Number(salePrice) || 0) - (Number(costPrice) || 0))}
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                    <input className="input" type="number" value={salePrice} onChange={e => handleSaleChange(e.target.value)} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="input-group">
                                        <label className="input-label">Төрөл</label>
                                        <select className="input select" value={productType} onChange={e => setProductType(e.target.value as 'ready' | 'preorder')}>
                                            <option value="ready">Бэлэн байгаа</option>
                                            <option value="preorder">Захиалгаар</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{productType === 'ready' ? 'Үлдэгдэл' : 'Захиалга'}</label>
                                        <input className="input" name="stock" type="number" defaultValue={product.stock?.quantity} disabled={productType === 'preorder' || variations.length > 0} placeholder={productType === 'preorder' ? '∞' : '0'} />
                                    </div>
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
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {productType === 'preorder' && (
                                    <div className="cargo-fee-section" style={{
                                        background: 'var(--bg-soft)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)',
                                        display: 'flex', flexDirection: 'column', gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <Globe size={16} /> Каргоны тохиргоо
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: 12 }}>
                                            <div className="input-group" style={{ position: 'relative' }}>
                                                <div className="input-with" onClick={() => setShowCargoDropdown(true)}>
                                                    <input
                                                        className="input"
                                                        placeholder="Төрөл (жишээ: 1 кг)"
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
                                                        <div className="dropdown-menu show shadow-lg" style={{
                                                            width: '100%', top: '100%', left: 0, marginTop: 4,
                                                            maxHeight: 240, overflowY: 'auto', borderRadius: 10,
                                                            border: '1px solid var(--border-color)', padding: '4px',
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
                                                <input className="input" type="number" value={cargoValue} onChange={e => handleCargoValueChange(e.target.value)} placeholder="1" />
                                            </div>
                                            <div className="input-group">
                                                <input className="input" type="number" value={cargoFee} onChange={e => setCargoFee(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div
                                                className={`input select-custom ${isCargoIncluded ? 'active' : ''}`}
                                                onClick={() => setIsCargoIncluded(!isCargoIncluded)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: 42, background: isCargoIncluded ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-input)', borderColor: isCargoIncluded ? 'var(--primary)' : 'var(--border-color)', borderRadius: 8, border: '1px solid' }}
                                            >
                                                {isCargoIncluded ? '✅ Үнэд багтсан' : '📦 Тусдаа бодогдоно'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isHidden ? 'var(--bg-hover)' : 'var(--bg-soft)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Онлайн дэлгүүрт харуулах эсэх?</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Энэ барааг хэрэглэгчийн веб хуудаснаас нуух</div>
                                    </div>
                                    <div className={`input select-custom ${isHidden ? 'active' : ''}`} onClick={() => setIsHidden(!isHidden)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid', borderColor: isHidden ? 'var(--accent-orange)' : 'var(--border-color)', background: isHidden ? 'rgba(255,159,67,0.1)' : 'transparent', color: isHidden ? 'var(--accent-orange)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {isHidden ? <><EyeOff size={14} /> НУУГДСАН</> : <><Globe size={14} /> НЭЭЛТТЭЙ</>}
                                    </div>
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

