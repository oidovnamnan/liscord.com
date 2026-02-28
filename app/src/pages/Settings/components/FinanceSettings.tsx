import { useState, useEffect } from 'react';
import { DollarSign, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { moduleSettingsService } from '../../../services/db';
import { toast } from 'react-hot-toast';

export function FinanceSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        vatPercent: 10,
        cityTaxPercent: 0,
        currency: '₮',
        autoNumbering: true,
        invoicePrefix: 'INV-',
        expenseCategories: ['Түрээс', 'Цалин', 'Маркетинг', 'Ашиглалтын зардал', 'Бусад']
    });

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        moduleSettingsService.getSettings(bizId, 'finance')
            .then(data => {
                if (data) setSettings(prev => ({ ...prev, ...data }));
            })
            .finally(() => setLoading(false));
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await moduleSettingsService.updateSettings(bizId, 'finance', settings);
            toast.success('Санхүүгийн тохиргоо хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const addCategory = () => {
        const cat = prompt('Шинэ төрлийн нэр оруулна уу:');
        if (cat && !settings.expenseCategories.includes(cat)) {
            setSettings({ ...settings, expenseCategories: [...settings.expenseCategories, cat] });
        }
    };

    const removeCategory = (cat: string) => {
        setSettings({ ...settings, expenseCategories: settings.expenseCategories.filter(c => c !== cat) });
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
                    <div className="settings-card-icon"><DollarSign size={20} /></div>
                    <h3>Санхүүгийн ерөнхий тохиргоо</h3>
                </div>

                <div className="settings-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="input-group">
                            <label className="input-label">НӨАТ (%)</label>
                            <input
                                className="input"
                                type="number"
                                value={settings.vatPercent}
                                onChange={e => setSettings({ ...settings, vatPercent: Number(e.target.value) })}
                                placeholder="10"
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">НХАТ (%)</label>
                            <input
                                className="input"
                                type="number"
                                value={settings.cityTaxPercent}
                                onChange={e => setSettings({ ...settings, cityTaxPercent: Number(e.target.value) })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="input-group">
                        <label className="input-label">Нэхэмжлэх кодлох (Prefix)</label>
                        <input
                            className="input"
                            value={settings.invoicePrefix}
                            onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                            placeholder="INV-"
                        />
                    </div>

                    <div className="divider" />

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <label className="input-label" style={{ margin: 0 }}>Зардлын ангилал</label>
                            <button className="btn btn-sm btn-outline" onClick={addCategory}>
                                <Plus size={14} /> Нэмэх
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {settings.expenseCategories.map(cat => (
                                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--bg-soft)', borderRadius: 20, fontSize: '0.85rem' }}>
                                    {cat}
                                    <Trash2 size={12} className="cursor-pointer text-danger" onClick={() => removeCategory(cat)} />
                                </div>
                            ))}
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
