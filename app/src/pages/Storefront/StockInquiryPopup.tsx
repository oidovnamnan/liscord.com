import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, getDocs, Timestamp, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Package, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { StockInquiryStatus } from '../../types';

interface InquiryItem {
    productId: string;
    productName: string;
    productImage: string | null;
    currentPrice: number;
}

interface ItemInquiryState {
    inquiryId: string | null;
    status: StockInquiryStatus;
    changes?: { newPrice?: number; newName?: string; note?: string };
}

interface Props {
    businessId: string;
    cartItems: InquiryItem[];
    customerPhone: string;
    timeoutSeconds: number;
    inactiveDays: number;
    onProceed: () => void;
    onCancel: () => void;
}

export function StockInquiryPopup({ businessId, cartItems, customerPhone, timeoutSeconds, inactiveDays, onProceed, onCancel }: Props) {
    const [checking, setChecking] = useState(true);
    const [itemsToInquire, setItemsToInquire] = useState<InquiryItem[]>([]);
    // Per-item inquiry state: productId → state
    const [itemStates, setItemStates] = useState<Map<string, ItemInquiryState>>(new Map());
    const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
    const [timerPaused, setTimerPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const proceededRef = useRef(false);
    const unsubsRef = useRef<(() => void)[]>([]);

    // Helper: safe proceed (only once)
    const safeProceed = () => {
        if (proceededRef.current) return;
        proceededRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        onProceed();
    };

    // Step 1: Check which items need inquiry
    useEffect(() => {
        async function checkActivity() {
            const FRESHNESS_DAYS = 30;
            const freshnessCutoff = new Date();
            freshnessCutoff.setDate(freshnessCutoff.getDate() - FRESHNESS_DAYS);
            const staleThreshold = new Date(Date.now() - (timeoutSeconds + 60) * 1000);

            const needInquiry: InquiryItem[] = [];

            for (const item of cartItems) {
                try {
                    const inquiriesRef = collection(db, `businesses/${businessId}/stockInquiries`);
                    const q = query(
                        inquiriesRef,
                        where('productId', '==', item.productId),
                        orderBy('createdAt', 'desc'),
                        limit(1)
                    );
                    const snap = await getDocs(q);

                    if (snap.empty) {
                        needInquiry.push(item);
                        continue;
                    }

                    const lastInquiry = snap.docs[0].data();
                    const lastStatus = lastInquiry.status as StockInquiryStatus;
                    const createdAt = lastInquiry.createdAt?.toDate?.() || new Date(0);

                    if (['pending', 'checking'].includes(lastStatus)) {
                        if (createdAt < staleThreshold) {
                            try {
                                const staleRef = doc(db, `businesses/${businessId}/stockInquiries`, snap.docs[0].id);
                                await updateDoc(staleRef, { status: 'expired' });
                            } catch (_) { /* ignore */ }
                            needInquiry.push(item);
                        }
                        continue;
                    }

                    if (lastStatus === 'expired') {
                        needInquiry.push(item);
                        continue;
                    }

                    // Terminal responses: check freshness
                    const respondedAt = lastInquiry.respondedAt?.toDate?.() || createdAt;
                    if (respondedAt >= freshnessCutoff) continue;

                    // Check confirmed orders
                    try {
                        const ordersRef = collection(db, `businesses/${businessId}/orders`);
                        const oq = query(
                            ordersRef,
                            where('createdAt', '>=', Timestamp.fromDate(freshnessCutoff)),
                            orderBy('createdAt', 'desc'),
                            limit(50)
                        );
                        const orderSnap = await getDocs(oq);
                        const hasConfirmedOrder = orderSnap.docs.some(od => {
                            const o = od.data();
                            if (o.isDeleted) return false;
                            const confirmedStatuses = ['confirmed', 'sourced', 'arrived', 'delivered', 'completed'];
                            if (!confirmedStatuses.includes(o.status)) return false;
                            return o.items?.some((oi: { productId?: string }) => oi.productId === item.productId);
                        });
                        if (hasConfirmedOrder) continue;
                    } catch (orderErr) {
                        console.debug('[StockInquiry] Order check failed:', orderErr);
                    }

                    needInquiry.push(item);
                } catch (e) {
                    console.error('[StockInquiry] Query failed:', e);
                    needInquiry.push(item);
                }
            }

            if (needInquiry.length === 0) {
                onProceed();
                return;
            }

            // Show popup immediately
            setItemsToInquire(needInquiry);
            setChecking(false);

            // Create inquiry docs for ALL items
            const newStates = new Map<string, ItemInquiryState>();
            for (const item of needInquiry) {
                try {
                    const docRef = await addDoc(collection(db, `businesses/${businessId}/stockInquiries`), {
                        productId: item.productId,
                        productName: item.productName,
                        productImage: item.productImage || null,
                        currentPrice: item.currentPrice,
                        customerPhone: customerPhone,
                        status: 'pending',
                        timeoutSeconds,
                        createdAt: Timestamp.now(),
                    });
                    newStates.set(item.productId, { inquiryId: docRef.id, status: 'pending' });
                } catch (e) {
                    console.error('[StockInquiry] Failed to create inquiry doc:', e);
                    newStates.set(item.productId, { inquiryId: null, status: 'pending' });
                }
            }
            setItemStates(newStates);
        }

        checkActivity();
    }, []);

    // Step 2: Listen for agent responses on ALL inquiry docs
    useEffect(() => {
        if (itemStates.size === 0) return;

        // Clean up previous listeners
        unsubsRef.current.forEach(u => u());
        unsubsRef.current = [];

        itemStates.forEach((state, productId) => {
            if (!state.inquiryId) return;
            const docRef = doc(db, `businesses/${businessId}/stockInquiries`, state.inquiryId);
            const unsub = onSnapshot(docRef, (snap) => {
                const data = snap.data();
                if (!data) return;
                const newStatus = data.status as StockInquiryStatus;

                setItemStates(prev => {
                    const next = new Map(prev);
                    next.set(productId, {
                        ...next.get(productId)!,
                        status: newStatus,
                        changes: data.changes || undefined,
                    });
                    return next;
                });
            });
            unsubsRef.current.push(unsub);
        });

        return () => {
            unsubsRef.current.forEach(u => u());
        };
    }, [itemStates.size, businessId]);

    // Step 3: React to status changes — pause timer, auto-proceed
    useEffect(() => {
        if (itemStates.size === 0) return;

        const statuses = Array.from(itemStates.values()).map(s => s.status);

        // If ANY item is 'checking' → pause timer
        if (statuses.includes('checking')) {
            setTimerPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }

        // If ALL items have a terminal response → auto-proceed
        const terminalStatuses: StockInquiryStatus[] = ['no_change', 'updated', 'inactive'];
        const allTerminal = statuses.length > 0 && statuses.every(s => terminalStatuses.includes(s));
        const hasInactive = statuses.includes('inactive');
        const hasUpdated = statuses.includes('updated');

        if (allTerminal && !hasInactive && !hasUpdated) {
            // All no_change → auto-proceed after 1.5s
            setTimeout(safeProceed, 1500);
        }
        // If has 'updated' or 'inactive' → user decides via buttons
    }, [itemStates]);

    // Step 4: Countdown timer
    useEffect(() => {
        if (checking || itemStates.size === 0 || timerPaused) return;

        timerRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    // Save all inquiry IDs to localStorage for late-response notifications
                    try {
                        const pending = JSON.parse(localStorage.getItem('pendingInquiries') || '[]');
                        itemStates.forEach((state) => {
                            if (state.inquiryId) {
                                pending.push({ inquiryId: state.inquiryId, businessId, createdAt: Date.now() });
                            }
                        });
                        localStorage.setItem('pendingInquiries', JSON.stringify(pending));
                    } catch (_) { /* ignore */ }
                    setTimeout(safeProceed, 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [checking, itemStates.size, timerPaused]);

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            unsubsRef.current.forEach(u => u());
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Loading state
    if (checking) {
        return (
            <div className="sinq-popup-overlay">
                <div className="sinq-popup-card">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Loader2 size={32} className="sinq-spin" style={{ color: 'var(--primary)' }} />
                        <p style={{ marginTop: 12, fontWeight: 700, fontSize: '0.95rem' }}>Барааны үлдэгдэл шалгаж байна...</p>
                        <p style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Түр хүлээнэ үү</p>
                    </div>
                </div>
            </div>
        );
    }

    // Derive overall status from all items
    const allStatuses = Array.from(itemStates.values()).map(s => s.status);
    const hasChecking = allStatuses.includes('checking');
    const hasInactive = allStatuses.includes('inactive');
    const hasUpdated = allStatuses.includes('updated');
    const allNoChange = allStatuses.length > 0 && allStatuses.every(s => s === 'no_change');
    const allResolved = allStatuses.length > 0 && allStatuses.every(s => ['no_change', 'updated', 'inactive'].includes(s));

    const progressPercent = Math.round((secondsLeft / timeoutSeconds) * 100);

    // Get items with their current status for per-item display
    const getItemStatus = (productId: string): ItemInquiryState => {
        return itemStates.get(productId) || { inquiryId: null, status: 'pending' };
    };

    const statusIcon = (s: StockInquiryStatus) => {
        switch (s) {
            case 'no_change': return <CheckCircle size={16} style={{ color: '#22c55e' }} />;
            case 'updated': return <RefreshCw size={16} style={{ color: '#8b5cf6' }} />;
            case 'inactive': return <XCircle size={16} style={{ color: '#ef4444' }} />;
            case 'checking': return <Loader2 size={16} className="sinq-spin" style={{ color: '#3b82f6' }} />;
            default: return <Loader2 size={16} className="sinq-spin" style={{ color: '#f59e0b', opacity: 0.5 }} />;
        }
    };

    const statusLabel = (s: StockInquiryStatus) => {
        switch (s) {
            case 'no_change': return 'Өөрчлөлтгүй ✅';
            case 'updated': return 'Шинэчлэгдсэн 🔄';
            case 'inactive': return 'Нөөц дууссан ❌';
            case 'checking': return 'Шалгаж байна...';
            default: return 'Хүлээж байна...';
        }
    };

    return (
        <div className="sinq-popup-overlay">
            <div className="sinq-popup-card">
                {/* Header */}
                <div className="sinq-popup-header">
                    <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                    <h3>Барааны үлдэгдэл лавлагаа</h3>
                </div>

                <p className="sinq-popup-desc">
                    Барааны үлдэгдэл болон мэдээллийг лавлаж байна, түр хүлээнэ үү.
                </p>

                {/* Products with per-item status */}
                <div className="sinq-popup-products">
                    {itemsToInquire.map(item => {
                        const is = getItemStatus(item.productId);
                        return (
                            <div key={item.productId} className="sinq-popup-product" style={{
                                borderLeft: is.status === 'no_change' ? '3px solid #22c55e'
                                    : is.status === 'updated' ? '3px solid #8b5cf6'
                                    : is.status === 'inactive' ? '3px solid #ef4444'
                                    : is.status === 'checking' ? '3px solid #3b82f6'
                                    : '3px solid transparent',
                                transition: 'border-color 0.3s ease',
                            }}>
                                {item.productImage ? (
                                    <img src={item.productImage} alt="" className="sinq-popup-pimg" />
                                ) : (
                                    <div className="sinq-popup-pimg-ph"><Package size={16} /></div>
                                )}
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: '0.82rem',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>{item.productName}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        {is.status === 'updated' && is.changes?.newPrice != null
                                            ? <><s style={{ color: '#999', fontWeight: 400 }}>₮{item.currentPrice.toLocaleString()}</s> → <span style={{ color: '#8b5cf6' }}>₮{is.changes.newPrice.toLocaleString()}</span></>
                                            : `₮${item.currentPrice.toLocaleString()}`
                                        }
                                    </div>
                                    {is.changes?.note && (
                                        <div style={{ fontSize: '0.7rem', color: '#6b7280', fontStyle: 'italic', marginTop: 1 }}>
                                            {is.changes.note}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                    {statusIcon(is.status)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Status area */}
                <div className="sinq-popup-status">
                    {/* Timer — pending/running */}
                    {!allResolved && !hasChecking && (
                        <>
                            <div className="sinq-popup-timer">
                                <svg width="56" height="56" viewBox="0 0 56 56">
                                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                    <circle cx="28" cy="28" r="24" fill="none" stroke="#f59e0b" strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 24}`}
                                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercent / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 28 28)"
                                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                    <text x="28" y="33" textAnchor="middle" fontSize="14" fontWeight="900" fill="var(--text-primary)">{secondsLeft}</text>
                                </svg>
                            </div>
                            <p style={{ fontWeight: 700, color: '#f59e0b' }}>⏳ Барааны үлдэгдэл лавлаж байна...</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {secondsLeft} секундын дараа автоматаар үргэлжлүүлнэ
                            </p>
                            <button
                                className="sinq-popup-btn cancel-btn"
                                style={{ marginTop: 16 }}
                                onClick={async () => {
                                    // Mark inquiries as user_left in Firestore
                                    for (const [, state] of itemStates) {
                                        if (state.inquiryId && ['pending', 'checking'].includes(state.status)) {
                                            try {
                                                await updateDoc(doc(db, `businesses/${businessId}/stockInquiries`, state.inquiryId), {
                                                    customerLeft: true,
                                                    customerLeftAt: Timestamp.now(),
                                                });
                                            } catch (_) { /* ignore */ }
                                        }
                                    }
                                    onCancel();
                                }}
                            >
                                Болих
                            </button>
                        </>
                    )}

                    {/* Checking — timer paused */}
                    {hasChecking && !allResolved && (
                        <>
                            <Loader2 size={28} className="sinq-spin" style={{ color: '#3b82f6' }} />
                            <p style={{ fontWeight: 700, color: '#3b82f6', marginTop: 8 }}>🔍 Шалгаж байна, түр хүлээнэ үү...</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                Агент барааг шалгаж байна
                            </p>
                            <button
                                className="sinq-popup-btn cancel-btn"
                                style={{ marginTop: 16 }}
                                onClick={async () => {
                                    for (const [, state] of itemStates) {
                                        if (state.inquiryId && ['pending', 'checking'].includes(state.status)) {
                                            try {
                                                await updateDoc(doc(db, `businesses/${businessId}/stockInquiries`, state.inquiryId), {
                                                    customerLeft: true,
                                                    customerLeftAt: Timestamp.now(),
                                                });
                                            } catch (_) { /* ignore */ }
                                        }
                                    }
                                    onCancel();
                                }}
                            >
                                Болих
                            </button>
                        </>
                    )}

                    {/* All resolved — show summary */}
                    {allNoChange && (
                        <>
                            <CheckCircle size={32} style={{ color: '#22c55e' }} />
                            <p style={{ fontWeight: 700, color: '#22c55e', marginTop: 8 }}>✅ Бүх бараа шалгагдлаа — өөрчлөлтгүй!</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Захиалга үргэлжлүүлж байна...</p>
                        </>
                    )}

                    {allResolved && !allNoChange && (
                        <>
                            <div style={{ marginBottom: 8 }}>
                                {hasInactive
                                    ? <XCircle size={28} style={{ color: '#ef4444' }} />
                                    : <RefreshCw size={28} style={{ color: '#8b5cf6' }} />
                                }
                            </div>
                            <p style={{ fontWeight: 700, color: hasInactive ? '#ef4444' : '#8b5cf6', marginTop: 4 }}>
                                {hasInactive ? '⚠️ Зарим бараа нөөцгүй байна' : '🔄 Мэдээлэл шинэчлэгдлээ'}
                            </p>
                            <div className="sinq-popup-btns" style={{ marginTop: 16 }}>
                                {!allStatuses.every(s => s === 'inactive') && (
                                    <button className="sinq-popup-btn proceed" onClick={safeProceed}>
                                        <CheckCircle size={16} /> {hasInactive ? 'Нөөцтэй бараагаа үргэлжлүүлэх' : 'Зөвшөөрч, үргэлжлүүлэх'}
                                    </button>
                                )}
                                <button className="sinq-popup-btn cancel-btn" onClick={onCancel}>
                                    {allStatuses.every(s => s === 'inactive') ? 'Буцах' : 'Цуцлах'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
