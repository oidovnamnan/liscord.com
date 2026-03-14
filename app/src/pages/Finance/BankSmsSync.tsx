import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Settings,
    ExternalLink,
    CircleCheck,
    Clock,
    AlertCircle,
    ArrowUpRight,
    TrendingUp,
    Smartphone,
    Loader2,
    Banknote,
    X,
    Link,
    Phone,
    Hash,
    User,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore } from '../../store';
import '../Inventory/InventoryPage.css';
import './BankSmsSync.css';

interface SmsLog {
    id: string;
    body: string;
    sender: string;
    amount: number;
    bank: string;
    note: string;
    time: string;
    status: 'matched' | 'pending' | 'ignored';
    orderId?: string;
    createdAt?: any;
}

interface MatchCandidate {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    refCode: string;
    createdAt?: Date;
}

export function BankSmsSyncPage() {
    const navigate = useNavigate();
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'pending' | 'ignored'>('all');
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pairingKey, setPairingKey] = useState<string | null>(null);

    // Manual match modal state
    const [matchingSms, setMatchingSms] = useState<SmsLog | null>(null);
    const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [matchingOrderId, setMatchingOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (!business?.id) return;
        const loadKey = async () => {
            try {
                const bizRef = doc(db, 'businesses', business.id);
                const snap = await getDoc(bizRef);
                const data = snap.data();
                if (data?.smsBridgeKey) {
                    setPairingKey(data.smsBridgeKey);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load bridge key:', err);
                setLoading(false);
            }
        };
        loadKey();
    }, [business?.id]);

    useEffect(() => {
        if (!pairingKey) return;
        const q = query(
            collection(db, 'sms_inbox'),
            where('pairingKey', '==', pairingKey),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: SmsLog[] = snapshot.docs.map(docSnap => {
                const d = docSnap.data();
                const smsTimestamp = d.timestamp ? new Date(typeof d.timestamp === 'string' ? parseInt(d.timestamp, 10) : d.timestamp) : null;
                const createdAt = smsTimestamp || d.createdAt?.toDate?.() || new Date();
                const now = new Date();
                const isToday = createdAt.toDateString() === now.toDateString();
                const timeStr = isToday
                    ? createdAt.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
                    : createdAt.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                let note = d.utga || '';
                if (!note) {
                    const utgaMatch = d.body?.match(/(?:guilgeenii\s*)?utga[:\s]*([^\n,.]+)/i)
                        || d.body?.match(/(?:гүйлгээний\s*)?утга[:\s]*([^\n,.]+)/i);
                    if (utgaMatch) {
                        note = utgaMatch[1].trim();
                    } else {
                        note = d.body?.substring(0, 50) || '';
                    }
                }
                return {
                    id: docSnap.id,
                    body: d.body || '',
                    sender: d.sender || '',
                    amount: d.amount || 0,
                    bank: d.bank || d.sender || '',
                    note,
                    time: timeStr,
                    status: d.status === 'matched' ? 'matched' : d.status === 'ignored' ? 'ignored' : 'pending',
                    orderId: d.orderId || undefined,
                    createdAt,
                };
            });
            setLogs(items);
            setLoading(false);

            // Auto-match pending SMS with orders by refCode
            if (business?.id) {
                autoMatchPendingSms(items);
            }
        }, (error) => {
            console.error('SMS inbox subscription error:', error);
            setLoading(false);
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairingKey, business?.id]);

    const matchedRef = useRef<Set<string>>(new Set());

    const autoMatchPendingSms = useCallback(async (items: SmsLog[]) => {
        if (!business?.id) return;
        const pending = items.filter(s => s.status === 'pending' && s.amount > 0 && s.note && !matchedRef.current.has(s.id));
        if (pending.length === 0) return;

        // Load all unpaid orders once for matching
        const ordersRef = collection(db, `businesses/${business.id}/orders`);
        const ordersQ = query(ordersRef, where('paymentStatus', '==', 'unpaid'));
        let ordersSnap;
        try {
            ordersSnap = await getDocs(ordersQ);
        } catch (err) {
            console.error('Failed to load orders for auto-match:', err);
            return;
        }
        if (ordersSnap.empty) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unpaidOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

        for (const sms of pending) {
            matchedRef.current.add(sms.id);
            try {
                const smsNote = sms.note.trim().toLowerCase();
                const smsAmount = sms.amount;

                // Find matching order: amount must match exactly + утга must contain refCode or phone
                const matched = unpaidOrders.find(order => {
                    const orderTotal = order.financials?.totalAmount || 0;
                    if (Math.abs(smsAmount - orderTotal) > 1) return false;
                    const refCode = (order.paymentRefCode || '').toLowerCase();
                    const phone = (order.customer?.phone || '').toLowerCase();
                    const hasRefCode = refCode && refCode.length >= 3 && smsNote.includes(refCode);
                    const hasPhone = phone && phone.length >= 8 && smsNote.includes(phone);
                    return hasRefCode || hasPhone;
                });

                if (matched) {
                    const smsRef = doc(db, 'sms_inbox', sms.id);
                    await updateDoc(smsRef, {
                        status: 'matched',
                        orderId: matched.id,
                        matchedAt: new Date(),
                        autoMatched: true,
                    });
                    const orderRef = doc(db, `businesses/${business.id}/orders`, matched.id);
                    await updateDoc(orderRef, {
                        paymentStatus: 'paid',
                        paymentVerifiedAt: new Date(),
                        paymentVerifiedBy: 'auto-match',
                        paymentSmsId: sms.id,
                    });
                    const idx = unpaidOrders.indexOf(matched);
                    if (idx > -1) unpaidOrders.splice(idx, 1);
                    console.log(`Auto-matched SMS ${sms.id} → Order ${matched.id}`);
                }
            } catch (err) {
                console.error('Auto-match error for SMS:', sms.id, err);
            }
        }
    }, [business?.id]);

    // Open manual match modal — load unpaid orders with matching amount
    const openManualMatch = async (sms: SmsLog) => {
        if (!business?.id) return;
        setMatchingSms(sms);
        setLoadingCandidates(true);
        setCandidates([]);

        try {
            const ordersRef = collection(db, `businesses/${business.id}/orders`);
            const ordersQ = query(ordersRef, where('paymentStatus', '==', 'unpaid'));
            const snap = await getDocs(ordersQ);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results: MatchCandidate[] = [];
            snap.docs.forEach(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = d.data() as any;
                if (data.isDeleted || data.status === 'cancelled') return;
                const total = data.financials?.totalAmount || 0;
                // Show orders with matching amount (±1₮ tolerance)
                if (Math.abs(total - sms.amount) > 1) return;
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
                results.push({
                    id: d.id,
                    orderNumber: data.orderNumber || d.id.slice(0, 8),
                    customerName: data.customer?.name || data.customerName || '',
                    customerPhone: data.customer?.phone || data.customerPhone || '',
                    total,
                    refCode: data.paymentRefCode || '',
                    createdAt,
                });
            });

            // Sort by date descending
            results.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
            setCandidates(results);
        } catch (err) {
            console.error('Failed to load candidates:', err);
        } finally {
            setLoadingCandidates(false);
        }
    };

    // Execute manual match
    const handleManualMatch = async (orderId: string) => {
        if (!business?.id || !matchingSms) return;
        setMatchingOrderId(orderId);

        try {
            // Update SMS
            const smsRef = doc(db, 'sms_inbox', matchingSms.id);
            await updateDoc(smsRef, {
                status: 'matched',
                orderId,
                matchedAt: new Date(),
                autoMatched: false,
                manualMatch: true,
            });

            // Update order payment status
            const orderRef = doc(db, `businesses/${business.id}/orders`, orderId);
            await updateDoc(orderRef, {
                paymentStatus: 'paid',
                paymentVerifiedAt: new Date(),
                paymentVerifiedBy: 'manual-match',
                paymentSmsId: matchingSms.id,
            });

            // Close modal
            setMatchingSms(null);
            setCandidates([]);
        } catch (err) {
            console.error('Manual match failed:', err);
        } finally {
            setMatchingOrderId(null);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchSearch = !search ||
            log.note.toLowerCase().includes(search.toLowerCase()) ||
            log.bank.toLowerCase().includes(search.toLowerCase()) ||
            log.amount.toString().includes(search);
        const matchStatus = statusFilter === 'all' || log.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: logs.reduce((s, l) => s + l.amount, 0),
        matched: logs.filter(l => l.status === 'matched').length,
        pending: logs.filter(l => l.status === 'pending').length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'matched': return <span className="badge badge-delivered"><CircleCheck size={12} /> Холбогдсон</span>;
            case 'pending': return <span className="badge badge-preparing"><Clock size={12} /> Хүлээгдэж буй</span>;
            case 'ignored': return <span className="badge badge-soft"><AlertCircle size={12} /> Алгассан</span>;
            default: return null;
        }
    };

    return (
        <div className="inventory-page animate-fade-in">
            <div className="page-hero" style={{ marginBottom: 8 }}>
                <div className="page-hero-left">
                    <div className="page-hero-icon">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2 className="page-hero-title">SMS Банк Орлого</h2>
                        <p className="page-hero-subtitle">Банкны SMS орлогыг хянах, захиалгатай холбох</p>
                    </div>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/app/settings?tab=sms-income-sync')}
                    style={{ gap: 6 }}
                >
                    <Settings size={16} /> Тохиргоо
                </button>
            </div>

            {/* Stats Grid */}
            <div className="inv-stats-grid" style={{ marginBottom: 24 }}>
                <div className="inv-stat-card">
                    <div className="inv-stat-content">
                        <h4>Нийт орлого</h4>
                        <div className="inv-stat-value">{stats.total >= 1000000 ? (stats.total / 1000000).toFixed(1) + 'M₮' : stats.total > 0 ? (stats.total / 1000).toFixed(0) + 'K₮' : '0₮'}</div>
                    </div>
                    <div className="inv-stat-icon icon-green">
                        <TrendingUp size={24} />
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-content">
                        <h4>Холбогдсон</h4>
                        <div className="inv-stat-value">{stats.matched}</div>
                    </div>
                    <div className="inv-stat-icon icon-primary">
                        <CircleCheck size={24} />
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-content">
                        <h4>Хүлээгдэж буй</h4>
                        <div className="inv-stat-value">{stats.pending}</div>
                    </div>
                    <div className="inv-stat-icon icon-orange">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="inv-stat-card">
                    <div className="inv-stat-content">
                        <h4>Нийт гүйлгээ</h4>
                        <div className="inv-stat-value">{logs.length}</div>
                    </div>
                    <div className="inv-stat-icon icon-red">
                        <Banknote size={24} />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="inv-toolbar">
                <div className="inv-search-wrap">
                    <Search size={18} className="inv-search-icon" />
                    <input
                        className="inv-search-input"
                        placeholder="Хайх... (банк, утга, дүн)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    style={{
                        minWidth: 150,
                        height: 46,
                        cursor: 'pointer',
                        padding: '0 40px 0 16px',
                        fontFamily: 'inherit',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        background: `var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center`,
                        border: '1.5px solid var(--border-primary)',
                        borderRadius: 14,
                        appearance: 'none' as const,
                        WebkitAppearance: 'none' as const,
                        outline: 'none',
                    }}
                >
                    <option value="all">Бүгд</option>
                    <option value="matched">Холбогдсон</option>
                    <option value="pending">Хүлээгдэж</option>
                    <option value="ignored">Алгассан</option>
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="sms-empty">
                    <Loader2 size={32} className="spin" />
                    <h4>Ачааллаж байна...</h4>
                </div>
            ) : filteredLogs.length > 0 ? (
                <>
                    {/* Table (desktop) */}
                    <div className="sms-table-wrap" style={{ marginTop: 24 }}>
                        <table className="sms-table">
                            <thead>
                                <tr>
                                    <th>Цаг</th>
                                    <th>Банк</th>
                                    <th>Дүн</th>
                                    <th>Утга</th>
                                    <th>Төлөв</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="sms-cell-time">
                                            <span>{log.time}</span>
                                            <span className="sms-cell-sender">{log.sender}</span>
                                        </td>
                                        <td>
                                            <span className="sms-bank-badge">{log.bank}</span>
                                        </td>
                                        <td className="sms-cell-amount">
                                            <ArrowUpRight size={14} />
                                            +{log.amount.toLocaleString()}₮
                                        </td>
                                        <td className="sms-cell-note">
                                            {log.orderId ? (
                                                <span className="sms-order-link">{log.orderId}</span>
                                            ) : (
                                                <span className="sms-note-text">{log.note}</span>
                                            )}
                                        </td>
                                        <td>{getStatusBadge(log.status)}</td>
                                        <td>
                                            {log.status === 'pending' && (
                                                <button
                                                    className="sms-match-btn"
                                                    onClick={() => openManualMatch(log)}
                                                >
                                                    Холбох
                                                </button>
                                            )}
                                            {log.status === 'matched' && log.orderId && (
                                                <button className="sms-link-btn">
                                                    <ExternalLink size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sms-mobile-cards">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="sms-mobile-card">
                                <div className="sms-mobile-top">
                                    <span className="sms-bank-badge">{log.bank}</span>
                                    {getStatusBadge(log.status)}
                                </div>
                                <div className="sms-mobile-amount">
                                    <ArrowUpRight size={16} />
                                    +{log.amount.toLocaleString()}₮
                                </div>
                                <div className="sms-mobile-meta">
                                    <span>{log.time} · {log.sender}</span>
                                    <span>{log.note}</span>
                                </div>
                                {log.status === 'pending' && (
                                    <button
                                        className="sms-match-btn sms-match-btn-full"
                                        onClick={() => openManualMatch(log)}
                                    >
                                        Захиалгатай холбох
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="sms-empty">
                    <Smartphone size={32} />
                    <h4>Мэдээлэл алга</h4>
                    <p>
                        {search ? 'Хайлтанд тохирох гүйлгээ олдсонгүй.' :
                            !pairingKey ? 'Bridge апп тохиргоо хийгдээгүй байна.' :
                                'Bridge апп холбогдсон боловч SMS ирээгүй байна.'}
                    </p>
                    {!search && (
                        <button
                            className="sms-setup-link"
                            onClick={() => navigate('/app/settings?tab=sms-income-sync')}
                        >
                            <Settings size={16} />
                            Bridge тохируулах
                        </button>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* Manual Match Modal */}
            {/* ═══════════════════════════════════════════ */}
            {matchingSms && (
                <div className="sms-match-modal-backdrop" onClick={() => setMatchingSms(null)}>
                    <div className="sms-match-modal" onClick={e => e.stopPropagation()}>
                        <div className="sms-match-modal-header">
                            <div>
                                <h3><Link size={18} /> Захиалгатай холбох</h3>
                                <p>Дүн таарч буй захиалгуудаас сонгоно уу</p>
                            </div>
                            <button className="sms-match-modal-close" onClick={() => setMatchingSms(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* SMS info card */}
                        <div className="sms-match-sms-info">
                            <div className="sms-match-sms-row">
                                <span className="sms-match-sms-label">Банк</span>
                                <span className="sms-bank-badge">{matchingSms.bank}</span>
                            </div>
                            <div className="sms-match-sms-row">
                                <span className="sms-match-sms-label">Дүн</span>
                                <span className="sms-match-sms-amount">+{matchingSms.amount.toLocaleString()}₮</span>
                            </div>
                            <div className="sms-match-sms-row">
                                <span className="sms-match-sms-label">Утга</span>
                                <span className="sms-match-sms-note">{matchingSms.note}</span>
                            </div>
                        </div>

                        {/* Candidate orders */}
                        <div className="sms-match-candidates">
                            {loadingCandidates ? (
                                <div className="sms-match-loading">
                                    <Loader2 size={24} className="spin" />
                                    <span>Захиалга хайж байна...</span>
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="sms-match-empty">
                                    <AlertCircle size={24} />
                                    <span>Дүн таарсан захиалга олдсонгүй</span>
                                    <span className="sms-match-empty-hint">₮{matchingSms.amount.toLocaleString()} дүнтэй төлбөр хүлээгдэж буй захиалга байхгүй</span>
                                </div>
                            ) : (
                                <>
                                    <div className="sms-match-count">
                                        {candidates.length} захиалга олдлоо (дүн: ₮{matchingSms.amount.toLocaleString()})
                                    </div>
                                    {candidates.map(order => (
                                        <div key={order.id} className="sms-match-candidate">
                                            <div className="sms-match-candidate-info">
                                                <div className="sms-match-candidate-top">
                                                    <span className="sms-match-order-num">
                                                        <Hash size={13} /> {order.orderNumber}
                                                    </span>
                                                    {order.refCode && (
                                                        <span className="sms-match-ref">
                                                            Код: {order.refCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="sms-match-candidate-details">
                                                    {order.customerName && (
                                                        <span><User size={12} /> {order.customerName}</span>
                                                    )}
                                                    {order.customerPhone && (
                                                        <span><Phone size={12} /> {order.customerPhone}</span>
                                                    )}
                                                </div>
                                                <div className="sms-match-candidate-amount">
                                                    ₮{order.total.toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                className="sms-match-select-btn"
                                                onClick={() => handleManualMatch(order.id)}
                                                disabled={matchingOrderId === order.id}
                                            >
                                                {matchingOrderId === order.id ? (
                                                    <Loader2 size={14} className="spin" />
                                                ) : (
                                                    <><Link size={14} /> Холбох</>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
