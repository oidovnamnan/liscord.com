import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smartphone, Shield, Loader2, X, ArrowLeft } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { toast } from 'react-hot-toast';

interface SmsOtpModalProps {
    phone: string; // Admin phone number (e.g. "99001234" or "+97699001234")
    onSuccess: () => void;
    onClose: () => void;
    title?: string;
    description?: string;
}

const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 8 && /^[89]/.test(digits)) return `+976${digits}`;
    if (digits.length > 8 && digits.startsWith('976')) return `+${digits}`;
    return raw.startsWith('+') ? raw : `+${raw}`;
};

const maskPhone = (phone: string) => {
    const formatted = formatPhone(phone);
    const digits = formatted.replace('+976', '');
    if (digits.length >= 8) {
        return `+976 ${digits.slice(0, 2)}●●●●${digits.slice(-2)}`;
    }
    return formatted;
};

export function SmsOtpModal({
    phone,
    onSuccess,
    onClose,
    title = 'SMS баталгаажуулалт',
    description,
}: SmsOtpModalProps) {
    const [step, setStep] = useState<'confirm' | 'otp'>('confirm');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recaptchaRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // Cleanup recaptcha on unmount
    useEffect(() => {
        return () => {
            if (recaptchaRef.current) {
                try { recaptchaRef.current.clear(); } catch (e) { /* ignore */ }
                recaptchaRef.current = null;
            }
        };
    }, []);

    const sendCode = async () => {
        setLoading(true);
        try {
            // Create invisible reCAPTCHA
            if (!recaptchaRef.current && containerRef.current) {
                recaptchaRef.current = new RecaptchaVerifier(auth, containerRef.current, {
                    size: 'invisible',
                    callback: () => {},
                });
            }

            const formatted = formatPhone(phone);
            const result = await signInWithPhoneNumber(auth, formatted, recaptchaRef.current);
            setConfirmationResult(result);
            setStep('otp');
            setCountdown(60);
            toast.success(`${maskPhone(phone)} руу код илгээлээ`);
        } catch (error: any) {
            console.error('SMS OTP send error:', error);
            let msg = 'Код илгээхэд алдаа гарлаа';
            if (error.code === 'auth/invalid-phone-number') msg = 'Утасны дугаар буруу байна';
            else if (error.code === 'auth/too-many-requests') msg = 'Олон удаа оролдсон. Түр хүлээнэ үү.';
            toast.error(msg);
            // Reset recaptcha
            if (recaptchaRef.current) {
                try { recaptchaRef.current.clear(); } catch (_) { /* */ }
                recaptchaRef.current = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (!confirmationResult || otp.length < 6) return;
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            toast.success('Баталгаажлаа ✓');
            onSuccess();
        } catch (error: any) {
            const msg = error.code === 'auth/invalid-verification-code'
                ? 'Код буруу байна'
                : 'Баталгаажуулахад алдаа гарлаа';
            toast.error(msg);
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
            <div ref={containerRef} /> {/* reCAPTCHA container */}
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, borderRadius: 24, padding: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                    {/* Close */}
                    <button
                        onClick={onClose}
                        style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        <X size={18} />
                    </button>

                    {/* Icon */}
                    <div style={{
                        width: 64, height: 64,
                        background: 'rgba(var(--primary-rgb), 0.1)',
                        color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 16
                    }}>
                        {step === 'confirm' ? <Smartphone size={32} /> : <Shield size={32} />}
                    </div>

                    {/* Title */}
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>
                            {title}
                        </h3>
                        {step === 'confirm' ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                {description || 'Админ утас руу баталгаажуулах код илгээнэ.'}
                                <br />
                                <strong style={{ fontSize: '1rem', letterSpacing: 1 }}>{maskPhone(phone)}</strong>
                            </p>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                <strong>{maskPhone(phone)}</strong> руу илгээсэн
                                <br />6 оронтой кодоо оруулна уу
                            </p>
                        )}
                    </div>

                    {/* Step: Confirm send */}
                    {step === 'confirm' && (
                        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 48 }}>
                                Цуцлах
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={sendCode}
                                disabled={loading}
                                style={{ flex: 1, height: 48 }}
                            >
                                {loading ? <Loader2 size={18} className="spin" /> : <>Код илгээх</>}
                            </button>
                        </div>
                    )}

                    {/* Step: Enter OTP */}
                    {step === 'otp' && (
                        <>
                            <input
                                type="text"
                                className="input"
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                autoFocus
                                maxLength={6}
                                inputMode="numeric"
                                style={{
                                    fontSize: '1.8rem', textAlign: 'center',
                                    letterSpacing: '0.4em', fontWeight: 800, height: 56
                                }}
                            />

                            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                <button className="btn btn-secondary" onClick={() => { setStep('confirm'); setOtp(''); }} style={{ flex: 1, height: 48 }}>
                                    <ArrowLeft size={14} /> Буцах
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={verifyCode}
                                    disabled={loading || otp.length < 6}
                                    style={{ flex: 1, height: 48 }}
                                >
                                    {loading ? <Loader2 size={18} className="spin" /> : 'Баталгаажуулах'}
                                </button>
                            </div>

                            {/* Resend */}
                            <button
                                className="btn btn-ghost btn-sm"
                                disabled={countdown > 0}
                                onClick={() => { setOtp(''); sendCode(); }}
                                style={{ opacity: countdown > 0 ? 0.5 : 1, marginTop: 4, fontSize: '0.8rem' }}
                            >
                                {countdown > 0 ? `Дахин илгээх (${countdown}с)` : 'Дахин илгээх'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
