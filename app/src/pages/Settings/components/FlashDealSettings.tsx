import { useState, useEffect } from 'react';
import { Zap, Save, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import type { Product } from '../../../types';

interface FlashProduct {
    productId: string;
    flashPrice: number;
    maxQuantity: number;
    soldCount: number;
}

interface FlashConfig {
    enabled: boolean;
    title: string;
    startsAt: string; // ISO string for datetime-local input
    endsAt: string;
    products: FlashProduct[];
}

export function FlashDealSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductPicker, setShowProductPicker] = useState(false);

    const [config, setConfig] = useState<FlashConfig>({
        enabled: false,
        title: '⚡ FLASH DEAL',
        startsAt: new Date().toISOString().slice(0, 16),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        products: [],
    });

    useEffect(() => {
        if (!bizId) return;
        (async () => {
            setLoading(true);
            try {
                // Load flash deal config
                const bizDoc = await getDoc(doc(db, 'businesses', bizId));
                const fd = bizDoc.data()?.settings?.storefront?.flashDeal;
                if (fd) {
                    setConfig({
                        enabled: fd.enabled || false,
                        title: fd.title || '⚡ FLASH DEAL',
                        startsAt: fd.startsAt?.toDate?.()
                            ? fd.startsAt.toDate().toISOString().slice(0, 16)
                            : new Date().toISOString().slice(0, 16),
                        endsAt: fd.endsAt?.toDate?.()
                            ? fd.endsAt.toDate().toISOString().slice(0, 16)
                            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                        products: fd.products || [],
                    });
                }

                // Load products
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
            await updateDoc(doc(db, 'businesses', bizId), {
                'settings.storefront.flashDeal': {
                    enabled: config.enabled,
                    title: config.title,
                    startsAt: Timestamp.fromDate(new Date(config.startsAt)),
                    endsAt: Timestamp.fromDate(new Date(config.endsAt)),
                    products: config.products,
                },
            });
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
        setConfig(prev => ({
            ...prev,
            products: [...prev.products, {
                productId: product.id,
                flashPrice: Math.round((product.pricing?.salePrice || 0) * 0.7),
                maxQuantity: 10,
                soldCount: 0,
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

    const getProductName = (productId: string) => {
        return allProducts.find(p => p.id === productId)?.name || 'Устгагдсан бараа';
    };

    const getProductImage = (productId: string) => {
        return allProducts.find(p => p.id === productId)?.images?.[0] || '';
    };

    const getOriginalPrice = (productId: string) => {
        return allProducts.find(p => p.id === productId)?.pricing?.salePrice || 0;
    };

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
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #ff006e, #8338ec)', color: '#fff' }}>
                        <Zap size={20} />
                    </div>
                    <h3>Flash Deal тохиргоо</h3>
                </div>

                <div className="settings-form">
                    {/* Toggle */}
                    <div className="toggle-group" style={{
                        marginBottom: 24, padding: 16, borderRadius: 12,
                        background: config.enabled ? 'linear-gradient(135deg, rgba(255,0,110,0.08), rgba(131,56,236,0.08))' : 'var(--bg-soft)',
                        border: config.enabled ? '1px solid rgba(255,0,110,0.2)' : '1px solid transparent',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>⚡ Flash Deal идэвхжүүлэх</div>
                                <div className="input-info">Дэлгүүрийн дээд хэсэгт хязгаартай хугацааны хямдрал харуулах</div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    {config.enabled && (
                        <>
                            {/* Title */}
                            <div className="input-group">
                                <label className="input-label">Гарчиг</label>
                                <input
                                    className="input"
                                    value={config.title}
                                    onChange={e => setConfig({ ...config, title: e.target.value })}
                                    placeholder="⚡ FLASH DEAL"
                                />
                            </div>

                            <div className="divider" />

                            {/* Time settings */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Эхлэх огноо/цаг</label>
                                    <input
                                        className="input"
                                        type="datetime-local"
                                        value={config.startsAt}
                                        onChange={e => setConfig({ ...config, startsAt: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Дуусах огноо/цаг</label>
                                    <input
                                        className="input"
                                        type="datetime-local"
                                        value={config.endsAt}
                                        onChange={e => setConfig({ ...config, endsAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="divider" />

                            {/* Products */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <label className="input-label" style={{ margin: 0 }}>Flash бараанууд ({config.products.length})</label>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setShowProductPicker(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <Plus size={14} /> Бараа нэмэх
                                    </button>
                                </div>

                                {/* Product picker modal */}
                                {showProductPicker && (
                                    <div style={{
                                        padding: 16, borderRadius: 12, border: '1px solid var(--border-color)',
                                        background: 'var(--surface-1)', marginBottom: 16, maxHeight: 300, overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column',
                                    }}>
                                        <div style={{ position: 'relative', marginBottom: 12 }}>
                                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input
                                                className="input"
                                                placeholder="Бараа хайх..."
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                                style={{ paddingLeft: 36 }}
                                                autoFocus
                                            />
                                        </div>
                                        <div style={{ overflowY: 'auto', maxHeight: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {filteredAvailable.length === 0 ? (
                                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20, fontSize: '0.85rem' }}>Бараа олдсонгүй</div>
                                            ) : filteredAvailable.slice(0, 20).map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => addProduct(p)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                                        borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0 }}>
                                                        {p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(p.pricing?.salePrice || 0).toLocaleString()}₮</div>
                                                    </div>
                                                    <Plus size={16} style={{ color: 'var(--primary)' }} />
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowProductPicker(false)} style={{ marginTop: 8 }}>Хаах</button>
                                    </div>
                                )}

                                {/* Selected products */}
                                {config.products.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                                        Flash deal-д оруулах бараагаа сонгоно уу
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {config.products.map(fp => {
                                            const origPrice = getOriginalPrice(fp.productId);
                                            const discount = origPrice > 0 ? Math.round((1 - fp.flashPrice / origPrice) * 100) : 0;
                                            return (
                                                <div key={fp.productId} style={{
                                                    padding: 14, borderRadius: 12, border: '1px solid var(--border-color)',
                                                    background: 'var(--surface-1)', display: 'flex', gap: 12, alignItems: 'center',
                                                }}>
                                                    {/* Image */}
                                                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-soft)', flexShrink: 0 }}>
                                                        {getProductImage(fp.productId) && (
                                                            <img src={getProductImage(fp.productId)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {getProductName(fp.productId)}
                                                            {discount > 0 && (
                                                                <span style={{
                                                                    marginLeft: 8, fontSize: '0.7rem', fontWeight: 800,
                                                                    background: 'linear-gradient(135deg, #ff006e, #ff4d6d)',
                                                                    color: '#fff', padding: '2px 6px', borderRadius: 4,
                                                                }}>-{discount}%</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                                <label className="input-label" style={{ fontSize: '0.65rem' }}>Flash үнэ (₮)</label>
                                                                <input
                                                                    className="input"
                                                                    type="number"
                                                                    value={fp.flashPrice}
                                                                    onChange={e => updateProduct(fp.productId, 'flashPrice', Number(e.target.value))}
                                                                    style={{ height: 32, fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                                <label className="input-label" style={{ fontSize: '0.65rem' }}>Нийт тоо (ш)</label>
                                                                <input
                                                                    className="input"
                                                                    type="number"
                                                                    value={fp.maxQuantity}
                                                                    onChange={e => updateProduct(fp.productId, 'maxQuantity', Number(e.target.value))}
                                                                    style={{ height: 32, fontSize: '0.85rem' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Remove */}
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => removeProduct(fp.productId)}
                                                        style={{ color: '#dc2626', padding: 6 }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Save button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                        <button
                            className="btn btn-primary gradient-btn"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ minWidth: 140 }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Хадгалах
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
