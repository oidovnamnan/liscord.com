import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Filter, Plus, Cog, CheckCircle2, Timer, PlayCircle } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';

type OrderStatus = 'pending' | 'cutting' | 'assembling' | 'finished';

interface ProductionOrder {
    id: string;
    product: string;
    quantity: number;
    client: string;
    status: OrderStatus;
    deadline: string;
}

const MOCK_ORDERS: ProductionOrder[] = [
    { id: 'PRD-101', product: 'Гал тогооны тавилга', quantity: 1, client: 'Цэнгэл', status: 'pending', deadline: '2026-03-01' },
    { id: 'PRD-102', product: 'Оффисын ширээ', quantity: 15, client: 'М банк', status: 'cutting', deadline: '2026-02-28' },
    { id: 'PRD-103', product: 'Аварга том хаалга', quantity: 2, client: 'Хотол', status: 'assembling', deadline: '2026-02-26' },
];

export function ManufacturingPage() {
    const [orders] = useState<ProductionOrder[]>(MOCK_ORDERS);

    const columns: { id: OrderStatus; title: string; icon: any; color: string }[] = [
        { id: 'pending', title: 'Хүлээгдэж буй', icon: Timer, color: 'var(--border-secondary)' },
        { id: 'cutting', title: 'Эсгүүр / Бэлтгэл', icon: Cog, color: 'var(--warning-color)' },
        { id: 'assembling', title: 'Угсралт / Үйлдвэрлэл', icon: PlayCircle, color: 'var(--primary)' },
        { id: 'finished', title: 'Бэлэн болсон', icon: CheckCircle2, color: 'var(--success-color)' },
    ];

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Header
                    title="Үйлдвэрлэл & Угсралт"
                    subtitle="Тавилга, хэвлэл болон бусад үе шаттай үйлдвэрлэлийн захиалгууд"
                />

                <div className="page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-outline">
                                <Filter size={18} /> Үе шат
                            </button>
                        </div>
                        <button className="btn btn-primary gradient-btn">
                            <Plus size={18} /> Захиалга оруулах
                        </button>
                    </div>

                    {/* Kanban Board */}
                    <div style={{ display: 'flex', gap: '20px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
                        {columns.map(col => {
                            const colOrders = orders.filter(t => t.status === col.id);
                            const Icon = col.icon;
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
                                            <Icon size={16} /> {col.title}
                                        </h3>
                                        <span style={{
                                            background: 'var(--surface-2)',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {colOrders.length}
                                        </span>
                                    </div>

                                    {/* List */}
                                    <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {colOrders.map(order => (
                                            <div key={order.id} style={{
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
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{order.id}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.quantity} ш</span>
                                                </div>
                                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{order.product}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Захиалагч: {order.client}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--warning-color)', marginTop: '8px', textAlign: 'right' }}>Хугацаа: {order.deadline}</div>
                                            </div>
                                        ))}
                                        {colOrders.length === 0 && (
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
        </HubLayout>
    );
}
