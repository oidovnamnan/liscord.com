import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Plus, AlertTriangle, Grid3X3, List, Loader2, MoreVertical, ChevronDown, Globe } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService, categoryService, cargoService } from '../../services/db';
import type { Product, Category, CargoType } from '../../types';
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

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);
        const unsubscribe = productService.subscribeProducts(business.id, (data) => {
            setProducts(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    const filtered = products.filter(p => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.name.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s) || (p.categoryName || '').toLowerCase().includes(s);
    });

    const lowStock = products.filter(p => (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) && (p.stock?.quantity || 0) > 0).length;
    const outOfStock = products.filter(p => (p.stock?.quantity || 0) === 0).length;

    return (
        <>
            <Header
                title="Бараа"
                subtitle={loading ? 'Уншиж байна...' : `Нийт ${products.length} бараа`}
                action={{ label: 'Шинэ бараа', onClick: () => setShowCreate(true) }}
            />
            <div className="page">
                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Бараа, SKU хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="products-view-toggle">
                        <button className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={18} /></button>
                        <button className={`btn btn-ghost btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Бараа ачаалж байна...</p>
                    </div>
                ) : (
                    <>
                        {/* Alerts */}
                        {(lowStock > 0 || outOfStock > 0) && (
                            <div className="products-alerts">
                                {lowStock > 0 && (
                                    <div className="products-alert products-alert-warning">
                                        <AlertTriangle size={16} /> {lowStock} бараа нөөц бага байна
                                    </div>
                                )}
                                {outOfStock > 0 && (
                                    <div className="products-alert products-alert-danger">
                                        <AlertTriangle size={16} /> {outOfStock} бараа дууссан байна
                                    </div>
                                )}
                            </div>
                        )}

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
                                    <div key={p.id} className={`product-card card card-clickable ${(p.stock?.quantity || 0) === 0 ? 'product-out' : (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) ? 'product-low' : ''}`}>
                                        <div className="product-image">{p.images?.[0] || '📦'}</div>
                                        <div className="product-info">
                                            <div className="product-name">{p.name}</div>
                                            <div className="product-category">{p.categoryName || 'АНГИЛАЛГҮЙ'} • {p.sku || '-'}</div>
                                            <div className="product-prices">
                                                <span className="product-sale-price">{fmt(p.pricing?.salePrice || 0)}</span>
                                                <span className="product-cost-price">{fmt(p.pricing?.costPrice || 0)}</span>
                                                <span className="product-profit">+{p.pricing?.costPrice ? Math.round((p.pricing.salePrice - p.pricing.costPrice) / p.pricing.costPrice * 100) : 0}%</span>
                                            </div>
                                            <div className="product-stock">
                                                {p.productType === 'preorder' ? (
                                                    <span className="badge badge-info">♾️ Захиалга</span>
                                                ) : (p.stock?.quantity || 0) === 0 ? (
                                                    <span className="badge badge-cancelled">Дууссан</span>
                                                ) : (p.stock?.quantity || 0) <= (p.stock?.lowStockThreshold || 0) ? (
                                                    <span className="badge badge-preparing">⚠️ {p.stock.quantity} ш үлдсэн</span>
                                                ) : (
                                                    <span className="badge badge-delivered">{p.stock.quantity} ш бэлэн</span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm btn-icon product-more"><MoreVertical size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
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
    const [selectedCargoTypeId, setSelectedCargoTypeId] = useState<string>('');
    const [cargoValue, setCargoValue] = useState<string>('1');
    const [cargoFee, setCargoFee] = useState<string>(business?.settings?.cargoConfig?.defaultFee?.toString() || '');
    const [isCargoIncluded, setIsCargoIncluded] = useState(business?.settings?.cargoConfig?.isIncludedByDefault || false);

    useEffect(() => {
        if (!business?.id) return;
        const u1 = categoryService.subscribeCategories(business.id, setCategories);
        const u2 = cargoService.subscribeCargoTypes(business.id, setCargoTypes);
        return () => { u1(); u2(); };
    }, [business?.id]);

    const handleCargoTypeChange = (id: string) => {
        setSelectedCargoTypeId(id);
        const selected = cargoTypes.find(t => t.id === id);
        if (selected) {
            const val = Number(cargoValue) || 1;
            setCargoFee(Math.round(selected.fee * val).toString());
        }
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
        // Auto-generate SKU: LSC-XXXX-XXXX
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
        const finalSalePrice = Number(salePrice);
        const finalCostPrice = Number(costPrice);
        const stockQty = productType === 'preorder' ? 999999 : Number(fd.get('stock'));

        if (!name || isNaN(finalSalePrice)) {
            toast.error('Мэдээллээ бүрэн оруулна уу');
            return;
        }

        setLoading(true);
        try {
            let categoryId = selectedCategory?.id || 'general';
            let categoryName = selectedCategory?.name || categoryInput || 'Бусад';

            // Create new category if needed
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

            await productService.createProduct(business.id, {
                name,
                categoryId,
                categoryName,
                sku: sku || '',
                barcode: '',
                description: '',
                images: [],
                pricing: {
                    salePrice: finalSalePrice,
                    costPrice: finalCostPrice,
                    wholesalePrice: finalSalePrice
                },
                productType,
                stock: {
                    quantity: stockQty,
                    lowStockThreshold: 3,
                    trackInventory: productType === 'ready'
                },
                cargoFee: productType === 'preorder' ? {
                    amount: Number(cargoFee) || 0,
                    isIncluded: isCargoIncluded,
                    cargoTypeId: selectedCargoTypeId || undefined,
                    cargoValue: Number(cargoValue) || 1
                } : undefined,
                unitType: 'ш',
                isActive: true,
                stats: {
                    totalSold: 0,
                    totalRevenue: 0
                },
                isDeleted: false
            });
            onClose();
            toast.success('Бараа амжилттай нэмэгдлээ');
        } catch (error: any) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const filteredCats = categories.filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()));

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Шинэ бараа</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Барааны нэр <span className="required">*</span></label>
                            <input className="input" name="name" placeholder="iPhone 15 Pro" autoFocus required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group" style={{ position: 'relative' }}>
                                <label className="input-label">Ангилал</label>
                                <div className="input-with-icon" onClick={() => setShowCategoryDropdown(true)}>
                                    <input
                                        className="input"
                                        placeholder="Гар утас"
                                        value={categoryInput}
                                        onChange={e => {
                                            setCategoryInput(e.target.value);
                                            setSelectedCategory(null);
                                            setShowCategoryDropdown(true);
                                        }}
                                        onFocus={() => setShowCategoryDropdown(true)}
                                    />
                                    <ChevronDown size={16} className="input-icon-right" style={{ pointerEvents: 'none' }} />
                                </div>
                                {showCategoryDropdown && (categoryInput || categories.length > 0) && (
                                    <>
                                        <div className="dropdown-backdrop" onClick={() => setShowCategoryDropdown(false)} />
                                        <div className="dropdown-menu show" style={{ width: '100%', top: '100%', left: 0, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                                            {filteredCats.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        setSelectedCategory(c);
                                                        setCategoryInput(c.name);
                                                        setShowCategoryDropdown(false);
                                                    }}
                                                >
                                                    {c.name}
                                                </div>
                                            ))}
                                            {categoryInput && !categories.some(c => c.name.toLowerCase() === categoryInput.toLowerCase()) && (
                                                <div
                                                    className="dropdown-item"
                                                    style={{ color: 'var(--primary)', fontWeight: 600 }}
                                                    onClick={() => setShowCategoryDropdown(false)}
                                                >
                                                    <Plus size={14} style={{ marginRight: 4 }} /> "{categoryInput}" нэмэх
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="input-group">
                                <label className="input-label">SKU</label>
                                <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="LSC-XXXX-XXXX" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Өртөг</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={costPrice}
                                    onChange={e => handleCostChange(e.target.value)}
                                    placeholder="3800000"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Ашиг (%)</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={margin}
                                    onChange={e => handleMarginChange(e.target.value)}
                                    placeholder="20"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                <input
                                    className="input"
                                    type="number"
                                    value={salePrice}
                                    onChange={e => handleSaleChange(e.target.value)}
                                    placeholder="4500000"
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Төрөл <span className="required">*</span></label>
                                <select className="input select" value={productType} onChange={e => setProductType(e.target.value as any)}>
                                    <option value="ready">Бэлэн байгаа</option>
                                    <option value="preorder">Захиалгаар ирэх</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Нөөцийн тоо /Үлдэгдэл/</label>
                                <input
                                    className="input"
                                    name="stock"
                                    type="number"
                                    placeholder={productType === 'preorder' ? 'Хязгааргүй' : '10'}
                                    disabled={productType === 'preorder'}
                                />
                            </div>
                        </div>

                        {productType === 'preorder' && (
                            <div className="cargo-fee-section animate-slide-up" style={{
                                background: 'var(--bg-soft)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                    <Globe size={16} /> Олон улсын каргоны тохиргоо
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
                                    <div className="input-group">
                                        <label className="input-label">Каргоны төрөл</label>
                                        <select
                                            className="input select"
                                            value={selectedCargoTypeId}
                                            onChange={e => handleCargoTypeChange(e.target.value)}
                                        >
                                            <option value="">-- Төрөл сонгох --</option>
                                            {cargoTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} (₮{t.fee.toLocaleString()} / {t.unit})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">
                                            {selectedCargoTypeId ? `Хэмжээ (${cargoTypes.find(t => t.id === selectedCargoTypeId)?.unit})` : 'Хэмжээ / Жин'}
                                        </label>
                                        <input
                                            className="input"
                                            type="number"
                                            step="any"
                                            value={cargoValue}
                                            onChange={e => handleCargoValueChange(e.target.value)}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Каргоны төлбөр /нэгж/</label>
                                        <div className="input-with-icon">
                                            <input
                                                className="input"
                                                type="number"
                                                value={cargoFee}
                                                onChange={e => {
                                                    setCargoFee(e.target.value);
                                                    setSelectedCargoTypeId(''); // Reset selection if manual edit
                                                }}
                                                placeholder="25,000"
                                            />
                                            <span className="input-icon-right" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₮</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Тооцоолох арга</label>
                                    <div
                                        className={`input select-custom ${isCargoIncluded ? 'active' : ''}`}
                                        onClick={() => setIsCargoIncluded(!isCargoIncluded)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.9rem',
                                            padding: '0 12px',
                                            background: isCargoIncluded ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-input)',
                                            borderColor: isCargoIncluded ? 'var(--primary)' : 'var(--border-color)',
                                            color: isCargoIncluded ? 'var(--primary)' : 'var(--text-main)',
                                            height: '42px',
                                            borderRadius: '8px',
                                            border: '1px solid'
                                        }}
                                    >
                                        {isCargoIncluded ? '✅ Үнэд багтсан' : '📦 Тусдаа бодогдоно'}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                    {isCargoIncluded
                                        ? '* Каргоны төлбөр барааны үндсэн үнэд багтсан тул хэрэглэгчээс нэмэлт төлбөр авахгүй.'
                                        : '* Захиалга бүрт энэхүү каргоны төлбөр автоматаар нэмэгдэж тооцогдоно.'}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Нэмэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
