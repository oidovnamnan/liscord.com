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
        const fetchDefaults = async () => {
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
        fetchDefaults();
    }, [fetchCategories]);

    useEffect(() => {
        if (categories.length > 0 && !hasUnsavedChanges) {
            setLocalCategories(categories);
        }
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

            // 1. Update module defaults
            const defaultsRef = doc(db, 'system_settings', 'modules');
            batch.set(defaultsRef, defaults);

            // 2. Update all category configurations to ensure they exist and persist in DB
            localCategories.forEach(cat => {
                const catRef = doc(db, 'system_categories', cat.id);
                batch.set(catRef, {
                    ...cat,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });

            await batch.commit();
            setHasUnsavedChanges(false);

            // Critical: Reset store fetch state before calling refresh
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
                            <span>{saving ? '...' : (hasUnsavedChanges ? 'Тохиргоог Хадгалах' : 'Хадгалах')}</span>
                            {hasUnsavedChanges && <div className="unsaved-dot" />}
                        </button>
                    </div>
                }
            />

            <div className="page-content-pro">
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
                        <div className="px-3 py-2 flex items-center justify-between bg-surface-2 mb-2 mx-2 rounded-xl border border-primary/5">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={selectedIds.length === categoriesToDisplay.length && categoriesToDisplay.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedIds(categoriesToDisplay.map(c => c.id));
                                        else setSelectedIds([]);
                                    }}
                                />
                                <span className="text-[10px] font-heavy opacity-40 uppercase tracking-wider">Бүгдийг</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold opacity-30 uppercase">Toggle</span>
                                <label className="ios-switch">
                                    <input
                                        type="checkbox"
                                        disabled={selectedIds.length === 0}
                                        checked={selectedIds.length > 0 && selectedIds.every(id => categoriesToDisplay.find(c => c.id === id)?.isActive)}
                                        onChange={(e) => handleBulkStatusChange(e.target.checked)}
                                    />
                                    <span className="ios-slider"></span>
                                </label>
                            </div>
                        </div>

                        {categoriesToDisplay.map((category) => (
                            <div key={category.id} className="flex items-center group pr-2">
                                <div className="pl-4 pr-1">
                                    <input
                                        type="checkbox"
                                        className="custom-checkbox"
                                        checked={selectedIds.includes(category.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds([...selectedIds, category.id]);
                                            else setSelectedIds(selectedIds.filter(id => id !== category.id));
                                        }}
                                    />
                                </div>
                                <button
                                    className={`pro-nav-item flex-1 ${selectedCategoryId === category.id ? 'active' : ''} ${!category.isActive ? 'opacity-40 grayscale' : ''}`}
                                    onClick={() => setSelectedCategoryId(category.id)}
                                    style={{ marginLeft: 0, marginRight: 0 }}
                                >
                                    <span className="category-emoji">{category.icon}</span>
                                    <span className="truncate">{category.label}</span>
                                </button>
                                <div className="category-item-toggle">
                                    <label className="ios-switch">
                                        <input
                                            type="checkbox"
                                            checked={category.isActive}
                                            onChange={() => handleSingleStatusToggle(category.id)}
                                        />
                                        <span className="ios-slider"></span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                <main className="pro-main-content">
                    {selectedCategoryId === 'all' ? (
                        <div className="pro-summary-grid">
                            {categoriesToDisplay.map((category) => {
                                const activeCount = Object.keys(defaults[category.id] || {}).length;
                                return (
                                    <div
                                        key={category.id}
                                        className={`pro-summary-card ${!category.isActive ? 'is-disabled' : ''}`}
                                        onClick={() => setSelectedCategoryId(category.id)}
                                    >
                                        <div className="pro-icon-md mb-4" style={{ position: 'relative', fontSize: '32px', width: '64px', height: '64px', borderRadius: '16px' }}>
                                            {category.icon}
                                            {!category.isActive && (
                                                <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', fontWeight: 800 }}>HIDDEN</div>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-primary mb-1">{category.label}</h3>
                                        <div className="mt-auto flex items-center justify-between pt-4 border-top border-primary opacity-80">
                                            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{activeCount} modules</span>
                                            <Icons.ArrowRight size={14} className="text-secondary" />
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
                                                    <h2 className="text-sm font-bold">{category.label}</h2>
                                                    <p className="text-[10px] text-secondary opacity-70">{category.desc}</p>
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
                                                const Icon = (Icons as any)[module.icon] || Icons.Box;

                                                return (
                                                    <div
                                                        key={module.id}
                                                        onClick={() => handleToggle(key, module.id)}
                                                        className={`pro-module-card ${isActive ? 'active' : ''} ${status || ''}`}
                                                    >
                                                        <div className="pro-module-icon">
                                                            <Icon size={28} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="pro-module-name">{module.name}</span>
                                                            <div className="pro-module-type">
                                                                {status === 'core' ? 'Үндсэн' : status === 'addon' ? 'Нэмэлт' : 'Module'}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className={`pro-status-btn ${isActive ? 'active' : 'inactive'}`}
                                                        >
                                                            {isActive ? 'Active' : 'Get'}
                                                        </button>
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
