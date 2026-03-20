import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Send, Search, MessageSquare, X, Copy, Check, Loader2, Save,
    ExternalLink, Settings, Link2, Shield, Tag, StickyNote,
    Zap, User, CreditCard, DollarSign, ChevronDown, XCircle, CheckCircle,
    Smile, Paperclip, Image as ImageIcon, ShoppingBag, Bot, Mic, ArrowRight, ArrowLeft, ChevronUp,
    Phone, Crown, Clock, Plus, Trash2
} from 'lucide-react';
import { useBusinessStore, useAuthStore, useUIStore } from '../../store';
import { fbMessengerService, type FbConversation, type FbMessage, type FbSettings, type FbCannedResponse, type FbPageConfig, type AiMode, type AiScheduleEntry } from '../../services/fbMessengerService';
import toast from 'react-hot-toast';
import { CreateInquiryModal } from '../StockInquiry/CreateInquiryModal';
import './FacebookMessengerPage.css';

type ConvFilter = 'all' | 'unread' | 'open' | 'closed';
type SettingsTab = 'connection' | 'ai' | 'canned';

const DEFAULT_CANNED: FbCannedResponse[] = [
    { key: '/баярлалаа', text: 'Баярлалаа! Манай дэлгүүрээр зочлоорой 🙏' },
    { key: '/захиалга', text: 'Захиалга өгөхийн тулд манай дэлгүүрээр зочилно уу!' },
    { key: '/хаяг', text: 'Бидний хаяг: ...' },
    { key: '/цаг', text: 'Ажлын цаг: Даваа-Баасан 09:00-18:00' },
    { key: '/холбоо', text: 'Холбоо барих утас: ...' },
];

const EMOJI_QUICK = ['👍', '❤️', '😊', '🙏', '🔥', '✅', '📦', '💳', '🎉', '👋', '😍', '🤔'];

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
    const [mobileChat, setMobileChat] = useState(false);
    const [convFilter, setConvFilter] = useState<ConvFilter>('all');
    const [loading, setLoading] = useState(true);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [showCanned, setShowCanned] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDesc, setPaymentDesc] = useState('');
    const [sendingPayment, setSendingPayment] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('connection');
    const [editingCanned, setEditingCanned] = useState<FbCannedResponse[]>([]);
    const [newCannedKey, setNewCannedKey] = useState('');
    const [newCannedText, setNewCannedText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Settings
    const [settings, setSettings] = useState<FbSettings | null>(null);
    const [settingsForm, setSettingsForm] = useState({ pageId: '', pageName: '', pageAccessToken: '' });
    const [savingSettings, setSavingSettings] = useState(false);
    const [copied, setCopied] = useState('');
    const [cannedResponses, setCannedResponses] = useState<FbCannedResponse[]>(DEFAULT_CANNED);

    // Multi-page
    const [selectedPageId, setSelectedPageId] = useState<string>('all');
    const [showPageDropdown, setShowPageDropdown] = useState(false);

    // Notes editing
    const [editingNotes, setEditingNotes] = useState('');
    const notesTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Customer intelligence
    const [customerData, setCustomerData] = useState<{
        phone?: string;
        isVip?: boolean;
        vipCategoryName?: string;
        orderCount: number;
        totalSpent: number;
        recentOrders: Array<{ id: string; number: string; status: string; total: number; date: Date | null }>;
        loading: boolean;
    }>({ orderCount: 0, totalSpent: 0, recentOrders: [], loading: false });

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
        const pageFilter = selectedPageId === 'all' ? undefined : selectedPageId;
        const unsub = fbMessengerService.subscribeConversations(business.id, (convs) => { setConversations(convs); setLoading(false); }, pageFilter);
        return () => unsub();
    }, [business?.id, selectedPageId]);

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

    // Fetch customer intelligence when switching conversation
    useEffect(() => {
        if (!business?.id || !activeConvId || !activeConv) { setCustomerData({ orderCount: 0, totalSpent: 0, recentOrders: [], loading: false }); return; }
        let cancelled = false;
        setCustomerData(prev => ({ ...prev, loading: true }));

        (async () => {
            try {
                const { collection: fsCollection, query: fsQuery, where: fsWhere, orderBy: fsOrderBy, limit: fsLimit, getDocs } = await import('firebase/firestore');
                const { db: fsDb } = await import('../../services/firebase');
                const senderName = activeConv.senderName || '';

                // Search orders by customer name
                let phone = '';
                let orderCount = 0;
                let totalSpent = 0;
                const recentOrders: typeof customerData.recentOrders = [];

                // Try to find orders matching this sender
                const ordersRef = fsCollection(fsDb, 'businesses', business.id, 'orders');
                const oq = fsQuery(ordersRef, fsOrderBy('createdAt', 'desc'), fsLimit(200));
                const orderSnap = await getDocs(oq);

                for (const od of orderSnap.docs) {
                    const o = od.data();
                    if (o.isDeleted) continue;
                    const customerName = (o.customer?.name || '').toLowerCase();
                    const customerPhone = o.customer?.phone || '';
                    const senderLower = senderName.toLowerCase();

                    // Match by name (contains) or exact PSID match
                    if (customerName && senderLower && (
                        customerName.includes(senderLower) || senderLower.includes(customerName)
                    )) {
                        if (!phone && customerPhone) phone = customerPhone;
                        orderCount++;
                        totalSpent += o.financials?.totalAmount || 0;
                        if (recentOrders.length < 5) {
                            recentOrders.push({
                                id: od.id,
                                number: o.orderNumber || od.id.substring(0, 8),
                                status: o.status || 'pending',
                                total: o.financials?.totalAmount || 0,
                                date: o.createdAt?.toDate?.() || null,
                            });
                        }
                    }
                }

                // Check VIP membership
                let isVip = false;
                let vipCategoryName = '';
                if (phone) {
                    const cleanPhone = phone.replace(/[^\d]/g, '');
                    const memRef = fsCollection(fsDb, 'businesses', business.id, 'memberships');
                    const mq = fsQuery(memRef, fsWhere('phone', '==', cleanPhone), fsLimit(1));
                    const memSnap = await getDocs(mq);
                    if (!memSnap.empty) {
                        const memData = memSnap.docs[0].data();
                        if (memData.status === 'active') {
                            isVip = true;
                            vipCategoryName = memData.categoryName || 'VIP';
                        }
                    }
                }

                if (!cancelled) {
                    setCustomerData({ phone, isVip, vipCategoryName, orderCount, totalSpent, recentOrders, loading: false });
                }
            } catch (err) {
                console.debug('[Messenger] Customer data lookup failed:', err);
                if (!cancelled) setCustomerData({ orderCount: 0, totalSpent: 0, recentOrders: [], loading: false });
            }
        })();

        return () => { cancelled = true; };
    }, [business?.id, activeConvId]);

    // ═══ Handlers ═══
    const handleSend = async () => {
        if (!newMessage.trim() || !business?.id || !activeConvId || sending) return;
        const text = newMessage;
        setNewMessage('');
        setShowCanned(false);
        setShowEmojiPicker(false);
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
            // Merge current page into pages array
            const existingPages = settings?.pages || [];
            let updatedPages = [...existingPages];
            if (settingsForm.pageId) {
                const idx = updatedPages.findIndex(p => p.pageId === settingsForm.pageId);
                const pageConfig = { pageId: settingsForm.pageId, pageName: settingsForm.pageName, pageAccessToken: settingsForm.pageAccessToken, isActive: true };
                if (idx >= 0) { updatedPages[idx] = pageConfig; } else { updatedPages.push(pageConfig); }
            }
            await fbMessengerService.saveSettings(business.id, {
                ...settingsForm, verifyToken,
                isConnected: !!settingsForm.pageAccessToken,
                connectedAt: settingsForm.pageAccessToken ? new Date() : undefined,
                pages: updatedPages,
            });
            setSettings({ ...settingsForm, verifyToken, isConnected: !!settingsForm.pageAccessToken, connectedAt: settingsForm.pageAccessToken ? new Date() : undefined, pages: updatedPages });
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

    const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !business?.id || !activeConvId) return;
        // For now just send as text placeholder — real implementation would upload to storage
        toast.success(`📷 ${file.name} — Зураг илгээх (удахгүй нэмэгдэнэ)`);
        e.target.value = '';
    };

    const handleAddCanned = () => {
        if (!newCannedKey || !newCannedText) return;
        const key = newCannedKey.startsWith('/') ? newCannedKey : `/${newCannedKey}`;
        const updated = [...editingCanned, { key, text: newCannedText }];
        setEditingCanned(updated);
        setNewCannedKey('');
        setNewCannedText('');
    };

    const handleSaveCanned = async () => {
        if (!business?.id) return;
        await fbMessengerService.saveCannedResponses(business.id, editingCanned);
        setCannedResponses(editingCanned);
        toast.success('Түргэн хариулт хадгалагдлаа!');
    };

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
        const now = new Date();
        const y = new Date(now); y.setDate(now.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return 'Өчигдөр';
        return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
    };

    // Display name: if raw FB PSID (all digits, 15+ chars), show friendly fallback
    const displayName = (name: string | undefined) => {
        if (!name) return 'Хэрэглэгч';
        if (/^\d{15,}$/.test(name)) return 'Хэрэглэгч';
        return name;
    };

    // Auto-resolve FB PSID names → real names via Graph API
    const resolvedRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!business?.id || !conversations.length) return;
        for (const c of conversations) {
            if (c.senderName && /^\d{15,}$/.test(c.senderName) && !resolvedRef.current.has(c.id)) {
                resolvedRef.current.add(c.id);
                fetch('/api/fb-send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bizId: business.id, recipientId: c.id, action: 'resolve_name' }),
                }).catch(() => {});
            }
        }
    }, [business?.id, conversations]);

    const getDateLabel = (d: Date | null) => {
        if (!d) return '';
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Өнөөдөр';
        const y = new Date(now); y.setDate(now.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return 'Өчигдөр';
        return d.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const messagesWithDates = useMemo(() => {
        const result: Array<{ type: 'date'; label: string } | { type: 'msg'; msg: FbMessage; grouped: boolean; groupFirst: boolean; groupLast: boolean }> = [];
        let lastDate = '';
        for (let i = 0; i < messages.length; i++) {
            const m = messages[i];
            const dl = getDateLabel(m.timestamp);
            if (dl && dl !== lastDate) { result.push({ type: 'date', label: dl }); lastDate = dl; }
            const prev = i > 0 ? messages[i - 1] : null;
            const next = i < messages.length - 1 ? messages[i + 1] : null;
            const sameAsPrev = prev && prev.direction === m.direction && prev.senderId === m.senderId;
            const sameAsNext = next && next.direction === m.direction && next.senderId === m.senderId;
            result.push({ type: 'msg', msg: m, grouped: !!sameAsPrev, groupFirst: !sameAsPrev && !!sameAsNext, groupLast: !!sameAsPrev && !sameAsNext });
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

    // Derive effective AI mode from per-page settings (overrides global)
    const effectiveAiMode = (() => {
        const p = settings?.pages || [];
        if (p.length > 0) {
            const modes = p.map(pg => (pg as any).aiMode || 'manual');
            if (modes.some(m => m === 'auto')) return 'auto';
            if (modes.some(m => m === 'assist')) return 'assist';
            return 'manual';
        }
        return settings?.aiMode || 'manual';
    })();
    const aiModeLabel = effectiveAiMode === 'auto' ? '🟢 AI Auto' : effectiveAiMode === 'assist' ? '🟡 AI Туслах' : null;
    const pages = settings?.pages || [];
    const selectedPageName = selectedPageId === 'all'
        ? (pages.length > 1 ? `Бүгд (${pages.length})` : (pages[0]?.pageName || settings?.pageName || 'Facebook Page'))
        : (pages.find(p => p.pageId === selectedPageId)?.pageName || settings?.pageName || 'Page');

    // ═══ RENDER ═══
    return (
        <div className="fbm-page animate-fade-in">
            {/* ── Compact Toolbar ── */}
            <div className="fbm-toolbar">
                <div className="fbm-toolbar-left">
                    <div className="fbm-toolbar-icon"><MessageSquare size={16} /></div>
                    <div className="fbm-toolbar-text">
                        <span className="fbm-toolbar-title">Messenger</span>
                        <span className="fbm-toolbar-sub">
                            <span className={`fbm-dot ${settings?.isConnected ? 'connected' : ''}`} />
                            {pages.length > 1 ? (
                                <span className="fbm-page-selector" onClick={() => setShowPageDropdown(!showPageDropdown)}>
                                    {selectedPageName} <ChevronDown size={12} />
                                    {showPageDropdown && (
                                        <div className="fbm-page-dropdown">
                                            <div className={`fbm-page-opt ${selectedPageId === 'all' ? 'active' : ''}`} onClick={() => { setSelectedPageId('all'); setShowPageDropdown(false); }}>📋 Бүгд ({pages.length})</div>
                                            {pages.map(p => (
                                                <div key={p.pageId} className={`fbm-page-opt ${selectedPageId === p.pageId ? 'active' : ''}`} onClick={() => { setSelectedPageId(p.pageId); setShowPageDropdown(false); }}>
                                                    📱 {p.pageName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </span>
                            ) : (selectedPageName)}
                            {aiModeLabel && <span className="fbm-ai-toolbar-badge">{aiModeLabel}</span>}
                        </span>
                    </div>
                </div>
                <div className="fbm-toolbar-right">
                    {totalUnread > 0 && <span className="fbm-toolbar-badge">{totalUnread}</span>}
                    <button className="fbm-toolbar-btn" onClick={() => setShowDrawer(true)} title="Тохиргоо"><Settings size={16} /></button>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className={`fbm-main ${showInfoPanel && activeConv ? 'with-info' : ''} ${mobileChat && activeConvId ? 'mobile-chat' : ''}`}>
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
                            <div className="fbm-skeleton-list">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="fbm-skeleton-row">
                                        <div className="fbm-skeleton-avatar" />
                                        <div className="fbm-skeleton-lines">
                                            <div className="fbm-skeleton-line w60" />
                                            <div className="fbm-skeleton-line w80" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConvs.length === 0 ? (
                            <div className="fbm-conv-empty">{convFilter !== 'all' ? 'Шүүлтэд тохирох алга' : settings?.isConnected ? '📭 Мессеж ирээгүй' : '⚙️ Тохиргоо хийнэ үү'}</div>
                        ) : filteredConvs.map(c => (
                            <button key={c.id} className={`fbm-conv-row ${activeConvId === c.id ? 'active' : ''}`}
                                onClick={() => { setActiveConvId(c.id); setMobileChat(true); }}>
                                <div className="fbm-conv-avatar">
                                    {c.senderProfilePic ? <img src={c.senderProfilePic} alt="" /> : (c.senderName?.charAt(0) || '?')}
                                    <span className="fbm-online-dot" />
                                </div>
                                <div className="fbm-conv-info">
                                    <div className="fbm-conv-name">
                                        {displayName(c.senderName)}
                                        {c.tags?.includes('VIP') && <span className="fbm-mini-tag blue">VIP</span>}
                                        {c.tags?.includes('Яаралтай') && <span className="fbm-mini-tag red">❗</span>}
                                    </div>
                                    <div className="fbm-conv-preview">
                                        {c.lastMessage && messages.length > 0 && c.id === activeConvId ? '' : ''}
                                        {c.lastMessage}
                                        {selectedPageId === 'all' && pages.length > 1 && c.pageName && <span className="fbm-page-badge">{c.pageName}</span>}
                                    </div>
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
                                    <button className="fbm-back-btn" onClick={() => { setMobileChat(false); }}>
                                        <ArrowLeft size={16} />
                                    </button>
                                    <div className="fbm-conv-avatar lg">
                                        {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                    </div>
                                    <div>
                                        <div className="fbm-chat-name">{displayName(activeConv.senderName)}</div>
                                        <div className="fbm-chat-platform">
                                        <span className="fbm-dot connected" /> Facebook Messenger
                                        {activeConv.pageName && <span className="fbm-page-badge">{activeConv.pageName}</span>}
                                    </div>
                                    </div>
                                </div>
                                <div className="fbm-chat-header-actions">
                                    <button className="fbm-toolbar-btn chat" onClick={() => setShowInquiryModal(true)} title="Бараа шалгах / Лавлагаа үүсгэх">
                                        <MessageSquare size={15} />
                                    </button>
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
                                    <div key={item.msg.id} className={[
                                        'fbm-msg', item.msg.direction,
                                        item.msg.isPostback ? 'postback' : '',
                                        item.msg.isAI ? 'ai-msg' : '',
                                        item.grouped ? 'grouped' : '',
                                        item.groupFirst ? 'group-first' : '',
                                        item.groupLast ? 'group-last' : '',
                                        'msg-animate'
                                    ].filter(Boolean).join(' ')}>
                                        {item.msg.direction === 'inbound' && (
                                            <div className="fbm-msg-av">
                                                {activeConv.senderProfilePic ? <img src={activeConv.senderProfilePic} alt="" /> : (activeConv.senderName?.charAt(0) || '?')}
                                            </div>
                                        )}
                                        {item.msg.isAI && item.msg.direction === 'outbound' && (
                                            <div className="fbm-msg-av ai-av"><Bot size={14} /></div>
                                        )}
                                        <div className="fbm-msg-content">
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
                                                {item.msg.isAI && <span className="fbm-ai-badge" title="AI хариулсан">🤖</span>}
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

                            {/* AI Suggestion Bar */}
                            {activeConv?.aiSuggestion && (
                                <div className="fbm-ai-suggestion">
                                    <div className="fbm-ai-suggestion-header">
                                        <span><Bot size={14} /> AI санал болгож байна:</span>
                                        <div className="fbm-ai-suggestion-actions">
                                            <button className="fbm-ai-approve" onClick={async () => {
                                                try {
                                                    await fbMessengerService.sendAISuggestion(business!.id, activeConvId!, activeConv.aiSuggestion!);
                                                    toast.success('AI хариу илгээгдлээ');
                                                } catch { toast.error('Алдаа гарлаа'); }
                                            }}><CheckCircle size={14} /> Батлах</button>
                                            <button className="fbm-ai-reject" onClick={async () => {
                                                await fbMessengerService.clearAISuggestion(business!.id, activeConvId!);
                                            }}><XCircle size={14} /> Үгүйсгэх</button>
                                        </div>
                                    </div>
                                    <div className="fbm-ai-suggestion-text">{activeConv.aiSuggestion}</div>
                                </div>
                            )}

                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <div className="fbm-emoji-picker">
                                    {EMOJI_QUICK.map(e => (
                                        <button key={e} className="fbm-emoji-btn" onClick={() => { setNewMessage(prev => prev + e); setShowEmojiPicker(false); }}>
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="fbm-input">
                                <button className="fbm-input-action" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji"><Smile size={18} /></button>
                                <button className="fbm-input-action" onClick={() => fileInputRef.current?.click()} title="Файл хавсаргах"><Paperclip size={18} /></button>
                                <input type="file" ref={fileInputRef} hidden accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleSendImage} />
                                <textarea className="fbm-input-text" placeholder="Мессеж бичих... ( / түргэн хариу)" value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); setShowCanned(e.target.value.startsWith('/')); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    rows={1} disabled={sending} />
                                <button className={`fbm-send ${sending ? 'sending' : ''}`} onClick={handleSend} disabled={!newMessage.trim() || sending}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </>
                    ) : (
                        /* ── Empty State ── */
                        <div className="fbm-empty">
                            {settings?.isConnected ? (
                                <>
                                    <div className="fbm-empty-icon connected"><MessageSquare size={32} /></div>
                                    <h3>Бэлэн!</h3>
                                    <p>Зүүн талаас харилцагч сонгоно уу</p>
                                    <div className="fbm-empty-stats">
                                        <div className="fbm-empty-stat">
                                            <span className="fbm-empty-stat-value">{conversations.length}</span>
                                            <span className="fbm-empty-stat-label">Харилцагч</span>
                                        </div>
                                        <div className="fbm-empty-stat">
                                            <span className="fbm-empty-stat-value">{totalUnread}</span>
                                            <span className="fbm-empty-stat-label">Уншаагүй</span>
                                        </div>
                                        <div className="fbm-empty-stat">
                                            <span className="fbm-empty-stat-value">{effectiveAiMode === 'auto' ? '🟢' : effectiveAiMode === 'assist' ? '🟡' : '🔴'}</span>
                                            <span className="fbm-empty-stat-label">AI горим</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="fbm-empty-icon"><MessageSquare size={32} /></div>
                                    <h3>Facebook Messenger</h3>
                                    <p>Page-ээ холбож чатаа эхлүүлээрэй</p>
                                    <div className="fbm-setup-steps">
                                        <div className="fbm-setup-step">
                                            <div className="fbm-step-num">1</div>
                                            <div>
                                                <strong>Page Token авах</strong>
                                                <span>Facebook Developer → Graph API Explorer</span>
                                            </div>
                                        </div>
                                        <div className="fbm-setup-step">
                                            <div className="fbm-step-num">2</div>
                                            <div>
                                                <strong>Webhook тохируулах</strong>
                                                <span>Facebook App → Webhooks → Callback URL</span>
                                            </div>
                                        </div>
                                        <div className="fbm-setup-step">
                                            <div className="fbm-step-num">3</div>
                                            <div>
                                                <strong>Тохиргоо хадгалах</strong>
                                                <span>Доорх товч дарж Token, Page ID оруулах</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="fbm-empty-btn" onClick={() => setShowDrawer(true)}>
                                        <Settings size={16} /> Тохиргоо хийх
                                    </button>
                                </>
                            )}
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

                        {/* Stats */}
                        <div className="fbm-info-section">
                            {customerData.loading ? (
                                <div style={{ textAlign: 'center', padding: 12, color: '#999', fontSize: '0.8rem' }}>
                                    <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: 4 }} /> Мэдээлэл ачаалж байна...
                                </div>
                            ) : (
                                <>
                                    {/* Phone */}
                                    {customerData.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                                            <Phone size={14} style={{ color: '#22c55e' }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{customerData.phone}</span>
                                        </div>
                                    )}

                                    {/* VIP Status */}
                                    {customerData.isVip && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 8,
                                            background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(245,158,11,0.05))',
                                            borderRadius: 10, border: '1px solid rgba(234,179,8,0.2)',
                                        }}>
                                            <Crown size={14} style={{ color: '#eab308' }} />
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>VIP Гишүүн</span>
                                            {customerData.vipCategoryName && (
                                                <span style={{ fontSize: '0.7rem', color: '#92400e', opacity: 0.7 }}>• {customerData.vipCategoryName}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats Grid */}
                                    <div className="fbm-info-stats-grid" style={{ marginTop: 8 }}>
                                        <div className="fbm-info-stat-card">
                                            <span className="fbm-info-stat-value">{messages.length}</span>
                                            <span className="fbm-info-stat-label">Мессеж</span>
                                        </div>
                                        <div className="fbm-info-stat-card">
                                            <span className="fbm-info-stat-value">{customerData.orderCount}</span>
                                            <span className="fbm-info-stat-label">Захиалга</span>
                                        </div>
                                        <div className="fbm-info-stat-card">
                                            <span className="fbm-info-stat-value">
                                                {customerData.totalSpent > 0 ? `₮${(customerData.totalSpent / 1000).toFixed(0)}k` : '0'}
                                            </span>
                                            <span className="fbm-info-stat-label">Нийт дүн</span>
                                        </div>
                                    </div>

                                    {/* Recent Orders */}
                                    {customerData.recentOrders.length > 0 && (
                                        <div style={{ marginTop: 12 }}>
                                            <div className="fbm-info-label" style={{ marginBottom: 6 }}>
                                                <ShoppingBag size={12} /> Сүүлийн захиалгууд
                                            </div>
                                            {customerData.recentOrders.map(o => (
                                                <div key={o.id} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.78rem',
                                                }}>
                                                    <div>
                                                        <span style={{ fontWeight: 600 }}>#{o.number}</span>
                                                        <span style={{
                                                            marginLeft: 6, padding: '1px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 600,
                                                            background: o.status === 'completed' || o.status === 'delivered' ? 'rgba(34,197,94,0.1)' :
                                                                o.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)',
                                                            color: o.status === 'completed' || o.status === 'delivered' ? '#22c55e' :
                                                                o.status === 'pending' ? '#eab308' : '#3b82f6',
                                                        }}>
                                                            {o.status === 'pending' ? 'Хүлээгдэж буй' : o.status === 'confirmed' ? 'Баталсан' :
                                                                o.status === 'completed' ? 'Дуусан' : o.status === 'delivered' ? 'Хүргэсэн' :
                                                                o.status === 'sourced' ? 'Олсон' : o.status === 'arrived' ? 'Ирсэн' : o.status}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>₮{o.total.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="fbm-info-section">
                            <div className="fbm-info-label"><Zap size={12} /> Хурдан үйлдэл</div>
                            <div className="fbm-quick-actions">
                                <button className="fbm-quick-action" onClick={() => toggleTag('VIP')}>
                                    ⭐ {activeConv.tags?.includes('VIP') ? 'VIP хасах' : 'VIP тэмдэглэх'}
                                </button>
                                <button className="fbm-quick-action" onClick={() => setShowPaymentModal(true)}>
                                    💳 Төлбөр илгээх
                                </button>
                                <button className="fbm-quick-action" onClick={toggleConvStatus}>
                                    {activeConv.status === 'open' ? '🔒 Хаах' : '🔓 Нээх'}
                                </button>
                            </div>
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

                        {/* Single section — Connection only. AI/Хариулт moved to Тохиргоо → Залгаасууд */}

                        <div className="fbm-drawer-body">
                            {/* ── Connection Settings ── */}
                                <>
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
                                            {copied === 'url' ? <Check size={14} /> : <Copy size={14} />}
                                        </div>
                                        {settings?.verifyToken && (
                                            <>
                                                <div className="fbm-drawer-sublabel">Verify Token</div>
                                                <div className="fbm-copyable" onClick={() => copyText(settings.verifyToken, 'token')}>
                                                    <code>{settings.verifyToken}</code>
                                                    {copied === 'token' ? <Check size={14} /> : <Copy size={14} />}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="fbm-drawer-section">
                                        <div className="fbm-drawer-section-title"><Settings size={14} /> Access Token</div>
                                        <p className="fbm-drawer-hint">
                                            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
                                                Graph API Explorer <ExternalLink size={11} />
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
                                    {/* Connected Pages list */}
                                    {pages.length > 0 && (
                                        <div className="fbm-drawer-section">
                                            <div className="fbm-drawer-section-title">📱 Холбогдсон Page-үүд ({pages.length})</div>
                                            <div className="fbm-pages-list">
                                                {pages.map(p => (
                                                    <div key={p.pageId} className={`fbm-page-item ${p.pageId === settingsForm.pageId ? 'editing' : ''}`}>
                                                        <div className="fbm-page-item-info">
                                                            <span className="fbm-page-item-name">{p.pageName || p.pageId}</span>
                                                            <span className="fbm-page-item-id">{p.pageId}</span>
                                                        </div>
                                                        <div className="fbm-page-item-actions">
                                                            <button className="fbm-page-edit-btn" onClick={() => setSettingsForm({ pageId: p.pageId, pageName: p.pageName, pageAccessToken: p.pageAccessToken })} title="Засах">✏️</button>
                                                            {pages.length > 1 && (
                                                                <button className="fbm-page-remove-btn" onClick={async () => {
                                                                    if (!business?.id) return;
                                                                    await fbMessengerService.removePage(business.id, p.pageId);
                                                                    setSettings(prev => prev ? { ...prev, pages: (prev.pages || []).filter(x => x.pageId !== p.pageId) } : prev);
                                                                    toast.success('Page устгагдлаа');
                                                                }} title="Устгах"><XCircle size={14} /></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="fbm-add-page-btn" onClick={() => setSettingsForm({ pageId: '', pageName: '', pageAccessToken: '' })}>
                                                + Шинэ Page нэмэх
                                            </button>
                                        </div>
                                    )}
                                </>
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

            {/* ── Inquiry Modal ── */}
            {showInquiryModal && activeConvId && (
                <CreateInquiryModal
                    fbUserId={activeConvId}
                    onClose={() => setShowInquiryModal(false)}
                />
            )}
        </div>
    );
}
