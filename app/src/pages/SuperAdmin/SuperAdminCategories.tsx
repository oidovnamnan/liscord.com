import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useSystemCategoriesStore } from '../../store';
import { businessCategoryService } from '../../services/db';
import { Loader2, Plus, Edit2, Trash2, PowerOff, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { BusinessCategoryConfig } from '../../types';

export function SuperAdminCategories() {
    const { categories, loading, fetchCategories, refresh } = useSystemCategoriesStore();
    const [editingCategory, setEditingCategory] = useState<BusinessCategoryConfig | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory || !editingCategory.id || !editingCategory.label) {
            toast.error('Мэдээллийг гүйцэд оруулна уу');
            return;
        }

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
        if (!window.confirm('Энэ ангиллыг устгах уу? (Буцаах боломжгүй)')) return;
        try {
            await businessCategoryService.deleteCategory(id);
            toast.success('Устгагдлаа');
            refresh();
        } catch (error) {
            toast.error('Устгахад алдаа гарлаа');
        }
    };

    const handleSeedCategories = async () => {
        if (!window.confirm('Анхны 30+ ангиллуудыг өгөгдлийн сан руу хуулах уу? (Хуучин дата байхгүй бол ашиглана)')) return;

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
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                    <button className="btn btn-outline" onClick={handleSeedCategories} disabled={saving}>
                        <Loader2 size={18} className={saving ? "animate-spin" : "hidden"} style={{ display: saving ? 'inline-block' : 'none' }} />
                        Анхны өгөгдөл (Seed)
                    </button>
                    <button className="btn btn-primary gradient-btn" onClick={() => handleOpenModal()}>
                        <Plus size={18} /> Шинэ ангилал нэмэх
                    </button>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Icon</th>
                                <th style={{ padding: '16px' }}>ID Code</th>
                                <th style={{ padding: '16px' }}>Нэр</th>
                                <th style={{ padding: '16px' }}>Тайлбар</th>
                                <th style={{ padding: '16px' }}>Төлөв</th>
                                <th style={{ padding: '16px', textAlign: 'right' }}>Үйлдэл</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: cat.isActive ? 1 : 0.6 }}>
                                    <td style={{ padding: '16px', fontSize: '1.5rem' }}>{cat.icon}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{cat.id}</td>
                                    <td style={{ padding: '16px', fontWeight: 600 }}>{cat.label}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{cat.desc}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span className={`badge badge-${cat.isActive ? 'success' : 'neutral'}`}>
                                            {cat.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
                        <form onSubmit={handleSave}>
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
        </div>
    );
}
