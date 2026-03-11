import { useState, useEffect } from 'react';
import { Globe, Save, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface SourcingConfig {
    recipientName: string;
    recipientPhone: string;
    cargoAddress: string;
    shopPhone: string;
    labelTemplate: string;
}

const DEFAULT_CONFIG: SourcingConfig = {
    recipientName: '',
    recipientPhone: '',
    cargoAddress: '',
    shopPhone: '',
    labelTemplate: '{shopPhone}-{date}-{customer}-{qty}ш',
};

const TEMPLATE_VARS = [
    { key: '{shopPhone}', desc: 'Дэлгүүрийн утас' },
    { key: '{date}', desc: 'Захиалгын огноо (M/dd)' },
    { key: '{customer}', desc: 'Захиалагчийн нэр' },
    { key: '{qty}', desc: 'Нийт бараа тоо' },
    { key: '{orderNumber}', desc: 'Захиалгын дугаар' },
];

export function SourcingSettings({ bizId }: { bizId: string }) {
    const [config, setConfig] = useState<SourcingConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!bizId) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'businesses', bizId));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = snap.data() as any;
                if (data?.settings?.sourcing) {
                    setConfig({ ...DEFAULT_CONFIG, ...data.settings.sourcing });
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e) { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'businesses', bizId), {
                'settings.sourcing': config,
            });
            toast.success('Сорсинг тохиргоо хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const preview = config.labelTemplate
        .replace('{shopPhone}', config.shopPhone || '99037878')
        .replace('{date}', '3/12')
        .replace('{customer}', 'Батсүх')
        .replace('{qty}', '4')
        .replace('{orderNumber}', 'LSC-001');

    if (loading) {
        return <div className="settings-section animate-fade-in"><p>Ачааллаж байна...</p></div>;
    }

    return (
        <div className="settings-section animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}><Globe size={20} /></div>
                <div>
                    <h2 style={{ margin: 0 }}>Сорсинг тохиргоо</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Каргоны хаяг болон шошгоны загвар</p>
                </div>
            </div>

            {/* Recipient Info */}
            <div className="settings-card" style={{ padding: 24, marginTop: 20, borderRadius: 16 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>📦 Каргоны хүлээн авагч</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="input-group">
                        <label className="input-label">Хүлээн авагчийн нэр (хятад)</label>
                        <input
                            className="input"
                            value={config.recipientName}
                            onChange={e => setConfig(c => ({ ...c, recipientName: e.target.value }))}
                            placeholder="白茹冰"
                            style={{ height: 44 }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Хүлээн авагчийн утас</label>
                        <input
                            className="input"
                            value={config.recipientPhone}
                            onChange={e => setConfig(c => ({ ...c, recipientPhone: e.target.value }))}
                            placeholder="19947112554"
                            style={{ height: 44 }}
                        />
                    </div>
                </div>
                <div className="input-group" style={{ marginTop: 16 }}>
                    <label className="input-label">Каргоны хаяг (хятад)</label>
                    <textarea
                        className="input"
                        value={config.cargoAddress}
                        onChange={e => setConfig(c => ({ ...c, cargoAddress: e.target.value }))}
                        placeholder="内蒙古自治区 锡林郭勒盟 二连浩特市 环宇商贸城10楼8号房"
                        rows={2}
                        style={{ resize: 'vertical' }}
                    />
                </div>
            </div>

            {/* Label Template */}
            <div className="settings-card" style={{ padding: 24, marginTop: 16, borderRadius: 16 }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>🏷️ Захиалга ялгах мэдээлэл</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="input-group">
                        <label className="input-label">Дэлгүүрийн утас (карго танин нэвтрүүлэх)</label>
                        <input
                            className="input"
                            value={config.shopPhone}
                            onChange={e => setConfig(c => ({ ...c, shopPhone: e.target.value }))}
                            placeholder="99037878"
                            style={{ height: 44 }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Шошгоны загвар</label>
                        <input
                            className="input"
                            value={config.labelTemplate}
                            onChange={e => setConfig(c => ({ ...c, labelTemplate: e.target.value }))}
                            placeholder="{shopPhone}-{date}-{customer}-{qty}ш"
                            style={{ height: 44 }}
                        />
                    </div>
                </div>

                {/* Template variables reference */}
                <div style={{ marginTop: 16, padding: 14, background: 'rgba(108,92,231,0.04)', borderRadius: 12, border: '1px solid rgba(108,92,231,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>
                        <Info size={14} /> ХУВЬСАГЧИД
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {TEMPLATE_VARS.map(v => (
                            <span key={v.key} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                                <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{v.key}</code> = {v.desc}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div style={{ marginTop: 16, padding: 14, background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>Урьдчилсан харагдах байдал</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {config.cargoAddress || '(хаяг оруулна уу)'} ({preview})
                    </div>
                </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving} style={{ gap: 8, padding: '0 28px' }}>
                    <Save size={16} />
                    {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
            </div>
        </div>
    );
}
