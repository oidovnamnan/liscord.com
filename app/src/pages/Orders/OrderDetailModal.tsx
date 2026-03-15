import { X, Printer, Clock, User, Package, CreditCard, CheckCircle2, ChevronDown, Loader2, ImageIcon, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Order, OrderStatusConfig } from '../../types';
import { ebarimtService } from '../../services/ebarimt';
import { orderService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { useAuthStore, useBusinessStore } from '../../store';
import { CreateReturnModal } from '../Returns/CreateReturnModal';
import './OrderDetailModal.css';

interface OrderDetailModalProps {
    bizId: string;
    order: Order;
    onClose: () => void;
    statuses: OrderStatusConfig[];
}

export function OrderDetailModal({ bizId, order, onClose, statuses }: OrderDetailModalProps) {
    const { user } = useAuthStore();
    const { business } = useBusinessStore();
    const [updating, setUpdating] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ebarimtData, setEbarimtData] = useState<any>(null);
    const [generatingBarimt, setGeneratingBarimt] = useState(false);
    const [currentStatusId, setCurrentStatusId] = useState(order.status);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const fmt = (n: number) => '₮' + n.toLocaleString('mn-MN');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatTime = (date?: Date | any) => {
        if (!date) return 'Саяхан';
        try {
            // Check if it's a Firestore Timestamp or normal Date
            const d = date.toDate ? date.toDate() : new Date(date);
            if (isNaN(d.getTime())) return 'Саяхан';
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const da = String(d.getDate()).padStart(2, '0');
            const ho = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            return `${mo}/${da} ${ho}:${mi}`;
        } catch {
            return 'Саяхан';
        }
    };

    const handleStatusChange = async (newStatusId: string) => {
        if (newStatusId.toLowerCase() === order.status?.toLowerCase()) return;
        setUpdating(true);
        try {
            const statusLabel = statuses.find(s => s.id.toLowerCase() === newStatusId.toLowerCase())?.label || newStatusId;
            const historyItem = {
                status: newStatusId,
                label: statusLabel,
                timestamp: new Date(),
                at: new Date(),
                note: `Төлөвийг [${statusLabel}] болгож өөрчлөв`,
                updatedBy: user?.displayName || 'Систем',
                by: user?.uid || 'system',
                byName: user?.displayName || 'Систем'
            };

            await orderService.updateOrderStatus(bizId, order.id, newStatusId, historyItem, {
                displayName: user?.displayName,
                email: user?.email,
                photoURL: user?.photoURL
            });
            setCurrentStatusId(newStatusId);
            toast.success('Төлөв шинэчлэгдлээ');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setUpdating(false);
        }
    };
    const handlePrint = () => {
        window.print();
    };

    const handleGenerateEbarimt = async () => {
        if (!business?.settings?.ebarimt) return;
        setGeneratingBarimt(true);
        try {
            const payload = ebarimtService.buildPayload(business.settings, order);
            const response = await ebarimtService.mockPutReceipt(payload);
            setEbarimtData(response);
            toast.success('НӨАТ-ын баримт амжилттай үүслээ');

            // Note: In a real app we would save this to the order doc immediately
            // orderService.updateOrder(business.id, order.id, { ebarimt: response });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Баримт үүсгэхэд алдаа гарлаа');
        } finally {
            setGeneratingBarimt(false);
        }
    };

    const activeStatus = statuses.find(s => s.id.toLowerCase() === currentStatusId?.toLowerCase()) ||
        statuses.find(s => s.id.toLowerCase() === order.status?.toLowerCase());

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal order-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header hide-print">
                    <div className="header-title-group">
                        <h2>Захиалга #{order.orderNumber}</h2>
                        {order.isDeleted ? (
                            <span className="badge badge-cancelled">Цуцалсан</span>
                        ) : (
                            <div className="status-selector-wrapper">
                                <select
                                    className="status-badge-select"
                                    value={currentStatusId}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={updating}
                                    style={{
                                        background: (activeStatus?.color || '#3b82f6') + '20',
                                        color: activeStatus?.color || '#3b82f6',
                                        border: `1px solid ${(activeStatus?.color || '#3b82f6')}40`,
                                    }}
                                >
                                    {statuses.filter(s => (s.isActive || s.id.toLowerCase() === order.status?.toLowerCase()) && s.id !== 'all').map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                                {updating && <Loader2 size={12} className="animate-spin status-loader" />}
                                <ChevronDown size={12} className="status-chevron" style={{ color: activeStatus?.color }} />
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        {order.paymentStatus !== 'unpaid' && !order.isDeleted && order.status !== 'cancelled' && (
                            <button className="btn btn-sm" onClick={() => setShowReturnModal(true)} style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Undo2 size={14} /> Буцаалт
                            </button>
                        )}
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
                                <h3 className="section-title"><Package size={16} /> Бараанууд <span style={{ fontWeight: 500, fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, marginLeft: '4px' }}>({order.items.length})</span></h3>
                                <div className="table-responsive-wrapper">
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '44px' }}></th>
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
                                                        <div className="item-thumb-cell">
                                                            {item.image ? (
                                                                <img src={item.image} alt="" />
                                                            ) : (
                                                                <ImageIcon size={14} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="item-name-cell">
                                                            {item.name}
                                                            {item.variant && <span className="item-variant">{item.variant}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="text-right" style={{ fontWeight: 700 }}>{item.quantity}</td>
                                                    <td className="text-right">{fmt(item.unitPrice)}</td>
                                                    <td className="text-right" style={{ fontWeight: 700 }}>{fmt(item.totalPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>

                        {/* E-BARIMT PRINT SECTION */}
                        {ebarimtData && (
                            <div className="print-only ebarimt-container" style={{ marginTop: 30, textAlign: 'center', borderTop: '2px dashed #000', paddingTop: 20 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>АШИГТ МАЛТМАЛ ТАТВАРЫН ЕРӨНХИЙ ГАЗАР</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px', textAlign: 'left', width: '220px', margin: '0 auto', fontSize: '0.9rem', marginBottom: 10 }}>
                                    <b>ДДТД:</b> <span>{ebarimtData.billId}</span>
                                    <b>Сугалаа:</b> <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{ebarimtData.lottery}</span>
                                    <b>Бүртгэл:</b> <span>{ebarimtData.internalCode}</span>
                                </div>
                                <div style={{
                                    width: 150, height: 150, margin: '15px auto',
                                    background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', position: 'relative'
                                }}>
                                    [QR Code]
                                </div>
                                <p style={{ fontSize: '0.8rem', marginTop: 10 }}>Баримтаа ebarimt апп-аар уншуулна уу</p>
                            </div>
                        )}

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
                                        <span>
                                            Карго (
                                            {order.financials.cargoIncluded ? 'Үнэдээ орсон' :
                                                (order.financials.totalAmount >= order.financials.subtotal + order.financials.deliveryFee + order.financials.cargoFee) ? 'Одоо төлнө' : 'Ирэхээр төлнө'}
                                            ):
                                        </span>
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

                                    {business?.settings?.ebarimt?.enabled && (
                                        <>
                                            <hr />
                                            <div className="fin-row hide-print" style={{ alignItems: 'center' }}>
                                                <span>НӨАТ:</span>
                                                {ebarimtData ? (
                                                    <span className="badge badge-success">Үүссэн</span>
                                                ) : (
                                                    <button className="btn btn-outline btn-sm" onClick={handleGenerateEbarimt} disabled={generatingBarimt}>
                                                        {generatingBarimt ? 'Уншиж байна...' : 'Баримт олгох'}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className="info-section hide-print">
                                <h3 className="section-title"><Clock size={16} /> Статус түүх</h3>
                                <div className="timeline-card">
                                    <div className="timeline">
                                        {/* Status items */}
                                        {statuses.filter(st => st.id !== 'all' && st.isActive).map((s, idx) => {
                                            const activeStatuses = statuses.filter(st => st.id !== 'all' && st.isActive);
                                            // Logic to check if this status is "completed" in terms of timeline
                                            const currentStatusIndex = activeStatuses.findIndex(st => st.id.toLowerCase() === currentStatusId?.toLowerCase());
                                            const isCompleted = !order.isDeleted && (currentStatusIndex >= idx);

                                            // Find timestamp from history
                                            const historyArray = Array.isArray(order.statusHistory) ? order.statusHistory : [];
                                            // The UI shows a predefined sequence (e.g. Шинэ -> Захиалагдсан -> Бараа ирсэн).
                                            // However, statuses can go back and forth. For the UI timeline *step* 's.id',
                                            // we want the *latest* history record where the status became 's.id'.
                                            const historyItem = historyArray.slice().reverse().find(h => h.status.toLowerCase() === s.id.toLowerCase());

                                            // Handle time
                                            let timeLabel = 'Саяхан';
                                            if (historyItem?.at) timeLabel = formatTime(historyItem.at);
                                            else if (s.id.toLowerCase() === 'new' || s.id.toLowerCase() === 'unpaid') timeLabel = formatTime(order.createdAt);
                                            else if (idx === 0) timeLabel = formatTime(order.createdAt); // Fallback for very first status

                                            // Handle actor
                                            let actorName = historyItem?.byName || historyItem?.updatedBy || '';
                                            if (!actorName && (s.id.toLowerCase() === 'new' || s.id.toLowerCase() === 'unpaid' || idx === 0)) {
                                                actorName = order.createdByName || '';
                                            }

                                            return (
                                                <div key={s.id} className={`timeline-item ${isCompleted ? 'active' : ''}`}>
                                                    <div className="timeline-marker">
                                                        {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="timeline-status-label">{s.label}</div>
                                                        {isCompleted && (
                                                            <div className="timeline-meta" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                <span className="timeline-time">{timeLabel}</span>
                                                                {actorName && (
                                                                    <>
                                                                        <span style={{ color: 'var(--border-color)' }}>|</span>
                                                                        <span className="timeline-actor">{actorName}</span>
                                                                    </>
                                                                )}
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

            {showReturnModal && (
                <CreateReturnModal
                    bizId={bizId}
                    order={order}
                    onClose={() => setShowReturnModal(false)}
                    onCreated={() => setShowReturnModal(false)}
                />
            )}
        </div>,
        document.body
    );
}
