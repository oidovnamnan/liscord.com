import { X, Printer, Clock, User, Package, CreditCard, CheckCircle2 } from 'lucide-react';
import type { Order, OrderStatusConfig } from '../../types';
import './OrderDetailModal.css';

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    statuses: OrderStatusConfig[];
}

export function OrderDetailModal({ order, onClose, statuses }: OrderDetailModalProps) {
    const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN');

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal order-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header hide-print">
                    <div className="header-title-group">
                        <h2>Захиалга #{order.orderNumber}</h2>
                        {order.isDeleted ? (
                            <span className="badge badge-cancelled">Цуцалсан</span>
                        ) : (
                            <span
                                className="badge"
                                style={{
                                    background: statuses.find(s => s.id === order.status)?.color + '20',
                                    color: statuses.find(s => s.id === order.status)?.color,
                                    border: `1px solid ${statuses.find(s => s.id === order.status)?.color}40`,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700
                                }}
                            >
                                {statuses.find(s => s.id === order.status)?.label || order.status}
                            </span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                            <Printer size={16} /> Хэвлэх
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="modal-body print-container">
                    {/* Print Header (Visible only on print) */}
                    <div className="print-only invoice-header">
                        <div className="invoice-brand">
                            <h1>Liscord</h1>
                            <p>Ухаалаг карго систем</p>
                        </div>
                        <div className="invoice-meta">
                            <h2>НЭХЭМЖЛЭХ</h2>
                            <p>ID: #{order.orderNumber}</p>
                            <p>Огноо: {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString('mn-MN') : 'Саяхан'}</p>
                        </div>
                    </div>

                    <div className="order-grid">
                        <div className="order-main-info">
                            <section className="info-section">
                                <h3 className="section-title"><User size={16} /> Харилцагч</h3>
                                <div className="info-card">
                                    <div className="info-row">
                                        <span className="label">Нэр:</span>
                                        <span className="value">{order.customer.name}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Утас:</span>
                                        <span className="value">{order.customer.phone}</span>
                                    </div>
                                    {order.customer.socialHandle && (
                                        <div className="info-row">
                                            <span className="label">Сошиал:</span>
                                            <span className="value text-primary">@{order.customer.socialHandle}</span>
                                        </div>
                                    )}
                                    {order.source && (
                                        <div className="info-row">
                                            <span className="label">Эх сурвалж:</span>
                                            <span className="value" style={{ textTransform: 'capitalize' }}>
                                                {order.source}
                                            </span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="label">Хаяг:</span>
                                        <span className="value">{order.deliveryAddress || 'Тодорхойгүй'}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="info-section">
                                <h3 className="section-title"><Package size={16} /> Бараанууд</h3>
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th>Нэр</th>
                                            <th className="text-right">Тоо</th>
                                            <th className="text-right">Нэгж үнэ</th>
                                            <th className="text-right">Нийт</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <div className="item-name-cell">
                                                        {item.name}
                                                        {item.variant && <span className="item-variant">{item.variant}</span>}
                                                    </div>
                                                </td>
                                                <td className="text-right">{item.quantity}</td>
                                                <td className="text-right">{fmt(item.unitPrice)}</td>
                                                <td className="text-right">{fmt(item.totalPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        </div>

                        <div className="order-sidebar-info">
                            <section className="info-section">
                                <h3 className="section-title"><CreditCard size={16} /> Төлбөрийн мэдээлэл</h3>
                                <div className="financial-card">
                                    <div className="fin-row">
                                        <span>Захиалгын дүн:</span>
                                        <span>{fmt(order.financials.subtotal)}</span>
                                    </div>
                                    <div className="fin-row">
                                        <span>Хүргэлт:</span>
                                        <span>{fmt(order.financials.deliveryFee)}</span>
                                    </div>
                                    <div className="fin-row">
                                        <span>Карго ({order.financials.cargoIncluded ? 'Үнэд орсон' : 'Тусдаа'}):</span>
                                        <span>{fmt(order.financials.cargoFee)}</span>
                                    </div>
                                    <hr />
                                    <div className="fin-row total">
                                        <span>Нийт дүн:</span>
                                        <span>{fmt(order.financials.totalAmount)}</span>
                                    </div>
                                    <div className="fin-row paid">
                                        <span>Төлсөн:</span>
                                        <span>{fmt(order.financials.paidAmount)}</span>
                                    </div>
                                    <div className="fin-row due">
                                        <span>Үлдэгдэл:</span>
                                        <span className={order.financials.balanceDue > 0 ? 'text-danger' : 'text-success'}>
                                            {fmt(order.financials.balanceDue)}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="info-section hide-print">
                                <h3 className="section-title"><Clock size={16} /> Статус түүх</h3>
                                <div className="timeline-card">
                                    <div className="timeline">
                                        {/* Status items */}
                                        {statuses.slice(0, 6).map((s, idx) => {
                                            const isSystem = ['new', 'confirmed', 'preparing', 'shipping', 'delivered', 'completed'].includes(s.id);
                                            if (!isSystem && idx > 5) return null; // Simplified timeline

                                            // Logic to check if this status is "completed" in terms of timeline
                                            const currentStatusIndex = statuses.findIndex(st => st.id === order.status);
                                            const isCompleted = !order.isDeleted && (currentStatusIndex >= idx);

                                            return (
                                                <div key={s.id} className={`timeline-item ${isCompleted ? 'active' : ''}`}>
                                                    <div className="timeline-marker">
                                                        {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="timeline-status-label">{s.label}</div>
                                                        {isCompleted && (
                                                            <div className="timeline-meta">
                                                                <span className="timeline-time">Саяхан</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section className="info-section hide-print">
                                <h3 className="section-title">Төлбөрийн баримт</h3>
                                <div className="payment-screenshot-box">
                                    {order.paymentScreenshot ? (
                                        <img src={order.paymentScreenshot} alt="Баримт" style={{ maxWidth: '100%', borderRadius: 16 }} />
                                    ) : (
                                        <div className="empty-photo-placeholder" style={{ borderRadius: 16 }}>
                                            📷 Баримтын зураг байхгүй
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="order-notes-section">
                            <h3 className="section-title">Тэмдэглэл</h3>
                            <div className="notes-box">{order.notes}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
