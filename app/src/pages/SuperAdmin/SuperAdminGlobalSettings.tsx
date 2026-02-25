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
                            <label className="toggle" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>Шинэ бүртгэл нээх <span className="badge badge-success">Асаалттай</span></div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Унтраавал гаднаас шинэ хэрэглэгч системд бүртгүүлэх боломжгүй болно.</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.registrationEnabled}
                                    onChange={e => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                                />
                                <span className="slider"></span>
                            </label>

                            <label className="toggle" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--danger-light)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertTriangle size={16} /> Maintenance Mode
                                    </div>
                                    <div style={{ color: 'var(--text-danger)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        Системийн засварын горим. Унтраавал бүх хэрэглэгчдийг хүчээр гаргана. (Сэрэмжтэй хэрэглэх)
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                />
                                <span className="slider" style={{ background: settings.maintenanceMode ? 'var(--danger)' : '' }}></span>
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
