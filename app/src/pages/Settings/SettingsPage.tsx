import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { Building2, Palette, Bell, Shield, Users, Globe, Moon, Sun, Monitor, Loader2, Plus, MoreVertical, Trash2, Share2, X, CheckSquare, ListOrdered, ChevronUp, ChevronDown, ShoppingBag } from 'lucide-react';
import { useBusinessStore, useUIStore } from '../../store';
import { businessService, teamService, cargoService, sourceService, orderStatusService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../components/common/PINModal';
import { ActivityTab } from './components/ActivityTab';
import type { Position, Employee, CargoType, OrderSource, SocialAccount, OrderStatusConfig } from '../../types';
import './SettingsPage.css';

export function SettingsPage() {
    const { business } = useBusinessStore();
    const { theme, setTheme } = useUIStore();
    const [activeTab, setActiveTab] = useState('general');
    const [language, setLanguage] = useState('mn');
    const [notifications, setNotifications] = useState({
        newOrders: true,
        lowStock: true,
        cargoUpdates: true,
        teamActivity: false
    });
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'general', label: 'Ерөнхий', icon: Building2 },
        { id: 'storefront', label: 'Дэлгүүр', icon: ShoppingBag },
        { id: 'appearance', label: 'Харагдац', icon: Palette },
        { id: 'notifications', label: 'Мэдэгдэл', icon: Bell },
        { id: 'security', label: 'Аюулгүй байдал', icon: Shield },
        { id: 'team', label: 'Баг', icon: Users },
        { id: 'cargo', label: 'Карго', icon: Globe },
        { id: 'sources', label: 'Эх сурвалж', icon: Share2 },
        { id: 'statuses', label: 'Захиалгын төлөв', icon: CheckSquare },
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
                settings: {
                    ...business.settings,
                    orderPrefix: (fd.get('orderPrefix') as string)?.trim() || '',
                }
            });
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
            toast.success('PIN код шинэчлэгдлээ');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    const handleUpdateStorefront = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const fd = new FormData(e.currentTarget);
        const slug = (fd.get('slug') as string)?.trim().toLowerCase();
        const enabled = fd.get('storefrontEnabled') === 'on';
        setLoading(true);
        try {
            // Check if slug is unique (if it changed)
            if (slug && slug !== business.slug) {
                const existing = await businessService.getBusinessBySlug(slug);
                if (existing) {
                    toast.error('Энэ дэлгүүрийн холбоос давхардсан байна. Өөр үг сонгоно уу.');
                    setLoading(false);
                    return;
                }
            }
            await businessService.updateBusiness(business.id, {
                slug: slug || business.slug || '',
                settings: {
                    ...business.settings,
                    storefront: {
                        enabled,
                        theme: business.settings.storefront?.theme || 'light'
                    }
                }
            });
            toast.success('Дэлгүүрийн тохиргоо хадгалагдлаа');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return (
        <>
            <Header title="Тохиргоо" />
            <div className="page">
                <div className="settings-layout">
                    <div className="settings-sidebar">
                        {tabs.map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} className={`settings-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                                    <Icon size={18} /> {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="settings-content">
                        {activeTab === 'general' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Бизнесийн тохиргоо</h2>

                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><Building2 size={20} /></div>
                                        <h3>Үндсэн мэдээлэл</h3>
                                    </div>
                                    <form className="settings-form" onSubmit={handleUpdateBusiness}>
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
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                            <button className="btn btn-primary gradient-btn" type="submit" disabled={loading} style={{ minWidth: 120 }}>
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {activeTab === 'storefront' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Дэлгүүрийн тохиргоо</h2>

                                <div className="settings-card">
                                    <div className="settings-card-header">
                                        <div className="settings-card-icon"><ShoppingBag size={20} /></div>
                                        <h3>Онлайн дэлгүүрийн холбоос болон нээлттэй эсэх</h3>
                                    </div>
                                    <form className="settings-form" onSubmit={handleUpdateStorefront}>
                                        <div className="input-group">
                                            <label className="input-label">Дэлгүүрийн холбоос (Slug)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{window.location.origin}/s/</span>
                                                <input className="input" name="slug" defaultValue={business?.slug} placeholder="zara-mongolia" required pattern="[a-z0-9-]+" title="Зөвхөн жижиг англи үсэг, тоо болон зураас ашиглана уу" style={{ flex: 1 }} />
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Зөвхөн жижиг англи үсэг, тоо болон дундуур зураас орж болно.</p>
                                        </div>
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
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                            <button className="btn btn-primary gradient-btn" type="submit" disabled={loading} style={{ minWidth: 120 }}>
                                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                                            </button>
                                        </div>
                                    </form>

                                    {business?.slug && business?.settings?.storefront?.enabled && (
                                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Танай дэлгүүрийн шууд линк:</div>
                                                <a href={`${window.location.origin}/s/${business.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                                                    {window.location.origin}/s/{business.slug}
                                                </a>
                                            </div>
                                            <a href={`${window.location.origin}/s/${business.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                                                Шалгах <Share2 size={14} style={{ marginLeft: 4 }} />
                                            </a>
                                        </div>
                                    )}
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
                                    <form className="settings-form" onSubmit={handleUpdatePIN}>
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
                                            <button className="btn btn-primary" type="submit" disabled={loading}>
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
                </div>
            </div>
        </>
    );
}

function TeamSettings({ bizId }: { bizId: string }) {
    const [subTab, setSubTab] = useState<'employees' | 'positions'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [showPosModal, setShowPosModal] = useState(false);
    const [showPIN, setShowPIN] = useState(false);
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
            <div className="settings-subtabs">
                <button className={`settings-subtab ${subTab === 'employees' ? 'active' : ''}`} onClick={() => setSubTab('employees')}>Ажилчид</button>
                <button className={`settings-subtab ${subTab === 'positions' ? 'active' : ''}`} onClick={() => setSubTab('positions')}>Эрхүүд / Албан тушаал</button>
            </div>

            {subTab === 'employees' ? (
                <div className="team-list">
                    <div className="section-header-compact"><h3>Ажилчид ({employees.length})</h3><button className="btn btn-primary btn-sm"><Plus size={14} /> Урих</button></div>
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
                    <div className="section-header-compact" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="icon-badge"><Shield size={16} /></div>
                            <h3 style={{ margin: 0 }}>Албан тушаалууд</h3>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowPosModal(true)}>
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
                                        <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={14} /></button>
                                        <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeletePos(pos.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showPosModal && <CreatePositionModal bizId={bizId} onClose={() => setShowPosModal(false)} />}
            {showPIN && <PINModal title="Устгах баталгаажуулалт" description="Албан тушаалын эрхийг устгахын тулд PIN кодыг оруулна уу." onSuccess={confirmDelete} onClose={() => setShowPIN(false)} />}
        </div>
    );
}

function CreatePositionModal({ bizId, onClose }: { bizId: string; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await teamService.createPosition(bizId, {
                name: fd.get('name') as string,
                description: fd.get('description') as string,
                color: '#6c5ce7',
                permissions: [],
                order: 1,
                isSystem: false,
                isDefault: false
            });
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return (
        <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Шинэ албан тушаал</h2><button onClick={onClose}>✕</button></div>
            <form onSubmit={handleSubmit}><div className="modal-body">
                <div className="input-group"><label className="input-label">Нэр</label><input className="input" name="name" required /></div>
                <div className="input-group"><label className="input-label">Тайлбар</label><input className="input" name="description" /></div>
            </div><div className="modal-footer"><button type="submit" className="btn btn-primary" disabled={loading}>Хадгалах</button></div></form>
        </div></div>
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
            <div className="section-header-compact">
                <h3>Каргоны төрлүүд</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingType(null); setShowModal(true); }}>
                    <Plus size={14} /> Төрөл нэмэх
                </button>
            </div>

            <div className="cargo-types-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                {cargoTypes.map(type => (
                    <div key={type.id} className="settings-card cargo-type-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
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

    return (
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
        </div>
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
        <div className="settings-section animate-fade-in" style={{ padding: '0 var(--space-xs)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32 }}>
                <div className="sources-list">
                    <div className="section-header-compact" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="icon-badge"><Share2 size={16} /></div>
                            <h3 style={{ margin: 0 }}>Эх сурвалжууд</h3>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingSource(null); setShowSourceModal(true); }}>
                            <Plus size={14} /> Нэмэх
                        </button>
                    </div>
                    <div className="source-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

                <div className="accounts-list">
                    <div className="section-header-compact" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="icon-badge" style={{ background: 'var(--bg-soft)' }}><Users size={16} /></div>
                            <h3 style={{ margin: 0 }}>{currentSource ? `${currentSource.name} хаягууд` : 'Бүх хаягууд'}</h3>
                        </div>
                        <button className="btn btn-primary btn-sm" disabled={!selectedSourceId} onClick={() => setShowAccountModal(true)}>
                            <Plus size={14} /> Хаяг нэмэх
                        </button>
                    </div>

                    <div className="account-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
    return (
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
        </div>
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
    return (
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
        </div>
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
