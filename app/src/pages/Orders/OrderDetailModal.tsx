import { X, Printer, Clock, User, Package, CreditCard, CheckCircle2 } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import './OrderDetailModal.css';

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
}

const statusConfig: Record<OrderStatus, { label: string; cls: string }> = {
    new: { label: 'Шинэ', cls: 'badge-new' },
    confirmed: { label: 'Баталсан', cls: 'badge-confirmed' },
    preparing: { label: 'Бэлтгэж буй', cls: 'badge-preparing' },
    ready: { label: 'Бэлэн', cls: 'badge-preparing' },
    shipping: { label: 'Хүргэлтэнд', cls: 'badge-shipping' },
    delivered: { label: 'Хүргэгдсэн', cls: 'badge-delivered' },
    completed: { label: 'Дууссан', cls: 'badge-delivered' },
    cancelled: { label: 'Цуцалсан', cls: 'badge-cancelled' },
};

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
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
                        <span className={`badge ${statusConfig[order.status]?.cls}`}>
                            {statusConfig[order.status]?.label}
                        </span>
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
                                        {[
                                            { status: 'new', label: 'Захиалга үүсэх', completed: true },
                                            { status: 'confirmed', label: 'Баталгаажсан', completed: order.status !== 'new' && order.status !== 'cancelled' },
                                            { status: 'preparing', label: 'Бэлтгэж байна', completed: ['preparing', 'ready', 'shipping', 'delivered', 'completed'].includes(order.status) },
                                            { status: 'shipping', label: 'Хүргэлтэнд гарсан', completed: ['shipping', 'delivered', 'completed'].includes(order.status) },
                                            { status: 'delivered', label: 'Хүргэгдсэн', completed: ['delivered', 'completed'].includes(order.status) }
                                        ].map((item, idx) => (
                                            <div key={idx} className={`timeline - item ${item.completed ? 'active' : ''} `}>
                                                <div className="timeline-marker">
                                                    {item.completed ? <CheckCircle2 size={12} /> : idx + 1}
                                                </div>
                                                <div className="timeline-content">
                                                    <div className="timeline-status-label">{item.label}</div>
                                                    {item.completed && (
                                                        <div className="timeline-meta">
                                                            <span className="timeline-time">2026.02.23 09:16</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
