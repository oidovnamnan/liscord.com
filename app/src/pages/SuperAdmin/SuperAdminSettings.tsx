import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { toast } from 'react-hot-toast';
import { systemSettingsService } from '../../services/db';
import { useSystemCategoriesStore } from '../../store';
import { LISCORD_MODULES } from '../../config/modules';
import * as Icons from 'lucide-react';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

export function SuperAdminSettings() {
    const { categories, fetchCategories } = useSystemCategoriesStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [moduleSearch, setModuleSearch] = useState('');
    const [defaults, setDefaults] = useState<Record<string, Record<string, 'core' | 'addon'>>>({});
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                // Fetch both module defaults and categories
                const [data] = await Promise.all([
                    systemSettingsService.getModuleDefaults(),
                    fetchCategories()
                ]);
                setDefaults(data);
            } catch (error) {
                console.error('Failed to fetch module settings:', error);
                toast.error('Тохиргоо татахад алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };
        fetchDefaults();
    }, [fetchCategories]);

    const filteredCategories = selectedCategoryId === 'all'
        ? categories
        : categories.filter(c => c.id === selectedCategoryId);

    const handleToggle = (categoryKey: string, moduleId: string) => {
        setDefaults(prev => {
            const categoryDefaults = prev[categoryKey] || {};
            const currentStatus = categoryDefaults[moduleId];

            const newCategoryDefaults = { ...categoryDefaults };

            if (!currentStatus) {
                // Off -> Core
                newCategoryDefaults[moduleId] = 'core';
            } else if (currentStatus === 'core') {
                // Core -> Addon
                newCategoryDefaults[moduleId] = 'addon';
            } else {
                // Addon -> Off
                delete newCategoryDefaults[moduleId];
            }

            return { ...prev, [categoryKey]: newCategoryDefaults };
        });
    };

    const handleSaveClick = () => {
        setPendingAction(() => handleSave);
        setShowSecurityModal(true);
    };

    const handleSave = async () => {
        setShowSecurityModal(false);
        setSaving(true);
        try {
            await systemSettingsService.updateModuleDefaults(defaults);
            toast.success('Модулийн тохиргоо амжилттай хадгалагдлаа');
        } catch (error) {
            console.error('Failed to save module defaults:', error);
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleMigrateClick = () => {
        if (!confirm('ХУУЧИН БИЗНЕСҮҮДИЙН СОНГОЛТЫГ ШИНЭЧЛЭХ\n\nЭнэ үйлдэл нь хуучин бүртгэгдсэн бүх бизнесүүдийг шалгаад, тэдний өмнө нь ашиглаж байсан функцүүдийг шинэ App Store (activeModules) систем рүүөрвүүлэх болно. Шууд дарж ажиллуулна уу?')) return;
        setPendingAction(() => handleMigrate);
        setShowSecurityModal(true);
    };

    const handleMigrate = async () => {
        setShowSecurityModal(false);
        setMigrating(true);
        try {
            const result = await systemSettingsService.migrateLegacyBusinesses();
            toast.success(`Нийт ${result.migratedCount} бизнесийг шинэ App Store систем рүү шилжүүллээ!`);
        } catch (error) {
            console.error('Migration failed:', error);
            toast.error('Шилжүүлэг хийх үед алдаа гарлаа');
        } finally {
            setMigrating(false);
        }
    };

    const handleMigrateV5 = async () => {
        setShowSecurityModal(false);
        setMigrating(true);
        try {
            const result = await systemSettingsService.migrateToSubcollections();
            toast.success(`Нийт ${result.migratedCount} бизнесийн тохиргоог Subcollection руу шилжүүллээ!`);
        } catch (error) {
            console.error('V5 Migration failed:', error);
            toast.error('Алхам 6 шилжүүлэг хийх үед алдаа гарлаа');
        } finally {
            setMigrating(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title={
                    <div className="flex items-center gap-2">
                        <span>Супер Админ: Модуль Тохиргоо</span>
                        <div className="info-tooltip-container">
                            <Icons.Info size={16} className="text-tertiary cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                            <div className="info-tooltip-content focus-ring text-left font-normal" style={{ textTransform: 'none' }}>
                                <p className="mb-2">Бизнесийн ангилал тус бүрээр шинэ бизнес бүртгүүлэх үед автоматаар асаалттай (enabled) үүсэх модулиудыг энд тохируулна.</p>
                                <div className="p-2 bg-black/5 rounded-lg text-xs font-semibold text-tertiary">
                                    Жишээ нь: "Карго" бизнес бүртгүүлэхэд таны энд сонгосон модулиуд автоматаар залгагдана.
                                </div>
                            </div>
                        </div>
                    </div>
                }
                subtitle="Бизнесийн төрлүүдэд харгалзах үндсэн болон нэмэлт модулиудын хуваарилалт"
                extra={
                    <div className="flex items-center gap-3">
                        <div className="input-group-premium" style={{ width: '240px' }}>
                            <select
                                className="premium-select"
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                            >
                                <option value="all">Бүх салбар / ангилал</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary premium-btn shadow-glow"
                            onClick={handleSaveClick}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Icons.Save size={18} />
                            )}
                            {saving ? 'Хадгалж байна...' : 'Тохиргоо Хадгалах'}
                        </button>
                    </div>
                }
            />

            <div className="page-content" style={{ marginTop: '0', paddingTop: '16px' }}>
                <div className="module-category-list">
                    {filteredCategories.map((category) => {
                        const key = category.id;
                        const activeMods = defaults[key] || {};

                        return (
                            <div key={key} className="module-category-card-v2">
                                <div className="category-header-compact">
                                    <div className="category-icon-box-sm">
                                        <span role="img" aria-label="icon">{category.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="category-title-sm">{category.label}</h3>
                                        <span className="category-desc-sm">{category.desc}</span>
                                    </div>
                                </div>

                                <div className="module-grid-header">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-base font-bold text-primary">Боломжит модулиуд</h4>
                                        <span className="badge badge-soft" style={{ fontSize: '10px', height: '18px' }}>{LISCORD_MODULES.length}</span>
                                    </div>

                                    <div className="search-bar-premium">
                                        <Icons.Search size={16} className="search-icon-fixed" />
                                        <input
                                            type="text"
                                            placeholder="Нэрээр хайх..."
                                            value={moduleSearch}
                                            onChange={(e) => setModuleSearch(e.target.value)}
                                        />
                                        {moduleSearch && (
                                            <button className="search-clear-btn" onClick={() => setModuleSearch('')}>
                                                <Icons.X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="module-grid">
                                    {LISCORD_MODULES.filter(m =>
                                        m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                                        m.id.toLowerCase().includes(moduleSearch.toLowerCase())
                                    ).map(module => {
                                        const status = activeMods[module.id];
                                        const isActive = !!status;
                                        const Icon = (Icons as any)[module.icon] || Icons.Box;
                                        return (
                                            <div
                                                key={module.id}
                                                onClick={() => handleToggle(key, module.id)}
                                                className={`module-item-card-v2 ${status || ''}`}
                                            >
                                                <div className="module-icon-box">
                                                    <Icon size={22} strokeWidth={2} />
                                                </div>

                                                <div className="module-content">
                                                    <span className="module-v2-name">{module.name}</span>
                                                    <div className="module-status-tags">
                                                        {status === 'core' ? (
                                                            <span className="status-tag core">ҮНДСЭН</span>
                                                        ) : status === 'addon' ? (
                                                            <span className="status-tag addon">НЭМЭЛТ</span>
                                                        ) : (
                                                            <span className="status-tag inactive">ТАТГАЛЗСАН</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`module-selection-indicator ${isActive ? 'active' : ''}`}>
                                                    {isActive && <Icons.Check size={14} strokeWidth={3} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="card migration-card no-padding" style={{ marginTop: '24px' }}>
                    <div className="migration-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
                        <div style={{ paddingRight: '24px', borderRight: '1px solid var(--border-primary)' }}>
                            <h3 className="text-lg font-bold text-danger mb-2">🚨 V1-V4: App Store Migration</h3>
                            <p className="text-secondary text-sm mb-4">
                                Хуучин бизнесүүдийг шинэ App Store (activeModules) бүтэц рүү хөрвүүлэх.
                            </p>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleMigrateClick}
                                disabled={migrating}
                            >
                                {migrating ? <Loader2 className="animate-spin" size={16} /> : 'Шилжүүлэг (V4)'}
                            </button>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary mb-2">🚀 V5: Subcollection Migration</h3>
                            <p className="text-secondary text-sm mb-4">
                                200 модулийн даацтай болгохын тулд тохиргоог Subcollection руу шилжүүлэх (Алхам 6).
                            </p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    if (!confirm('V5: MODULE SETTINGS MIGRATION\n\nБүх бизнесийн тохиргоог sub-collection руу шилжүүлэх үү?')) return;
                                    setPendingAction(() => handleMigrateV5);
                                    setShowSecurityModal(true);
                                }}
                                disabled={migrating}
                            >
                                {migrating ? <Loader2 className="animate-spin" size={16} /> : 'Шилжүүлэг (V5)'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={() => pendingAction && pendingAction()}
                    onClose={() => {
                        setShowSecurityModal(false);
                        setPendingAction(null);
                    }}
                />
            )}
        </div>
    );
}
