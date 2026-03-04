import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';
import { Loader2, QrCode, Smartphone, CheckCircle2, Shield } from 'lucide-react';

export function QrLoginTab() {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'authorizing' | 'success' | 'error'>('idle');

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        if (status === 'scanning') {
            scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, [status]);

    async function onScanSuccess(decodedText: string) {
        if (!decodedText.startsWith('liscord-login:')) return;

        const sessionId = decodedText.split(':')[1];
        setStatus('authorizing');

        try {
            const sessionRef = doc(db, 'qr_logins', sessionId);
            await updateDoc(sessionRef, {
                status: 'authorizing',
                uid: user?.uid,
                authorizedBy: user?.displayName || user?.email || user?.phone,
                authorizedAt: serverTimestamp()
            });
            // The Cloud Function will take over from here and generate the customToken,
            // then set status to 'authenticated'.
            // But from the mobile side, we just need to wait a bit or just show success.
            setStatus('success');
            toast.success('Нэвтрэлт баталгаажлаа!');
        } catch (error) {
            console.error("QR Auth Error:", error);
            toast.error('Алдал гарлаа. Дахин оролдоно уу.');
            setStatus('error');
        }
    }

    function onScanFailure(_error: any) {
        // console.warn(`QR error = ${error}`);
    }

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
                    <QrCode size={32} />
                </div>
                <h3>QR Нэвтрэлт</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', margin: '8px auto' }}>
                    Номын сан эсвэл өөр төхөөрөмж дээрх Liscord-ын QR кодыг уншуулж шууд нэвтэрнэ үү.
                </p>
            </div>

            <div className="settings-card" style={{ maxWidth: '400px', margin: '0 auto', overflow: 'hidden' }}>
                {status === 'idle' || status === 'error' ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <button
                            className="btn btn-primary btn-full gradient-btn"
                            onClick={() => setStatus('scanning')}
                            style={{ height: '54px', borderRadius: '16px', fontWeight: 800 }}
                        >
                            <Smartphone size={20} style={{ marginRight: '8px' }} /> Scanner Нээх
                        </button>
                    </div>
                ) : status === 'scanning' ? (
                    <div style={{ padding: '10px' }}>
                        <div id="qr-reader" style={{ border: 'none', borderRadius: '12px', overflow: 'hidden' }}></div>
                        <button
                            className="btn btn-ghost btn-full"
                            onClick={() => setStatus('idle')}
                            style={{ marginTop: '12px' }}
                        >
                            Болих
                        </button>
                    </div>
                ) : status === 'authorizing' ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto 16px auto' }} />
                        <p style={{ fontWeight: 700 }}>Баталгаажуулж байна...</p>
                    </div>
                ) : (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                        <CheckCircle2 size={48} className="text-success" style={{ margin: '0 auto 16px auto' }} />
                        <p style={{ fontWeight: 700 }}>Амжилттай!</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Төхөөрөмж дээр таны аккаунт нээгдэж байна.
                        </p>
                        <button
                            className="btn btn-outline btn-full"
                            onClick={() => setStatus('idle')}
                            style={{ marginTop: '24px' }}
                        >
                            Дахин уншуулах
                        </button>
                    </div>
                )}
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
                    <li>Зөвхөн өөрийн итгэдэг төхөөрөмж дээр QR уншуулна уу.</li>
                    <li>QR нэвтрэлт нь нууц үг оруулалгүйгээр шууд эрх олгодог тул болгоомжтой байхыг сануулж байна.</li>
                    <li>Холболт хийсний дараа ашиглаж дуусаад Log Out хийж хэвшээрэй.</li>
                </ul>
            </div>
        </div>
    );
}


