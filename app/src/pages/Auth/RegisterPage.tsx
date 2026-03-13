import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Smile, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { signInWithPhoneNumber, RecaptchaVerifier, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { userService } from '../../services/db';
import { toast } from 'react-hot-toast';
import './AuthPage.css';

export function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'info' | 'otp' | 'success'>('info');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-reg', {
                size: 'invisible',
                callback: () => {},
            });
        }
    }, []);

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
        if (!name.trim()) {
            toast.error('Нэрээ оруулна уу');
            return;
        }
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 8) {
            toast.error('Утасны дугаараа зөв оруулна уу');
            return;
        }

        setLoading(true);
        try {
            const formatted = formatPhone(phone);
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, formatted, appVerifier);
            setConfirmationResult(result);
            setStep('otp');
            setCountdown(60);
            toast.success('SMS код илгээлээ');
        } catch (error: any) {
            console.error(error);
            let message = 'Алдаа гарлаа. Дугаараа шалгана уу.';
            if (error.code === 'auth/invalid-phone-number') {
                message = 'Утасны дугаар буруу байна';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Олон удаа оролдсон. 1 минут хүлээнэ үү.';
            }
            toast.error(message);
            if (window.recaptchaVerifier?.reset) {
                try {
                    const widgetId = await window.recaptchaVerifier.render();
                    window.recaptchaVerifier.reset(widgetId);
                } catch (e) { console.warn(e); }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            toast.error('6 оронтой кодоо оруулна уу');
            return;
        }

        setLoading(true);
        try {
            const { user } = await confirmationResult.confirm(otp);

            // Update profile name
            await updateProfile(user, { displayName: name });

            // Create Firestore user profile
            await userService.createUser({
                uid: user.uid,
                phone: formatPhone(phone),
                email: null,
                displayName: name,
                photoURL: null,
                businessIds: [],
                activeBusiness: null,
                language: 'mn',
                createdAt: new Date(),
            });

            setStep('success');
            toast.success('Амжилттай бүртгүүллээ!');
            setTimeout(() => navigate('/app'), 800);
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/invalid-verification-code') {
                toast.error('Код буруу байна');
            } else {
                toast.error('Баталгаажуулахад алдаа гарлаа');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div id="recaptcha-container-reg"></div>
            <div className="auth-glow" />
            <div className="auth-card animate-scale-in">
                <div className="auth-logo">
                    <div className="landing-logo" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>L</div>
                    <h1 className="auth-title">Бүртгүүлэх</h1>
                    <p className="auth-subtitle">Liscord-д тавтай морил</p>
                </div>

                {step === 'info' && (
                    <form onSubmit={handleSendOtp} className="auth-form">
                        <div className="input-group">
                            <label className="input-label"><Smile size={14} /> Нэр</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Бат-Эрдэнэ"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label"><Phone size={14} /> Утасны дугаар</label>
                            <input
                                type="tel"
                                className="input"
                                placeholder="9900 1234"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
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
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 12px auto'
                            }}>
                                <Shield size={24} />
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong> руу илгээсэн 6 оронтой кодоо оруулна уу
                            </p>
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                className="input"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                }}
                                autoFocus
                                maxLength={6}
                                inputMode="numeric"
                                style={{
                                    fontSize: '1.8rem', textAlign: 'center',
                                    letterSpacing: '0.4em', fontWeight: 800, height: 56,
                                }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || otp.length < 6}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Бүртгүүлэх'}
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStep('info'); setOtp(''); }}>
                                <ArrowLeft size={14} /> Буцах
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={countdown > 0}
                                style={{ opacity: countdown > 0 ? 0.5 : 1 }}
                                onClick={() => { setOtp(''); setStep('info'); }}
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

                <div className="auth-footer">
                    <p>
                        Бүртгэлтэй юу?{' '}
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                            Нэвтрэх
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
