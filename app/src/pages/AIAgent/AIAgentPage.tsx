import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Brain, Zap, BarChart3, Bot, ChevronDown, AlertTriangle, Send, Loader2, Target, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';
import './AIAgentPage.css';

interface Message {
    id: string;
    role: 'bot' | 'user';
    text: string;
    timestamp: Date;
}

export const AIAgentPage: React.FC = () => {
    const { user } = useAuthStore();
    const [activeModel, setActiveModel] = useState('gpt-4');
    const [autoFallback, setAutoFallback] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: 'Сайн байна уу? Би танай бизнесийн дата дээр шинжилгээ хийж, борлуулалтыг өсгөхөд бэлэн байна. Та надаас юу ч асууж болно.',
            timestamp: new Date()
        }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = (text: string = inputText) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Mock AI Thinking
        setTimeout(() => {
            let response = '';
            if (text.includes('орлого')) {
                response = 'Энэ сарын нийт орлого өнгөрсөн сарын мөн үеэс 12%-иар өссөн байна. Хамгийн идэвхтэй борлуулалттай өдөр нь өнгөрсөн Баасан гараг байлаа.';
            } else if (text.includes('үлдэгдэл') || text.includes('бараа')) {
                response = 'Одоогоор 3 төрлийн бараа (iPhone 15 Case, USB-C Cable, Screen Protector) нөөц дуусаж байна. Автомат захиалга бэлдэх үү?';
            } else if (text.includes('тайлан')) {
                response = 'За, би сүүлийн 7 хоногийн борлуулалтын дэлгэрэнгүй тайланг бэлдлээ. Таны имэйл рүү илгээх үү?';
            } else {
                response = 'Ойлголлоо. Таны хүсэлтийн дагуу би өгөгдлийг шалгаж байна. Өөр туслах зүйл байна уу?';
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
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
        <div className="ai-agent-container page">
            <header className="ai-agent-header">
                <div className="ai-header-content">
                    <div className="ai-badge-premium"><Sparkles size={14} /> Liscord Brain v2.5 Premium</div>
                    <h1 className="text-gradient-ai">Antigravity AI Agent</h1>
                    <p>Таны бизнесийн ухаалаг тархи, ко-пилот туслах</p>
                </div>
                <div className="ai-header-stats">
                    <div className="stat-card">
                        <div className="stat-value text-success glow-text">99.9%</div>
                        <div className="stat-label">Uptime</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value pulse-text">240+</div>
                        <div className="stat-label">Мэдрэлийн зангилаа</div>
                    </div>
                </div>
                <div className="header-decoration"></div>
            </header>

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
                                    <option value="gpt-4">GPT-4 Turbo (Үндсэн)</option>
                                    <option value="claude-3">Claude 3.5 Sonnet</option>
                                    <option value="gemini-1.5">Gemini 1.5 Pro</option>
                                </select>
                                <ChevronDown size={14} className="selector-icon" />
                            </div>
                            <div className="ai-compute-load">
                                <Loader2 size={12} className="animate-spin text-primary" />
                                <span>3.2ms Latency</span>
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
                                        {m.text}
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
                                { t: 'Тайлан гаргах', i: <BarChart3 size={14} /> },
                                { t: 'Барааны үлдэгдэл шалгах', i: <Target size={14} /> },
                                { t: 'Шинэ пост бичүүлэх', i: <Sparkles size={14} /> }
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
                            <h3>Ухаалаг Анализ</h3>
                        </div>
                        <div className="widget-body">
                            <div className="ai-task-premium">
                                <div className="task-icon-box blue"><BarChart3 size={16} /></div>
                                <div className="task-info">
                                    <div className="task-title-row">
                                        <span className="task-name">Борлуулалтын таамаглал</span>
                                        <span className="task-percent">+15.2%</span>
                                    </div>
                                    <div className="task-progress-bar"><div className="progress-fill blue" style={{ width: '65%' }}></div></div>
                                    <span className="task-meta">Борлуулалт ирэх сард өсөх хандлагатай</span>
                                </div>
                            </div>
                            <div className="ai-task-premium">
                                <div className="task-icon-box orange"><Zap size={16} /></div>
                                <div className="task-info">
                                    <div className="task-title-row">
                                        <span className="task-name">Нөөцийн оновчлол</span>
                                        <span className="task-tag">Critical</span>
                                    </div>
                                    <div className="task-progress-bar"><div className="progress-fill orange" style={{ width: '90%' }}></div></div>
                                    <span className="task-meta">3 барааны үлдэгдэл 5-аас доош орсон</span>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-secondary w-full mt-6 py-3">Дэлгэрэнгүй шинжилгээ</button>
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
