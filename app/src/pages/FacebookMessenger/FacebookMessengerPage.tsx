import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Send, Search, MessageSquare, X, Copy, Check, Loader2, Save,
    ExternalLink, Settings, Link2, Shield, ChevronRight, Tag, StickyNote,
    Image as ImageIcon, Smile, Zap, Filter, User
} from 'lucide-react';
import { useBusinessStore, useAuthStore, useUIStore } from '../../store';
import { fbMessengerService, type FbConversation, type FbMessage, type FbSettings } from '../../services/fbMessengerService';
import toast from 'react-hot-toast';
import './FacebookMessengerPage.css';

type ConvFilter = 'all' | 'unread' | 'open' | 'closed';

const CANNED_RESPONSES = [
    { key: '/баярлалаа', text: 'Баярлалаа! Манай дэлгүүрээр зочлоорой 🙏' },
    { key: '/захиалга', text: 'Захиалга өгөхийн тулд манай дэлгүүрээр зочилно уу!' },
    { key: '/хаяг', text: 'Бидний хаяг: ...' },
    { key: '/ажиллах', text: 'Ажлын цаг: Даваа-Баасан 09:00-18:00' },
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
        return () => {
            // Restore sidebar state on unmount
            if (!prevCollapsed.current) toggleSidebarCollapsed();
        };
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Settings
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [settingsForm, setSettingsForm] = useState({ pageId: '', pageName: '', pageAccessToken: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [copied, setCopied] = useState('');

    // ═══ Effects ═══
    useEffect(() => {
        if (!business?.id) return;
        fbMessengerService.getSettings(business.id).then(s => {
            setSettings(s);
            if (s) setSettingsForm({ pageId: s.pageId, pageName: s.pageName, pageAccessToken: s.pageAccessToken });
        });
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

    const handleDisconnect = async () => {
        if (!business?.id || !confirm('Салгах уу?')) return;
        setSavingSettings(true);
        try {
            await fbMessengerService.saveSettings(business.id, { pageAccessToken: '', isConnected: false });
            setSettings(prev => prev ? { ...prev, pageAccessToken: '', isConnected: false } : null);
            setSettingsForm(prev => ({ ...prev, pageAccessToken: '' }));
            toast.success('Салгагдлаа');
        } finally { setSavingSettings(false); }
    };

    const webhookUrl = `https://www.liscord.com/api/fb-webhook?bizId=${business?.id || ''}`;
    const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2000); };

    // ═══ Derived ═══
    const activeConv = conversations.find(c => c.id === activeConvId);
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const filteredConvs = useMemo(() => {
        let list = conversations;
        if (convFilter === 'unread') list = list.filter(c => c.unreadCount > 0);
        else if (convFilter === 'open') list = list.filter(c => c.status === 'open');
        else if (convFilter === 'closed') list = list.filter(c => c.status === 'closed');
        if (convSearch) list = list.filter(c => c.senderName.toLowerCase().includes(convSearch.toLowerCase()));
        return list;
    }, [conversations, convFilter, convSearch]);

    // Canned response matching
    const cannedMatches = useMemo(() => {
        if (!newMessage.startsWith('/')) return [];
        return CANNED_RESPONSES.filter(r => r.key.startsWith(newMessage));
    }, [newMessage]);

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
        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        if (isToday) return 'Өнөөдөр';
        if (d.toDateString() === yesterday.toDateString()) return 'Өчигдөр';
        return d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Group messages by date
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

    // ═══ RENDER ═══
    return (
        <div className="fbm-page animate-fade-in">
            {/* ── Compact Toolbar ── */}
            <div className="fbm-toolbar">
                <div className="fbm-toolbar-left">
                    <div className="fbm-toolbar-icon">
                        <MessageSquare size={18} />
                    </div>
                    <div className="fbm-toolbar-text">
                        <span className="fbm-toolbar-title">Messenger</span>
                        <span className="fbm-toolbar-sub">
                            {settings?.pageName || 'Facebook Page'}
                            {settings?.isConnected
                                ? <span className="fbm-dot connected" />
                                : <span className="fbm-dot" />}
                        </span>
                    </div>
                </div>
                <div className="fbm-toolbar-right">
                    {totalUnread > 0 && <span className="fbm-toolbar-badge">{totalUnread}</span>}
                    <button className="fbm-toolbar-btn" onClick={() => setShowDrawer(true)} title="Тохиргоо">
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className={`fbm-main ${showInfoPanel ? 'with-info' : ''}`}>
                {/* ── Conversations Sidebar ── */}
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
                            <div className="fbm-conv-empty">
                                {convFilter !== 'all' ? 'Шүүлтэд тохирох харилцагч алга' : settings?.isConnected ? '📭 Мессеж ирээгүй' : '⚙️ Тохиргоо хийнэ үү'}
                            </div>
                        ) : filteredConvs.map(c => (
                            <button key={c.id} className={`fbm-conv-row ${activeConvId === c.id ? 'active' : ''}`}
                                onClick={() => setActiveConvId(c.id)}>
                                <div className="fbm-conv-avatar">
                                    {c.senderProfilePic ? <img src={c.senderProfilePic} alt="" /> : (c.senderName?.charAt(0) || '?')}
                                </div>
                                <div className="fbm-conv-info">
                                    <div className="fbm-conv-name">{c.senderName}</div>
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
                            {/* Chat Header */}
                            <div className="fbm-chat-header">
                                <div className="fbm-chat-header-left">
                                    <div className="fbm-conv-avatar sm">
                                        {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                    </div>
                                    <div>
                                        <div className="fbm-chat-name">{activeConv.senderName}</div>
                                        <div className="fbm-chat-platform">
                                            <span className="fbm-dot connected" /> Facebook Messenger
                                        </div>
                                    </div>
                                </div>
                                <div className="fbm-chat-header-actions">
                                    <button className={`fbm-toolbar-btn ${showInfoPanel ? 'active' : ''}`} onClick={() => setShowInfoPanel(!showInfoPanel)} title="Мэдээлэл">
                                        <User size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="fbm-messages">
                                {messagesWithDates.map((item, i) => item.type === 'date' ? (
                                    <div key={`date-${i}`} className="fbm-date-sep">
                                        <span>{item.label}</span>
                                    </div>
                                ) : (
                                    <div key={item.msg.id} className={`fbm-msg ${item.msg.direction}`}>
                                        {item.msg.direction === 'inbound' && (
                                            <div className="fbm-msg-av">
                                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                            </div>
                                        )}
                                        <div>
                                            <div className="fbm-msg-bubble">
                                                {item.msg.text}
                                                {/* Attachments */}
                                                {item.msg.attachments?.map((att, j) => (
                                                    att.type === 'image' ? (
                                                        <img key={j} src={att.url} alt="" className="fbm-msg-img" />
                                                    ) : (
                                                        <a key={j} href={att.url} target="_blank" rel="noopener noreferrer" className="fbm-msg-attachment">
                                                            📎 Хавсралт
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                            <div className="fbm-msg-ts">{formatTime(item.msg.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Canned Responses Popup */}
                            {showCanned && cannedMatches.length > 0 && (
                                <div className="fbm-canned-popup">
                                    {cannedMatches.map(r => (
                                        <button key={r.key} className="fbm-canned-item" onClick={() => { setNewMessage(r.text); setShowCanned(false); }}>
                                            <Zap size={12} /> <strong>{r.key}</strong>
                                            <span>{r.text}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="fbm-input">
                                <input
                                    placeholder="Мессеж бичих... ( / бичвэл түргэн хариу)"
                                    value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); setShowCanned(e.target.value.startsWith('/')); }}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    disabled={sending}
                                />
                                <button className="fbm-send" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="fbm-empty">
                            <div className="fbm-empty-icon"><MessageSquare size={32} /></div>
                            <h3>Facebook Messenger</h3>
                            <p>{settings?.isConnected ? 'Зүүн талаас харилцагч сонгоно уу' : 'Эхлээд ⚙️ Тохиргоо хийж Facebook Page-ээ холбоно уу'}</p>
                            {!settings?.isConnected && (
                                <button className="fbm-empty-btn" onClick={() => setShowDrawer(true)}>⚙️ Тохиргоо</button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Customer Info Panel ── */}
                {showInfoPanel && activeConv && (
                    <div className="fbm-info-panel">
                        <div className="fbm-info-header">
                            <span>Хэрэглэгч</span>
                            <button className="fbm-toolbar-btn" onClick={() => setShowInfoPanel(false)}><X size={14} /></button>
                        </div>
                        <div className="fbm-info-profile">
                            <div className="fbm-info-avatar">
                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                            </div>
                            <div className="fbm-info-name">{activeConv.senderName}</div>
                            <div className="fbm-info-id">PSID: {activeConv.id}</div>
                        </div>
                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><MessageSquare size={12} /> Мессежийн тоо</div>
                            <div className="fbm-info-value">{messages.length}</div>
                        </div>
                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><Tag size={12} /> Хаяг</div>
                            <div className="fbm-info-tags">
                                <span className="fbm-tag blue">Messenger</span>
                                {activeConv.status === 'open' && <span className="fbm-tag green">Нээлттэй</span>}
                            </div>
                        </div>
                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><StickyNote size={12} /> Тэмдэглэл</div>
                            <textarea className="fbm-info-notes" placeholder="Тэмдэглэл бичих..." rows={3} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Settings Drawer ── */}
            {showDrawer && (
                <div className="fbm-drawer-overlay" onClick={() => setShowDrawer(false)}>
                    <div className="fbm-drawer" onClick={e => e.stopPropagation()}>
                        <div className="fbm-drawer-header">
                            <h3><Settings size={18} /> Messenger тохиргоо</h3>
                            <button className="fbm-toolbar-btn" onClick={() => setShowDrawer(false)}><X size={16} /></button>
                        </div>
                        <div className="fbm-drawer-body">
                            {/* Status */}
                            <div className="fbm-drawer-section">
                                <div className="fbm-drawer-section-title"><Shield size={14} /> Холболт</div>
                                <span className={`fbm-conn-badge ${settings?.isConnected ? 'connected' : ''}`}>
                                    ● {settings?.isConnected ? 'Холбогдсон' : 'Холбогдоогүй'}
                                </span>
                            </div>

                            {/* Webhook */}
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

                            {/* Token */}
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
                            {settings?.isConnected && (
                                <button className="fbm-disconnect-btn" onClick={handleDisconnect} disabled={savingSettings}>Салгах</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
