import { useState, useEffect } from 'react';
import { moduleSettingsService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Undo2, Save, Clock, AlertTriangle, Camera, Loader2 } from 'lucide-react';
import type { ReturnsConfig } from '../../../types';

const DEFAULTS: ReturnsConfig = {
    enabled: true,
    arrivalWarningDays: 30,
    deliveryTimeoutDays: 35,
    productIssueDeadlineDays: 14,
    requireEvidence: true,
};

interface Props {
    bizId: string;
}

export function ReturnsSettings({ bizId }: Props) {
    const [config, setConfig] = useState<ReturnsConfig>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        moduleSettingsService.getSettings(bizId, 'returns').then((data) => {
            if (data) setConfig({ ...DEFAULTS, ...data });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await moduleSettingsService.updateSettings(bizId, 'returns', config);
            toast.success('Буцаалтын тохиргоо хадгалагдлаа');
        } catch {
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-section" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    return (
        <div className="settings-section animate-fade-in">
            <h2>Буцаалтын тохиргоо</h2>

            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff' }}>
                        <Undo2 size={20} />
                    </div>
                    <h3>Хугацааны тохиргоо</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
                    {/* Arrival Warning Days */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 4 }}>
                                Бараа ирээгүй анхааруулга (хоног)
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                                Захиалга үүсснээс X хоног болсон ч бараа УБ-д бүртгэгдээгүй бол Сорсинг хуудасны "Ирээгүй" табд харагдана.
                            </p>
                            <input
                                type="number"
                                className="input"
                                value={config.arrivalWarningDays}
                                onChange={e => setConfig(c => ({ ...c, arrivalWarningDays: Number(e.target.value) }))}
                                min={1}
                                max={365}
                                style={{ width: 120, height: 40, borderRadius: 10, fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}
                            />
                        </div>
                    </div>

                    {/* Delivery Timeout */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertTriangle size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 4 }}>
                                Хүргэлт хоцорсон (хоног)
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                                Захиалга Y хоног хэтэрсэн + хүргэгдээгүй бол захиалагчид буцаалт хийх эрх автомат үүснэ.
                            </p>
                            <input
                                type="number"
                                className="input"
                                value={config.deliveryTimeoutDays}
                                onChange={e => setConfig(c => ({ ...c, deliveryTimeoutDays: Number(e.target.value) }))}
                                min={1}
                                max={365}
                                style={{ width: 120, height: 40, borderRadius: 10, fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}
                            />
                        </div>
                    </div>

                    {/* Product Issue Deadline */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Camera size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 4 }}>
                                Бараа асуудлын хугацаа (хоног)
                            </label>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                                Захиалагч бараа хүлээн авсны дараа Z хоногийн дотор асуудал мэдэгдэх ёстой.
                            </p>
                            <input
                                type="number"
                                className="input"
                                value={config.productIssueDeadlineDays}
                                onChange={e => setConfig(c => ({ ...c, productIssueDeadlineDays: Number(e.target.value) }))}
                                min={1}
                                max={365}
                                style={{ width: 120, height: 40, borderRadius: 10, fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}
                            />
                        </div>
                    </div>

                    {/* Require Evidence */}
                    <div className="modern-toggle-item">
                        <div className="toggle-info">
                            <h4>📸 Зураг/Бичлэг заавал</h4>
                            <p>Бараа асуудалтай буцаалтад зураг/бичлэг оруулахыг шаардах</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={config.requireEvidence}
                                onChange={e => setConfig(c => ({ ...c, requireEvidence: e.target.checked }))}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <button
                        className="btn btn-primary gradient-btn"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ minWidth: 160, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Хадгалах
                    </button>
                </div>
            </div>
        </div>
    );
}
