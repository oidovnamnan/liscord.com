import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Plus, AlertTriangle, Grid3X3, List, Loader2, MoreVertical } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { productService } from '../../services/db';
import type { Product } from '../../types';
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
                        <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
                            {filtered.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📦</div>
                                    <h3>Бараа олдсонгүй</h3>
                                    <p>Хайлтын нөхцөлөө өөрчилнө үү</p>
                                </div>
                            ) : (
                                filtered.map(p => (
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
                                ))
                            )}
                        </div>
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business || !user) return;

        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const category = fd.get('category') as string;
        const sku = fd.get('sku') as string;
        const salePrice = Number(fd.get('salePrice'));
        const costPrice = Number(fd.get('costPrice'));
        const stockQty = productType === 'preorder' ? 999999 : Number(fd.get('stock'));

        if (!name || isNaN(salePrice)) {
            toast.error('Мэдээллээ бүрэн оруулна уу');
            return;
        }

        setLoading(true);
        try {
            await productService.createProduct(business.id, {
                name,
                categoryId: 'general',
                categoryName: category || 'Бусад',
                sku: sku || '',
                barcode: '',
                description: '',
                images: [],
                pricing: {
                    salePrice,
                    costPrice,
                    wholesalePrice: salePrice
                },
                productType,
                stock: {
                    quantity: stockQty,
                    lowStockThreshold: 3,
                    trackInventory: productType === 'ready'
                },
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
                            <div className="input-group">
                                <label className="input-label">Ангилал</label>
                                <input className="input" name="category" placeholder="Гар утас" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">SKU</label>
                                <input className="input" name="sku" placeholder="IP15P-256" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Зарах үнэ <span className="required">*</span></label>
                                <input className="input" name="salePrice" type="number" placeholder="4500000" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Өртөг</label>
                                <input className="input" name="costPrice" type="number" placeholder="3800000" />
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
