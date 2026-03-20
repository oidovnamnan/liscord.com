import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBusinessStore, useAuthStore } from '../../store';
import { MessageSquare, Clock, CheckCircle, Send, ArrowRight, Loader2, BellRing, Phone, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './OrderInquiryPage.css';

type InquiryStatus = 'pending' | 'reviewing' | 'forwarded' | 'answered';

interface OrderInquiry {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    question: string;
    source: 'storefront' | 'phone' | 'messenger';
    messengerPsid?: string;
    status: InquiryStatus;
    assignedTo?: string;
    assignedToName?: string;
    operatorNote?: string;
    forwardedToSourcing?: boolean;
    sourcingResponse?: string;
    sourcingRespondedBy?: string;
    sourcingRespondedAt?: Date;
    answer?: string;
    answeredBy?: string;
    answeredAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Хүлээж байна', color: '#f59e0b', icon: '⏳' },
    reviewing: { label: 'Шалгаж байна', color: '#3b82f6', icon: '🔍' },
    forwarded: { label: 'Сорс руу', color: '#8b5cf6', icon: '🔀' },
    answered: { label: 'Хариулсан', color: '#22c55e', icon: '✅' },
};

const SOURCE_LABELS: Record<string, string> = {
    storefront: '🌐 Storefront',
    phone: '📞 Утас',
    messenger: '💬 Messenger',
};

/** Beep sound */
function playAlertSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [0, 0.2].forEach(offset => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 660; osc.type = 'sine'; gain.gain.value = 0.25;
            osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.12);
        });
    } catch (_) { /* no audio */ }
}

function sendNotification(title: string, body: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body, icon: '📩', tag: 'order-inquiry' }); } catch (_) {}
}

export function OrderInquiryPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const employee = useBusinessStore(s => s.employee);

    const [inquiries, setInquiries] = useState<OrderInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'all'>('active');
    const [selected, setSelected] = useState<OrderInquiry | null>(null);

    // Answer form
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [answerText, setAnswerText] = useState('');
    const [saving, setSaving] = useState(false);

    // New inquiry detection
    const prevPendingRef = useRef<number | null>(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, `businesses/${business.id}/orderInquiries`),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = d.data() as any;
                return {
                    ...raw,
                    id: d.id,
                    createdAt: raw.createdAt?.toDate?.() || new Date(),
                    updatedAt: raw.updatedAt?.toDate?.() || undefined,
                    sourcingRespondedAt: raw.sourcingRespondedAt?.toDate?.() || undefined,
                    answeredAt: raw.answeredAt?.toDate?.() || undefined,
                } as OrderInquiry;
            });

            const pendingCount = data.filter(i => i.status === 'pending').length;
            if (prevPendingRef.current !== null && pendingCount > prevPendingRef.current) {
                playAlertSound();
                sendNotification('📩 Захиалга лавлагаа!', 'Шинэ лавлагаа хүсэлт ирлээ!');
                toast('📩 Шинэ захиалга лавлагаа ирлээ!', {
                    duration: 5000,
                    style: { background: '#6366f1', color: '#fff', fontWeight: 700 },
                });
                const first = data.find(i => i.status === 'pending');
                if (first) { setSelected(first); setShowAnswerForm(false); }
            }
            prevPendingRef.current = pendingCount;

            setInquiries(data);
            setLoading(false);

            if (selected) {
                const updated = data.find(i => i.id === selected.id);
                if (updated) setSelected(updated);
            }
        });
        return () => unsub();
    }, [business?.id]);

    const handleStatus = async (inquiry: OrderInquiry, newStatus: InquiryStatus) => {
        if (!business?.id) return;
        setSaving(true);
        try {
            const ref = doc(db, `businesses/${business.id}/orderInquiries`, inquiry.id);
            const update: Record<string, unknown> = {
                status: newStatus,
                updatedAt: Timestamp.now(),
            };
            if (newStatus === 'reviewing') {
                update.assignedTo = user?.uid || employee?.id || '';
                update.assignedToName = employee?.name || user?.displayName || 'Оператор';
            }
            if (newStatus === 'forwarded') {
                update.forwardedToSourcing = true;
            }
            await updateDoc(ref, update);
            toast.success(STATUS_CONFIG[newStatus].label);
        } catch (e) {
            console.error('Failed to update inquiry:', e);
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleAnswer = async () => {
        if (!business?.id || !selected || !answerText.trim()) return;
        setSaving(true);
        try {
            const ref = doc(db, `businesses/${business.id}/orderInquiries`, selected.id);
            await updateDoc(ref, {
                status: 'answered',
                answer: answerText.trim(),
                answeredBy: employee?.name || user?.displayName || 'Оператор',
                answeredAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            toast.success('Хариу илгээгдлээ ✅');
            setAnswerText('');
            setShowAnswerForm(false);
        } catch (e) {
            console.error('Failed to answer:', e);
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const filtered = filter === 'active'
        ? inquiries.filter(i => ['pending', 'reviewing', 'forwarded'].includes(i.status))
        : inquiries;

    const stats = {
        pending: inquiries.filter(i => i.status === 'pending').length,
        reviewing: inquiries.filter(i => i.status === 'reviewing').length,
        forwarded: inquiries.filter(i => i.status === 'forwarded').length,
        answered: inquiries.filter(i => i.status === 'answered').length,
    };

    const formatTime = (d: Date) => {
        return d.toLocaleString('mn-MN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="oinq-page">
                <div className="oinq-loading">
                    <MessageSquare size={32} className="oinq-spin" />
                    <p>Ачааллаж байна...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="oinq-page">
            {/* Hero */}
            <div className="oinq-hero">
                <div className="oinq-hero-top">
                    <div className="oinq-hero-left">
                        <div className="oinq-hero-icon"><MessageSquare size={22} /></div>
                        <div>
                            <h2>Захиалга Лавлагаа</h2>
                            <div className="oinq-hero-desc">Захиалагчдын асуулга, хариу</div>
                        </div>
                    </div>
                </div>
                <div className="oinq-hero-stats">
                    <div className="oinq-hero-stat" onClick={() => setFilter('active')}>
                        <div className="oinq-hero-stat-value">{stats.pending}</div>
                        <div className="oinq-hero-stat-label">Хүлээж байна</div>
                    </div>
                    <div className="oinq-hero-stat" onClick={() => setFilter('active')}>
                        <div className="oinq-hero-stat-value">{stats.reviewing}</div>
                        <div className="oinq-hero-stat-label">Шалгаж байна</div>
                    </div>
                    <div className="oinq-hero-stat" onClick={() => setFilter('active')}>
                        <div className="oinq-hero-stat-value">{stats.forwarded}</div>
                        <div className="oinq-hero-stat-label">Сорс руу</div>
                    </div>
                    <div className="oinq-hero-stat" onClick={() => setFilter('all')}>
                        <div className="oinq-hero-stat-value">{stats.answered}</div>
                        <div className="oinq-hero-stat-label">Хариулсан</div>
                    </div>
                </div>
            </div>

            {/* Urgent banner */}
            {stats.pending > 0 && (
                <div className="oinq-urgent-banner">
                    <BellRing size={18} />
                    <span className="oinq-urgent-text">
                        <strong>{stats.pending}</strong> лавлагаа хариу хүлээж байна!
                    </span>
                    <button className="oinq-urgent-btn" onClick={() => {
                        const first = inquiries.find(i => i.status === 'pending');
                        if (first) { setSelected(first); setShowAnswerForm(false); }
                    }}>Шалгах</button>
                </div>
            )}

            {/* Card */}
            <div className="oinq-card">
                {/* Filter */}
                <div className="oinq-filter-bar">
                    <button className={`oinq-filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
                        <Clock size={14} /> Идэвхтэй ({stats.pending + stats.reviewing + stats.forwarded})
                    </button>
                    <button className={`oinq-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        Бүгд ({inquiries.length})
                    </button>
                </div>

                <div className="oinq-content">
                    {/* List */}
                    <div className="oinq-list">
                        {filtered.length === 0 ? (
                            <div className="oinq-empty">
                                <MessageSquare size={40} strokeWidth={1} />
                                <p>Лавлагаа хүсэлт байхгүй</p>
                            </div>
                        ) : (
                            filtered.map(inq => {
                                const st = STATUS_CONFIG[inq.status];
                                return (
                                    <div
                                        key={inq.id}
                                        className={`oinq-list-item ${selected?.id === inq.id ? 'selected' : ''} ${inq.status === 'pending' ? 'urgent' : ''}`}
                                        onClick={() => { setSelected(inq); setShowAnswerForm(false); setAnswerText(''); }}
                                    >
                                        <div className="oinq-item-top">
                                            <span className="oinq-item-order">#{inq.orderNumber}</span>
                                            <span className="oinq-item-badge" style={{ background: st.color + '18', color: st.color }}>
                                                {st.icon} {st.label}
                                            </span>
                                        </div>
                                        <div className="oinq-item-question">{inq.question}</div>
                                        <div className="oinq-item-meta">
                                            <span><User size={11} /> {inq.customerName}</span>
                                            <span><Phone size={11} /> {inq.customerPhone}</span>
                                            <span><Clock size={11} /> {formatTime(inq.createdAt)}</span>
                                            <span>{SOURCE_LABELS[inq.source] || inq.source}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Detail */}
                    <div className="oinq-detail">
                        {selected ? (
                            <>
                                <div className="oinq-detail-header">
                                    <div>
                                        <h3>#{selected.orderNumber} — {selected.customerName}</h3>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {formatTime(selected.createdAt)} · {SOURCE_LABELS[selected.source]}
                                        </span>
                                    </div>
                                    <span className="oinq-item-badge" style={{
                                        background: STATUS_CONFIG[selected.status].color + '18',
                                        color: STATUS_CONFIG[selected.status].color,
                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                                    }}>
                                        {STATUS_CONFIG[selected.status].icon} {STATUS_CONFIG[selected.status].label}
                                    </span>
                                </div>

                                {/* Order info */}
                                <div className="oinq-order-info">
                                    <div className="oinq-order-row">
                                        <span className="oinq-order-label">Захиалгын дугаар</span>
                                        <span className="oinq-order-value">#{selected.orderNumber}</span>
                                    </div>
                                    <div className="oinq-order-row">
                                        <span className="oinq-order-label">Харилцагч</span>
                                        <span className="oinq-order-value">{selected.customerName}</span>
                                    </div>
                                    <div className="oinq-order-row">
                                        <span className="oinq-order-label">Утас</span>
                                        <span className="oinq-order-value">{selected.customerPhone}</span>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="oinq-question-card">
                                    <h4>❓ Асуулга</h4>
                                    <div className="oinq-question-text">{selected.question}</div>
                                </div>

                                {/* Sourcing response (if forwarded and answered) */}
                                {selected.sourcingResponse && (
                                    <div className="oinq-sourcing-card">
                                        <h4>🔀 Сорс агентын хариу</h4>
                                        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
                                            {selected.sourcingResponse}
                                        </div>
                                        {selected.sourcingRespondedBy && (
                                            <div style={{ fontSize: '0.74rem', color: '#7c3aed', marginTop: 6 }}>
                                                — {selected.sourcingRespondedBy} {selected.sourcingRespondedAt && `· ${formatTime(selected.sourcingRespondedAt)}`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Final answer */}
                                {selected.answer && (
                                    <div className="oinq-response-card">
                                        <h4>✅ Хариу</h4>
                                        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.5 }}>
                                            {selected.answer}
                                        </div>
                                        {selected.answeredBy && (
                                            <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: 6 }}>
                                                — {selected.answeredBy} {selected.answeredAt && `· ${formatTime(selected.answeredAt)}`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Answer form */}
                                {showAnswerForm && (
                                    <div className="oinq-answer-form">
                                        <h4>📝 Хариу бичих</h4>
                                        <textarea
                                            className="oinq-answer-textarea"
                                            placeholder="Хэрэглэгчид илгээх хариу..."
                                            value={answerText}
                                            onChange={e => setAnswerText(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="oinq-answer-actions">
                                            <button className="oinq-btn" style={{ background: 'var(--surface-2)' }} onClick={() => setShowAnswerForm(false)}>Болих</button>
                                            <button className="oinq-btn answer" disabled={!answerText.trim() || saving} onClick={handleAnswer}>
                                                {saving ? <Loader2 size={14} className="oinq-spin" /> : <Send size={14} />}
                                                Илгээх
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                {['pending', 'reviewing', 'forwarded'].includes(selected.status) && !showAnswerForm && (
                                    <div className="oinq-actions">
                                        {selected.status === 'pending' && (
                                            <button className="oinq-btn reviewing" disabled={saving} onClick={() => handleStatus(selected, 'reviewing')}>
                                                🔍 Шалгаж эхлэх
                                            </button>
                                        )}
                                        <button className="oinq-btn answer" disabled={saving} onClick={() => setShowAnswerForm(true)}>
                                            <CheckCircle size={14} /> Хариулах
                                        </button>
                                        {selected.status !== 'forwarded' && (
                                            <button className="oinq-btn forward" disabled={saving} onClick={() => handleStatus(selected, 'forwarded')}>
                                                <ArrowRight size={14} /> Сорс агент руу
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Assigned info */}
                                {selected.assignedTo && (
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                                        <span>Хариуцагч: <strong>{selected.assignedToName}</strong></span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="oinq-detail-empty">
                                <MessageSquare size={48} strokeWidth={1} />
                                <p>Лавлагаа сонгоно уу</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
