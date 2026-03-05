import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Mail, Lock, CheckCircle2, QrCode, Smartphone, Camera, User } from 'lucide-react';
import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signInWithEmailAndPassword,
    signInWithCustomToken
} from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-hot-toast';
import './AuthPage.css';

export function LoginPage() {
    const navigate = useNavigate();
    const [authMethod, setAuthMethod] = useState<'phone' | 'email' | 'qr'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'input' | 'otp'>('input');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [qrStatus, setQrStatus] = useState<'idle' | 'scanning' | 'confirming' | 'authorizing' | 'authenticated'>('idle');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);

    // Initial check for magic link
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const magicLink = params.get('magic_link');
        if (magicLink) {
            setAuthMethod('qr');
            handleScannedId(magicLink);
            // Clean up the URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    async function handleScannedId(sessionId: string) {
        setLoading(true);
        try {
            const snap = await getDoc(doc(db, 'qr_logins', sessionId));
            if (!snap.exists()) {
                toast.error('Энэ код хүчингүй байна');
                setQrStatus('idle');
                return;
            }

            const data = snap.data();
            if (data.status === 'authenticated') {
                toast.error('Энэ код ашиглагдсан байна');
                setQrStatus('idle');
                return;
            }

            setCurrentSessionId(sessionId);
            setSessionData(data);
            setQrStatus('confirming');
        } catch (e) {
            console.error(e);
            toast.error('Мэдээлэл авахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (authMethod === 'phone' && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {
                    console.log('reCAPTCHA solved');
                }
            });
        }
    }, [authMethod]);

    // Independent Handshake listener for Mobile side
    useEffect(() => {
        if (!currentSessionId) return;

        console.log('Mobile Listener Started for:', currentSessionId);
        const sessionRef = doc(db, 'qr_logins', currentSessionId);
        const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            console.log('Mobile Session Update:', data.status);

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
                    console.log('Attempting custom token sign-in...');
                    await signInWithCustomToken(auth, data.customToken);
                    toast.success('Амжилттай нэвтэрлээ!');
                    navigate('/app');
                } catch (e) {
                    console.error('Custom token sign-in failed:', e);
                    toast.error('Холболт амжилтгүй боллоо');
                    setQrStatus('idle');
                    setCurrentSessionId(null);
                } finally {
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, [currentSessionId, navigate]);

    const handleConfirmLogin = async () => {
        if (!currentSessionId) return;

        try {
            setLoading(true);
            const sessionRef = doc(db, 'qr_logins', currentSessionId);
            // Notify laptop that we scanned and confirmed
            await updateDoc(sessionRef, { status: 'scanned' });
            setQrStatus('authorizing');
        } catch (err) {
            console.error(err);
            toast.error('Холболт хийхэд алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    // QR Scanner Initialization
    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (authMethod === 'qr' && qrStatus === 'scanning') {
            scanner = new Html5QrcodeScanner(
                "qr-scanner",
                { fps: 15, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(async (decodedText) => {
                let sessionId = '';
                if (decodedText.startsWith('liscord-login:')) {
                    sessionId = decodedText.split(':')[1];
                } else if (decodedText.includes('magic_link=')) {
                    sessionId = new URLSearchParams(decodedText.split('?')[1]).get('magic_link') || '';
                }

                if (!sessionId) {
                    toast.error('Буруу QR код байна');
                    return;
                }

                if (scanner) {
                    scanner.clear().catch(console.error);
                }

                handleScannedId(sessionId);
            }, (_error) => {
                // scanning progress...
            });
        }

        return () => {
            if (scanner) scanner.clear().catch(console.error);
        };
    }, [authMethod, qrStatus]);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, appVerifier);
            setConfirmationResult(result);
            setStep('otp');
            toast.success('Баталгаажуулах код илгээлээ');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            toast.error('Алдаа гарлаа. Дугаараа шалгана уу.');
            if (window.recaptchaVerifier && typeof window.recaptchaVerifier.reset === 'function') {
                try {
                    const widgetId = await window.recaptchaVerifier.render();
                    window.recaptchaVerifier.reset(widgetId);
                } catch (e) {
                    console.warn('Could not reset reCAPTCHA:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) return;

        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            navigate('/app');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        } catch (error: any) {
            toast.error('Код буруу байна');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/app');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            let message = 'И-мэйл эсвэл нууц үг буруу байна';
            if (error.code === 'auth/user-not-found') {
                message = 'Ийм бүртгэлтэй хэрэглэгч олдсонгүй';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Нууц үг буруу байна';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Олон удаа буруу оролдлого хийсэн тул түр хаагдлаа. Дараа дахин оролдоно уу.';
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div id="recaptcha-container"></div>
            <div className="auth-glow" />
            <div className="auth-card animate-scale-in">
                <div className="auth-logo">
                    <div className="landing-logo" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>L</div>
                    <h1 className="auth-title">Liscord</h1>
                    <p className="auth-subtitle">Бизнесээ хялбар удирдаарай</p>
                </div>

                <div className="auth-tabs" style={{
                    display: 'flex',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    <button
                        className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setAuthMethod('phone'); setStep('input'); }}
                        style={{ minWidth: '80px' }}
                    >
                        <Phone size={14} style={{ marginBottom: 4, display: 'block', margin: '0 auto' }} />
                        Утас
                    </button>
                    <button
                        className={`auth-tab ${authMethod === 'email' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('email')}
                        style={{ minWidth: '80px' }}
                    >
                        <Mail size={14} style={{ marginBottom: 4, display: 'block', margin: '0 auto' }} />
                        И-мэйл
                    </button>
                    <button
                        className={`auth-tab ${authMethod === 'qr' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('qr')}
                        style={{ minWidth: '80px' }}
                    >
                        <QrCode size={14} style={{ marginBottom: 4, display: 'block', margin: '0 auto' }} />
                        QR Код
                    </button>
                </div>

                {authMethod === 'phone' ? (
                    step === 'input' ? (
                        <form onSubmit={handlePhoneSubmit} className="auth-form">
                            <div className="input-group">
                                <label className="input-label"><Phone size={14} /> Утасны дугаар</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="+976 9900 1234"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Үргэлжлүүлэх <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpVerify} className="auth-form">
                            <div className="input-group">
                                <label className="input-label">Баталгаажуулах код</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    autoFocus
                                    maxLength={6}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Баталгаажуулах'}
                            </button>
                            <button type="button" className="btn btn-link btn-full" onClick={() => setStep('input')}>Буцах</button>
                        </form>
                    )
                ) : authMethod === 'email' ? (
                    <form onSubmit={handleEmailLogin} className="auth-form">
                        <div className="input-group">
                            <label className="input-label"><Mail size={14} /> И-мэйл</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="example@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label"><Lock size={14} /> Нууц үг</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Нэвтрэх'}
                        </button>
                    </form>
                ) : (
                    <div className="qr-section animate-fade-in" style={{ textAlign: 'center' }}>
                        <div className="qr-scanner-box" style={{
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'var(--bg-soft)',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            minHeight: '320px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
                        }}>
                            {qrStatus === 'idle' ? (
                                <div style={{ padding: '40px 20px' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'var(--primary-light)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px auto'
                                    }}>
                                        <Camera size={28} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>QR Код уншуулах</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                                        Нотбүүкнийхээ Тохиргоо цэснээс <br /> гарч ирсэн кодыг уншуулна уу.
                                    </p>
                                    <button
                                        className="btn btn-primary gradient-btn"
                                        onClick={() => setQrStatus('scanning')}
                                        style={{ height: '48px', padding: '0 32px', borderRadius: '14px' }}
                                    >
                                        Камер нээх
                                    </button>
                                </div>
                            ) : qrStatus === 'scanning' ? (
                                <div id="qr-scanner" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                            ) : qrStatus === 'confirming' ? (
                                <div style={{ padding: '32px 20px' }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'rgba(var(--primary-rgb), 0.1)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px auto'
                                    }}>
                                        <User size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Нэвтрэх үү?</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{sessionData?.displayName}</strong> эрхээр <br /> энэ төхөөрөмж дээр нэвтрэх үү?
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                        <button
                                            className="btn btn-outline flex-1"
                                            onClick={() => { setQrStatus('idle'); setCurrentSessionId(null); }}
                                        >
                                            Болих
                                        </button>
                                        <button
                                            className="btn btn-primary flex-1 gradient-btn"
                                            onClick={handleConfirmLogin}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Тийм'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '60px 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px',
                                    textAlign: 'center'
                                }}>
                                    {qrStatus === 'authenticated' ? (
                                        <CheckCircle2 size={48} className="text-success" />
                                    ) : (
                                        <Loader2 size={48} className="animate-spin text-primary" />
                                    )}
                                    <div>
                                        <p style={{ fontWeight: 700, marginBottom: 4 }}>
                                            {qrStatus === 'authorizing' ? 'Баталгаажуулалт хүлээж байна...' : 'Нэвтэрч байна...'}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Нотбүүк дээрээ "Би зөвшөөрч байна" товчийг дарна уу.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(qrStatus === 'scanning' || qrStatus === 'confirming') && (
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: '16px' }}
                                onClick={() => { setQrStatus('idle'); setCurrentSessionId(null); }}
                            >
                                Болих
                            </button>
                        )}

                        <div style={{
                            marginTop: '24px',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(var(--primary-rgb), 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left'
                        }}>
                            <Smartphone size={20} className="text-primary" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                Нотбүүкээрээ нэвтэрсэн байгаа үед QR уншуулан гар утсаараа шууд орох боломжтой.
                            </span>
                        </div>
                    </div>
                )}

                <div className="auth-footer">
                    <p>
                        Бүртгэлгүй юу?{' '}
                        <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
                            Бүртгүүлэх
                        </a>
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
