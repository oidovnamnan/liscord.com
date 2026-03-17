import { useState, useEffect } from 'react';
import { useBusinessStore, useModuleDefaultsStore } from '../../store';
import { businessService, systemSettingsService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Download, Trash2, Loader2, CheckCircle2, Palette, Sparkles, Package, TrendingUp, Zap, Store} from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';
import { STOREFRONT_THEMES } from '../../config/themes';
import './AppStorePage.css';
import '../Settings/components/FlashDealSettings.css';

const CATEGORY_MAP: Record<string, string> = {
    'operations': 'Үйл ажиллагаа',
    'finance': 'Санхүү',
    'staff': 'Хүний нөөц',
    'sales': 'Борлуулалт',
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
    'sales-hub': 'Борлуулалтын Hub',
    'marketing-hub': 'Маркетинг Hub',
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

    const { defaults: moduleDefaults, fetchDefaults } = useModuleDefaultsStore();

    const [appStoreConfig, setAppStoreConfig] = useState<Record<string, { isFree: boolean; plans: any[] }>>({}); // eslint-disable-line @typescript-eslint/no-explicit-any

    useEffect(() => {
        fetchDefaults();
        const fetchConfig = async () => {
            try {
                const config = await systemSettingsService.getAppStoreConfig();
                setAppStoreConfig(config);
            } catch (e) {
                console.error('Fetch data error:', e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchConfig();
    }, [fetchDefaults]);

    const activeMods = business?.activeModules || [];
    const installedThemes = business?.settings?.storefront?.installedThemes || ['minimal'];

    // Get the configured modules for this business's category
    const businessCategory = business?.category || '';
    const categoryConfig = moduleDefaults[businessCategory] || {};
    const configuredModuleIds = Object.keys(categoryConfig);

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
            toast.success(`"${themeId}" загвар амжилттай суулаа!`);
        } catch (error) {
            console.error('Theme install error:', error);
            toast.error('Суулгахад алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    const handleUninstallModule = async (moduleId: string) => {
        if (!business) return;
        const confirmed = confirm('Та энэ модулийг устгахдаа итгэлтэй байна уу?');
        if (!confirmed) return;

        try {
            const newMods = activeMods.filter(m => m !== moduleId);
            // Also remove from moduleSubscriptions if exists
            const moduleSubscriptions = { ...(business.moduleSubscriptions || {}) };
            delete moduleSubscriptions[moduleId];

            await businessService.updateBusiness(business.id, {
                activeModules: newMods,
                moduleSubscriptions,
            });
            setBusiness({ ...business, activeModules: newMods, moduleSubscriptions });
            toast.success('Модуль амжилттай устгагдлаа!');
        } catch (error) {
            console.error('Uninstall error:', error);
            toast.error('Устгахад алдаа гарлаа');
        }
    };

    const handleInstallModule = async (moduleId: string, planId?: string) => {
        if (!business || loading || installingId) return;

        if (activeMods.includes(moduleId)) {
            toast.error('Энэ модуль хэдийнэ суусан байна');
            return;
        }

        setInstallingId(moduleId);
        setInstallProgress(0);

        for (let i = 0; i <= 100; i += 20) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setInstallProgress(i);
        }

        try {
            if (planId) {
                const mod = LISCORD_MODULES.find(m => m.id === moduleId);
                const plan = mod?.plans?.find(p => p.id === planId);
                if (plan) {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

                    const moduleSubscriptions = { ...(business.moduleSubscriptions || {}) };
                    moduleSubscriptions[moduleId] = {
                        subscribedAt: new Date() as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                        expiresAt: expiresAt as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                        status: 'active'
                    };

                    const newMods = [...activeMods, moduleId];
                    await businessService.updateBusiness(business.id, {
                        activeModules: newMods,
                        moduleSubscriptions
                    });
                    setBusiness({ ...business, activeModules: newMods, moduleSubscriptions });
                    toast.success(`"${mod?.name}" модуль ${plan.name} хугацаатай идэвхжлээ!`);
                }
            } else {
                const newMods = [...activeMods, moduleId];
                await businessService.updateBusiness(business.id, { activeModules: newMods });
                setBusiness({ ...business, activeModules: newMods });
                const modName = LISCORD_MODULES.find(m => m.id === moduleId)?.name || moduleId;
                toast.success(`"${modName}" модуль амжилттай суулаа!`);
            }
        } catch (error) {
            console.error('Install error:', error);
            toast.error('Суулгахад алдаа гарлаа');
        } finally {
            setInstallingId(null);
            setInstallProgress(0);
        }
    };

    // ═══════ Filter modules — ONLY show SuperAdmin-configured modules ═══════
    const getFilteredModules = () => {
        return LISCORD_MODULES
            .filter(mod => {
                // Show modules configured by SuperAdmin OR already installed (activeModules)
                const isConfigured = configuredModuleIds.includes(mod.id);
                const isActive = activeMods.includes(mod.id);
                if (!isConfigured && !isActive) return false;

                const dynamic = appStoreConfig[mod.id];
                const finalMod = dynamic ? { ...mod, ...dynamic } : mod;
                const isCoreForBusiness = categoryConfig[finalMod.id] === 'core';
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
                const isCoreForBusiness = categoryConfig[finalMod.id] === 'core';
                const isFree = isCoreForBusiness || finalMod.isFree;
                // A module is "installed" if in activeModules, moduleSubscriptions, OR if it's core for this business category
                const isInstalled = activeMods.includes(finalMod.id) ||
                    !!(business?.moduleSubscriptions?.[finalMod.id]) ||
                    isCoreForBusiness;
                return { ...finalMod, isCoreForBusiness, isFree, isInstalled };
            })
            // Sort: installed first, then core, then addon
            .sort((a, b) => {
                if (a.isInstalled !== b.isInstalled) return a.isInstalled ? -1 : 1;
                if (a.isCoreForBusiness !== b.isCoreForBusiness) return a.isCoreForBusiness ? -1 : 1;
                return 0;
            });
    };

    const filteredModules = getFilteredModules();
    const installedCount = filteredModules.filter(m => m.isInstalled).length;
    const coreCount = filteredModules.filter(m => m.isCoreForBusiness).length;
    const addonCount = filteredModules.filter(m => !m.isCoreForBusiness).length;

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
            <div className="fds-hero" style={{ margin: '0 24px' }}>
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Store size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">App Store</h3>
                            <div className="fds-hero-desc">Модулийн дэлгүүр</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-content" style={{ padding: '24px 24px 40px' }}>
                {/* ═══ Hero Stats ═══ */}
                <div className="appstore-hero">
                    <div className="appstore-hero-stat">
                        <div className="appstore-hero-icon installed">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="appstore-hero-number">{installedCount}</div>
                            <div className="appstore-hero-label">Суулгасан</div>
                        </div>
                    </div>
                    <div className="appstore-hero-stat">
                        <div className="appstore-hero-icon core">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div className="appstore-hero-number">{coreCount}</div>
                            <div className="appstore-hero-label">Үндсэн</div>
                        </div>
                    </div>
                    <div className="appstore-hero-stat">
                        <div className="appstore-hero-icon addon">
                            <Package size={20} />
                        </div>
                        <div>
                            <div className="appstore-hero-number">{addonCount}</div>
                            <div className="appstore-hero-label">Нэмэлт</div>
                        </div>
                    </div>
                    <div className="appstore-hero-stat">
                        <div className="appstore-hero-icon total">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <div className="appstore-hero-number">{configuredModuleIds.length}</div>
                            <div className="appstore-hero-label">Нийт боломж</div>
                        </div>
                    </div>
                </div>

                {/* ═══ Tab & Toolbar ═══ */}
                <div className="appstore-toolbar">
                    <div className="appstore-tabs">
                        <button
                            className={`appstore-tab ${activeStoreTab === 'modules' ? 'active' : ''}`}
                            onClick={() => setActiveStoreTab('modules')}
                        >
                            <Zap size={15} /> Модулиуд
                        </button>
                        <button
                            className={`appstore-tab ${activeStoreTab === 'themes' ? 'active' : ''}`}
                            onClick={() => setActiveStoreTab('themes')}
                        >
                            <Palette size={15} /> Загварууд
                        </button>
                    </div>

                    {activeStoreTab === 'modules' && (
                        <div className="appstore-filters">
                            <div className="appstore-search">
                                <Icons.Search size={15} />
                                <input
                                    type="text"
                                    placeholder="Модуль хайх..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="appstore-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Бүх чиглэл</option>
                                {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <select
                                className="appstore-select hide-mobile"
                                value={selectedHub}
                                onChange={(e) => setSelectedHub(e.target.value)}
                            >
                                <option value="all">Бүх Hub</option>
                                {Object.entries(HUB_MAP).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <select
                                className="appstore-select"
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                            >
                                <option value="all">Бүх үнэ</option>
                                <option value="free">Үнэгүй</option>
                                <option value="premium">Төлбөртэй</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* ═══ Module Grid ═══ */}
                <div className="store-render-area" key={`render-${activeStoreTab}`}>
                    {activeStoreTab === 'modules' ? (
                        <>
                            {filteredModules.length === 0 ? (
                                <div className="appstore-empty">
                                    <Icons.PackageSearch size={48} />
                                    <h3>Модуль олдсонгүй</h3>
                                    <p>Хайлтын шүүлтүүрээ өөрчилнө үү</p>
                                </div>
                            ) : (
                                <div className="appstore-grid">
                                    {filteredModules.map(mod => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const Icon = (Icons as any)[mod.icon || 'Box'] || Icons.Box;
                                        const isInstalling = installingId === mod.id;

                                        return (
                                            <div key={mod.id} className={`as-card ${mod.isInstalled ? 'installed' : ''} ${mod.isCoreForBusiness ? 'core' : 'addon'}`}>
                                                {/* Card top: icon + info */}
                                                <div className="as-card-top">
                                                    <div className={`as-icon ${mod.isInstalled ? 'active' : ''}`}>
                                                        <Icon size={26} strokeWidth={1.8} />
                                                    </div>
                                                    <div className="as-info">
                                                        <div className="as-title-row">
                                                            <h3 className="as-name">{mod.name}</h3>
                                                            <span className={`as-badge ${mod.isCoreForBusiness ? 'core' : 'addon'}`}>
                                                                {mod.isCoreForBusiness ? 'CORE' : 'ADDON'}
                                                            </span>
                                                        </div>
                                                        <p className="as-desc">{mod.description}</p>
                                                    </div>
                                                </div>

                                                {/* Card bottom: price + action */}
                                                <div className="as-card-bottom">
                                                    {mod.isFree ? (
                                                        <div className="as-price free">
                                                            <Icons.ShieldCheck size={14} /> Нээлттэй
                                                        </div>
                                                    ) : (
                                                        <div className="as-price-stack">
                                                            {(mod.plans || []).map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                                <span key={p.id} className="as-price-tag">
                                                                    {p.price?.toLocaleString()}₮ <small>/ {p.name}</small>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="as-actions">
                                                        {isInstalling ? (
                                                            <button className="as-btn installing" disabled>
                                                                <div className="as-progress" style={{ width: `${installProgress}%` }} />
                                                                {Math.round(installProgress)}%
                                                            </button>
                                                        ) : mod.isInstalled ? (
                                                            <>
                                                                <button className="as-btn open" onClick={() => navigate(mod.route)}>
                                                                    <Icons.ExternalLink size={14} /> Нээх
                                                                </button>
                                                                {!mod.isCoreForBusiness && (
                                                                    <button className="as-btn remove" onClick={() => handleUninstallModule(mod.id)}>
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : mod.isFree ? (
                                                            <button className="as-btn install" onClick={() => handleInstallModule(mod.id)}>
                                                                <Download size={14} /> Суулгах
                                                            </button>
                                                        ) : (
                                                            (mod.plans || []).map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                                                <button key={p.id} className="as-btn buy" onClick={() => handleInstallModule(mod.id, p.id)}>
                                                                    {p.name}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="appstore-grid">
                            {STOREFRONT_THEMES.map(theme => {
                                const isInstalled = installedThemes.includes(theme.id);
                                const isInstalling = installingId === theme.id;

                                return (
                                    <div key={theme.id} className="theme-card-premium">
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

                                        <p className="theme-description">{theme.description}</p>

                                        <div className="theme-footer">
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: theme.isPremium && !isInstalled ? 'var(--primary)' : 'var(--text-primary)' }}>
                                                {theme.price === 0 ? 'Үнэгүй' : `${theme.price.toLocaleString()}₮`}
                                            </div>

                                            {isInstalling ? (
                                                <span className="install-progress">{Math.round(installProgress)}%</span>
                                            ) : isInstalled ? (
                                                <span className="installed-status">
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
