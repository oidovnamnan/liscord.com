import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { User as UserIcon, Mail, Phone, Lock, Save, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { useAuthStore, useBusinessStore } from '../../store';
import { userService } from '../../services/db';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import './ProfilePage.css';

export function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const { employee } = useBusinessStore();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
    const [passwordResult, setPasswordResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        setSaveResult(null);
        try {
            await userService.updateProfile(user.uid, {
                displayName: displayName.trim(),
                phone: phone.trim(),
                email: email.trim(),
            });
            setUser({ ...user, displayName: displayName.trim(), phone: phone.trim(), email: email.trim() });
            setSaveResult('success');
            setTimeout(() => setSaveResult(null), 3000);
        } catch {
            setSaveResult('error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordResult(null);
        if (!newPassword || newPassword.length < 6) {
            setPasswordResult({ type: 'error', msg: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordResult({ type: 'error', msg: 'Нууц үг таарахгүй байна' });
            return;
        }
        try {
            const auth = getAuth();
            const firebaseUser = auth.currentUser;
            if (!firebaseUser || !firebaseUser.email) {
                setPasswordResult({ type: 'error', msg: 'Нэвтэрсэн хэрэглэгч олдсонгүй' });
                return;
            }
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordResult({ type: 'success', msg: 'Нууц үг амжилттай солигдлоо!' });
            setTimeout(() => setPasswordResult(null), 4000);
        } catch {
            setPasswordResult({ type: 'error', msg: 'Одоогийн нууц үг буруу эсвэл алдаа гарлаа' });
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(getAuth());
            window.location.href = '/';
        } catch {
            // silently fail
        }
    };

    return (
        <>
            <Header title="Хувийн Профайл" />
            <div className="page animate-fade-in" style={{ gap: 28 }}>
                {/* Profile Hero */}
                <div className="profile-hero">
                    <div className="profile-avatar-large">
                        {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="profile-hero-info">
                        <h2>{user?.displayName || 'Хэрэглэгч'}</h2>
                        <p>{employee?.positionName || 'Эзэн'}</p>
                        <span className="profile-uid">UID: {user?.uid?.slice(0, 12)}...</span>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="card profile-card">
                    <div className="profile-card-header">
                        <UserIcon size={18} />
                        <span>Хувийн мэдээлэл</span>
                    </div>

                    <div className="profile-form-grid">
                        <div className="form-group">
                            <label><UserIcon size={14} /> Нэр</label>
                            <input
                                type="text"
                                className="form-control"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Нэрээ оруулна уу"
                            />
                        </div>
                        <div className="form-group">
                            <label><Phone size={14} /> Утас</label>
                            <input
                                type="tel"
                                className="form-control"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Утасны дугаар"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label><Mail size={14} /> Имэйл</label>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Имэйл хаяг"
                            />
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                            {saving ? 'Хадгалж байна...' : <><Save size={16} /> Хадгалах</>}
                        </button>
                        {saveResult === 'success' && (
                            <span className="profile-result success"><CheckCircle2 size={14} /> Хадгалагдлаа!</span>
                        )}
                        {saveResult === 'error' && (
                            <span className="profile-result error"><AlertTriangle size={14} /> Алдаа гарлаа</span>
                        )}
                    </div>
                </div>

                {/* Password Change */}
                <div className="card profile-card">
                    <div className="profile-card-header">
                        <Lock size={18} />
                        <span>Нууц үг солих</span>
                    </div>

                    <div className="profile-form-grid">
                        <div className="form-group">
                            <label>Одоогийн нууц үг</label>
                            <input
                                type="password"
                                className="form-control"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-group">
                            <label>Шинэ нууц үг</label>
                            <input
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="6+ тэмдэгт"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Шинэ нууц үг давтах</label>
                            <input
                                type="password"
                                className="form-control"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Дахин оруулна уу"
                            />
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleChangePassword}
                            disabled={!currentPassword || !newPassword}
                        >
                            <Lock size={16} /> Нууц үг солих
                        </button>
                        {passwordResult && (
                            <span className={`profile-result ${passwordResult.type}`}>
                                {passwordResult.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {passwordResult.msg}
                            </span>
                        )}
                    </div>
                </div>

                {/* Logout */}
                <div className="card profile-card" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
                    <div className="profile-card-header" style={{ color: '#ef4444' }}>
                        <LogOut size={18} />
                        <span>Гарах</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                        Системээс гарах бол доорх товчийг дарна уу.
                    </p>
                    <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={handleLogout}>
                        <LogOut size={16} /> Гарах
                    </button>
                </div>
            </div>
        </>
    );
}
