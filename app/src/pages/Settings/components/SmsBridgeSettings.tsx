import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCcw, Copy, CheckCircle2, Download, Shield, Wifi, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { SmsTemplateSettings } from './SmsTemplateSettings';
import './SmsBridgeSettings.css';

export function SmsBridgeSettings({ bizId }: { bizId: string }) {
    const [apiKey, setApiKey] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load or generate pairing key from Firestore
    useEffect(() => {
        if (!bizId) return;
        const loadKey = async () => {
            try {
                const bizRef = doc(db, 'businesses', bizId);
                const snap = await getDoc(bizRef);
                const data = snap.data();
                if (data?.smsBridgeKey) {
                    setApiKey(data.smsBridgeKey);
                } else {
                    // First time: generate and save
                    const newKey = 'ls_sk_' + Math.random().toString(36).substring(2, 12);
                    await updateDoc(bizRef, { smsBridgeKey: newKey });
                    setApiKey(newKey);
                }
            } catch (err) {
                console.error('Failed to load bridge key:', err);
                // Fallback: local key
                setApiKey('ls_sk_' + Math.random().toString(36).substring(2, 12));
            } finally {
                setLoading(false);
            }
        };
        loadKey();
    }, [bizId]);

    const handleGenerateKey = async () => {
        const newKey = 'ls_sk_' + Math.random().toString(36).substring(2, 12);
        setApiKey(newKey);
        try {
            const bizRef = doc(db, 'businesses', bizId);
            await updateDoc(bizRef, { smsBridgeKey: newKey });
            toast.success('Шинэ түлхүүр үүсгэж хадгаллаа');
        } catch {
            toast.error('Түлхүүр хадгалахад алдаа гарлаа');
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        toast.success('Хуулагдлаа');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="settings-section animate-fade-in"><p>Ачааллаж байна...</p></div>;
    }

    return (
        <div className="settings-section animate-fade-in">
            <h2>SMS Bridge Холболт</h2>
            <p className="sms-settings-desc">
                Гар утсан дээр ирж буй банкны SMS-ийг автоматаар систем рүү дамжуулах Bridge апп-ын тохиргоо.
            </p>

            {/* Step 1: Download */}
            <div className="settings-card sms-setup-card">
                <div className="sms-setup-step">
                    <div className="sms-step-number">1</div>
                    <div className="sms-step-content">
                        <h4>Bridge апп суулгах</h4>
                        <p>Liscord Bridge апп-ыг Android утсан дээрээ суулгана уу.</p>
                        <a
                            href="https://github.com/oidovnamnan/liscord.com/releases/download/bridge-v1/app-release.apk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sms-download-btn"
                        >
                            <Download size={16} />
                            .APK Татах
                        </a>
                    </div>
                </div>
            </div>

            {/* Step 2: QR Scan */}
            <div className="settings-card sms-setup-card">
                <div className="sms-setup-step">
                    <div className="sms-step-number">2</div>
                    <div className="sms-step-content">
                        <h4>QR код уншуулах</h4>
                        <p>Bridge апп-аа нээж "Системтэй холбох (QR Scan)" товчийг дарж доорх кодыг уншуулна уу.</p>
                        <div className="sms-qr-section">
                            <div className="sms-qr-wrapper">
                                <QRCodeSVG
                                    value={apiKey}
                                    size={160}
                                    bgColor="transparent"
                                    fgColor="var(--text-primary)"
                                    level="M"
                                />
                            </div>
                            <div className="sms-key-section">
                                <span className="sms-key-label">Security Key</span>
                                <div className="sms-key-row">
                                    <code className="sms-key-value">{apiKey}</code>
                                    <button className="sms-icon-btn" onClick={handleCopy} title="Хуулах">
                                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                    </button>
                                    <button className="sms-icon-btn" onClick={handleGenerateKey} title="Шинэ түлхүүр">
                                        <RefreshCcw size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 3: Permission */}
            <div className="settings-card sms-setup-card">
                <div className="sms-setup-step">
                    <div className="sms-step-number">3</div>
                    <div className="sms-step-content">
                        <h4>Зөвшөөрөл өгөх</h4>
                        <p>Апп-д "SMS унших" зөвшөөрлийг өгснөөр утас ашиглаагүй үед ч орлого автоматаар бүртгэгдэнэ.</p>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="sms-info-grid">
                <div className="sms-info-item">
                    <Shield size={18} />
                    <div>
                        <strong>Аюулгүй</strong>
                        <span>Мэдээлэл шифрлэгдсэн сувгаар дамждаа</span>
                    </div>
                </div>
                <div className="sms-info-item">
                    <Wifi size={18} />
                    <div>
                        <strong>Интернэт холболт</strong>
                        <span>Утас интернэтэд холбогдсон байх шаардлагатай</span>
                    </div>
                </div>
                <div className="sms-info-item">
                    <Smartphone size={18} />
                    <div>
                        <strong>Дэмжих банкууд</strong>
                        <span>Хаан, Голомт, ТЖА, Хас, Төрийн банк</span>
                    </div>
                </div>
                <div className="sms-info-item">
                    <AlertCircle size={18} />
                    <div>
                        <strong>Анхаар</strong>
                        <span>Гар утасны камер биш, Bridge апп-ын сканнераар уншуулна</span>
                    </div>
                </div>
            </div>

            {/* SMS Template Settings — embedded section */}
            <div style={{ marginTop: 32 }}>
                <h2>SMS формат тохиргоо</h2>
                <p className="sms-settings-desc">
                    Банк бүрийн мессежний формат тохируулж, зөв таниулна.
                </p>
                <SmsTemplateSettings bizId={bizId} />
            </div>
        </div>
    );
}
