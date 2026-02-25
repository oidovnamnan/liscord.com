import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { toast } from 'react-hot-toast';
import { systemSettingsService } from '../../services/db';
import { useSystemCategoriesStore } from '../../store';
import { ALL_MODULES } from '../Settings/components/ModulesTab';

export function SuperAdminSettings() {
    const { categories } = useSystemCategoriesStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [defaults, setDefaults] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                const data = await systemSettingsService.getModuleDefaults();
                setDefaults(data);
            } catch (error) {
                console.error('Failed to fetch module defaults:', error);
                toast.error('Тохиргоо татахад алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };
        fetchDefaults();
    }, []);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={20} className="text-primary" />
                        Динамик Модуль Тохиргоо (Default Configurations)
                    </h2>
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Хадгалах
                    </button>
                </div>

                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                        Энд сонгосон модулиуд нь тухайн салбараар шинэ бизнес бүртгүүлэх үед автоматаар асаалттай (enabled) үүсэх болно. <br />
                        Жишээ нь: "Онлайн шоп" бизнес бүртгүүлэхэд таны энд сонгосон модулиуд автоматаар залгагдана.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {categories.map((category) => {
                            const key = category.id;
                            const activeMods = defaults[key] || [];
                            return (
                                <div key={key} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{category.label}</h3>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>({category.desc})</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                        {ALL_MODULES.map(module => {
                                            const isActive = activeMods.includes(module.id);
                                            const Icon = module.icon;
                                            return (
                                                <label
                                                    key={module.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`,
                                                        background: isActive ? 'var(--surface-2)' : 'transparent',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        opacity: isActive ? 1 : 0.7
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => handleToggle(key, module.id)}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                        <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-secondary)'} />
                                                        <span style={{ fontWeight: isActive ? 600 : 400, fontSize: '0.85rem' }}>
                                                            {module.label}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
