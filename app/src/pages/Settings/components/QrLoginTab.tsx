import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';

export function QrLoginTab() {
    const { user } = useAuthStore();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'scanned' | 'authorizing' | 'authenticated'>('pending');
    const [loading, setLoading] = useState(false);

    // Get guaranteed origin/host
    const getAppUrl = () => {
        const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
        return origin.replace(/\/$/, ''); // Remove trailing slash
    };

    // Initial session setup
    useEffect(() => {
        if (!user || sessionId) return;

        const startSession = async () => {
            // Generate a simpler alphabetic ID to be extra safe with URL parsing
            const newSessionId = 'qr_' + Math.random().toString(36).substring(2, 12);
            setSessionId(newSessionId);
            setLoading(true);

            try {
                const sessionRef = doc(db, 'qr_logins', newSessionId);
                await setDoc(sessionRef, {
                    status: 'pending',
                    uid: user.uid,
                    displayName: user.displayName || user.email || user.phone || 'Хэрэглэгч',
                    createdAt: serverTimestamp(),
                    type: 'link_device'
                });
                console.log('QR Session started:', newSessionId);
            } catch (err) {
                console.error('Session creation failed:', err);
                toast.error('Сесс үүсгэхэд алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };

        startSession();
    }, [user, sessionId]);

    // Independent Real-time Listener
    useEffect(() => {
        if (!sessionId) return;

        const sessionRef = doc(db, 'qr_logins', sessionId);
        const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            console.log('Laptop Session Status:', data.status);

            if (data.status === 'scanned') {
                setStatus('scanned');
            } else if (data.status === 'authenticated') {
                setStatus('authenticated');
                toast.success('Төхөөрөмжийг амжилттай холболоо');
                // Cleanup after a while
                setTimeout(() => {
                    deleteDoc(sessionRef).catch(console.error);
                }, 60000);
            } else if (data.status === 'error') {
                toast.error(data.error || 'Алдаа гарлаа');
                setStatus('pending');
                setSessionId(null);
            }
        }, (err) => {
            console.error('Snapshot error:', err);
        });

        return () => unsubscribe();
    }, [sessionId]);

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
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Шинэ төхөөрөмж холбох</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                    Гар утасныхаа камераар энэ кодыг уншуулж <br /> шууд нэвтрэх боломжтой.
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
                                    value={`${getAppUrl()}/login?magic_link=${sessionId}`}
                                    size={200}
                                    level="H"
                                />
                            )}
                        </div>
                    ) : status === 'scanned' ? (
                        <div style={{ padding: '20px' }}>
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
                                <Smartphone size={32} />
                            </div>
                            <h4 style={{ fontWeight: 800, marginBottom: 8 }}>Төхөөрөмж холбох уу?</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                                Таны гар утсаар энэ кодын хүсэлтийг ирүүлсэн байна. Та зөвшөөрч нэвтрүүлэх үү?
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline flex-1" onClick={handleCancel}>Болих</button>
                                <button className="btn btn-primary flex-1 gradient-btn" onClick={handleAuthorize} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Би зөвшөөрч байна'}
                                </button>
                            </div>
                        </div>
                    ) : status === 'authorizing' ? (
                        <div style={{ padding: '40px' }}>
                            <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto 20px auto' }} />
                            <p style={{ fontWeight: 700, marginBottom: 8 }}>Төхөөрөмжийг баталгаажуулж байна...</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Гар утас нэвтэрч дуустал түр хүлээнэ үү.
                            </p>
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
                    <li>Гар утсан дээрээ "Confirm" эсвэл "Тийм" товч дарсны дараа энд "Би зөвшөөрч байна" товч гарч ирнэ.</li>
                    <li>Танихгүй хүнд энэ кодыг бүү харуул.</li>
                </ul>
            </div>
        </div>
    );
}
