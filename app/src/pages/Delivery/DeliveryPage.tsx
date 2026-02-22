import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Phone, MapPin, Clock, CheckCircle, Truck, Package, Navigation } from 'lucide-react';
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

const demoDeliveries: DeliveryRow[] = [
    { id: '1', orderNumber: 'ORD-0055', customer: 'Болд', phone: '8800-1234', address: 'БЗД, 3-р хороо, 15-р байр, 301', driver: 'Нараа', driverPhone: '8833-2222', status: 'on_way', fee: 5000, cod: 4000000, scheduledAt: '14:00-15:00', distance: '4.2 км', zone: 'БЗД' },
    { id: '2', orderNumber: 'ORD-0053', customer: 'Дорж', phone: '8855-9012', address: 'ХУД, 15-р хороо, Хурд тауэр', driver: 'Нараа', driverPhone: '8833-2222', status: 'picked', fee: 7000, cod: 0, scheduledAt: '15:00-16:00', distance: '8.1 км', zone: 'ХУД' },
    { id: '3', orderNumber: 'ORD-0051', customer: 'Ганаа', phone: '8811-7890', address: 'БГД, 2-р хороо, 44-р байр', driver: 'Тамир', driverPhone: '9922-1111', status: 'pending', fee: 5000, cod: 1600000, scheduledAt: '16:00-17:00', distance: '3.5 км', zone: 'БГД' },
    { id: '4', orderNumber: 'ORD-0048', customer: 'Мөнхбат', phone: '9944-3333', address: 'ЧД, 9-р хороо, Ривер гарден', driver: '', driverPhone: '', status: 'pending', fee: 8000, cod: 2500000, scheduledAt: '17:00-18:00', distance: '6.3 км', zone: 'ЧД' },
    { id: '5', orderNumber: 'ORD-0049', customer: 'Нараа', phone: '8833-2222', address: 'БЗД, 11-р хороо, 23-р байр, 502', driver: 'Тамир', driverPhone: '9922-1111', status: 'delivered', fee: 5000, cod: 750000, scheduledAt: '10:00-11:00', distance: '2.1 км', zone: 'БЗД' },
    { id: '6', orderNumber: 'ORD-0050', customer: 'Тамир', phone: '9922-1111', address: 'СХД, 8-р хороо, Мишил тауэр', driver: 'Нараа', driverPhone: '8833-2222', status: 'delivered', fee: 6000, cod: 0, scheduledAt: '11:00-12:00', distance: '5.5 км', zone: 'СХД' },
];

const statusConfig: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: 'Хүлээгдэж буй', cls: 'badge-preparing', icon: Clock },
    picked: { label: 'Авсан', cls: 'badge-confirmed', icon: Package },
    on_way: { label: 'Замд', cls: 'badge-shipping', icon: Truck },
    delivered: { label: 'Хүргэсэн', cls: 'badge-delivered', icon: CheckCircle },
    failed: { label: 'Амжилтгүй', cls: 'badge-cancelled', icon: Clock },
};

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function DeliveryPage() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = demoDeliveries.filter(d => {
        const matchStatus = statusFilter === 'all' || d.status === statusFilter;
        const matchSearch = !search || d.customer.toLowerCase().includes(search.toLowerCase()) || d.orderNumber.toLowerCase().includes(search.toLowerCase()) || d.address.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    const pending = demoDeliveries.filter(d => d.status === 'pending').length;
    const onWay = demoDeliveries.filter(d => d.status === 'on_way' || d.status === 'picked').length;
    const delivered = demoDeliveries.filter(d => d.status === 'delivered').length;
    const totalCod = demoDeliveries.filter(d => d.status !== 'delivered').reduce((s, d) => s + d.cod, 0);

    return (
        <>
            <Header title="Хүргэлт" subtitle={`Өнөөдөр ${demoDeliveries.length} хүргэлт`} />
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
                        const count = s === 'all' ? demoDeliveries.length : demoDeliveries.filter(d => d.status === s).length;
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
