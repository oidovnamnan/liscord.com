import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore, useAuthStore } from '../../store';
import { Undo2, Clock, CheckCircle, XCircle, DollarSign, Search, X, Eye, AlertTriangle, CreditCard, Users, FileText, Package } from 'lucide-react';
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
    cancellation: { label: 'Цуцлалт', emoji: '🚫' },
    source_return: { label: 'Сорс буцаалт', emoji: '📦' },
    late_delivery: { label: 'Удааширсан', emoji: '⏱️' },
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
                try {
                    const orderSnap = await getDocs(query(collection(db, `businesses/${business.id}/orders`), where('__name__', '==', returnReq.orderId)));
                    if (!orderSnap.empty) {
                        const orderData = orderSnap.docs[0].data() as Order;
                        const newPaidAmount = Math.max(0, (orderData.financials?.paidAmount || 0) - returnReq.refundAmount);
                        const newBalanceDue = (orderData.financials?.totalAmount || 0) - newPaidAmount;
                        const isFullRefund = returnReq.refundAmount >= (orderData.financials?.totalAmount || 0);
                        const orderUpdateData: Record<string, unknown> = {
                            'financials.paidAmount': newPaidAmount,
                            'financials.balanceDue': newBalanceDue,
                            returnStatus: isFullRefund ? 'full' : 'partial',
                            returnIds: [...(orderData.returnIds || []), returnReq.id],
                        };
                        // Full refund → order status becomes 'returned'
                        if (isFullRefund) {
                            orderUpdateData.status = 'returned';
                        }
                        await updateDoc(doc(db, `businesses/${business.id}/orders`, returnReq.orderId), orderUpdateData);
                    }
                } catch (e) {
                    console.error('Failed to update order financials:', e);
                }
            }
            if (newStatus === 'rejected') {
                update.financeNote = note || '';
            }
            await updateDoc(ref, update);
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
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100, padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Gradient Hero ── */}
            <div className="rtn-hero">
                <div className="rtn-hero-top">
                    <div className="rtn-hero-left">
                        <div className="rtn-hero-icon">
                            <Undo2 size={24} />
                        </div>
                        <div>
                            <h3 className="rtn-hero-title">Буцаалт & Refund</h3>
                            <div className="rtn-hero-desc">Захиалгын буцаалт удирдах, санхүүгийн тооцоо</div>
                        </div>
                    </div>
                </div>

                <div className="rtn-hero-stats">
                    <div className={`rtn-hero-stat ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}>
                        <div className="rtn-hero-stat-value">{stats.pending}</div>
                        <div className="rtn-hero-stat-label">Хүлээгдэж буй</div>
                    </div>
                    <div className={`rtn-hero-stat ${filterStatus === 'finance_review' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'finance_review' ? 'all' : 'finance_review')}>
                        <div className="rtn-hero-stat-value">{stats.financeReview}</div>
                        <div className="rtn-hero-stat-label">Санхүүд шилжсэн</div>
                    </div>
                    <div className={`rtn-hero-stat ${filterStatus === 'refunded' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'refunded' ? 'all' : 'refunded')}>
                        <div className="rtn-hero-stat-value">{stats.refunded}</div>
                        <div className="rtn-hero-stat-label">Буцаалт хийгдсэн</div>
                    </div>
                    <div className="rtn-hero-stat">
                        <div className="rtn-hero-stat-value">{stats.totalRefunded.toLocaleString()}₮</div>
                        <div className="rtn-hero-stat-label">Нийт буцаасан</div>
                    </div>
                </div>
            </div>

            {/* ── Main Content Card ── */}
            <div className="rtn-card">
                {/* Toolbar */}
                <div className="rtn-toolbar">
                    <div className="rtn-tab-group">
                        {[
                            { key: 'all', label: 'Бүгд' },
                            { key: 'pending', label: 'Хүлээгдэж буй' },
                            { key: 'operator_review', label: 'Хянаж буй' },
                            { key: 'finance_review', label: 'Санхүү' },
                            { key: 'refunded', label: 'Буцаасан' },
                            { key: 'rejected', label: 'Татгалзсан' },
                        ].map(tab => {
                            const count = tab.key === 'all' ? returns.length : returns.filter(r => r.status === tab.key).length;
                            return (
                                <button
                                    key={tab.key}
                                    className={`rtn-tab ${filterStatus === tab.key ? 'active' : ''}`}
                                    onClick={() => setFilterStatus(tab.key)}
                                >
                                    {tab.label}
                                    {count > 0 && <span className="count">{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="rtn-search-wrap">
                        <Search size={16} />
                        <input
                            placeholder="Хайх..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="rtn-empty" style={{ marginTop: 16 }}>
                        <div className="rtn-empty-icon">📦</div>
                        <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Буцаалт байхгүй</h3>
                        <p style={{ fontSize: '0.85rem' }}>Захиалгаас буцаалт хийхэд энд харагдана</p>
                    </div>
                ) : (
                    <div className="rtn-list">
                        {filtered.map(r => (
                            <div key={r.id} className="rtn-row" onClick={() => setSelectedReturn(r)}>
                                <div className="rtn-row-order">
                                    #{r.orderNumber}
                                </div>
                                <div>
                                    <div className="rtn-row-customer-name">{r.customer.name}</div>
                                    <div className="rtn-row-customer-phone">{r.customer.phone}</div>
                                </div>
                                <div>
                                    <span className={`rtn-type-badge ${r.type}`}>
                                        {TYPE_LABELS[r.type]?.emoji} {TYPE_LABELS[r.type]?.label}
                                    </span>
                                </div>
                                <div className="rtn-row-amount">
                                    {r.refundAmount.toLocaleString()}₮
                                </div>
                                <div>
                                    <span className={`rtn-status ${r.status}`}>
                                        {STATUS_LABELS[r.status]}
                                    </span>
                                </div>
                                <div className="rtn-row-date">
                                    {toDate(r.createdAt).toLocaleDateString('mn-MN')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Detail Panel ── */}
            {selectedReturn && (
                <div className="rtn-overlay" onClick={() => setSelectedReturn(null)}>
                    <div className="rtn-detail-panel" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="rtn-detail-header">
                            <div>
                                <h2 className="rtn-detail-title">
                                    Буцаалт #{selectedReturn.orderNumber}
                                </h2>
                                <span className={`rtn-status ${selectedReturn.status}`} style={{ marginTop: 6, display: 'inline-flex' }}>
                                    {STATUS_LABELS[selectedReturn.status]}
                                </span>
                            </div>
                            <button className="rtn-detail-close" onClick={() => setSelectedReturn(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="rtn-detail-body">
                            {/* Customer */}
                            <div className="rtn-section">
                                <div className="rtn-section-title"><Users size={14} /> Захиалагч</div>
                                <div className="rtn-info-row">
                                    <span className="rtn-info-label">Нэр:</span>
                                    <span className="rtn-info-value">{selectedReturn.customer.name}</span>
                                </div>
                                <div className="rtn-info-row">
                                    <span className="rtn-info-label">Утас:</span>
                                    <span className="rtn-info-value">{selectedReturn.customer.phone}</span>
                                </div>
                                {selectedReturn.refundAccount && (
                                    <>
                                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
                                        <div className="rtn-section-title" style={{ marginTop: 0 }}><CreditCard size={14} /> Буцаалтын данс</div>
                                        <div className="rtn-info-row">
                                            <span className="rtn-info-label">Банк:</span>
                                            <span className="rtn-info-value">{selectedReturn.refundAccount.bankName}</span>
                                        </div>
                                        <div className="rtn-info-row">
                                            <span className="rtn-info-label">Данс:</span>
                                            <span className="rtn-info-value mono">{selectedReturn.refundAccount.accountNumber}</span>
                                        </div>
                                        <div className="rtn-info-row">
                                            <span className="rtn-info-label">Нэр:</span>
                                            <span className="rtn-info-value">{selectedReturn.refundAccount.accountHolder}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Type & Reason */}
                            <div className="rtn-section">
                                <div className="rtn-section-title"><FileText size={14} /> Буцаалтын мэдээлэл</div>
                                <div className="rtn-info-row">
                                    <span className="rtn-info-label">Төрөл:</span>
                                    <span className={`rtn-type-badge ${selectedReturn.type}`}>
                                        {TYPE_LABELS[selectedReturn.type]?.emoji} {TYPE_LABELS[selectedReturn.type]?.label}
                                    </span>
                                </div>
                                <div className="rtn-info-row">
                                    <span className="rtn-info-label">Шалтгаан:</span>
                                    <span className="rtn-info-value">{selectedReturn.reason}</span>
                                </div>
                                {selectedReturn.reasonNote && (
                                    <div style={{ background: 'var(--surface-1, #fff)', padding: '10px 12px', borderRadius: 10, fontSize: '0.82rem', marginTop: 8, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                        "{selectedReturn.reasonNote}"
                                    </div>
                                )}
                            </div>

                            {/* Items */}
                            <div className="rtn-section">
                                <div className="rtn-section-title"><Package size={14} /> Буцаах бараа</div>
                                {selectedReturn.items.map((item, i) => (
                                    <div key={i} className="rtn-item-row">
                                        <div className="rtn-item-img">
                                            {item.image ?
                                                <img src={item.image} alt={item.name} /> :
                                                <div className="rtn-item-img-empty">📦</div>
                                            }
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {item.quantity}ш × {item.unitPrice.toLocaleString()}₮
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            {item.proportionalRefund.toLocaleString()}₮
                                        </div>
                                    </div>
                                ))}
                                {selectedReturn.includeDeliveryFee && selectedReturn.deliveryFeeRefund > 0 && (
                                    <div className="rtn-info-row" style={{ paddingTop: 10, borderTop: '1px dashed var(--border-color)', marginTop: 6, fontSize: '0.82rem' }}>
                                        <span className="rtn-info-label">Хүргэлтийн зардал буцаалт:</span>
                                        <span className="rtn-info-value">{selectedReturn.deliveryFeeRefund.toLocaleString()}₮</span>
                                    </div>
                                )}
                                <div className="rtn-total-row">
                                    <span className="rtn-total-label">Нийт буцаах дүн:</span>
                                    <span className="rtn-total-value">{selectedReturn.refundAmount.toLocaleString()}₮</span>
                                </div>
                            </div>

                            {/* Evidence */}
                            {selectedReturn.evidenceUrls && selectedReturn.evidenceUrls.length > 0 && (
                                <div className="rtn-section">
                                    <div className="rtn-section-title">📸 Баталгаажуулалт</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {selectedReturn.evidenceUrls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                <img src={url} alt={`evidence-${i}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-color)' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status History */}
                            {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                                <div className="rtn-section">
                                    <div className="rtn-section-title"><Clock size={14} /> Түүх</div>
                                    {selectedReturn.statusHistory.map((h, i) => (
                                        <div key={i} className="rtn-history-item">
                                            <div className="rtn-history-date">
                                                {toDate(h.at).toLocaleString('mn-MN')}
                                            </div>
                                            <div>
                                                <span className={`rtn-status ${h.status}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                                    {STATUS_LABELS[h.status as ReturnStatus] || h.status}
                                                </span>
                                                <span style={{ marginLeft: 6, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>— {h.byName}</span>
                                                {h.note && <div style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: '0.75rem' }}>{h.note}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Finance note display */}
                            {selectedReturn.financeNote && selectedReturn.status === 'refunded' && (
                                <div className="rtn-finance-note">
                                    <div className="rtn-section-title">💰 Санхүүгийн тайлбар</div>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{selectedReturn.financeNote}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {selectedReturn.status !== 'refunded' && selectedReturn.status !== 'rejected' && (
                            <div className="rtn-actions">
                                <textarea
                                    placeholder={selectedReturn.status === 'finance_review' ? 'Санхүүгийн тайлбар бичнэ үү...' : 'Тайлбар (заавал биш)...'}
                                    value={selectedReturn.status === 'finance_review' ? financeNote : actionNote}
                                    onChange={e => selectedReturn.status === 'finance_review' ? setFinanceNote(e.target.value) : setActionNote(e.target.value)}
                                    rows={2}
                                />
                                <div className="rtn-action-row">
                                    {selectedReturn.status === 'pending' && (
                                        <button
                                            className="rtn-btn rtn-btn-review"
                                            disabled={actionLoading}
                                            onClick={() => handleStatusChange(selectedReturn, 'operator_review', actionNote)}
                                        >
                                            <Eye size={16} /> Хянах
                                        </button>
                                    )}
                                    {selectedReturn.status === 'operator_review' && (
                                        <>
                                            <button
                                                className="rtn-btn rtn-btn-approve"
                                                disabled={actionLoading}
                                                onClick={() => handleStatusChange(selectedReturn, 'finance_review', actionNote)}
                                            >
                                                <CheckCircle size={16} /> Зөвшөөрөх
                                            </button>
                                            <button
                                                className="rtn-btn rtn-btn-reject"
                                                disabled={actionLoading}
                                                onClick={() => handleStatusChange(selectedReturn, 'rejected', actionNote)}
                                            >
                                                <XCircle size={16} /> Татгалзах
                                            </button>
                                        </>
                                    )}
                                    {(selectedReturn.status === 'approved' || selectedReturn.status === 'finance_review') && (
                                        selectedReturn.refundAccount?.bankName && selectedReturn.refundAccount?.accountNumber ? (
                                            <button
                                                className="rtn-btn rtn-btn-refund"
                                                disabled={actionLoading}
                                                onClick={() => handleStatusChange(selectedReturn, 'refunded', financeNote)}
                                            >
                                                <DollarSign size={16} /> Мөнгө буцаах
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: 8 }}>
                                                ⚠️ Буцаах данс тодорхойгүй байна. Буцаалт үүсгэхдээ данс бөглөх шаардлагатай.
                                            </div>
                                        )
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
