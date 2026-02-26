import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, Save, CheckCircle2, XCircle, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LISCORD_MODULES } from '../../config/modules';
import type { AppModule } from '../../types';

export function SuperAdminAppStore() {
    const [modules, setModules] = useState<AppModule[]>(LISCORD_MODULES);
    const [saving, setSaving] = useState(false);

    // In a real app, we would fetch these overrides from Firestore
    // For now, we use the hardcoded defaults and allow "saving" (mocked)

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
            // Mocking Firestore save of system config
            await new Promise(resolve => setTimeout(resolve, 1000));
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                    <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Тохиргоог хадгалах
                    </button>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '16px' }}>Модуль</th>
                                <th style={{ padding: '16px' }}>Төрөл</th>
                                <th style={{ padding: '16px' }}>Үнэгүй эсэх</th>
                                <th style={{ padding: '16px' }}>Үнэ (₮)</th>
                                <th style={{ padding: '16px' }}>Хугацаа (Хоног)</th>
                                <th style={{ padding: '16px' }}>Hub</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.map((mod) => (
                                <tr key={mod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                                {mod.icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{mod.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mod.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span className={`badge badge-${mod.isCore ? 'primary' : 'neutral'}`}>
                                            {mod.isCore ? 'Core' : 'Optional'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button
                                            className={`btn btn-sm ${mod.isFree ? 'btn-success' : 'btn-outline'}`}
                                            onClick={() => handleToggleFree(mod.id)}
                                            disabled={mod.isCore}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {mod.isFree ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {mod.isFree ? 'Үнэгүй' : 'Төлбөртэй'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div className="input-with-icon" style={{ maxWidth: '140px' }}>
                                            <DollarSign size={14} />
                                            <input
                                                type="number"
                                                className="input"
                                                value={mod.price}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdatePrice(mod.id, parseInt(e.target.value) || 0)}
                                                style={{ paddingLeft: '32px' }}
                                            />
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div className="input-with-icon" style={{ maxWidth: '120px' }}>
                                            <Clock size={14} />
                                            <input
                                                type="number"
                                                className="input"
                                                value={mod.durationDays}
                                                disabled={mod.isFree || mod.isCore}
                                                onChange={(e) => handleUpdateDuration(mod.id, parseInt(e.target.value) || 0)}
                                                style={{ paddingLeft: '32px' }}
                                            />
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
