import { useState, useEffect } from 'react';
import { moduleSettingsService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { Trash2, Save, Loader2, Clock, ShoppingCart, Archive, Users, QrCode, Bell, BarChart3 } from 'lucide-react';

interface CleanupTask {
    enabled: boolean;
    value: number;
    unit: 'hours' | 'days';
}

interface CleanupConfig {
    unpaidOrders: CleanupTask;
    archiveDeleted: CleanupTask;
    staleVisitors: CleanupTask;
    qrSessions: CleanupTask;
    oldNotifications: CleanupTask;
    oldDailyStats: CleanupTask;
}

const DEFAULTS: CleanupConfig = {
    unpaidOrders: { enabled: true, value: 24, unit: 'hours' },
    archiveDeleted: { enabled: true, value: 30, unit: 'days' },
    staleVisitors: { enabled: true, value: 24, unit: 'hours' },
    qrSessions: { enabled: true, value: 24, unit: 'hours' },
    oldNotifications: { enabled: true, value: 90, unit: 'days' },
    oldDailyStats: { enabled: false, value: 365, unit: 'days' },
};

const TASK_META: Record<keyof CleanupConfig, {
    icon: React.ReactNode;
    label: string;
    description: string;
    unitLabel: string;
    min: number;
    max: number;
}> = {
    unpaidOrders: {
        icon: <ShoppingCart size={20} />,
        label: 'Баталгаажаагүй захиалга',
        description: 'Төлбөр хийгдээгүй захиалгуудыг хугацаа дуусмагц soft-delete хийнэ',
        unitLabel: 'цаг',
        min: 1,
        max: 168,
    },
    archiveDeleted: {
        icon: <Archive size={20} />,
        label: 'Устгасан бичлэг архивлах',
        description: 'Устгагдсан захиалга, бараа, зарлагыг архив руу шилжүүлнэ',
        unitLabel: 'хоног',
        min: 7,
        max: 365,
    },
    staleVisitors: {
        icon: <Users size={20} />,
        label: 'Хуучин зочид',
        description: 'Дэлгүүр хуудасны зочдын хуучин бичлэгүүдийг устгана',
        unitLabel: 'цаг',
        min: 1,
        max: 72,
    },
    qrSessions: {
        icon: <QrCode size={20} />,
        label: 'QR нэвтрэлтийн түүх',
        description: 'Хуучин QR login session бичлэгүүдийг устгана',
        unitLabel: 'цаг',
        min: 1,
        max: 72,
    },
    oldNotifications: {
        icon: <Bell size={20} />,
        label: 'Хуучин мэдэгдэл',
        description: 'Уншсан хуучин мэдэгдлүүдийг системээс устгана',
        unitLabel: 'хоног',
        min: 7,
        max: 365,
    },
    oldDailyStats: {
        icon: <BarChart3 size={20} />,
        label: 'Хуучин өдрийн статистик',
        description: 'Хуучин daily_stats бичлэгүүдийг устгана',
        unitLabel: 'хоног',
        min: 30,
        max: 730,
    },
};

interface Props {
    bizId: string;
}

export function CleanupSettings({ bizId }: Props) {
    const [config, setConfig] = useState<CleanupConfig>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        moduleSettingsService.getSettings(bizId, 'cleanup').then((data) => {
            if (data) setConfig({ ...DEFAULTS, ...data });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await moduleSettingsService.updateSettings(bizId, 'cleanup', config);
            toast.success('Цэвэрлэгээний тохиргоо хадгалагдлаа');
        } catch {
            toast.error('Хадгалахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const updateTask = (key: keyof CleanupConfig, field: 'enabled' | 'value', val: boolean | number) => {
        setConfig(c => ({
            ...c,
            [key]: { ...c[key], [field]: val },
        }));
    };

    if (loading) {
        return (
            <div className="settings-section" style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
        );
    }

    const enabledCount = Object.values(config).filter(t => t.enabled).length;

    return (
        <div className="settings-section animate-fade-in">
            <h2>Систем цэвэрлэгээ</h2>

            {/* Info banner */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: 14, padding: '16px 20px', color: '#fff', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 14,
            }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={22} />
                </div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>Шөнийн автомат цэвэрлэгээ</div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                        Шөнө бүр 04:00 цагт идэвхтэй ажлуудыг автомат гүйцэтгэнэ · {enabledCount} ажил идэвхтэй
                    </div>
                </div>
            </div>

            {/* Cleanup tasks */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff' }}>
                        <Clock size={20} />
                    </div>
                    <h3>Цэвэрлэгээний ажлууд</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 12 }}>
                    {(Object.keys(TASK_META) as (keyof CleanupConfig)[]).map((key, idx) => {
                        const meta = TASK_META[key];
                        const task = config[key];

                        return (
                            <div
                                key={key}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '16px 0',
                                    borderTop: idx > 0 ? '1px solid var(--border, #e5e7eb)' : undefined,
                                    opacity: task.enabled ? 1 : 0.5,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                    background: task.enabled ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.04)',
                                    color: task.enabled ? '#6366f1' : '#aaa',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {meta.icon}
                                </div>

                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{meta.label}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #888)', marginTop: 2 }}>
                                        {meta.description}
                                    </div>
                                </div>

                                {/* Time input */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    <input
                                        type="number"
                                        className="input"
                                        value={task.value}
                                        onChange={e => updateTask(key, 'value', Number(e.target.value))}
                                        min={meta.min}
                                        max={meta.max}
                                        disabled={!task.enabled}
                                        style={{
                                            width: 70, height: 36, borderRadius: 8, fontWeight: 700,
                                            fontSize: '0.9rem', textAlign: 'center',
                                        }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', fontWeight: 600, minWidth: 36 }}>
                                        {meta.unitLabel}
                                    </span>
                                </div>

                                {/* Toggle */}
                                <label className="toggle" style={{ flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={task.enabled}
                                        onChange={e => updateTask(key, 'enabled', e.target.checked)}
                                    />
                                    <span className="toggle-slider" />
                                </label>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
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
