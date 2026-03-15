import { useState, useEffect } from 'react';
import { Loader2, Save, DollarSign, Clock, ArrowRight, Sparkles, Search, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import { systemSettingsService } from '../../services/db';
import * as Icons from 'lucide-react';
import type { AppModule } from '../../types';
import { SecurityModal } from '../../components/common/SecurityModal';
import './SuperAdmin.css';

export function SuperAdminAppStore() {
    const navigate = useNavigate();
    const [modules, setModules] = useState<AppModule[]>(LISCORD_MODULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [moduleDefaults, setModuleDefaults] = useState<Record<string, Record<string, string>>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await systemSettingsService.getAppStoreConfig();
                const filtered = LISCORD_MODULES.filter(m => !m.isCore).map(mod => {
                    const dynamic = config[mod.id];
                    if (dynamic) {
                        return { ...mod, ...dynamic };
                    }
                    return mod;
                });
                setModules(filtered);
            } catch (error) {
                console.error('Fetch config error:', error);
                toast.error('Тохиргоо татахад алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };
        const fetchDefaults = async () => {
            try {
                const data = await systemSettingsService.getModuleDefaults();
                setModuleDefaults(data);
            } catch (e) {
                console.error('Failed to fetch module defaults:', e);
            }
        };
        fetchConfig();
        fetchDefaults();
    }, []);

    const handleToggleFree = (id: string) => {
        setModules((prev: AppModule[]) => prev.map((mod: AppModule) => {
            if (mod.id === id) {
                const isFree = !mod.isFree;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatedPlans = (mod.plans || []).map((p: any) => ({
                    ...p,
                    price: isFree ? 0 : p.price
                }));
                return { ...mod, isFree, plans: updatedPlans };
            }
            return mod;
        }));
    };

    const handleUpdatePlan = (modId: string, planId: string, field: 'price' | 'durationDays', value: number) => {
        setModules((prev: AppModule[]) => prev.map((mod: AppModule) => {
            if (mod.id === modId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updatedPlans = (mod.plans || []).map((p: any) =>
                    p.id === planId ? { ...p, [field]: value } : p
                );
                return { ...mod, plans: updatedPlans };
            }
            return mod;
        }));
    };

    const handleSaveClick = () => {
        setShowSecurityModal(true);
    };

    const handleSave = async () => {
        setShowSecurityModal(false);
        setSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const config: Record<string, { isFree: boolean; plans: any[] }> = {};
            modules.forEach((mod: AppModule) => {
                config[mod.id] = {
                    isFree: mod.isFree ?? false,
                    plans: mod.plans || []
                };
            });

            await systemSettingsService.updateAppStoreConfig(config);
            toast.success('App Store-ын тохиргоо хадгалагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    // Stats
    const totalModules = modules.length;
    const freeModules = modules.filter(m => m.isFree).length;
    const paidModules = totalModules - freeModules;

    // Filtered
    const filtered = modules
        .filter(m => {
            if (filter === 'free') return m.isFree;
            if (filter === 'paid') return !m.isFree;
            return true;
        })
        .filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const filterTabs = [
        { id: 'all' as const, label: 'Бүгд', count: totalModules },
        { id: 'paid' as const, label: 'Төлбөртэй', count: paidModules },
        { id: 'free' as const, label: 'Үнэгүй', count: freeModules },
    ];

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium Hero ── */}
            <div className="sa-hero" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 40%, #f97316 100%)', boxShadow: '0 8px 32px rgba(225, 29, 72, 0.25)' }}>
                <div className="sa-hero-top">
                    <div className="sa-hero-left">
                        <div className="sa-hero-icon"><ShoppingBag size={24} /></div>
                        <div>
                            <div className="sa-hero-badge"><Sparkles size={10} /> Үнэ удирдлага</div>
                            <h1 className="sa-hero-title">App Store Удирдлага</h1>
                            <div className="sa-hero-desc">Нэмэлт модулиудын үнэ болон захиалгын хугацааг тохируулах</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <button
                            className="sa-hero-btn"
                            onClick={() => navigate('/super/settings')}
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                        >
                            Модуль Тохиргоо
                            <ArrowRight size={14} />
                        </button>
                        <button
                            className="sa-hero-btn"
                            onClick={handleSaveClick}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            {saving ? 'Хадгалж...' : 'Хадгалах'}
                        </button>
                    </div>
                </div>
                <div className="sa-hero-stats">
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{totalModules}</div>
                        <div className="sa-hero-stat-label">Нийт модуль</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{paidModules}</div>
                        <div className="sa-hero-stat-label">Төлбөртэй</div>
                    </div>
                    <div className="sa-hero-stat">
                        <div className="sa-hero-stat-value">{freeModules}</div>
                        <div className="sa-hero-stat-label">Үнэгүй</div>
                    </div>
                </div>
            </div>

            {/* ── Search + Filter Tabs ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--border-primary)',
                    borderRadius: 14, padding: '8px 16px', flex: '1 1 260px', maxWidth: 400
                }}>
                    <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        type="text"
                        placeholder="Модуль хайх..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text-primary)', fontSize: '0.88rem', width: '100%'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: filter === tab.id ? '1.5px solid var(--primary)' : '1px solid var(--border-primary)',
                                background: filter === tab.id ? 'var(--primary-light)' : 'var(--surface-2)',
                                color: filter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                            <span style={{
                                background: filter === tab.id ? 'var(--primary)' : 'var(--bg-soft)',
                                color: filter === tab.id ? '#fff' : 'var(--text-tertiary)',
                                padding: '1px 7px',
                                borderRadius: 10,
                                fontSize: '0.7rem',
                                fontWeight: 800
                            }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card no-padding overflow-hidden border-glass shadow-lg">
                <style>{`
                    .custom-input-group {
                        display: flex;
                        align-items: center;
                        background: var(--bg-tertiary);
                        border: 1px solid var(--border-primary);
                        border-radius: 12px;
                        padding: 0 12px;
                        transition: all 0.2s ease;
                        height: 36px;
                    }
                    .custom-input-group:focus-within {
                        border-color: var(--primary);
                        box-shadow: 0 0 0 3px var(--primary-light);
                        background: var(--bg-secondary);
                    }
                    .custom-input {
                        background: transparent;
                        border: none;
                        outline: none;
                        color: var(--text-primary);
                        font-size: 0.85rem;
                        font-weight: 600;
                        width: 100%;
                        padding: 0 4px;
                        text-align: right;
                    }
                    .custom-input:disabled {
                        opacity: 0.4;
                        cursor: not-allowed;
                    }
                    .custom-input::-webkit-inner-spin-button, 
                    .custom-input::-webkit-outer-spin-button { 
                        -webkit-appearance: none; 
                        margin: 0; 
                    }
                    .app-store-table th {
                        padding: 16px 20px;
                        text-transform: uppercase;
                        font-size: 0.7rem;
                        letter-spacing: 0.05em;
                        color: var(--text-tertiary);
                    }
                    .app-store-table td {
                        padding: 12px 20px;
                    }
                `}</style>
                <table className="super-table app-store-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '32px' }}>Модуль</th>
                            <th>Үнэгүй эсэх</th>
                            <th>Сонголт 1 (Сар)</th>
                            <th>Сонголт 2 (Жил)</th>
                            <th>Hub ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((mod) => (
                            <tr key={mod.id}>
                                <td style={{ paddingLeft: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <div className="w-12 h-12 bg-surface-2 flex items-center justify-center rounded-xl border border-primary-light/40 text-primary shadow-sm" style={{ flexShrink: 0 }}>
                                            {(() => {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const Icon = (Icons as any)[mod.icon] || Icons.Box;
                                                return <Icon size={24} strokeWidth={1.5} />;
                                            })()}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div className="font-bold text-[0.95rem]" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>{mod.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="text-[0.7rem] text-tertiary font-mono" style={{ letterSpacing: '0.02em', opacity: 0.6 }}>{mod.id}</span>
                                                {(() => {
                                                    const coreCount = Object.values(moduleDefaults).filter(catDefs => catDefs[mod.id] === 'core').length;
                                                    if (coreCount > 0) return (
                                                        <span style={{
                                                            fontSize: '0.6rem', fontWeight: 700,
                                                            background: 'var(--success-light)', color: 'var(--success)',
                                                            padding: '1px 6px', borderRadius: '8px',
                                                        }}>{coreCount} салбарт core</span>
                                                    );
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <label className="ios-switch">
                                        <input
                                            type="checkbox"
                                            checked={mod.isFree}
                                            onChange={() => handleToggleFree(mod.id)}
                                        />
                                        <span className="ios-slider"></span>
                                    </label>
                                </td>
                                {/* Plan 1 */}
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '140px' }}>
                                        <div className="custom-input-group" style={{ opacity: mod.isFree ? 0.5 : 1 }}>
                                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.8rem' }}>₮</span>
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.plans?.[0]?.price ?? 0}
                                                disabled={mod.isFree}
                                                onChange={(e) => handleUpdatePlan(mod.id, mod.plans?.[0]?.id || 'monthly', 'price', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="custom-input-group" style={{ opacity: mod.isFree ? 0.5 : 1 }}>
                                            <Clock size={14} className="text-tertiary" />
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.plans?.[0]?.durationDays ?? 30}
                                                disabled={mod.isFree}
                                                onChange={(e) => handleUpdatePlan(mod.id, mod.plans?.[0]?.id || 'monthly', 'durationDays', parseInt(e.target.value) || 0)}
                                            />
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500, paddingLeft: '4px' }}>өдөр</span>
                                        </div>
                                    </div>
                                </td>
                                {/* Plan 2 */}
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '140px' }}>
                                        <div className="custom-input-group" style={{ opacity: mod.isFree ? 0.5 : 1 }}>
                                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.8rem' }}>₮</span>
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.plans?.[1]?.price ?? 0}
                                                disabled={mod.isFree}
                                                onChange={(e) => handleUpdatePlan(mod.id, mod.plans?.[1]?.id || 'yearly', 'price', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="custom-input-group" style={{ opacity: mod.isFree ? 0.5 : 1 }}>
                                            <Clock size={14} className="text-tertiary" />
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.plans?.[1]?.durationDays ?? 365}
                                                disabled={mod.isFree}
                                                onChange={(e) => handleUpdatePlan(mod.id, mod.plans?.[1]?.id || 'yearly', 'durationDays', parseInt(e.target.value) || 0)}
                                            />
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500, paddingLeft: '4px' }}>өдөр</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-tertiary text-xs font-mono" style={{ opacity: 0.6 }}>
                                    {mod.hubId || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showSecurityModal && (
                <SecurityModal
                    onSuccess={handleSave}
                    onClose={() => setShowSecurityModal(false)}
                />
            )}
        </div>
    );
}

export default SuperAdminAppStore;
