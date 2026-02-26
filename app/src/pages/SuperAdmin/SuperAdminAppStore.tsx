import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, Save, CheckCircle2, XCircle, DollarSign, Clock, Shield, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import { systemSettingsService } from '../../services/db';
import * as Icons from 'lucide-react';
import type { AppModule } from '../../types';

export function SuperAdminAppStore() {
    const [modules, setModules] = useState<AppModule[]>(LISCORD_MODULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityPassword, setSecurityPassword] = useState('');

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
        setModules(prev => prev.map(mod => {
            if (mod.id === id) {
                const isFree = !mod.isFree;
                const updatedPlans = (mod.plans || []).map(p => ({
                    ...p,
                    price: isFree ? 0 : p.price
                }));
                return { ...mod, isFree, plans: updatedPlans };
            }
            return mod;
        }));
    };

    const handleUpdatePlan = (modId: string, planId: string, field: 'price' | 'durationDays', value: number) => {
        setModules(prev => prev.map(mod => {
            if (mod.id === modId) {
                const updatedPlans = (mod.plans || []).map(p =>
                    p.id === planId ? { ...p, [field]: value } : p
                );
                return { ...mod, plans: updatedPlans };
            }
            return mod;
        }));
    };

    const handleSaveClick = () => {
        setShowSecurityModal(true);
        setSecurityPassword('');
    };

    const handleSave = async () => {
        if (securityPassword !== '102311') {
            toast.error('Аюулгүй байдлын нууц үг буруу байна!');
            return;
        }

        setShowSecurityModal(false);
        setSaving(true);
        try {
            // Build config object from modules state (now only containing non-core modules)
            const config: Record<string, { isFree: boolean; plans: any[] }> = {};
            modules.forEach(mod => {
                config[mod.id] = {
                    isFree: mod.isFree ?? false,
                    plans: mod.plans || []
                };
            });

            await systemSettingsService.updateAppStoreConfig(config);
            toast.success('App Store-ын тохиргоо хадгалагдлаа');
        } catch (error) {
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

                        /* Security Modal Styles */
                        .security-overlay {
                            position: fixed;
                            inset: 0;
                            background: rgba(0, 0, 0, 0.6);
                            backdrop-filter: blur(8px);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                            animation: fadeIn 0.3s ease;
                        }
                        .security-modal {
                            background: var(--surface-1);
                            width: 100%;
                            max-width: 400px;
                            border-radius: 24px;
                            padding: 32px;
                            border: 1px solid var(--border-primary);
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
                                        <button
                                            className={`btn btn-sm ${mod.isFree ? 'btn-success' : 'btn-outline'} min-w-[115px]`}
                                            onClick={() => handleToggleFree(mod.id)}
                                            style={{ height: '34px', borderRadius: '10px', fontSize: '0.8rem' }}
                                        >
                                            {mod.isFree ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {mod.isFree ? 'Үнэгүй' : 'Төлбөртэй'}
                                        </button>
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

                {/* Security Modal */}
                {showSecurityModal && (
                    <div className="security-overlay">
                        <div className="security-modal">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl">
                                    <Shield size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Аюулгүй байдлын нууц үг</h3>
                                    <p className="text-sm text-tertiary mt-1">Системийн өөрчлөлтийг баталгаажуулахын тулд нууц үгээ оруулна уу.</p>
                                </div>

                                <div className="w-full mt-4">
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" />
                                        <input
                                            type="password"
                                            className="w-full bg-tertiary border border-primary-light/40 rounded-xl h-12 pl-12 pr-4 font-bold text-lg"
                                            placeholder="••••••"
                                            autoFocus
                                            value={securityPassword}
                                            onChange={(e) => setSecurityPassword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full mt-6">
                                    <button className="btn btn-outline flex-1 h-12" onClick={() => setShowSecurityModal(false)}>
                                        Цуцлах
                                    </button>
                                    <button className="btn btn-primary gradient-btn flex-1 h-12" onClick={handleSave}>
                                        Баталгаажуулах
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
