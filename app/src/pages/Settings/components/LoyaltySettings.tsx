import { useState, useEffect } from 'react';
import { Gift, Coins, UserPlus, Save, Loader2 } from 'lucide-react';
import { loyaltyService } from '../../../services/db';
import { toast } from 'react-hot-toast';

export function LoyaltySettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enabled: false,
        pointsPerUnit: 1, // 1 point per 1,000 Tugrik maybe?
        minSpendToEarn: 0,
        minPointsToRedeem: 100,
        referralBonus: 50,
        expiryDays: 365
    });

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        loyaltyService.subscribeConfig(bizId, (data) => {
            if (data) setConfig(prev => ({ ...prev, ...data }));
            setLoading(false);
        });
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await loyaltyService.updateConfig(bizId, config);
            toast.success('Лоялти тохиргоо хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '200px' }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    return (
        <div className="settings-section animate-fade-in">
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Gift size={20} /></div>
                    <h3>Лоялти & Онооны тохиргоо</h3>
                </div>

                <div className="settings-form">
                    <div className="toggle-group" style={{ marginBottom: 24, padding: 16, background: config.enabled ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-soft)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Лоялти систем идэвхжүүлэх</div>
                                <div className="input-info">Харилцагчдад худалдан авалтаас нь оноо өгч эхлэх.</div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={config.enabled}
                                    onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>

                    <div className="divider" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="input-group">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Coins size={16} color="var(--primary)" />
                                <label className="input-label" style={{ margin: 0 }}>Оноо тооцох (1000 ₮ бүрт)</label>
                            </div>
                            <input
                                className="input"
                                type="number"
                                value={config.pointsPerUnit}
                                onChange={e => setConfig({ ...config, pointsPerUnit: Number(e.target.value) })}
                                placeholder="1"
                            />
                            <p className="input-info">Жишээ нь: 1000 ₮ тутамд 1 оноо.</p>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Доод онооны хэмжээ</label>
                            <input
                                className="input"
                                type="number"
                                value={config.minPointsToRedeem}
                                onChange={e => setConfig({ ...config, minPointsToRedeem: Number(e.target.value) })}
                                placeholder="100"
                            />
                            <p className="input-info">Хэрэглэгч хамгийн багадаа хэдэн оноотой байж зарцуулж болох вэ.</p>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="input-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <UserPlus size={16} color="var(--primary)" />
                            <label className="input-label" style={{ margin: 0 }}>Найзаа урьсан урамшуулал (Оноо)</label>
                        </div>
                        <input
                            className="input"
                            type="number"
                            value={config.referralBonus}
                            onChange={e => setConfig({ ...config, referralBonus: Number(e.target.value) })}
                            placeholder="50"
                        />
                        <p className="input-info">Урилгаар бүртгүүлсэн харилцагчид оноо өгөх.</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                        <button
                            className="btn btn-primary gradient-btn"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ minWidth: 140 }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Хадгалах
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
