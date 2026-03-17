import { useState, useEffect } from 'react';
import { SearchCheck, Save, Info, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface StockInquiryConfig {
    enabled: boolean;
    inactiveDays: number;
    timeoutSeconds: number;
}

const DEFAULT_CONFIG: StockInquiryConfig = {
    enabled: false,
    inactiveDays: 30,
    timeoutSeconds: 60,
};

export function StockInquirySettings({ bizId }: { bizId: string }) {
    const [config, setConfig] = useState<StockInquiryConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!bizId) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'businesses', bizId));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = snap.data() as any;
                if (data?.settings?.stockInquiry) {
                    setConfig({ ...DEFAULT_CONFIG, ...data.settings.stockInquiry });
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
                'settings.stockInquiry': config,
            });
            toast.success('Бараа лавлагааны тохиргоо хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-section animate-fade-in">
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="settings-section animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}><SearchCheck size={20} /></div>
                <div>
                    <h2 style={{ margin: 0 }}>Бараа лавлагааны тохиргоо</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Захиалга хийх үед барааны үлдэгдэл, үнийн мэдээллийг лавлах
                    </p>
                </div>
            </div>

            {/* Enable toggle */}
            <div className="settings-card" style={{ padding: 24, marginTop: 20, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Бараа лавлагаа идэвхжүүлэх</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Идэвхгүй бараа захиалах үед бизнесээс үлдэгдэл лавлана
                        </div>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            {/* Settings */}
            {config.enabled && (
                <div className="settings-card" style={{ padding: 24, marginTop: 16, borderRadius: 16 }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>⚙️ Лавлагааны тохиргоо</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Идэвхгүй хоног (inactiveDays)</label>
                            <input
                                type="number"
                                className="input"
                                value={config.inactiveDays}
                                onChange={e => setConfig(c => ({ ...c, inactiveDays: Math.max(1, parseInt(e.target.value) || 30) }))}
                                min={1}
                                max={365}
                                style={{ height: 44 }}
                            />
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                Энэ хоногийн дотор захиалга ороогүй бараанд лавлагаа асуулга гарна
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Хүлээх хугацаа (секунд)</label>
                            <input
                                type="number"
                                className="input"
                                value={config.timeoutSeconds}
                                onChange={e => setConfig(c => ({ ...c, timeoutSeconds: Math.max(10, parseInt(e.target.value) || 60) }))}
                                min={10}
                                max={300}
                                style={{ height: 44 }}
                            />
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                Хариу ирэхгүй бол автоматаар захиалга үргэлжлүүлнэ
                            </div>
                        </div>
                    </div>

                    {/* Info box */}
                    <div style={{ marginTop: 20, padding: 16, background: 'rgba(108,92,231,0.04)', borderRadius: 12, border: '1px solid rgba(108,92,231,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>
                            <Info size={14} /> ХЭРХЭН АЖИЛЛАДАГ
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <div>1️⃣ Захиалагч checkout дарахад сагсан дахь бараа бүрийн сүүлийн захиалгыг шалгана</div>
                            <div>2️⃣ <strong>{config.inactiveDays} хоног</strong>+ захиалга ороогүй эсвэл шинэ бараа бол popup гарна</div>
                            <div>3️⃣ Бизнес руу лавлагаа илгээгдэж, <strong>{config.timeoutSeconds} секунд</strong> дотор хариу хүлээнэ</div>
                            <div>4️⃣ Хугацаа дуусвал автоматаар захиалга үргэлжлүүлнэ</div>
                        </div>
                    </div>
                </div>
            )}

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
