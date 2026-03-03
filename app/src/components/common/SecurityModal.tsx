import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface SecurityModalProps {
    onSuccess: () => void;
    onClose: () => void;
    title?: string;
    description?: string;
}

export function SecurityModal({
    onSuccess,
    onClose,
    title = 'Аюулгүй байдлын нууц үг',
    description = 'Системийн өөрчлөлтийг баталгаажуулахын тулд нууц үгээ оруулна уу.'
}: SecurityModalProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 5;

    const handleSubmit = async () => {
        if (!password.trim()) {
            toast.error('Нууц үг оруулна уу');
            return;
        }

        if (attempts >= MAX_ATTEMPTS) {
            toast.error('Хэт олон буруу оролдлого. Хуудсаа дахин ачаална уу.');
            return;
        }

        setLoading(true);
        try {
            // Fetch the security PIN from Firestore system settings (server-side source of truth)
            const settingsRef = doc(db, 'systemSettings', 'security');
            const settingsSnap = await getDoc(settingsRef);
            const securityPin = settingsSnap.exists() ? settingsSnap.data().adminPin : null;

            if (!securityPin) {
                toast.error('Аюулгүй байдлын тохиргоо олдсонгүй. Админтай холбогдоно уу.');
                setLoading(false);
                return;
            }

            if (password === securityPin) {
                setAttempts(0);
                onSuccess();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                toast.error(`Нууц үг буруу байна! (${newAttempts}/${MAX_ATTEMPTS})`);
                setPassword('');
            }
        } catch (error) {
            console.error('Security verification error:', error);
            toast.error('Шалгалтын алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, borderRadius: 24, padding: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                    <div style={{
                        width: 64, height: 64,
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 16
                    }}>
                        <Shield size={32} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>{title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
                    </div>

                    <div style={{ width: '100%', marginTop: 16, textAlign: 'left' }}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="password"
                                className="input"
                                style={{ paddingLeft: 48, fontSize: '1.1rem', fontWeight: 700 }}
                                placeholder="••••••"
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                disabled={loading || attempts >= MAX_ATTEMPTS}
                            />
                        </div>
                    </div>

                    {attempts > 0 && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                            Буруу оролдлого: {attempts}/{MAX_ATTEMPTS}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 24 }}>
                        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 48 }}>
                            Цуцлах
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading || attempts >= MAX_ATTEMPTS}
                            style={{ flex: 1, height: 48 }}
                        >
                            {loading ? 'Шалгаж байна...' : 'Баталгаажуулах'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
