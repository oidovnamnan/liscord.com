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

    // Fulfillment state
    const [showArrivalPanel, setShowArrivalPanel] = useState(false);
    const [arrivalQuantities, setArrivalQuantities] = useState<number[]>([]);
    const [savingArrival, setSavingArrival] = useState(false);
    const [showPickupPanel, setShowPickupPanel] = useState(false);
    const [pickupQuantities, setPickupQuantities] = useState<number[]>([]);
    const [savingPickup, setSavingPickup] = useState(false);
    const [pickupMethod, setPickupMethod] = useState<'pickup' | 'delivery'>(order.pickupMethod || 'pickup');

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

    const handleSaveArrival = async () => {
        if (!business) return;
        setSavingArrival(true);
        try {
            const itemUpdates = arrivalQuantities.map((qty, index) => ({ index, arrivedQuantity: qty }));
            await orderService.markItemsArrived(bizId, order.id, itemUpdates, {
                uid: user?.uid,
                displayName: user?.displayName
            });
            setShowArrivalPanel(false);
            toast.success('Бараа ирсэн тэмдэглэгдлээ');
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setSavingArrival(false);
        }
    };

    const handleSavePickup = async () => {
        if (!business) return;
        setSavingPickup(true);
        try {
            const itemUpdates = pickupQuantities.map((qty, index) => ({ index, pickedUpQuantity: qty }));
            await orderService.markItemsPickedUp(bizId, order.id, itemUpdates, pickupMethod, {
                uid: user?.uid,
                displayName: user?.displayName
            });
            setShowPickupPanel(false);
            toast.success(pickupMethod === 'delivery' ? 'Хүргэлт тэмдэглэгдлээ' : 'Авсан тэмдэглэгдлээ');
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setSavingPickup(false);
        }
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

                                {/* Fulfillment progress summary */}
                                {order.items.some(i => (i.arrivedQuantity || 0) > 0) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: order.fulfillmentStatus === 'full' ? '#d1fae520' : '#fef3c720', border: `1px solid ${order.fulfillmentStatus === 'full' ? '#10b98130' : '#f59e0b30'}`, marginBottom: 10, fontSize: '0.82rem', fontWeight: 600 }}>
                                        <span>{order.fulfillmentStatus === 'full' ? '✅' : '📦'}</span>
                                        <span style={{ color: order.fulfillmentStatus === 'full' ? '#10b981' : '#f59e0b' }}>
                                            {order.fulfillmentNote || 'Хүлээж буй'}
                                        </span>
                                    </div>
                                )}

                                <div className="table-responsive-wrapper">
                                    <table className="items-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '44px' }}></th>
                                                <th>Нэр</th>
                                                <th className="text-right">Тоо</th>
                                                <th className="text-right">Ирсэн</th>
                                                <th className="text-right">Нэгж үнэ</th>
                                                <th className="text-right">Нийт</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, idx) => {
                                                const arrived = item.arrivedQuantity || 0;
                                                const pickedUp = item.pickedUpQuantity || 0;
                                                const arrivalColor = arrived >= item.quantity ? '#10b981' : arrived > 0 ? '#f59e0b' : '#94a3b8';
                                                return (
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
                                                        <td className="text-right">
                                                            <span style={{ fontWeight: 700, color: arrivalColor, fontSize: '0.82rem' }}>
                                                                {arrived}/{item.quantity}
                                                            </span>
                                                            {pickedUp > 0 && (
                                                                <div style={{ fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 600 }}>
                                                                    авсан: {pickedUp}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-right">{fmt(item.unitPrice)}</td>
                                                        <td className="text-right" style={{ fontWeight: 700 }}>{fmt(item.totalPrice)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Arrival marking panel */}
                                {!order.isDeleted && ['confirmed', 'sourced', 'arrived'].includes(currentStatusId) && (
                                    <div style={{ marginTop: 12, border: '1px solid var(--border-primary)', borderRadius: 12, padding: 14, background: 'var(--surface-1)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            📥 Бараа ирсэн тэмдэглэх
                                        </div>
                                        {!showArrivalPanel ? (
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => {
                                                    setArrivalQuantities(order.items.map(i => i.arrivedQuantity || 0));
                                                    setShowArrivalPanel(true);
                                                }}
                                                style={{ width: '100%' }}
                                            >
                                                Ирсэн бараа тэмдэглэх
                                            </button>
                                        ) : (
                                            <div>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                                                        <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={item.quantity}
                                                            value={arrivalQuantities[idx] ?? 0}
                                                            onChange={e => {
                                                                const val = Math.min(Number(e.target.value), item.quantity);
                                                                setArrivalQuantities(prev => { const n = [...prev]; n[idx] = val; return n; });
                                                            }}
                                                            style={{ width: 60, height: 32, borderRadius: 8, border: '1px solid var(--border-primary)', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                                                        />
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {item.quantity}</span>
                                                    </div>
                                                ))}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => setShowArrivalPanel(false)} style={{ flex: 1 }}>Болих</button>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        disabled={savingArrival}
                                                        onClick={handleSaveArrival}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {savingArrival ? <Loader2 size={14} className="animate-spin" /> : '💾 Хадгалах'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pickup marking panel */}
                                {!order.isDeleted && (currentStatusId === 'arrived' || order.fulfillmentStatus === 'full' || order.fulfillmentStatus === 'partial') && (
                                    <div style={{ marginTop: 12, border: '1px solid var(--border-primary)', borderRadius: 12, padding: 14, background: 'var(--surface-1)' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            🛒 Хэрэглэгч авсан тэмдэглэх
                                        </div>
                                        {!showPickupPanel ? (
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => {
                                                    setPickupQuantities(order.items.map(i => i.pickedUpQuantity || 0));
                                                    setShowPickupPanel(true);
                                                }}
                                                style={{ width: '100%' }}
                                            >
                                                Авсан бараа тэмдэглэх
                                            </button>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                                    <button
                                                        className={`btn btn-sm ${pickupMethod === 'pickup' ? 'btn-primary' : 'btn-secondary'}`}
                                                        onClick={() => setPickupMethod('pickup')}
                                                        style={{ flex: 1, fontSize: '0.78rem' }}
                                                    >
                                                        🏬 Ирж авсан
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${pickupMethod === 'delivery' ? 'btn-primary' : 'btn-secondary'}`}
                                                        onClick={() => setPickupMethod('delivery')}
                                                        style={{ flex: 1, fontSize: '0.78rem' }}
                                                    >
                                                        🚚 Хүргэсэн
                                                    </button>
                                                </div>
                                                {order.items.map((item, idx) => {
                                                    const maxPickup = item.arrivedQuantity || 0;
                                                    return (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                                                            <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={maxPickup}
                                                                value={pickupQuantities[idx] ?? 0}
                                                                onChange={e => {
                                                                    const val = Math.min(Number(e.target.value), maxPickup);
                                                                    setPickupQuantities(prev => { const n = [...prev]; n[idx] = val; return n; });
                                                                }}
                                                                style={{ width: 60, height: 32, borderRadius: 8, border: '1px solid var(--border-primary)', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                                                            />
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {maxPickup} ирсэн</span>
                                                        </div>
                                                    );
                                                })}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => setShowPickupPanel(false)} style={{ flex: 1 }}>Болих</button>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        disabled={savingPickup}
                                                        onClick={handleSavePickup}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {savingPickup ? <Loader2 size={14} className="animate-spin" /> : '💾 Хадгалах'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
