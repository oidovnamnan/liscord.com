import { useState, useEffect } from 'react';
import { Building2, Calendar, CheckSquare, XSquare, Loader2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { businessRequestService } from '../../services/db';
import type { BusinessRequest } from '../../types';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function SuperAdminRequests() {
    const [requests, setRequests] = useState<BusinessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const reqs = await businessRequestService.getPendingRequests();
            setRequests(reqs);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (req: BusinessRequest) => {
        if (!confirm('Энэ хүсэлтийг зөвшөөрөх үү?')) return;
        try {
            await businessRequestService.approveRequest(req.id, req.businessId, req.requestedData);
            toast.success('Хүсэлтийг зөвшөөрлөө');
            fetchRequests();
        } catch (error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleReject = async (req: BusinessRequest) => {
        if (!confirm('Энэ хүсэлтээс татгалзах уу?')) return;
        try {
            await businessRequestService.rejectRequest(req.id);
            toast.success('Хүсэлтийг цуцаллаа');
            fetchRequests();
        } catch (error) {
            toast.error('Алдаа гарлаа');
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="loading-screen" style={{ height: 'calc(100vh - 64px)' }}>
                <Loader2 className="animate-spin" size={32} />
                <p>Уншиж байна...</p>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Зөвшөөрөл хүлээгдэж буй хүсэлтүүд"
                subtitle="Бизнесүүдийн дэлгүүрийн нэр болон холбоос өөрчлөх хүсэлтүүдийн хяналт"
            />

            <div className="page-content">
                {requests.length === 0 ? (
                    <div className="card" style={{ padding: '64px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--success-tint)', color: 'var(--success)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <CheckSquare size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px 0' }}>Хүлээгдэж буй хүсэлт алга</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
                            Одоогоор шинээр илгээгдсэн хүсэлт байхгүй байна. Бүх хүсэлт шийдвэрлэгдсэн.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {requests.map(req => (
                            <div key={req.id} className="card hover-card" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 500px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', background: 'var(--primary-tint)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building2 size={22} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{req.businessName}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    <Calendar size={14} />
                                                    {req.createdAt instanceof Date ? format(req.createdAt, 'yyyy-MM-dd HH:mm') : '...'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                        {req.requestedData.name && (
                                            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Шинэ Дэлгүүрийн Нэр:</div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{req.requestedData.name}</div>
                                            </div>
                                        )}
                                        {req.requestedData.slug && (
                                            <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Шинэ Дэлгүүрийн Холбоос:</div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', wordBreak: 'break-all' }}>
                                                    {window.location.origin}/s/{req.requestedData.slug}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '16px', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border-glass)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: 0, top: '16px', bottom: '16px', width: '4px', background: 'var(--primary)', borderRadius: '0 4px 4px 0' }}></div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', paddingLeft: '8px' }}>Хүсэлтийн шалтгаан:</div>
                                        <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                                            {req.reason}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '220px', justifyContent: 'center', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleApprove(req)}
                                        style={{ width: '100%', height: '48px', justifyContent: 'center', fontSize: '1rem', background: 'var(--success)' }}
                                    >
                                        <CheckSquare size={18} /> Зөвшөөрөх
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => handleReject(req)}
                                        style={{ width: '100%', height: '48px', justifyContent: 'center', fontSize: '1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    >
                                        <XSquare size={18} /> Татгалзах
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
