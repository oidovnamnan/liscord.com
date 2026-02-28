import { useState, useEffect } from 'react';
import { Boxes, Bell, Barcode, Scale, Loader2, Save } from 'lucide-react';
import { moduleSettingsService } from '../../../services/db';
import { toast } from 'react-hot-toast';

export function InventorySettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        lowStockThreshold: 5,
        enableAutoBarcode: false,
        defaultUOM: 'ш',
        trackExpiry: false,
        requireReasonForAdjustment: true
    });

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        moduleSettingsService.getSettings(bizId, 'inventory')
            .then(data => {
                if (data) setSettings(prev => ({ ...prev, ...data }));
            })
            .finally(() => setLoading(false));
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await moduleSettingsService.updateSettings(bizId, 'inventory', settings);
            toast.success('Агуулахын тохиргоо хадгалагдлаа');
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
                    <div className="settings-card-icon"><Boxes size={20} /></div>
                    <h3>Агуулахын ерөнхий тохиргоо</h3>
                </div>

                <div className="settings-form">
                    <div className="input-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Bell size={16} color="var(--primary)" />
                            <label className="input-label" style={{ margin: 0 }}>Бараа дуусах доод хязгаар (Low Stock Threshold)</label>
                        </div>
                        <input
                            className="input"
                            type="number"
                            value={settings.lowStockThreshold}
                            onChange={e => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                            placeholder="5"
                        />
                        <p className="input-info">Үлдэгдэл энэ тооноос багасвал "Бараа дуусч байна" мэдэгдэл очих болно.</p>
                    </div>

                    <div className="divider" />

                    <div className="input-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Scale size={16} color="var(--primary)" />
                            <label className="input-label" style={{ margin: 0 }}>Үндсэн хэмжих нэгж (Default UOM)</label>
                        </div>
                        <select
                            className="input"
                            value={settings.defaultUOM}
                            onChange={e => setSettings({ ...settings, defaultUOM: e.target.value })}
                        >
                            <option value="ш">Ширхэг (ш)</option>
                            <option value="кг">Килограмм (кг)</option>
                            <option value="л">Литр (л)</option>
                            <option value="м">Метр (м)</option>
                            <option value="хайрцаг">Хайрцаг</option>
                        </select>
                    </div>

                    <div className="divider" />

                    <div className="toggle-group" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Barcode size={16} /> Автомат баркод үүсгэх
                                </div>
                                <div className="input-info">Шинэ бараа нэмэхэд систем автоматаар код онооно.</div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.enableAutoBarcode}
                                    onChange={e => setSettings({ ...settings, enableAutoBarcode: e.target.checked })}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Хугацаа хянах</div>
                                <div className="input-info">Барааны дуусах хугацааг (Expiry date) заавал оруулдаг болгох.</div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.trackExpiry}
                                    onChange={e => setSettings({ ...settings, trackExpiry: e.target.checked })}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Тооллогын шалтгаан заавал бичих</div>
                                <div className="input-info">Нөөцийн залруулга (Adjustment) хийхэд тайлбар заавал шаардана.</div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.requireReasonForAdjustment}
                                    onChange={e => setSettings({ ...settings, requireReasonForAdjustment: e.target.checked })}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
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
