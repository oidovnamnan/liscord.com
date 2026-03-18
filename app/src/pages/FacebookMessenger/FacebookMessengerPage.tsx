import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Send, Search, MessageSquare, X, Copy, Check, Loader2, Save,
    ExternalLink, Settings, Link2, Shield, Tag, StickyNote,
    Zap, User, CreditCard, DollarSign, ChevronDown, XCircle, CheckCircle
} from 'lucide-react';
import { useBusinessStore, useAuthStore, useUIStore } from '../../store';
import { fbMessengerService, type FbConversation, type FbMessage, type FbSettings, type FbCannedResponse } from '../../services/fbMessengerService';
import toast from 'react-hot-toast';
import './FacebookMessengerPage.css';

type ConvFilter = 'all' | 'unread' | 'open' | 'closed';

const DEFAULT_CANNED: FbCannedResponse[] = [
    { key: '/баярлалаа', text: 'Баярлалаа! Манай дэлгүүрээр зочлоорой 🙏' },
    { key: '/захиалга', text: 'Захиалга өгөхийн тулд манай дэлгүүрээр зочилно уу!' },
    { key: '/хаяг', text: 'Бидний хаяг: ...' },
    { key: '/цаг', text: 'Ажлын цаг: Даваа-Баасан 09:00-18:00' },
    { key: '/холбоо', text: 'Холбоо барих утас: ...' },
];

export function FacebookMessengerPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

    // Auto-collapse main sidebar on mount
    const prevCollapsed = useRef(sidebarCollapsed);
    useEffect(() => {
        prevCollapsed.current = sidebarCollapsed;
        if (!sidebarCollapsed) toggleSidebarCollapsed();
        return () => { if (!prevCollapsed.current) toggleSidebarCollapsed(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ═══ State ═══
    const [conversations, setConversations] = useState<FbConversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<FbMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [convSearch, setConvSearch] = useState('');
    const [convFilter, setConvFilter] = useState<ConvFilter>('all');
    const [loading, setLoading] = useState(true);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showCanned, setShowCanned] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [sendingPayment, setSendingPayment] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Settings
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [settingsForm, setSettingsForm] = useState({ pageId: '', pageName: '', pageAccessToken: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [copied, setCopied] = useState('');
    const [cannedResponses, setCannedResponses] = useState<FbCannedResponse[]>(DEFAULT_CANNED);

    // Notes editing
    const [editingNotes, setEditingNotes] = useState('');
    const notesTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ═══ Effects ═══
    useEffect(() => {
        if (!business?.id) return;
        fbMessengerService.getSettings(business.id).then(s => {
            setSettings(s);
            if (s) setSettingsForm({ pageId: s.pageId, pageName: s.pageName, pageAccessToken: s.pageAccessToken });
        });
        fbMessengerService.getCannedResponses(business.id).then(r => { if (r.length > 0) setCannedResponses(r); });
    }, [business?.id]);

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        const unsub = fbMessengerService.subscribeConversations(business.id, (convs) => { setConversations(convs); setLoading(false); });
        return () => unsub();
    }, [business?.id]);

    useEffect(() => {
        if (!business?.id || !activeConvId) return;
        setMessages([]);
        const unsub = fbMessengerService.subscribeMessages(business.id, activeConvId, setMessages);
        fbMessengerService.markConversationRead(business.id, activeConvId);
        return () => unsub();
    }, [business?.id, activeConvId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

    // Set notes when switching conv
    const activeConv = conversations.find(c => c.id === activeConvId);
    useEffect(() => { setEditingNotes(activeConv?.notes || ''); }, [activeConvId, activeConv?.notes]);

    // ═══ Handlers ═══
    const handleSend = async () => {
        if (!newMessage.trim() || !business?.id || !activeConvId || sending) return;
        const text = newMessage;
        setNewMessage('');
        setShowCanned(false);
        setSending(true);
        try {
            const r = await fbMessengerService.sendMessage(business.id, activeConvId, text, user?.displayName || 'Оператор');
            if (!r.success) { toast.error(r.error || 'Илгээхэд алдаа'); setNewMessage(text); }
        } catch { toast.error('Илгээхэд алдаа'); setNewMessage(text); } finally { setSending(false); }
    };

    const handleSendPayment = async () => {
        if (!business?.id || !activeConvId || !paymentAmount) return;
        setSendingPayment(true);
        try {
            const r = await fbMessengerService.sendPayment(business.id, activeConvId, Number(paymentAmount), paymentDesc || undefined, user?.displayName || 'Оператор');
            if (r.success) {
                toast.success('Төлбөрийн нэхэмжлэх илгээгдлээ!');
                setShowPaymentModal(false);
                setPaymentAmount('');
                setPaymentDesc('');
            } else {
                toast.error(r.error || 'Алдаа');
            }
        } catch { toast.error('Алдаа гарлаа'); } finally { setSendingPayment(false); }
    };

    const handleSaveSettings = async () => {
        if (!business?.id) return;
        setSavingSettings(true);
        try {
            const verifyToken = settings?.verifyToken || `liscord_${business.id.substring(0, 8)}_${Date.now().toString(36)}`;
            await fbMessengerService.saveSettings(business.id, {
                ...settingsForm, verifyToken,
                isConnected: !!settingsForm.pageAccessToken,
                connectedAt: settingsForm.pageAccessToken ? new Date() : undefined,
            });
            setSettings({ ...settingsForm, verifyToken, isConnected: !!settingsForm.pageAccessToken, connectedAt: settingsForm.pageAccessToken ? new Date() : undefined });
            toast.success('Тохиргоо хадгалагдлаа!');
            setShowDrawer(false);
        } catch { toast.error('Алдаа гарлаа'); } finally { setSavingSettings(false); }
    };

    const handleNotesChange = useCallback((value: string) => {
        setEditingNotes(value);
        if (notesTimeout.current) clearTimeout(notesTimeout.current);
        notesTimeout.current = setTimeout(() => {
            if (business?.id && activeConvId) {
                fbMessengerService.updateConversationNotes(business.id, activeConvId, value);
            }
        }, 1000);
    }, [business?.id, activeConvId]);

    const toggleTag = useCallback((tag: string) => {
        if (!business?.id || !activeConvId || !activeConv) return;
        const current = activeConv.tags || [];
        const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
        fbMessengerService.updateConversationTags(business.id, activeConvId, updated);
    }, [business?.id, activeConvId, activeConv]);

    const toggleConvStatus = useCallback(() => {
        if (!business?.id || !activeConvId || !activeConv) return;
        const newStatus = activeConv.status === 'open' ? 'closed' : 'open';
        fbMessengerService.updateConversationStatus(business.id, activeConvId, newStatus);
        toast.success(newStatus === 'closed' ? 'Харилцаа хаагдлаа' : 'Харилцаа нээгдлээ');
    }, [business?.id, activeConvId, activeConv]);

    const webhookUrl = `https://www.liscord.com/api/fb-webhook?bizId=${business?.id || ''}`;
    const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000); };

    // ═══ Derived ═══
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const filteredConvs = useMemo(() => {
        let list = conversations;
        if (convFilter === 'unread') list = list.filter(c => c.unreadCount > 0);
        else if (convFilter === 'open') list = list.filter(c => c.status === 'open');
        else if (convFilter === 'closed') list = list.filter(c => c.status === 'closed');
        if (convSearch) list = list.filter(c => c.senderName.toLowerCase().includes(convSearch.toLowerCase()));
        return list;
    }, [conversations, convFilter, convSearch]);

    const cannedMatches = useMemo(() => {
        if (!newMessage.startsWith('/')) return [];
        return cannedResponses.filter(r => r.key.startsWith(newMessage));
    }, [newMessage, cannedResponses]);

    const formatTime = (d: Date | null) => {
        if (!d) return '';
        const diff = Date.now() - d.getTime();
        if (diff < 60000) return 'Дөнгө';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
        if (diff < 86400000) return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
    };

    const getDateLabel = (d: Date | null) => {
        if (!d) return '';
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Өнөөдөр';
        const y = new Date(now); y.setDate(now.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return 'Өчигдөр';
        return d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const messagesWithDates = useMemo(() => {
        const result: Array<{ type: 'date'; label: string } | { type: 'msg'; msg: FbMessage }> = [];
        let lastDate = '';
        for (const m of messages) {
            const dl = getDateLabel(m.timestamp);
            if (dl && dl !== lastDate) { result.push({ type: 'date', label: dl }); lastDate = dl; }
            result.push({ type: 'msg', msg: m });
        }
        return result;
    }, [messages]);

    const msgStatus = (m: FbMessage) => {
        if (m.direction !== 'outbound') return null;
        if (m.readAt) return 'read';
        if (m.deliveredAt) return 'delivered';
        return 'sent';
    };

    const TAGS = ['VIP', 'Шинэ', 'Яаралтай', 'Хүлээгдэж буй'];
    const TAG_COLORS: Record<string, string> = { 'VIP': 'blue', 'Шинэ': 'green', 'Яаралтай': 'red', 'Хүлээгдэж буй': 'yellow' };

    // ═══ RENDER ═══
    return (
        <div className="fbm-page animate-fade-in">
            {/* ── Compact Toolbar ── */}
            <div className="fbm-toolbar">
                <div className="fbm-toolbar-left">
                    <div className="fbm-toolbar-icon"><MessageSquare size={18} /></div>
                    <div className="fbm-toolbar-text">
                        <span className="fbm-toolbar-title">Messenger</span>
                        <span className="fbm-toolbar-sub">
                            {settings?.pageName || 'Facebook Page'}
                            <span className={`fbm-dot ${settings?.isConnected ? 'connected' : ''}`} />
                        </span>
                    </div>
                </div>
                <div className="fbm-toolbar-right">
                    {totalUnread > 0 && <span className="fbm-toolbar-badge">{totalUnread}</span>}
                    <button className="fbm-toolbar-btn" onClick={() => setShowDrawer(true)} title="Тохиргоо"><Settings size={16} /></button>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className={`fbm-main ${showInfoPanel && activeConv ? 'with-info' : ''}`}>
                {/* ── Conversations ── */}
                <div className="fbm-convs">
                    <div className="fbm-conv-search">
                        <Search size={14} />
                        <input placeholder="Хайх..." value={convSearch} onChange={e => setConvSearch(e.target.value)} />
                    </div>
                    <div className="fbm-filters">
                        {(['all', 'unread', 'open', 'closed'] as ConvFilter[]).map(f => (
                            <button key={f} className={`fbm-filter-btn ${convFilter === f ? 'active' : ''}`} onClick={() => setConvFilter(f)}>
                                {f === 'all' ? 'Бүгд' : f === 'unread' ? 'Уншаагүй' : f === 'open' ? 'Нээлттэй' : 'Хаасан'}
                                {f === 'unread' && totalUnread > 0 && <span className="fbm-filter-count">{totalUnread}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="fbm-conv-list">
                        {loading ? (
                            <div className="flex-center" style={{ padding: 40 }}><Loader2 size={18} className="animate-spin" style={{ color: '#1877F2' }} /></div>
                        ) : filteredConvs.length === 0 ? (
                            <div className="fbm-conv-empty">{convFilter !== 'all' ? 'Шүүлтэд тохирох алга' : settings?.isConnected ? '📭 Мессеж ирээгүй' : '⚙️ Тохиргоо хийнэ үү'}</div>
                        ) : filteredConvs.map(c => (
                            <button key={c.id} className={`fbm-conv-row ${activeConvId === c.id ? 'active' : ''}`}
                                onClick={() => setActiveConvId(c.id)}>
                                <div className="fbm-conv-avatar">
                                    {c.senderProfilePic ? <img src={c.senderProfilePic} alt="" /> : (c.senderName?.charAt(0) || '?')}
                                </div>
                                <div className="fbm-conv-info">
                                    <div className="fbm-conv-name">
                                        {c.senderName}
                                        {c.tags?.includes('VIP') && <span className="fbm-mini-tag blue">VIP</span>}
                                    </div>
                                    <div className="fbm-conv-preview">{c.lastMessage}</div>
                                </div>
                                <div className="fbm-conv-meta">
                                    <span className="fbm-conv-time">{formatTime(c.lastMessageAt)}</span>
                                    {c.unreadCount > 0 && <span className="fbm-conv-unread">{c.unreadCount}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Chat Area ── */}
                <div className="fbm-chat">
                    {activeConv ? (
                        <>
                            <div className="fbm-chat-header">
                                <div className="fbm-chat-header-left">
                                    <div className="fbm-conv-avatar sm">
                                        {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                    </div>
                                    <div>
                                        <div className="fbm-chat-name">{activeConv.senderName}</div>
                                        <div className="fbm-chat-platform"><span className="fbm-dot connected" /> Facebook Messenger</div>
                                    </div>
                                </div>
                                <div className="fbm-chat-header-actions">
                                    <button className="fbm-toolbar-btn chat" onClick={() => setShowPaymentModal(true)} title="Төлбөр илгээх">
                                        <CreditCard size={15} />
                                    </button>
                                    <button className={`fbm-toolbar-btn chat ${showInfoPanel ? 'active' : ''}`} onClick={() => setShowInfoPanel(!showInfoPanel)} title="Мэдээлэл">
                                        <User size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="fbm-messages">
                                {messagesWithDates.map((item, i) => item.type === 'date' ? (
                                    <div key={`d-${i}`} className="fbm-date-sep"><span>{item.label}</span></div>
                                ) : (
                                    <div key={item.msg.id} className={`fbm-msg ${item.msg.direction} ${item.msg.isPostback ? 'postback' : ''}`}>
                                        {item.msg.direction === 'inbound' && (
                                            <div className="fbm-msg-av">
                                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                            </div>
                                        )}
                                        <div className="fbm-msg-content">
                                            {/* Payment message */}
                                            {item.msg.isPayment ? (
                                                <div className="fbm-msg-payment">
                                                    <div className="fbm-payment-header"><DollarSign size={14} /> Төлбөрийн нэхэмжлэх</div>
                                                    <div className="fbm-payment-amount">{Number(item.msg.paymentAmount).toLocaleString()}₮</div>
                                                    {item.msg.paymentUrl && (
                                                        <a href={item.msg.paymentUrl} target="_blank" rel="noopener noreferrer" className="fbm-payment-link">
                                                            💳 Төлбөр төлөх линк
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="fbm-msg-bubble">
                                                    {item.msg.text}
                                                    {item.msg.attachments?.map((att, j) => (
                                                        att.type === 'image' ? (
                                                            <a key={j} href={att.url} target="_blank" rel="noopener noreferrer">
                                                                <img src={att.url} alt="" className="fbm-msg-img" />
                                                            </a>
                                                        ) : att.type === 'video' ? (
                                                            <video key={j} src={att.url} controls className="fbm-msg-video" />
                                                        ) : att.type === 'audio' ? (
                                                            <audio key={j} src={att.url} controls className="fbm-msg-audio" />
                                                        ) : att.type === 'sticker' ? (
                                                            <img key={j} src={att.url} alt="sticker" className="fbm-msg-sticker" />
                                                        ) : (
                                                            <a key={j} href={att.url} target="_blank" rel="noopener noreferrer" className="fbm-msg-file">
                                                                📄 Файл татах
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                            <div className="fbm-msg-footer">
                                                <span className="fbm-msg-ts">{formatTime(item.msg.timestamp)}</span>
                                                {msgStatus(item.msg) === 'read' && <span className="fbm-msg-status read">✓✓</span>}
                                                {msgStatus(item.msg) === 'delivered' && <span className="fbm-msg-status">✓✓</span>}
                                                {msgStatus(item.msg) === 'sent' && <span className="fbm-msg-status">✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Canned popup */}
                            {showCanned && cannedMatches.length > 0 && (
                                <div className="fbm-canned-popup">
                                    {cannedMatches.map(r => (
                                        <button key={r.key} className="fbm-canned-item" onClick={() => { setNewMessage(r.text); setShowCanned(false); }}>
                                            <Zap size={12} /> <strong>{r.key}</strong> <span>{r.text}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="fbm-input">
                                <input placeholder="Мессеж бичих... ( / түргэн хариу)" value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); setShowCanned(e.target.value.startsWith('/')); }}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={sending} />
                                <button className="fbm-send" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="fbm-empty">
                            <div className="fbm-empty-icon"><MessageSquare size={32} /></div>
                            <h3>Facebook Messenger</h3>
                            <p>{settings?.isConnected ? 'Зүүн талаас харилцагч сонгоно уу' : 'Эхлээд ⚙️ Тохиргоо хийж Page-ээ холбоно уу'}</p>
                            {!settings?.isConnected && <button className="fbm-empty-btn" onClick={() => setShowDrawer(true)}>⚙️ Тохиргоо</button>}
                        </div>
                    )}
                </div>

                {/* ── Info Panel ── */}
                {showInfoPanel && activeConv && (
                    <div className="fbm-info-panel">
                        <div className="fbm-info-header">
                            <span>Хэрэглэгч</span>
                            <button className="fbm-toolbar-btn chat" onClick={() => setShowInfoPanel(false)}><X size={14} /></button>
                        </div>
                        <div className="fbm-info-profile">
                            <div className="fbm-info-avatar">
                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                            </div>
                            <div className="fbm-info-name">{activeConv.senderName}</div>
                            <div className="fbm-info-id">PSID: {activeConv.id}</div>
                        </div>

                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><MessageSquare size={12} /> Статистик</div>
                            <div className="fbm-info-value">{messages.length} мессеж</div>
                        </div>

                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><Tag size={12} /> Хаяг</div>
                            <div className="fbm-info-tags">
                                {TAGS.map(tag => (
                                    <button key={tag} className={`fbm-tag ${TAG_COLORS[tag] || ''} ${activeConv.tags?.includes(tag) ? 'active' : ''}`}
                                        onClick={() => toggleTag(tag)}>{tag}</button>
                                ))}
                            </div>
                        </div>

                        <div className="fbm-info-section">
                            <div className="fbm-info-label">
                                {activeConv.status === 'open' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                Төлөв
                            </div>
                            <button className={`fbm-status-btn ${activeConv.status}`} onClick={toggleConvStatus}>
                                {activeConv.status === 'open' ? '🟢 Нээлттэй — хаах' : '🔴 Хаагдсан — нээх'}
                            </button>
                        </div>

                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><StickyNote size={12} /> Тэмдэглэл</div>
                            <textarea className="fbm-info-notes" placeholder="Тэмдэглэл бичих..." rows={3}
                                value={editingNotes} onChange={e => handleNotesChange(e.target.value)} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Payment Modal ── */}
            {showPaymentModal && (
                <div className="fbm-drawer-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="fbm-payment-modal" onClick={e => e.stopPropagation()}>
                        <div className="fbm-payment-modal-header">
                            <h3><CreditCard size={18} /> Төлбөр илгээх</h3>
                            <button className="fbm-toolbar-btn" onClick={() => setShowPaymentModal(false)}><X size={16} /></button>
                        </div>
                        <div className="fbm-payment-modal-body">
                            <p className="fbm-drawer-hint">QPay нэхэмжлэх үүсгэн Messenger-ээр илгээнэ</p>
                            <div className="fbm-drawer-field">
                                <label>Дүн (₮)</label>
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="50000" autoFocus />
                            </div>
                            <div className="fbm-drawer-field">
                                <label>Тайлбар</label>
                                <input value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="Бараа/үйлчилгээний нэр" />
                            </div>
                        </div>
                        <div className="fbm-drawer-footer">
                            <button className="fbm-save-btn" onClick={handleSendPayment} disabled={sendingPayment || !paymentAmount}>
                                {sendingPayment ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
                                Нэхэмжлэх илгээх
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings Drawer ── */}
            {showDrawer && (
                <div className="fbm-drawer-overlay" onClick={() => setShowDrawer(false)}>
                    <div className="fbm-drawer" onClick={e => e.stopPropagation()}>
                        <div className="fbm-drawer-header">
                            <h3><Settings size={18} /> Тохиргоо</h3>
                            <button className="fbm-toolbar-btn" onClick={() => setShowDrawer(false)}><X size={16} /></button>
                        </div>
                        <div className="fbm-drawer-body">
                            <div className="fbm-drawer-section">
                                <div className="fbm-drawer-section-title"><Shield size={14} /> Холболт</div>
                                <span className={`fbm-conn-badge ${settings?.isConnected ? 'connected' : ''}`}>
                                    ● {settings?.isConnected ? 'Холбогдсон' : 'Холбогдоогүй'}
                                </span>
                            </div>
                            <div className="fbm-drawer-section">
                                <div className="fbm-drawer-section-title"><Link2 size={14} /> Webhook URL</div>
                                <div className="fbm-copyable" onClick={() => copyText(webhookUrl, 'url')}>
                                    <code>{webhookUrl}</code>
                                    {copied === 'url' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                </div>
                                {settings?.verifyToken && (
                                    <>
                                        <div className="fbm-drawer-sublabel">Verify Token</div>
                                        <div className="fbm-copyable" onClick={() => copyText(settings.verifyToken, 'token')}>
                                            <code>{settings.verifyToken}</code>
                                            {copied === 'token' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="fbm-drawer-section">
                                <div className="fbm-drawer-section-title"><Settings size={14} /> Access Token</div>
                                <p className="fbm-drawer-hint">
                                    <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
                                        Graph API Explorer <ExternalLink size={10} />
                                    </a>
                                </p>
                                <div className="fbm-drawer-field">
                                    <label>Page Name</label>
                                    <input value={settingsForm.pageName} onChange={e => setSettingsForm(p => ({ ...p, pageName: e.target.value }))} placeholder="My Page" />
                                </div>
                                <div className="fbm-drawer-field">
                                    <label>Page ID</label>
                                    <input value={settingsForm.pageId} onChange={e => setSettingsForm(p => ({ ...p, pageId: e.target.value }))} placeholder="123456789" />
                                </div>
                                <div className="fbm-drawer-field">
                                    <label>Page Access Token</label>
                                    <input value={settingsForm.pageAccessToken} onChange={e => setSettingsForm(p => ({ ...p, pageAccessToken: e.target.value }))} placeholder="EAABsb..." type="password" />
                                </div>
                            </div>
                        </div>
                        <div className="fbm-drawer-footer">
                            <button className="fbm-save-btn" onClick={handleSaveSettings} disabled={savingSettings}>
                                {savingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Хадгалах
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
