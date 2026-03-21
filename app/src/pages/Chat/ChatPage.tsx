import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Send, Smile, Paperclip, Search, Hash, Users, Bell, Pin, Loader2, X, Menu, Plus,
    MoreHorizontal, Reply, Edit3, Trash2, MessageCircle, ChevronDown, ArrowUp,
    Package, ShoppingCart, UserCheck, Image as ImageIcon, BellOff
} from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { chatService, type ChatMessage, type ChatChannel } from '../../services/teamService';
import { HubLayout } from '../../components/common/HubLayout';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import './ChatPage.css';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '✅', '👎'];

// ═══════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════

export function ChatPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [channelSearch, setChannelSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Feature states
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [contextMenu, setContextMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
    const [showReactions, setShowReactions] = useState<string | null>(null);
    const [showPinned, setShowPinned] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
    const [readStates, setReadStates] = useState<Record<string, Date>>({});
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [searching, setSearching] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState<'team' | 'announcement'>('team');

    // DM states
    const [showDMPicker, setShowDMPicker] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employees, setEmployees] = useState<any[]>([]);

    // Entity search (slash commands)
    const [slashMode, setSlashMode] = useState<'order' | 'product' | null>(null);
    const [slashQuery, setSlashQuery] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [slashResults, setSlashResults] = useState<any[]>([]);
    const [slashLoading, setSlashLoading] = useState(false);

    // ──── Channel initialization (once) ────
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (!business?.id) return;

        const unsubscribe = chatService.subscribeChannels(business.id, async (data) => {
            if (data.length === 0 && !hasInitialized.current) {
                hasInitialized.current = true;
                try {
                    await chatService.createChannel(business.id, {
                        name: 'general',
                        type: 'general',
                        icon: 'Hash',
                        description: 'Ерөнхий суваг'
                    });
                } catch (e) {
                    console.error('Failed to create default channel:', e);
                }
            }
            setChannels(data);
            if (data.length > 0 && !activeChannelId) {
                setActiveChannelId(data[0].id);
            }
            setLoading(false);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id]);

    // ──── Messages subscription ────
    useEffect(() => {
        if (!business?.id || !activeChannelId) return;
        setMessages([]);
        const unsubscribe = chatService.subscribeMessages(business.id, activeChannelId, (data) => {
            setMessages(data);
        });
        return () => unsubscribe();
    }, [business?.id, activeChannelId]);

    // ──── Read state tracking ────
    useEffect(() => {
        if (!business?.id || !user?.uid) return;
        const unsub = chatService.subscribeReadStates(business.id, user.uid, setReadStates);
        return () => unsub();
    }, [business?.id, user?.uid]);

    // ──── Mark channel as read ────
    useEffect(() => {
        if (!business?.id || !activeChannelId || !user?.uid) return;
        chatService.markChannelRead(business.id, activeChannelId, user.uid);
    }, [business?.id, activeChannelId, user?.uid, messages.length]);

    // ──── Pinned messages ────
    useEffect(() => {
        if (!business?.id || !activeChannelId) return;
        const unsub = chatService.subscribePinnedMessages(business.id, activeChannelId, setPinnedMessages);
        return () => unsub();
    }, [business?.id, activeChannelId]);

    // ──── Load employees for DM ────
    useEffect(() => {
        if (!business?.id) return;
        const empRef = collection(db, 'businesses', business.id, 'employees');
        const q = query(empRef, where('isDeleted', '!=', true));
        getDocs(q).then(snap => {
            setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, [business?.id]);

    // ──── Auto scroll ────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // ──── Close context menu on click ────
    useEffect(() => {
        const handler = () => { setContextMenu(null); setShowReactions(null); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // ──── Slash command detection ────
    useEffect(() => {
        if (newMessage.startsWith('/order ') || newMessage.startsWith('/захиалга ')) {
            setSlashMode('order');
            setSlashQuery(newMessage.replace(/^\/(order|захиалга)\s*/, ''));
        } else if (newMessage.startsWith('/product ') || newMessage.startsWith('/бараа ')) {
            setSlashMode('product');
            setSlashQuery(newMessage.replace(/^\/(product|бараа)\s*/, ''));
        } else {
            if (slashMode) { setSlashMode(null); setSlashResults([]); }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMessage]);

    // ──── Slash search ────
    useEffect(() => {
        if (!slashMode || !slashQuery.trim() || !business?.id) return;
        const timeout = setTimeout(async () => {
            setSlashLoading(true);
            try {
                if (slashMode === 'order') {
                    const q = query(
                        collection(db, 'businesses', business.id, 'orders'),
                        where('isDeleted', '==', false),
                        orderBy('createdAt', 'desc'),
                        limit(10)
                    );
                    const snap = await getDocs(q);
                    const filtered = snap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter((o: any) => {
                            const q = slashQuery.toLowerCase();
                            return (o.orderNumber?.toLowerCase().includes(q) ||
                                o.customer?.name?.toLowerCase().includes(q) ||
                                o.customer?.phone?.includes(q));
                        });
                    setSlashResults(filtered.slice(0, 5));
                } else if (slashMode === 'product') {
                    const q = query(
                        collection(db, 'businesses', business.id, 'products'),
                        where('isDeleted', '==', false),
                        limit(20)
                    );
                    const snap = await getDocs(q);
                    const filtered = snap.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .filter((p: any) => p.name?.toLowerCase().includes(slashQuery.toLowerCase()));
                    setSlashResults(filtered.slice(0, 5));
                }
            } catch (e) {
                console.error('Slash search error:', e);
            }
            setSlashLoading(false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [slashMode, slashQuery, business?.id]);

    // ──── SEND MESSAGE ────
    const handleSend = async () => {
        if (!business?.id || !activeChannelId || !user) return;

        // Editing mode
        if (editingMsg) {
            if (!newMessage.trim()) return;
            try {
                await chatService.editMessage(business.id, activeChannelId, editingMsg.id, newMessage.trim(), user.uid);
                toast.success('Зурвас засагдлаа');
            } catch (e: any) {
                toast.error(e.message || 'Засахад алдаа');
            }
            setEditingMsg(null);
            setNewMessage('');
            return;
        }

        if (!newMessage.trim()) return;
        const text = newMessage;
        setNewMessage('');
        const reply = replyTo;
        setReplyTo(null);

        try {
            await chatService.sendMessage(business.id, activeChannelId, {
                text,
                senderId: user.uid,
                senderName: user.displayName || 'Хэрэглэгч',
                avatar: user.photoURL || (user.displayName || 'Х').charAt(0),
                replyTo: reply ? { messageId: reply.id, senderName: reply.senderName, text: reply.text.slice(0, 80) } : null,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Мессеж илгээхэд алдаа!');
        }
    };

    // ──── SEND ENTITY LINK ────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendEntityLink = async (entity: any) => {
        if (!business?.id || !activeChannelId || !user) return;
        if (slashMode === 'order') {
            await chatService.sendMessage(business.id, activeChannelId, {
                text: `📋 Захиалга ${entity.orderNumber} — ${entity.customer?.name || 'Зочин'} — ₮${(entity.financials?.totalAmount || 0).toLocaleString()}`,
                senderId: user.uid,
                senderName: user.displayName || 'Хэрэглэгч',
                avatar: user.photoURL || (user.displayName || 'Х').charAt(0),
                type: 'entity_link',
                entityLink: { type: 'order', id: entity.id, label: entity.orderNumber, number: entity.orderNumber }
            });
        } else if (slashMode === 'product') {
            await chatService.sendMessage(business.id, activeChannelId, {
                text: `🛍️ Бараа: ${entity.name} — ₮${(entity.pricing?.sellingPrice || 0).toLocaleString()}`,
                senderId: user.uid,
                senderName: user.displayName || 'Хэрэглэгч',
                avatar: user.photoURL || (user.displayName || 'Х').charAt(0),
                type: 'entity_link',
                entityLink: { type: 'product', id: entity.id, label: entity.name }
            });
        }
        setSlashMode(null);
        setSlashResults([]);
        setNewMessage('');
    };

    // ──── SEARCH ────
    const handleSearch = async () => {
        if (!business?.id || !searchQuery.trim()) return;
        setSearching(true);
        const results = await chatService.searchMessages(business.id, searchQuery, activeChannelId || undefined);
        setSearchResults(results);
        setSearching(false);
    };

    // ──── START DM ────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startDM = async (emp: any) => {
        if (!business?.id || !user) return;
        const dmId = await chatService.getOrCreateDM(business.id,
            { id: user.uid, name: user.displayName || 'Хэрэглэгч', avatar: user.photoURL || 'Х' },
            { id: emp.userId || emp.id, name: emp.name, avatar: emp.name?.charAt(0) || '?' }
        );
        setActiveChannelId(dmId);
        setShowDMPicker(false);
        setIsSidebarOpen(false);
    };

    // ──── Image upload ────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !business?.id || !activeChannelId || !user) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Зөвхөн зураг оруулна уу');
            return;
        }

        try {
            // We'll use a data URL for simplicity (no Firebase Storage setup needed)
            const reader = new FileReader();
            reader.onload = async () => {
                const dataUrl = reader.result as string;
                await chatService.sendMessage(business.id, activeChannelId!, {
                    text: '📸 Зураг',
                    senderId: user.uid,
                    senderName: user.displayName || 'Хэрэглэгч',
                    avatar: user.photoURL || (user.displayName || 'Х').charAt(0),
                    type: 'image',
                    attachments: [{ type: 'image', url: dataUrl, name: file.name, size: file.size }]
                });
                toast.success('Зураг илгээгдлээ');
            };
            reader.readAsDataURL(file);
        } catch (err) {
            toast.error('Зураг илгээхэд алдаа');
        }
        e.target.value = '';
    };

    const currentChannel = channels.find(c => c.id === activeChannelId);
    const filteredChannels = channels.filter(c =>
        !channelSearch || c.name.toLowerCase().includes(channelSearch.toLowerCase())
    );
    const teamChannels = filteredChannels.filter(c => c.type !== 'dm');
    const dmChannels = filteredChannels.filter(c => c.type === 'dm');

    // Compute unread counts
    const getUnreadCount = useCallback((channel: ChatChannel) => {
        const lastRead = readStates[channel.id];
        if (!lastRead) return channel.lastMessage ? 1 : 0;
        const lastMsg = channel.lastMessageAt;
        if (!lastMsg) return 0;
        const lastMsgDate = lastMsg.toDate ? lastMsg.toDate() : new Date(lastMsg as any);
        return lastMsgDate > lastRead ? 1 : 0;
    }, [readStates]);

    // DM — show other person's name
    const getDMName = useCallback((channel: ChatChannel) => {
        if (!channel.dmParticipants || !user) return channel.name;
        const other = channel.dmParticipants.find(p => p.id !== user.uid);
        return other?.name || channel.name;
    }, [user]);

    if (loading) {
        return (
            <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Чат ачаалж байна...</p>
            </div>
        );
    }

    return (
        <HubLayout hubId="crm-hub">
            <div className="chat-outer-wrap">
            <div className="chat-layout">
                {/* ════════ SIDEBAR ════════ */}
                <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="chat-hero-header">
                        <div className="chat-hero-top">
                            <div className="chat-hero-left">
                                <div className="chat-hero-icon">💬</div>
                                <div>
                                    <h3 className="chat-hero-title">Messenger</h3>
                                    <div className="chat-hero-desc">Багийн харилцаа & мессеж</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="chat-hero-add-btn" title="Суваг үүсгэх" onClick={() => setShowCreateChannel(true)}>
                                    <Plus size={16} />
                                </button>
                                <button className="chat-hero-add-btn show-mobile" onClick={() => setIsSidebarOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="chat-hero-stats">
                            <div className="chat-hero-stat">
                                <div className="chat-hero-stat-value">{teamChannels.length}</div>
                                <div className="chat-hero-stat-label">Сувгууд</div>
                            </div>
                            <div className="chat-hero-stat">
                                <div className="chat-hero-stat-value">{dmChannels.length}</div>
                                <div className="chat-hero-stat-label">Хувийн</div>
                            </div>
                        </div>
                    </div>

                    <div className="chat-sidebar-search">
                        <div className="search-input-wrapper">
                            <Search size={14} />
                            <input placeholder="Хайлт..." value={channelSearch} onChange={e => setChannelSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="chat-channel-list">
                        <div className="chat-channel-group-label">сувгууд</div>
                        {teamChannels.map(c => {
                            const unread = getUnreadCount(c);
                            return (
                                <button key={c.id} className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`}
                                    onClick={() => { setActiveChannelId(c.id); setIsSidebarOpen(false); }}>
                                    <div className={`chat-dm-avatar ${activeChannelId === c.id ? '' : 'neutral-tint'}`}><Hash size={16} /></div>
                                    <span className="chat-channel-name">{c.name}</span>
                                    {unread > 0 && activeChannelId !== c.id && <span className="chat-channel-unread">{unread}</span>}
                                </button>
                            );
                        })}

                        <div className="chat-channel-group-label" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>хувийн мессеж</span>
                            <button className="chat-dm-add-btn" onClick={() => setShowDMPicker(true)} title="Шинэ DM">
                                <Plus size={12} />
                            </button>
                        </div>
                        {dmChannels.map(c => {
                            const unread = getUnreadCount(c);
                            const dmName = getDMName(c);
                            return (
                                <button key={c.id} className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`}
                                    onClick={() => { setActiveChannelId(c.id); setIsSidebarOpen(false); }}>
                                    <div className="chat-dm-avatar">
                                        {dmName?.charAt(0) || '?'}
                                        <div className="online-indicator" />
                                    </div>
                                    <span className="chat-channel-name">{dmName}</span>
                                    {unread > 0 && activeChannelId !== c.id && <span className="chat-channel-unread">{unread}</span>}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* ════════ MAIN CHAT ════════ */}
                <div className="chat-main" onClick={() => { isSidebarOpen && setIsSidebarOpen(false); setContextMenu(null); }}>
                    {currentChannel ? (
                        <>
                            {/* ──── Header ──── */}
                            <div className="chat-main-header">
                                <div className="chat-main-header-left">
                                    <button className="btn btn-ghost btn-icon btn-sm show-mobile"
                                        onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}>
                                        <Menu size={20} />
                                    </button>
                                    <div className="chat-header-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {currentChannel.type === 'dm' ? (
                                                <div className="chat-dm-avatar" style={{ background: 'var(--gradient-secondary)', color: 'white', position: 'relative' }}>
                                                    {getDMName(currentChannel)?.charAt(0)}
                                                    <div className="online-indicator" />
                                                </div>
                                            ) : (
                                                <div className="chat-dm-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                    <Hash size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <h3>{currentChannel.type === 'dm' ? getDMName(currentChannel) : currentChannel.name}</h3>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                                    Онлайн
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-main-header-actions">
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowSearch(!showSearch)} title="Хайлт">
                                        <Search size={18} />
                                    </button>
                                    <button className={`btn btn-ghost btn-icon btn-sm ${showPinned ? 'active' : ''}`}
                                        onClick={() => setShowPinned(!showPinned)} title="Хадгалсан" style={{ position: 'relative' }}>
                                        <Pin size={18} />
                                        {pinnedMessages.length > 0 && (
                                            <span style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pinnedMessages.length}</span>
                                        )}
                                    </button>
                                    <button className={`btn btn-ghost btn-icon btn-sm ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)}>
                                        <Users size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* ──── Search overlay ──── */}
                            {showSearch && (
                                <div className="chat-search-overlay">
                                    <div className="chat-search-bar">
                                        <Search size={16} />
                                        <input placeholder="Зурвас хайх..." value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()} autoFocus />
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="chat-search-results">
                                            {searchResults.map(r => (
                                                <div key={r.id} className="chat-search-result-item">
                                                    <div className="chat-search-result-sender">{r.senderName}</div>
                                                    <div className="chat-search-result-text">{r.text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {searching && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Хайж байна...</div>}
                                </div>
                            )}

                            {/* ──── Pinned Messages Drawer ──── */}
                            {showPinned && pinnedMessages.length > 0 && (
                                <div className="chat-pinned-drawer">
                                    <div className="chat-pinned-header">
                                        <Pin size={14} /> <span>Хадгалсан зурвасууд ({pinnedMessages.length})</span>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPinned(false)}><X size={14} /></button>
                                    </div>
                                    {pinnedMessages.map(pm => (
                                        <div key={pm.id} className="chat-pinned-item">
                                            <strong>{pm.senderName}:</strong> {pm.text}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ──── Messages ──── */}
                            <div className="chat-messages">
                                {messages.length === 0 && (
                                    <div className="chat-empty-msg"><p>Зурвас алга байна. Эхний зурвасаа бичээрэй! 👋</p></div>
                                )}
                                {messages.map((m, idx) => {
                                    if (m.isDeleted) {
                                        return (
                                            <div key={m.id} className="chat-message deleted">
                                                <div className="chat-message-content">
                                                    <div className="chat-message-bubble deleted-bubble">
                                                        <Trash2 size={12} style={{ opacity: 0.4 }} /> <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Энэ зурвас устгагдсан</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const mDate = m.createdAt?.toDate ? m.createdAt.toDate() : (m.createdAt ? new Date(m.createdAt) : new Date());
                                    const prevDate = idx > 0 ? (messages[idx - 1].createdAt?.toDate ? messages[idx - 1].createdAt.toDate() : new Date(messages[idx - 1].createdAt)) : null;
                                    const isSameDay = prevDate && mDate.toDateString() === prevDate.toDateString();
                                    const isOwn = m.senderId === user?.uid;

                                    return (
                                        <div key={m.id}>
                                            {!isSameDay && (
                                                <div className="date-separator">
                                                    <div className="date-separator-line" />
                                                    <span className="date-separator-label">
                                                        {mDate.toLocaleDateString('mn-MN', { month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`chat-message ${isOwn ? 'own' : ''}`}
                                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ msg: m, x: e.clientX, y: e.clientY }); }}>
                                                {!isOwn && (
                                                    <div className="chat-message-avatar">
                                                        {typeof m.avatar === 'string' && m.avatar.includes('http') ? (
                                                            <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
                                                        ) : (
                                                            <span>{m.avatar}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="chat-message-content">
                                                    {!isOwn && <div className="chat-message-sender">{m.senderName}</div>}

                                                    {/* Reply preview */}
                                                    {m.replyTo && (
                                                        <div className="chat-reply-preview">
                                                            <Reply size={12} />
                                                            <span className="chat-reply-name">{m.replyTo.senderName}</span>
                                                            <span className="chat-reply-text">{m.replyTo.text}</span>
                                                        </div>
                                                    )}

                                                    {/* Message bubble */}
                                                    <div className={`chat-message-bubble ${m.type === 'entity_link' ? 'entity-link-bubble' : ''}`}>
                                                        {m.type === 'entity_link' && m.entityLink ? (
                                                            <div className="chat-entity-link" onClick={() => {
                                                                if (m.entityLink?.type === 'order') window.location.href = '/app/orders';
                                                                else if (m.entityLink?.type === 'product') window.location.href = '/app/products';
                                                            }}>
                                                                {m.entityLink.type === 'order' ? <ShoppingCart size={14} /> : <Package size={14} />}
                                                                <span>{m.text}</span>
                                                            </div>
                                                        ) : m.type === 'image' && m.attachments?.[0] ? (
                                                            <img src={m.attachments[0].url} alt="img" className="chat-msg-image" onClick={() => window.open(m.attachments?.[0].url, '_blank')} />
                                                        ) : (
                                                            m.text
                                                        )}
                                                        {m.isEdited && <span className="chat-edited-badge">(засагдсан)</span>}
                                                    </div>

                                                    {/* Reactions */}
                                                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                                                        <div className="chat-reactions-bar">
                                                            {Object.entries(m.reactions).map(([emoji, users]) => (
                                                                users.length > 0 && (
                                                                    <button key={emoji} className={`chat-reaction-chip ${users.includes(user?.uid || '') ? 'own' : ''}`}
                                                                        onClick={(e) => { e.stopPropagation(); if (business?.id && activeChannelId && user) {
                                                                            if (users.includes(user.uid)) chatService.removeReaction(business.id, activeChannelId, m.id, emoji, user.uid);
                                                                            else chatService.addReaction(business.id, activeChannelId, m.id, emoji, user.uid);
                                                                        }}}>
                                                                        {emoji} <span>{users.length}</span>
                                                                    </button>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Pin badge */}
                                                    {m.isPinned && <span className="chat-pin-badge"><Pin size={10} /> PIN</span>}

                                                    <div className="chat-message-time">
                                                        {mDate.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>

                                                    {/* Hover actions */}
                                                    <div className="chat-msg-actions">
                                                        <button onClick={(e) => { e.stopPropagation(); setShowReactions(showReactions === m.id ? null : m.id); }} title="Reaction"><Smile size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setReplyTo(m); inputRef.current?.focus(); }} title="Хариулах"><Reply size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setContextMenu({ msg: m, x: e.clientX, y: e.clientY }); }} title="Бусад"><MoreHorizontal size={14} /></button>
                                                    </div>

                                                    {/* Reaction picker */}
                                                    {showReactions === m.id && (
                                                        <div className="chat-reaction-picker" onClick={e => e.stopPropagation()}>
                                                            {REACTION_EMOJIS.map(emoji => (
                                                                <button key={emoji} onClick={() => {
                                                                    if (business?.id && activeChannelId && user)
                                                                        chatService.addReaction(business.id, activeChannelId, m.id, emoji, user.uid);
                                                                    setShowReactions(null);
                                                                }}>{emoji}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ──── Context Menu ──── */}
                            {contextMenu && (
                                <div className="chat-context-menu" style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 200) }}
                                    onClick={e => e.stopPropagation()}>
                                    <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); }}>
                                        <Reply size={14} /> Хариулах
                                    </button>
                                    <button onClick={() => {
                                        if (business?.id && activeChannelId) chatService.togglePin(business.id, activeChannelId, contextMenu.msg.id);
                                        setContextMenu(null);
                                    }}>
                                        <Pin size={14} /> {contextMenu.msg.isPinned ? 'Unpin' : 'Pin хийх'}
                                    </button>
                                    {contextMenu.msg.senderId === user?.uid && (
                                        <>
                                            <button onClick={() => { setEditingMsg(contextMenu.msg); setNewMessage(contextMenu.msg.text); setContextMenu(null); inputRef.current?.focus(); }}>
                                                <Edit3 size={14} /> Засах
                                            </button>
                                            <button className="danger" onClick={() => {
                                                if (business?.id && activeChannelId && user)
                                                    chatService.deleteMessage(business.id, activeChannelId, contextMenu.msg.id, user.uid);
                                                setContextMenu(null);
                                            }}>
                                                <Trash2 size={14} /> Устгах
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => { navigator.clipboard.writeText(contextMenu.msg.text); toast.success('Хуулагдлаа'); setContextMenu(null); }}>
                                        📋 Хуулах
                                    </button>
                                </div>
                            )}

                            {/* ──── Reply Preview ──── */}
                            {replyTo && (
                                <div className="chat-reply-bar">
                                    <Reply size={14} />
                                    <div className="chat-reply-bar-content">
                                        <strong>{replyTo.senderName}</strong>-д хариулж байна
                                        <div className="chat-reply-bar-text">{replyTo.text.slice(0, 60)}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setReplyTo(null)}><X size={14} /></button>
                                </div>
                            )}

                            {/* ──── Edit indicator ──── */}
                            {editingMsg && (
                                <div className="chat-reply-bar" style={{ borderLeft: '3px solid #f59e0b' }}>
                                    <Edit3 size={14} />
                                    <div className="chat-reply-bar-content">
                                        <strong>Зурвас засаж байна</strong>
                                    </div>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingMsg(null); setNewMessage(''); }}><X size={14} /></button>
                                </div>
                            )}

                            {/* ──── Slash command results ──── */}
                            {slashMode && slashResults.length > 0 && (
                                <div className="chat-slash-results">
                                    <div className="chat-slash-header">
                                        {slashMode === 'order' ? <ShoppingCart size={14} /> : <Package size={14} />}
                                        <span>{slashMode === 'order' ? 'Захиалга хайлт' : 'Бараа хайлт'}</span>
                                    </div>
                                    {slashResults.map((r: any) => (
                                        <button key={r.id} className="chat-slash-item" onClick={() => sendEntityLink(r)}>
                                            {slashMode === 'order' ? (
                                                <>{r.orderNumber} — {r.customer?.name} — ₮{(r.financials?.totalAmount || 0).toLocaleString()}</>
                                            ) : (
                                                <>{r.name} — ₮{(r.pricing?.sellingPrice || 0).toLocaleString()}</>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {slashMode && slashLoading && (
                                <div className="chat-slash-results"><div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)' }}>Хайж байна...</div></div>
                            )}

                            {/* ──── Input ──── */}
                            <div className="chat-input-bar">
                                <div className="chat-input-container">
                                    <label className="btn btn-ghost btn-icon btn-sm" style={{ cursor: 'pointer' }}>
                                        <Paperclip size={20} style={{ opacity: 0.6 }} />
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    </label>
                                    <input ref={inputRef} className="chat-input"
                                        placeholder={editingMsg ? 'Зурвас засах...' : slashMode ? (slashMode === 'order' ? 'Захиалга хайх...' : 'Бараа хайх...') : `${currentChannel.type === 'dm' ? getDMName(currentChannel) : currentChannel.name} руу бичих... (/order, /бараа)`}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    />
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowReactions('input')}><Smile size={20} style={{ opacity: 0.6 }} /></button>
                                </div>
                                <button className="chat-send-btn" onClick={handleSend} disabled={!newMessage.trim()}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty-state premium-empty-state">
                            <div className="premium-empty-icon-wrapper">
                                <div className="premium-empty-icon-glow"></div>
                                <Hash size={40} className="premium-empty-icon" />
                            </div>
                            <h3 className="text-gradient font-black" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Messenger-д тавтай морил</h3>
                            <p style={{ fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                                Зүүн талын цэснээс суваг эсвэл харилцагч сонгоод харилцааг эхлүүлээрэй.
                            </p>
                        </div>
                    )}
                </div>

                {/* ════════ RIGHT INFO SIDEBAR ════════ */}
                {showInfo && currentChannel && (
                    <aside className="chat-info-sidebar animate-slide-in">
                        <div className="chat-sidebar-header">
                            <h3 style={{ fontSize: '1.1rem' }}>Мэдээлэл</h3>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowInfo(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div className="chat-dm-avatar" style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 16px', borderRadius: 24, background: 'var(--gradient-primary)', color: 'white' }}>
                                {currentChannel.type === 'dm' ? getDMName(currentChannel)?.charAt(0) : '#'}
                            </div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentChannel.type === 'dm' ? getDMName(currentChannel) : currentChannel.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {currentChannel.type === 'general' ? 'Нийтийн суваг' : currentChannel.type === 'team' ? 'Багийн суваг' : currentChannel.type === 'dm' ? 'Хувийн мессеж' : 'Зарлал суваг'}
                            </p>
                        </div>
                        <div className="pro-nav-divider" />
                        <div style={{ padding: '16px' }}>
                            <div className="chat-channel-group-label">Үйлдлүүд</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button className="pro-nav-item" onClick={() => setShowPinned(!showPinned)}><Pin size={16} /> Хадгалсан зурвасууд ({pinnedMessages.length})</button>
                                <button className="pro-nav-item" onClick={() => setShowSearch(!showSearch)}><Search size={16} /> Зурвас хайх</button>
                            </div>
                            {currentChannel.type !== 'dm' && (
                                <>
                                    <div className="chat-channel-group-label" style={{ marginTop: 20 }}>Гишүүд</div>
                                    {employees.map(emp => (
                                        <div key={emp.id} className="pro-nav-item" style={{ fontSize: '0.85rem' }}>
                                            <div className="chat-dm-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{emp.name?.charAt(0)}</div>
                                            <span>{emp.name}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </aside>
                )}
            </div>
            </div>

            {/* ════════ CREATE CHANNEL MODAL ════════ */}
            {showCreateChannel && (
                <div className="chat-modal-backdrop" onClick={() => setShowCreateChannel(false)}>
                    <div className="chat-modal" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16, fontWeight: 800, fontSize: '1.1rem' }}>➕ Шинэ суваг үүсгэх</h3>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4 }}>Сувгийн нэр</label>
                            <input className="input" placeholder="жишээ: хүргэлт" value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                            <button className={`chat-type-btn ${newChannelType === 'team' ? 'active' : ''}`}
                                onClick={() => setNewChannelType('team')}>Багийн</button>
                            <button className={`chat-type-btn ${newChannelType === 'announcement' ? 'active' : ''}`}
                                onClick={() => setNewChannelType('announcement')}>Зарлал</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowCreateChannel(false)}>Цуцлах</button>
                            <button className="btn btn-primary" disabled={!newChannelName.trim()} onClick={async () => {
                                if (business?.id && newChannelName.trim()) {
                                    await chatService.createChannel(business.id, {
                                        name: newChannelName.trim(),
                                        type: newChannelType,
                                        icon: 'Hash',
                                        createdBy: user?.uid
                                    });
                                    setShowCreateChannel(false);
                                    setNewChannelName('');
                                    toast.success('Суваг үүсгэгдлээ!');
                                }
                            }}>Үүсгэх</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════ DM PICKER MODAL ════════ */}
            {showDMPicker && (
                <div className="chat-modal-backdrop" onClick={() => setShowDMPicker(false)}>
                    <div className="chat-modal" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16, fontWeight: 800, fontSize: '1.1rem' }}>👤 Шинэ хувийн мессеж</h3>
                        {employees.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>Ажилтан олдсонгүй</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {employees.map(emp => (
                                    <button key={emp.id} className="chat-dm-pick-btn" onClick={() => startDM(emp)}>
                                        <div className="chat-dm-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                            {emp.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.position || emp.role || ''}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </HubLayout>
    );
}
