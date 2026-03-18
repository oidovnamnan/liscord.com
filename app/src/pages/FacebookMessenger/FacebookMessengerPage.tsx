import { useState, useRef, useEffect } from 'react';
import {
    Send, Search, MessageSquare, Menu, X, Copy, Check, Loader2, Save,
    ArrowLeft, ExternalLink, Settings, Users, MessageCircle, Link2, Shield
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { fbMessengerService, type FbConversation, type FbMessage, type FbSettings } from '../../services/fbMessengerService';
import toast from 'react-hot-toast';
import './FacebookMessengerPage.css';

export function FacebookMessengerPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();

    // ═══ State ═══
    const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
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
    const [settingsForm, setSettingsForm] = useState({ pageId: '', pageName: '', pageAccessToken: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [copied, setCopied] = useState<string>('');

    useEffect(() => {
        if (!business?.id) return;
        fbMessengerService.getSettings(business.id).then(s => {
            setSettings(s);
            if (s) setSettingsForm({ pageId: s.pageId, pageName: s.pageName, pageAccessToken: s.pageAccessToken });
        });
    }, [business?.id]);

    // ═══ Subscribe conversations ═══
    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        const unsub = fbMessengerService.subscribeConversations(business.id, (convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    // ═══ Subscribe messages ═══
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
        } catch { toast.error('Алдаа гарлаа'); } finally { setSavingSettings(false); }
    };

    const handleDisconnect = async () => {
        if (!business?.id || !confirm('Facebook холболтыг салгах уу?')) return;
        setSavingSettings(true);
        try {
            await fbMessengerService.saveSettings(business.id, { pageAccessToken: '', isConnected: false });
            setSettings(prev => prev ? { ...prev, pageAccessToken: '', isConnected: false } : null);
            setSettingsForm(prev => ({ ...prev, pageAccessToken: '' }));
            toast.success('Салгагдлаа');
        } finally { setSavingSettings(false); }
    };

    const webhookUrl = `https://www.liscord.com/api/fb-webhook?bizId=${business?.id || ''}`;
    const copyText = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
    };

    const activeConv = conversations.find(c => c.id === activeConvId);
    const filteredConvs = conversations.filter(c => !convSearch || c.senderName.toLowerCase().includes(convSearch.toLowerCase()));
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
    const openConvs = conversations.filter(c => c.status === 'open').length;

    const formatTime = (d: Date | null) => {
        if (!d) return '';
        const diff = Date.now() - d.getTime();
        if (diff < 60000) return 'Дөнгө';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
        if (diff < 86400000) return d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
    };

    // ═══ SETTINGS VIEW ═══
    if (activeView === 'settings') {
        return (
            <div className="settings-section animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                {/* Hero */}
                <div className="fbm-hero">
                    <div className="fds-hero-top">
                        <div className="fds-hero-left">
                            <div className="fbm-hero-icon">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="fds-hero-title">Facebook Messenger</h3>
                                <div className="fds-hero-desc">Facebook Page-ийн мессежүүдийг нэг цонхноос удирдах</div>
                            </div>
                        </div>
                        {settings?.isConnected && (
                            <button className="fbm-back-btn" onClick={() => setActiveView('chat')}>
                                <MessageCircle size={14} /> Чат руу
                            </button>
                        )}
                    </div>
                    <div className="fbm-hero-stats">
                        <div className="fbm-hero-stat">
                            <div className="fbm-hero-stat-value">{conversations.length}</div>
                            <div className="fbm-hero-stat-label">Харилцагч</div>
                        </div>
                        <div className="fbm-hero-stat">
                            <div className="fbm-hero-stat-value">{totalUnread}</div>
                            <div className="fbm-hero-stat-label">Уншаагүй</div>
                        </div>
                        <div className="fbm-hero-stat">
                            <div className="fbm-hero-stat-value">{settings?.isConnected ? '✅' : '⚠️'}</div>
                            <div className="fbm-hero-stat-label">Холболт</div>
                        </div>
                    </div>
                </div>

                {/* Connection Status Card */}
                <div className="fds-card">
                    <div className="fds-card-title">
                        <Shield size={16} />
                        Холболтын төлөв
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`fbm-conn-badge ${settings?.isConnected ? 'connected' : ''}`}>
                            ● {settings?.isConnected ? 'Холбогдсон' : 'Холбогдоогүй'}
                        </span>
                        {settings?.isConnected && settings.pageName && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                📄 {settings.pageName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Webhook URL Card */}
                <div className="fds-card">
                    <div className="fds-card-title">
                        <Link2 size={16} />
                        Webhook URL
                    </div>
                    <div className="fds-slider-info" style={{ marginBottom: 12, marginTop: 0 }}>
                        Facebook Developer Console → Messenger → Webhooks хэсэгт доорх URL-г оруулна.
                    </div>
                    <div className="fbm-copyable" onClick={() => copyText(webhookUrl, 'url')}>
                        <code>{webhookUrl}</code>
                        {copied === 'url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </div>
                    {settings?.verifyToken && (
                        <div style={{ marginTop: 12 }}>
                            <div className="fbm-field-label">Verify Token</div>
                            <div className="fbm-copyable" onClick={() => copyText(settings.verifyToken, 'token')}>
                                <code>{settings.verifyToken}</code>
                                {copied === 'token' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            </div>
                        </div>
                    )}
                </div>

                {/* Page Access Token Card */}
                <div className="fds-card">
                    <div className="fds-card-title">
                        <Settings size={16} />
                        Page Access Token
                    </div>
                    <div className="fds-slider-info" style={{ marginBottom: 16, marginTop: 0 }}>
                        <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontWeight: 600 }}>
                            Graph API Explorer <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </a> -ээс Page Access Token авна.
                    </div>

                    <div className="fds-row">
                        <div>
                            <label className="fds-label">Page Name</label>
                            <input className="input" value={settingsForm.pageName} onChange={e => setSettingsForm(prev => ({ ...prev, pageName: e.target.value }))} placeholder="My Business Page" />
                        </div>
                        <div>
                            <label className="fds-label">Page ID</label>
                            <input className="input" value={settingsForm.pageId} onChange={e => setSettingsForm(prev => ({ ...prev, pageId: e.target.value }))} placeholder="123456789" />
                        </div>
                    </div>

                    <div className="fds-row-full">
                        <label className="fds-label">Page Access Token</label>
                        <input className="input" value={settingsForm.pageAccessToken} onChange={e => setSettingsForm(prev => ({ ...prev, pageAccessToken: e.target.value }))} placeholder="EAABsb..." type="password" />
                    </div>
                </div>

                {/* Save Button */}
                <div className="fds-save-wrap">
                    <button className="fbm-save-btn" onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Хадгалах
                    </button>
                </div>

                {settings?.isConnected && (
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button className="fbm-disconnect-btn" onClick={handleDisconnect} disabled={savingSettings}>
                            Холболт салгах
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ═══ CHAT VIEW ═══
    return (
        <div className="settings-section animate-fade-in" style={{ padding: 0, height: 'calc(100vh - 64px)' }}>
            {/* Hero */}
            <div className="fbm-hero" style={{ borderRadius: 0, marginBottom: 0 }}>
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fbm-hero-icon">
                            <MessageSquare size={22} />
                        </div>
                        <div>
                            <h3 className="fds-hero-title" style={{ fontSize: '1.1rem' }}>Messenger</h3>
                            <div className="fds-hero-desc">
                                {settings?.pageName || 'Facebook Page мессежүүд'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="fbm-back-btn" onClick={() => setActiveView('settings')}>
                            <Settings size={14} /> Тохиргоо
                        </button>
                        <button className="fbm-back-btn show-mobile" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={14} />
                        </button>
                    </div>
                </div>
                <div className="fbm-hero-stats">
                    <div className="fbm-hero-stat">
                        <div className="fbm-hero-stat-value">{conversations.length}</div>
                        <div className="fbm-hero-stat-label">Нийт</div>
                    </div>
                    <div className="fbm-hero-stat">
                        <div className="fbm-hero-stat-value">{openConvs}</div>
                        <div className="fbm-hero-stat-label">Нээлттэй</div>
                    </div>
                    <div className="fbm-hero-stat">
                        <div className="fbm-hero-stat-value">{totalUnread}</div>
                        <div className="fbm-hero-stat-label">Уншаагүй</div>
                    </div>
                </div>
            </div>

            {/* Chat Layout */}
            <div className="fbm-chat-grid">
                {/* Conversation List */}
                <aside className={`fbm-conv-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="fbm-conv-search">
                        <Search size={14} />
                        <input placeholder="Харилцагч хайх..." value={convSearch} onChange={e => setConvSearch(e.target.value)} />
                    </div>

                    <div className="fbm-conv-list">
                        {loading ? (
                            <div className="flex-center" style={{ padding: 40 }}><Loader2 size={20} className="animate-spin" style={{ color: '#1877F2' }} /></div>
                        ) : filteredConvs.length === 0 ? (
                            <div className="fbm-conv-empty">
                                {settings?.isConnected ? '📭 Мессеж алга' : '⚙️ Тохиргоо тохируулна уу'}
                            </div>
                        ) : filteredConvs.map(c => (
                            <button key={c.id} className={`fbm-conv-row ${activeConvId === c.id ? 'active' : ''}`}
                                onClick={() => { setActiveConvId(c.id); setIsSidebarOpen(false); }}>
                                <div className="fbm-conv-avatar">
                                    {c.senderProfilePic ? <img src={c.senderProfilePic} alt="" /> : (c.senderName?.charAt(0) || '?')}
                                </div>
                                <div className="fbm-conv-info">
                                    <div className="fbm-conv-name">{c.senderName}</div>
                                    <div className="fbm-conv-preview">{c.lastMessage}</div>
                                </div>
                                <div className="fbm-conv-meta">
                                    <span className="fbm-conv-time">{formatTime(c.lastMessageAt)}</span>
                                    {c.unreadCount > 0 && <span className="fbm-conv-badge">{c.unreadCount}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Chat Area */}
                <div className="fbm-chat-area" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                    {activeConv ? (
                        <>
                            <div className="fbm-chat-topbar">
                                <button className="btn btn-ghost btn-icon btn-sm show-mobile" onClick={e => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                                    <Menu size={18} />
                                </button>
                                <div className="fbm-conv-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                    {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeConv.senderName}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1877F2' }} />
                                        Facebook Messenger
                                    </div>
                                </div>
                            </div>

                            <div className="fbm-messages-area">
                                {messages.map(m => (
                                    <div key={m.id} className={`fbm-msg ${m.direction}`}>
                                        {m.direction === 'inbound' && (
                                            <div className="fbm-msg-av">
                                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                            </div>
                                        )}
                                        <div>
                                            <div className="fbm-msg-bubble">{m.text}</div>
                                            <div className="fbm-msg-ts">{formatTime(m.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="fbm-input-area">
                                <input placeholder="Мессеж бичих..." value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={sending} />
                                <button className="fbm-send" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="fbm-chat-empty">
                            <div className="fbm-chat-empty-icon">
                                <MessageSquare size={36} />
                            </div>
                            <h3>Facebook Messenger</h3>
                            <p>Зүүн талаас харилцагч сонгоно уу</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
