import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';
import { Loader2, Smartphone, CheckCircle2, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function QrLoginTab() {
    const { user } = useAuthStore();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'scanned' | 'authorizing' | 'authenticated' | 'expired'>('pending');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const startSession = async () => {
            if (!user) return;

            const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            setSessionId(newSessionId);
            setLoading(true);

            try {
                const sessionRef = doc(db, 'qr_logins', newSessionId);
                await setDoc(sessionRef, {
                    status: 'pending',
                    uid: user.uid,
                    displayName: user.displayName || user.email || user.phone,
                    createdAt: serverTimestamp(),
                    type: 'link_device'
                });

                unsubscribe = onSnapshot(sessionRef, (snapshot) => {
                    const data = snapshot.data();
                    if (!data) return;

                    if (data.status === 'scanned') {
                        setStatus('scanned');
                        toast.success('Төхөөрөмж кодыг уншлаа!');
                    } else if (data.status === 'authenticated') {
                        setStatus('authenticated');
                        toast.success('Төхөөрөмжийг амжилттай холболоо');
                        // Optional: Clean up after a delay
                        setTimeout(() => {
                            deleteDoc(sessionRef).catch(console.error);
                            setSessionId(null);
                            setStatus('pending');
                        }, 5000);
                    }
                });
            } catch (err) {
                console.error(err);
                toast.error('Сесс үүсгэхэд алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };

        if (user && !sessionId) {
            startSession();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user, sessionId]);

    const handleAuthorize = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const sessionRef = doc(db, 'qr_logins', sessionId);
            await updateDoc(sessionRef, {
                status: 'authorizing',
                authorizedAt: serverTimestamp()
            });
            setStatus('authorizing');
        } catch (err) {
            console.error(err);
            toast.error('Баталгаажуулахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (sessionId) {
            await deleteDoc(doc(db, 'qr_logins', sessionId)).catch(console.error);
        }
        setSessionId(null);
        setStatus('pending');
    };

    return (
        <div className="qr-login-tab animate-fade-in" style={{ padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
                    <Smartphone size={32} />
                </div>
                <h3>Шинэ төхөөрөмж холбох</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '350px', margin: '8px auto' }}>
                    Гар утасныхаа нэвтрэх хэсгээс <b>QR Код</b> цэсийг сонгож энэ кодыг уншуулна уу.
                </p>
            </div>

            <div className="settings-card" style={{ maxWidth: '400px', margin: '0 auto', overflow: 'hidden', padding: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                    {loading && status === 'pending' ? (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 size={48} className="animate-spin text-primary" />
                        </div>
                    ) : status === 'pending' ? (
                        <div style={{
                            background: 'white',
                            padding: '16px',
                            borderRadius: '24px',
                            display: 'inline-block',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                        }}>
                            {sessionId && (
                                <QRCodeSVG
                                    value={`liscord-login:${sessionId}`}
                                    size={200}
                                    level="H"
                                />
                            )}
                        </div>
                    ) : status === 'scanned' ? (
                        <div style={{ padding: '20px' }}>
                            <CheckCircle2 size={64} className="text-success" style={{ margin: '0 auto 20px auto' }} />
                            <h4 style={{ fontWeight: 800 }}>Төхөөрөмж холбох уу?</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                                Шинэ төхөөрөмжөөс таны аккаунт руу нэвтрэх хүсэлт ирлээ.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline flex-1" onClick={handleCancel}>Үгүй</button>
                                <button className="btn btn-primary flex-1 gradient-btn" onClick={handleAuthorize} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Тийм, зөвшөөрөх'}
                                </button>
                            </div>
                        </div>
                    ) : status === 'authorizing' ? (
                        <div style={{ padding: '40px' }}>
                            <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto 20px auto' }} />
                            <p style={{ fontWeight: 700 }}>Төхөөрөмжийг баталгаажуулж байна...</p>
                        </div>
                    ) : (
                        <div style={{ padding: '40px' }}>
                            <CheckCircle2 size={64} className="text-success" style={{ margin: '0 auto 20px auto' }} />
                            <p style={{ fontWeight: 700 }}>Амжилттай холбогдлоо!</p>
                            <button className="btn btn-outline btn-sm" style={{ marginTop: '20px' }} onClick={handleCancel}>
                                Өөр төхөөрөмж холбох
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                marginTop: '32px',
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(var(--primary-rgb), 0.03)',
                border: '1px solid rgba(var(--primary-rgb), 0.1)'
            }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Shield size={18} className="text-primary" /> Аюулгүй байдлын зөвлөгөө
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Энэ кодоор дамжуулан таны аккаунт руу шууд нэвтрэх боломжтой тул зөвхөн өөрийн утсаар уншуулна уу.</li>
                    <li>Танихгүй хүнд энэ кодыг бүү харуул.</li>
                    <li>Холбосон төхөөрөмжүүдээ "Аюулгүй байдал" хэсгээс хянах боломжтой (Coming Soon).</li>
                </ul>
            </div>
        </div>
    );
}
