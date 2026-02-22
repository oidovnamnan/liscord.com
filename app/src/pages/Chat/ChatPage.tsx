import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Search, Hash, Users, Bell, Pin, Loader2 } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { chatService } from '../../services/db';
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
    createdAt: Date;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch channels
    useEffect(() => {
        if (!business?.id) return;

        const unsubscribe = chatService.subscribeChannels(business.id, (data) => {
            setChannels(data);
            if (data.length > 0 && !activeChannelId) {
                setActiveChannelId(data[0].id);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

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
            <div className="loading-screen">
                <Loader2 className="animate-spin" size={32} />
                <p>Чат ачаалж байна...</p>
            </div>
        );
    }

    return (
        <>
            <div className="chat-layout">
                {/* Channel sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <h3>💬 Чат</h3>
                    </div>
                    <div className="chat-sidebar-search">
                        <Search size={14} />
                        <input placeholder="Хайх..." value={channelSearch} onChange={e => setChannelSearch(e.target.value)} />
                    </div>

                    <div className="chat-channel-group">
                        <div className="chat-channel-group-label">Сувгууд</div>
                        {teamChannels.map(c => (
                            <button key={c.id} className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`} onClick={() => setActiveChannelId(c.id)}>
                                <Hash size={16} />
                                <span className="chat-channel-name">{c.name}</span>
                                {(c.unread || 0) > 0 && <span className="chat-channel-unread">{c.unread}</span>}
                            </button>
                        ))}
                    </div>

                    <div className="chat-channel-group">
                        <div className="chat-channel-group-label">Хувийн мессеж</div>
                        {dmChannels.map(c => (
                            <button key={c.id} className={`chat-channel-btn ${activeChannelId === c.id ? 'active' : ''}`} onClick={() => setActiveChannelId(c.id)}>
                                <div className="chat-dm-avatar">{c.icon || (c.name?.charAt(0) || '?')}</div>
                                <span className="chat-channel-name">{c.name}</span>
                                {(c.unread || 0) > 0 && <span className="chat-channel-unread">{c.unread}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat main */}
                <div className="chat-main">
                    {currentChannel ? (
                        <>
                            <div className="chat-main-header">
                                <div className="chat-main-header-left">
                                    {currentChannel.type === 'dm' ? (
                                        <div className="chat-dm-avatar-lg">{currentChannel.icon || currentChannel.name?.charAt(0)}</div>
                                    ) : (
                                        <Hash size={20} />
                                    )}
                                    <h3>{currentChannel.name}</h3>
                                </div>
                                <div className="chat-main-header-actions">
                                    <button className="btn btn-ghost btn-icon btn-sm"><Pin size={16} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm"><Users size={16} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm"><Bell size={16} /></button>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.map(m => (
                                    <div key={m.id} className={`chat-message ${m.senderId === user?.uid ? 'own' : ''}`}>
                                        {m.senderId !== user?.uid && <div className="chat-message-avatar">{m.avatar}</div>}
                                        <div className="chat-message-content">
                                            {m.senderId !== user?.uid && <div className="chat-message-sender">{m.senderName}</div>}
                                            <div className="chat-message-bubble">{m.text}</div>
                                            <div className="chat-message-time">
                                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="chat-input-bar">
                                <button className="btn btn-ghost btn-icon btn-sm"><Paperclip size={18} /></button>
                                <input
                                    className="chat-input"
                                    placeholder={`${currentChannel.name} суваг руу бичих...`}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                />
                                <button className="btn btn-ghost btn-icon btn-sm"><Smile size={18} /></button>
                                <button className="btn btn-primary btn-icon btn-sm" onClick={handleSend} disabled={!newMessage.trim()}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty-state">
                            <Hash size={48} />
                            <h3>Суваг сонгоно уу</h3>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
