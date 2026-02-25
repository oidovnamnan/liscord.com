import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Kanban, Filter, Plus, MessageSquareWarning, PackageOpen, Wrench, CheckCircle2 } from 'lucide-react';

type TicketStatus = 'new' | 'inspecting' | 'repairing' | 'resolved' | 'closed';

interface Ticket {
    id: string;
    customer: string;
    issue: string;
    type: 'warranty' | 'return' | 'complaint';
    status: TicketStatus;
    date: string;
}

const MOCK_TICKETS: Ticket[] = [
    { id: 'TCK-001', customer: 'Бат-Эрдэнэ', issue: 'Дэлгэц асахгүй байна', type: 'warranty', status: 'new', date: '2026-02-25' },
    { id: 'TCK-002', customer: 'Сүрэн', issue: 'Буруу размерийн гутал ирсэн', type: 'return', status: 'inspecting', date: '2026-02-24' },
    { id: 'TCK-003', customer: 'Алтан', issue: 'Хүргэлт маш их удсан', type: 'complaint', status: 'resolved', date: '2026-02-22' },
];

export function SupportPage() {
    const [tickets] = useState<Ticket[]>(MOCK_TICKETS);

    const getColIcon = (status: TicketStatus) => {
        switch (status) {
            case 'new': return <MessageSquareWarning size={16} />;
            case 'inspecting': return <PackageOpen size={16} />;
            case 'repairing': return <Wrench size={16} />;
            case 'resolved': return <CheckCircle2 size={16} />;
            default: return <Kanban size={16} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'warranty': return 'badge-info';
            case 'return': return 'badge-warning';
            case 'complaint': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    const columns: { id: TicketStatus; title: string; color: string }[] = [
        { id: 'new', title: 'Шинэ', color: 'var(--border-secondary)' },
        { id: 'inspecting', title: 'Шалгаж буй', color: 'var(--warning-color)' },
        { id: 'repairing', title: 'Засварт / Ажиллаж буй', color: 'var(--primary)' },
        { id: 'resolved', title: 'Шийдвэрлэгдсэн', color: 'var(--success-color)' },
    ];

    return (
        <div className="page-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Header
                title="Гомдол & Буцаалт"
                subtitle="Хэрэглэгчийн санал гомдол, баталгаат засвар болон буцаалтын хяналт"
            />

            <div className="page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-outline">
                            <Filter size={18} /> Шүүлтүүр
                        </button>
                    </div>
                    <button className="btn btn-primary gradient-btn">
                        <Plus size={18} /> Шинэ бүртгэл
                    </button>
                </div>

                {/* Kanban Board */}
                <div style={{ display: 'flex', gap: '20px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
                    {columns.map(col => {
                        const colTickets = tickets.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} style={{
                                flex: '0 0 320px',
                                background: 'var(--surface-1)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '100%'
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '16px',
                                    borderBottom: '2px solid',
                                    borderBottomColor: col.color,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getColIcon(col.id)} {col.title}
                                    </h3>
                                    <span style={{
                                        background: 'var(--surface-2)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}>
                                        {colTickets.length}
                                    </span>
                                </div>

                                {/* List */}
                                <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {colTickets.map(ticket => (
                                        <div key={ticket.id} style={{
                                            background: 'var(--surface-2)',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ticket.id}</span>
                                                <span className={`badge ${getTypeColor(ticket.type)}`}>
                                                    {ticket.type === 'warranty' ? 'Засвар' : ticket.type === 'return' ? 'Буцаалт' : 'Гомдол'}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>{ticket.issue}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Үйлчлүүлэгч: {ticket.customer}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>{ticket.date}</div>
                                        </div>
                                    ))}
                                    {colTickets.length === 0 && (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Хоосон байна
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
