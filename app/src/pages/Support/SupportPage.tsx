import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Kanban, Filter, Plus, MessageSquareWarning, PackageOpen, Wrench, CheckCircle2 } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

type TicketStatus = 'new' | 'inspecting' | 'repairing' | 'resolved' | 'closed';

const TICKET_FIELDS: CrudField[] = [
    { name: 'customer', label: 'Үйлчлүүлэгч', type: 'text', required: true },
    { name: 'issue', label: 'Асуудал', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'warranty', label: 'Баталгаат засвар' },
            { value: 'return', label: 'Буцаалт' },
            { value: 'complaint', label: 'Гомдол' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'new', options: [
            { value: 'new', label: 'Шинэ' },
            { value: 'inspecting', label: 'Шалгаж буй' },
            { value: 'repairing', label: 'Засварт' },
            { value: 'resolved', label: 'Шийдвэрлэгдсэн' },
            { value: 'closed', label: 'Хаагдсан' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function SupportPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/supportTickets`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

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
        <HubLayout hubId="crm-hub">
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
                        <button className="btn btn-primary gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                            <Plus size={18} /> Шинэ бүртгэл
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
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
                                                    onClick={() => { setEditingItem(ticket); setShowModal(true); }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ticket.id.substring(0, 8)}</span>
                                                        <span className={`badge ${getTypeColor(ticket.type)}`}>
                                                            {ticket.type === 'warranty' ? 'Засвар' : ticket.type === 'return' ? 'Буцаалт' : 'Гомдол'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{ticket.issue}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Үйлчлүүлэгч: {ticket.customer}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>{ticket.date || '-'}</div>
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
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Тикет" icon={<Kanban size={20} />} collectionPath="businesses/{bizId}/supportTickets" fields={TICKET_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
