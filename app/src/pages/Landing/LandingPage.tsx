import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Zap, Shield, Smartphone, BarChart3, Users, Package,
    ShoppingCart, Check, Star, ChevronRight, Globe, MessageCircle,
    Layers, TrendingUp, Truck, Cpu, Clock, BadgeCheck
} from 'lucide-react';
import './LandingPage.css';

const features = [
    { icon: ShoppingCart, title: 'Захиалга удирдлага', desc: 'Бүх захиалгыг нэг дороос бүртгэж, хянаж, статус, төлбөр удирдах.', color: '#ef4444' },
    { icon: Package, title: 'Бараа & Нөөц', desc: 'Агуулах, нөөц, баркод, нийлүүлэгч бүгдийг нэг дороос.', color: '#f97316' },
    { icon: Users, title: 'Харилцагч CRM', desc: 'VIP гишүүнчлэл, авлага, тооцоо, хайлт бүрэн.', color: '#ec4899' },
    { icon: BarChart3, title: 'Тайлан & Аналитик', desc: 'Орлого, борлуулалт, ашгийн тайланг real-time харах.', color: '#8b5cf6' },
    { icon: Truck, title: 'Хүргэлт & Карго', desc: 'Карго, ачааны хяналт, tracking, QR скан.', color: '#06b6d4' },
    { icon: MessageCircle, title: 'AI & Мессенжер', desc: 'Facebook AI хариулт, автомат захиалга, чат.', color: '#10b981' },
    { icon: Shield, title: 'Аюулгүй байдал', desc: 'PIN, эрхийн хяналт, аудит лог, SMS баталгаажуулалт.', color: '#f59e0b' },
    { icon: Globe, title: 'Онлайн дэлгүүр', desc: 'Storefront, checkout, QR төлбөр бүгд автомат.', color: '#6366f1' },
];

const categories = [
    { emoji: '📦', name: 'Карго/Импорт' },
    { emoji: '🏪', name: 'Бөөний худалдаа' },
    { emoji: '📱', name: 'Онлайн дэлгүүр' },
    { emoji: '🍔', name: 'Хоол/Хүргэлт' },
    { emoji: '🔧', name: 'Засвар/Үйлчилгээ' },
    { emoji: '🖨️', name: 'Хэвлэл' },
    { emoji: '💐', name: 'Цэцэг/Бэлэг' },
    { emoji: '💊', name: 'Эмийн сан' },
    { emoji: '🚗', name: 'Авто эд анги' },
    { emoji: '👗', name: 'Хувцас/Фашион' },
    { emoji: '📋', name: 'Бусад' },
];

const stats = [
    { value: '500+', label: 'Бизнес', icon: Layers },
    { value: '50K+', label: 'Захиалга', icon: TrendingUp },
    { value: '99.9%', label: 'Uptime', icon: Clock },
    { value: '24/7', label: 'Дэмжлэг', icon: BadgeCheck },
];

/** Animated counter */
function AnimCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
    const numPart = parseInt(target.replace(/\D/g, '')) || 0;
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const dur = 1500;
                const ease = (t: number) => 1 - Math.pow(1 - t, 4);
                function tick(now: number) {
                    const p = Math.min((now - start) / dur, 1);
                    setCount(Math.round(numPart * ease(p)));
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [numPart]);

    const formatted = target.includes('K') ? `${count >= 1000 ? Math.round(count / 1000) + 'K' : count}` :
        target.includes('%') ? `${count}%` : count.toString();
    return <span ref={ref}>{formatted}{suffix}{target.includes('+') ? '+' : ''}</span>;
}

export function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="lp">
            {/* ═══ Navigation ═══ */}
            <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <div className="lp-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="lp-logo">L</div>
                        <span className="lp-brand-text">Liscord</span>
                    </div>
                    <div className="lp-nav-links hide-mobile">
                        <a href="#features">Боломжууд</a>
                        <a href="#categories">Ангилал</a>
                        <a href="#pricing">Үнэ</a>
                    </div>
                    <div className="lp-nav-actions">
                        <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Нэвтрэх</button>
                        <button className="lp-btn-primary" onClick={() => navigate('/register')}>
                            Бүртгүүлэх <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ═══ Hero ═══ */}
            <section className="lp-hero">
                <div className="lp-hero-glow" />
                <div className="lp-hero-glow-2" />
                <div className="lp-hero-grid-bg" />

                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <Cpu size={14} />
                        <span>AI-powered бизнес платформ</span>
                        <ChevronRight size={14} />
                    </div>

                    <h1 className="lp-hero-title">
                        Бизнесээ <span className="lp-gradient-text">дараагийн</span>
                        <br />
                        <span className="lp-gradient-text">түвшинд</span> аваачина
                    </h1>

                    <p className="lp-hero-desc">
                        Захиалга, бараа, харилцагч, тайлан, хүргэлт, AI — бүгдийг нэг дороос.
                        <br />
                        Монгол бизнесийн #1 удирдлагын систем.
                    </p>

                    <div className="lp-hero-actions">
                        <button className="lp-btn-hero" onClick={() => navigate('/register')}>
                            Үнэгүй эхлэх <ArrowRight size={18} />
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className="lp-hero-stats">
                        {stats.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} className="lp-hero-stat">
                                    <Icon size={16} className="lp-hero-stat-icon" />
                                    <span className="lp-hero-stat-value">
                                        <AnimCounter target={s.value} />
                                    </span>
                                    <span className="lp-hero-stat-label">{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ Trusted by ═══ */}
            <section className="lp-trust">
                <p className="lp-trust-label">Монголын бизнесүүд итгэж ажиллаж байна</p>
                <div className="lp-trust-logos">
                    {['Карго компани', 'Онлайн шоп', 'Хоол хүргэлт', 'Бөөний худалдаа', 'Фашион брэнд'].map((name, i) => (
                        <div key={i} className="lp-trust-logo">{name}</div>
                    ))}
                </div>
            </section>

            {/* ═══ Features ═══ */}
            <section className="lp-section" id="features">
                <div className="lp-section-header">
                    <div className="lp-section-badge">Боломжууд</div>
                    <h2 className="lp-section-title">Бүх зүйлийг <span className="lp-gradient-text">нэг дороос</span></h2>
                    <p className="lp-section-sub">20+ модуль, 10+ интеграци — бизнесийн бүх хэрэгцээг хангана</p>
                </div>

                <div className="lp-features-grid">
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div key={i} className="lp-feature-card" style={{ '--fc': f.color } as React.CSSProperties}>
                                <div className="lp-feature-icon">
                                    <Icon size={22} />
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                                <div className="lp-feature-shine" />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ═══ Categories ═══ */}
            <section className="lp-section lp-section-alt" id="categories">
                <div className="lp-section-header">
                    <div className="lp-section-badge">Ангилал</div>
                    <h2 className="lp-section-title">10+ төрлийн бизнест <span className="lp-gradient-text">тохирно</span></h2>
                    <p className="lp-section-sub">Ангилал сонгоход бүх зүйл таны салбарт зориулагдана</p>
                </div>
                <div className="lp-categories">
                    {categories.map((cat, i) => (
                        <div key={i} className="lp-category-chip">
                            <span className="lp-category-emoji">{cat.emoji}</span>
                            <span>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Pricing ═══ */}
            <section className="lp-section" id="pricing">
                <div className="lp-section-header">
                    <div className="lp-section-badge">Үнийн бодлого</div>
                    <h2 className="lp-section-title">Энгийн, <span className="lp-gradient-text">ил тод</span> үнэ</h2>
                    <p className="lp-section-sub">Жижиг бизнест үнэгүй. Өсөхийн хэрээр шинэчлэнэ.</p>
                </div>

                <div className="lp-pricing-grid">
                    {/* Free */}
                    <div className="lp-pricing-card">
                        <div className="lp-pricing-tier">Үнэгүй</div>
                        <div className="lp-pricing-price">₮0<span>/сар</span></div>
                        <p className="lp-pricing-desc">Жижиг бизнест тохиромжтой</p>
                        <ul className="lp-pricing-list">
                            <li><Check size={16} className="lp-check" /> 100 захиалга / сар</li>
                            <li><Check size={16} className="lp-check" /> 1 хэрэглэгч</li>
                            <li><Check size={16} className="lp-check" /> 50 бараа</li>
                            <li><Check size={16} className="lp-check" /> 500MB хадгалалт</li>
                        </ul>
                        <button className="lp-btn-outline" onClick={() => navigate('/register')}>Эхлэх</button>
                    </div>

                    {/* Pro — Popular */}
                    <div className="lp-pricing-card lp-pricing-popular">
                        <div className="lp-pricing-badge-pop">🔥 Хамгийн их сонголт</div>
                        <div className="lp-pricing-tier">Про</div>
                        <div className="lp-pricing-price">₮29,900<span>/сар</span></div>
                        <p className="lp-pricing-desc">Идэвхтэй өсөж буй бизнест</p>
                        <ul className="lp-pricing-list">
                            <li><Check size={16} className="lp-check" /> Хязгааргүй захиалга</li>
                            <li><Check size={16} className="lp-check" /> 5 хэрэглэгч</li>
                            <li><Check size={16} className="lp-check" /> Хязгааргүй бараа</li>
                            <li><Check size={16} className="lp-check" /> 5GB хадгалалт</li>
                            <li><Check size={16} className="lp-check" /> Тайлан + PDF</li>
                            <li><Check size={16} className="lp-check" /> AI & Чат</li>
                        </ul>
                        <button className="lp-btn-hero" onClick={() => navigate('/register')}>
                            14 хоног үнэгүй <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Business */}
                    <div className="lp-pricing-card">
                        <div className="lp-pricing-tier">Бизнес</div>
                        <div className="lp-pricing-price">₮59,900<span>/сар</span></div>
                        <p className="lp-pricing-desc">Том байгууллагад зориулсан</p>
                        <ul className="lp-pricing-list">
                            <li><Check size={16} className="lp-check" /> Бүх Про боломж</li>
                            <li><Check size={16} className="lp-check" /> 20 хэрэглэгч</li>
                            <li><Check size={16} className="lp-check" /> 50GB хадгалалт</li>
                            <li><Check size={16} className="lp-check" /> HR / Цалин</li>
                            <li><Check size={16} className="lp-check" /> B2B интеграци</li>
                            <li><Check size={16} className="lp-check" /> Тусгай дэмжлэг</li>
                        </ul>
                        <button className="lp-btn-outline">Холбогдох</button>
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="lp-cta">
                <div className="lp-cta-glow" />
                <div className="lp-cta-content">
                    <Star size={32} className="lp-cta-star" />
                    <h2>Бизнесээ өнөөдрөөс<br /><span className="lp-gradient-text">хялбар удирдаарай</span></h2>
                    <p>2 минутад бүртгүүлж, шууд эхлэх боломжтой. Банк картгүйгээр.</p>
                    <button className="lp-btn-hero lp-btn-lg" onClick={() => navigate('/register')}>
                        Үнэгүй эхлэх <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-top">
                        <div className="lp-footer-brand">
                            <div className="lp-logo">L</div>
                            <div>
                                <div className="lp-brand-text" style={{ fontSize: '1rem' }}>Liscord</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Бизнес удирдлагын платформ</p>
                            </div>
                        </div>
                        <div className="lp-footer-links">
                            <a href="/terms">Үйлчилгээний нөхцөл</a>
                            <a href="/privacy">Нууцлал</a>
                            <a href="mailto:support@liscord.com">Холбоо барих</a>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <p>© 2026 Liscord. Бүх эрх хуулиар хамгаалагдсан.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
