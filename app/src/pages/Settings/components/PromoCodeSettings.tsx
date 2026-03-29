import { useState, useEffect } from 'react';
import { Sparkles, Save, Loader2, Ticket, Users, Crown, Percent, Hash, Clock } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { toast } from 'react-hot-toast';
import type { Business } from '../../../types';

interface PromoCodeConfig {
    enabled: boolean;
    // Lucky code (user_generated) settings
    luckyEnabled: boolean;
    luckyCreditsPerUser: number;
    luckyMinPercent: number;
    luckyMaxPercent: number;
    luckyCodeExpireDays: number;
    // General promo settings
    allowStackCodes: boolean;
    maxDiscountPercent: number;
    defaultExpireDays: number;
}

const DEFAULT_CONFIG: PromoCodeConfig = {
    enabled: true,
    luckyEnabled: false,
    luckyCreditsPerUser: 5,
    luckyMinPercent: 3,
    luckyMaxPercent: 10,
    luckyCodeExpireDays: 30,
    allowStackCodes: false,
    maxDiscountPercent: 50,
    defaultExpireDays: 30,
};

export function PromoCodeSettings({ bizId, business }: { bizId: string; business: Business }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<PromoCodeConfig>(DEFAULT_CONFIG);
    const [stats, setStats] = useState({ total: 0, active: 0, used: 0, luckyGenerated: 0 });

    useEffect(() => {
        if (!bizId) return;
        (async () => {
            setLoading(true);
            try {
                // Load config from module_settings
                const cfgDoc = await getDoc(doc(db, 'businesses', bizId, 'module_settings', 'promo-codes'));
                if (cfgDoc.exists()) {
                    setConfig({ ...DEFAULT_CONFIG, ...cfgDoc.data() as Partial<PromoCodeConfig> });
                }

                // Load stats
                const codesSnap = await getDocs(collection(db, 'businesses', bizId, 'promoCodes'));
                const codes = codesSnap.docs.map(d => d.data());
                setStats({
                    total: codes.length,
                    active: codes.filter(c => c.isActive).length,
                    used: codes.reduce((s, c) => s + (c.usageCount || 0), 0),
                    luckyGenerated: codes.filter(c => c.mode === 'user_generated').length,
                });
            } catch (e) { console.error('Load promo settings:', e); }
            setLoading(false);
        })();
    }, [bizId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'businesses', bizId, 'module_settings', 'promo-codes'), {
                ...config,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // If luckyEnabled, make sure there is a user_generated promo code config doc
            if (config.luckyEnabled) {
                const ugSnap = await getDocs(query(
                    collection(db, 'businesses', bizId, 'promoCodes'),
                    where('mode', '==', 'user_generated'),
                ));

                // Find if any active config exists
                const activeConfig = ugSnap.docs.find(d => {
                    const data = d.data();
                    return data.isActive && data.userGenConfig;
                });

                if (!activeConfig) {
                    // Create config doc
                    const { addDoc } = await import('firebase/firestore');
                    await addDoc(collection(db, 'businesses', bizId, 'promoCodes'), {
                        businessId: bizId,
                        code: 'LUCKY-CONFIG',
                        type: 'percentage',
                        value: 0,
                        mode: 'user_generated',
                        target: 'all',
                        usageType: 'one_time',
                        usageLimit: 0,
                        usageCount: 0,
                        usedBy: [],
                        startDate: serverTimestamp(),
                        endDate: new Date('2099-12-31'),
                        minOrderAmount: 0,
                        isActive: true,
                        isDeleted: false,
                        userGenConfig: {
                            creditsPerUser: config.luckyCreditsPerUser,
                            minPercent: config.luckyMinPercent,
                            maxPercent: config.luckyMaxPercent,
                        },
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    // Update existing config
                    const { updateDoc: upDoc } = await import('firebase/firestore');
                    await upDoc(doc(db, 'businesses', bizId, 'promoCodes', activeConfig.id), {
                        isActive: true,
                        userGenConfig: {
                            creditsPerUser: config.luckyCreditsPerUser,
                            minPercent: config.luckyMinPercent,
                            maxPercent: config.luckyMaxPercent,
                        },
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            toast.success('Промо код тохиргоо хадгалагдлаа!');
        } catch (e) {
            console.error(e);
            toast.error('Алдаа гарлаа');
        }
        setSaving(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Loader2 className="animate-spin" size={24} />
        </div>
    );

    const brandColor = business?.brandColor || '#6366f1';

    return (
        <div className="settings-section animate-fade-in">
            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
                borderRadius: 16, padding: '20px 24px', color: '#fff', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ticket size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Промо Код тохиргоо</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8 }}>Хямдралын код, Lucky код, ашиглалтын хязгаар</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {[
                        { label: 'Нийт', value: stats.total, icon: Hash },
                        { label: 'Идэвхтэй', value: stats.active, icon: Ticket },
                        { label: 'Ашиглалт', value: stats.used, icon: Users },
                        { label: 'Lucky', value: stats.luckyGenerated, icon: Sparkles },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, minWidth: 60 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{s.value}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* General Settings */}
            <div className="settings-card" style={{ marginBottom: 16 }}>
                <div className="settings-card-header">
                    <div className="settings-card-icon"><Percent size={20} /></div>
                    <h3>Ерөнхий тохиргоо</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
                    <div className="modern-toggle-item">
                        <div className="toggle-info">
                            <h4>Промо код модулийг идэвхжүүлэх</h4>
                            <p>Дэлгүүрт промо код оруулж хямдрал авах боломжийг нээнэ</p>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="input-group">
                            <label className="settings-label">Хамгийн их хямдрал (%)</label>
                            <input className="input" type="number" min={1} max={100} value={config.maxDiscountPercent}
                                onChange={e => setConfig({ ...config, maxDiscountPercent: Number(e.target.value) })} />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Нэг удаа ашиглахад хамгийн их хэд хувийн хямдрал авч болох</p>
                        </div>
                        <div className="input-group">
                            <label className="settings-label">Кодын хүчинтэй хугацаа (хоног)</label>
                            <input className="input" type="number" min={1} max={365} value={config.defaultExpireDays}
                                onChange={e => setConfig({ ...config, defaultExpireDays: Number(e.target.value) })} />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Шинэ код үүсгэхэд анхдагч хугацаа</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lucky Code Settings */}
            <div className="settings-card" style={{ marginBottom: 16, border: config.luckyEnabled ? `2px solid ${brandColor}44` : undefined }}>
                <div className="settings-card-header" style={{ marginBottom: 4 }}>
                    <div className="settings-card-icon" style={{ background: '#fef3c7' }}><Sparkles size={20} style={{ color: '#f59e0b' }} /></div>
                    <h3>✨ Lucky Код</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                    Хэрэглэгч өөрийн профайл хуудаснаас "Код үүсгэх" товч дарж, санамсаргүй хямдралтай промо код авах боломж
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 0 16px 0' }}>
                    <div className="modern-toggle-item">
                        <div className="toggle-info">
                            <h4>Lucky кодыг идэвхжүүлэх</h4>
                            <p>Хэрэглэгчид өөрсдөө промо код үүсгэх боломжтой болно</p>
                        </div>
                        <label className="toggle">
                            <input type="checkbox" checked={config.luckyEnabled} onChange={e => setConfig({ ...config, luckyEnabled: e.target.checked })} />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {config.luckyEnabled && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="input-group">
                                    <label className="settings-label">Хэрэглэгч тутамд эрх</label>
                                    <input className="input" type="number" min={1} max={50} value={config.luckyCreditsPerUser}
                                        onChange={e => setConfig({ ...config, luckyCreditsPerUser: Number(e.target.value) })} />
                                </div>
                                <div className="input-group">
                                    <label className="settings-label">Хамгийн бага %</label>
                                    <input className="input" type="number" min={1} max={90} value={config.luckyMinPercent}
                                        onChange={e => setConfig({ ...config, luckyMinPercent: Number(e.target.value) })} />
                                </div>
                                <div className="input-group">
                                    <label className="settings-label">Хамгийн их %</label>
                                    <input className="input" type="number" min={1} max={90} value={config.luckyMaxPercent}
                                        onChange={e => setConfig({ ...config, luckyMaxPercent: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="settings-label">Lucky кодын хүчинтэй хугацаа (хоног)</label>
                                <input className="input" type="number" min={1} max={365} value={config.luckyCodeExpireDays}
                                    onChange={e => setConfig({ ...config, luckyCodeExpireDays: Number(e.target.value) })}
                                    style={{ maxWidth: 200 }} />
                            </div>

                            {/* Preview card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f0ff, #fdf0ff)', border: '1px solid #e0d4fc',
                                borderRadius: 12, padding: 16, textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Хэрэглэгчийн харагдах байдал</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                                    {config.luckyMinPercent}-{config.luckyMaxPercent}% хямдралтай код үүсгэх
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 10 }}>
                                    Таньд <strong style={{ color: '#6366f1' }}>{config.luckyCreditsPerUser}</strong> эрх байна
                                </div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 20px', background: '#6366f1', color: '#fff',
                                    borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, opacity: 0.7
                                }}>
                                    <Ticket size={16} /> Код үүсгэх
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving}
                    style={{ minWidth: 160, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Хадгалах
                </button>
            </div>
        </div>
    );
}
