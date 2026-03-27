import { useState, useEffect } from 'react';
import { SearchCheck, Save, Info, Loader2, Settings, Clock, CalendarDays } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import '../components/FlashDealSettings.css';

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
                <div className="flex-center" style={{ minHeight: '200px' }}>
                    <Loader2 className="animate-spin" size={24} />
                </div>
            </div>
        );
    }

    return (
        <div className="settings-section animate-fade-in">
            {/* ── Hero Header (FDS style — blue) ── */}
            <div className="fds-hero" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)' }}>
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon">
                            <SearchCheck size={24} />
                        </div>
                        <div>
                            <h3 className="fds-hero-title">Бараа лавлагааны тохиргоо</h3>
                            <div className="fds-hero-desc">Захиалга хийх үед барааны үлдэгдэл, үнийн мэдээллийг лавлах</div>
                        </div>
                    </div>
                    <label className="fds-toggle">
                        <input type="checkbox" checked={config.enabled} onChange={async e => {
                            const newEnabled = e.target.checked;
                            setConfig(c => ({ ...c, enabled: newEnabled }));
                            // Auto-save enabled state immediately
                            try {
                                await updateDoc(doc(db, 'businesses', bizId), {
                                    'settings.stockInquiry.enabled': newEnabled,
                                });
                                toast.success(newEnabled ? 'Бараа лавлагаа идэвхжүүлсэн' : 'Бараа лавлагаа унтраасан');
                            } catch (_) {
                                toast.error('Алдаа гарлаа');
                                setConfig(c => ({ ...c, enabled: !newEnabled }));
                            }
                        }} />
                        <span className="fds-toggle-track" />
                    </label>
                </div>
            </div>

            {config.enabled && (
                <>
                    {/* ── Settings Card ── */}
                    <div className="fds-card">
                        <div className="fds-card-title">
                            <Settings size={16} />
                            Лавлагааны тохиргоо
                        </div>

                        <div className="fds-row">
                            <div>
                                <label className="fds-label">
                                    <CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Идэвхгүй хоног
                                </label>
                                <div className="fds-duration-presets">
                                    {[7, 14, 30, 60, 90].map(d => (
                                        <button
                                            key={d}
                                            className={`fds-duration-btn ${config.inactiveDays === d ? 'active' : ''}`}
                                            onClick={() => setConfig(c => ({ ...c, inactiveDays: d }))}
                                        >
                                            {d} хоног
                                        </button>
                                    ))}
                                    <div className="fds-duration-custom">
                                        <input
                                            type="number"
                                            min={1}
                                            max={365}
                                            value={config.inactiveDays}
                                            onChange={e => setConfig(c => ({ ...c, inactiveDays: Math.max(1, parseInt(e.target.value) || 30) }))}
                                        />
                                        <span>хоног</span>
                                    </div>
                                </div>
                                <div className="fds-slider-info">
                                    Энэ хоногийн дотор захиалга ороогүй бараанд лавлагаа асуулга гарна
                                </div>
                            </div>
                            <div>
                                <label className="fds-label">
                                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Хүлээх хугацаа
                                </label>
                                <div className="fds-duration-presets">
                                    {[30, 60, 120, 180, 300].map(s => (
                                        <button
                                            key={s}
                                            className={`fds-duration-btn ${config.timeoutSeconds === s ? 'active' : ''}`}
                                            onClick={() => setConfig(c => ({ ...c, timeoutSeconds: s }))}
                                        >
                                            {s}с
                                        </button>
                                    ))}
                                    <div className="fds-duration-custom">
                                        <input
                                            type="number"
                                            min={10}
                                            max={600}
                                            value={config.timeoutSeconds}
                                            onChange={e => setConfig(c => ({ ...c, timeoutSeconds: Math.max(10, parseInt(e.target.value) || 60) }))}
                                        />
                                        <span>сек</span>
                                    </div>
                                </div>
                                <div className="fds-slider-info">
                                    Хариу ирэхгүй бол автоматаар захиалга үргэлжлүүлнэ
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── How it works card ── */}
                    <div className="fds-card" style={{ background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.12)' }}>
                        <div className="fds-card-title" style={{ color: '#3b82f6' }}>
                            <Info size={16} />
                            ХЭРХЭН АЖИЛЛАДАГ
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <div>1️⃣ Захиалагч checkout дарахад сагсан дахь бараа бүрийн сүүлийн захиалгыг шалгана</div>
                            <div>2️⃣ <strong>{config.inactiveDays} хоног</strong>+ захиалга ороогүй эсвэл шинэ бараа бол popup гарна</div>
                            <div>3️⃣ Бизнес руу лавлагаа илгээгдэж, <strong>{config.timeoutSeconds} секунд</strong> дотор хариу хүлээнэ</div>
                            <div>4️⃣ Хугацаа дуусвал автоматаар захиалга үргэлжлүүлнэ</div>
                        </div>
                    </div>

                    {/* ── Save Button ── */}
                    <div className="fds-save-wrap">
                        <button className="fds-save-btn" onClick={handleSave} disabled={saving} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59, 130, 246, 0.3)' }}>
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Хадгалах
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
