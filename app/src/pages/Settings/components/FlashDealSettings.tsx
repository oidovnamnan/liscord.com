import { useState, useEffect } from 'react';
import { Zap, Save, Loader2, Plus, Trash2, Search, X, Settings, Package } from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import type { Product } from '../../../types';
import './FlashDealSettings.css';

interface FlashProduct {
    productId: string;
    flashPrice: number;
    maxQuantity: number;
    soldCount: number;
    durationHours: number;
    endsAt?: string;
    addedAt?: string;
}

interface FlashConfig {
    enabled: boolean;
    title: string;
    durationHours: number; // deal duration in hours
    products: FlashProduct[];
}

export function FlashDealSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(30);

    const [config, setConfig] = useState<FlashConfig>({
        enabled: false,
        title: '⚡ FLASH DEAL',
        durationHours: 24,
        products: [],
    });

    useEffect(() => {
        if (!bizId) return;
        (async () => {
            setLoading(true);
            try {
                const sfDoc = await getDoc(doc(db, 'businesses', bizId, 'module_settings', 'storefront'));
                const fd = sfDoc.data()?.flashDeal;
                if (fd) {
                    // Calculate duration from stored startsAt/endsAt
                    let dur = 24;
                    if (fd.startsAt && fd.endsAt) {
                        const s = fd.startsAt?.toDate?.() || new Date(fd.startsAt);
                        const e = fd.endsAt?.toDate?.() || new Date(fd.endsAt);
                        dur = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60)));
                    }
                    setConfig({
                        enabled: fd.enabled || false,
                        title: fd.title || '⚡ FLASH DEAL',
                        durationHours: dur,
                        products: fd.products || [],
                    });
                }

                const { collection, getDocs } = await import('firebase/firestore');
                const snap = await getDocs(collection(db, 'businesses', bizId, 'products'));
                const prods = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
                setAllProducts(prods.filter(p => !p.isDeleted));
            } catch (e) {
                console.error('Failed to load flash deal config', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { doc: docRef, setDoc } = await import('firebase/firestore');
            const now = new Date();
            // Calculate per-product endsAt
            const productsWithEnds = config.products.map(p => {
                // If product already has a future endsAt, keep it; otherwise calculate new
                const existingEnd = p.endsAt ? new Date(p.endsAt) : null;
                const keepExisting = existingEnd && existingEnd.getTime() > now.getTime();
                const endsAt = keepExisting
                    ? existingEnd!.toISOString()
                    : new Date(now.getTime() + p.durationHours * 60 * 60 * 1000).toISOString();
                return { ...p, endsAt };
            });
            // Global endsAt = latest product endsAt (for backward compat)
            const latestEnd = productsWithEnds.reduce((max, p) => {
                const t = new Date(p.endsAt!).getTime();
                return t > max ? t : max;
            }, now.getTime());
            await setDoc(docRef(db, 'businesses', bizId, 'module_settings', 'storefront'), {
                flashDeal: {
                    enabled: config.enabled,
                    title: config.title,
                    startsAt: Timestamp.fromDate(now),
                    endsAt: Timestamp.fromDate(new Date(latestEnd)),
                    products: productsWithEnds,
                },
            }, { merge: true });
            // Update local state with endsAt values
            setConfig(prev => ({ ...prev, products: productsWithEnds }));
            toast.success('Flash Deal тохиргоо хадгалагдлаа!');
        } catch (e) {
            console.error(e);
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const addProduct = (product: Product) => {
        if (config.products.find(p => p.productId === product.id)) {
            toast.error('Энэ бараа аль хэдийн нэмэгдсэн');
            return;
        }
        const origPrice = product.pricing?.salePrice || 0;
        const flashPrice = Math.round(origPrice * (1 - discountPercent / 100));
        setConfig(prev => ({
            ...prev,
            products: [...prev.products, {
                productId: product.id,
                flashPrice,
                maxQuantity: 10,
                soldCount: 0,
                durationHours: config.durationHours,
                addedAt: new Date().toISOString(),
            }],
        }));
        setShowProductPicker(false);
        setProductSearch('');
    };

    const removeProduct = (productId: string) => {
        setConfig(prev => ({
            ...prev,
            products: prev.products.filter(p => p.productId !== productId),
        }));
    };

    const updateProduct = (productId: string, field: keyof FlashProduct, value: number) => {
        setConfig(prev => ({
            ...prev,
            products: prev.products.map(p =>
                p.productId === productId ? { ...p, [field]: value } : p
            ),
        }));
    };

    const getProduct = (productId: string) => allProducts.find(p => p.id === productId);

    const filteredAvailable = allProducts
        .filter(p => !config.products.find(fp => fp.productId === p.id))
        .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()));

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '200px' }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    return (
        <div className="settings-section animate-fade-in">
            {/* ── Hero Header ── */}
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="fds-hero-title">Flash Deal тохиргоо</h3>
                            <div className="fds-hero-desc">Дэлгүүрийн дээд хэсэгт хязгаартай хугацааны хямдрал</div>
                        </div>
                    </div>
                    <label className="fds-toggle">
                        <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
                        <span className="fds-toggle-track" />
                    </label>
                </div>
            </div>

            {config.enabled && (
                <>
                    {/* ── Settings Card ── */}
                    <div className="fds-card">
                        <div className="fds-card-title">
                            <Settings size={16} />
                            Тохиргоо
                        </div>

                        {/* Title */}
                        <div className="fds-row-full">
                            <label className="fds-label">Гарчиг</label>
                            <input
                                className="input"
                                value={config.title}
                                onChange={e => setConfig({ ...config, title: e.target.value })}
                                placeholder="⚡ FLASH DEAL"
                            />
                        </div>

                        {/* Duration presets */}
                        <div className="fds-row-full">
                            <label className="fds-label">⏱️ Хугацаа (хадгалснаас эхэлж тоолно)</label>
                            <div className="fds-duration-presets">
                                {[4, 8, 12, 24, 48, 72].map(h => (
                                    <button
                                        key={h}
                                        className={`fds-duration-btn ${config.durationHours === h ? 'active' : ''}`}
                                        onClick={() => setConfig({ ...config, durationHours: h })}
                                    >
                                        {h}ц
                                    </button>
                                ))}
                                <div className="fds-duration-custom">
                                    <input
                                        type="number"
                                        min={1}
                                        max={168}
                                        value={config.durationHours}
                                        onChange={e => setConfig({ ...config, durationHours: Math.max(1, Number(e.target.value)) })}
                                    />
                                    <span>цаг</span>
                                </div>
                            </div>
                            <div className="fds-slider-info">
                                Хадгалах товч дарахад эхлэх цаг автоматаар тохируулагдана.
                            </div>
                        </div>

                        {/* Discount slider */}
                        <div className="fds-row-full" style={{ marginTop: 8 }}>
                            <label className="fds-label">Хямдралын хувь</label>
                            <div className="fds-slider-wrap">
                                <input
                                    type="range"
                                    className="fds-slider"
                                    min={5}
                                    max={90}
                                    step={5}
                                    value={discountPercent}
                                    onChange={e => setDiscountPercent(Number(e.target.value))}
                                />
                                <div className="fds-slider-badge">{discountPercent}%</div>
                            </div>
                            <div className="fds-slider-info">
                                Бараа нэмэхэд анхны үнэнд энэ хувийг хэрэглэнэ. Нэмсний дараа тус тусад нь засах боломжтой.
                            </div>
                        </div>
                    </div>

                    {/* ── Products Card ── */}
                    <div className="fds-card">
                        <div className="fds-products-header">
                            <div className="fds-products-count">
                                <Package size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                Flash бараануд ({config.products.length})
                            </div>
                            <button className="fds-add-btn" onClick={() => setShowProductPicker(true)}>
                                <Plus size={14} /> Бараа нэмэх
                            </button>
                        </div>

                        {config.products.length === 0 ? (
                            <div className="fds-empty">
                                <div className="fds-empty-icon">📦</div>
                                Flash deal-д оруулах бараагаа сонгоно уу
                            </div>
                        ) : (
                            <div className="fds-product-grid">
                                {config.products.map(fp => {
                                    const prod = getProduct(fp.productId);
                                    const origPrice = prod?.pricing?.salePrice || 0;
                                    const discount = origPrice > 0 ? Math.round((1 - fp.flashPrice / origPrice) * 100) : 0;
                                    return (
                                        <div key={fp.productId} className="fds-product-card">
                                            <button className="fds-product-delete" onClick={() => removeProduct(fp.productId)}>
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="fds-product-img">
                                                {prod?.images?.[0] ? (
                                                    <img src={prod.images[0]} alt={prod?.name || ''} />
                                                ) : (
                                                    <div className="fds-product-img-empty">📦</div>
                                                )}
                                            </div>
                                            <div className="fds-product-name">{prod?.name || 'Устгагдсан бараа'}</div>
                                            <div className="fds-product-prices">
                                                {origPrice > fp.flashPrice && (
                                                    <span className="fds-product-orig">{origPrice.toLocaleString()}₮</span>
                                                )}
                                                <span className="fds-product-flash">{fp.flashPrice.toLocaleString()}₮</span>
                                                {discount > 0 && <span className="fds-product-badge">-{discount}%</span>}
                                            </div>
                                            <div className="fds-product-inputs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                <div>
                                                    <label>Flash үнэ (₮)</label>
                                                    <input
                                                        type="number"
                                                        value={fp.flashPrice}
                                                        onChange={e => updateProduct(fp.productId, 'flashPrice', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label>Тоо (ш)</label>
                                                    <input
                                                        type="number"
                                                        value={fp.maxQuantity}
                                                        onChange={e => updateProduct(fp.productId, 'maxQuantity', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label>⏱️ Хугацаа (ц)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={168}
                                                        value={fp.durationHours || config.durationHours}
                                                        onChange={e => updateProduct(fp.productId, 'durationHours', Math.max(1, Number(e.target.value)))}
                                                    />
                                                </div>
                                            </div>
                                            {fp.endsAt && new Date(fp.endsAt) > new Date() && (
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    ⏰ {new Date(fp.endsAt).toLocaleString('mn-MN')} хүртэл
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Save Button ── */}
                    <div className="fds-save-wrap">
                        <button className="fds-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Хадгалах
                        </button>
                    </div>
                </>
            )}

            {/* ── Product Picker Modal ── */}
            {showProductPicker && (
                <div className="fds-modal-overlay" onClick={() => setShowProductPicker(false)}>
                    <div className="fds-modal" onClick={e => e.stopPropagation()}>
                        <div className="fds-modal-header">
                            <span className="fds-modal-title">Бараа сонгох</span>
                            <button className="fds-modal-close" onClick={() => setShowProductPicker(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="fds-modal-search">
                            <Search size={16} />
                            <input
                                placeholder="Бараа хайх..."
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="fds-modal-list">
                            {filteredAvailable.length === 0 ? (
                                <div className="fds-modal-empty">Бараа олдсонгүй</div>
                            ) : filteredAvailable.slice(0, 20).map(p => (
                                <div key={p.id} className="fds-modal-item" onClick={() => addProduct(p)}>
                                    <div className="fds-modal-item-img">
                                        {p.images?.[0] && <img src={p.images[0]} alt="" />}
                                    </div>
                                    <div className="fds-modal-item-info">
                                        <div className="fds-modal-item-name">{p.name}</div>
                                        <div className="fds-modal-item-price">{(p.pricing?.salePrice || 0).toLocaleString()}₮</div>
                                    </div>
                                    <Plus size={18} className="fds-modal-item-add" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
