import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Loader2, Shield, Monitor, LogOut, Laptop } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { userService } from '../../../services/db';
import { useAuthStore } from '../../../store';
import { toast } from 'react-hot-toast';
import { getDeviceId } from '../../../utils/device';

export function DevicesTab() {
    const { user } = useAuthStore();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [status, setStatus] = useState<'pending' | 'scanned' | 'authorizing' | 'authenticated'>('pending');
    const [loading, setLoading] = useState(false);

    // Devices State
    const [devices, setDevices] = useState<any[]>([]);
    const [devicesLoading, setDevicesLoading] = useState(true);
    const currentDeviceId = getDeviceId();

    // Get guaranteed origin/host
    const getAppUrl = () => {
        const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
        return origin.replace(/\/$/, ''); // Remove trailing slash
    };

    // Fetch Connected Devices
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `users/${user.uid}/devices`), orderBy('lastActive', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDevices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setDevicesLoading(false);
        }, (err) => {
            console.error("Failed to fetch devices", err);
            setDevicesLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Initial session setup for QR Login
    useEffect(() => {
        if (!user || sessionId) return;

        const startSession = async () => {
            const newSessionId = 'qr_' + Math.random().toString(36).substring(2, 12);
            setSessionId(newSessionId);

            try {
                const sessionRef = doc(db, 'qr_logins', newSessionId);
                await setDoc(sessionRef, {
                    status: 'pending',
                    uid: user.uid,
                    displayName: user.displayName || user.email || user.phone || 'Хэрэглэгч',
                    createdAt: serverTimestamp(),
                    type: 'link_device'
                });
            } catch (err) {
                console.error('Session creation failed:', err);
            }
        };

        startSession();
    }, [user, sessionId]);

    // QR Real-time Listener
    useEffect(() => {
        if (!sessionId) return;

        const sessionRef = doc(db, 'qr_logins', sessionId);
        const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

            if (data.status === 'scanned') {
                setStatus('scanned');
            } else if (data.status === 'authenticated') {
                setStatus('authenticated');
                toast.success('Төхөөрөмжийг амжилттай холболоо');
                setTimeout(() => {
                    deleteDoc(sessionRef).catch(console.error);
                }, 60000);
            } else if (data.status === 'error') {
                toast.error(data.error || 'Алдаа гарлаа');
                setStatus('pending');
                setSessionId(null);
            }
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

    const handleDisconnect = async (deviceId: string) => {
        if (!user) return;
        if (window.confirm('Та энэ төхөөрөмжийг системээс гаргахдаа итгэлтэй байна уу?')) {
            try {
                await userService.removeDevice(user.uid, deviceId);
                toast.success('Төхөөрөмжийг салгалаа');
            } catch (err) {
                console.error(err);
                toast.error('Алдаа гарлаа');
            }
        }
    };

    return (
        <div className="devices-tab animate-fade-in" style={{ padding: '20px' }}>

            {/* Connected Devices Section */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Monitor size={24} className="text-primary" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Холбогдсон төхөөрөмжүүд</h3>
                </div>

                <div className="settings-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {devicesLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <Loader2 size={32} className="animate-spin text-primary" style={{ margin: '0 auto' }} />
                        </div>
                    ) : devices.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Monitor size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                            <p>Одоогоор холбогдсон төхөөрөмж алга.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {devices.map((device, index) => {
                                const isCurrent = device.id === currentDeviceId;
                                const DeviceIcon = device.isMobile ? Smartphone : Laptop;

                                return (
                                    <div key={device.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '20px 24px',
                                        borderBottom: index < devices.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        background: isCurrent ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: isCurrent ? 'var(--primary-light)' : 'var(--bg-card)',
                                                border: '1px solid var(--border-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isCurrent ? 'var(--primary)' : 'var(--text-secondary)'
                                            }}>
                                                <DeviceIcon size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {device.os} • {device.browser}
                                                    {isCurrent && (
                                                        <span style={{
                                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                                            background: 'var(--success-light)', color: 'var(--success-dark)', fontWeight: 800
                                                        }}>
                                                            Энэ төхөөрөмж
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    Сүүлд холбогдсон: {device.lastActive?.toDate ? device.lastActive.toDate().toLocaleString() : 'Одоо'}
                                                </div>
                                            </div>
                                        </div>
                                        {!isCurrent && (
                                            <button
                                                className="btn btn-outline btn-sm"
                                                style={{ color: 'var(--danger)', borderColor: 'rgba(var(--danger-rgb), 0.3)' }}
                                                onClick={() => handleDisconnect(device.id)}
                                            >
                                                <LogOut size={16} style={{ marginRight: '6px' }} /> Салгах
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Connection Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Smartphone size={24} className="text-secondary" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Шинэ төхөөрөмж холбох</h3>
                </div>

                <div className="settings-card" style={{ maxWidth: '400px', margin: '0 auto', overflow: 'hidden', padding: '32px' }}>
                    <div style={{ textAlign: 'center' }}>
                        {loading && status === 'pending' ? (
                            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Loader2 size={48} className="animate-spin text-primary" />
                            </div>
                        ) : status === 'pending' ? (
                            <>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    Гар утасныхаа камераар энэ кодыг уншуулж шууд нэвтрэх боломжтой.
                                </p>
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
                            </>
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
        </div>
    );
}
