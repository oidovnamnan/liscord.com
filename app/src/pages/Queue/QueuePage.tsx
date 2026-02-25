import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { serviceQueueService } from '../../services/db';
import type { ServiceTicket } from '../../types';
import { Search, Filter, Clock, UserCheck, Play, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import './QueuePage.css';

export function QueuePage() {
    const { business } = useBusinessStore();
    const [tickets, setTickets] = useState<ServiceTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);

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

    // Auto-refresh timer to update "time ago" texts (every minute)
    // useEffect(() => {
    //     const interval = setInterval(() => setTickets([...tickets]), 60000);
    //     return () => clearInterval(interval);
    // }, [tickets]);

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
        <div className="page-container queue-page animate-fade-in">
            <Header
                title="Үйлчилгээний Дараалал"
                subtitle="Угаалга, Засвар, Салон амьд хяналт"
                action={{
                    label: "Тасалбар нэмэх",
                    onClick: () => toast('Тасалбар хэвлэх (Удахгүй)')
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
    );
}
