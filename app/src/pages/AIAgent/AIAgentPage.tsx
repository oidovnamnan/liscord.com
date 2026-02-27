import React from 'react';
import { Bot, Sparkles, Brain, Zap, MessageSquare, BarChart3, Settings } from 'lucide-react';
import './AIAgentPage.css';

export const AIAgentPage: React.FC = () => {
    return (
        <div className="ai-agent-container">
            <header className="ai-agent-header">
                <div className="ai-header-content">
                    <div className="ai-badge">Liscord Brain v1.0</div>
                    <h1>Antigravity AI Agent</h1>
                    <p>Таны бизнесийн ухаалаг тархи, ко-пилот туслах</p>
                </div>
                <div className="ai-header-stats">
                    <div className="stat-card">
                        <div className="stat-value">98.4%</div>
                        <div className="stat-label">Нарийвчлал</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">120+</div>
                        <div className="stat-label">Автоматжуулалт</div>
                    </div>
                </div>
            </header>

            <div className="ai-grid">
                <section className="ai-card main-chat">
                    <div className="card-header">
                        <MessageSquare size={20} />
                        <h3>AI Консульт</h3>
                    </div>
                    <div className="chat-content">
                        <div className="chat-message bot">
                            Сайн байна уу? Би танай бизнесийн бүх өгөгдөл дээр анализ хийхэд бэлэн байна.
                            Өнөөдөр юун дээр туслах вэ?
                        </div>
                    </div>
                    <div className="chat-input-wrapper">
                        <input type="text" placeholder="Асуултаа энд бичнэ үү..." />
                        <button className="send-btn"><Zap size={18} /></button>
                    </div>
                </section>

                <div className="ai-side-grid">
                    <section className="ai-card">
                        <div className="card-header">
                            <Brain size={20} />
                            <h3>Ухаалаг Анализ</h3>
                        </div>
                        <div className="ai-task-list">
                            <div className="ai-task">
                                <BarChart3 size={16} />
                                <span>Борлуулалтын таамаглал (Ирэх 30 хоног)</span>
                            </div>
                            <div className="ai-task">
                                <Zap size={16} />
                                <span>Агуулахын үлдэгдлийн оновчлол</span>
                            </div>
                        </div>
                        <button className="primary-ai-btn">Багажнуудыг ажиллуулах</button>
                    </section>

                    <section className="ai-card premium-card">
                        <div className="card-header">
                            <Sparkles size={20} />
                            <h3>Agentic Actions</h3>
                        </div>
                        <p>AI Agent-д тодорхой эрх өгч автомат үйлдлүүд гүйцэтгүүлэх.</p>
                        <div className="ai-toggle-list">
                            <div className="toggle-item">
                                <span>Бараа дуусахад нөөц авах санал гаргах</span>
                                <div className="toggle-switch active"></div>
                            </div>
                            <div className="toggle-item">
                                <span>Төлбөр хэтэрсэн харилцагчид санууламж явуулах</span>
                                <div className="toggle-switch"></div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
