import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, CheckCircle2, ArrowLeft, Shield, QrCode, Smartphone, Camera, User, Mail, Lock } from 'lucide-react';
import { signInWithPhoneNumber, RecaptchaVerifier, signInWithCustomToken, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import { useGlobalSettingsStore } from '../../store';
import './AuthPage.css';

export function LoginPage() {
    const navigate = useNavigate();
    const { settings } = useGlobalSettingsStore();
    const [authMethod, setAuthMethod] = useState<'phone' | 'qr'>('phone');
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // QR state
    const [qrStatus, setQrStatus] = useState<'idle' | 'scanning' | 'confirming' | 'authorizing' | 'authenticated'>('idle');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sessionData, setSessionData] = useState<any>(null);
    const [isProcessingMagicLink, setIsProcessingMagicLink] = useState(false);

    // Magic link check on mount
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const magicLink = searchParams.get('magic_link');
        if (magicLink) {
            setIsProcessingMagicLink(true);
            setAuthMethod('qr');
            handleScannedId(magicLink);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleScannedId(sessionId: string) {
        setLoading(true);
        try {
            const snap = await getDoc(doc(db, 'qr_logins', sessionId));
            if (!snap.exists()) {
                toast.error('Энэ код хүчингүй байна');
                setQrStatus('idle');
                setIsProcessingMagicLink(false);
                return;
            }
            const data = snap.data();
            if (data.status === 'authenticated') {
                toast.error('Энэ код ашиглагдсан байна');
                setQrStatus('idle');
                setIsProcessingMagicLink(false);
                return;
            }
            setCurrentSessionId(sessionId);
            setSessionData(data);
            setQrStatus('confirming');
        } catch (e) {
            console.error('Error fetching session data:', e);
            toast.error('Мэдээлэл авахад алдаа гарлаа');
        } finally {
            setLoading(false);
            setIsProcessingMagicLink(false);
        }
    }

    // Initialize invisible reCAPTCHA
    useEffect(() => {
        if (authMethod === 'phone' && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {},
            });
        }
    }, [authMethod]);

    // QR session listener
    useEffect(() => {
        if (!currentSessionId) return;
        const sessionRef = doc(db, 'qr_logins', currentSessionId);
        const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;
            if (data.status === 'error') {
                toast.error(data.error || 'Нэвтрэлт амжилтгүй');
                setQrStatus('idle');
                setCurrentSessionId(null);
                return;
            }
            if (data.status === 'authenticated' && data.customToken) {
                setQrStatus('authenticated');
                try {
                    setLoading(true);
                    await signInWithCustomToken(auth, data.customToken);
                    toast.success('Амжилттай нэвтэрлээ!');
                    navigate('/app');
                } catch (e) {
                    console.error('signInWithCustomToken failed:', e);
                    toast.error('Холболт амжилтгүй боллоо');
                    setQrStatus('idle');
                    setCurrentSessionId(null);
                } finally {
                    setLoading(false);
                }
            }
        }, (err) => { console.error('Snapshot ERROR:', err); });
        return () => unsubscribe();
    }, [currentSessionId, navigate]);

    const handleConfirmLogin = async () => {
        if (!currentSessionId) return;
        try {
            setLoading(true);
            await updateDoc(doc(db, 'qr_logins', currentSessionId), { status: 'scanned' });
            setQrStatus('authorizing');
        } catch (err) {
            console.error('Confirm login failed:', err);
            toast.error('Холболт хийхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    // QR Scanner
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;
        if (authMethod === 'qr' && qrStatus === 'scanning') {
            scanner = new Html5QrcodeScanner("qr-scanner", { fps: 15, qrbox: { width: 250, height: 250 } }, false);
            scanner.render(async (decodedText) => {
                let sessionId = '';
                if (decodedText.startsWith('liscord-login:')) {
                    sessionId = decodedText.split(':')[1];
                } else if (decodedText.includes('magic_link=')) {
                    try {
                        const url = new URL(decodedText);
                        sessionId = url.searchParams.get('magic_link') || '';
                    } catch {
                        sessionId = new URLSearchParams(decodedText.split('?')[1]).get('magic_link') || '';
                    }
                }
                if (!sessionId) {
                    if (decodedText.startsWith('ls_sk_') || decodedText.includes('sms-pairing')) {
                        toast.error('Энэ бол SMS Sync код байна. Та Liscord Bridge апп-аа ашиглан уншуулна уу.', { duration: 5000 });
                    } else {
                        toast.error('Буруу QR код байна');
                    }
                    return;
                }
                if (scanner) scanner.clear().catch(console.error);
                handleScannedId(sessionId);
            }, () => {});
        }
        return () => { if (scanner) scanner.clear().catch(console.error); };
    }, [authMethod, qrStatus]);

    // Countdown for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const formatPhone = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 8 && /^[89]/.test(digits)) return `+976${digits}`;
        if (digits.length > 8 && digits.startsWith('976')) return `+${digits}`;
        return raw.startsWith('+') ? raw : `+${raw}`;
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 8) { toast.error('Утасны дугаараа зөв оруулна уу'); return; }
        setLoading(true);
        try {
            const result = await signInWithPhoneNumber(auth, formatPhone(phone), window.recaptchaVerifier);
            setConfirmationResult(result);
            setStep('otp');
            setCountdown(60);
            toast.success('SMS код илгээлээ');
        } catch (error: any) {
            console.error(error);
            let message = 'Алдаа гарлаа. Дугаараа шалгана уу.';
            if (error.code === 'auth/invalid-phone-number') message = 'Утасны дугаар буруу байна';
            else if (error.code === 'auth/too-many-requests') message = 'Олон удаа оролдсон. 1 минут хүлээнэ үү.';
            toast.error(message);
            if (window.recaptchaVerifier?.reset) {
                try { const wid = await window.recaptchaVerifier.render(); window.recaptchaVerifier.reset(wid); } catch (e) { console.warn(e); }
            }
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) { toast.error('6 оронтой кодоо оруулна уу'); return; }
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            setStep('success');
            setTimeout(() => navigate('/app'), 800);
        } catch (error: any) {
            toast.error(error.code === 'auth/invalid-verification-code' ? 'Код буруу байна' : 'Баталгаажуулахад алдаа гарлаа');
        } finally { setLoading(false); }
    };

    if (isProcessingMagicLink) {
        return (
            <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto 20px auto' }} />
                    <h3>Бэлдэж байна...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Түр хүлээнэ үү</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div id="recaptcha-container"></div>
            <div className="auth-glow" />
            <div className="auth-card animate-scale-in">
                <div className="auth-logo">
                    {settings?.systemLogo ? (
                        <img src={settings.systemLogo} alt="System Logo" style={{ height: 48, objectFit: 'contain' }} />
                    ) : (
                        <>
                            <div className="auth-logo-icon">L</div>
                            <h1 className="auth-title">Liscord</h1>
                        </>
                    )}
                    <p className="auth-subtitle">Бизнесээ дараагийн түвшинд аваачина</p>
                </div>

                {/* SMS / QR tabs */}
                <div className="auth-tabs" style={{ display: 'flex', paddingBottom: 4 }}>
                    <button
                        className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setAuthMethod('phone'); setStep('phone'); }}
                        style={{ minWidth: 80 }}
                    >
                        <Phone size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
                        SMS
                    </button>
                    <button
                        className={`auth-tab ${authMethod === 'qr' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('qr')}
                        style={{ minWidth: 80 }}
                    >
                        <QrCode size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
                        QR Код
                    </button>
                </div>

                {/* ========== SMS OTP Flow ========== */}
                {authMethod === 'phone' && (
                    <>
                        {step === 'phone' && (
                            <form onSubmit={handleSendOtp} className="auth-form">
                                <div className="input-group">
                                    <label className="input-label"><Phone size={14} /> Утасны дугаар</label>
                                    <input type="tel" className="input" placeholder="9900 1234" value={phone}
                                        onChange={(e) => setPhone(e.target.value)} autoFocus
                                        style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                        Монгол дугаар бол зөвхөн 8 оронтой дугаараа бичнэ
                                    </p>
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>SMS код авах <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        )}
                        {step === 'otp' && (
                            <form onSubmit={handleVerifyOtp} className="auth-form">
                                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                                        <Shield size={24} />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong> руу илгээсэн 6 оронтой кодоо оруулна уу
                                    </p>
                                </div>
                                <div className="input-group">
                                    <input type="text" className="input" placeholder="000000" value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        autoFocus maxLength={6} inputMode="numeric"
                                        style={{ fontSize: '1.8rem', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 800, height: 56 }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || otp.length < 6}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Баталгаажуулах'}
                                </button>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStep('phone'); setOtp(''); }}>
                                        <ArrowLeft size={14} /> Буцах
                                    </button>
                                    <button type="button" className="btn btn-ghost btn-sm" disabled={countdown > 0}
                                        style={{ opacity: countdown > 0 ? 0.5 : 1 }}
                                        onClick={() => { setOtp(''); setStep('phone'); }}
                                    >
                                        {countdown > 0 ? `Дахин илгээх (${countdown}с)` : 'Дахин илгээх'}
                                    </button>
                                </div>
                            </form>
                        )}
                        {step === 'success' && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <CheckCircle2 size={56} style={{ color: 'var(--success)', marginBottom: 16 }} />
                                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Амжилттай!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Нэвтэрч байна...</p>
                            </div>
                        )}
                    </>
                )}

                {/* ========== QR Code Flow ========== */}
                {authMethod === 'qr' && (
                    <div className="qr-section animate-fade-in" style={{ textAlign: 'center' }}>
                        <div className="qr-scanner-box" style={{
                            borderRadius: 24, overflow: 'hidden', background: 'var(--bg-soft)',
                            border: '1px solid var(--border-color)', position: 'relative', minHeight: 320,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
                        }}>
                            {qrStatus === 'idle' ? (
                                <div style={{ padding: '40px 20px' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                        <Camera size={28} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>QR Код уншуулах</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                                        Нотбүүкнийхээ Тохиргоо цэснээс <br /> гарч ирсэн кодыг уншуулна уу.
                                    </p>
                                    <button className="btn btn-primary gradient-btn" onClick={() => setQrStatus('scanning')}
                                        style={{ height: 48, padding: '0 32px', borderRadius: 14 }}>
                                        Камер нээх
                                    </button>
                                </div>
                            ) : qrStatus === 'scanning' ? (
                                <div id="qr-scanner" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                            ) : qrStatus === 'confirming' ? (
                                <div style={{ padding: '32px 20px' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                                        <User size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Нэвтрэх үү?</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{sessionData?.displayName}</strong> эрхээр <br /> энэ төхөөрөмж дээр нэвтрэх үү?
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                        <button className="btn btn-outline flex-1" onClick={() => { setQrStatus('idle'); setCurrentSessionId(null); }}>Болих</button>
                                        <button className="btn btn-primary flex-1 gradient-btn" onClick={handleConfirmLogin} disabled={loading}>
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Тийм'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                                    {qrStatus === 'authenticated' ? <CheckCircle2 size={48} className="text-success" /> : <Loader2 size={48} className="animate-spin text-primary" />}
                                    <div>
                                        <p style={{ fontWeight: 700, marginBottom: 4 }}>{qrStatus === 'authorizing' ? 'Баталгаажуулалт хүлээж байна...' : 'Нэвтэрч байна...'}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Нотбүүк дээрээ "Би зөвшөөрч байна" товчийг дарна уу.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {(qrStatus === 'scanning' || qrStatus === 'confirming') && (
                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => { setQrStatus('idle'); setCurrentSessionId(null); }}>Болих</button>
                        )}
                        <div style={{ marginTop: 24, padding: 12, borderRadius: 12, background: 'rgba(var(--primary-rgb), 0.05)', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                            <Smartphone size={20} className="text-primary" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                Нотбүүкээрээ нэвтэрсэн байгаа үед QR уншуулан гар утсаараа шууд орох боломжтой.
                            </span>
                        </div>
                    </div>
                )}

                {/* ========== Email fallback ========== */}
                {!showEmailLogin ? (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowEmailLogin(true)}
                            style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                        >
                            <Mail size={12} style={{ marginRight: 4 }} /> И-мэйлээр нэвтрэх
                        </button>
                    </div>
                ) : (
                    <form
                        className="auth-form animate-fade-in"
                        style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!email.trim() || !password.trim()) return;
                            setLoading(true);
                            try {
                                await signInWithEmailAndPassword(auth, email, password);
                                navigate('/app');
                            } catch (error: any) {
                                let msg = 'И-мэйл эсвэл нууц үг буруу байна';
                                if (error.code === 'auth/user-not-found') msg = 'Ийм бүртгэл олдсонгүй';
                                else if (error.code === 'auth/wrong-password') msg = 'Нууц үг буруу';
                                else if (error.code === 'auth/too-many-requests') msg = 'Олон удаа буруу оролдлого. Түр хүлээнэ үү.';
                                toast.error(msg);
                            } finally { setLoading(false); }
                        }}
                    >
                        <div className="input-group">
                            <label className="input-label"><Mail size={14} /> И-мэйл</label>
                            <input type="email" className="input" placeholder="example@mail.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} autoFocus />
                        </div>
                        <div className="input-group">
                            <label className="input-label"><Lock size={14} /> Нууц үг</label>
                            <input type="password" className="input" placeholder="••••••••" value={password}
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Нэвтрэх'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm btn-full" onClick={() => setShowEmailLogin(false)}
                            style={{ marginTop: 4, fontSize: '0.75rem' }}>Буцах</button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Бүртгэлгүй юу?{' '}
                        <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Бүртгүүлэх</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recaptchaVerifier: any;
    }
}
