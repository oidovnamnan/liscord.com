import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { serviceQueueService } from '../../services/db';
import type { ServiceTicket } from '../../types';
import { Search, Filter, Clock, Play, Check, UserCheck, Loader2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './QueuePage.css';

export function QueuePage() {
    const { business } = useBusinessStore();
    const [tickets, setTickets] = useState<ServiceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);

        const unsnap = serviceQueueService.subscribeQueue(business.id, (data) => {
            setTickets(data as ServiceTicket[]);
            setLoading(false);
        });

        return () => { unsnap(); };
    }, [business?.id]);

    const handleNextStatus = async (ticket: ServiceTicket) => {
        if (!business?.id) return;

        try {
            // Hardcode worker name for demo. In real app, prompt for which employee is taking the job
            let workerName = undefined;
            if (ticket.status === 'waiting') workerName = 'Ажилтан Батаа';

            await serviceQueueService.nextStatus(business.id, ticket.id, ticket.status, workerName);

            if (ticket.status === 'waiting') toast.success('Ажилд авлаа!');
            if (ticket.status === 'in_progress') toast.success('Ажил дууслаа!');

        } catch (error) {
            console.error('Error updating queue status:', error);
            toast.error('Алхам шилжүүлэхэд алдаа гарлаа');
        }
    };

    if (loading) return <div className="page-container flex-center">Дараалал уншиж байна...</div>;

    const waitingTickets = tickets.filter(t => t.status === 'waiting');
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress');

    const renderTicket = (ticket: ServiceTicket) => (
        <div key={ticket.id} className="service-ticket">
            <div className="ticket-header">
                <span className="ticket-id">{ticket.id.slice(0, 6).toUpperCase()}</span>
                <span className="ticket-time">
                    <Clock size={12} />
                    {ticket.status === 'in_progress' && ticket.startTime
                        ? formatDistanceToNow(ticket.startTime, { addSuffix: true, locale: mn })
                        : formatDistanceToNow(ticket.createdAt, { addSuffix: true, locale: mn })
                    }
                </span>
            </div>

            <div className="ticket-item">{ticket.vehicleOrItemInfo}</div>
            <div className="ticket-service">{ticket.serviceName} • ₮{ticket.price.toLocaleString()}</div>

            <div className="ticket-footer">
                <div className="ticket-worker">
                    <UserCheck size={14} />
                    {ticket.assignedWorkerName || 'Хүн хуваарилаагүй'}
                </div>

                {ticket.status === 'waiting' && (
                    <button className="ticket-action-btn" onClick={(e) => { e.stopPropagation(); handleNextStatus(ticket); }}>
                        <Play size={12} style={{ display: 'inline', marginRight: '4px' }} /> Эхлүүлэх
                    </button>
                )}
                {ticket.status === 'in_progress' && (
                    <button className="ticket-action-btn" style={{ backgroundColor: 'var(--success)' }} onClick={(e) => { e.stopPropagation(); handleNextStatus(ticket); }}>
                        <Check size={12} style={{ display: 'inline', marginRight: '4px' }} /> Дуусгах
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <HubLayout hubId="services-hub">
            <div className="page-container queue-page animate-fade-in">
                <Header
                    title="Үйлчилгээний Дараалал"
                    subtitle="Угаалга, Засвар, Салон амьд хяналт"
                    action={{
                        label: "Тасалбар нэмэх",
                        onClick: () => setShowAdd(true)
                    }}
                />

                <div className="queue-toolbar">
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input type="text" placeholder="Машины дугаар / Үйлчлүүлэгч..." className="search-input" />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-outline" title="Шүүлтүүр">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="queue-board">
                    {/* Column 1: Waiting */}
                    <div className="queue-column waiting">
                        <div className="queue-column-header">
                            Дүүжлээнтэй / Хүлээгдэж буй
                            <span className="queue-column-count">{waitingTickets.length}</span>
                        </div>
                        <div className="queue-column-body">
                            {waitingTickets.length === 0 && <div className="text-secondary" style={{ textAlign: 'center', padding: '20px' }}>Хүлээгдэж буй захиалга алга.</div>}
                            {waitingTickets.map(renderTicket)}
                        </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="queue-column in-progress">
                        <div className="queue-column-header">
                            Үйлчилгээ хийгдэж байна
                            <span className="queue-column-count">{inProgressTickets.length}</span>
                        </div>
                        <div className="queue-column-body">
                            {inProgressTickets.length === 0 && <div className="text-secondary" style={{ textAlign: 'center', padding: '20px' }}>Одоогоор ажиллаж буй үйлчилгээ алга.</div>}
                            {inProgressTickets.map(renderTicket)}
                        </div>
                    </div>

                    {/* Visual Placeholder for TV Screen Expansion */}
                    <div className="queue-column" style={{ opacity: 0.5, borderStyle: 'dashed', background: 'transparent' }}>
                        <div className="queue-column-header" style={{ background: 'transparent', borderBottomStyle: 'dashed' }}>
                            Бэлэн болсон (ТВ дэлгэц)
                            <span className="queue-column-count">0</span>
                        </div>
                        <div className="queue-column-body flex-center text-secondary" style={{ textAlign: 'center' }}>
                            Энэ баганад дууссан захиалгууд гарч 5 минутын дараа алга болно.
                        </div>
                    </div>
                </div>
            </div>

            {showAdd && <AddTicketModal onClose={() => setShowAdd(false)} />}
        </HubLayout>
    );
}

function AddTicketModal({ onClose }: { onClose: () => void }) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        customerName: '',
        customerPhone: '',
        vehicleInfo: '',
        serviceName: '',
        price: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business) return;
        setLoading(true);
        try {
            await serviceQueueService.createTicket(business.id, {
                customerId: null,
                customerName: data.customerName || 'Зочин',
                customerPhone: data.customerPhone,
                vehicleOrItemInfo: data.vehicleInfo,
                serviceName: data.serviceName,
                price: Number(data.price),
                status: 'waiting',
                createdAt: new Date(),
            });
            toast.success('Тасалбар нэмэгдлээ');
            onClose();
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Шинэ тасалбар</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Үйлчилгээний нэр</label>
                            <input className="input" placeholder="Жишээ: Бүтэн угаалга" value={data.serviceName} onChange={e => setData({ ...data, serviceName: e.target.value })} required autoFocus />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Үнэ (₮)</label>
                            <input className="input" type="number" placeholder="25,000" value={data.price} onChange={e => setData({ ...data, price: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Машины дугаар / Мэдээлэл</label>
                            <input className="input" placeholder="0001 УБН" value={data.vehicleInfo} onChange={e => setData({ ...data, vehicleInfo: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Үйлчлүүлэгч</label>
                                <input className="input" placeholder="Нэр" value={data.customerName} onChange={e => setData({ ...data, customerName: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Утас</label>
                                <input className="input" placeholder="Сүүлийн 4 орон" value={data.customerPhone} onChange={e => setData({ ...data, customerPhone: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="spin" size={16} /> : <Plus size={16} />} Нэмэх
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
