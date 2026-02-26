import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { globalSettingsService } from '../../services/db';
import type { GlobalSettings } from '../../services/db';
import { Loader2, Save, MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function SuperAdminGlobalSettings() {
    const [settings, setSettings] = useState<GlobalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={20} className="text-primary" />
                            Глобал Анхааруулга (System Banner)
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Системийн хэмжээнд бүх хэрэглэгчдэд (business эзэд, ажилчид г.м) дээд хэсэгт харагдах мэдэгдэл.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="toggle" style={{ display: 'inline-flex', padding: '16px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.banner.isActive}
                                    onChange={e => setSettings({
                                        ...settings,
                                        banner: { ...settings.banner, isActive: e.target.checked }
                                    })}
                                />
                                <span className="slider"></span>
                                <span className="label" style={{ fontWeight: 600 }}>Мэдэгдэл харуулах эсэх</span>
                            </label>

                            {settings.banner.isActive && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                            <label className="toggle-label" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px',
                                background: 'var(--surface-2)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ flex: 1, marginRight: '16px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        Шинэ бүртгэл нээх
                                        {settings.registrationEnabled ? <span className="badge badge-success">Асаалттай</span> : <span className="badge badge-secondary">Унтраалтай</span>}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>Унтраавал гаднаас шинэ хэрэглэгч системд бүртгүүлэх боломжгүй болно.</div>
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
                            </label>

                            <label className="toggle-label" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '20px',
                                background: settings.maintenanceMode ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-2)',
                                borderRadius: '12px',
                                border: `1px solid ${settings.maintenanceMode ? 'var(--danger)' : 'var(--border-color)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ flex: 1, marginRight: '16px' }}>
                                    <div style={{ fontWeight: 600, color: settings.maintenanceMode ? 'var(--danger)' : 'inherit', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <AlertTriangle size={16} /> Maintenance Mode
                                        {settings.maintenanceMode && <span className="badge badge-danger">Асаалттай</span>}
                                    </div>
                                    <div style={{ color: settings.maintenanceMode ? 'var(--text-danger)' : 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
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
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Тохиргоог Хадгалах
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
