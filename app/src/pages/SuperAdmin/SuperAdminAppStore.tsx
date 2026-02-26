import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, Save, CheckCircle2, XCircle, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import { systemSettingsService } from '../../services/db';
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
                        price: mod.price,
                        durationDays: mod.durationDays,
                        isFree: mod.isFree
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

                <div className="card no-padding overflow-hidden">
                    <table className="super-table">
                        <thead>
                            <tr>
                                <th>Модуль</th>
                                <th>Төрөл</th>
                                <th>Үнэгүй эсэх</th>
                                <th>Үнэ (₮)</th>
                                <th>Хугацаа (Хоног)</th>
                                <th>Hub ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((mod) => (
                                <tr key={mod.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-surface-2 flex items-center justify-center rounded-lg text-xl border border-primary-light/50">
                                                {mod.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{mod.name}</div>
                                                <div className="text-[0.7rem] text-tertiary font-mono">{mod.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${mod.isCore ? 'badge-primary' : 'badge-neutral'}`}>
                                            {mod.isCore ? 'Core' : 'Optional'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={`btn btn-sm ${mod.isFree ? 'btn-success' : 'btn-outline'} min-w-[110px]`}
                                            onClick={() => handleToggleFree(mod.id)}
                                            disabled={mod.isCore}
                                        >
                                            {mod.isFree ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {mod.isFree ? 'Үнэгүй' : 'Төлбөртэй'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="input-with-icon max-w-[150px]">
                                            <DollarSign size={14} className="text-tertiary" />
                                            <input
                                                type="number"
                                                className="input"
                                                value={mod.price}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdatePrice(mod.id, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div className="input-with-icon max-w-[120px]">
                                            <Clock size={14} className="text-tertiary" />
                                            <input
                                                type="number"
                                                className="input"
                                                value={mod.durationDays}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdateDuration(mod.id, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </td>
                                    <td className="text-tertiary text-xs font-mono">
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
