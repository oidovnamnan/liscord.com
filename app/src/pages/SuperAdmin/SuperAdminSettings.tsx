import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { toast } from 'react-hot-toast';
import { systemSettingsService } from '../../services/db';
import { useSystemCategoriesStore } from '../../store';
import { LISCORD_MODULES } from '../../config/modules';
import * as Icons from 'lucide-react';

export function SuperAdminSettings() {
    const { categories, fetchCategories } = useSystemCategoriesStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [defaults, setDefaults] = useState<Record<string, Record<string, 'core' | 'addon'>>>({});

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

    const handleSave = async () => {
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

    const handleMigrate = async () => {
        if (!confirm('ХУУЧИН БИЗНЕСҮҮДИЙН СОНГОЛТЫГ ШИНЭЧЛЭХ\n\nЭнэ үйлдэл нь хуучин бүртгэгдсэн бүх бизнесүүдийг шалгаад, тэдний өмнө нь ашиглаж байсан функцүүдийг шинэ App Store (activeModules) систем рүүөрвүүлэх болно. Шууд дарж ажиллуулна уу?')) return;

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
                title="Супер Админ: Тохиргоо"
                subtitle="Бизнесийн ангилал тус бүрээр автоматаар асуух модулиудын хуваарилалт"
            />

            <div className="page-content">
                <div className="table-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div className="section-header" style={{ marginBottom: 0 }}>
                        <div className="stats-icon-wrapper active-tint">
                            <Settings size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Динамик Модуль Тохиргоо</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <select
                            className="input-field"
                            style={{
                                minWidth: '220px',
                                height: '42px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border-primary)',
                                borderRadius: '12px',
                                padding: '0 12px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="all">Бүх салбар / ангилал</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>

                        <button
                            className="btn btn-primary gradient-btn"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ height: '42px', padding: '0 20px' }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Хадгалах
                        </button>
                    </div>
                </div>

                <div className="card no-padding overflow-hidden">
                    <div className="settings-description">
                        <p className="text-secondary leading-relaxed">
                            Энд сонгосон модулиуд нь тухайн салбараар шинэ бизнес бүртгүүлэх үед автоматаар асаалттай (enabled) үүсэх болно. <br />
                            <small className="text-tertiary">Жишээ нь: "Онлайн шоп" бизнес бүртгүүлэхэд таны энд сонгосон модулиуд автоматаар залгагдана.</small>
                        </p>
                    </div>

                    <div className="module-category-list" style={{ padding: '0 24px 24px 24px' }}>
                        {filteredCategories.map((category) => {
                            const key = category.id;
                            const activeMods = defaults[key] || {};

                            return (
                                <div key={key} className="module-category-card">
                                    <div className="category-header">
                                        <div className="category-icon-box">
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h3 className="module-name" style={{ fontSize: '1.1rem' }}>{category.label}</h3>
                                            <span className="text-secondary text-sm">{category.desc}</span>
                                        </div>
                                    </div>

                                    <div className="module-grid">
                                        {LISCORD_MODULES.map(module => {
                                            const status = activeMods[module.id]; // 'core' | 'addon' | undefined
                                            const isActive = !!status;
                                            const Icon = (Icons as any)[module.icon] || Icons.Box;
                                            return (
                                                <div
                                                    key={module.id}
                                                    onClick={() => handleToggle(key, module.id)}
                                                    className={`module-item-card ${status || ''}`}
                                                >
                                                    <div className="module-check">
                                                        {isActive && <div className="module-check-dot" />}
                                                    </div>

                                                    <div className="module-icon-box">
                                                        <Icon size={20} />
                                                    </div>

                                                    <div className="module-info">
                                                        <span className={`module-name ${!status ? 'text-tertiary' : ''}`}>{module.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {status === 'core' ? (
                                                                <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 6px' }}>CORE / ҮНДСЭН</span>
                                                            ) : status === 'addon' ? (
                                                                <span className="badge" style={{ fontSize: '9px', padding: '1px 6px', background: '#6366f1', color: 'white' }}>ADD-ON / НЭМЭЛТ</span>
                                                            ) : (
                                                                <span className="text-tertiary" style={{ fontSize: '9px', letterSpacing: '0.05em' }}>АШИГЛАХГҮЙ</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


                <div className="card migration-card no-padding">
                    <div className="migration-content">
                        <div>
                            <h3 className="text-lg font-bold text-danger mb-2">🚨 Хуучин системийн шилжүүлэг (Migration)</h3>
                            <p className="text-secondary text-sm max-w-2xl">
                                Өмнө нь бүртгүүлсэн бизнесүүдийн тохиргоог шинэ App Store (activeModules) бүтэц рүү хөрвүүлэх скрипт. Зөвхөн 1 удаа дарахад хангалттай.
                            </p>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={handleMigrate}
                            disabled={migrating}
                        >
                            {migrating ? <Loader2 className="animate-spin" size={18} /> : 'Шилжүүлэг эхлүүлэх'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
