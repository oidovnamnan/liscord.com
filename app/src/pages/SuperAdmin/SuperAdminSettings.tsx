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
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold tracking-tight text-primary">Модуль Тохиргоо</h1>
                    </div>
                }
                extra={
                    <div className="flex items-center gap-2">
                        <button
                            className="btn-pro btn-pro-primary"
                            onClick={handleSaveClick}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Icons.Save size={14} />}
                            <span>{saving ? '...' : 'Хадгалах'}</span>
                        </button>
                    </div>
                }
            />

            <div className="page-content-pro">
                {/* Master Navigation Sidebar */}
                <aside className="pro-sidebar">
                    <div className="pro-sidebar-header">
                        <Icons.Filter size={14} className="opacity-50" />
                        <span>САЛБАРУУД</span>
                    </div>
                    <nav className="pro-nav">
                        <button
                            className={`pro-nav-item ${selectedCategoryId === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategoryId('all')}
                        >
                            <Icons.LayoutGrid size={16} />
                            <span>Ерөнхий дүр зураг</span>
                        </button>
                        <div className="pro-nav-divider" />
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={`pro-nav-item ${selectedCategoryId === category.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategoryId(category.id)}
                            >
                                <span className="category-emoji">{category.icon}</span>
                                <span className="truncate">{category.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Detail Content Area */}
                <main className="pro-main-content">
                    {selectedCategoryId === 'all' ? (
                        <div className="pro-summary-grid">
                            {categories.map((category) => {
                                const activeCount = Object.keys(defaults[category.id] || {}).length;
                                return (
                                    <div
                                        key={category.id}
                                        className="pro-summary-card"
                                        onClick={() => setSelectedCategoryId(category.id)}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="pro-icon-sm">{category.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold truncate">{category.label}</h3>
                                                <p className="text-[10px] text-secondary opacity-60 truncate">{category.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase font-bold text-tertiary">Тохируулсан</span>
                                            <span className="badge-mini">{activeCount} модуль</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="pro-detail-wrapper">
                            {filteredCategories.map((category) => {
                                const key = category.id;
                                const activeMods = defaults[key] || {};

                                return (
                                    <div key={key} className="animate-slide-up">
                                        <div className="pro-detail-header">
                                            <div className="flex items-center gap-3">
                                                <div className="pro-icon-md">{category.icon}</div>
                                                <div>
                                                    <h2 className="text-lg font-bold">{category.label}</h2>
                                                    <p className="text-xs text-secondary">{category.desc}</p>
                                                </div>
                                            </div>
                                            <div className="pro-search-box">
                                                <Icons.Search size={14} className="opacity-40" />
                                                <input
                                                    type="text"
                                                    placeholder="Модуль хайх..."
                                                    value={moduleSearch}
                                                    onChange={(e) => setModuleSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="pro-module-grid">
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
                                                        className={`pro-module-card ${isActive ? 'active' : ''} ${status || ''}`}
                                                    >
                                                        <div className="pro-module-icon">
                                                            <Icon size={18} strokeWidth={2} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="pro-module-name">{module.name}</span>
                                                                {isActive && (
                                                                    <div className="pro-check-dot">
                                                                        <Icons.Check size={10} strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="pro-module-type">
                                                                {status === 'core' ? 'ҮНДСЭН' : status === 'addon' ? 'НЭМЭЛТ' : 'Идэвхгүй'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="card migration-card no-padding" style={{ marginTop: '32px', borderStyle: 'dashed', background: 'transparent' }}>
                                <div className="migration-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
                                    <div style={{ paddingRight: '24px', borderRight: '1px solid var(--border-primary)' }}>
                                        <h3 className="text-sm font-bold text-danger mb-2">🚨 V1-V4: App Store Migration</h3>
                                        <p className="text-secondary text-[11px] mb-4">
                                            Хуучин бизнесүүдийг шинэ App Store (activeModules) бүтэц рүү хөрвүүлэх.
                                        </p>
                                        <button
                                            className="btn btn-outline btn-xs"
                                            onClick={handleMigrateClick}
                                            disabled={migrating}
                                        >
                                            {migrating ? <Loader2 className="animate-spin" size={12} /> : 'Шилжүүлэг (V4)'}
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-primary mb-2">🚀 V5: Subcollection Migration</h3>
                                        <p className="text-secondary text-[11px] mb-4">
                                            200 модулийн даацтай болгохын тулд тохиргоог Subcollection руу шилжүүлэх.
                                        </p>
                                        <button
                                            className="btn btn-primary btn-xs"
                                            onClick={() => {
                                                if (!confirm('V5: MODULE SETTINGS MIGRATION\n\nБүх бизнесийн тохиргоог sub-collection руу шилжүүлэх үү?')) return;
                                                setPendingAction(() => handleMigrateV5);
                                                setShowSecurityModal(true);
                                            }}
                                            disabled={migrating}
                                        >
                                            {migrating ? <Loader2 className="animate-spin" size={12} /> : 'Шилжүүлэг (V5)'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
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
