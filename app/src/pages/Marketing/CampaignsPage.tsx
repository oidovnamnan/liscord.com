import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Megaphone, Search, Loader2, Calendar, TrendingUp, Users, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { campaignService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const CAMPAIGN_FIELDS: CrudField[] = [
    { name: 'name', label: 'Аяны нэр', type: 'text', required: true, placeholder: 'Зуны хямдрал 2024', span: 2 },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'discount', label: 'Хямдрал' },
            { value: 'promotion', label: 'Промо' },
            { value: 'loyalty', label: 'Урамшуулал' },
            { value: 'social', label: 'Сошиал медиа' },
            { value: 'email', label: 'И-мэйл' },
            { value: 'sms', label: 'SMS' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'scheduled', label: 'Төлөвлөсөн' },
            { value: 'active', label: 'Идэвхтэй' },
            { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'budget', label: 'Төсөв', type: 'currency' },
    { name: 'startDate', label: 'Эхлэх огноо', type: 'date', required: true },
    { name: 'endDate', label: 'Дуусах огноо', type: 'date' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function CampaignsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

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

    return (
        <>
            <Header title="Маркетинг Аян" action={{ label: '+ Шинэ аян', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page">
                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Аяны нэрээр хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {loading ? (
                        <div className="flex-center" style={{ gridColumn: '1 / -1', height: '200px' }}><Loader2 className="animate-spin" size={32} /></div>
                    ) : campaigns.length === 0 ? (
                        <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
                            <Megaphone size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Аян байхгүй байна</h3>
                            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ marginTop: 16 }}>Анхны аянаа эхлүүлэх</button>
                        </div>
                    ) : (
                        filteredCampaigns.map(c => (
                            <div key={c.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(c); setShowModal(true); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div>
                                        {getStatusBadge(c.status)}
                                        <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.1rem' }}>{c.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Calendar size={14} /> {c.startDate ? format(c.startDate, 'yyyy/MM/dd') : 'Эхлээгүй'}
                                        </div>
                                    </div>
                                    <button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(c); setShowModal(true); }}><Edit2 size={18} /></button>
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

            {showModal && (
                <GenericCrudModal
                    title="Маркетинг аян"
                    icon={<Megaphone size={20} />}
                    collectionPath="businesses/{bizId}/campaigns"
                    fields={CAMPAIGN_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
