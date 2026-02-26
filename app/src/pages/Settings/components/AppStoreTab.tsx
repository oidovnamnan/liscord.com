import { useState } from 'react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Trash2, Download, ShoppingBag, CheckCircle2, Palette, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../../config/modules';
import { STOREFRONT_THEMES } from '../../../config/themes';

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

    return (
        <div className="settings-section animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <ShoppingBag size={24} color="var(--primary)" />
                    Liscord App Store
                </h2>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        className={`btn btn-sm ${activeStoreTab === 'modules' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveStoreTab('modules')}
                        style={{ borderRadius: '10px', minWidth: '100px' }}
                    >
                        Модулиуд
                    </button>
                    <button
                        className={`btn btn-sm ${activeStoreTab === 'themes' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveStoreTab('themes')}
                        style={{ borderRadius: '10px', minWidth: '100px' }}
                    >
                        Загварууд
                    </button>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                {activeStoreTab === 'modules'
                    ? 'Бизнесээ өргөжүүлэх нэмэлт боломжуудыг эндээс идэвхжүүлэх боломжтой.'
                    : 'Танай дэлгүүрийн харагдах байдлыг өөрчлөх өвөрмөц загварууд.'}
            </p>

            {activeStoreTab === 'modules' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {LISCORD_MODULES.filter(mod => !mod.isCore).map(mod => {
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
                                style={{
                                    border: `1px solid ${isActive ? 'var(--primary)' : isExpired ? 'var(--danger)' : 'var(--border-primary)'}`,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    background: isActive ? 'rgba(74, 107, 255, 0.03)' : isExpired ? 'rgba(239, 68, 68, 0.03)' : 'var(--surface-1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    transition: 'all 0.3s',
                                    boxShadow: isActive ? '0 4px 20px rgba(74, 107, 255, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                                }}
                            >
                                <div style={{
                                    width: '60px', height: '60px',
                                    background: isActive ? 'var(--gradient-primary)' : isExpired ? 'var(--danger)' : 'var(--surface-2)',
                                    color: isActive || isExpired ? 'white' : 'var(--text-secondary)',
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Icon size={28} />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{mod.name}</h3>
                                        {mod.isFree ? (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--success-light)', color: 'var(--success-dark)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>ҮНЭГҮЙ</span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{mod.price?.toLocaleString()}₮ / {mod.durationDays}х</span>
                                        )}
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{mod.description}</p>

                                    {expiryDate && (
                                        <div style={{ fontSize: '0.75rem', marginTop: '8px', color: isExpired ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                                            {isExpired ? 'Хугацаа дууссан: ' : 'Дуусах хугацаа: '}
                                            {expiryDate.toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                                    {isInstalling ? (
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{Math.round(installProgress)}%</div>
                                    ) : isActive ? (
                                        <>
                                            <button className="btn btn-primary btn-sm" style={{ width: '100%', borderRadius: '10px' }} onClick={() => navigate(mod.route)}>Нээх</button>
                                            <div style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleUninstallModule(mod.id)}>
                                                <Trash2 size={12} /> Uninstall
                                            </div>
                                        </>
                                    ) : isExpired ? (
                                        <button className="btn btn-danger btn-sm" style={{ width: '100%', borderRadius: '10px' }} onClick={() => handleInstallModule(mod.id)}>
                                            <Clock size={14} /> Сунгах
                                        </button>
                                    ) : (
                                        <button className="btn btn-outline btn-sm" style={{ width: '100%', borderRadius: '10px' }} onClick={() => handleInstallModule(mod.id)}>
                                            <Download size={14} /> {mod.isFree ? 'Суулгах' : 'Худалдаж авах'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
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
                                style={{
                                    border: isRecommended ? '2px solid var(--primary)' : isInstalled ? '1px solid var(--primary)' : '1px solid var(--border-primary)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    background: isRecommended ? 'rgba(74, 107, 255, 0.02)' : 'var(--surface-1)',
                                    position: 'relative',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {isInstalled && (
                                    <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--success)', color: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 8px rgba(0, 168, 107, 0.4)', zIndex: 2 }}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                                {isRecommended && !isInstalled && (
                                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800, zIndex: 3, boxShadow: '0 4px 12px rgba(74, 107, 255, 0.3)', whiteSpace: 'nowrap' }}>
                                        САНАЛ БОЛГОХ
                                    </div>
                                )}
                                <div style={{ width: '100%', height: '120px', background: theme.color, borderRadius: '12px', marginBottom: '12px', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <Palette size={40} color="rgba(0,0,0,0.1)" />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    {theme.name}
                                    {theme.isPremium && !isInstalled && <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>PREMIUM</span>}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 16px 0', height: '36px', overflow: 'hidden', lineHeight: 1.4 }}>{theme.description}</p>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 800, color: theme.isPremium && !isInstalled ? 'var(--primary)' : 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                        {theme.price === 0 ? 'Үнэгүй' : `${theme.price.toLocaleString()}₮`}
                                    </div>
                                    {isInstalling ? (
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(installProgress)}%</span>
                                    ) : isInstalled ? (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Суулгасан</span>
                                    ) : (
                                        <button
                                            className={`btn btn-sm ${theme.isPremium ? 'btn-primary gradient-btn' : 'btn-outline'}`}
                                            style={{ borderRadius: '10px', padding: '6px 16px' }}
                                            onClick={() => handleInstallTheme(theme.id, theme.isPremium)}
                                        >
                                            {theme.isPremium ? 'Худалдаж авах' : 'Суулгах'}
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
