import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Tags, Plus, Search, Loader2, Pencil, Trash2, Crown,
    FolderOpen, Lock, Package, X, ChevronDown
} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { categoryService, productService } from '../../services/db';
import type { Category, Product } from '../../types';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../../components/common/PermissionGate';
import './CategoriesPage.css';

const COLORS = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fdcb6e', '#e84393', '#2d3436', '#00cec9'];

export function CategoriesPage() {
    const { business } = useBusinessStore();
    const { hasPermission } = usePermissions();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'exclusive'>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        const unsub1 = categoryService.subscribeCategories(business.id, (data) => {
            setCategories(data);
            setLoading(false);
        });
        const unsub2 = productService.subscribeProducts(business.id, (data) => {
            setProducts(data);
        }, 500);
        return () => { unsub1(); unsub2(); };
    }, [business?.id]);

    // Count products per category
    const productCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        products.filter(p => !p.isDeleted).forEach(p => {
            const catId = p.categoryId || 'general';
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [products]);

    const filtered = categories.filter(c => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
        const matchTab = activeTab === 'all' || c.categoryType === activeTab;
        return matchSearch && matchTab;
    });

    const stats = useMemo(() => ({
        total: categories.length,
        normal: categories.filter(c => c.categoryType !== 'exclusive').length,
        exclusive: categories.filter(c => c.categoryType === 'exclusive').length,
        totalProducts: products.filter(p => !p.isDeleted).length,
    }), [categories, products]);

    const handleDelete = async (cat: Category) => {
        if (!business) return;
        const count = productCounts[cat.id] || 0;
        if (count > 0) {
            toast.error(`"${cat.name}" ангилалд ${count} бараа байна. Эхлээд барааг зөөнө үү.`);
            return;
        }
        if (!confirm(`"${cat.name}" ангилалыг устгахдаа итгэлтэй байна уу?`)) return;
        try {
            await categoryService.deleteCategory(business.id, cat.id);
            toast.success('Ангилал устгагдлаа');
        } catch {
            toast.error('Алдаа гарлаа');
        }
    };

    return (
        <>
            <div className="page">
                <div className="page-hero" style={{ marginBottom: 8 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <Tags size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Ангилал & Нэр Төрөл</h2>
                            <p className="page-hero-subtitle">{loading ? 'Уншиж байна...' : `${categories.length} ангилал`}</p>
                        </div>
                    </div>
                    <PermissionGate permission="categories.create">
                        <button
                            className="btn btn-primary gradient-btn"
                            onClick={() => setShowCreate(true)}
                            style={{ height: 42, padding: '0 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Plus size={18} />
                            <span style={{ fontWeight: 700 }}>Шинэ ангилал</span>
                        </button>
                    </PermissionGate>
                </div>

                {/* Stats */}
                <div className="inv-stats-grid" style={{ marginBottom: 24 }}>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт ангилал</h4>
                            <div className="inv-stat-value">{stats.total}</div>
                        </div>
                        <div className="inv-stat-icon icon-primary"><Tags size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Энгийн</h4>
                            <div className="inv-stat-value">{stats.normal}</div>
                        </div>
                        <div className="inv-stat-icon icon-green"><FolderOpen size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Онцгой (VIP)</h4>
                            <div className="inv-stat-value">{stats.exclusive}</div>
                        </div>
                        <div className="inv-stat-icon icon-purple"><Crown size={24} /></div>
                    </div>
                    <div className="inv-stat-card">
                        <div className="inv-stat-content">
                            <h4>Нийт бараа</h4>
                            <div className="inv-stat-value">{stats.totalProducts}</div>
                        </div>
                        <div className="inv-stat-icon icon-primary"><Package size={24} /></div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="orders-toolbar animate-fade-in">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input
                            className="input orders-search-input"
                            placeholder="Ангилал хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="cat-tabs">
                        <button className={`cat-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                            Бүгд <span className="cat-tab-count">{stats.total}</span>
                        </button>
                        <button className={`cat-tab ${activeTab === 'normal' ? 'active' : ''}`} onClick={() => setActiveTab('normal')}>
                            Энгийн <span className="cat-tab-count">{stats.normal}</span>
                        </button>
                        <button className={`cat-tab ${activeTab === 'exclusive' ? 'active' : ''}`} onClick={() => setActiveTab('exclusive')}>
                            <Crown size={14} /> Онцгой <span className="cat-tab-count">{stats.exclusive}</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="animate-spin" />
                        <p>Ангилал ачаалж байна...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">📂</div>
                        <h3>{categories.length === 0 ? 'Одоогоор ангилал үүсгээгүй байна' : 'Ангилал олдсонгүй'}</h3>
                        <p>{categories.length === 0 ? 'Та "Шинэ ангилал" товч дээр дарж анхны ангилалаа нэмнэ үү.' : 'Хайлтаа өөрчилнө үү'}</p>
                        {categories.length === 0 && hasPermission('categories.create') && (
                            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
                                <Plus size={18} /> Шинэ ангилал нэмэх
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="cat-grid animate-fade-in">
                        {filtered.map(cat => (
                            <div key={cat.id} className={`cat-card ${cat.categoryType === 'exclusive' ? 'cat-card-exclusive' : ''}`}>
                                <div className="cat-card-header">
                                    <div className="cat-card-color" style={{ background: cat.color || '#6c5ce7' }}>
                                        {cat.categoryType === 'exclusive' ? <Lock size={16} /> : <FolderOpen size={16} />}
                                    </div>
                                    <div className="cat-card-info">
                                        <div className="cat-card-name">
                                            {cat.name}
                                            {cat.categoryType === 'exclusive' && (
                                                <span className="cat-vip-badge"><Crown size={10} /> VIP</span>
                                            )}
                                        </div>
                                        <div className="cat-card-desc">{cat.description || 'Тайлбаргүй'}</div>
                                    </div>
                                    <div className="cat-card-count">
                                        <span className="cat-count-num">{productCounts[cat.id] || 0}</span>
                                        <span className="cat-count-label">бараа</span>
                                    </div>
                                </div>

                                {cat.categoryType === 'exclusive' && cat.membershipConfig && (
                                    <div className="cat-membership-info">
                                        <Crown size={12} />
                                        <span>Гишүүнчлэл: ₮{cat.membershipConfig.price.toLocaleString()} / {cat.membershipConfig.durationDays} хоног</span>
                                    </div>
                                )}

                                {hasPermission('categories.edit') && (
                                    <div className="cat-card-actions">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingCategory(cat)} title="Засах">
                                            <Pencil size={14} />
                                        </button>
                                        {hasPermission('categories.delete') && (
                                            <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDelete(cat)} title="Устгах">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreate && (
                <CategoryModal
                    onClose={() => setShowCreate(false)}
                    onSaved={() => setShowCreate(false)}
                />
            )}

            {editingCategory && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSaved={() => setEditingCategory(null)}
                />
            )}
        </>
    );
}

// ══════════════════════════════════════════════
// CATEGORY MODAL (Create / Edit)
// ══════════════════════════════════════════════
function CategoryModal({
    category,
    onClose,
    onSaved,
}: {
    category?: Category;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');
    const [color, setColor] = useState(category?.color || COLORS[0]);
    const [categoryType, setCategoryType] = useState<'normal' | 'exclusive'>(category?.categoryType || 'normal');
    const [memberPrice, setMemberPrice] = useState(category?.membershipConfig?.price?.toString() || '');
    const [memberDays, setMemberDays] = useState(category?.membershipConfig?.durationDays?.toString() || '30');
    const [memberDesc, setMemberDesc] = useState(category?.membershipConfig?.description || '');
    const [showAdvanced, setShowAdvanced] = useState(!!category?.membershipConfig);

    const isEditing = !!category;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business || !name.trim()) {
            toast.error('Ангилалын нэрээ оруулна уу');
            return;
        }

        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: Record<string, any> = {
                name: name.trim(),
                description: description.trim(),
                color,
                categoryType,
            };

            if (categoryType === 'exclusive') {
                const mc: Record<string, any> = {
                    price: Number(memberPrice) || 0,
                    durationDays: Number(memberDays) || 30,
                };
                if (memberDesc.trim()) mc.description = memberDesc.trim();
                data.membershipConfig = mc;
            } else {
                // For normal categories, explicitly remove membershipConfig if editing
                if (isEditing) {
                    const { deleteField } = await import('firebase/firestore');
                    data.membershipConfig = deleteField();
                }
            }

            if (isEditing) {
                await categoryService.updateCategory(business.id, category.id, data);
                toast.success('Ангилал шинэчлэгдлээ');
            } else {
                await categoryService.createCategory(business.id, data);
                toast.success('Ангилал үүсгэгдлээ');
            }
            onSaved();
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h2>{isEditing ? 'Ангилал засах' : 'Шинэ ангилал'}</h2>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Type switch */}
                        <div className="cat-type-switch">
                            <button
                                type="button"
                                className={`cat-type-btn ${categoryType === 'normal' ? 'active' : ''}`}
                                onClick={() => setCategoryType('normal')}
                            >
                                <FolderOpen size={16} /> Энгийн
                            </button>
                            <button
                                type="button"
                                className={`cat-type-btn cat-type-exclusive ${categoryType === 'exclusive' ? 'active' : ''}`}
                                onClick={() => setCategoryType('exclusive')}
                            >
                                <Crown size={16} /> Онцгой (VIP)
                            </button>
                        </div>

                        {/* Name */}
                        <div className="input-group">
                            <label className="input-label">Нэр <span className="required">*</span></label>
                            <input
                                className="input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder={categoryType === 'exclusive' ? 'Жнь: Алкогол, VIP бараа' : 'Жнь: Электроник, Хувцас'}
                                autoFocus
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="input-group">
                            <label className="input-label">Тайлбар</label>
                            <textarea
                                className="input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ангилалын тайлбар..."
                                rows={2}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Color */}
                        <div className="input-group">
                            <label className="input-label">Өнгө</label>
                            <div className="cat-color-picker">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`cat-color-dot ${color === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Membership config (exclusive only) */}
                        {categoryType === 'exclusive' && (
                            <div className="cat-membership-config">
                                <div className="cat-membership-header">
                                    <Crown size={16} />
                                    <span>Гишүүнчлэлийн тохиргоо</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="input-group">
                                        <label className="input-label">Үнэ (₮)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={memberPrice}
                                            onChange={e => setMemberPrice(e.target.value)}
                                            placeholder="5,000"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Хугацаа (хоног)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            value={memberDays}
                                            onChange={e => setMemberDays(e.target.value)}
                                            placeholder="30"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="cat-advanced-toggle"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    Нэмэлт тайлбар
                                </button>

                                {showAdvanced && (
                                    <div className="input-group">
                                        <textarea
                                            className="input"
                                            value={memberDesc}
                                            onChange={e => setMemberDesc(e.target.value)}
                                            placeholder="Гишүүнчлэлийн тайлбар, богино зар текст..."
                                            rows={2}
                                            style={{ resize: 'vertical', fontSize: '0.85rem' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Цуцлах</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : isEditing ? 'Хадгалах' : 'Үүсгэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
