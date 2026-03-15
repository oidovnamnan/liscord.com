import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore, useAuthStore } from '../../store';
import { Undo2, Clock, CheckCircle, XCircle, DollarSign, Search, X, Eye, AlertTriangle } from 'lucide-react';
import type { ReturnRequest, ReturnStatus, Order } from '../../types';
import './ReturnsPage.css';

const STATUS_LABELS: Record<ReturnStatus, string> = {
    pending: 'Хүлээгдэж буй',
    operator_review: 'Оператор хянаж буй',
    approved: 'Зөвшөөрсөн',
    finance_review: 'Санхүүд шилжүүлсэн',
    refunded: 'Буцаалт хийгдсэн',
    rejected: 'Татгалзсан',
};

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
    source_return: { label: 'Сорс буцаалт', emoji: '📦' },
    late_delivery: { label: 'Хүргэлт удааширсан', emoji: '⏱️' },
    product_issue: { label: 'Бараа асуудалтай', emoji: '📸' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDate(val: any): Date {
    if (!val) return new Date();
    if (val instanceof Timestamp) return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    return new Date(val);
}

export function ReturnsPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const employee = useBusinessStore(s => s.employee);

    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [financeNote, setFinanceNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Subscribe to returns
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, `businesses/${business.id}/returns`),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: toDate(d.data().createdAt),
                updatedAt: toDate(d.data().updatedAt),
            })) as ReturnRequest[];
            setReturns(data);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // Stats
    const stats = useMemo(() => {
        const pending = returns.filter(r => r.status === 'pending' || r.status === 'operator_review').length;
        const financeReview = returns.filter(r => r.status === 'finance_review').length;
        const refunded = returns.filter(r => r.status === 'refunded').length;
        const totalRefunded = returns.filter(r => r.status === 'refunded').reduce((s, r) => s + r.refundAmount, 0);
        return { pending, financeReview, refunded, totalRefunded };
    }, [returns]);

    // Filtered
    const filtered = useMemo(() => {
        return returns.filter(r => {
            if (filterStatus !== 'all' && r.status !== filterStatus) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    r.orderNumber?.toLowerCase().includes(q) ||
                    r.customer.name?.toLowerCase().includes(q) ||
                    r.customer.phone?.includes(q)
                );
            }
            return true;
        });
    }, [returns, filterStatus, searchQuery]);

    const currentUserName = employee?.name || user?.displayName || 'System';
    const currentUserId = user?.uid || '';

    // ── Actions ──
    const handleStatusChange = async (returnReq: ReturnRequest, newStatus: ReturnStatus, note?: string) => {
        if (!business?.id) return;
        setActionLoading(true);
        try {
            const ref = doc(db, `businesses/${business.id}/returns`, returnReq.id);
            const update: Record<string, unknown> = {
                status: newStatus,
                updatedAt: new Date(),
                statusHistory: [
                    ...(returnReq.statusHistory || []),
                    { status: newStatus, at: new Date(), by: currentUserId, byName: currentUserName, note: note || '' }
                ]
            };
            if (newStatus === 'refunded') {
                update.refundedBy = currentUserId;
                update.refundedAt = new Date();
                update.financeNote = financeNote || note || '';

                // Update order financials
                try {
                    const orderRef = doc(db, `businesses/${business.id}/orders`, returnReq.orderId);
                    const orderSnap = await getDocs(query(collection(db, `businesses/${business.id}/orders`), where('__name__', '==', returnReq.orderId)));
                    if (!orderSnap.empty) {
                        const orderData = orderSnap.docs[0].data() as Order;
                        const newPaidAmount = Math.max(0, (orderData.financials?.paidAmount || 0) - returnReq.refundAmount);
                        const newBalanceDue = (orderData.financials?.totalAmount || 0) - newPaidAmount;
                        await updateDoc(orderRef, {
                            'financials.paidAmount': newPaidAmount,
                            'financials.balanceDue': newBalanceDue,
                            returnStatus: returnReq.refundAmount >= (orderData.financials?.totalAmount || 0) ? 'full' : 'partial',
                            returnIds: [...(orderData.returnIds || []), returnReq.id],
                        });
                    }
                } catch (e) {
                    console.error('Failed to update order financials:', e);
                }
            }
            if (newStatus === 'rejected') {
                update.financeNote = note || '';
            }
            await updateDoc(ref, update);
            // Refresh selected
            setSelectedReturn(prev => prev ? { ...prev, ...update, status: newStatus } as ReturnRequest : null);
        } catch (e) {
            console.error('Failed to update return status:', e);
        } finally {
            setActionLoading(false);
            setActionNote('');
            setFinanceNote('');
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #f87171, #ef4444)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Undo2 size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Буцаалт & Refund</h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Захиалгын буцаалт удирдах</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="returns-stats">
                <div className="returns-stat-card">
                    <div className="returns-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="returns-stat-value">{stats.pending}</div>
                        <div className="returns-stat-label">Хүлээгдэж буй</div>
                    </div>
                </div>
                <div className="returns-stat-card">
                    <div className="returns-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Eye size={22} />
                    </div>
                    <div>
                        <div className="returns-stat-value">{stats.financeReview}</div>
                        <div className="returns-stat-label">Санхүүд шилжсэн</div>
                    </div>
                </div>
                <div className="returns-stat-card">
                    <div className="returns-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <CheckCircle size={22} />
                    </div>
                    <div>
                        <div className="returns-stat-value">{stats.refunded}</div>
                        <div className="returns-stat-label">Буцаалт хийгдсэн</div>
                    </div>
                </div>
                <div className="returns-stat-card">
                    <div className="returns-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <DollarSign size={22} />
                    </div>
                    <div>
                        <div className="returns-stat-value">{stats.totalRefunded.toLocaleString()}₮</div>
                        <div className="returns-stat-label">Нийт буцаасан</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="returns-filters">
                <div className="returns-tab-group">
                    {[
                        { key: 'all', label: 'Бүгд', count: returns.length },
                        { key: 'pending', label: 'Хүлээгдэж буй', count: returns.filter(r => r.status === 'pending').length },
                        { key: 'operator_review', label: 'Хянаж буй', count: returns.filter(r => r.status === 'operator_review').length },
                        { key: 'finance_review', label: 'Санхүү', count: returns.filter(r => r.status === 'finance_review').length },
                        { key: 'refunded', label: 'Буцаасан', count: returns.filter(r => r.status === 'refunded').length },
                        { key: 'rejected', label: 'Татгалзсан', count: returns.filter(r => r.status === 'rejected').length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`returns-tab ${filterStatus === tab.key ? 'active' : ''}`}
                            onClick={() => setFilterStatus(tab.key)}
                        >
                            {tab.label}
                            {tab.count > 0 && <span className="badge">{tab.count}</span>}
                        </button>
                    ))}
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        placeholder="Хайх..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 36, height: 38, borderRadius: 10, width: 220, fontSize: '0.82rem' }}
                    />
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="returns-empty">
                    <div className="returns-empty-icon">📦</div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Буцаалт байхгүй</h3>
                    <p style={{ fontSize: '0.85rem' }}>Захиалгаас буцаалт хийхэд энд харагдана</p>
                </div>
            ) : (
                <div className="returns-table-wrap">
                    <table className="returns-table">
                        <thead>
                            <tr>
                                <th>Захиалга</th>
                                <th>Захиалагч</th>
                                <th>Төрөл</th>
                                <th>Дүн</th>
                                <th>Төлөв</th>
                                <th>Огноо</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} onClick={() => setSelectedReturn(r)}>
                                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                        {r.orderNumber}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{r.customer.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.customer.phone}</div>
                                    </td>
                                    <td>
                                        <span className={`return-type ${r.type}`}>
                                            {TYPE_LABELS[r.type]?.emoji} {TYPE_LABELS[r.type]?.label}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>
                                        {r.refundAmount.toLocaleString()}₮
                                    </td>
                                    <td>
                                        <span className={`return-status ${r.status}`}>
                                            {STATUS_LABELS[r.status]}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {toDate(r.createdAt).toLocaleDateString('mn-MN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Panel */}
            {selectedReturn && (
                <div className="return-detail-overlay" onClick={() => setSelectedReturn(null)}>
                    <div className="return-detail-panel" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="return-detail-header">
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                                    Буцаалт #{selectedReturn.orderNumber}
                                </h2>
                                <span className={`return-status ${selectedReturn.status}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                                    {STATUS_LABELS[selectedReturn.status]}
                                </span>
                            </div>
                            <button className="btn btn-ghost" onClick={() => setSelectedReturn(null)} style={{ padding: 8 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="return-detail-body">
                            {/* Customer */}
                            <div className="return-detail-section">
                                <h4>Захиалагч</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Нэр:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedReturn.customer.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Утас:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedReturn.customer.phone}</span>
                                </div>
                                {selectedReturn.refundAccount && (
                                    <>
                                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 8 }} />
                                        <h4 style={{ marginBottom: 8 }}>Буцаалтын данс</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Банк:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedReturn.refundAccount.bankName}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Данс:</span>
                                            <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedReturn.refundAccount.accountNumber}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Нэр:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedReturn.refundAccount.accountHolder}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Type & Reason */}
                            <div className="return-detail-section">
                                <h4>Буцаалтын мэдээлэл</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Төрөл:</span>
                                    <span className={`return-type ${selectedReturn.type}`}>
                                        {TYPE_LABELS[selectedReturn.type]?.emoji} {TYPE_LABELS[selectedReturn.type]?.label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Шалтгаан:</span>
                                    <span style={{ fontWeight: 600 }}>{selectedReturn.reason}</span>
                                </div>
                                {selectedReturn.reasonNote && (
                                    <div style={{ background: 'var(--bg-soft)', padding: 10, borderRadius: 8, fontSize: '0.82rem', marginTop: 6, fontStyle: 'italic' }}>
                                        {selectedReturn.reasonNote}
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="return-detail-section">
                                <h4>Буцаах бараа</h4>
                                {selectedReturn.items.map((item, i) => (
                                    <div key={i} className="return-item-row">
                                        {item.image ?
                                            <img className="return-item-img" src={item.image} alt={item.name} /> :
                                            <div className="return-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                                        }
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {item.quantity}ш × {item.unitPrice.toLocaleString()}₮
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            {item.proportionalRefund.toLocaleString()}₮
                                        </div>
                                    </div>
                                ))}
                                {selectedReturn.includeDeliveryFee && selectedReturn.deliveryFeeRefund > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px dashed var(--border-color)', marginTop: 6, fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Хүргэлтийн зардал буцаалт:</span>
                                        <span style={{ fontWeight: 700 }}>{selectedReturn.deliveryFeeRefund.toLocaleString()}₮</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid var(--border-color)', marginTop: 8, fontSize: '0.95rem' }}>
                                    <span style={{ fontWeight: 700 }}>Нийт буцаах дүн:</span>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedReturn.refundAmount.toLocaleString()}₮</span>
                                </div>
                            </div>

                            {/* Evidence */}
                            {selectedReturn.evidenceUrls && selectedReturn.evidenceUrls.length > 0 && (
                                <div className="return-detail-section">
                                    <h4>📸 Баталгаажуулалт</h4>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {selectedReturn.evidenceUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                <img src={url} alt={`evidence-${i}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status History */}
                            {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                                <div className="return-detail-section">
                                    <h4>Түүх</h4>
                                    {selectedReturn.statusHistory.map((h, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.8rem', marginBottom: 8 }}>
                                            <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {toDate(h.at).toLocaleString('mn-MN')}
                                            </div>
                                            <div>
                                                <span className={`return-status ${h.status}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                                                    {STATUS_LABELS[h.status as ReturnStatus] || h.status}
                                                </span>
                                                <span style={{ marginLeft: 6, color: 'var(--text-secondary)' }}>— {h.byName}</span>
                                                {h.note && <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{h.note}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Finance note display */}
                            {selectedReturn.financeNote && selectedReturn.status === 'refunded' && (
                                <div className="return-detail-section" style={{ borderColor: '#22c55e44', background: 'rgba(34, 197, 94, 0.04)' }}>
                                    <h4>💰 Санхүүгийн тайлбар</h4>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{selectedReturn.financeNote}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {selectedReturn.status !== 'refunded' && selectedReturn.status !== 'rejected' && (
                            <div className="return-actions" style={{ flexDirection: 'column', gap: 10 }}>
                                <textarea
                                    className="input"
                                    placeholder={selectedReturn.status === 'finance_review' ? 'Санхүүгийн тайлбар бичнэ үү...' : 'Тайлбар (заавал биш)...'}
                                    value={selectedReturn.status === 'finance_review' ? financeNote : actionNote}
                                    onChange={e => selectedReturn.status === 'finance_review' ? setFinanceNote(e.target.value) : setActionNote(e.target.value)}
                                    rows={2}
                                    style={{ borderRadius: 10, fontSize: '0.82rem', resize: 'none' }}
                                />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {selectedReturn.status === 'pending' && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ flex: 1 }}
                                            disabled={actionLoading}
                                            onClick={() => handleStatusChange(selectedReturn, 'operator_review', actionNote)}
                                        >
                                            Хянах
                                        </button>
                                    )}
                                    {selectedReturn.status === 'operator_review' && (
                                        <>
                                            <button
                                                className="btn"
                                                style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none' }}
                                                disabled={actionLoading}
                                                onClick={() => handleStatusChange(selectedReturn, 'finance_review', actionNote)}
                                            >
                                                <CheckCircle size={16} /> Зөвшөөрөх
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none' }}
                                                disabled={actionLoading}
                                                onClick={() => handleStatusChange(selectedReturn, 'rejected', actionNote)}
                                            >
                                                <XCircle size={16} /> Татгалзах
                                            </button>
                                        </>
                                    )}
                                    {(selectedReturn.status === 'approved' || selectedReturn.status === 'finance_review') && (
                                        <button
                                            className="btn"
                                            style={{ flex: 1, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', border: 'none' }}
                                            disabled={actionLoading}
                                            onClick={() => handleStatusChange(selectedReturn, 'refunded', financeNote)}
                                        >
                                            <DollarSign size={16} /> Мөнгө буцаах
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
