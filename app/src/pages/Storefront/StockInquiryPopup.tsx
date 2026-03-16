import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, getDocs, Timestamp, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Clock, Package, AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { StockInquiryStatus } from '../../types';

interface InquiryItem {
    productId: string;
    productName: string;
    productImage: string | null;
    currentPrice: number;
}

interface Props {
    businessId: string;
    cartItems: InquiryItem[];
    customerPhone: string;
    timeoutSeconds: number;
    inactiveDays: number;
    onProceed: () => void;   // User proceeds with order
    onCancel: () => void;    // User cancels (stock unavailable)
}

export function StockInquiryPopup({ businessId, cartItems, customerPhone, timeoutSeconds, inactiveDays, onProceed, onCancel }: Props) {
    const [checking, setChecking] = useState(true);
    const [itemsToInquire, setItemsToInquire] = useState<InquiryItem[]>([]);
    const [inquiryId, setInquiryId] = useState<string | null>(null);
    const [status, setStatus] = useState<StockInquiryStatus>('pending');
    const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
    const [changes, setChanges] = useState<{ newPrice?: number; newName?: string; note?: string } | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Step 1: Check which items haven't been ordered in `inactiveDays`
    useEffect(() => {
        async function checkActivity() {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - inactiveDays);

            const needInquiry: InquiryItem[] = [];

            for (const item of cartItems) {
                try {
                    // Query orders for this product within cutoff period
                    const ordersRef = collection(db, `businesses/${businessId}/orders`);
                    const q = query(
                        ordersRef,
                        where('items', '!=', null), // require items field
                        orderBy('createdAt', 'desc'),
                        limit(50)
                    );
                    const snap = await getDocs(q);

                    let recentlyOrdered = false;
                    for (const d of snap.docs) {
                        const data = d.data();
                        const createdAt = data.createdAt?.toDate?.() || new Date(0);
                        if (createdAt < cutoff) break; // Past cutoff, no need to check older

                        const orderItems = data.items || [];
                        if (orderItems.some((oi: { productId: string }) => oi.productId === item.productId)) {
                            recentlyOrdered = true;
                            break;
                        }
                    }

                    if (!recentlyOrdered) {
                        needInquiry.push(item);
                    }
                } catch (e) {
                    console.warn('[StockInquiry] Failed to check order activity:', e);
                    // Skip this item on error — don't block the order
                }
            }

            if (needInquiry.length === 0) {
                // All items are recently ordered, no inquiry needed
                onProceed();
                return;
            }

            setItemsToInquire(needInquiry);
            setChecking(false);

            // Create inquiry doc in Firestore for the first item (primary inquiry)
            try {
                const firstItem = needInquiry[0];
                const docRef = await addDoc(collection(db, `businesses/${businessId}/stockInquiries`), {
                    productId: firstItem.productId,
                    productName: firstItem.productName,
                    productImage: firstItem.productImage || null,
                    currentPrice: firstItem.currentPrice,
                    customerPhone: customerPhone,
                    status: 'pending',
                    timeoutSeconds,
                    createdAt: Timestamp.now(),
                });
                setInquiryId(docRef.id);
            } catch (e) {
                console.error('[StockInquiry] Failed to create inquiry:', e);
                // Don't block checkout on error
                onProceed();
            }
        }

        checkActivity();
    }, []);

    // Step 2: Listen for agent response
    useEffect(() => {
        if (!inquiryId) return;
        const docRef = doc(db, `businesses/${businessId}/stockInquiries`, inquiryId);
        const unsub = onSnapshot(docRef, (snap) => {
            const data = snap.data();
            if (!data) return;
            const newStatus = data.status as StockInquiryStatus;
            setStatus(newStatus);

            if (data.changes) setChanges(data.changes);

            // Auto-handle terminal statuses
            if (newStatus === 'no_change') {
                // No change — proceed after 2s
                setTimeout(onProceed, 2000);
            }
            // 'updated' and 'inactive' require user action (shown via buttons)
        });
        return () => unsub();
    }, [inquiryId, businessId]);

    // Step 3: Countdown timer
    useEffect(() => {
        if (checking || !inquiryId) return;

        timerRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    // Time expired — auto proceed
                    if (timerRef.current) clearInterval(timerRef.current);
                    // Mark as expired
                    if (inquiryId) {
                        const docRef = doc(db, `businesses/${businessId}/stockInquiries`, inquiryId);
                        updateDoc(docRef, { status: 'expired' }).catch(() => {});
                    }
                    setTimeout(onProceed, 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [checking, inquiryId]);

    // Stop timer on terminal status
    useEffect(() => {
        if (['no_change', 'updated', 'inactive', 'expired'].includes(status)) {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [status]);

    // Loading state
    if (checking) {
        return (
            <div className="sinq-popup-overlay">
                <div className="sinq-popup-card">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Loader2 size={32} className="sinq-spin" style={{ color: 'var(--primary)' }} />
                        <p style={{ marginTop: 12, fontWeight: 600, fontSize: '0.9rem' }}>Барааны мэдээлэл шалгаж байна...</p>
                    </div>
                </div>
            </div>
        );
    }

    const progressPercent = Math.round((secondsLeft / timeoutSeconds) * 100);

    return (
        <div className="sinq-popup-overlay">
            <div className="sinq-popup-card">
                {/* Header */}
                <div className="sinq-popup-header">
                    <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                    <h3>Бараа лавлагаа</h3>
                </div>

                <p className="sinq-popup-desc">
                    Доорх бараа сүүлийн {inactiveDays} хоногт захиалга ороогүй тул мэдээлэл өөрчлөгдсөн байж болзошгүй. Лавлагаа илгээгдэж байна.
                </p>

                {/* Products needing inquiry */}
                <div className="sinq-popup-products">
                    {itemsToInquire.map(item => (
                        <div key={item.productId} className="sinq-popup-product">
                            {item.productImage ? (
                                <img src={item.productImage} alt="" className="sinq-popup-pimg" />
                            ) : (
                                <div className="sinq-popup-pimg-ph"><Package size={16} /></div>
                            )}
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.productName}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>₮{item.currentPrice.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status display */}
                <div className="sinq-popup-status">
                    {status === 'pending' && (
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
                            <p style={{ fontWeight: 600, color: '#f59e0b' }}>⏳ Хариу хүлээж байна...</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {secondsLeft} секундын дараа автоматаар үргэлжлүүлнэ
                            </p>
                        </>
                    )}

                    {status === 'checking' && (
                        <>
                            <Loader2 size={28} className="sinq-spin" style={{ color: '#3b82f6' }} />
                            <p style={{ fontWeight: 700, color: '#3b82f6', marginTop: 8 }}>🔍 Шалгаж байна, хүлээнэ үү...</p>
                        </>
                    )}

                    {status === 'no_change' && (
                        <>
                            <CheckCircle size={32} style={{ color: '#22c55e' }} />
                            <p style={{ fontWeight: 700, color: '#22c55e', marginTop: 8 }}>✅ Мэдээлэл өөрчлөгдөөгүй!</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Захиалга үргэлжлүүлж байна...</p>
                        </>
                    )}

                    {status === 'updated' && changes && (
                        <>
                            <RefreshCw size={28} style={{ color: '#8b5cf6' }} />
                            <p style={{ fontWeight: 700, color: '#8b5cf6', marginTop: 8 }}>🔄 Мэдээлэл шинэчлэгдлээ</p>
                            <div className="sinq-popup-changes">
                                {changes.newPrice != null && (
                                    <div className="sinq-popup-change-row">
                                        <span>Шинэ үнэ:</span>
                                        <strong style={{ color: '#8b5cf6' }}>₮{changes.newPrice.toLocaleString()}</strong>
                                    </div>
                                )}
                                {changes.newName && (
                                    <div className="sinq-popup-change-row">
                                        <span>Шинэ нэр:</span>
                                        <strong>{changes.newName}</strong>
                                    </div>
                                )}
                                {changes.note && (
                                    <div className="sinq-popup-change-row">
                                        <span>Тэмдэглэл:</span>
                                        <strong>{changes.note}</strong>
                                    </div>
                                )}
                            </div>
                            <div className="sinq-popup-btns">
                                <button className="sinq-popup-btn proceed" onClick={onProceed}>
                                    <CheckCircle size={16} /> Зөвшөөрч, үргэлжлүүлэх
                                </button>
                                <button className="sinq-popup-btn cancel-btn" onClick={onCancel}>Цуцлах</button>
                            </div>
                        </>
                    )}

                    {status === 'inactive' && (
                        <>
                            <XCircle size={32} style={{ color: '#ef4444' }} />
                            <p style={{ fontWeight: 700, color: '#ef4444', marginTop: 8 }}>❌ Нөөц дууссан байна</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Энэ бараа одоогоор захиалах боломжгүй.</p>
                            <div className="sinq-popup-btns" style={{ marginTop: 16 }}>
                                <button className="sinq-popup-btn cancel-btn" onClick={onCancel} style={{ flex: 1 }}>Буцах</button>
                            </div>
                        </>
                    )}

                    {status === 'expired' && (
                        <>
                            <Clock size={28} style={{ color: '#6b7280' }} />
                            <p style={{ fontWeight: 700, color: '#6b7280', marginTop: 8 }}>Хугацаа дууслаа</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Захиалга автомат үргэлжлүүлж байна...</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
