import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, Save, CheckCircle2, XCircle, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import { systemSettingsService } from '../../services/db';
import * as Icons from 'lucide-react';
import type { AppModule } from '../../types';

export function SuperAdminAppStore() {
    const [modules, setModules] = useState<AppModule[]>(LISCORD_MODULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await systemSettingsService.getAppStoreConfig();
                // Merge static modules with dynamic config
                const merged = LISCORD_MODULES.map(mod => {
                    const dynamic = config[mod.id];
                    if (dynamic) {
                        return { ...mod, ...dynamic };
                    }
                    return mod;
                });
                setModules(merged);
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
        setModules(prev => prev.map(mod =>
            mod.id === id ? { ...mod, isFree: !mod.isFree, price: !mod.isFree ? 0 : mod.price } : mod
        ));
    };

    const handleUpdatePrice = (id: string, price: number) => {
        setModules(prev => prev.map(mod =>
            mod.id === id ? { ...mod, price } : mod
        ));
    };

    const handleUpdateDuration = (id: string, durationDays: number) => {
        setModules(prev => prev.map(mod =>
            mod.id === id ? { ...mod, durationDays } : mod
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build config object from modules state
            const config: Record<string, { price: number; durationDays: number; isFree: boolean }> = {};
            modules.forEach(mod => {
                if (!mod.isCore) {
                    config[mod.id] = {
                        price: mod.price ?? 0,
                        durationDays: mod.durationDays ?? 0,
                        isFree: mod.isFree ?? false
                    };
                }
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
                subtitle="Модулиудын үнэ болон захиалгын хугацааг тохируулах"
            />

            <div className="page-content">
                <div className="table-actions">
                    <div className="section-header">
                        <div className="stats-icon-wrapper active-tint">
                            <DollarSign size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Модулийн үнийн тохиргоо</h2>
                    </div>
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving}>
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
                            height: 40px;
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
                            font-size: 0.95rem;
                            font-weight: 600;
                            width: 100%;
                            padding: 0 8px;
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
                            padding: 16px 20px;
                        }
                    `}</style>
                    <table className="super-table app-store-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '32px' }}>Модуль</th>
                                <th>Төрөл</th>
                                <th>Үнэгүй эсэх</th>
                                <th>Үнэ (₮)</th>
                                <th>Хугацаа (Хоног)</th>
                                <th>Hub ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((mod) => (
                                <tr key={mod.id} style={mod.isCore ? { opacity: 0.6 } : {}}>
                                    <td style={{ paddingLeft: '32px' }}>
                                        <div className="flex items-center gap-4">
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
                                        <span className={`badge ${mod.isCore ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.7rem', height: '24px' }}>
                                            {mod.isCore ? 'Core' : 'Optional'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`btn btn-sm ${mod.isFree ? 'btn-success' : 'btn-outline'} min-w-[115px]`}
                                            onClick={() => handleToggleFree(mod.id)}
                                            disabled={mod.isCore}
                                            style={{ height: '34px', borderRadius: '10px', fontSize: '0.8rem' }}
                                        >
                                            {mod.isFree ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {mod.isFree ? 'Үнэгүй' : 'Төлбөртэй'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="custom-input-group" style={{ maxWidth: '160px', opacity: mod.isFree || mod.isCore ? 0.5 : 1 }}>
                                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.9rem' }}>₮</span>
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.price}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdatePrice(mod.id, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="custom-input-group" style={{ maxWidth: '140px', opacity: mod.isFree || mod.isCore ? 0.5 : 1 }}>
                                            <Clock size={16} className="text-tertiary" />
                                            <input
                                                type="number"
                                                className="custom-input"
                                                value={mod.durationDays}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdateDuration(mod.id, parseInt(e.target.value) || 0)}
                                            />
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, paddingLeft: '8px' }}>өдөр</span>
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
            </div>
        </div>
    );
}
