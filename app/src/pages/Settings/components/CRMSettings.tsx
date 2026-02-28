import { useState, useEffect } from 'react';
import { Target, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { moduleSettingsService } from '../../../services/db';
import { toast } from 'react-hot-toast';

export function CRMSettings({ bizId }: { bizId: string }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        leadSources: ['Сошиал', 'Зөвлөмж', 'И-мэйл', 'Вэбсайт', 'Шууд харилцаа'],
        pipelines: [
            { id: 'new', label: 'Шинэ', color: '#6c5ce7' },
            { id: 'contacted', label: 'Холбоо тогтоосон', color: '#0984e3' },
            { id: 'qualified', label: 'Боломжит', color: '#00cec9' },
            { id: 'negotiation', label: 'Хэлэлцээр', color: '#fdcb6e' },
            { id: 'won', label: 'Амжилттай', color: '#00b894' },
            { id: 'lost', label: 'Алдагдсан', color: '#d63031' }
        ]
    });

    useEffect(() => {
        if (!bizId) return;
        setLoading(true);
        moduleSettingsService.getSettings(bizId, 'crm')
            .then(data => {
                if (data) setSettings(prev => ({ ...prev, ...data }));
            })
            .finally(() => setLoading(false));
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await moduleSettingsService.updateSettings(bizId, 'crm', settings);
            toast.success('CRM тохиргоо хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const addSource = () => {
        const src = prompt('Шинэ эх сурвалжийн нэр оруулна уу:');
        if (src && !settings.leadSources.includes(src)) {
            setSettings({ ...settings, leadSources: [...settings.leadSources, src] });
        }
    };

    const removeSource = (src: string) => {
        setSettings({ ...settings, leadSources: settings.leadSources.filter(s => s !== src) });
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
                    <div className="settings-card-icon"><Target size={20} /></div>
                    <h3>CRM & Борлуулалтын тохиргоо</h3>
                </div>

                <div className="settings-form">
                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <label className="input-label" style={{ margin: 0 }}>Боломжит харилцагчдын эх сурвалж (Lead Sources)</label>
                            <button className="btn btn-sm btn-outline" onClick={addSource}>
                                <Plus size={14} /> Нэмэх
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {settings.leadSources.map(src => (
                                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--bg-soft)', borderRadius: 20, fontSize: '0.85rem' }}>
                                    {src}
                                    <Trash2 size={12} className="cursor-pointer text-danger" onClick={() => removeSource(src)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <label className="input-label" style={{ margin: 0 }}>Борлуулалтын хоолой (Pipeline Statuses)</label>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {settings.pipelines.map(pip => (
                                <div key={pip.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-soft)', borderRadius: 12 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: pip.color }} />
                                    <div style={{ flex: 1, fontWeight: 500 }}>{pip.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pip.id}</div>
                                </div>
                            ))}
                        </div>
                        <p className="input-info" style={{ marginTop: 12 }}>Борлуулалтын төлөвүүдийг цаашид систем илүү динамикаар удирдах болно.</p>
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
