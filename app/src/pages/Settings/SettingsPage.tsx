import { useState, useEffect, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Building2, Palette, Bell, Shield, Users, Globe, Loader2, Share2, X, CheckSquare, ListOrdered, ShoppingBag, CreditCard, Sun, Moon, Monitor, CheckCircle2 } from 'lucide-react';
import { useBusinessStore, useUIStore } from '../../store';
import { businessService, businessRequestService, systemSettingsService, moduleSettingsService } from '../../services/db';
import { eventBus, EVENTS } from '../../services/eventBus';
import { storageService as storage } from '../../services/storage';
import { toast } from 'react-hot-toast';
import { ImageUpload } from '../../components/common/ImageUpload';
import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';

import { ActivityTab } from './components/ActivityTab';
import { PaymentTab } from './components/PaymentTab';
import { TeamSettings } from './components/TeamSettings';
import { SettingsRegistry } from '../../config/settingsRegistry';
import { type BusinessRequest } from '../../types';
import { STOREFRONT_THEMES } from '../../config/themes';
import './SettingsPage.css';

export function SettingsPage() {
    const { business } = useBusinessStore();
    const { theme, setTheme } = useUIStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';
    const [language, setLanguage] = useState('mn');
    const [notifications, setNotifications] = useState({
        newOrders: true,
        lowStock: true,
        cargoUpdates: true,
        teamActivity: false
    });
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [storefrontSlug, setStorefrontSlug] = useState(business?.slug || '');
    const [pendingRequest, setPendingRequest] = useState<BusinessRequest | null>(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [requestedChanges, setRequestedChanges] = useState<{ name?: string, slug?: string }>({});
    const [selectedThemeId, setSelectedThemeId] = useState(business?.settings?.storefront?.theme || 'minimal');
    const [logoFiles, setLogoFiles] = useState<File[]>([]);
    const [existingLogo, setExistingLogo] = useState<string[]>(business?.logo ? [business.logo] : []);

    const isStorefrontLocked = useMemo(() => {
        if (!business?.lastStorefrontChangeAt) return false;
        const daysSince = (new Date().getTime() - business.lastStorefrontChangeAt.getTime()) / (1000 * 3600 * 24);
        return daysSince < 365;
    }, [business?.lastStorefrontChangeAt]);

    useEffect(() => {
        setIsDirty(false);
        setStorefrontSlug(business?.slug || '');

        if (activeTab === 'storefront' && business) {
            businessRequestService.getPendingRequest(business.id)
                .then(setPendingRequest)
                .catch(console.error);
        }

        if (business?.settings?.storefront?.theme) {
            setSelectedThemeId(business.settings.storefront.theme);
        }

        if (business?.logo) {
            setExistingLogo([business.logo]);
        }

        if (business && activeTab === 'notifications') {
            moduleSettingsService.getSettings(business.id, 'notifications').then(data => {
                if (data) setNotifications(data);
            });
        }
    }, [activeTab, business?.slug, business?.id, business?.settings?.storefront?.theme, business?.logo, business]);

    const isStorefrontEnabled = business?.settings?.storefront?.enabled || business?.category === 'online_shop';

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

    const tabs = useMemo(() => {
        const coreTabs = [
            { id: 'general', label: 'Ерөнхий', icon: Building2 },
            { id: 'team', label: 'Баг', icon: Users },
            { id: 'storefront', label: 'Дэлгүүр', icon: ShoppingBag },
            ...(isStorefrontEnabled ? [{ id: 'themes', label: 'Загварууд', icon: Palette }] : []),
            { id: 'payment', label: 'Төлбөр & НӨАТ', icon: CreditCard },
            { id: 'appearance', label: 'Харагдац', icon: Palette },
            { id: 'notifications', label: 'Мэдэгдэл', icon: Bell },
            { id: 'security', label: 'Аюулгүй байдал', icon: Shield },
            { id: 'activity', label: 'Ажиллагсдын үйлдэл', icon: ListOrdered },
            { id: 'language', label: 'Хэл', icon: Globe },
        ];

        // Dynamic Plugin Tabs from modules.ts
        const pluginTabs = LISCORD_MODULES
            .filter(mod => mod.hasSettings && business?.activeModules?.includes(mod.id))
            .map(mod => ({
                id: mod.id === 'orders' ? 'statuses' : mod.id, // Legacy compatibility for 'statuses' tab
                label: mod.id === 'orders' ? 'Захиалгын төлөв' : mod.name,
                icon: (Icons as any)[mod.icon] || CheckSquare,
                moduleId: mod.id
            }));

        // Additional legacy tabs if needed
        const extraTabs = [
            { id: 'sources', label: 'Эх сурвалж', icon: Share2, moduleId: 'orders' },
        ].filter(t => business?.activeModules?.includes(t.moduleId));

        return { core: coreTabs, plugins: [...pluginTabs, ...extraTabs] };
    }, [business?.activeModules, isStorefrontEnabled]);

    const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            let logoUrl = business.logo;

            if (logoFiles.length > 0) {
                const file = logoFiles[0];
                const path = `businesses/${business.id}/logo/logo_${Date.now()}`;
                logoUrl = await storage.uploadImage(file, path);
            } else if (existingLogo.length === 0) {
                logoUrl = null;
            }

            await businessService.updateBusiness(business.id, {
                name: fd.get('name') as string,
                phone: fd.get('phone') as string,
                email: fd.get('email') as string,
                address: fd.get('address') as string,
                brandColor: fd.get('brandColor') as string,
                logo: logoUrl,
                settings: {
                    ...business.settings,
                    orderPrefix: (fd.get('orderPrefix') as string)?.trim() || '',
                }
            });
            setLogoFiles([]);
            setIsDirty(false);
            eventBus.emit(EVENTS.BUSINESS_UPDATED, { businessId: business.id });
            toast.success('Тохиргоо хадгалагдлаа');
        } catch (error) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally { setLoading(false); }
    };

    const handleUpdatePIN = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const pin = (new FormData(e.currentTarget)).get('pin') as string;
        if (pin.length < 4) return toast.error('PIN код дутуу байна');
        setLoading(true);
        try {
            await businessService.updateBusiness(business.id, { settings: { ...business.settings, pin } });
            setIsDirty(false);
            toast.success('PIN код шинэчлэгдлээ');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    const handleUpdateStorefront = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const fd = new FormData(e.currentTarget);
        const slug = fd.has('slug') ? (fd.get('slug') as string)?.trim().toLowerCase() : undefined;
        const storefrontName = fd.has('storefrontName') ? (fd.get('storefrontName') as string)?.trim() : undefined;
        const enabled = fd.has('storefrontEnabled') ? fd.get('storefrontEnabled') === 'on' : business.settings?.storefront?.enabled;
        const showFooter = fd.has('showFooter') ? fd.get('showFooter') === 'on' : business.settings?.storefront?.showFooter;
        const newTheme = fd.get('storefrontTheme') as string;

        setLoading(true);
        try {
            // Only validate slug if it's provided in the form
            if (slug !== undefined) {
                if (slug && !/^[a-z0-9-]+$/.test(slug)) {
                    toast.error('Холбоос зөвхөн жижиг англи үсэг, тоо болон дундуур зураас байж болно.');
                    setLoading(false);
                    return;
                }

                const slugChanged = slug !== business.slug;
                if (slugChanged) {
                    if (!business.slug) {
                        const existing = await businessService.getBusinessBySlug(slug);
                        if (existing) {
                            toast.error('Энэ дэлгүүрийн холбоос давхардсан байна. Өөр үг сонгоно уу.');
                            setLoading(false);
                            return;
                        }
                    } else {
                        toast.error('Шууд өөрчлөх боломжгүй. Хүсэлт илгээж өөрчилнө үү.');
                        setLoading(false);
                        return;
                    }
                }
            }

            // Update business core fields
            await businessService.updateBusiness(business.id, {
                slug: slug !== undefined ? (slug || business.slug || '') : (business.slug || ''),
            });

            // Update storefront module settings (V5 subcollection)
            const sfSettings = {
                ...business.settings?.storefront,
                enabled: enabled ?? false,
                showFooter: showFooter ?? true,
                theme: newTheme || business.settings?.storefront?.theme || 'minimal',
                name: storefrontName !== undefined ? storefrontName : (business.settings?.storefront?.name || '')
            };
            await moduleSettingsService.updateSettings(business.id, 'storefront', sfSettings);

            setIsDirty(false);
            toast.success('Дэлгүүрийн тохиргоо хадгалагдлаа');
        } catch (error) {
            console.error(error);
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business) return;
        setLoading(true);
        try {
            await businessRequestService.requestStorefrontChange(
                business.id,
                business.name,
                requestedChanges,
                requestReason
            );
            toast.success('Хүсэлт амжилттай илгээгдлээ');
            setShowRequestModal(false);
            setRequestReason('');
            const pending = await businessRequestService.getPendingRequest(business.id);
            setPendingRequest(pending);
        } catch (error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header title="Тохиргоо" />
            <div className="page">
                <div className="settings-layout">
                    <div className="settings-sidebar">
                        <div className="settings-sidebar-group" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0 1rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Үндсэн тохиргоо</div>
                            {tabs.core.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        {tabs.plugins.length > 0 && (
                            <div className="settings-sidebar-group">
                                <div style={{ padding: '0 1rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Залгаас тохиргоо</div>
                                {tabs.plugins.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                            onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                                        >
                                            <Icon size={18} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>    <div className="settings-content">
                        {activeTab === 'general' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Бизнесийн тохиргоо</h2>

                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Building2 size={20} /></div>
                                        <h3>Үндсэн мэдээлэл</h3>
                                    </div>
                                    <form className="settings-form" onSubmit={handleUpdateBusiness} onChange={() => setIsDirty(true)}>
                                        <div style={{ marginBottom: 20 }}>
                                            <ImageUpload
                                                images={existingLogo}
                                                onImagesChange={(urls) => {
                                                    setExistingLogo(urls);
                                                    setIsDirty(true);
                                                }}
                                                onFilesChange={(files) => {
                                                    setLogoFiles(files);
                                                    setIsDirty(true);
                                                }}
                                                maxImages={1}
                                                label="Бизнесийн лого"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Бизнесийн нэр</label>
                                            <input className="input" name="name" defaultValue={business?.name} required placeholder="Танай бизнесийн нэр" />
                                        </div>
                                        <div className="grid-2-gap">
                                            <div className="input-group">
                                                <label className="input-label">Утас</label>
                                                <input className="input" name="phone" defaultValue={business?.phone} placeholder="Холбоо барих утас" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">И-мэйл</label>
                                                <input className="input" name="email" defaultValue={business?.email} placeholder="Бизнес и-мэйл" />
                                            </div>
                                        </div>
                                        <div className="grid-2-gap">
                                            <div className="input-group">
                                                <label className="input-label">Хаяг</label>
                                                <input className="input" name="address" defaultValue={business?.address} placeholder="Бизнесийн байршил" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Захиалгын кодын эхлэл (Угтвар)</label>
                                                <input className="input" name="orderPrefix" defaultValue={business?.settings?.orderPrefix || 'ORD-'} placeholder="Жнь: ORD-" />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Брэндийн үндсэн өнгө (Hex code)</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="color"
                                                        title="Өнгө сонгох"
                                                        style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                                        defaultValue={business?.brandColor || '#6c5ce7'}
                                                        onChange={(e) => {
                                                            const textInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                                                            if (textInput) textInput.value = e.currentTarget.value;
                                                            setIsDirty(true);
                                                        }}
                                                    />
                                                    <input className="input" style={{ flex: 1 }} name="brandColor" defaultValue={business?.brandColor} placeholder="Жнь: #6c5ce7 (Хоосон бол автоматаар сонгогдоно)" />
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                            <button className="btn btn-primary gradient-btn" type="submit" disabled={loading || !isDirty} style={{ minWidth: 120 }}>
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <PaymentTab />
                        )}

                        {activeTab === 'storefront' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Дэлгүүрийн тохиргоо</h2>

                                <div className="settings-card">
                                    <div className="settings-card-header" style={{ marginBottom: 12 }}>
                                        <div className="settings-card-icon"><ShoppingBag size={20} /></div>
                                        <h3>Онлайн дэлгүүрийн холбоос болон нээлттэй эсэх</h3>
                                    </div>

                                    {pendingRequest && (
                                        <div style={{ padding: 12, borderRadius: 8, background: 'var(--warning-light)', color: 'var(--warning-dark)', marginBottom: 16, fontSize: '0.9rem', border: '1px solid var(--warning)' }}>
                                            <strong>Зөвшөөрөл хүлээгдэж байна!</strong> Таны нэр эсвэл холбоос солих хүсэлт Субер Админ руу илгээгдсэн тул одоогоор өөрчлөх боломжгүй байна.
                                        </div>
                                    )}
                                    {isStorefrontLocked && !pendingRequest && (
                                        <div style={{ padding: 12, borderRadius: 8, background: 'var(--info-light)', color: 'var(--info-dark)', marginBottom: 16, fontSize: '0.9rem', border: '1px solid var(--info)' }}>
                                            <strong>Хязгаарлалт:</strong> Дэлгүүрийн нэр болон холбоосыг жилд нэг л удаа өөрчлөх боломжтой.
                                        </div>
                                    )}

                                    <form className="settings-form" onSubmit={handleUpdateStorefront} onChange={() => setIsDirty(true)}>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <label className="input-label" style={{ margin: 0 }}>Дэлгүүрийн нэр <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*жилд 1 удаа</span></label>
                                            </div>
                                            <input className="input" name="storefrontName" defaultValue={business?.settings?.storefront?.name || ''} placeholder="NamShop" disabled={!!business?.slug || !!pendingRequest} />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Дэлгүүрийн хуудсан дээр харагдах нэр. Хоосон орхивол бизнесийн нэр харагдана.</p>
                                        </div>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <label className="input-label" style={{ margin: 0 }}>Дэлгүүрийн холбоос (Slug) <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*жилд 1 удаа</span></label>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                                <input className="input" name="slug" value={storefrontSlug} onChange={(e) => { setStorefrontSlug(e.target.value.toLowerCase()); setIsDirty(true); }} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон зураас ашиглана уу" style={{ flex: 1 }} disabled={!!business?.slug || !!pendingRequest} />
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Зөвхөн жижиг англи үсэг, тоо болон дундуур зураас орж болно.</p>
                                        </div>

                                        {!!business?.slug && !pendingRequest && !isStorefrontLocked && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12 }}>
                                                <button type="button" className="btn btn-outline" onClick={() => {
                                                    setRequestedChanges({});
                                                    setShowRequestModal(true);
                                                }}>
                                                    Түгжээ гаргах / Өөрчлөх хүсэлт илгээх
                                                </button>
                                            </div>
                                        )}
                                        <div className="notification-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border-color)', marginTop: '16px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Дэлгүүрийг нээх (Онлайн худалдаа)</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Хэрэв унтраасан бол хэрэглэгчид танай дэлгүүр рүү орж захиалга өгөх боломжгүйгээр түр хаагдана.</div>
                                            </div>
                                            <label className="toggle">
                                                <input
                                                    type="checkbox"
                                                    name="storefrontEnabled"
                                                    defaultChecked={business?.settings?.storefront?.enabled}
                                                />
                                                <span className="toggle-slider" />
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                                            <button className="btn btn-primary gradient-btn" type="submit" disabled={loading || !isDirty} style={{ minWidth: 120 }}>
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                                            </button>
                                        </div>
                                    </form>

                                    {storefrontSlug && (
                                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Танай дэлгүүрийн шууд линк:</div>
                                                <a href={`${window.location.origin}/s/${storefrontSlug}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                                                    {window.location.origin}/s/{storefrontSlug}
                                                </a>
                                            </div>
                                            <a href={`${window.location.origin}/s/${storefrontSlug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                                                Шалгах <Share2 size={14} style={{ marginLeft: 4 }} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'themes' && isStorefrontEnabled && (
                            <div className="settings-section animate-fade-in">
                                <h2>Дэлгүүрийн Загварууд</h2>
                                <div className="settings-card">
                                    <div className="settings-card-header" style={{ marginBottom: 12 }}>
                                        <div className="settings-card-icon"><Palette size={20} /></div>
                                        <h3>Вэбсайтын өнгө төрх сонгох</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                                        Таны бизнест хамгийн сайн тохирох 100% өвөрмөц бүтэцтэй загваруудаас сонгоно уу.
                                    </p>

                                    <form className="settings-form" onSubmit={handleUpdateStorefront} onChange={() => setIsDirty(true)}>
                                        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>Хөл хэсгийг харуулах (Footer)</div>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Дэлгүүрийн доод хэсэгт бизнесийн мэдээллийг харуулах.</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (business?.settings?.storefront?.showFooter ?? true) ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                    {(business?.settings?.storefront?.showFooter ?? true) ? 'Асаалттай' : 'Унтраасан'}
                                                </span>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        name="showFooter"
                                                        defaultChecked={business?.settings?.storefront?.showFooter ?? true}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                            {STOREFRONT_THEMES.map(t => {
                                                const installedThemes = business?.settings?.storefront?.installedThemes || ['minimal'];
                                                const isInstalled = installedThemes.includes(t.id);
                                                const isSelected = selectedThemeId === t.id;

                                                if (!isInstalled) return null;

                                                return (
                                                    <label key={t.id} style={{
                                                        position: 'relative',
                                                        border: isSelected ? '3px solid var(--primary)' : '1px solid var(--border-color)',
                                                        borderRadius: '16px',
                                                        padding: '20px',
                                                        cursor: 'pointer',
                                                        background: isSelected ? 'rgba(74, 107, 255, 0.05)' : '#fff',
                                                        transition: 'all 0.2s',
                                                        display: 'block',
                                                        boxShadow: isSelected ? '0 8px 20px rgba(74, 107, 255, 0.15)' : 'none',
                                                        transform: isSelected ? 'translateY(-2px)' : 'none'
                                                    }} onClick={() => {
                                                        setSelectedThemeId(t.id);
                                                        setIsDirty(true);
                                                    }}>
                                                        <input
                                                            type="radio"
                                                            name="storefrontTheme"
                                                            value={t.id}
                                                            checked={isSelected}
                                                            onChange={() => { }}
                                                            style={{ position: 'absolute', opacity: 0 }}
                                                        />
                                                        {isSelected && (
                                                            <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--primary)' }}>
                                                                <CheckCircle2 size={20} />
                                                            </div>
                                                        )}
                                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: t.color, marginBottom: 12, border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }} />
                                                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4, color: isSelected ? 'var(--primary)' : 'inherit' }}>{t.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                                                    </label>
                                                );
                                            })}

                                            <div
                                                onClick={() => setSearchParams({ tab: 'modules' })}
                                                style={{
                                                    border: '1px dashed var(--primary)',
                                                    borderRadius: '16px',
                                                    padding: '20px',
                                                    cursor: 'pointer',
                                                    background: 'rgba(74, 107, 255, 0.02)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    gap: '8px',
                                                    minHeight: '140px'
                                                }}
                                            >
                                                <ShoppingBag size={24} color="var(--primary)" />
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Шинэ загвар авах</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>App Store-оос илүү олон загвар үзэх</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                                            <button className="btn btn-primary gradient-btn" type="submit" disabled={loading || !isDirty} style={{ minWidth: 160, height: 48, borderRadius: 12, fontSize: '1rem' }}>
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Загвар сонгох'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Харагдац</h2>
                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Palette size={20} /></div>
                                        <h3>Аппын өнгө төрх</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                                        Системийн харагдах байдлыг өөрийн хүссэнээр өөрчлөх боломжтой.
                                    </p>

                                    <div className="theme-previews">
                                        {[
                                            { id: 'light', label: 'Цайвар', icon: Sun, class: 'preview-light' },
                                            { id: 'dark', label: 'Бараан', icon: Moon, class: 'preview-dark' },
                                            { id: 'system', label: 'Системийн', icon: Monitor, class: 'preview-system' }
                                        ].map(t => (
                                            <div
                                                key={t.id}
                                                className={`theme-preview-card ${t.class} ${theme === t.id ? 'active' : ''}`}
                                                onClick={() => setTheme(t.id as any)}
                                            >
                                                <div className="theme-mockup">
                                                    <div className="mockup-header" />
                                                    <div className="mockup-content">
                                                        <div className="mockup-sidebar" />
                                                        <div className="mockup-body" />
                                                    </div>
                                                </div>
                                                <div className="theme-preview-label">
                                                    <t.icon size={16} />
                                                    {t.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Аюулгүй байдал</h2>
                                <div className="settings-card" style={{ maxWidth: 500 }}>
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon" style={{ color: 'var(--danger)' }}><Shield size={20} /></div>
                                        <h3>PIN код тохируулах</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                                        Захиалга устгах, бүртгэл өөрчлөх зэрэг чухал үйлдлүүдэд ашиглагдана.
                                    </p>
                                    <form className="settings-form" onSubmit={handleUpdatePIN} onChange={() => setIsDirty(true)}>
                                        <div className="input-group">
                                            <label className="input-label">Шинэ PIN код</label>
                                            <input
                                                className="input"
                                                name="pin"
                                                type="password"
                                                maxLength={4}
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                defaultValue={business?.settings?.pin}
                                                style={{ maxWidth: 160, fontSize: '1.2rem', letterSpacing: '0.4em' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', marginTop: 8 }}>
                                            <button className="btn btn-primary" type="submit" disabled={loading || !isDirty}>
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'PIN шинэчлэх'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {activeTab === 'team' && <TeamSettings bizId={business?.id || ''} />}

                        {activeTab === 'notifications' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Мэдэгдэл</h2>
                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Bell size={20} /></div>
                                        <h3>Мэдэгдлийн тохиргоо</h3>
                                    </div>
                                    <div className="notification-toggles" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {[
                                            { id: 'newOrders', label: 'Шинэ захиалга', desc: 'Шинэ захиалга бүртгэгдэх үед мэдэгдэх' },
                                            { id: 'lowStock', label: 'Нөөц багассан', desc: 'Барааны үлдэгдэл доод хэмжээнд хүрэхэд мэдэгдэх' },
                                            { id: 'cargoUpdates', label: 'Карго шинэчлэл', desc: 'Каргоны төлөв өөрчлөгдөх үед мэдэгдэх' },
                                            { id: 'teamActivity', label: 'Багийн ажиллагаа', desc: 'Багийн гишүүд өөрчлөлт хийхэд мэдэгдэх' }
                                        ].map(item => (
                                            <div key={item.id} className="notification-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.label}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                                </div>
                                                <label className="toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={(notifications as any)[item.id]}
                                                        onChange={() => setNotifications(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                                                    />
                                                    <span className="toggle-slider" />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'language' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Хэлний тохиргоо</h2>
                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Globe size={20} /></div>
                                        <h3>Системийн хэл сонгох</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }}>
                                        {[
                                            { id: 'mn', label: 'Mongolian', desc: 'Монгол хэл', flag: '🇲🇳' },
                                            { id: 'en', label: 'English', desc: 'Англи хэл (Coming Soon)', flag: '🇺🇸', disabled: true }
                                        ].map(lang => (
                                            <div
                                                key={lang.id}
                                                className={`card ${language === lang.id ? 'active' : ''}`}
                                                style={{
                                                    padding: 24,
                                                    cursor: lang.disabled ? 'not-allowed' : 'pointer',
                                                    opacity: lang.disabled ? 0.6 : 1,
                                                    border: language === lang.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: language === lang.id ? 'var(--primary-light)' : 'var(--bg-card)',
                                                    borderRadius: 20
                                                }}
                                                onClick={() => !lang.disabled && setLanguage(lang.id)}
                                            >
                                                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{lang.flag}</div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{lang.label}</div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{lang.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Мэдэгдэл</h2>
                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Bell size={20} /></div>
                                        <h3>Мэдэгдлийн тохиргоо</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                                        Системээс ирэх мэдэгдлүүдийг өөрийн хүссэнээр тохируулна уу. (Subcollection ашиглан хадгалагдана)
                                    </p>

                                    <div className="notification-settings" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { id: 'newOrders', label: 'Шинэ захиалга', desc: 'Шинэ захиалга ирэх үед мэдэгдэх' },
                                            { id: 'lowStock', label: 'Барааны үлдэгдэл', desc: 'Бараа дуусах дөхөх үед мэдэгдэх' },
                                            { id: 'cargoUpdates', label: 'Каргоны төлөв', desc: 'Каргоны төлөв өөрчлөгдөх бүрт мэдэгдэх' },
                                            { id: 'teamActivity', label: 'Багийн ажиллагаа', desc: 'Багийн гишүүд чухал үйлдэл хийх үед мэдэгдэх' }
                                        ].map(item => (
                                            <div key={item.id} className="notification-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-soft)', borderRadius: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                                </div>
                                                <label className="toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={(notifications as any)[item.id]}
                                                        onChange={async (e) => {
                                                            const newValue = e.target.checked;
                                                            const updated = { ...notifications, [item.id]: newValue };
                                                            setNotifications(updated);
                                                            if (business) {
                                                                await moduleSettingsService.updateSettings(business.id, 'notifications', updated);
                                                                eventBus.emit(EVENTS.THEME_CHANGED, { source: 'notifications' }); // Generic trigger for UI refresh
                                                                toast.success('Тохиргоо хадгалагдлаа');
                                                            }
                                                        }}
                                                    />
                                                    <span className="toggle-slider" />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && <ActivityTab />}

                        {/* --- Dynamic Module Settings (Lazy Loaded) --- */}
                        {(() => {
                            const LazyComp = SettingsRegistry[activeTab] as any;
                            if (LazyComp && business) {
                                return (
                                    <Suspense fallback={
                                        <div className="settings-section animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                                        </div>
                                    }>
                                        <LazyComp bizId={business.id} business={business} />
                                    </Suspense>
                                );
                            }
                            return null;
                        })()}

                    </div>
                </div >
            </div >

            {/* Request Modal */}
            {
                showRequestModal && createPortal(
                    <div className="modal-overlay">
                        <div className="modal-content animate-scale" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h3><Shield size={18} style={{ color: 'var(--warning)', marginRight: 8, display: 'inline' }} /> Өөрчлөх хүсэлт илгээх</h3>
                                <button className="icon-btn" onClick={() => setShowRequestModal(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmitRequest} className="modal-body">
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Дэлгүүрийн нэр болон холбоосыг <strong style={{ color: 'var(--danger)' }}>жилд нэг л удаа</strong> өөрчилдөг тул Супер Админы зөвшөөрөл шаардлагатай.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                                    <div className="input-group">
                                        <label className="input-label" style={{ marginBottom: 4 }}>Шинэ дэлгүүрийн нэр</label>
                                        <input className="input" value={requestedChanges?.name || ''} onChange={e => setRequestedChanges(p => ({ ...p, name: e.target.value }))} placeholder="NamShop" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label" style={{ marginBottom: 4 }}>Шинэ холбоос (уншихад амархан)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                            <input className="input" style={{ flex: 1 }} value={requestedChanges?.slug || ''} onChange={e => setRequestedChanges(p => ({ ...p, slug: e.target.value.toLowerCase() }))} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон зураас ашиглана уу" />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label" style={{ marginBottom: 4 }}>Өөрчлөх шалтгаан</label>
                                        <textarea
                                            className="input"
                                            style={{ height: '80px', resize: 'vertical' }}
                                            placeholder="Шалтгаанаа тодорхой бичнэ үү..."
                                            value={requestReason}
                                            onChange={e => setRequestReason(e.target.value)}
                                            required
                                            minLength={10}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer" style={{ marginTop: 24 }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>Цуцлах</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Хүсэлт илгээх'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }
        </>
    );
}


