import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { globalSettingsService } from '../../services/db';
import type { GlobalSettings } from '../../services/db';
import { Loader2, Save, MessageSquare, Shield, AlertTriangle, Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '../../store';
import { toast } from 'react-hot-toast';
import { SecurityModal } from '../../components/common/SecurityModal';

export function SuperAdminGlobalSettings() {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { theme, setTheme } = useUIStore();
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await globalSettingsService.getSettings();
                setSettings(data);
            } catch (error) {
                console.error('Failed to fetch global settings:', error);
                toast.error('Тохиргоо татахад алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setShowSecurityModal(true);
    };

    const handleSave = async () => {
        setShowSecurityModal(false);
        if (!settings) return;

        setSaving(true);
        try {
            await globalSettingsService.updateSettings(settings);
            toast.success('Глобал тохиргоо хадгалагдлаа');
        } catch (error) {
            console.error('Failed to save global settings:', error);
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Ерөнхий тохиргоо уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Системийн Глобал Тохиргоо"
                subtitle="Бүх хэрэглэгчид харагдах мэдэгдэл болон ерөнхий төлөв"
            />

            <div className="page-content" style={{ maxWidth: '800px' }}>
                <form onSubmit={handleSaveClick} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                            <Sun size={22} color="#f59e0b" fill="#f59e0b20" />
                            Системийн Ерөнхий Загвар (Theme Template)
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Супер Админ порталын харагдах байдлыг эндээс тохируулна уу.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {[
                                { id: 'light', label: 'Цайвар', icon: Sun, color: '#f59e0b' },
                                { id: 'dark', label: 'Бараан', icon: Moon, color: '#6366f1' },
                                { id: 'system', label: 'Систем', icon: Monitor, color: '#10b981' },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTheme(t.id as any)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '16px',
                                        background: theme === t.id ? 'var(--bg-secondary)' : 'var(--surface-2)',
                                        border: `2px solid ${theme === t.id ? 'var(--primary)' : 'transparent'}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: theme === t.id ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                                        transform: theme === t.id ? 'translateY(-2px)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: theme === t.id ? 'var(--primary-light)' : 'var(--bg-soft)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '4px',
                                        transition: 'all 0.3s'
                                    }}>
                                        <t.icon size={20} color={theme === t.id ? 'var(--primary)' : 'var(--text-secondary)'} />
                                    </div>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        color: theme === t.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                                    }}>
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={20} className="text-primary" />
                            Глобал Анхааруулга (System Banner)
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Системийн хэмжээнд бүх хэрэглэгчдэд (business эзэд, ажилчид г.м) дээд хэсэгт харагдах мэдэгдэл.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                background: 'var(--bg-soft)',
                                borderRadius: '14px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'var(--primary-tint)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)'
                                    }}>
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Мэдэгдлийг идэвхжүүлэх</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Асаавал бүх хэрэглэгчийн дэлгэцийн дээд хэсэгт харагдана.</div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.banner.isActive}
                                    onChange={e => setSettings({
                                        ...settings,
                                        banner: { ...settings.banner, isActive: e.target.checked }
                                    })}
                                    className="toggle-checkbox"
                                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                            </div>

                            {settings.banner.isActive && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px',
                                    padding: '24px',
                                    background: 'var(--surface-2)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-primary)',
                                    animation: 'fadeIn 0.3s ease'
                                }}>
                                    <div className="input-group">
                                        <label className="input-label">Мэдэгдлийн Төрөл (Өнгө)</label>
                                        <select
                                            className="input"
                                            value={settings.banner.type}
                                            onChange={e => setSettings({
                                                ...settings,
                                                banner: { ...settings.banner, type: e.target.value as any }
                                            })}
                                        >
                                            <option value="info">Info (Default, Цэнхэрдүү/Нил ягаан)</option>
                                            <option value="success">Success (Ногоон)</option>
                                            <option value="warning">Warning (Улбар шар)</option>
                                            <option value="danger">Danger (Улаан)</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Мэдэгдлийн Текст</label>
                                        <input
                                            className="input"
                                            placeholder="Жнь: Системийн шинэчлэл явагдаж байна..."
                                            value={settings.banner.message}
                                            onChange={e => setSettings({
                                                ...settings,
                                                banner: { ...settings.banner, message: e.target.value }
                                            })}
                                            required={settings.banner.isActive}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Дэлгэрэнгүй холбоос (Link) - Сонголттой</label>
                                        <input
                                            type="url"
                                            className="input"
                                            placeholder="https://t.me/liscord..."
                                            value={settings.banner.link || ''}
                                            onChange={e => setSettings({
                                                ...settings,
                                                banner: { ...settings.banner, link: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                            <Shield size={20} />
                            Системийн Хоригууд (Overrides)
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px 24px',
                                background: 'var(--bg-soft)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ flex: 1, marginRight: '16px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                                        Шинэ бүртгэл нээх
                                        {settings.registrationEnabled ?
                                            <span className="badge badge-delivered">Асаалттай</span> :
                                            <span className="badge badge-soft">Унтраалтай</span>
                                        }
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>Унтраавал гаднаас шинэ хэрэглэгч системд бүртгүүлэх боломжгүй болно.</div>
                                </div>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.registrationEnabled}
                                        onChange={e => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                                        style={{ display: 'none' }}
                                        id="reg-toggle"
                                    />
                                    <div
                                        onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                                        style={{
                                            width: '48px',
                                            height: '24px',
                                            background: settings.registrationEnabled ? 'var(--primary)' : 'var(--surface-3)',
                                            borderRadius: '12px',
                                            position: 'relative',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '3px',
                                            left: settings.registrationEnabled ? '27px' : '3px',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px 24px',
                                background: settings.maintenanceMode ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-soft)',
                                borderRadius: '16px',
                                border: `1px solid ${settings.maintenanceMode ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-color)'}`,
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ flex: 1, marginRight: '16px' }}>
                                    <div style={{ fontWeight: 700, color: settings.maintenanceMode ? '#ef4444' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <AlertTriangle size={18} /> Maintenance Mode
                                        {settings.maintenanceMode && <span className="badge badge-cancelled">Идэвхтэй</span>}
                                    </div>
                                    <div style={{ color: settings.maintenanceMode ? 'rgba(239, 68, 68, 0.8)' : 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        Системийн засварын горим. Асаавал бүх хэрэглэгчид системээс гарч, зөвхөн админ нэвтрэх боломжтой болно.
                                    </div>
                                </div>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.maintenanceMode}
                                        onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                        style={{ display: 'none' }}
                                        id="maint-toggle"
                                    />
                                    <div
                                        onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                        style={{
                                            width: '48px',
                                            height: '24px',
                                            background: settings.maintenanceMode ? 'var(--danger)' : 'var(--surface-3)',
                                            borderRadius: '12px',
                                            position: 'relative',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{
                                            width: '18px',
                                            height: '18px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '3px',
                                            left: settings.maintenanceMode ? '27px' : '3px',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Тохиргоог Хадгалах
                        </button>
                    </div>
                </form >

                {showSecurityModal && (
                    <SecurityModal
                        onSuccess={handleSave}
                        onClose={() => setShowSecurityModal(false)}
                    />
                )}
            </div >
        </div >
    );
}
