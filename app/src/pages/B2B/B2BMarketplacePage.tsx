import { useState, useEffect } from 'react';
import { Network, Search, Globe, Truck, Store, Printer, Star, UserPlus, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { b2bService } from '../../services/b2bService';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import type { BusinessLink, B2BServiceType } from '../../types';
import './B2BMarketplace.css';

export function B2BMarketplacePage() {
    const { business } = useBusinessStore();
    const [activeTab, setActiveTab] = useState<'discover' | 'my_links' | 'incoming'>('discover');
    const [loading, setLoading] = useState(false);

    // Data
    const [providers, setProviders] = useState<any[]>([]);
    const [myLinks, setMyLinks] = useState<BusinessLink[]>([]);
    const [incomingLinks, setIncomingLinks] = useState<BusinessLink[]>([]);
    const [serviceFilter, setServiceFilter] = useState<B2BServiceType | 'all'>('all');

    useEffect(() => {
        if (!business) return;
        loadData();
    }, [business?.id, activeTab, serviceFilter]);

    const loadData = async () => {
        if (!business) return;
        setLoading(true);
        try {
            if (activeTab === 'discover') {
                const data = await b2bService.getPublicServiceProviders(serviceFilter !== 'all' ? serviceFilter : undefined);
                // Filter out self
                setProviders(data.filter(p => p.id !== business.id));
            } else if (activeTab === 'my_links') {
                const data = await b2bService.getBusinessLinks(business.id, 'consumer');
                setMyLinks(data);
            } else if (activeTab === 'incoming') {
                const data = await b2bService.getBusinessLinks(business.id, 'provider');
                setIncomingLinks(data);
            }
        } catch (error) {
            console.error('B2B Load Error:', error);
            toast.error('Мэдээлэл татахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (providerBiz: any, service: any) => {
        if (!business) return;
        if (!window.confirm(`${providerBiz.name}-тай ${service.name} чиглэлээр холбогдох хүсэлт илгээх үү?`)) return;

        try {
            await b2bService.createBusinessLink({
                consumer: {
                    businessId: business.id,
                    businessName: business.name,
                    category: 'unknown'
                },
                provider: {
                    businessId: providerBiz.id,
                    businessName: providerBiz.name,
                    category: 'unknown',
                    serviceType: service.type
                },
                status: 'pending',
                terms: {
                    pricingAgreed: false,
                    paymentTerms: 'monthly',
                    autoAccept: false,
                    notifyOn: ['status_change', 'arrival']
                },
                stats: { totalRequests: 0, completedRequests: 0, averageRating: 0, totalSpent: 0 },
                initiatedBy: 'consumer'
            });
            toast.success('Хүсэлт амжилттай илгээгдлээ');
            // If we are on discover, maybe switch to my_links or just reload
            if (activeTab === 'my_links') loadData();
        } catch (error) {
            toast.error('Хүсэлт илгээхэд алдаа гарлаа');
        }
    };

    const handleUpdateLinkStatus = async (linkId: string, status: BusinessLink['status']) => {
        try {
            await b2bService.updateBusinessLinkStatus(linkId, status);
            toast.success('Статус өөрчлөгдлөө');
            loadData();
        } catch (error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'cargo': return <Globe size={18} />;
            case 'delivery': return <Truck size={18} />;
            case 'wholesale': return <Store size={18} />;
            case 'printing': return <Printer size={18} />;
            default: return <Network size={18} />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="badge badge-success"><CheckCircle2 size={14} /> Идэвхтэй</span>;
            case 'pending': return <span className="badge badge-warning"><Clock size={14} /> Хүлээгдэж буй</span>;
            case 'terminated': return <span className="badge badge-danger"><XCircle size={14} /> Цуцалсан</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const FILTER_TABS = [
        { id: 'all', label: 'Бүгд' },
        { id: 'cargo', label: 'Карго' },
        { id: 'delivery', label: 'Хүргэлт' },
        { id: 'wholesale', label: 'Бөөний төв' },
        { id: 'printing', label: 'Хэвлэл' },
    ];

    return (
        <HubLayout hubId="b2b-hub">
            <div className="page b2b-page animate-fade-in" style={{ padding: '0 20px' }}>
                <div className="b2b-tabs">
                    <button className={`b2b-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
                        <Search size={18} /> Үйлчилгээ хайх
                    </button>
                    <button className={`b2b-tab ${activeTab === 'my_links' ? 'active' : ''}`} onClick={() => setActiveTab('my_links')}>
                        <Network size={18} /> Миний холбоосууд
                    </button>
                    <button className={`b2b-tab ${activeTab === 'incoming' ? 'active' : ''}`} onClick={() => setActiveTab('incoming')}>
                        <UserPlus size={18} /> Ирсэн хүсэлт
                    </button>
                </div>

                <div className="b2b-content">
                    {/* ... content remains same ... */}
                    {/* DISCOVER TAB */}
                    {activeTab === 'discover' && (
                        <div className="animate-fade-in">
                            <div className="b2b-filters">
                                {FILTER_TABS.map(f => (
                                    <button
                                        key={f.id}
                                        className={`filter-chip ${serviceFilter === f.id ? 'active' : ''}`}
                                        onClick={() => setServiceFilter(f.id as any)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {loading ? (
                                <div className="b2b-loading"><div className="spinner"></div></div>
                            ) : providers.length === 0 ? (
                                <div className="empty-state">
                                    <Network size={48} />
                                    <p>Одоогоор нээлттэй үйлчилгээ олдсонгүй.</p>
                                </div>
                            ) : (
                                <div className="b2b-grid">
                                    {providers.map(p => (
                                        <div key={p.id} className="b2b-card">
                                            <div className="b2b-card-header">
                                                <div className="b2b-avatar">{p.name.charAt(0)}</div>
                                                <div className="b2b-info">
                                                    <h3>{p.name}</h3>
                                                    <div className="b2b-rating">
                                                        <Star size={14} className="star-icon" />
                                                        <span>{p.serviceProfile?.rating?.average || 5.0}</span>
                                                        <span className="text-muted">({p.serviceProfile?.rating?.count || 0} үнэлгээ)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="b2b-services-list">
                                                {p.serviceProfile?.services.filter((s: any) => s.isActive && (serviceFilter === 'all' || s.type === serviceFilter)).map((svc: any) => (
                                                    <div key={svc.id} className="b2b-service-item">
                                                        <div className="svc-title">
                                                            {getIcon(svc.type)}
                                                            <span>{svc.name}</span>
                                                        </div>
                                                        <div className="svc-pricing">
                                                            Үнэ: {svc.pricing.basePrice.toLocaleString()}₮
                                                            {svc.pricing.type === 'weight_based' && ' / кг'}
                                                        </div>
                                                        <button
                                                            className="btn btn-primary btn-sm btn-outline mt-2"
                                                            style={{ width: '100%' }}
                                                            onClick={() => handleConnect(p, svc)}
                                                        >
                                                            Холбогдох <ArrowRight size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MY LINKS TAB */}
                    {activeTab === 'my_links' && (
                        <div className="animate-fade-in">
                            {loading ? (
                                <div className="b2b-loading"><div className="spinner"></div></div>
                            ) : myLinks.length === 0 ? (
                                <div className="empty-state">
                                    <Network size={48} />
                                    <p>Одоогоор холбогдсон байгууллага байхгүй байна.</p>
                                </div>
                            ) : (
                                <div className="b2b-list">
                                    {myLinks.map(link => (
                                        <div key={link.id} className="b2b-list-item">
                                            <div className="b2b-list-icon">
                                                {getIcon(link.provider.serviceType)}
                                            </div>
                                            <div className="b2b-list-info">
                                                <h4>{link.provider.businessName}</h4>
                                                <div className="b2b-list-meta">
                                                    <span className="text-muted">Чиглэл:</span> {link.provider.serviceType}
                                                    <span className="divider">•</span>
                                                    <span className="text-muted">Нийт хүсэлт:</span> {link.stats.totalRequests}
                                                </div>
                                            </div>
                                            <div className="b2b-list-status">
                                                {getStatusBadge(link.status)}
                                            </div>
                                            <div className="b2b-list-actions">
                                                {link.status === 'pending' && (
                                                    <button className="btn btn-sm btn-danger btn-outline" onClick={() => handleUpdateLinkStatus(link.id, 'terminated')}>Цуцлах</button>
                                                )}
                                                {link.status === 'active' && (
                                                    <button className="btn btn-sm btn-primary">Үйлчилгээ авах</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCOMING REQUESTS TAB */}
                    {activeTab === 'incoming' && (
                        <div className="animate-fade-in">
                            {loading ? (
                                <div className="b2b-loading"><div className="spinner"></div></div>
                            ) : incomingLinks.length === 0 ? (
                                <div className="empty-state">
                                    <UserPlus size={48} />
                                    <p>Танд ирсэн холбогдох хүсэлт байхгүй байна.</p>
                                </div>
                            ) : (
                                <div className="b2b-list">
                                    {incomingLinks.map(link => (
                                        <div key={link.id} className="b2b-list-item">
                                            <div className="b2b-list-icon consumer-icon">
                                                <Store size={18} />
                                            </div>
                                            <div className="b2b-list-info">
                                                <h4>{link.consumer.businessName}</h4>
                                                <div className="b2b-list-meta">
                                                    <span className="text-muted">Хүсэлт:</span> {link.provider.serviceType} үйлчилгээ
                                                    <span className="divider">•</span>
                                                    <span>{link.terms.paymentTerms} төлөлттэй</span>
                                                </div>
                                            </div>
                                            <div className="b2b-list-status">
                                                {getStatusBadge(link.status)}
                                            </div>
                                            <div className="b2b-list-actions">
                                                {link.status === 'pending' ? (
                                                    <>
                                                        <button className="btn btn-sm btn-success" onClick={() => handleUpdateLinkStatus(link.id, 'active')}>Зөвшөөрөх</button>
                                                        <button className="btn btn-sm btn-danger btn-outline" onClick={() => handleUpdateLinkStatus(link.id, 'terminated')}>Татгалзах</button>
                                                    </>
                                                ) : link.status === 'active' ? (
                                                    <button className="btn btn-sm btn-warning btn-outline" onClick={() => handleUpdateLinkStatus(link.id, 'paused')}>Түр зогсоох</button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </HubLayout>
    );
}
