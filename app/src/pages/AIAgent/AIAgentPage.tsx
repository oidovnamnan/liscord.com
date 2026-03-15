import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Brain, Zap, BarChart3, Bot, ChevronDown, AlertTriangle, Send, Loader2, Target, ShieldCheck, Package, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuthStore, useBusinessStore } from '../../store';
import { globalSettingsService } from '../../services/adminService';
import { sendChatMessage, type ChatMessage, type BusinessContext } from '../../services/ai/aiChatService';
import { productService, customerService, teamService } from '../../services/db';
import { orderService } from '../../services/db';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Product, Order, Customer } from '../../types';
import toast from 'react-hot-toast';
import './AIAgentPage.css';

interface Message {
    id: string;
    role: 'bot' | 'user';
    text: string;
    timestamp: Date;
}

/** Lightweight markdown → HTML for chat bubbles */
function renderMarkdown(text: string): string {
    return text
        // Headers
        .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:0.95rem">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:1rem">$1</h3>')
        .replace(/^# (.+)$/gm, '<h3 style="margin:10px 0 6px;font-size:1.05rem">$1</h3>')
        // Bold + Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Bullet lists (- or • or *)
        .replace(/^[\-\•\*] (.+)$/gm, '<li style="margin-left:16px;list-style:disc">$1</li>')
        // Numbered lists
        .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:16px;list-style:decimal">$2</li>')
        // Line breaks
        .replace(/\n/g, '<br/>');
}

const MODEL_MAP: Record<string, string> = {
    'gemini-2.5': 'gemini-2.5-flash',
    'gemini-2.0': 'gemini-2.0-flash',
    'gemini-1.5': 'gemini-1.5-pro',
};

export const AIAgentPage: React.FC = () => {
    const { user } = useAuthStore();
    const { business } = useBusinessStore();
    const [activeModel, setActiveModel] = useState('gemini-2.5');
    const [autoFallback, setAutoFallback] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [bizContext, setBizContext] = useState<BusinessContext>({});
    const [dataLoaded, setDataLoaded] = useState(false);
    const [vipCount, setVipCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: 'Сайн байна уу! 🧠 Би Liscord Super Brain — таны бизнесийн ухаалаг туслах. Бодит дата дээр суурилж шинжилгээ хийх, зөвлөгөө өгөхөд бэлэн. Та надаас юу ч асууж болно!',
            timestamp: new Date()
        }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch Gemini API key
    useEffect(() => {
        globalSettingsService.getSettings().then(settings => {
            if (settings.geminiApiKey) setGeminiApiKey(settings.geminiApiKey);
        });
    }, []);

    // Load real business data for AI context
    useEffect(() => {
        if (!business?.id) return;
        const bizId = business.id;
        let products: Product[] = [];
        let orders: Order[] = [];
        let customers: Customer[] = [];
        let loaded = 0;

        const buildContext = () => {
            loaded++;
            if (loaded < 3) return;

            const activeOrders = orders.filter(o => o.status !== 'cancelled');
            const totalRevenue = activeOrders.reduce((s, o) => s + (o.financials?.totalAmount || 0), 0);
            const today = new Date().toDateString();
            const recentOrdersToday = orders.filter(o => {
                const d = o.createdAt instanceof Date ? o.createdAt : new Date();
                return d.toDateString() === today;
            }).length;
            const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
            const lowStockProducts = products
                .filter(p => p.productType !== 'preorder' && (p.stock?.quantity ?? 0) <= 5 && (p.stock?.quantity ?? 0) >= 0)
                .slice(0, 10)
                .map(p => `${p.name} (${p.stock?.quantity ?? 0}ш)`);

            const productSales: Record<string, number> = {};
            orders.forEach(o => {
                o.items?.forEach(item => {
                    const name = item.name || '';
                    if (name) productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
                });
            });
            const topProducts = Object.entries(productSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, qty]) => `${name} (${qty}ш)`);

            const categories = [...new Set(products.map(p => p.categoryName).filter(Boolean))] as string[];

            // Build full data tables for AI
            const productTable = products.map(p =>
                `• ${p.name} | Үнэ: ₮${(p.pricing?.salePrice || 0).toLocaleString()} | Өртөг: ₮${(p.pricing?.costPrice || 0).toLocaleString()} | Үлдэгдэл: ${p.stock?.quantity ?? 0}ш | Ангилал: ${p.categoryName || '—'} | Төрөл: ${p.productType === 'preorder' ? 'Урьдчилсан' : 'Бэлэн'} | Борлуулсан: ${p.stats?.totalSold ?? 0}ш`
            ).join('\n');

            const orderTable = orders.slice(0, 30).map(o => {
                const items = o.items?.map(i => `${i.name}(${i.quantity}ш)`).join(', ') || '—';
                return `• #${o.orderNumber} | Хэрэглэгч: ${o.customer?.name || '—'} (${o.customer?.phone || '—'}) | Бараа: ${items} | Дүн: ₮${(o.financials?.totalAmount || 0).toLocaleString()} | Төлбөр: ${o.paymentStatus} | Статус: ${o.status}`;
            }).join('\n');

            const customerTable = customers.slice(0, 50).map((c: Customer) =>
                `• ${c.name} | Утас: ${c.phone || '—'} | Нийт захиалга: ${c.stats?.totalOrders ?? 0} | Нийт зарцуулсан: ₮${(c.stats?.totalSpent ?? 0).toLocaleString()} | Өр: ₮${(c.stats?.totalDebt ?? 0).toLocaleString()}`
            ).join('\n');

            setBizContext({
                businessName: business.name,
                totalProducts: products.length,
                totalCustomers: customers.length,
                totalOrders: orders.length,
                totalRevenue,
                averageOrderValue: activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0,
                recentOrdersToday,
                pendingOrders,
                lowStockProducts,
                topProducts,
                productCategories: categories,
                productTable,
                orderTable,
                customerTable,
            });
            setDataLoaded(true);
        };

        const unsub1 = productService.subscribeProducts(bizId, (p) => { products = p; buildContext(); });
        const unsub2 = orderService.subscribeOrders(bizId, (o) => { orders = o; buildContext(); });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsub3 = customerService.subscribeCustomers(bizId, (c: any) => { customers = c; buildContext(); });

        return () => { unsub1(); unsub2(); unsub3(); };
    }, [business?.id, business?.name]);

    // Load VIP memberships count
    useEffect(() => {
        if (!business?.id) return;
        const unsub = onSnapshot(
            collection(db, 'businesses', business.id, 'memberships'),
            (snap) => {
                const now = new Date();
                const active = snap.docs.filter(d => {
                    const data = d.data();
                    const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);
                    return expiresAt >= now;
                });
                setVipCount(active.length);
            }
        );
        return () => unsub();
    }, [business?.id]);

    // Load employees count
    useEffect(() => {
        if (!business?.id) return;
        const unsub = teamService.subscribeEmployees(business.id, (employees) => {
            setEmployeeCount(employees.filter(e => !e.isDeleted).length);
        });
        return () => unsub();
    }, [business?.id]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (text: string = inputText) => {
        if (!text.trim()) return;
        if (!geminiApiKey) {
            toast.error('AI API Key тохируулаагүй байна. Super Admin → Тохиргоо хэсгээс нэмнэ үү.');
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const history: ChatMessage[] = messages
                .filter(m => m.id !== '1')
                .map(m => ({
                    role: m.role === 'bot' ? 'model' as const : 'user' as const,
                    text: m.text
                }));

            const modelId = MODEL_MAP[activeModel] || 'gemini-2.5-flash';
            const response = await sendChatMessage(geminiApiKey, text, history, bizContext, modelId);

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: response,
                timestamp: new Date()
            }]);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'AI хариулт авахад алдаа гарлаа.';
            toast.error(msg);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: `⚠️ ${msg}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleActionToggle = (name: string, value: boolean) => {
        toast.success(`${name} ${value ? 'идэвхжлээ' : 'идэвхгүй боллоо'}`, {
            icon: value ? '🚀' : '🔒',
            style: {
                borderRadius: '12px',
                background: 'var(--surface-1)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-secondary)'
            }
        });
    };

    return (
        <div className="ai-agent-container animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            {/* ── Premium AI Hero ── */}
            <div className="ai-hero">
                <div className="ai-hero-top">
                    <div className="ai-hero-left">
                        <div className="ai-hero-icon"><Brain size={24} /></div>
                        <div>
                            <div className="ai-hero-badge"><Sparkles size={10} /> Liscord Brain v3.0 Super</div>
                            <h1 className="ai-hero-title">🧠 Super Brain</h1>
                            <div className="ai-hero-desc">Таны бизнесийн ухаалаг тархи, ко-пилот туслах</div>
                        </div>
                    </div>
                </div>
                <div className="ai-hero-stats">
                    <div className="ai-hero-stat">
                        <div className="ai-hero-stat-value">{bizContext.totalProducts ?? '—'}</div>
                        <div className="ai-hero-stat-label">Бараа</div>
                    </div>
                    <div className="ai-hero-stat">
                        <div className="ai-hero-stat-value">{bizContext.totalOrders ?? '—'}</div>
                        <div className="ai-hero-stat-label">Захиалга</div>
                    </div>
                    <div className="ai-hero-stat">
                        <div className="ai-hero-stat-value">{bizContext.totalCustomers ?? '—'}</div>
                        <div className="ai-hero-stat-label">Хэрэглэгч</div>
                    </div>
                    <div className="ai-hero-stat">
                        <div className="ai-hero-stat-value">{vipCount}</div>
                        <div className="ai-hero-stat-label">VIP гишүүн</div>
                    </div>
                    <div className="ai-hero-stat">
                        <div className="ai-hero-stat-value">{employeeCount}</div>
                        <div className="ai-hero-stat-label">Ажилчид</div>
                    </div>
                </div>
            </div>

            {/* Neural Activity Strip */}
            <div className="neural-strip">
                <div className="neural-dot" />
                <span style={{ fontWeight: 700, color: dataLoaded ? 'var(--success)' : 'var(--text-muted)' }}>
                    {dataLoaded ? 'LIVE DATA' : 'LOADING...'}
                </span>
                <div className="neural-bar"><div className="neural-bar-fill" /></div>
                <span>{bizContext.businessName || 'Neural Activity'}</span>
                <Brain size={14} style={{ color: 'var(--primary)' }} />
            </div>

            <div className="ai-layout-grid">
                <section className="ai-main-chat-window">
                    <div className="chat-window-header">
                        <div className="model-selector-group">
                            <div className="model-selector">
                                <Bot size={18} className="text-primary" />
                                <select
                                    value={activeModel}
                                    onChange={(e) => setActiveModel(e.target.value)}
                                    className="model-select-input"
                                >
                                    <option value="gemini-2.5">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.0">Gemini 2.0 Flash</option>
                                    <option value="gemini-1.5">Gemini 1.5 Pro</option>
                                </select>
                                <ChevronDown size={14} className="selector-icon" />
                            </div>
                            <div className="ai-compute-load">
                                {dataLoaded
                                    ? <ShieldCheck size={12} style={{ color: 'var(--success)' }} />
                                    : <Loader2 size={12} className="animate-spin text-primary" />
                                }
                                <span>{dataLoaded ? `✓ ${bizContext.totalProducts} бараа · Бэлэн` : 'Дата ачаалж байна...'}</span>
                            </div>
                        </div>

                        <div className="fallback-toggle-wrapper" onClick={() => {
                            setAutoFallback(!autoFallback);
                            handleActionToggle('Лимит хамгаалалт', !autoFallback);
                        }}>
                            <div className={`fallback-indicator ${autoFallback ? 'active' : ''}`}>
                                {autoFallback ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                            </div>
                            <span className="fallback-label">
                                Auto-Fallback
                            </span>
                        </div>
                    </div>

                    <div className="chat-scroll-area">
                        {messages.map((m) => (
                            <div key={m.id} className={`chat-bubble ${m.role}-bubble`}>
                                <div className="bubble-avatar">
                                    {m.role === 'bot' ? <Brain size={18} /> : (user?.displayName?.charAt(0) || 'U')}
                                </div>
                                <div className="bubble-content-wrap">
                                    <div className="bubble-content">
                                        {m.role === 'bot'
                                            ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                                            : m.text
                                        }
                                        {m.role === 'bot' && m.id === '1' && autoFallback && (
                                            <div className="fallback-notice-mini">
                                                <Zap size={10} /> Хамгаалалт идэвхтэй
                                            </div>
                                        )}
                                    </div>
                                    <span className="bubble-time">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-bubble bot-bubble">
                                <div className="bubble-avatar animate-pulse"><Brain size={18} /></div>
                                <div className="bubble-content typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <div className="chat-input-box">
                            <input
                                type="text"
                                placeholder="Туслахаас асуух..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className="send-prompt-btn" onClick={() => handleSendMessage()}>
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="chat-suggestions">
                            {[
                                { t: 'Борлуулалтын тайлан гарга', i: <BarChart3 size={14} /> },
                                { t: 'Үлдэгдэл бага барааг мэдэгд', i: <Package size={14} /> },
                                { t: 'Маркетингийн зөвлөгөө өг', i: <TrendingUp size={14} /> },
                                { t: 'Facebook пост бичүүл', i: <MessageSquare size={14} /> },
                                { t: 'Шилдэг борлуулалттай бараа', i: <Target size={14} /> },
                                { t: 'Бизнесийн зөвлөгөө өг', i: <Sparkles size={14} /> },
                            ].map((s, idx) => (
                                <button key={idx} className="suggestion-chip" onClick={() => handleSendMessage(s.t)}>
                                    {s.i} {s.t}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="ai-sidebar-widgets">
                    <section className="widget-card premium-card-glow">
                        <div className="widget-header">
                            <div className="header-icon-box"><Brain size={18} /></div>
                            <h3>Бодит Мэдээлэл</h3>
                        </div>
                        <div className="widget-body">
                            <div className="ai-task-premium">
                                <div className="task-icon-box blue"><BarChart3 size={16} /></div>
                                <div className="task-info">
                                    <div className="task-title-row">
                                        <span className="task-name">Нийт орлого</span>
                                        <span className="task-percent">
                                            {bizContext.totalRevenue != null ? `₮${Math.round(bizContext.totalRevenue).toLocaleString()}` : '—'}
                                        </span>
                                    </div>
                                    <div className="task-progress-bar"><div className="progress-fill blue" style={{ width: '65%' }}></div></div>
                                    <span className="task-meta">
                                        Өнөөдөр: {bizContext.recentOrdersToday ?? 0} захиалга | Хүлээгдэж: {bizContext.pendingOrders ?? 0}
                                    </span>
                                </div>
                            </div>
                            <div className="ai-task-premium">
                                <div className="task-icon-box orange"><Zap size={16} /></div>
                                <div className="task-info">
                                    <div className="task-title-row">
                                        <span className="task-name">Нөөцийн анхааруулга</span>
                                        {(bizContext.lowStockProducts?.length ?? 0) > 0 && (
                                            <span className="task-tag">Critical</span>
                                        )}
                                    </div>
                                    <div className="task-progress-bar">
                                        <div className="progress-fill orange" style={{ width: `${Math.min((bizContext.lowStockProducts?.length ?? 0) * 15, 100)}%` }}></div>
                                    </div>
                                    <span className="task-meta">
                                        {(bizContext.lowStockProducts?.length ?? 0) > 0
                                            ? `${bizContext.lowStockProducts!.length} бараа үлдэгдэл бага`
                                            : 'Бүх бараа хангалттай'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: 16, padding: '10px 20px', width: '100%', whiteSpace: 'nowrap' }}
                            onClick={() => handleSendMessage('Миний бизнесийн бүрэн тойм шинжилгээ хий')}
                        >
                            Дэлгэрэнгүй шинжилгээ
                        </button>
                    </section>

                    <section className="widget-card action-widget">
                        <div className="widget-header">
                            <div className="header-icon-box purple"><Sparkles size={18} /></div>
                            <h3>Автомат Үйлдлүүд</h3>
                        </div>
                        <p className="widget-desc">AI Agent-д тусгай эрх өгч автомат үйлдэл хийлгэх.</p>
                        <div className="action-toggles-premium">
                            <div className="premium-toggle-card">
                                <div className="toggle-info">
                                    <span className="toggle-name">Бараа дуусахад захиалга бэлдэх</span>
                                    <span className="toggle-sub">Smart Reordering</span>
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle-switch-ios"
                                    defaultChecked
                                    onChange={(e) => handleActionToggle('Smart Reordering', e.target.checked)}
                                />
                            </div>
                            <div className="premium-toggle-card">
                                <div className="toggle-info">
                                    <span className="toggle-name">Төлбөр хэтэрсэн үед сануулах</span>
                                    <span className="toggle-sub">Payment Follow-up</span>
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle-switch-ios"
                                    onChange={(e) => handleActionToggle('Payment Follow-up', e.target.checked)}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
