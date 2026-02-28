import { useEffect, useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, MapPin, Clock, CheckCircle, Truck, Package, UserPlus, AlertCircle } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { deliveryService } from '../../services/db';
import type { DeliveryRecord } from '../../types';
import { toast } from 'react-hot-toast';
import './DeliveryPage.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
    pending: { label: 'Хүлээгдэж буй', cls: 'badge-preparing', icon: Clock },
    picked_up: { label: 'Авсан', cls: 'badge-confirmed', icon: Package },
    in_transit: { label: 'Замд', cls: 'badge-shipping', icon: Truck },
    delivered: { label: 'Хүргэсэн', cls: 'badge-delivered', icon: CheckCircle },
    failed: { label: 'Амжилтгүй', cls: 'badge-cancelled', icon: AlertCircle },
    returned: { label: 'Буцаагдсан', cls: 'badge-cancelled', icon: AlertCircle },
};

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function DeliveryPage() {
    const { business } = useBusinessStore();
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);

        const unsubDeliveries = deliveryService.subscribeDeliveries(business.id, (data) => {
            setDeliveries(data);
            setLoading(false);
        });

        return () => {
            unsubDeliveries();
        };
    }, [business?.id]);

    const filtered = deliveries.filter(d => {
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchSearch = !search ||
            d.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            d.driverName?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const stats = useMemo(() => {
        return {
            pending: deliveries.filter(d => d.status === 'pending').length,
            inTransit: deliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up').length,
            delivered: deliveries.filter(d => d.status === 'delivered').length,
            totalCod: deliveries.filter(d => d.status !== 'delivered').reduce((s, d) => s + (d.codAmount || 0), 0)
        };
    }, [deliveries]);


    const handleUpdateStatus = async (deliveryId: string, status: DeliveryRecord['status']) => {
        if (!business?.id) return;
        try {
            await deliveryService.updateStatus(business.id, deliveryId, status, 'Статус гараар шинэчлэв');
            toast.success('Статус шинэчлэгдлээ');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Хүргэлтийн удирдлага"
                subtitle={`Өнөөдөр ${deliveries.length} хүргэлт системд байна`}
                action={{
                    label: "Шинэ хүргэлт үүсгэх",
                    onClick: () => toast('Захиалга цэснээс хүргэлт үүсгэж болно')
                }}
            />
            <div className="page">
                <div className="grid-4 stagger-children" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card"><div className="stat-card-label">Хүлээгдэж буй</div><div className="stat-card-value">{stats.pending}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Замд байгаа</div><div className="stat-card-value">{stats.inTransit}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Хүргэсэн</div><div className="stat-card-value">{stats.delivered}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Цуглуулах COD</div><div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{fmt(stats.totalCod)}</div></div>
                </div>

                <div className="orders-toolbar" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div className="orders-search" style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input"
                            style={{ paddingLeft: '40px', width: '100%' }}
                            placeholder="Захиалгын дугаар, жолоочоор хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="orders-status-bar" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'picked_up', 'in_transit', 'delivered', 'failed'].map(s => {
                        const count = s === 'all' ? deliveries.length : deliveries.filter(d => d.status === s).length;
                        const label = s === 'all' ? 'Бүгд' : statusConfig[s]?.label;
                        return (
                            <button
                                key={s}
                                className={`orders-status-chip ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '50px',
                                    border: '1px solid var(--border-color)',
                                    background: statusFilter === s ? 'var(--primary)' : 'var(--surface-1)',
                                    color: statusFilter === s ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {label} <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="text-center p-8">Ачаалж байна...</div>
                ) : filtered.length === 0 ? (
                    <div className="card text-center p-12 text-muted" style={{ border: '2px dashed var(--border-color)' }}>
                        Хүргэлт олдсонгүй
                    </div>
                ) : (
                    <div className="delivery-list grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {filtered.map(d => {
                            const cfg = statusConfig[d.status];
                            const StatusIcon = cfg?.icon || Clock;
                            return (
                                <div key={d.id} className="delivery-card card hover-lift" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2 items-center">
                                            <span className="font-bold text-lg">#{d.orderNumber}</span>
                                            <span className={`badge ${cfg?.cls}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <StatusIcon size={12} /> {cfg?.label}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted">
                                            {d.priority === 'urgent' && <span className="text-danger font-bold">Яаралтай!</span>}
                                        </div>
                                    </div>

                                    <div className="delivery-info mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin size={14} className="text-muted mt-1" />
                                            <span>Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, 2-р байр... (Захиалгаас татна)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock size={14} className="text-muted" />
                                            <span>Огноо: {d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                        <div className="financials">
                                            <div className="text-xs text-muted">COD Цуглуулах</div>
                                            <div className="font-bold text-success">{fmt(d.codAmount || 0)}</div>
                                        </div>

                                        <div className="actions flex gap-2">
                                            {d.driverId ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="avatar-sm" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                        {d.driverName?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium">{d.driverName}</span>
                                                    {d.status !== 'delivered' && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleUpdateStatus(d.id, 'delivered')}
                                                        >
                                                            Хүргэсэн
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="dropdown">
                                                    <button className="btn btn-outline btn-sm" onClick={() => toast('Жолооч сонгох цэс нээгдлээ')}>
                                                        <UserPlus size={14} /> Жолооч оноох
                                                    </button>
                                                    {/* Simplification: Just assign the first employee for demo purposses if clicked? No, better toast or real menu if possible */}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
