import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { eventService, ticketService } from '../../services/db';
import type { Event, Ticket } from '../../types';
import { Users, MapPin, QrCode, Ticket as TicketIcon, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './TicketsPage.css';

export function TicketsPage() {
    const { business } = useBusinessStore();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapEvents: any;

        const load = async () => {
            unsnapEvents = eventService.subscribeEvents(business.id, (data) => {
                setEvents(data as Event[]);
                setLoading(false);
            });
        };

        load();
        return () => { if (unsnapEvents) unsnapEvents(); };
    }, [business?.id]);

    useEffect(() => {
        if (!business?.id || !selectedEventId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTickets([]);
            return;
        }

        const unsnapTickets = ticketService.subscribeTickets(business.id, selectedEventId, (data) => {
            setTickets(data as Ticket[]);
        });

        return () => { unsnapTickets(); };
    }, [business?.id, selectedEventId]);

    const handleSimulateScan = async () => {
        if (!business?.id || tickets.length === 0) {
            toast.error('Шалгах тасалбар олдсонгүй (Тест)');
            setShowScanner(false);
            return;
        }

        // Grab the first un-checked-in ticket for demonstration
        const testTicket = tickets.find(t => t.status !== 'checked_in');

        if (testTicket) {
            toast.promise(
                ticketService.checkInTicket(business.id, testTicket.id),
                {
                    loading: 'Уншиж байна...',
                    success: `${testTicket.customerName} - Амжилттай орлоо!`,
                    error: 'Алдаа гарлаа'
                }
            );
        } else {
            toast('Бүх тасалбар шалгагдсан байна.');
        }

        setTimeout(() => setShowScanner(false), 1500);
    };

    if (loading) return <div className="page-container flex-center">Арга хэмжээнүүд уншиж байна...</div>;

    return (
        <HubLayout hubId="projects-hub">
            <div className="page-container tickets-page animate-fade-in">
                <Header
                    title="Тасалбар & Арга хэмжээ"
                    subtitle="Тоглолт, Аялал, Эвэнт удирдлага"
                    action={{
                        label: "Шинэ эвэнт",
                        onClick: () => toast('Арга хэмжээ нэмэх (Удахгүй)')
                    }}
                />

                <div className="tickets-toolbar">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Удахгүй болох арга хэмжээнүүд</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedEventId && (
                            <button className="btn btn-secondary" onClick={() => setShowScanner(true)}>
                                <QrCode size={16} className="mr-sm" /> QR Шалгах (Gate)
                            </button>
                        )}
                    </div>
                </div>

                <div className="events-grid">
                    {events.map((event) => {
                        const isSelected = selectedEventId === event.id;
                        const fillPercentage = event.totalCapacity > 0
                            ? Math.min(100, Math.round((event.ticketsSold / event.totalCapacity) * 100))
                            : 0;

                        return (
                            <div
                                key={event.id}
                                className="event-card"
                                style={{ borderColor: isSelected ? 'var(--primary)' : 'var(--border-primary)', borderWidth: isSelected ? '2px' : '1px' }}
                                onClick={() => setSelectedEventId(event.id)}
                            >
                                <div className="event-hero">
                                    <div className="event-status-badge">{event.status === 'published' ? 'Зарагдаж байна' : event.status}</div>
                                    <div className="event-date-block">
                                        <div className="event-date-month">{format(event.startDate, 'MMM')}</div>
                                        <div className="event-date-day">{format(event.startDate, 'dd')}</div>
                                    </div>
                                </div>

                                <div className="event-body">
                                    <div className="event-title">{event.title}</div>

                                    <div className="event-meta-row" style={{ marginTop: '4px' }}>
                                        <MapPin size={14} /> {event.venue}
                                    </div>
                                    <div className="event-meta-row">
                                        <Users size={14} />
                                        <span>Хүчин чадал: {event.totalCapacity} хүн</span>
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '12px' }}>
                                            <span className="text-secondary">Борлуулалт</span>
                                            <strong>{fillPercentage}% ({event.ticketsSold} ш)</strong>
                                        </div>
                                        <div className="event-progress-bar-container">
                                            <div className="event-progress-fill" style={{ width: `${fillPercentage}%`, backgroundColor: fillPercentage > 90 ? 'var(--danger)' : 'var(--primary)' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="event-footer">
                                    <span className="event-price">₮{event.basePrice.toLocaleString()} / ш</span>
                                    <TicketIcon size={18} className="text-secondary" />
                                </div>
                            </div>
                        );
                    })}

                    {events.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Одоогоор төлөвлөгдсөн арга хэмжээ алга байна. "Шинэ эвэнт" товчоор үүсгэнэ үү.
                        </div>
                    )}
                </div>

                {/* QR Scanner Simulation Modal */}
                {showScanner && (
                    <div className="checkin-overlay" onClick={() => setShowScanner(false)}>
                        <div className="checkin-scanner" onClick={e => e.stopPropagation()}>
                            <h2 style={{ marginBottom: '24px' }}>Тасалбар шалгах</h2>
                            <div className="qr-frame">
                                <div className="qr-scan-line"></div>
                                <QrCode size={100} style={{ opacity: 0.2 }} />
                            </div>
                            <p className="text-secondary" style={{ marginBottom: '24px' }}>Сканнердахыг хүлээж байна...</p>

                            <button className="btn btn-primary" onClick={handleSimulateScan} style={{ width: '100%', justifyContent: 'center' }}>
                                <CheckCircle size={18} className="mr-sm" /> Шууд оруулах (Тест)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
