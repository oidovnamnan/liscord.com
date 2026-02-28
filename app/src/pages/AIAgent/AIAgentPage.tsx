import React, { useState } from 'react';
import { Sparkles, Brain, Zap, BarChart3, Bot, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import './AIAgentPage.css';

export const AIAgentPage: React.FC = () => {
    const [activeModel, setActiveModel] = useState('gpt-4');
    const [autoFallback, setAutoFallback] = useState(true);

    return (
        <div className="ai-agent-container page">
            <header className="ai-agent-header">
                <div className="ai-header-content">
                    <div className="ai-badge"><Sparkles size={14} /> Liscord Brain v2.0</div>
                    <h1>Antigravity AI Agent</h1>
                    <p>Таны бизнесийн ухаалаг тархи, ко-пилот туслах</p>
                </div>
                <div className="ai-header-stats">
                    <div className="stat-card">
                        <div className="stat-value text-success">99.9%</div>
                        <div className="stat-label">Uptime</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">120+</div>
                        <div className="stat-label">Автоматжуулалт</div>
                    </div>
                </div>
            </header>

            <div className="ai-layout-grid">
                <section className="ai-main-chat-window">
                    <div className="chat-window-header">
                        <div className="model-selector">
                            <Bot size={18} className="text-primary" />
                            <select
                                value={activeModel}
                                onChange={(e) => setActiveModel(e.target.value)}
                                className="model-select-input"
                            >
                                <option value="gpt-4">GPT-4 Turbo (Үндсэн)</option>
                                <option value="claude-3">Claude 3 Opus</option>
                                <option value="gemini-1.5">Gemini 1.5 Pro</option>
                            </select>
                            <ChevronDown size={14} className="selector-icon" />
                        </div>

                        <div className="fallback-toggle-wrapper" onClick={() => setAutoFallback(!autoFallback)}>
                            <div className={`fallback-indicator ${autoFallback ? 'active' : ''}`}>
                                {autoFallback ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                            </div>
                            <span className="fallback-label" title="Хэрэглээний лимит дуусвал автоматаар өөр модел руу шилжих">
                                Auto-Fallback
                            </span>
                        </div>
                    </div>

                    <div className="chat-scroll-area">
                        <div className="chat-bubble bot-bubble">
                            <div className="bubble-avatar"><Brain size={16} /></div>
                            <div className="bubble-content">
                                Сайн байна уу? Би танай бизнесийн дата дээр шинжилгээ хийж, борлуулалтыг өсгөхөд бэлэн байна.
                                {autoFallback && <div className="fallback-notice mt-2 text-xs text-primary/70">✨ Лимит хамгаалалт (Auto-Fallback) идэвхтэй байна.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="chat-input-area">
                        <div className="chat-input-box">
                            <input type="text" placeholder="Асуултаа энд бичнэ үү (e.g. Энэ сарын орлого хэд байна?)" />
                            <button className="send-prompt-btn"><Zap size={18} /></button>
                        </div>
                        <div className="chat-suggestions">
                            <button className="suggestion-chip">Тайлан гаргах</button>
                            <button className="suggestion-chip">Барааны үлдэгдэл шалгах</button>
                            <button className="suggestion-chip">Шинэ пост бичүүлэх</button>
                        </div>
                    </div>
                </section>

                <div className="ai-sidebar-widgets">
                    <section className="widget-card">
                        <div className="widget-header">
                            <Brain size={18} />
                            <h3>Ухаалаг Анализ</h3>
                        </div>
                        <div className="widget-body">
                            <div className="ai-task">
                                <div className="task-icon"><BarChart3 size={14} /></div>
                                <div className="task-info">
                                    <span className="task-name">Борлуулалтын таамаглал</span>
                                    <span className="task-meta">Ирэх 30 хоногт +15% өсөлттэй</span>
                                </div>
                            </div>
                            <div className="ai-task">
                                <div className="task-icon text-warning"><Zap size={14} /></div>
                                <div className="task-info">
                                    <span className="task-name">Нөөцийн оновчлол</span>
                                    <span className="task-meta">3 барааны үлдэгдэл дуусаж байна</span>
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary w-full mt-4">Бүтэн тайлан харах</button>
                    </section>

                    <section className="widget-card premium-bg">
                        <div className="widget-header">
                            <Sparkles size={18} className="text-warning" />
                            <h3>Agentic Actions</h3>
                        </div>
                        <p className="text-secondary text-sm mb-4">AI Agent-д тусгай эрх өгч автомат үйлдэл хийлгэх.</p>
                        <div className="action-toggles">
                            <div className="toggle-row">
                                <span className="toggle-text">Бараа дуусахад захиалга бэлдэх</span>
                                <input type="checkbox" className="toggle-switch" defaultChecked />
                            </div>
                            <div className="toggle-row">
                                <span className="toggle-text">Төлбөр хэтэрсэн үед сануулах</span>
                                <input type="checkbox" className="toggle-switch" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
