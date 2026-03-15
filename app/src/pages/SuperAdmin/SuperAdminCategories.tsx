import { useState, useEffect, useMemo } from 'react';
import { useSystemCategoriesStore } from '../../store';
import { businessCategoryService } from '../../services/db';
import { Plus, Edit2, Trash2, Loader2, Search, Sparkles, CheckCircle2, XCircle, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { BusinessCategoryConfig } from '../../types';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

type CatFilter = 'all' | 'active' | 'inactive';

export function SuperAdminCategories() {
    const { categories, loading, fetchCategories, refresh } = useSystemCategoriesStore();
    const [editingCategory, setEditingCategory] = useState<BusinessCategoryConfig | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<CatFilter>('all');

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenModal = (category?: BusinessCategoryConfig) => {
        if (category) {
            setEditingCategory(category);
        } else {
            setEditingCategory({
                id: '',
                label: '',
                icon: '🏢',
                desc: '',
                isActive: true,
                order: categories.length
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingCategory || !editingCategory.id || !editingCategory.label) return;
        setSaving(true);
        try {
            const isNew = !categories.find(c => c.id === editingCategory.id);
            if (isNew) {
                await businessCategoryService.createCategory(editingCategory);
                toast.success('Шинэ ангилал нэмэгдлээ');
            } else {
                await businessCategoryService.updateCategory(editingCategory.id, editingCategory);
                toast.success('Ангилал шинэчлэгдлээ');
            }
            setIsModalOpen(false);
            refresh();
        } catch (error) {
            console.error('Failed to save category:', error);
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.id || !editingCategory.label) {
            toast.error('Мэдээллийг гүйцэд оруулна уу');
            return;
        }
        setPendingAction(() => handleSave);
        setShowSecurityModal(true);
    };

    const handleToggleActive = async (category: BusinessCategoryConfig) => {
        try {
            await businessCategoryService.updateCategory(category.id, { isActive: !category.isActive });
            toast.success(category.isActive ? 'Идэвхгүй болголоо' : 'Идэвхжүүллээ');
            refresh();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Үйлдэл амжилтгүй');
        }
    };

    const handleBulkToggleActive = async (isActive: boolean) => {
        if (selectedIds.length === 0) return;
        setPendingAction(() => async () => {
            setSaving(true);
            try {
                await businessCategoryService.bulkUpdateCategories(selectedIds, { isActive });
                toast.success(`${selectedIds.length} ангиллыг ${isActive ? 'идэвхжүүллээ' : 'идэвхгүй болголоо'}`);
                setSelectedIds([]);
                refresh();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
                toast.error('Үйлдэл амжилтгүй');
            } finally {
                setSaving(false);
            }
        });
        setShowSecurityModal(true);
    };

    const handleDelete = async (id: string) => {
        setPendingAction(() => async () => {
            try {
                await businessCategoryService.deleteCategory(id);
                toast.success('Устгагдлаа');
                refresh();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
                toast.error('Устгахад алдаа гарлаа');
            }
        });
        setShowSecurityModal(true);
    };

    const handleSeedCategories = async () => {
        setPendingAction(() => async () => {
            setSaving(true);
            try {
                let count = 0;
                for (const cat of categories) {
                    await businessCategoryService.createCategory(cat);
                    count++;
                }
                toast.success(`Амжилттай ${count} ангилал нэмэгдлээ!`);
                refresh();
            } catch (error) {
                console.error('Seeding error:', error);
                toast.error('Анхны өгөгдөл хуулахад алдаа гарлаа');
            } finally {
                setSaving(false);
            }
        });
        setShowSecurityModal(true);
    };

    const heroStats = useMemo(() => {
        const active = categories.filter(c => c.isActive).length;
        const inactive = categories.filter(c => !c.isActive).length;
        return { total: categories.length, active, inactive };
    }, [categories]);

    const filtered = useMemo(() => {
        return categories.filter(c => {
            const matchesSearch = c.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.desc?.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesFilter = true;
            if (activeFilter === 'active') matchesFilter = !!c.isActive;
            else if (activeFilter === 'inactive') matchesFilter = !c.isActive;
            return matchesSearch && matchesFilter;
        });
    }, [categories, searchTerm, activeFilter]);

    const filterTabs: { id: CatFilter; label: string; count: number; icon?: React.ReactNode }[] = [
        { id: 'all', label: 'Бүгд', count: heroStats.total },
        { id: 'active', label: 'Идэвхтэй', count: heroStats.active, icon: <CheckCircle2 size={12} /> },
        { id: 'inactive', label: 'Идэвхгүй', count: heroStats.inactive, icon: <XCircle size={12} /> },
    ];

    if (loading && categories.length === 0) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Ангиллууд уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)', boxShadow: '0 8px 32px rgba(168, 85, 247, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><Layers size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Ангилал удирдлага</div>
                            <h1 className="sa-hero-title">Бизнесийн Ангиллууд</h1>
                            <div className="sa-hero-desc">Системд бүртгүүлэх боломжтой бизнесийн төрлүүд</div>
                        </div>
                    </div>
                    <button className="sa-hero-btn" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Шинэ ангилал
                    </button>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.total}</div>
                        <div className="sa-hero-stat-label">Нийт ангилал</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.active}</div>
                        <div className="sa-hero-stat-label">Идэвхтэй</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{heroStats.inactive}</div>
                        <div className="sa-hero-stat-label">Идэвхгүй</div>
                    </div>
                </div>
            </div>

            {/* ── Search & Filter Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="search-bar-premium" style={{ maxWidth: 400 }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Ангилал хайх..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 20,
                                border: activeFilter === tab.id ? '1.5px solid var(--primary)' : '1.5px solid var(--border-primary)',
                                background: activeFilter === tab.id ? 'var(--primary)' : 'var(--surface-1)',
                                color: activeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', fontFamily: 'inherit',
                            }}
                        >
                            {tab.icon} {tab.label} <span style={{
                                background: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-soft)',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 800,
                            }}>{tab.count}</span>
                        </button>
                    ))}
                    <button className="btn btn-outline btn-sm" onClick={handleSeedCategories} disabled={saving} style={{ marginLeft: 8 }}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        Seed
                    </button>
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '4px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{selectedIds.length} сонгосон:</span>
                            <label className="ios-switch">
                                <input type="checkbox" onChange={(e) => handleBulkToggleActive(e.target.checked)} />
                                <span className="ios-slider"></span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card no-padding overflow-hidden">
                <table className="super-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(filtered.map(c => c.id));
                                        else setSelectedIds([]);
                                    }}
                                />
                            </th>
                            <th style={{ width: '80px' }}>Icon</th>
                            <th>ID Code</th>
                            <th>Нэр</th>
                            <th>Тайлбар</th>
                            <th>Төлөв</th>
                            <th className="text-right">Үйлдэл</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((cat) => (
                            <tr key={cat.id} className={cat.isActive ? '' : 'text-tertiary'}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(cat.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds([...selectedIds, cat.id]);
                                            else setSelectedIds(selectedIds.filter(id => id !== cat.id));
                                        }}
                                    />
                                </td>
                                <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                                <td className="font-mono text-xs">{cat.id}</td>
                                <td className="font-bold">{cat.label}</td>
                                <td className="text-secondary">{cat.desc}</td>
                                <td>
                                    <label className="ios-switch" title={cat.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}>
                                        <input
                                            type="checkbox"
                                            checked={cat.isActive}
                                            onChange={() => handleToggleActive(cat)}
                                        />
                                        <span className="ios-slider"></span>
                                    </label>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                        <button className="btn-icon" onClick={() => handleOpenModal(cat)} style={{ width: 32, height: 32, minWidth: 32 }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn-icon text-danger" onClick={() => handleDelete(cat.id)} style={{ width: 32, height: 32, minWidth: 32 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && editingCategory && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingCategory.id ? 'Ангилал засах' : 'Шинэ ангилал'}</h2>
                            <button className="btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveClick}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="input-group">
                                    <label className="input-label">ID (Англиар, зайгүй)</label>
                                    <input
                                        className="input"
                                        value={editingCategory.id}
                                        disabled={categories.some(c => c.id === editingCategory.id) && editingCategory.id !== ''}
                                        onChange={e => setEditingCategory({ ...editingCategory, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                        placeholder="Жнь: new_category"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Нэр (Монголоор)</label>
                                    <input
                                        className="input"
                                        value={editingCategory.label}
                                        onChange={e => setEditingCategory({ ...editingCategory, label: e.target.value })}
                                        placeholder="Жнь: Фитнес клуб"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Emoji Icon</label>
                                    <input
                                        className="input"
                                        value={editingCategory.icon}
                                        onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                                        placeholder="Жнь: 🏋️"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Тайлбар</label>
                                    <input
                                        className="input"
                                        value={editingCategory.desc}
                                        onChange={e => setEditingCategory({ ...editingCategory, desc: e.target.value })}
                                        placeholder="Жнь: Фитнес, спорт заал"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Эрэмбэ (Дараалал)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={editingCategory.order}
                                        onChange={e => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Болих</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? <Loader2 className="animate-spin" size={18} /> : 'Хадгалах'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={() => {
                        setShowSecurityModal(false);
                        if (pendingAction) pendingAction();
                        setPendingAction(null);
                    }}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setPendingAction(null);
                    }}
                />
            )}
        </div>
    );
}
