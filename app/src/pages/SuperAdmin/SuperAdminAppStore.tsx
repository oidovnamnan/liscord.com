import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, Save, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import { systemSettingsService } from '../../services/db';
import * as Icons from 'lucide-react';
import type { AppModule } from '../../types';
import { SecurityModal } from '../../components/common/SecurityModal';

export function SuperAdminAppStore() {
    const [modules, setModules] = useState<AppModule[]>(LISCORD_MODULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await systemSettingsService.getAppStoreConfig();
                // Filter and Merge static modules with dynamic config
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
        fetchConfig();
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
            // Build config object from modules state (now only containing non-core modules)
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

    if (loading) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="App Store Удирдлага"
                subtitle="Нэмэлт модулиудын үнэ болон захиалгын хугацааг тохируулах"
            />

            <div className="page-content">
                <div className="table-actions">
                    <div className="section-header">
                        <div className="stats-icon-wrapper active-tint">
                            <DollarSign size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Модулийн үнийн тохиргоо</h2>
                    </div>
                    <button className="btn btn-primary gradient-btn" onClick={handleSaveClick} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Тохиргоог хадгалах
                    </button>
                </div>

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
                        .plan-label {
                            font-size: 0.65rem;
                            color: var(--text-tertiary);
                            font-weight: 600;
                            text-transform: uppercase;
                            margin-bottom: 4px;
                            display: block;
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
                            {modules.map((mod) => (
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
                                                <div className="text-[0.7rem] text-tertiary font-mono" style={{ letterSpacing: '0.02em', opacity: 0.6 }}>{mod.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold opacity-50 uppercase">{mod.isFree ? 'Үнэгүй' : 'Төлбөртэй'}</span>
                                            <label className="ios-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={mod.isFree}
                                                    onChange={() => handleToggleFree(mod.id)}
                                                />
                                                <span className="ios-slider"></span>
                                            </label>
                                        </div>
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
        </div>
    );
}

export default SuperAdminAppStore;
