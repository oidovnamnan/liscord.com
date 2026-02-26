import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Building2, Palette, Bell, Shield, Users, Globe, Moon, Sun, Monitor, Loader2, Plus, MoreVertical, Trash2, Share2, X, CheckSquare, ListOrdered, ChevronUp, ChevronDown, ShoppingBag, Layers, CreditCard, Network } from 'lucide-react';
import { useBusinessStore, useUIStore } from '../../store';
import { businessService, teamService, cargoService, sourceService, orderStatusService, businessRequestService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../components/common/PINModal';
import { ActivityTab } from './components/ActivityTab';
import { ModulesTab } from './components/ModulesTab';
import { PaymentTab } from './components/PaymentTab';
import { B2BTab } from './components/B2BTab';
import { ALL_PERMISSIONS, type Position, type Employee, type CargoType, type OrderSource, type SocialAccount, type OrderStatusConfig, type BusinessRequest } from '../../types';
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
    }, [activeTab, business?.slug, business?.id]);

    const isStorefrontEnabled = business?.settings?.storefront?.enabled || business?.category === 'online_shop';

    const tabs = [
        { id: 'general', label: 'Ерөнхий', icon: Building2 },
        { id: 'modules', label: 'Бизнес Модуль', icon: Layers },
        { id: 'team', label: 'Баг', icon: Users },
        { id: 'storefront', label: 'Дэлгүүр', icon: ShoppingBag },
        ...(isStorefrontEnabled ? [{ id: 'themes', label: 'Загварууд', icon: Palette }] : []),
        { id: 'payment', label: 'Төлбөр & НӨАТ', icon: CreditCard },
        { id: 'statuses', label: 'Захиалгын төлөв', icon: CheckSquare },
        { id: 'cargo', label: 'Карго', icon: Globe },
        { id: 'sources', label: 'Эх сурвалж', icon: Share2 },
        { id: 'b2b', label: 'B2B Платформ', icon: Network },
        { id: 'appearance', label: 'Харагдац', icon: Palette },
        { id: 'notifications', label: 'Мэдэгдэл', icon: Bell },
        { id: 'security', label: 'Аюулгүй байдал', icon: Shield },
        { id: 'activity', label: 'Ажиллагсдын үйлдэл', icon: ListOrdered },
        { id: 'language', label: 'Хэл', icon: Globe },
    ];

    const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await businessService.updateBusiness(business.id, {
                name: fd.get('name') as string,
                phone: fd.get('phone') as string,
                email: fd.get('email') as string,
                address: fd.get('address') as string,
                brandColor: fd.get('brandColor') as string,
                settings: {
                    ...business.settings,
                    orderPrefix: (fd.get('orderPrefix') as string)?.trim() || '',
                }
            });
            setIsDirty(false);
            toast.success('Тохиргоо хадгалагдлаа');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
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

            // Update business
            await businessService.updateBusiness(business.id, {
                slug: slug !== undefined ? (slug || business.slug || '') : (business.slug || ''),
                settings: {
                    ...business.settings,
                    storefront: {
                        ...business.settings?.storefront,
                        enabled: enabled ?? false,
                        theme: newTheme || business.settings?.storefront?.theme || 'minimal',
                        name: storefrontName !== undefined ? storefrontName : (business.settings?.storefront?.name || '')
                    }
                }
            });
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
                        {tabs.map((tab) => {
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
                        {activeTab === 'b2b' && (
                            <B2BTab />
                        )}
                        {activeTab === 'payment' && (
                            <PaymentTab />
                        )}
                        {activeTab === 'modules' && (
                            <ModulesTab />
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
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                            {STOREFRONT_THEMES.map(t => {
                                                const installedThemes = business?.settings?.storefront?.installedThemes || ['minimal'];
                                                const isInstalled = installedThemes.includes(t.id);
                                                const isSelected = (business?.settings?.storefront?.theme || 'minimal') === t.id;

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
                                                    }}>
                                                        <input
                                                            type="radio"
                                                            name="storefrontTheme"
                                                            value={t.id}
                                                            defaultChecked={isSelected}
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
                        {activeTab === 'statuses' && business && (
                            <OrderStatusSettings bizId={business.id} />
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
                        {activeTab === 'cargo' && <CargoSettings bizId={business?.id || ''} />}
                        {activeTab === 'sources' && <SourceSettings bizId={business?.id || ''} />}

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

                        {activeTab === 'activity' && <ActivityTab />}

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

function TeamSettings({ bizId }: { bizId: string }) {
    const [subTab, setSubTab] = useState<'employees' | 'positions'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [showPosModal, setShowPosModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [showPIN, setShowPIN] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [selectedPosId, setSelectedPosId] = useState<string | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const u1 = teamService.subscribeEmployees(bizId, setEmployees);
        const u2 = teamService.subscribePositions(bizId, setPositions);
        return () => { u1(); u2(); };
    }, [bizId]);

    const handleDeletePos = (id: string) => {
        setSelectedPosId(id);
        setShowPIN(true);
    };

    const confirmDelete = async () => {
        if (!selectedPosId) return;
        try {
            await teamService.updatePosition(bizId, selectedPosId, { isDeleted: true } as any);
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setShowPIN(false); }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2>Баг</h2>
            <div className="settings-card">
                <div className="settings-card-header" style={{ marginBottom: 0 }}>
                    <div className="settings-card-icon"><Users size={20} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Багийн гишүүд болон эрх</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Багийн гишүүдийг урих, тэдний системд хандах эрхийг удирдах.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 4, marginTop: 24, marginBottom: 32, padding: 4, background: 'var(--bg-soft)', borderRadius: 12, width: 'fit-content' }}>
                    <button
                        className={`btn btn-sm ${subTab === 'employees' ? '' : 'btn-ghost'}`}
                        onClick={() => setSubTab('employees')}
                        style={{ borderRadius: 8, padding: '6px 16px', background: subTab === 'employees' ? '#fff' : 'transparent', color: subTab === 'employees' ? '#000' : 'inherit', boxShadow: subTab === 'employees' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                    >Ажилчид</button>
                    <button
                        className={`btn btn-sm ${subTab === 'positions' ? '' : 'btn-ghost'}`}
                        onClick={() => setSubTab('positions')}
                        style={{ borderRadius: 8, padding: '6px 16px', background: subTab === 'positions' ? '#fff' : 'transparent', color: subTab === 'positions' ? '#000' : 'inherit', boxShadow: subTab === 'positions' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                    >Эрхүүд / Албан тушаал</button>
                </div>

                {subTab === 'employees' ? (
                    <div className="team-list">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0 }}>Ажилчид ({employees.length})</h3>
                            <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowInvite(true)}><Plus size={14} /> Урих</button>
                        </div>
                        <div className="employee-grid">
                            {employees.map(emp => (
                                <div key={emp.id} className="settings-card employee-card">
                                    <div className="employee-avatar">{emp.avatar || emp.name.charAt(0)}</div>
                                    <div className="employee-info">
                                        <div className="employee-name">{emp.name}</div>
                                        <div className="employee-role">{emp.positionName || 'Ажилтан'}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="positions-list">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="icon-badge"><Shield size={16} /></div>
                                <h3 style={{ margin: 0 }}>Албан тушаалууд</h3>
                            </div>
                            <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingPosition(null); setShowPosModal(true); }}>
                                <Plus size={14} /> Нэмэх
                            </button>
                        </div>
                        <div className="positions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {positions.filter(p => !(p as any).isDeleted).map(pos => (
                                <div key={pos.id} className="settings-card position-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div className="position-info">
                                            <div className="position-name" style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{pos.name}</div>
                                            <div className="position-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pos.description || 'Тайлбар байхгүй'}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingPosition(pos); setShowPosModal(true); }}>
                                                <MoreVertical size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeletePos(pos.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showPosModal && <CreatePositionModal bizId={bizId} editingPosition={editingPosition} onClose={() => setShowPosModal(false)} />}
            {showPIN && <PINModal title="Устгах баталгаажуулалт" description="Албан тушаалын эрхийг устгахын тулд PIN кодыг оруулна уу." onSuccess={confirmDelete} onClose={() => setShowPIN(false)} />}
            {showInvite && <InviteEmployeeModal onClose={() => setShowInvite(false)} positions={positions} />}
        </div>
    );
}

function CreatePositionModal({ bizId, editingPosition, onClose }: { bizId: string; editingPosition: Position | null; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [selectedPerms, setSelectedPerms] = useState<string[]>(editingPosition?.permissions || []);

    const togglePermission = (permId: string) => {
        setSelectedPerms(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const toggleGroup = (_groupName: string, permIds: string[]) => {
        const allSelected = permIds.every(id => selectedPerms.includes(id));
        if (allSelected) {
            setSelectedPerms(prev => prev.filter(p => !permIds.includes(p)));
        } else {
            setSelectedPerms(prev => Array.from(new Set([...prev, ...permIds])));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const data = {
                name: fd.get('name') as string,
                description: fd.get('description') as string,
                color: '#6c5ce7',
                permissions: selectedPerms,
            };

            if (editingPosition) {
                await teamService.updatePosition(bizId, editingPosition.id, data);
                toast.success('Амжилттай засагдлаа');
            } else {
                await teamService.createPosition(bizId, {
                    ...data,
                    order: 1,
                    isSystem: false,
                    isDefault: false
                });
                toast.success('Амжилттай үүсгэлээ');
            }
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    // Group permissions by category
    const groupedPermissions: Record<string, { id: string; label: string }[]> = {};
    Object.entries(ALL_PERMISSIONS).forEach(([id, perm]) => {
        if (!groupedPermissions[perm.group]) groupedPermissions[perm.group] = [];
        groupedPermissions[perm.group].push({ id, label: perm.label });
    });

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 800, width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}><Shield size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editingPosition ? 'Албан тушаал засах' : 'Шинэ албан тушаал'}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Системд хандах эрхийн тохиргоо</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="modal-body" style={{ padding: 0, overflowY: 'auto' }}>

                        {/* SECTION 1: BASIC INFO */}
                        <div className="modal-section" style={{ padding: '24px 32px' }}>
                            <div className="modal-section-title" style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 16 }}>Үндсэн мэдээлэл</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 600 }}>Албан тушаалын нэр *</label>
                                    <input className="input" name="name" required defaultValue={editingPosition?.name} placeholder="Жнь: Менежер, Салбарын эрхлэгч..." style={{ height: 48 }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 600 }}>Тайлбар</label>
                                    <input className="input" name="description" defaultValue={editingPosition?.description} placeholder="Тухайн албан тушаалын үүрэг" style={{ height: 48 }} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PERMISSIONS */}
                        <div className="modal-section" style={{ padding: '24px 32px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border-primary)' }}>
                            <div className="modal-section-title" style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 20 }}>Системийн эрхүүд</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                                {Object.entries(groupedPermissions).map(([groupName, perms]) => {
                                    const allSelected = perms.every(p => selectedPerms.includes(p.id));
                                    const someSelected = perms.some(p => selectedPerms.includes(p.id));

                                    return (
                                        <div key={groupName} className="settings-card" style={{ padding: 20, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={input => { if (input) input.indeterminate = !allSelected && someSelected; }}
                                                    onChange={() => toggleGroup(groupName, perms.map(p => p.id))}
                                                    id={`group-${groupName}`}
                                                    style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: 18, height: 18 }}
                                                />
                                                <label htmlFor={`group-${groupName}`} style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', flex: 1, margin: 0 }}>{groupName}</label>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {perms.map(perm => (
                                                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPerms.includes(perm.id)}
                                                            onChange={() => togglePermission(perm.id)}
                                                            style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: 16, height: 16, marginTop: 2 }}
                                                        />
                                                        {perm.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '20px 32px', background: '#fff', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontWeight: 600 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ padding: '0 24px', fontWeight: 600 }}>
                            {editingPosition ? 'Өөрчлөлтийг хадгалах' : 'Үүсгэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function CargoSettings({ bizId }: { bizId: string }) {
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<CargoType | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const unsubscribe = cargoService.subscribeCargoTypes(bizId, setCargoTypes);
        return () => unsubscribe();
    }, [bizId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Энэ каргоны төрлийг устгах уу?')) return;
        try {
            await cargoService.updateCargoType(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2>Карго холболт</h2>
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Globe size={20} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Каргоны төрлүүд</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Захиалга үүсгэх үед ашиглагдах каргоны үнийн тохиргоо.</p>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingType(null); setShowModal(true); }}>
                        <Plus size={14} /> Төрөл нэмэх
                    </button>
                </div>

                <div className="cargo-types-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                    {cargoTypes.map(type => (
                        <div key={type.id} className="card cargo-type-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '16px 20px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{type.name}</div>
                                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem' }}>
                                    ₮{type.fee.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {type.unit}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingType(type); setShowModal(true); }}>
                                    <MoreVertical size={14} />
                                </button>
                                <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(type.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cargoTypes.length === 0 && (
                        <div className="empty-state-mini" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            <Globe size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
                            <div style={{ color: 'var(--text-muted)' }}>Каргоны төрөл бүртгэгдээгүй байна</div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <CargoTypeModal
                    bizId={bizId}
                    onClose={() => setShowModal(false)}
                    editingType={editingType}
                />
            )}
        </div>
    );
}

function CargoTypeModal({ bizId, onClose, editingType }: { bizId: string; onClose: () => void; editingType: CargoType | null }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
            name: fd.get('name') as string,
            fee: Number(fd.get('fee')),
            unit: fd.get('unit') as string,
        };

        setLoading(true);
        try {
            if (editingType) {
                await cargoService.updateCargoType(bizId, editingType.id, data);
            } else {
                await cargoService.createCargoType(bizId, data);
            }
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <h2>{editingType ? 'Төрөл засах' : 'Шинэ каргоны төрөл'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Төрлийн нэр</label>
                            <input className="input" name="name" defaultValue={editingType?.name} placeholder="Жишээ: Жижиг бараа" required autoFocus />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Төлбөр (₮)</label>
                                <input className="input" name="fee" type="number" defaultValue={editingType?.fee} placeholder="2000" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хэмжих нэгж</label>
                                <select className="input select" name="unit" defaultValue={editingType?.unit || 'ш'}>
                                    <option value="ш">ш (ширхэг)</option>
                                    <option value="кг">кг (килограмм)</option>
                                    <option value="л">л (литр)</option>
                                    <option value="м3">м3 (куб метр)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function SourceSettings({ bizId }: { bizId: string }) {
    const [sources, setSources] = useState<OrderSource[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingSource, setEditingSource] = useState<OrderSource | null>(null);
    const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const u1 = sourceService.subscribeSources(bizId, setSources);
        const u2 = sourceService.subscribeAccounts(bizId, null, setAccounts);
        return () => { u1(); u2(); };
    }, [bizId]);

    const handleDeleteSource = async (id: string) => {
        if (!confirm('Энэ эх сурвалжийг устгах уу?')) return;
        try {
            await sourceService.updateSource(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Энэ хаягийг устгах уу?')) return;
        try {
            await sourceService.updateAccount(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    const currentSource = sources.find(s => s.id === selectedSourceId);
    const filteredAccounts = accounts.filter(a => !selectedSourceId || a.sourceId === selectedSourceId);

    return (
        <div className="settings-section animate-fade-in">
            <h2>Эх сурвалж болон хаягууд</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24 }}>
                <div className="settings-card" style={{ padding: 24, border: '1px solid var(--border-color)', borderRadius: 20 }}>
                    <div className="settings-card-header">
                        <div className="settings-card-icon"><Share2 size={20} /></div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>Эх сурвалжууд</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Захиалга хаанаас ирж буйг бүртгэх</p>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingSource(null); setShowSourceModal(true); }}>
                            <Plus size={14} /> Нэмэх
                        </button>
                    </div>
                    <div className="source-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                        {sources.map(s => (
                            <div
                                key={s.id}
                                className={`card source-card ${selectedSourceId === s.id ? 'active' : ''}`}
                                style={{ padding: '16px 20px', cursor: 'pointer' }}
                                onClick={() => setSelectedSourceId(s.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ color: selectedSourceId === s.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                                            <Globe size={18} />
                                        </div>
                                        <div style={{ fontWeight: selectedSourceId === s.id ? 700 : 500, fontSize: '1rem' }}>{s.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); setEditingSource(s); setShowSourceModal(true); }}><MoreVertical size={14} /></button>
                                        <button className="btn btn-ghost btn-xs btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDeleteSource(s.id); }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sources.length === 0 && (
                            <div className="empty-state-illustrative">
                                <Share2 size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>Эх сурвалж бүртгэгдээгүй байна</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="settings-card" style={{ padding: 24, border: '1px solid var(--border-color)', borderRadius: 20 }}>
                    <div className="settings-card-header">
                        <div className="settings-card-icon" style={{ background: 'var(--bg-soft)', color: 'var(--text-primary)' }}><Users size={20} /></div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>{currentSource ? `${currentSource.name} хаягууд` : 'Бүх хаягууд'}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Тухайн суваг дээрх албан ёсны пэйжүүд</p>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" disabled={!selectedSourceId} onClick={() => setShowAccountModal(true)}>
                            <Plus size={14} /> Хаяг нэмэх
                        </button>
                    </div>

                    <div className="account-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                        {filteredAccounts.map(a => (
                            <div key={a.id} className="card account-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                                        {a.name.charAt(0)}
                                    </div>
                                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {!selectedSourceId && <span className="account-badge">{sources.find(s => s.id === a.sourceId)?.name}</span>}
                                    <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeleteAccount(a.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}

                        {selectedSourceId && filteredAccounts.length === 0 && (
                            <div className="empty-state-illustrative" style={{ padding: '40px 20px' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Plus size={20} style={{ opacity: 0.4 }} />
                                </div>
                                <p style={{ fontWeight: 500, marginBottom: 4 }}>Хаяг бүртгэгдээгүй байна</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>"{currentSource?.name}" эх сурвалжид хамаарах хаяг/пэйж нэмнэ үү</p>
                            </div>
                        )}

                        {!selectedSourceId && sources.length > 0 && (
                            <div className="empty-state-illustrative" style={{ padding: '40px 20px' }}>
                                <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Зүүн талын жагсаалтаас эх сурвалж сонгож хаяг удирдана уу</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSourceModal && <OrderSourceModal bizId={bizId} onClose={() => setShowSourceModal(false)} editingSource={editingSource} />}
            {showAccountModal && <SocialAccountModal bizId={bizId} sourceId={selectedSourceId!} sourceName={currentSource?.name || ''} onClose={() => setShowAccountModal(false)} />}
        </div>
    );
}

function OrderSourceModal({ bizId, onClose, editingSource }: { bizId: string; onClose: () => void; editingSource: OrderSource | null }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const data = { name: fd.get('name') as string };
            if (editingSource) await sourceService.updateSource(bizId, editingSource.id, data);
            else await sourceService.createSource(bizId, data);
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 24 }}>
                <div className="modal-header" style={{ padding: '24px 24px 12px' }}>
                    <h2 style={{ fontSize: '1.4rem' }}>{editingSource ? 'Эх сурвалж засах' : 'Шинэ эх сурвалж'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '0 28px 28px' }}>
                        <div className="input-group">
                            <label className="input-label">Эх сурвалжийн нэр</label>
                            <input className="input" name="name" defaultValue={editingSource?.name} placeholder="Жишээ: Facebook, Instagram, TikTok..." required autoFocus style={{ height: 48, borderRadius: 12 }} />
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '0 28px 28px', border: 'none', gap: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 16 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 50, borderRadius: 16 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function SocialAccountModal({ bizId, sourceId, sourceName, onClose }: { bizId: string; sourceId: string; sourceName: string; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await sourceService.createAccount(bizId, { name: fd.get('name') as string, sourceId });
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 24 }}>
                <div className="modal-header" style={{ padding: '24px 24px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Шинэ хаяг / Пэйж</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Эх сурвалж: <strong>{sourceName}</strong></span>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '0 28px 28px' }}>
                        <div className="input-group">
                            <label className="input-label">Пэйж буюу хаягийн нэр</label>
                            <input className="input" name="name" placeholder="Жишээ: Liscord Shop, Facebook Page A..." required autoFocus style={{ height: 48, borderRadius: 12 }} />
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '0 28px 28px', border: 'none', gap: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 16 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 50, borderRadius: 16 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Нэмэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
function OrderStatusSettings({ bizId }: { bizId: string }) {
    const [statuses, setStatuses] = useState<OrderStatusConfig[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingStatus, setEditingStatus] = useState<OrderStatusConfig | null>(null);

    useEffect(() => {
        if (!bizId) return;
        return orderStatusService.subscribeStatuses(bizId, (data) => {
            // Sort by order
            setStatuses(data.sort((a, b) => a.order - b.order));
        });
    }, [bizId]);

    const handleDelete = async (id: string, isSystem: boolean) => {
        if (isSystem) return toast.error('Системийн төлөвийг устгах боломжгүй');
        if (!confirm('Энэ төлөвийг устгах уу?')) return;
        try {
            await orderStatusService.deleteStatus(bizId, id);
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    const [moving, setMoving] = useState(false);

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (moving) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= statuses.length) return;

        setMoving(true);
        const newStatuses = [...statuses];
        [newStatuses[index], newStatuses[newIndex]] = [newStatuses[newIndex], newStatuses[index]];

        try {
            // Update all to ensure sequential unique orders to avoid unstable sorting in DB
            await Promise.all(newStatuses.map((s, idx) =>
                orderStatusService.updateStatus(bizId, s.id, { order: idx })
            ));
        } catch (e) {
            toast.error('Дараалал солиход алдаа гарлаа');
        } finally {
            setMoving(false);
        }
    };

    return (
        <div className="settings-section animate-fade-in" style={{ padding: '0 var(--space-xs)' }}>
            <div className="section-header-compact" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-badge"><ListOrdered size={18} /></div>
                    <div>
                        <h3 style={{ margin: 0 }}>Захиалгын төлөвүүд</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Захиалгын явцыг хянах төлөвүүдийг тохируулна уу</p>
                    </div>
                </div>
                <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingStatus(null); setShowModal(true); }}>
                    <Plus size={14} /> Төлөв нэмэх
                </button>
            </div>

            <div className="status-settings-grid">
                {statuses.map((s, idx) => (
                    <div
                        key={s.id}
                        className={`card status-config-card ${!s.isActive ? 'is-inactive' : ''}`}
                        style={{
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: `4px solid ${s.color}`,
                            opacity: s.isActive ? 1 : 0.6
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="reorder-actions" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button
                                    className="btn btn-ghost btn-xs btn-icon"
                                    style={{ padding: 2, height: 20, width: 20 }}
                                    onClick={() => handleMove(idx, 'up')}
                                    disabled={idx === 0 || moving}
                                >
                                    <ChevronUp size={12} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs btn-icon"
                                    style={{ padding: 2, height: 20, width: 20 }}
                                    onClick={() => handleMove(idx, 'down')}
                                    disabled={idx === statuses.length - 1 || moving}
                                >
                                    <ChevronDown size={12} />
                                </button>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.label}</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {s.isSystem && <span style={{ fontSize: '0.65rem', background: 'var(--bg-soft)', padding: '2px 6px', borderRadius: 4, opacity: 0.7 }}>СИСТЕМ</span>}
                                {!s.isActive && <span style={{ fontSize: '0.65rem', background: '#ef444420', color: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>ИДЭВХГҮЙ</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); setEditingStatus(s); setShowModal(true); }} disabled={moving}><MoreVertical size={14} /></button>
                            {!s.isSystem && (
                                <button className="btn btn-ghost btn-xs btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.isSystem); }} disabled={moving}><Trash2 size={14} /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && <OrderStatusModal bizId={bizId} onClose={() => setShowModal(false)} editingStatus={editingStatus} nextOrder={statuses.length} />}
        </div>
    );
}

function OrderStatusModal({ bizId, onClose, editingStatus, nextOrder }: { bizId: string; onClose: () => void; editingStatus: OrderStatusConfig | null; nextOrder: number }) {
    const [loading, setLoading] = useState(false);
    const [color, setColor] = useState(editingStatus?.color || '#3b82f6');
    const [isActive, setIsActive] = useState(editingStatus ? editingStatus.isActive : true);

    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#334155', '#0f172a',
        '#06b6d4', '#84cc16', '#a855f7', '#f97316', '#14b8a6', '#475569'
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const label = fd.get('label') as string;
            const data: Partial<OrderStatusConfig> = {
                label,
                color,
                order: editingStatus?.order || nextOrder,
                isActive,
                isSystem: editingStatus?.isSystem ?? false
            };

            if (editingStatus) {
                await orderStatusService.updateStatus(bizId, editingStatus.id, data);
            } else {
                // Generate a simple ID from label, fallback to random if empty (e.g. Mongolian)
                const slug = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                const id = slug || `status_${Date.now()}`;
                await orderStatusService.addStatus(bizId, { ...data, id });
            }
            toast.success('Амжилттай хадгалагдлаа');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop premium-backdrop" onClick={onClose}>
            <div className="modal premium-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                            {editingStatus ? 'Төлөв засах' : 'Шинэ төлөв'}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {editingStatus ? 'Мэдээллийг шинэчлэх' : 'Шинэ дамжлага нэмэх'}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ borderRadius: '12px' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-primary)' }}>Төлөвийн нэр</label>
                            <input
                                className="input"
                                name="label"
                                defaultValue={editingStatus?.label}
                                placeholder="Жишээ: Хүлээн авсан..."
                                required
                                autoFocus
                                style={{ height: 48, borderRadius: 12, fontSize: '1rem', padding: '0 16px' }}
                            />
                        </div>

                        <div className="input-group" style={{ marginTop: 20 }}>
                            <label className="input-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-primary)' }}>Өнгө сонгох</label>
                            <div className="color-swatch-grid" style={{ gap: 10 }}>
                                {colors.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`color-swatch ${color === c ? 'active' : ''}`}
                                        style={{ background: c, height: 36, borderRadius: 10 }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="premium-toggle-card">
                            <div style={{ flex: 1, paddingRight: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Төлөв идэвхтэй</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 2, fontWeight: 500 }}>
                                    Шинээр захиалга үүсгэхэд харагдана
                                </div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 46, borderRadius: 12, fontWeight: 700 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ flex: 1, height: 46, borderRadius: 12 }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function InviteEmployeeModal({ onClose, positions }: { onClose: () => void; positions: Position[] }) {
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ажилтан урих</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group">
                        <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                        <input className="input" placeholder="+976 9900 1234" autoFocus />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Албан тушаал</label>
                        <select className="input select">
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Урилга линк тухайн дугаар руу SMS-ээр илгээгдэнэ.
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Болих</button>
                    <button className="btn btn-primary" onClick={onClose}><Plus size={16} /> Урих</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
