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
    const [defaults, setDefaults] = useState<Record<string, string[]>>({});

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

    const handleToggle = (categoryKey: string, moduleId: string) => {
        setDefaults(prev => {
            const current = prev[categoryKey] || [];
            if (current.includes(moduleId)) {
                return { ...prev, [categoryKey]: current.filter(id => id !== moduleId) };
            } else {
                return { ...prev, [categoryKey]: [...current, moduleId] };
            }
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
                <div className="table-actions">
                    <div className="section-header">
                        <div className="stats-icon-wrapper active-tint">
                            <Settings size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Динамик Модуль Тохиргоо</h2>
                    </div>
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Хадгалах
                    </button>
                </div>

                <div className="card">
                    <div className="p-6 border-b border-primary-light mb-8">
                        <p className="text-secondary leading-relaxed">
                            Энд сонгосон модулиуд нь тухайн салбараар шинэ бизнес бүртгүүлэх үед автоматаар асаалттай (enabled) үүсэх болно. <br />
                            <small className="text-tertiary">Жишээ нь: "Онлайн шоп" бизнес бүртгүүлэхэд таны энд сонгосон модулиуд автоматаар залгагдана.</small>
                        </p>
                    </div>

                    <div className="flex flex-col gap-8">
                        {categories.map((category) => {
                            const key = category.id;
                            const activeMods = defaults[key] || [];

                            return (
                                <div key={key} className="p-6 rounded-2xl bg-surface-2 border border-primary-light">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-2xl">
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{category.label}</h3>
                                            <span className="text-secondary text-sm">{category.desc}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {LISCORD_MODULES.map(module => {
                                            const isActive = activeMods.includes(module.id);
                                            const Icon = (Icons as any)[module.icon] || Icons.Box;
                                            return (
                                                <div
                                                    key={module.id}
                                                    onClick={() => handleToggle(key, module.id)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isActive
                                                            ? 'border-primary bg-primary-light shadow-sm'
                                                            : 'border-transparent bg-bg-secondary hover:bg-surface-3'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isActive ? 'border-primary bg-primary' : 'border-neutral-300'
                                                        }`}>
                                                        {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white text-primary' : 'bg-surface-1 text-secondary'
                                                            }`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-secondary'}`}>
                                                                {module.name}
                                                            </span>
                                                            <span className="text-[10px] uppercase tracking-wider opacity-60">
                                                                {module.id === 'orders' || module.id === 'products' ? 'Core' : 'Add-on'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </tr>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card mt-8 border-danger-light overflow-hidden">
                    <div className="p-6 flex items-center justify-between gap-6 bg-red-50/10">
                        <div>
                            <h3 className="text-lg font-bold text-danger mb-2">🚨 Хуучин системийн шилжүүлэг (Migration)</h3>
                            <p className="text-secondary text-sm max-w-2xl">
                                Өмнө нь бүртгүүлсэн бизнесүүдийн тохиргоог шинэ App Store (activeModules) бүтэц рүү хөрвүүлэх скрипт. Зөвхөн 1 удаа дарахад хангалттай.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary bg-danger border-none hover:bg-red-600"
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
