import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import './AuthPage.css';

export function LoginPage() {
    const navigate = useNavigate();
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'input' | 'otp'>('input');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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
        } catch (error: any) {
            console.error(error);
            toast.error('Алдал гарлаа. Дугаараа шалгана уу.');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId: any) => {
                    window.recaptchaVerifier.reset(widgetId);
                });
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
                ) : (
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
        recaptchaVerifier: any;
    }
}

