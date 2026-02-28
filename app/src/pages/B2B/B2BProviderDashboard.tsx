import { useState, useEffect } from 'react';
import { PackageSearch, Clock, CheckCircle2, Truck, TrendingUp } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { b2bService } from '../../services/b2bService';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import type { ServiceRequest } from '../../types';
import './B2BProvider.css';

export function B2BProviderDashboard() {
    const { business } = useBusinessStore();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');

    useEffect(() => {
        if (!business) return;
        loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, statusFilter]);

    const loadRequests = async () => {
        if (!business) return;
        setLoading(true);
        try {
            const data = await b2bService.getServiceRequests(business.id, 'provider', { status: statusFilter !== 'all' ? statusFilter : undefined });
            setRequests(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Хүсэлтүүд татахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reqId: string, newStatus: ServiceRequest['status']) => {
        try {
            await b2bService.updateServiceRequestStatus(reqId, newStatus);
            toast.success('Статус шинэчлэгдлээ');
            // Optimistic update
            setRequests(prev => prev.filter(r => r.id !== reqId));
            // If they change filter, it will reload anyway
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const TABS = [
        { id: 'pending', label: 'Шинэ хүсэлт' },
        { id: 'accepted', label: 'Хүлээж авсан' },
        { id: 'in_progress', label: 'Хүргэгдэж буй' },
        { id: 'completed', label: 'Дууссан' },
        { id: 'all', label: 'Бүгд' },
    ];

    return (
        <HubLayout hubId="b2b-hub">
            <div className="page b2b-provider-page animate-fade-in" style={{ padding: '0 20px' }}>

                <div className="b2b-stats-row">
                    {/* ... stats ... */}
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <PackageSearch size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Шинэ хүсэлт</span>
                            <span className="stat-value">{requests.filter(r => r.status === 'pending').length}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success-dark)' }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Өнөөдөр дууссан</span>
                            <span className="stat-value">0</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Нийт орлого (B2B)</span>
                            <span className="stat-value">₮0</span>
                        </div>
                    </div>
                </div>

                <div className="b2b-tabs" style={{ marginBottom: 24 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`b2b-tab ${statusFilter === tab.id ? 'active' : ''}`}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={() => setStatusFilter(tab.id as any)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="b2b-loading"><div className="spinner"></div></div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <PackageSearch size={48} />
                        <p>Одоогоор хүсэлт алга байна.</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {requests.map(req => (
                            <div key={req.id} className="request-card">
                                <div className="req-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="req-avatar">{req.consumer.businessName.charAt(0)}</div>
                                        <div>
                                            <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem' }}>{req.consumer.businessName}</h4>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.serviceType} хүсэлт</div>
                                        </div>
                                    </div>
                                    <div className={`req-badge status-${req.status}`}>
                                        {req.status === 'pending' && <><Clock size={12} /> Хүлээгдэж буй</>}
                                        {req.status === 'accepted' && <><CheckCircle2 size={12} /> Зөвшөөрсөн</>}
                                        {req.status === 'in_progress' && <><Truck size={12} /> Явж буй</>}
                                        {req.status === 'completed' && <><CheckCircle2 size={12} /> Дууссан</>}
                                    </div>
                                </div>

                                <div className="req-details">
                                    <div className="req-detail-row">
                                        <span className="req-label">Очиж авах:</span>
                                        <span className="req-value">{req.details?.pickupAddress}</span>
                                    </div>
                                    <div className="req-detail-row">
                                        <span className="req-label">Хүргэх:</span>
                                        <span className="req-value">{req.details?.deliveryAddress}</span>
                                    </div>
                                    <div className="req-detail-row">
                                        <span className="req-label">Утас:</span>
                                        <span className="req-value">{req.details?.deliveryContact?.phone}</span>
                                    </div>
                                    <div className="req-detail-row">
                                        <span className="req-label">Бараа:</span>
                                        <span className="req-value">{req.details?.items}</span>
                                    </div>
                                    <div className="req-detail-row">
                                        <span className="req-label">Огноо:</span>
                                        <span className="req-value">{req.createdAt.toLocaleString('mn-MN')}</span>
                                    </div>
                                </div>

                                <div className="req-actions">
                                    {req.status === 'pending' && (
                                        <>
                                            <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(req.id, 'accepted')}>Авах</button>
                                            <button className="btn btn-sm btn-danger btn-outline" onClick={() => handleUpdateStatus(req.id, 'cancelled')}>Татгалзах</button>
                                        </>
                                    )}
                                    {req.status === 'accepted' && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(req.id, 'in_progress')}>Ачаанд гарах</button>
                                    )}
                                    {req.status === 'in_progress' && (
                                        <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(req.id, 'completed')}>Хүргэж дууссан</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </HubLayout>
    );
}
