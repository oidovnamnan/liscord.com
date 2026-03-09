import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { toast } from 'react-hot-toast';
import { systemSettingsService } from '../../services/db';
import { useSystemCategoriesStore } from '../../store';
import { LISCORD_MODULES } from '../../config/modules';
import * as Icons from 'lucide-react';
import { SecurityModal } from '../../components/common/SecurityModal';
import { db } from '../../services/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { BusinessCategoryConfig } from '../../types';
import './SuperAdmin.css';

export function SuperAdminSettings() {
    const { categories, fetchCategories, refresh } = useSystemCategoriesStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [moduleSearch, setModuleSearch] = useState('');
    const [defaults, setDefaults] = useState<Record<string, Record<string, 'core' | 'addon'>>>({});
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [localCategories, setLocalCategories] = useState<BusinessCategoryConfig[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
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
        init();
    }, [fetchCategories]);

    useEffect(() => {
        if (categories.length > 0 && !hasUnsavedChanges) {
            setLocalCategories(categories);
        }
        // On mount, if fetched but categories exist, sync immediately
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, hasUnsavedChanges]);

    const handleBulkStatusChange = (isActive: boolean) => {
        if (selectedIds.length === 0) return;
        setLocalCategories(prev => prev.map(cat =>
            selectedIds.includes(cat.id) ? { ...cat, isActive } : cat
        ));
        setHasUnsavedChanges(true);
    };

    const handleSingleStatusToggle = (id: string) => {
        setLocalCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        ));
        setHasUnsavedChanges(true);
    };

    const categoriesToDisplay = [...(localCategories.length > 0 ? localCategories : categories)]
        .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));

    const filteredCategories = selectedCategoryId === 'all'
        ? categoriesToDisplay
        : categoriesToDisplay.filter(c => c.id === selectedCategoryId);

    const handleToggle = (categoryKey: string, moduleId: string) => {
        setDefaults(prev => {
            const categoryDefaults = prev[categoryKey] || {};
            const currentStatus = categoryDefaults[moduleId];
            const newCategoryDefaults = { ...categoryDefaults };

            if (!currentStatus) {
                newCategoryDefaults[moduleId] = 'core';
            } else if (currentStatus === 'core') {
                newCategoryDefaults[moduleId] = 'addon';
            } else {
                delete newCategoryDefaults[moduleId];
            }

            setHasUnsavedChanges(true);
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
            const batch = writeBatch(db);

            const defaultsRef = doc(db, 'system_settings', 'modules');
            batch.set(defaultsRef, defaults);

            localCategories.forEach(cat => {
                const catRef = doc(db, 'system_categories', cat.id);
                batch.set(catRef, {
                    ...cat,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });

            await batch.commit();
            setHasUnsavedChanges(false);
            await refresh();
            toast.success('Бүх тохиргоо амжилттай хадгалагдлаа');
        } catch (error) {
            console.error('Failed to save settings:', error);
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

    // Stats for header
    const totalModules = LISCORD_MODULES.length;
    const totalCategories = categoriesToDisplay.length;
    const activeCategories = categoriesToDisplay.filter(c => c.isActive).length;

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="super-admin-page animate-fade-in">
            <Header
                title={
                    <div className="flex items-center gap-3">
                        <h1 className="text-base font-bold tracking-tight text-primary">Модуль Тохиргоо</h1>
                        <div className="ms-header-stats">
                            <span className="ms-stat-pill">{totalModules} модуль</span>
                            <span className="ms-stat-pill active">{activeCategories}/{totalCategories} салбар</span>
                        </div>
                    </div>
                }
                extra={
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <span className="ms-unsaved-indicator">
                                <span className="ms-unsaved-dot" />
                                Хадгалаагүй
                            </span>
                        )}
                        <button
                            className="btn-pro btn-pro-primary"
                            onClick={handleSaveClick}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Icons.Save size={14} />}
                            <span>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</span>
                        </button>
                    </div>
                }
            />

            <div className="page-content-pro">
                {/* ─── Sidebar ─── */}
                <aside className="pro-sidebar">
                    <div className="pro-sidebar-header">
                        <Icons.Layers size={12} />
                        <span>БИЗНЕС САЛБАРУУД</span>
                    </div>
                    <nav className="pro-nav">
                        <button
                            className={`pro-nav-item ${selectedCategoryId === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategoryId('all')}
                        >
                            <Icons.LayoutGrid size={16} />
                            <span>Бүх салбарууд</span>
                            <span className="ms-nav-count">{totalCategories}</span>
                        </button>

                        <div className="pro-nav-divider" />

                        {/* Bulk select controls */}
                        <div className="ms-bulk-controls">
                            <label className="ms-checkbox-label">
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={selectedIds.length === categoriesToDisplay.length && categoriesToDisplay.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(categoriesToDisplay.map(c => c.id));
                                        else setSelectedIds([]);
                                    }}
                                />
                                <span>Бүгдийг сонгох</span>
                            </label>
                            {selectedIds.length > 0 && (
                                <div className="ms-bulk-actions">
                                    <button className="ms-bulk-btn on" onClick={() => handleBulkStatusChange(true)}>
                                        <Icons.Eye size={10} /> Идэвхтэй
                                    </button>
                                    <button className="ms-bulk-btn off" onClick={() => handleBulkStatusChange(false)}>
                                        <Icons.EyeOff size={10} /> Нуух
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Category items */}
                        {categoriesToDisplay.map((category) => {
                            const modCount = Object.keys(defaults[category.id] || {}).length;
                            return (
                                <div key={category.id} className="ms-cat-item-row">
                                    <input
                                        type="checkbox"
                                        className="custom-checkbox ms-cat-check"
                                        checked={selectedIds.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds([...selectedIds, category.id]);
                                            else setSelectedIds(selectedIds.filter(id => id !== category.id));
                                        }}
                                    />
                                    <button
                                        className={`pro-nav-item ms-cat-btn ${selectedCategoryId === category.id ? 'active' : ''} ${!category.isActive ? 'ms-disabled' : ''}`}
                                        onClick={() => setSelectedCategoryId(category.id)}
                                    >
                                        <span className="ms-cat-emoji">{category.icon}</span>
                                        <span className="ms-cat-name">{category.label}</span>
                                        {modCount > 0 && <span className="ms-nav-count">{modCount}</span>}
                                    </button>
                                    <label className="ios-switch ms-cat-toggle" title={category.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}>
                                        <input
                                            type="checkbox"
                                            checked={category.isActive}
                                            onChange={() => handleSingleStatusToggle(category.id)}
                                        />
                                        <span className="ios-slider"></span>
                                    </label>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* ─── Main Content ─── */}
                <main className="pro-main-content">
                    {selectedCategoryId === 'all' ? (
                        <>
                            <div className="ms-section-header">
                                <h2><Icons.Grid3X3 size={18} /> Бүх салбарууд</h2>
                                <p>{activeCategories} идэвхтэй · {totalCategories - activeCategories} нуусан</p>
                            </div>
                            <div className="pro-summary-grid">
                                {categoriesToDisplay.map((category) => {
                                    const activeCount = Object.keys(defaults[category.id] || {}).length;
                                    const coreCount = Object.values(defaults[category.id] || {}).filter(v => v === 'core').length;
                                    const addonCount = activeCount - coreCount;
                                    return (
                                        <div
                                            key={category.id}
                                            className={`ms-summary-card ${!category.isActive ? 'ms-card-disabled' : ''}`}
                                            onClick={() => setSelectedCategoryId(category.id)}
                                        >
                                            <div className="ms-card-top">
                                                <div className="ms-card-icon">{category.icon}</div>
                                                {!category.isActive && (
                                                    <span className="ms-hidden-badge">
                                                        <Icons.EyeOff size={10} /> НУУСАН
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="ms-card-title">{category.label}</h3>
                                            {category.desc && <p className="ms-card-desc">{category.desc}</p>}
                                            <div className="ms-card-footer">
                                                <div className="ms-card-stats">
                                                    {coreCount > 0 && <span className="ms-stat core">{coreCount} үндсэн</span>}
                                                    {addonCount > 0 && <span className="ms-stat addon">{addonCount} нэмэлт</span>}
                                                    {activeCount === 0 && <span className="ms-stat empty">Тохируулаагүй</span>}
                                                </div>
                                                <Icons.ChevronRight size={14} className="ms-card-arrow" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="ms-detail-wrapper animate-slide-up">
                            {filteredCategories.map((category) => {
                                const key = category.id;
                                const activeMods = defaults[key] || {};
                                const coreCount = Object.values(activeMods).filter(v => v === 'core').length;
                                const addonCount = Object.values(activeMods).filter(v => v === 'addon').length;

                                return (
                                    <div key={key}>
                                        {/* Detail Header */}
                                        <div className="ms-detail-header">
                                            <div className="ms-detail-title-row">
                                                <button className="ms-back-btn" onClick={() => setSelectedCategoryId('all')}>
                                                    <Icons.ArrowLeft size={16} />
                                                </button>
                                                <div className="ms-detail-icon">{category.icon}</div>
                                                <div>
                                                    <h2 className="ms-detail-title">{category.label}</h2>
                                                    {category.desc && <p className="ms-detail-desc">{category.desc}</p>}
                                                </div>
                                            </div>
                                            <div className="ms-detail-meta">
                                                <div className="ms-detail-badges">
                                                    <span className="ms-badge core"><Icons.Star size={10} /> {coreCount} Үндсэн</span>
                                                    <span className="ms-badge addon"><Icons.Puzzle size={10} /> {addonCount} Нэмэлт</span>
                                                    <span className="ms-badge total">{LISCORD_MODULES.length} нийт</span>
                                                </div>
                                                <div className="ms-search-box">
                                                    <Icons.Search size={14} />
                                                    <input
                                                        type="text"
                                                        placeholder="Модуль хайх..."
                                                        value={moduleSearch}
                                                        onChange={(e) => setModuleSearch(e.target.value)}
                                                    />
                                                    {moduleSearch && (
                                                        <button className="search-clear-btn" onClick={() => setModuleSearch('')}>
                                                            <Icons.X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Module Grid */}
                                        <div className="pro-module-grid">
                                            {LISCORD_MODULES.filter(m =>
                                                m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                                                m.id.toLowerCase().includes(moduleSearch.toLowerCase())
                                            ).sort((a, b) => {
                                                const aStatus = activeMods[a.id];
                                                const bStatus = activeMods[b.id];
                                                const aActive = !!aStatus;
                                                const bActive = !!bStatus;

                                                if (aActive !== bActive) return aActive ? -1 : 1;
                                                if (aActive && bActive) {
                                                    if (aStatus === bStatus) return 0;
                                                    return aStatus === 'core' ? -1 : 1;
                                                }
                                                return 0;
                                            }).map(module => {
                                                const status = activeMods[module.id];
                                                const isActive = !!status;
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const Icon = (Icons as any)[module.icon] || Icons.Box;

                                                return (
                                                    <div
                                                        key={module.id}
                                                        onClick={() => handleToggle(key, module.id)}
                                                        className={`pro-module-card ${isActive ? 'active' : ''} ${status || ''}`}
                                                    >
                                                        <div className="pro-module-icon">
                                                            <Icon size={24} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="pro-module-name">{module.name}</span>
                                                            <div className="pro-module-type">
                                                                {status === 'core' ? '⭐ Үндсэн' : status === 'addon' ? '🧩 Нэмэлт' : 'Модуль'}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className={`pro-status-btn ${isActive ? 'active' : 'inactive'}`}
                                                        >
                                                            {status === 'core' ? 'Core' : status === 'addon' ? 'Addon' : 'Нэмэх'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Migration Tools */}
                                        <div className="ms-migration-section">
                                            <h4 className="ms-migration-title">
                                                <Icons.Wrench size={14} /> Системийн хэрэгслүүд
                                            </h4>
                                            <div className="ms-migration-grid">
                                                <div className="ms-migration-card warning">
                                                    <div className="ms-mig-header">
                                                        <Icons.AlertTriangle size={16} />
                                                        <span>V1-V4: App Store Migration</span>
                                                    </div>
                                                    <p>Хуучин бизнесүүдийг шинэ App Store бүтэц рүү хөрвүүлэх.</p>
                                                    <button
                                                        className="btn btn-outline btn-xs"
                                                        onClick={handleMigrateClick}
                                                        disabled={migrating}
                                                    >
                                                        {migrating ? <Loader2 className="animate-spin" size={12} /> : 'Шилжүүлэг (V4)'}
                                                    </button>
                                                </div>
                                                <div className="ms-migration-card primary">
                                                    <div className="ms-mig-header">
                                                        <Icons.Rocket size={16} />
                                                        <span>V5: Subcollection Migration</span>
                                                    </div>
                                                    <p>200 модулийн даацтай болгохын тулд тохиргоог Subcollection руу шилжүүлэх.</p>
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
                                );
                            })}
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
