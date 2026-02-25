import { useState, useEffect } from 'react';
import { Shield, Building2, Calendar, CheckSquare, XSquare, Loader2 } from 'lucide-react';
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

    if (loading) return <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Зөвшөөрөл хүлээгдэж буй хүсэлтүүд</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Бизнесүүдийн дэлгүүрийн нэр болон холбоос өөрчлөх хүсэлтүүд</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                    <CheckSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.5 }} />
                    <h3>Хүлээгдэж буй хүсэлт алга</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Одоогоор шинээр илгээгдсэн хүсэлт байхгүй байна.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {requests.map(req => (
                        <div key={req.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Building2 size={18} /> {req.businessName}
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-soft)', padding: '4px 8px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Calendar size={12} />
                                        {format(req.createdAt, 'yyyy-MM-dd HH:mm')}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    {req.requestedData.name && (
                                        <div style={{ background: 'var(--bg-soft)', padding: 12, borderRadius: 8 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Шинэ Дэлгүүрийн Нэр:</div>
                                            <div style={{ fontWeight: 600 }}>{req.requestedData.name}</div>
                                        </div>
                                    )}
                                    {req.requestedData.slug && (
                                        <div style={{ background: 'var(--bg-soft)', padding: 12, borderRadius: 8 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Шинэ Дэлгүүрийн Холбоос:</div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{window.location.origin}/s/{req.requestedData.slug}</div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Шалтгаан:</div>
                                    <div style={{ padding: 16, background: 'var(--bg-body)', borderRadius: 8, fontSize: '0.95rem', lineHeight: 1.5, borderLeft: '4px solid var(--border-color)' }}>
                                        {req.reason}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 200, flexShrink: 0 }}>
                                <button className="btn btn-primary" onClick={() => handleApprove(req)} style={{ width: '100%', justifyContent: 'center', background: 'var(--success)' }}>
                                    <CheckSquare size={16} /> Зөвшөөрөх
                                </button>
                                <button className="btn btn-outline" onClick={() => handleReject(req)} style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                    <XSquare size={16} /> Татгалзах
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
