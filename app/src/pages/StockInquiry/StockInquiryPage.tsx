import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore, useAuthStore } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import { SearchCheck, Clock, CheckCircle, XCircle, RefreshCw, Eye, Package, Phone, DollarSign, AlertTriangle, BellRing } from 'lucide-react';
import type { StockInquiry, StockInquiryStatus } from '../../types';
import { toast } from 'react-hot-toast';
import './StockInquiryPage.css';

const STATUS_LABELS: Record<StockInquiryStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Хүлээж байна', color: '#f59e0b', icon: '⏳' },
    checking: { label: 'Шалгаж байна', color: '#3b82f6', icon: '🔍' },
    no_change: { label: 'Өөрчлөлтгүй', color: '#22c55e', icon: '✅' },
    updated: { label: 'Шинэчлэгдсэн', color: '#8b5cf6', icon: '🔄' },
    inactive: { label: 'Нөөц дууссан', color: '#ef4444', icon: '❌' },
    expired: { label: 'Хугацаа дууссан', color: '#6b7280', icon: '⏰' },
};

/** Beep sound via Web Audio API */
function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Play two quick beeps
        [0, 0.2].forEach(offset => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.12);
        });
    } catch (_) { /* no audio context */ }
}

/** Browser push notification */
function sendBrowserNotification(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        new Notification(title, { body, icon: '🔍', tag: 'stock-inquiry' });
    } catch (_) { /* silent */ }
}

export function StockInquiryPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const { hasPermission } = usePermissions();
    const employee = useBusinessStore(s => s.employee);

    const [inquiries, setInquiries] = useState<StockInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'all'>('active');
    const [selectedInquiry, setSelectedInquiry] = useState<StockInquiry | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit fields for "update" action
    const [newPrice, setNewPrice] = useState('');
    const [newName, setNewName] = useState('');
    const [updateNote, setUpdateNote] = useState('');
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    // Track previous pending count for new-arrival detection
    const prevPendingCountRef = useRef<number | null>(null);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Real-time listener with alert for new pending inquiries
    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, `businesses/${business.id}/stockInquiries`),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as StockInquiry));
            const pendingCount = data.filter(i => i.status === 'pending').length;

            // Detect NEW pending arrivals (not first load)
            if (prevPendingCountRef.current !== null && pendingCount > prevPendingCountRef.current) {
                const newCount = pendingCount - prevPendingCountRef.current;
                playAlertSound();
                sendBrowserNotification(
                    '🔔 Бараа лавлагаа хүсэлт!',
                    `${newCount} шинэ нөөц шалгах хүсэлт ирлээ!`
                );
                toast('🔔 Шинэ нөөц шалгах хүсэлт ирлээ!', {
                    duration: 5000,
                    style: { background: '#f59e0b', color: '#fff', fontWeight: 700 },
                });

                // Auto-select the first pending inquiry for fast response
                const firstPending = data.find(i => i.status === 'pending');
                if (firstPending) {
                    setSelectedInquiry(firstPending);
                    setShowUpdateForm(false);
                }
            }
            prevPendingCountRef.current = pendingCount;

            setInquiries(data);
            setLoading(false);

            // Update selected inquiry if open
            if (selectedInquiry) {
                const updated = data.find(i => i.id === selectedInquiry.id);
                if (updated) setSelectedInquiry(updated);
            }
        });
        return () => unsub();
    }, [business?.id]);

    const handleAction = async (inquiry: StockInquiry, newStatus: StockInquiryStatus, changes?: StockInquiry['changes']) => {
        if (!business?.id) return;
        setActionLoading(true);
        try {
            const ref = doc(db, `businesses/${business.id}/stockInquiries`, inquiry.id);
            const update: Record<string, unknown> = {
                status: newStatus,
                respondedBy: user?.uid || employee?.id || '',
                respondedByName: employee?.name || user?.displayName || 'Оператор',
                respondedAt: Timestamp.now(),
            };
            if (changes) update.changes = changes;
            await updateDoc(ref, update);

            const label = STATUS_LABELS[newStatus].label;
            toast.success(`${label} — амжилттай`);
            setShowUpdateForm(false);
            setNewPrice('');
            setNewName('');
            setUpdateNote('');
        } catch (e) {
            console.error('Failed to update inquiry:', e);
            toast.error('Алдаа гарлаа');
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = filter === 'active'
        ? inquiries.filter(i => ['pending', 'checking'].includes(i.status))
        : inquiries;

    const formatTime = (date: Date | { toDate?: () => Date }) => {
        const d = date instanceof Date ? date : date?.toDate?.() || new Date();
        return d.toLocaleString('mn-MN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="sinq-page">
                <div className="sinq-loading">
                    <SearchCheck size={32} className="sinq-spin" />
                    <p>Ачааллаж байна...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sinq-page">
            {/* Header */}
            <div className="sinq-header">
                <div className="sinq-header-info">
                    <div className="sinq-icon-wrap"><SearchCheck size={22} /></div>
                    <div>
                        <h1>Бараа Лавлагаа</h1>
                        <p>Хэрэглэгчийн нөөц, үнийн лавлагаа хүсэлтүүд</p>
                    </div>
                </div>
                <div className="sinq-stats-row">
                    <div className="sinq-stat pending">
                        <span className="sinq-stat-num">{inquiries.filter(i => i.status === 'pending').length}</span>
                        <span className="sinq-stat-label">Хүлээж байна</span>
                    </div>
                    <div className="sinq-stat checking">
                        <span className="sinq-stat-num">{inquiries.filter(i => i.status === 'checking').length}</span>
                        <span className="sinq-stat-label">Шалгаж байна</span>
                    </div>
                    <div className="sinq-stat done">
                        <span className="sinq-stat-num">{inquiries.filter(i => !['pending', 'checking'].includes(i.status)).length}</span>
                        <span className="sinq-stat-label">Шийдсэн</span>
                    </div>
                </div>
            </div>

            {/* ── Urgent Banner ── */}
            {inquiries.filter(i => i.status === 'pending').length > 0 && (
                <div className="sinq-urgent-banner">
                    <BellRing size={18} className="sinq-urgent-bell" />
                    <span className="sinq-urgent-text">
                        <strong>{inquiries.filter(i => i.status === 'pending').length}</strong> хүсэлт хариу хүлээж байна — хурдан хариулна уу!
                    </span>
                    <button
                        className="sinq-urgent-btn"
                        onClick={() => {
                            const first = inquiries.find(i => i.status === 'pending');
                            if (first) { setSelectedInquiry(first); setShowUpdateForm(false); }
                        }}
                    >
                        Шалгах
                    </button>
                </div>
            )}

            {/* Filter */}
            <div className="sinq-filter-bar">
                <button className={`sinq-filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
                    <Clock size={14} /> Идэвхтэй
                </button>
                <button className={`sinq-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                    Бүгд ({inquiries.length})
                </button>
            </div>

            {/* Content */}
            <div className="sinq-content">
                {/* List */}
                <div className="sinq-list">
                    {filtered.length === 0 ? (
                        <div className="sinq-empty">
                            <SearchCheck size={40} strokeWidth={1} />
                            <p>Лавлагаа хүсэлт байхгүй</p>
                        </div>
                    ) : (
                        filtered.map(inq => {
                            const st = STATUS_LABELS[inq.status];
                            return (
                                <div
                                    key={inq.id}
                                    className={`sinq-card ${selectedInquiry?.id === inq.id ? 'selected' : ''} ${inq.status === 'pending' ? 'urgent' : ''}`}
                                    onClick={() => { setSelectedInquiry(inq); setShowUpdateForm(false); }}
                                >
                                    <div className="sinq-card-top">
                                        <div className="sinq-card-product">
                                            {inq.productImage ? (
                                                <img src={inq.productImage} alt="" className="sinq-card-img" />
                                            ) : (
                                                <div className="sinq-card-img-placeholder"><Package size={16} /></div>
                                            )}
                                            <div>
                                                <div className="sinq-card-name">{inq.productName}</div>
                                                <div className="sinq-card-price">₮{inq.currentPrice.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <span className="sinq-badge" style={{ background: st.color + '18', color: st.color }}>
                                            {st.icon} {st.label}
                                        </span>
                                    </div>
                                    <div className="sinq-card-bottom">
                                        <span><Phone size={12} /> {inq.customerPhone}</span>
                                        <span><Clock size={12} /> {formatTime(inq.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                <div className="sinq-detail">
                    {selectedInquiry ? (
                        <>
                            <div className="sinq-detail-header">
                                <h3>Лавлагаа дэлгэрэнгүй</h3>
                                <span className="sinq-badge" style={{
                                    background: STATUS_LABELS[selectedInquiry.status].color + '18',
                                    color: STATUS_LABELS[selectedInquiry.status].color,
                                }}>
                                    {STATUS_LABELS[selectedInquiry.status].icon} {STATUS_LABELS[selectedInquiry.status].label}
                                </span>
                            </div>

                            {/* Product Info */}
                            <div className="sinq-detail-product">
                                {selectedInquiry.productImage ? (
                                    <img src={selectedInquiry.productImage} alt="" className="sinq-detail-img" />
                                ) : (
                                    <div className="sinq-detail-img-placeholder"><Package size={24} /></div>
                                )}
                                <div>
                                    <div className="sinq-detail-name">{selectedInquiry.productName}</div>
                                    <div className="sinq-detail-price">₮{selectedInquiry.currentPrice.toLocaleString()}</div>
                                    <div className="sinq-detail-phone"><Phone size={14} /> {selectedInquiry.customerPhone}</div>
                                </div>
                            </div>

                            {/* Changes if updated */}
                            {selectedInquiry.status === 'updated' && selectedInquiry.changes && (
                                <div className="sinq-changes-card">
                                    <h4>🔄 Оруулсан өөрчлөлт</h4>
                                    {selectedInquiry.changes.newPrice != null && (
                                        <div className="sinq-change-row">
                                            <span>Шинэ үнэ:</span>
                                            <strong>₮{selectedInquiry.changes.newPrice.toLocaleString()}</strong>
                                        </div>
                                    )}
                                    {selectedInquiry.changes.newName && (
                                        <div className="sinq-change-row">
                                            <span>Шинэ нэр:</span>
                                            <strong>{selectedInquiry.changes.newName}</strong>
                                        </div>
                                    )}
                                    {selectedInquiry.changes.note && (
                                        <div className="sinq-change-row">
                                            <span>Тэмдэглэл:</span>
                                            <strong>{selectedInquiry.changes.note}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Update form */}
                            {showUpdateForm && (
                                <div className="sinq-update-form">
                                    <h4>📝 Мэдээлэл шинэчлэх</h4>
                                    <div className="sinq-form-row">
                                        <label>Шинэ үнэ</label>
                                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder={String(selectedInquiry.currentPrice)} className="sinq-input" />
                                    </div>
                                    <div className="sinq-form-row">
                                        <label>Шинэ нэр (optional)</label>
                                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={selectedInquiry.productName} className="sinq-input" />
                                    </div>
                                    <div className="sinq-form-row">
                                        <label>Тэмдэглэл</label>
                                        <textarea value={updateNote} onChange={e => setUpdateNote(e.target.value)} rows={2} className="sinq-input" placeholder="Жишээ: Үнэ нэмэгдсэн..." />
                                    </div>
                                    <div className="sinq-form-actions">
                                        <button className="sinq-btn cancel" onClick={() => setShowUpdateForm(false)}>Болих</button>
                                        <button
                                            className="sinq-btn update"
                                            disabled={actionLoading || (!newPrice && !newName)}
                                            onClick={() => handleAction(selectedInquiry, 'updated', {
                                                ...(newPrice ? { newPrice: Number(newPrice) } : {}),
                                                ...(newName ? { newName } : {}),
                                                ...(updateNote ? { note: updateNote } : {}),
                                            })}
                                        >
                                            <RefreshCw size={14} /> Шинэчлэх
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {hasPermission('stock-inquiry.respond') && ['pending', 'checking', 'expired'].includes(selectedInquiry.status) && (
                                <div className="sinq-actions">
                                    {selectedInquiry.status === 'expired' && (
                                        <div className="sinq-late-banner">
                                            <AlertTriangle size={15} />
                                            <span>Хугацаа дууссан — хоцорч хариу өгөх боломжтой</span>
                                        </div>
                                    )}
                                    {(selectedInquiry.status === 'pending' || selectedInquiry.status === 'expired') && (
                                        <button
                                            className="sinq-btn check"
                                            disabled={actionLoading}
                                            onClick={() => handleAction(selectedInquiry, 'checking')}
                                        >
                                            <Eye size={16} /> Шалгах
                                        </button>
                                    )}
                                    {selectedInquiry.status === 'checking' && (
                                        <>
                                            <button
                                                className="sinq-btn no-change"
                                                disabled={actionLoading}
                                                onClick={() => handleAction(selectedInquiry, 'no_change')}
                                            >
                                                <CheckCircle size={16} /> Өөрчлөлтгүй
                                            </button>
                                            <button
                                                className="sinq-btn update-btn"
                                                disabled={actionLoading}
                                                onClick={() => setShowUpdateForm(true)}
                                            >
                                                <RefreshCw size={16} /> Шинэчлэх
                                            </button>
                                            <button
                                                className="sinq-btn inactive-btn"
                                                disabled={actionLoading}
                                                onClick={() => handleAction(selectedInquiry, 'inactive')}
                                            >
                                                <XCircle size={16} /> Нөөц дууссан
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Responded info */}
                            {selectedInquiry.respondedBy && (
                                <div className="sinq-responded">
                                    <span>Хариулсан: <strong>{selectedInquiry.respondedByName}</strong></span>
                                    {selectedInquiry.respondedAt && <span>{formatTime(selectedInquiry.respondedAt)}</span>}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="sinq-detail-empty">
                            <SearchCheck size={48} strokeWidth={1} />
                            <p>Лавлагаа сонгоно уу</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
