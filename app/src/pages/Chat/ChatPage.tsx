import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Search, Hash, Users, Bell, Pin, Loader2, X, Menu, Plus } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { chatService } from '../../services/db';
import { HubLayout } from '../../components/common/HubLayout';
import './ChatPage.css';

interface Channel {
    id: string;
    name: string;
    type: 'general' | 'team' | 'dm';
    icon: string;
    unread?: number;
    lastMessage?: string;
}

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    avatar: string;
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: any;
}

export function ChatPage() {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [channelSearch, setChannelSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch channels
    useEffect(() => {
        if (!business?.id) return;

        const unsubscribe = chatService.subscribeChannels(business.id, async (data) => {
            if (data.length === 0 && !loading) {
                // Initializing default channel if none exist
                try {
                    await chatService.createChannel(business.id, {
                        name: 'general',
                        type: 'general',
                        icon: 'Hash'
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
    }, [business?.id, loading]);

    // Fetch messages for active channel
    useEffect(() => {
        if (!business?.id || !activeChannelId) return;

        setMessages([]);
        const unsubscribe = chatService.subscribeMessages(business.id, activeChannelId, (data) => {
            setMessages(data);
        });

        return () => unsubscribe();
    }, [business?.id, activeChannelId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async () => {
        if (!newMessage.trim() || !business?.id || !activeChannelId || !user) return;

        const text = newMessage;
        setNewMessage('');

        try {
            await chatService.sendMessage(business.id, activeChannelId, {
                text,
                senderId: user.uid,
                senderName: user.displayName || 'Хэрэглэгч',
                avatar: user.photoURL || (user.displayName || 'Х').charAt(0)
            });
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const currentChannel = channels.find(c => c.id === activeChannelId);

    const filteredChannels = channels.filter(c =>
        !channelSearch || c.name.toLowerCase().includes(channelSearch.toLowerCase())
    );

    const teamChannels = filteredChannels.filter(c => c.type !== 'dm');
    const dmChannels = filteredChannels.filter(c => c.type === 'dm');

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
            <div className="chat-layout">
                {/* Channel sidebar */}
                <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="chat-sidebar-header">
                        <h3>
                            <div className="chat-premium-icon-wrap">
                                <span className="chat-premium-icon">💬</span>
                            </div>
                            <span className="text-gradient font-black">Messenger</span>
                        </h3>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                className="btn btn-ghost btn-icon btn-sm"
                                title="Суваг үүсгэх"
                                onClick={async () => {
                                    const name = prompt('Сувгийн нэр:');
                                    if (name && business?.id) {
                                        await chatService.createChannel(business.id, {
                                            name: name.toLowerCase(),
                                            type: 'team',
                                            icon: 'Hash'
                                        });
                                    }
                                }}
                            >
                                <Plus size={18} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm show-mobile" onClick={() => setIsSidebarOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="chat-sidebar-search">
                        <div className="search-input-wrapper">
                            <Search size={14} />
                            <input
                                placeholder="Хайлт..."
                                value={channelSearch}
                                onChange={e => setChannelSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="chat-channel-list">
                        <div className="chat-channel-group-label">сувгууд</div>
                        {teamChannels.map(c => (
                            <button
                                key={c.id}
                                className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveChannelId(c.id);
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <div className={`chat-dm-avatar ${activeChannelId === c.id ? '' : 'neutral-tint'}`}>
                                    <Hash size={16} />
                                </div>
                                <span className="chat-channel-name">{c.name}</span>
                                {(c.unread || 0) > 0 && <span className="chat-channel-unread">{c.unread}</span>}
                            </button>
                        ))}

                        <div className="chat-channel-group-label" style={{ marginTop: 12 }}>хувийн мессеж</div>
                        {dmChannels.map(c => (
                            <button
                                key={c.id}
                                className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveChannelId(c.id);
                                    setIsSidebarOpen(false);
                                }}
                            >
                                <div className="chat-dm-avatar">
                                    {c.icon || (c.name?.charAt(0) || '?')}
                                    <div className="online-indicator" />
                                </div>
                                <span className="chat-channel-name">{c.name}</span>
                                {(c.unread || 0) > 0 && <span className="chat-channel-unread">{c.unread}</span>}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Chat main */}
                <div className="chat-main" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
                    {currentChannel ? (
                        <>
                            <div className="chat-main-header">
                                <div className="chat-main-header-left">
                                    <button
                                        className="btn btn-ghost btn-icon btn-sm show-mobile"
                                        onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
                                    >
                                        <Menu size={20} />
                                    </button>
                                    <div className="chat-header-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {currentChannel.type === 'dm' ? (
                                                <div className="chat-dm-avatar" style={{ background: 'var(--gradient-secondary)', color: 'white', position: 'relative' }}>
                                                    {currentChannel.icon || currentChannel.name?.charAt(0)}
                                                    <div className="online-indicator" />
                                                </div>
                                            ) : (
                                                <div className="chat-dm-avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                    <Hash size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <h3>{currentChannel.name}</h3>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                                    Онлайн
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-main-header-actions">
                                    <button className="btn btn-ghost btn-icon btn-sm hide-mobile"><Search size={18} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm"><Pin size={18} /></button>
                                    <button
                                        className={`btn btn-ghost btn-icon btn-sm ${showInfo ? 'active' : ''}`}
                                        onClick={() => setShowInfo(!showInfo)}
                                    >
                                        <Users size={18} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm"><Bell size={18} /></button>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.length === 0 && (
                                    <div className="chat-empty-msg">
                                        <p>Зурвас алга байна. Эхний зурвасаа бичээрэй! 👋</p>
                                    </div>
                                )}
                                {messages.map((m, idx) => {
                                    const mDate = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
                                    const prevDate = idx > 0 ? (messages[idx - 1].createdAt?.toDate ? messages[idx - 1].createdAt.toDate() : new Date(messages[idx - 1].createdAt)) : null;

                                    const isSameDay = prevDate && mDate.toDateString() === prevDate.toDateString();

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
                                            <div className={`chat-message ${m.senderId === user?.uid ? 'own' : ''}`}>
                                                {m.senderId !== user?.uid && (
                                                    <div className="chat-message-avatar">
                                                        {typeof m.avatar === 'string' && m.avatar.includes('http') ? (
                                                            <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit' }} />
                                                        ) : (
                                                            <span>{m.avatar}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="chat-message-content">
                                                    {m.senderId !== user?.uid && <div className="chat-message-sender">{m.senderName}</div>}
                                                    <div className="chat-message-bubble">
                                                        {m.text}
                                                    </div>
                                                    <div className="chat-message-time">
                                                        {mDate.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-bar">
                                <div className="chat-input-container">
                                    <button className="btn btn-ghost btn-icon btn-sm"><Paperclip size={20} style={{ opacity: 0.6 }} /></button>
                                    <input
                                        className="chat-input"
                                        placeholder={`${currentChannel.name || 'канал'} руу бичих...`}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    />
                                    <button className="btn btn-ghost btn-icon btn-sm"><Smile size={20} style={{ opacity: 0.6 }} /></button>
                                </div>
                                <button
                                    className="chat-send-btn"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                >
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

                {/* Right Sidebar (Info) */}
                {showInfo && currentChannel && (
                    <aside className="chat-info-sidebar animate-slide-in">
                        <div className="chat-sidebar-header">
                            <h3 style={{ fontSize: '1.1rem' }}>Мэдээлэл</h3>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowInfo(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div className="chat-dm-avatar" style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 16px', borderRadius: 24, background: 'var(--gradient-primary)', color: 'white' }}>
                                {currentChannel.icon || currentChannel.name?.charAt(0)}
                            </div>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currentChannel.name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {currentChannel.type === 'general' ? 'Нийтийн суваг' : currentChannel.type === 'team' ? 'Багийн суваг' : 'Хувийн мессеж'}
                            </p>
                        </div>

                        <div className="pro-nav-divider" />

                        <div style={{ padding: '16px' }}>
                            <div className="chat-channel-group-label">Үйлдлүүд</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button className="pro-nav-item"><Bell size={16} /> Мэдэгдэл унтраах</button>
                                <button className="pro-nav-item"><Pin size={16} /> Хадгалсан зурвасууд</button>
                                <button className="pro-nav-item"><Paperclip size={16} /> Хуваалцсан файлууд</button>
                            </div>

                            <div className="chat-channel-group-label" style={{ marginTop: 20 }}>Гишүүд (1)</div>
                            <div className="pro-nav-item">
                                <div className="chat-dm-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>Б</div>
                                <span>Бүх гишүүд харах</span>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </HubLayout>
    );
}
