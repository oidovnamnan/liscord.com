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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--text-primary)' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-tint)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Settings size={22} className="text-primary" />
                        </div>
                        Динамик Модуль Тохиргоо
                    </h2>
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ height: '44px', padding: '0 24px' }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Хадгалах
                    </button>
                </div>

                <div style={{ background: 'var(--surface-1)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-md)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6, fontSize: '1rem', borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
                        Энд сонгосон модулиуд нь тухайн салбараар шинэ бизнес бүртгүүлэх үед автоматаар асаалттай (enabled) үүсэх болно. <br />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Жишээ нь: "Онлайн шоп" бизнес бүртгүүлэхэд таны энд сонгосон модулиуд автоматаар залгагдана.</span>
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {categories.map((category) => {
                            const key = category.id;
                            const activeMods = defaults[key] || [];

                            // Filter modules for this specific category (if applicable) OR show relevant ones
                            // For simplicity in Super Admin, we show all, but let's group them by their own category now

                            return (
                                <div key={key} style={{
                                    background: 'var(--surface-2)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--primary-light)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem'
                                        }}>
                                            {category.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{category.label}</h3>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{category.desc}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {LISCORD_MODULES.map(module => {
                                            const isActive = activeMods.includes(module.id);
                                            const Icon = (Icons as any)[module.icon] || Icons.Box;
                                            return (
                                                <div
                                                    key={module.id}
                                                    onClick={() => handleToggle(key, module.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        padding: '18px',
                                                        borderRadius: '16px',
                                                        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-primary)'}`,
                                                        background: isActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: isActive ? 'translateY(-2px)' : 'none',
                                                        boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '8px',
                                                        border: `2px solid ${isActive ? 'var(--primary)' : 'var(--text-muted)'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: isActive ? 'var(--primary)' : 'transparent',
                                                        transition: 'all 0.2s',
                                                        flexShrink: 0
                                                    }}>
                                                        {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                                        <div style={{
                                                            width: '44px',
                                                            height: '44px',
                                                            borderRadius: '12px',
                                                            background: isActive ? 'white' : 'var(--bg-soft)',
                                                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                                        }}>
                                                            <Icon size={22} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                {module.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                                {module.id === 'orders' || module.id === 'products' ? 'Үндсэн модуль' : 'Нэмэлт модуль'}
                                                            </span>
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

                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', marginTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--danger)' }}>🚨 Хуучин системийн шилжүүлэг (Migration)</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Өмнө нь бүртгүүлсэн бизнесүүдийн тохиргоог шинэ App Store (activeModules) бүтэц рүү хөрвүүлэх скрипт. Зөвхөн 1 удаа дарахад хангалттай.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ background: 'var(--danger)', color: 'white', border: 'none' }}
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
