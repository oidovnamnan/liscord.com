import { useState, useRef, useEffect } from 'react';
import { Send, Search, Settings, MessageSquare, Menu, X, Copy, Check, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { fbMessengerService, type FbConversation, type FbMessage, type FbSettings } from '../../services/fbMessengerService';
import { HubLayout } from '../../components/common/HubLayout';
import toast from 'react-hot-toast';
import './FacebookMessengerPage.css';

export function FacebookMessengerPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();

    // ═══ State ═══
    const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
    const [conversations, setConversations] = useState<FbConversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<FbMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [convSearch, setConvSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Settings state
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [settingsForm, setSettingsForm] = useState({
        pageId: '',
        pageName: '',
        pageAccessToken: '',
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [copied, setCopied] = useState(false);

    // ═══ Load settings ═══
    useEffect(() => {
        if (!business?.id) return;
        fbMessengerService.getSettings(business.id).then(s => {
            setSettings(s);
            if (s) {
                setSettingsForm({
                    pageId: s.pageId,
                    pageName: s.pageName,
                    pageAccessToken: s.pageAccessToken,
                });
            }
        });
    }, [business?.id]);

    // ═══ Subscribe to conversations ═══
    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        const unsub = fbMessengerService.subscribeConversations(business.id, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // ═══ Subscribe to messages for active conversation ═══
    useEffect(() => {
        if (!business?.id || !activeConvId) return;
        setMessages([]);
        const unsub = fbMessengerService.subscribeMessages(business.id, activeConvId, (msgs) => {
            setMessages(msgs);
        });

        // Mark as read
        fbMessengerService.markConversationRead(business.id, activeConvId);

        return () => unsub();
    }, [business?.id, activeConvId]);

    // ═══ Auto-scroll messages ═══
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // ═══ Handlers ═══
    const handleSend = async () => {
        if (!newMessage.trim() || !business?.id || !activeConvId || sending) return;
        const text = newMessage;
        setNewMessage('');
        setSending(true);
        try {
            const result = await fbMessengerService.sendMessage(
                business.id, activeConvId, text, user?.displayName || 'Оператор'
            );
            if (!result.success) {
                toast.error(result.error || 'Мессеж илгээхэд алдаа гарлаа');
                setNewMessage(text);
            }
        } catch {
            toast.error('Мессеж илгээхэд алдаа гарлаа');
            setNewMessage(text);
        } finally {
            setSending(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!business?.id) return;
        setSavingSettings(true);
        try {
            const verifyToken = settings?.verifyToken || `liscord_${business.id.substring(0, 8)}_${Date.now().toString(36)}`;
            await fbMessengerService.saveSettings(business.id, {
                ...settingsForm,
                verifyToken,
                isConnected: !!settingsForm.pageAccessToken,
                connectedAt: settingsForm.pageAccessToken ? new Date() : undefined,
            });
            setSettings({
                ...settingsForm,
                verifyToken,
                isConnected: !!settingsForm.pageAccessToken,
                connectedAt: settingsForm.pageAccessToken ? new Date() : undefined,
            });
            toast.success('Тохиргоо хадгалагдлаа');
        } catch {
            toast.error('Тохиргоо хадгалахад алдаа гарлаа');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDisconnect = async () => {
        if (!business?.id || !confirm('Facebook холболтыг салгах уу?')) return;
        setSavingSettings(true);
        try {
            await fbMessengerService.saveSettings(business.id, {
                pageAccessToken: '',
                isConnected: false,
            });
            setSettings(prev => prev ? { ...prev, pageAccessToken: '', isConnected: false } : null);
            setSettingsForm(prev => ({ ...prev, pageAccessToken: '' }));
            toast.success('Facebook холболт салгагдлаа');
        } finally {
            setSavingSettings(false);
        }
    };

    const webhookUrl = `https://www.liscord.com/api/fb-webhook?bizId=${business?.id || ''}`;

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activeConv = conversations.find(c => c.id === activeConvId);
    const filteredConvs = conversations.filter(c =>
        !convSearch || c.senderName.toLowerCase().includes(convSearch.toLowerCase())
    );
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    const formatTime = (d: Date | null) => {
        if (!d) return '';
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return 'Дөнгө';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
        if (diff < 86400000) return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
    };

    // ═══ Settings Tab ═══
    if (activeTab === 'settings') {
        return (
            <HubLayout hubId="crm-hub">
                <div className="fbm-layout" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="fbm-settings">
                        <h3>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setActiveTab('chat')}>
                                <ArrowLeft size={20} />
                            </button>
                            <MessageSquare size={22} style={{ color: '#1877F2' }} />
                            Facebook Messenger тохиргоо
                        </h3>

                        {/* Connection Status */}
                        <div className="fbm-settings-card">
                            <h4>
                                Холболтын төлөв
                                <span className={`fbm-status-badge ${settings?.isConnected ? 'connected' : 'disconnected'}`}>
                                    ● {settings?.isConnected ? 'Холбогдсон' : 'Холбогдоогүй'}
                                </span>
                            </h4>
                            {settings?.isConnected && settings.pageName && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    📄 Хуудас: <strong>{settings.pageName}</strong>
                                </p>
                            )}
                        </div>

                        {/* Webhook URL */}
                        <div className="fbm-settings-card">
                            <h4>📡 Webhook URL</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                                Facebook Developer Console &gt; Messenger &gt; Webhooks хэсэгт доорх URL-г оруулна.
                            </p>
                            <div className="fbm-webhook-url" onClick={copyWebhookUrl} style={{ cursor: 'pointer' }}>
                                {webhookUrl}
                                <span style={{ float: 'right' }}>
                                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                                </span>
                            </div>
                            {settings?.verifyToken && (
                                <div style={{ marginTop: 12 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Verify Token:</label>
                                    <div className="fbm-webhook-url" style={{ marginTop: 4 }}>{settings.verifyToken}</div>
                                </div>
                            )}
                        </div>

                        {/* Page Settings */}
                        <div className="fbm-settings-card">
                            <h4>🔑 Page Access Token</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}>
                                    Graph API Explorer <ExternalLink size={12} style={{ display: 'inline' }} />
                                </a> -ээс Page Access Token авна.
                            </p>

                            <div className="fbm-settings-field">
                                <label>Page Name</label>
                                <input
                                    value={settingsForm.pageName}
                                    onChange={e => setSettingsForm(prev => ({ ...prev, pageName: e.target.value }))}
                                    placeholder="Жишээ: My Business Page"
                                />
                            </div>

                            <div className="fbm-settings-field">
                                <label>Page ID</label>
                                <input
                                    value={settingsForm.pageId}
                                    onChange={e => setSettingsForm(prev => ({ ...prev, pageId: e.target.value }))}
                                    placeholder="Facebook Page ID"
                                />
                            </div>

                            <div className="fbm-settings-field">
                                <label>Page Access Token</label>
                                <input
                                    value={settingsForm.pageAccessToken}
                                    onChange={e => setSettingsForm(prev => ({ ...prev, pageAccessToken: e.target.value }))}
                                    placeholder="EAABsb..."
                                    type="password"
                                />
                            </div>

                            <div className="fbm-settings-actions">
                                <button className="fbm-connect-btn" onClick={handleSaveSettings} disabled={savingSettings}>
                                    {savingSettings ? <Loader2 size={16} className="animate-spin" /> : '💾 Хадгалах'}
                                </button>
                                {settings?.isConnected && (
                                    <button className="fbm-connect-btn disconnect" onClick={handleDisconnect} disabled={savingSettings}>
                                        Салгах
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </HubLayout>
        );
    }

    // ═══ Chat Tab ═══
    return (
        <HubLayout hubId="crm-hub">
            <div className="fbm-layout">
                {/* ─── Sidebar ─── */}
                <aside className={`fbm-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="fbm-sidebar-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>
                                <MessageSquare size={20} />
                                Messenger
                            </h3>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'white' }} onClick={() => setActiveTab('settings')}>
                                    <Settings size={16} />
                                </button>
                                <button className="btn btn-ghost btn-icon btn-sm show-mobile" style={{ color: 'white' }} onClick={() => setIsSidebarOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="fbm-header-desc">Facebook Page-ийн мессежүүд</div>
                        <div className="fbm-header-stats">
                            <div className="fbm-header-stat">
                                <div className="fbm-header-stat-value">{conversations.length}</div>
                                <div className="fbm-header-stat-label">Харилцагч</div>
                            </div>
                            <div className="fbm-header-stat">
                                <div className="fbm-header-stat-value">{totalUnread}</div>
                                <div className="fbm-header-stat-label">Уншаагүй</div>
                            </div>
                        </div>
                    </div>

                    <div className="fbm-search">
                        <input
                            placeholder="Харилцагч хайх..."
                            value={convSearch}
                            onChange={e => setConvSearch(e.target.value)}
                        />
                    </div>

                    <div className="fbm-conv-list">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                <Loader2 size={24} className="animate-spin" style={{ color: '#1877F2' }} />
                            </div>
                        ) : filteredConvs.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {settings?.isConnected
                                    ? 'Мессеж алга байна. Facebook хуудсаар мессеж ирэхийг хүлээж байна.'
                                    : '⚙️ Тохиргоо хэсэгт Facebook холболтоо тохируулна уу.'}
                            </div>
                        ) : filteredConvs.map(c => (
                            <button
                                key={c.id}
                                className={`fbm-conv-item ${activeConvId === c.id ? 'active' : ''}`}
                                onClick={() => { setActiveConvId(c.id); setIsSidebarOpen(false); }}
                            >
                                <div className="fbm-conv-avatar">
                                    {c.senderProfilePic
                                        ? <img src={c.senderProfilePic} alt="" />
                                        : (c.senderName?.charAt(0) || '?')}
                                </div>
                                <div className="fbm-conv-info">
                                    <div className="fbm-conv-name">{c.senderName}</div>
                                    <div className="fbm-conv-last-msg">{c.lastMessage}</div>
                                </div>
                                <div className="fbm-conv-meta">
                                    <div className="fbm-conv-time">{formatTime(c.lastMessageAt)}</div>
                                    {c.unreadCount > 0 && <div className="fbm-conv-badge">{c.unreadCount}</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ─── Chat Main ─── */}
                <div className="fbm-chat-main" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                    {activeConv ? (
                        <>
                            <div className="fbm-chat-header">
                                <div className="fbm-chat-header-left">
                                    <button className="btn btn-ghost btn-icon btn-sm show-mobile" onClick={e => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                                        <Menu size={20} />
                                    </button>
                                    <div className="fbm-conv-avatar" style={{ width: 36, height: 36 }}>
                                        {activeConv.senderProfilePic
                                            ? <img src={activeConv.senderProfilePic} alt="" />
                                            : (activeConv.senderName?.charAt(0) || '?')}
                                    </div>
                                    <div>
                                        <h4>{activeConv.senderName}</h4>
                                        <div className="fbm-header-sub">
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1877F2' }} />
                                            Facebook Messenger
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="fbm-messages">
                                {messages.map(m => (
                                    <div key={m.id} className={`fbm-msg ${m.direction}`}>
                                        {m.direction === 'inbound' && (
                                            <div className="fbm-msg-avatar">
                                                {activeConv.senderProfilePic
                                                    ? <img src={activeConv.senderProfilePic} alt="" />
                                                    : (activeConv.senderName?.charAt(0) || '?')}
                                            </div>
                                        )}
                                        <div>
                                            <div className="fbm-msg-bubble">{m.text}</div>
                                            <div className="fbm-msg-time">{formatTime(m.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="fbm-input-bar">
                                <input
                                    placeholder="Мессеж бичих..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    disabled={sending}
                                />
                                <button className="fbm-send-btn" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="fbm-empty-state">
                            <div className="fbm-empty-icon">
                                <MessageSquare size={36} />
                            </div>
                            <h3>Facebook Messenger</h3>
                            <p>
                                {settings?.isConnected
                                    ? 'Зүүн талаас харилцагч сонгож эсвэл Facebook хуудсаар мессеж ирэхийг хүлээнэ үү.'
                                    : 'Эхлээд ⚙️ Тохиргоо дотроос Facebook Page-ээ холбоно уу.'}
                            </p>
                            {!settings?.isConnected && (
                                <button className="fbm-connect-btn" onClick={() => setActiveTab('settings')}>
                                    ⚙️ Тохиргоо руу очих
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </HubLayout>
    );
}
