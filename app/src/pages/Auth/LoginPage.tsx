import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Mail, Lock, Smartphone, CheckCircle2 } from 'lucide-react';
import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signInWithEmailAndPassword,
    signInWithCustomToken
} from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
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
    const [qrSessionId, setQrSessionId] = useState<string | null>(null);
    const [qrStatus, setQrStatus] = useState<'pending' | 'authorizing' | 'authenticated' | 'expired'>('pending');

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

    // QR Login Logic
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        if (authMethod === 'qr') {
            const startQrSession = async () => {
                const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                setQrSessionId(sessionId);
                setQrStatus('pending');

                const sessionRef = doc(db, 'qr_logins', sessionId);
                await setDoc(sessionRef, {
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    deviceInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform
                    }
                });

                unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
                    const data = snapshot.data();
                    if (!data) return;

                    if (data.status === 'authorizing') {
                        setQrStatus('authorizing');
                    } else if (data.status === 'authenticated' && data.customToken) {
                        setQrStatus('authenticated');
                        try {
                            setLoading(true);
                            await signInWithCustomToken(auth, data.customToken);
                            toast.success('Амжилттай нэвтэрлээ!');
                            // Cleanup session doc
                            await deleteDoc(sessionRef);
                            navigate('/app');
                        } catch (error) {
                            console.error("QR Auth Error:", error);
                            toast.error('Нэвтрэлт амжилтгүй. Дахин оролдоно уу.');
                            setQrStatus('pending');
                        } finally {
                            setLoading(false);
                        }
                    }
                });
            };

            startQrSession();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [authMethod, navigate]);

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

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setAuthMethod('phone'); setStep('input'); }}
                    >
                        Утас
                    </button>
                    <button
                        className={`auth-tab ${authMethod === 'email' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('email')}
                    >
                        И-мэйл
                    </button>
                    <button
                        className={`auth-tab ${authMethod === 'qr' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('qr')}
                    >
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
                    <div className="qr-login-container animate-fade-in" style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div className="qr-wrapper" style={{
                            background: 'white',
                            padding: '12px',
                            borderRadius: '20px',
                            display: 'inline-block',
                            position: 'relative',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                        }}>
                            {qrSessionId && (
                                <QRCodeSVG
                                    value={`liscord-login:${qrSessionId}`}
                                    size={180}
                                    level="M"
                                    includeMargin={false}
                                />
                            )}
                            {(qrStatus === 'authorizing' || qrStatus === 'authenticated' || loading) && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(255,255,255,0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(2px)'
                                }}>
                                    {qrStatus === 'authenticated' ? (
                                        <CheckCircle2 size={48} className="text-success" />
                                    ) : (
                                        <Loader2 size={48} className="animate-spin text-primary" />
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px 0' }}>QR кодоор нэвтрэх</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Утсан дээрх Liscord апп-аар <br /> <b>Тохиргоо - QR Нэвтрэлт</b> цэс рүү орж уншуулна уу.
                            </p>
                        </div>

                        <div style={{
                            marginTop: '20px',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(var(--primary-rgb), 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left'
                        }}>
                            <Smartphone size={20} className="text-primary" />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Нууц үг оруулах шаардлагагүй, шууд утсаараа баталгаажуулна.
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

