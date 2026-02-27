import { useState, useEffect } from 'react';
import { useSystemCategoriesStore } from '../../store';
import { businessCategoryService } from '../../services/db';
import { Plus, Edit2, Trash2, PowerOff, Power, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { BusinessCategoryConfig } from '../../types';
import { SecurityModal } from '../../components/common/SecurityModal';
import { Header } from '../../components/layout/Header';

export function SuperAdminCategories() {
    const { categories, loading, fetchCategories, refresh } = useSystemCategoriesStore();
    const [editingCategory, setEditingCategory] = useState<BusinessCategoryConfig | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

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
        } catch (error) {
            toast.error('Үйлдэл амжилтгүй');
        }
    };

    const handleDelete = async (id: string) => {
        setPendingAction(() => async () => {
            try {
                await businessCategoryService.deleteCategory(id);
                toast.success('Устгагдлаа');
                refresh();
            } catch (error) {
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

    if (loading && categories.length === 0) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Ангиллууд уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Бизнесийн Ангиллууд"
                subtitle="Системд бүртгүүлэх боломжтой бизнесийн төрлүүд"
            />

            <div className="page-content">
                <div className="table-actions">
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={handleSeedCategories} disabled={saving}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Анхны өгөгдөл (Seed)
                        </button>
                    </div>
                    <button className="btn btn-primary gradient-btn" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Шинэ ангилал нэмэх
                    </button>
                </div>

                <div className="card no-padding overflow-hidden">
                    <table className="super-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Icon</th>
                                <th>ID Code</th>
                                <th>Нэр</th>
                                <th>Тайлбар</th>
                                <th>Төлөв</th>
                                <th className="text-right">Үйлдэл</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} className={cat.isActive ? '' : 'text-tertiary'}>
                                    <td style={{ fontSize: '1.5rem' }}>{cat.icon}</td>
                                    <td className="font-mono text-xs">{cat.id}</td>
                                    <td className="font-bold">{cat.label}</td>
                                    <td className="text-secondary">{cat.desc}</td>
                                    <td>
                                        <span className={`badge ${cat.isActive ? 'badge-delivered' : 'badge-neutral'}`}>
                                            {cat.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions justify-end">
                                            <button
                                                className="btn-icon"
                                                title={cat.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                                                onClick={() => handleToggleActive(cat)}
                                            >
                                                {cat.isActive ? <PowerOff size={16} /> : <Power size={16} className="text-success" />}
                                            </button>
                                            <button className="btn-icon" onClick={() => handleOpenModal(cat)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon text-danger" onClick={() => handleDelete(cat.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
