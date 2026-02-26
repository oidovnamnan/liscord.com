import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Trash2, Download, ShoppingBag, CheckCircle2, Palette, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../../config/modules';
import { STOREFRONT_THEMES } from '../../../config/themes';

import './AppStoreTab.css';

export function AppStoreTab() {
    const { business, setBusiness } = useBusinessStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [activeStoreTab, setActiveStoreTab] = useState<'modules' | 'themes'>('modules');

    // Installation states
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [installProgress, setInstallProgress] = useState(0);

    const activeMods = business?.activeModules || [];
    const installedThemes = business?.settings?.storefront?.installedThemes || ['minimal'];

    const handleInstallModule = async (moduleId: string) => {
        if (!business || loading || installingId) return;

        setInstallingId(moduleId);
        setInstallProgress(0);

        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setInstallProgress(Math.min(i + Math.random() * 15, 95));
        }

        try {
            const mod = LISCORD_MODULES.find(m => m.id === moduleId);
            const durationDays = mod?.durationDays || 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            const newModules = Array.from(new Set([...activeMods, moduleId]));
            const newSubscriptions = {
                ...(business.moduleSubscriptions || {}),
                [moduleId]: {
                    subscribedAt: new Date(),
                    expiresAt: expiresAt,
                    status: 'active' as const
                }
            };

            await businessService.updateBusiness(business.id, {
                activeModules: newModules,
                moduleSubscriptions: newSubscriptions
            });

            setBusiness({
                ...business,
                activeModules: newModules,
                moduleSubscriptions: newSubscriptions
            });

            setInstallProgress(100);
            await new Promise(resolve => setTimeout(resolve, 300));
            toast.success('Модуль амжилттай суулаа');
        } catch (error) {
            toast.error('Суулгах үед алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    const handleInstallTheme = async (themeId: string, isPremium: boolean) => {
        if (!business || loading || installingId) return;

        if (isPremium) {
            const confirmed = confirm('Та энэхүү премиум загварыг худалдаж авахдаа итгэлтэй байна уу?');
            if (!confirmed) return;
        }

        setInstallingId(themeId);
        setInstallProgress(0);

        for (let i = 0; i <= 100; i += 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setInstallProgress(i);
        }

        try {
            const currentInstalled = business?.settings?.storefront?.installedThemes || ['minimal'];
            if (currentInstalled.includes(themeId)) {
                toast.error('Энэ загвар хэдийнэ суусан байна');
                return;
            }

            const newThemes = [...currentInstalled, themeId];
            const updatedSettings = {
                ...business.settings,
                storefront: {
                    ...(business.settings?.storefront || { enabled: false }),
                    installedThemes: newThemes
                }
            };

            await businessService.updateBusiness(business.id, { settings: updatedSettings });
            setBusiness({ ...business, settings: updatedSettings });

            setInstallProgress(100);
            await new Promise(resolve => setTimeout(resolve, 200));
            toast.success('Загвар амжилттай суулаа');
        } catch (error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    const handleUninstallModule = async (moduleId: string) => {
        if (!business || loading || installingId) return;
        if (!confirm('Энэ модулийг устгахдаа итгэлтэй байна уу?')) return;

        setLoading(true);
        try {
            const newModules = activeMods.filter(m => m !== moduleId);
            await businessService.updateBusiness(business.id, { activeModules: newModules });
            setBusiness({ ...business, activeModules: newModules });
            toast.success('Модулийг устгалаа');
        } catch (error) {
            toast.error('Устгах үед алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const [moduleDefaults, setModuleDefaults] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                const data = await systemSettingsService.getModuleDefaults();
                setModuleDefaults(data);
            } catch (e) {
                console.error('Fetch defaults error:', e);
            }
        };
        fetchDefaults();
    }, []);

    return (
        <div className="settings-section animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
                    <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: '12px' }}>
                        <ShoppingBag size={28} color="var(--primary)" />
                    </div>
                    Liscord App Store
                </h2>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '6px', borderRadius: '16px' }}>
                    <button
                        className={`btn btn-sm ${activeStoreTab === 'modules' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveStoreTab('modules')}
                        style={{ borderRadius: '12px', minWidth: '120px', height: '40px' }}
                    >
                        Модулиуд
                    </button>
                    <button
                        className={`btn btn-sm ${activeStoreTab === 'themes' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveStoreTab('themes')}
                        style={{ borderRadius: '12px', minWidth: '120px', height: '40px' }}
                    >
                        Загварууд
                    </button>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '1rem' }}>
                {activeStoreTab === 'modules'
                    ? 'Бизнесээ өргөжүүлэх удирдлагын нэмэлт боломжуудыг эндээс идэвхжүүлээрэй.'
                    : 'Танай дэлгүүрийн өнгө төрхийг өөрчлөх мэргэжлийн загварууд.'}
            </p>

            {activeStoreTab === 'modules' ? (
                <div className="app-store-grid">
                    {LISCORD_MODULES.filter(mod => {
                        if (mod.isCore) return false;
                        // Filter based on Super Admin dynamic config
                        if (business?.category && moduleDefaults[business.category]) {
                            return !!moduleDefaults[business.category][mod.id];
                        }
                        return true;
                    }).map(mod => {
                        const Icon = (Icons as any)[mod.icon] || Icons.Box;
                        const isInstalled = activeMods.includes(mod.id);
                        const isInstalling = installingId === mod.id;

                        const subscription = business?.moduleSubscriptions?.[mod.id];
                        const expiryDate = subscription?.expiresAt ? (typeof (subscription.expiresAt as any).toDate === 'function' ? (subscription.expiresAt as any).toDate() : new Date(subscription.expiresAt as any)) : null;
                        const isExpired = expiryDate ? expiryDate < new Date() : false;
                        const isActive = isInstalled && !isExpired;

                        return (
                            <div
                                key={mod.id}
                                className={`module-card-premium ${isActive ? 'active' : ''} ${isExpired ? 'expired' : ''}`}
                            >
                                <div className="module-card-header">
                                    <div className="module-icon-box">
                                        <Icon size={32} strokeWidth={2.5} />
                                    </div>
                                    <div className="module-info">
                                        <div className="module-title-row">
                                            <h3 className="module-name">{mod.name}</h3>
                                            {mod.isFree && <span style={{ fontSize: '0.65rem', background: 'var(--success-light)', color: 'var(--success-dark)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>ҮНЭГҮЙ</span>}
                                        </div>
                                        <p className="module-description">{mod.description}</p>
                                    </div>
                                </div>

                                <div className="module-meta">
                                    {!mod.isFree ? (
                                        <div className="price-badge">
                                            <div className="price-amount">{mod.price?.toLocaleString()}₮</div>
                                            <div className="price-duration">/ {mod.durationDays} хоног</div>
                                        </div>
                                    ) : (
                                        <div className="price-badge">
                                            <div className="price-amount">Нээлттэй</div>
                                            <div className="price-duration">Хязгааргүй</div>
                                        </div>
                                    )}

                                    {expiryDate && (
                                        <div className="status-info">
                                            <div className="status-label" style={{ color: isExpired ? 'var(--danger)' : 'var(--success)' }}>
                                                {isExpired ? 'Хугацаа дууссан' : 'Дараах хүртэл'}
                                            </div>
                                            <div className="status-date">{expiryDate.toLocaleDateString()}</div>
                                        </div>
                                    )}
                                </div>

                                <div className="module-actions">
                                    {isInstalling ? (
                                        <button className="btn btn-primary" disabled style={{ position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${installProgress}%`, background: 'rgba(255,255,255,0.2)', transition: 'width 0.3s' }} />
                                            Суулгаж байна... {Math.round(installProgress)}%
                                        </button>
                                    ) : isActive ? (
                                        <>
                                            <button className="btn btn-primary gradient-btn" onClick={() => navigate(mod.route)}>
                                                Нээх
                                            </button>
                                            <button className="btn-uninstall-mini" onClick={() => handleUninstallModule(mod.id)} title="Устгах">
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    ) : isExpired ? (
                                        <button className="btn btn-danger gradient-btn" onClick={() => handleInstallModule(mod.id)}>
                                            <Clock size={16} /> Сунгах
                                        </button>
                                    ) : (
                                        <button className={`btn ${mod.isFree ? 'btn-outline' : 'btn-primary gradient-btn'}`} onClick={() => handleInstallModule(mod.id)}>
                                            <Download size={16} /> {mod.isFree ? 'Суулгах' : 'Худалдаж авах'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="app-store-grid">
                    {[...STOREFRONT_THEMES].sort((a, b) => {
                        const aRec = a.categories?.includes(business?.category || '') ? 1 : 0;
                        const bRec = b.categories?.includes(business?.category || '') ? 1 : 0;
                        return bRec - aRec;
                    }).map(theme => {
                        const isInstalled = installedThemes.includes(theme.id);
                        const isInstalling = installingId === theme.id;
                        const isRecommended = theme.categories?.includes(business?.category || '');

                        return (
                            <div
                                key={theme.id}
                                className="theme-card-premium"
                            >
                                <div className="theme-preview-box" style={{ background: theme.color }}>
                                    <Palette size={48} color="rgba(0,0,0,0.1)" />
                                    {isInstalled && (
                                        <div className="theme-status-icon">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    )}
                                    {isRecommended && !isInstalled && (
                                        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                                            САНАЛ БОЛГОХ
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{theme.name}</h3>
                                    {theme.isPremium && !isInstalled && <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>PREMIUM</span>}
                                </div>

                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', height: '40px', overflow: 'hidden', lineHeight: 1.5 }}>{theme.description}</p>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: theme.isPremium && !isInstalled ? 'var(--primary)' : 'var(--text-primary)' }}>
                                        {theme.price === 0 ? 'Үнэгүй' : `${theme.price.toLocaleString()}₮`}
                                    </div>

                                    {isInstalling ? (
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(installProgress)}%</span>
                                    ) : isInstalled ? (
                                        <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={16} /> Суулгасан
                                        </span>
                                    ) : (
                                        <button
                                            className={`btn btn-sm ${theme.isPremium ? 'btn-primary gradient-btn' : 'btn-outline'}`}
                                            style={{ borderRadius: '10px', height: '36px', padding: '0 20px' }}
                                            onClick={() => handleInstallTheme(theme.id, theme.isPremium)}
                                        >
                                            {theme.isPremium ? 'Авах' : 'Суулгах'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
