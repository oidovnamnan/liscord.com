import { useEffect, useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Phone, MapPin, Clock, CheckCircle, Truck, Package, Navigation } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { orderService } from '../../services/db';
import type { Order } from '../../types';
import './DeliveryPage.css';

interface DeliveryRow {
    id: string;
    orderNumber: string;
    customer: string;
    phone: string;
    address: string;
    driver: string;
    driverPhone: string;
    status: 'pending' | 'picked' | 'on_way' | 'delivered' | 'failed';
    fee: number;
    cod: number;
    scheduledAt: string;
    distance: string;
    zone: string;
}

const statusConfig: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: 'Хүлээгдэж буй', cls: 'badge-preparing', icon: Clock },
    picked: { label: 'Авсан', cls: 'badge-confirmed', icon: Package },
    on_way: { label: 'Замд', cls: 'badge-shipping', icon: Truck },
    delivered: { label: 'Хүргэсэн', cls: 'badge-delivered', icon: CheckCircle },
    failed: { label: 'Амжилтгүй', cls: 'badge-cancelled', icon: Clock },
};

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function DeliveryPage() {
    const { business } = useBusinessStore();
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!business) return;
        return orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
        });
    }, [business]);

    // Derived deliveries array from relevant orders
    const deliveries = useMemo(() => {
        return orders
            .filter(o => !o.isDeleted && o.status !== 'cancelled')
            // Only include orders that require delivery (have shipping status OR delivery fee or cargo)
            .filter(o => o.status === 'shipping' || (o.financials?.deliveryFee || 0) > 0 || (o.financials?.cargoFee || 0) > 0)
            .map(o => {
                let mappedStatus: DeliveryRow['status'] = 'pending';
                if (o.status === 'completed') mappedStatus = 'delivered';
                else if (o.status === 'shipping') mappedStatus = 'on_way';

                return {
                    id: o.id,
                    orderNumber: o.orderNumber || o.id.substring(0, 6),
                    customer: o.customer?.name || 'Тодорхойгүй',
                    phone: o.customer?.phone || '-',
                    address: (o.customer as any)?.address || 'Хаяггүй',
                    driver: '', // Drivers aren't strictly modeled on user level right now
                    driverPhone: '',
                    status: mappedStatus,
                    fee: o.financials?.deliveryFee || 0,
                    cod: o.financials?.balanceDue || 0, // Assume balance equals COD out in the field
                    scheduledAt: o.createdAt ? (o.createdAt instanceof Date ? `${(o.createdAt.getMonth() + 1)}.${o.createdAt.getDate()} ${o.createdAt.getHours()}:${o.createdAt.getMinutes()}` : 'Саяхан') : '-',
                    distance: '-',
                    zone: 'Хот дотор',
                } as DeliveryRow;
            });
    }, [orders]);

    const filtered = deliveries.filter(d => {
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchSearch = !search || d.customer.toLowerCase().includes(search.toLowerCase()) || d.orderNumber.toLowerCase().includes(search.toLowerCase()) || d.address.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const pending = deliveries.filter(d => d.status === 'pending').length;
    const onWay = deliveries.filter(d => d.status === 'on_way' || d.status === 'picked').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const totalCod = deliveries.filter(d => d.status !== 'delivered').reduce((s, d) => s + d.cod, 0);

    return (
        <>
            <Header title="Хүргэлт" subtitle={`Өнөөдөр ${deliveries.length} хүргэлт`} />
            <div className="page">
                <div className="grid-4 stagger-children" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card"><div className="stat-card-label">Хүлээгдэж буй</div><div className="stat-card-value">{pending}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Замд байгаа</div><div className="stat-card-value">{onWay}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Хүргэсэн</div><div className="stat-card-value">{delivered}</div></div>
                    <div className="stat-card"><div className="stat-card-label">Цуглуулах COD</div><div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{fmt(totalCod)}</div></div>
                </div>

                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Хүргэлт хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="orders-status-bar">
                    {['all', 'pending', 'picked', 'on_way', 'delivered'].map(s => {
                        const count = s === 'all' ? deliveries.length : deliveries.filter(d => d.status === s).length;
                        const label = s === 'all' ? 'Бүгд' : statusConfig[s]?.label;
                        return (
                            <button key={s} className={`orders-status-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                                {label} <span className="orders-status-count">{count}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="delivery-list stagger-children">
                    {filtered.map(d => {
                        const cfg = statusConfig[d.status];
                        const StatusIcon = cfg?.icon || Clock;
                        return (
                            <div key={d.id} className="delivery-card card">
                                <div className="delivery-card-top">
                                    <div className="delivery-card-left">
                                        <span className="order-number">#{d.orderNumber}</span>
                                        <span className={`badge ${cfg?.cls}`}><StatusIcon size={12} /> {cfg?.label}</span>
                                    </div>
                                    <div className="delivery-card-right">
                                        <span className="delivery-zone-badge">{d.zone}</span>
                                        <span className="delivery-distance"><Navigation size={12} /> {d.distance}</span>
                                    </div>
                                </div>
                                <div className="delivery-card-body">
                                    <div className="delivery-customer-section">
                                        <div className="delivery-customer-name">{d.customer}</div>
                                        <div className="delivery-customer-details">
                                            <span><Phone size={12} /> {d.phone}</span>
                                            <span><MapPin size={12} /> {d.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="delivery-card-bottom">
                                    <div className="delivery-info">
                                        <span className="delivery-time"><Clock size={12} /> {d.scheduledAt}</span>
                                        <span className="delivery-fee">Хүргэлт: {fmt(d.fee)}</span>
                                        {d.cod > 0 && <span className="delivery-cod">COD: {fmt(d.cod)}</span>}
                                    </div>
                                    <div className="delivery-driver">
                                        {d.driver ? (
                                            <>
                                                <div className="delivery-driver-avatar">{d.driver.charAt(0)}</div>
                                                <span>{d.driver}</span>
                                            </>
                                        ) : (
                                            <button className="btn btn-primary btn-sm">Хүргэгч оноох</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
