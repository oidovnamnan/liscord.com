import { useState, useEffect } from 'react';
import { useBusinessStore } from '../../store';
import { businessService, systemSettingsService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { Trash2, Download, CheckCircle2, Palette, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';

import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';
import { STOREFRONT_THEMES } from '../../config/themes';

import './AppStorePage.css';

const CATEGORY_MAP: Record<string, string> = {
    'operations': 'Үйл ажиллагаа',
    'finance': 'Санхүү',
    'staff': 'Хүний нөөц',
    'sales': 'Борлуулалт',
    'services': 'Үйлчилгээ',
    'industry': 'Тусгай салбар',
    'logistics': 'Логистик',
    'manufacturing': 'Үйлдвэрлэл',
    'crm': 'Харилцагч',
    'marketing': 'Маркетинг',
    'ecommerce': 'Онлайн худалдаа',
    'b2b': 'B2B/Бөөний',
    'tools': 'Хэрэгслүүд',
    'ai': 'AI / Дата',
};

const HUB_MAP: Record<string, string> = {
    'inventory-hub': 'Агуулах Hub',
    'finance-hub': 'Санхүү Hub',
    'staff-hub': 'Хүний нөөц Hub',
    'crm-hub': 'Харилцагчийн Hub',
    'retail-hub': 'ПОС / Дэлгүүр Hub',
    'industry-hub': 'Тусгай салбар Hub',
    'manufacturing-hub': 'Үйлдвэрлэл Hub',
    'logistics-hub': 'Логистик Hub',
    'workspace-hub': 'Ажлын талбар Hub',
    'ai-hub': 'AI Assistant Hub',
    'compliance-hub': 'Тайлан & Хууль Hub'
};

export function AppStorePage() {
    const { business, setBusiness } = useBusinessStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeStoreTab, setActiveStoreTab] = useState<'modules' | 'themes'>('modules');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedHub, setSelectedHub] = useState<string>('all');
    const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');

    // Installation states
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [installProgress, setInstallProgress] = useState(0);

    const [moduleDefaults, setModuleDefaults] = useState<Record<string, Record<string, string>>>({});

    const [appStoreConfig, setAppStoreConfig] = useState<Record<string, { isFree: boolean; plans: any[] }>>({}); // eslint-disable-line @typescript-eslint/no-explicit-any

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [defaults, config] = await Promise.all([
                    systemSettingsService.getModuleDefaults(),
                    systemSettingsService.getAppStoreConfig()
                ]);
                setModuleDefaults(defaults);
                setAppStoreConfig(config);
            } catch (e) {
                console.error('Fetch data error:', e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeMods = business?.activeModules || [];
    const installedThemes = business?.settings?.storefront?.installedThemes || ['minimal'];

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Устгах үед алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleInstallModule = async (moduleId: string, planId?: string) => {
        if (!business || loading || installingId) return;

        setInstallingId(moduleId);
        setInstallProgress(0);

        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setInstallProgress(Math.min(i + Math.random() * 15, 95));
        }

        try {
            const dynamicConfig = appStoreConfig[moduleId];
            const mod = LISCORD_MODULES.find(m => m.id === moduleId);

            const isCoreForBusiness = business?.category && moduleDefaults[business.category]?.[moduleId] === 'core';
            const isFree = isCoreForBusiness || dynamicConfig?.isFree || mod?.isFree;

            let durationDays = 30;
            if (isFree) {
                durationDays = 365;
            } else if (planId && dynamicConfig?.plans) {

                const selectedPlan = dynamicConfig.plans.find((p: any) => p.id === planId); // eslint-disable-line @typescript-eslint/no-explicit-any
                durationDays = selectedPlan?.durationDays ?? 30;
            } else if (mod?.plans) {
                durationDays = mod.plans[0].durationDays || 30;
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (isFree ? 36500 : durationDays));

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Суулгах үед алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    if (initialLoading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>App Store ачаалж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Liscord App Store"
                subtitle={activeStoreTab === 'modules' ? "Бизнесээ өргөжүүлэх удирдлагын нэмэлт боломжуудыг эндээс идэвхжүүлээрэй" : "Танай дэлгүүрийн өнгө төрхийг өөрчлөх мэргэжлийн загварууд"}
            />

            <div className="page-content" style={{ paddingTop: '24px' }}>
                <div style={{
                    position: 'sticky',
                    top: '64px',
                    zIndex: 190,
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '32px',
                    padding: '12px 0',
                    margin: '0 0 32px 0',
                    borderBottom: '1px solid var(--border-glass)',
                    backdropFilter: 'blur(8px)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '4px', borderRadius: '14px', flexShrink: 0 }}>
                        <button
                            className={`btn btn-sm ${activeStoreTab === 'modules' ? 'btn-primary gradient-btn' : 'btn-ghost'}`}
                            onClick={() => setActiveStoreTab('modules')}
                            style={{ borderRadius: '10px', minWidth: '100px', height: '36px', fontSize: '0.85rem' }}
                        >
                            Модулиуд
                        </button>
                        <button
                            className={`btn btn-sm ${activeStoreTab === 'themes' ? 'btn-primary gradient-btn' : 'btn-ghost'}`}
                            onClick={() => setActiveStoreTab('themes')}
                            style={{ borderRadius: '10px', minWidth: '100px', height: '36px', fontSize: '0.85rem' }}
                        >
                            Загварууд
                        </button>
                    </div>

                    {activeStoreTab === 'modules' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                            <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
                                <Icons.Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Хайх..."
                                    style={{ paddingLeft: '36px', height: '38px', width: '100%', borderRadius: '10px', background: 'var(--surface-2)', fontSize: '0.9rem' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <select
                                className="select"
                                style={{ height: '38px', borderRadius: '10px', width: '150px', background: 'var(--surface-2)', paddingLeft: '12px', fontSize: '0.85rem' }}
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Бүх чиглэл</option>
                                {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>

                            <select
                                className="select"
                                style={{ height: '38px', borderRadius: '10px', width: '140px', background: 'var(--surface-2)', paddingLeft: '12px', fontSize: '0.85rem' }}
                                value={selectedHub}
                                onChange={(e) => setSelectedHub(e.target.value)}
                            >
                                <option value="all">Бүх Hub</option>
                                {Object.entries(HUB_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>

                            <select
                                className="select"
                                style={{ height: '38px', borderRadius: '10px', width: '130px', background: 'var(--surface-2)', paddingLeft: '12px', fontSize: '0.85rem' }}
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value as any)}
                            >
                                <option value="all">Бүх үнэ</option>
                                <option value="free">Үнэгүй</option>
                                <option value="premium">Төлбөртэй</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="store-render-area" style={{ minHeight: '600px', width: '100%', paddingBottom: '60px' }}>
                    {activeStoreTab === 'modules' ? (
                        <div className="app-store-grid" id="grid-modules-dedicated">
                            {LISCORD_MODULES
                                .filter(mod => {
                                    const dynamic = appStoreConfig[mod.id];
                                    const finalMod = dynamic ? { ...mod, ...dynamic } : mod;
                                    const isCoreForBusiness = business?.category && moduleDefaults[business.category]?.[finalMod.id] === 'core';
                                    const isFree = isCoreForBusiness || finalMod.isFree;

                                    if (searchQuery) {
                                        const query = searchQuery.toLowerCase();
                                        return finalMod.name.toLowerCase().includes(query) ||
                                            (finalMod.description || '').toLowerCase().includes(query);
                                    }

                                    if (selectedCategory !== 'all') {
                                        const modCats = [finalMod.category, ...(finalMod.categories || [])].filter(Boolean);
                                        if (!modCats.includes(selectedCategory)) return false;
                                    }

                                    if (selectedHub !== 'all' && finalMod.hubId !== selectedHub) return false;
                                    if (priceFilter === 'free' && !isFree) return false;
                                    if (priceFilter === 'premium' && isFree) return false;

                                    return true;
                                })
                                .map(mod => {
                                    const dynamic = appStoreConfig[mod.id];
                                    const finalMod = dynamic ? { ...mod, ...dynamic } : mod;
                                    const isCoreForBusiness = business?.category && moduleDefaults[business.category]?.[finalMod.id] === 'core';
                                    const isFree = isCoreForBusiness || finalMod.isFree;
                                    const Icon = (Icons as any)[finalMod.icon || 'Box'] || Icons.Box;
                                    const isInstalled = activeMods.includes(finalMod.id);
                                    const isInstalling = installingId === finalMod.id;
                                    const isActive = isInstalled;

                                    return (
                                        <div key={`mod-card-${finalMod.id}`} className={`module-card-premium ${isActive ? 'active' : ''}`}>
                                            <div className="module-card-header">
                                                <div className="module-icon-box">
                                                    <Icon size={32} strokeWidth={2.5} />
                                                </div>
                                                <div className="module-info">
                                                    <div className="module-title-row">
                                                        <h3 className="module-name">{finalMod.name}</h3>
                                                        {isFree && <span className="badge-free">{isCoreForBusiness ? 'CORE' : 'ҮНЭГҮЙ'}</span>}
                                                    </div>
                                                    <p className="module-description">{finalMod.description}</p>
                                                </div>
                                            </div>

                                            <div className="module-meta">
                                                {isFree ? (
                                                    <div className="price-badge">
                                                        <div className="price-amount">Нээлттэй</div>
                                                        <div className="price-duration">Хязгааргүй</div>
                                                    </div>
                                                ) : (
                                                    <div className="price-stack" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {(finalMod.plans || []).map((p: any) => (
                                                            <div key={p.id} className="price-badge-mini">
                                                                <span className="price-amount">{p.price?.toLocaleString()}₮</span>
                                                                <span className="price-duration">/ {p.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="module-actions">
                                                {isInstalling ? (
                                                    <button className="btn btn-primary" disabled style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${installProgress}%`, background: 'rgba(255,255,255,0.2)' }} />
                                                        {Math.round(installProgress)}%
                                                    </button>
                                                ) : isActive ? (
                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        <button className="btn btn-primary gradient-btn" style={{ flex: 1 }} onClick={() => navigate(finalMod.route)}>Нээх</button>
                                                        <button className="btn-uninstall-mini" onClick={() => handleUninstallModule(finalMod.id)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                        {isFree ? (
                                                            <button className="btn btn-outline w-full" onClick={() => handleInstallModule(finalMod.id)}>
                                                                <Download size={16} /> Суулгах
                                                            </button>
                                                        ) : (
                                                            (finalMod.plans || []).map((p: any) => (
                                                                <button key={p.id} className="btn btn-primary gradient-btn btn-sm" style={{ flex: 1 }} onClick={() => handleInstallModule(finalMod.id, p.id)}>
                                                                    {p.name} авах
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="app-store-grid" id="grid-themes-dedicated">
                            {STOREFRONT_THEMES.map(theme => {
                                const isInstalled = installedThemes.includes(theme.id);
                                const isInstalling = installingId === theme.id;

                                return (
                                    <div key={`theme-card-${theme.id}`} className="theme-card-premium">
                                        <div className="theme-preview-box" style={{ background: theme.color }}>
                                            <Palette size={48} color="rgba(0,0,0,0.1)" />
                                            {isInstalled && (
                                                <div className="theme-status-icon">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{theme.name}</h3>
                                            {theme.isPremium && !isInstalled && <span className="premium-badge-mini">PREMIUM</span>}
                                        </div>

                                        <p className="theme-description" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 20px 0', height: '40px', overflow: 'hidden', lineHeight: 1.5 }}>{theme.description}</p>

                                        <div className="theme-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-primary)' }}>
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
                                                <button className={`btn btn-sm ${theme.isPremium ? 'btn-primary gradient-btn' : 'btn-outline'}`} onClick={() => handleInstallTheme(theme.id, theme.isPremium)}>
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
            </div>
        </div>
    );
}
