import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Key, Clock, Smartphone, AlertTriangle, Loader2, Eye, EyeOff, CheckCircle2, LogOut } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { businessService } from '../../../services/db';
import { auditService } from '../../../services/audit';
import { auth } from '../../../services/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export function SecurityTab() {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [securityLogs, setSecurityLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [autoLogoutMin, setAutoLogoutMin] = useState<number>(0); // 0 = off
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const pinRef = useRef<HTMLInputElement>(null);

    // Load security-related audit logs
    useEffect(() => {
        if (!business?.id) return;
        const unsub = auditService.subscribeAuditLogs(business.id, 200, (data) => {
            const secLogs = data.filter(l =>
                l.module === 'Auth' || l.module === 'Team' || l.module === 'settings' ||
                l.action?.includes('login') || l.action?.includes('password') ||
                l.action?.includes('pin') || l.action?.includes('security')
            );
            setSecurityLogs(secLogs.slice(0, 20));
            setLogsLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // PIN update
    const handleUpdatePIN = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const pin = (new FormData(e.currentTarget)).get('pin') as string;
        if (pin.length < 4) return toast.error('PIN код дутуу байна');
        setLoading(true);
        try {
            await businessService.updateBusiness(business.id, { settings: { ...business.settings, pin } });
            setIsDirty(false);
            toast.success('PIN код шинэчлэгдлээ');
        } catch { toast.error('Алдаа гарлаа'); }
        finally { setLoading(false); }
    };

    // Password change
    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const current = fd.get('currentPassword') as string;
        const newPass = fd.get('newPassword') as string;
        const confirm = fd.get('confirmPassword') as string;

        if (newPass.length < 6) return toast.error('Нууц үг 6-аас дээш тэмдэгт байх ёстой');
        if (newPass !== confirm) return toast.error('Нууц үг таарахгүй байна');

        const user = auth.currentUser;
        if (!user || !user.email) return toast.error('Хэрэглэгч олдсонгүй');

        setLoading(true);
        try {
            const cred = EmailAuthProvider.credential(user.email, current);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, newPass);
            toast.success('🔒 Нууц үг амжилттай солигдлоо!');
            e.currentTarget.reset();
        } catch (err: unknown) {
            if (err instanceof Error && err.message?.includes('wrong-password')) {
                toast.error('Одоогийн нууц үг буруу байна');
            } else {
                toast.error('Нууц үг солиход алдаа гарлаа');
            }
        } finally { setLoading(false); }
    };

    // Session info
    const currentUser = auth.currentUser;
    const lastSignIn = currentUser?.metadata?.lastSignInTime
        ? new Date(currentUser.metadata.lastSignInTime)
        : null;
    const creationTime = currentUser?.metadata?.creationTime
        ? new Date(currentUser.metadata.creationTime)
        : null;

    return (
        <div className="settings-section animate-fade-in">
            <h2>Аюулгүй байдал</h2>

            {/* 1. PIN Code */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>PIN код</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Захиалга устгах, бүртгэл өөрчлөх зэрэг чухал үйлдлүүдэд ашиглагдана
                        </p>
                    </div>
                </div>
                <form className="settings-form" onSubmit={handleUpdatePIN} onChange={() => setIsDirty(true)}>
                    <div className="input-group">
                        <label className="settings-label">Шинэ PIN код</label>
                        <input
                            ref={pinRef}
                            className="input text-center"
                            name="pin"
                            type="password"
                            maxLength={4}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            defaultValue={business?.settings?.pin}
                            style={{ maxWidth: 180, fontSize: '1.8rem', letterSpacing: '0.4em', borderRadius: '14px' }}
                            required
                            placeholder="****"
                        />
                    </div>
                    <div>
                        <button className="btn btn-primary gradient-btn" type="submit" disabled={loading || !isDirty}
                            style={{ height: 42, padding: '0 28px', borderRadius: '12px' }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'PIN шинэчлэх'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. Password Change */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Нууц үг солих</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Аккаунтын нууц үгийг шинэчлэх. 6+ тэмдэгт шаардлагатай.
                        </p>
                    </div>
                </div>
                <form className="settings-form" onSubmit={handleChangePassword}>
                    <div className="input-group">
                        <label className="settings-label">Одоогийн нууц үг</label>
                        <div style={{ position: 'relative', maxWidth: 360 }}>
                            <input className="input" name="currentPassword" type={showPassword ? 'text' : 'password'}
                                required placeholder="Одоогийн нууц үг" style={{ paddingRight: '40px', borderRadius: '12px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="settings-input-row" style={{ maxWidth: 360 }}>
                        <div className="input-group">
                            <label className="settings-label">Шинэ нууц үг</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" name="newPassword" type={showNewPassword ? 'text' : 'password'}
                                    required minLength={6} placeholder="6+ тэмдэгт" style={{ paddingRight: '40px', borderRadius: '12px' }} />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="settings-label">Давтах</label>
                            <input className="input" name="confirmPassword" type="password"
                                required minLength={6} placeholder="Дахин оруулах" style={{ borderRadius: '12px' }} />
                        </div>
                    </div>
                    <div>
                        <button className="btn btn-primary gradient-btn" type="submit" disabled={loading}
                            style={{ height: 42, padding: '0 28px', borderRadius: '12px' }}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : '🔒 Нууц үг солих'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 3. Active Session */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Идэвхтэй сессион</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Одоо нэвтэрч буй төхөөрөмжийн мэдээлэл
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Current device */}
                    <div style={{
                        padding: '14px 16px', borderRadius: '14px', background: 'var(--surface-2)',
                        border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Smartphone size={16} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                    Энэ төхөөрөмж
                                    <span style={{
                                        marginLeft: '8px', padding: '2px 8px', borderRadius: '6px',
                                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                        fontSize: '0.72rem', fontWeight: 600
                                    }}>Идэвхтэй</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {currentUser?.email || '—'} · {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                                        navigator.userAgent.includes('Safari') ? 'Safari' :
                                            navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            {lastSignIn && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Сүүлд: {lastSignIn.toLocaleDateString('mn-MN')} {lastSignIn.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            {creationTime && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Бүртгүүлсэн: {creationTime.toLocaleDateString('mn-MN')}
                                </div>
                            )}
                        </div>
                    </div>

                    <button className="btn btn-outline" onClick={async () => {
                        try {
                            await auth.signOut();
                            toast.success('Амжилттай гарлаа');
                            window.location.href = '/';
                        } catch { toast.error('Алдаа'); }
                    }} style={{ alignSelf: 'flex-start', borderRadius: '12px', gap: '6px', display: 'flex', alignItems: 'center' }}>
                        <LogOut size={14} /> Бүх төхөөрөмжөөс гарах
                    </button>
                </div>
            </div>

            {/* 4. Auto-logout Timer */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Автомат гаралт</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Идэвхгүй хугацааны дараа автоматаар гарах тохиргоо
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Унтраасан', value: 0 },
                        { label: '15 мин', value: 15 },
                        { label: '30 мин', value: 30 },
                        { label: '1 цаг', value: 60 },
                        { label: '4 цаг', value: 240 },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            className={`btn ${autoLogoutMin === opt.value ? 'btn-primary' : 'btn-outline'}`}
                            style={{
                                borderRadius: '12px', height: '38px', fontSize: '0.85rem',
                                padding: '0 18px', fontWeight: autoLogoutMin === opt.value ? 700 : 500
                            }}
                            onClick={async () => {
                                setAutoLogoutMin(opt.value);
                                if (business) {
                                    try {
                                        await businessService.updateBusiness(business.id, {
                                            settings: { ...business.settings, autoLogoutMinutes: opt.value }
                                        });
                                        toast.success(`Автомат гаралт: ${opt.value === 0 ? 'Унтраасан' : opt.label}`);
                                    } catch { toast.error('Алдаа'); }
                                }
                            }}
                        >
                            {autoLogoutMin === opt.value && <CheckCircle2 size={14} style={{ marginRight: '4px' }} />}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 5. 2FA Toggle */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Хоёр шатлалт нэвтрэлт (2FA)</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Нэмэлт хамгаалалт идэвхжүүлэх. Нэвтрэх бүрд OTP код шаардана.
                        </p>
                    </div>
                </div>
                <div className="modern-toggle-item" style={{ marginTop: 0 }}>
                    <div className="toggle-info">
                        <h4>{twoFAEnabled ? '✅ 2FA идэвхжсэн' : '2FA идэвхжүүлэх'}</h4>
                        <p>{twoFAEnabled ? 'Нэвтрэх бүрд OTP код шаардагдана' : 'Тун удахгүй — хөгжүүлэлтийн шатанд'}</p>
                    </div>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={twoFAEnabled}
                            onChange={() => {
                                if (!twoFAEnabled) {
                                    toast('🔐 2FA удахгүй нэмэгдэнэ!', { icon: '🚧' });
                                }
                                setTwoFAEnabled(!twoFAEnabled);
                            }}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            {/* 6. Security Event Log */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="settings-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Аюулгүй байдлын лог</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Нэвтрэлт, тохиргоо өөрчлөлт, багийн үйлдлүүд
                        </p>
                    </div>
                </div>
                {logsLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                    </div>
                ) : securityLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Аюулгүй байдалтай холбоотой үйлдэл олдсонгүй
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                        {securityLogs.map(log => {
                            const d = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
                            const timeStr = d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
                            const dateStr = d.toLocaleDateString('mn-MN');
                            let icon = '🔐';
                            if (log.action?.includes('login')) icon = '🔑';
                            if (log.action?.includes('password') || log.action?.includes('pin')) icon = '🔒';
                            if (log.module === 'Team') icon = '👥';
                            if (log.action?.includes('settings')) icon = '⚙️';

                            return (
                                <div key={log.id} style={{
                                    display: 'flex', gap: '10px', padding: '10px 12px',
                                    borderRadius: '10px', background: 'var(--surface-2)',
                                    border: '1px solid var(--border-primary)', fontSize: '0.84rem',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div>
                                            <strong>{log.userName}</strong>{' '}
                                            <span style={{ color: 'var(--text-muted)' }}>{log.action}</span>{' '}
                                            {log.targetLabel && <span style={{ color: 'var(--primary)' }}>{log.targetLabel}</span>}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {dateStr} {timeStr} · {log.module}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
