import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Megaphone, Search, Loader2, MoreVertical, Calendar, TrendingUp, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { campaignService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function CampaignsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = campaignService.subscribeCampaigns(business.id, (data) => {
            setCampaigns(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredCampaigns = campaigns.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="badge badge-success">Идэвхтэй</span>;
            case 'scheduled': return <span className="badge badge-info">Төлөвлөсөн</span>;
            case 'completed': return <span className="badge badge-soft">Дууссан</span>;
            case 'draft': return <span className="badge">Ноорог</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const handleCreateCampaign = () => {
        toast('Шинэ аян үүсгэх модал удахгүй нэмэгдэнэ.');
    };

    return (
        <>
            <Header title="Маркетинг Аян (Campaigns)" action={{ label: 'Шинэ аян', onClick: handleCreateCampaign }} />
            <div className="page">
                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Аяны нэрээр хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="campaigns-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {loading ? (
                        <div className="flex-center" style={{ gridColumn: '1 / -1', height: '200px' }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '60px' }}>
                            <Megaphone size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Аян байхгүй байна</h3>
                            <button className="btn btn-primary" onClick={handleCreateCampaign} style={{ marginTop: 16 }}>Анхны аянаа эхлүүлэх</button>
                        </div>
                    ) : (
                        filteredCampaigns.map(c => (
                            <div key={c.id} className="card campaign-card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        {getStatusBadge(c.status)}
                                        <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.1rem' }}>{c.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Calendar size={14} /> {c.startDate ? format(c.startDate, 'yyyy/MM/dd') : 'Эхлээгүй'}
                                        </div>
                                    </div>
                                    <button className="btn-icon"><MoreVertical size={18} /></button>
                                </div>
                                <div className="divider" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Users size={16} color="var(--primary)" />
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.reach || 0}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Хамрах хүрээ</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <TrendingUp size={16} color="#2ecc71" />
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.conversion || 0}%</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Хөрвүүлэлт</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
