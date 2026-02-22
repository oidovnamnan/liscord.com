import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Smartphone, BarChart3, Users, Package, ShoppingCart } from 'lucide-react';
import './LandingPage.css';

const features = [
    { icon: ShoppingCart, title: 'Захиалга удирдлага', desc: 'Бүх захиалгыг нэг дороос бүртгэж, хянаж, удирдаарай.' },
    { icon: Package, title: 'Бараа & Нөөц', desc: 'Барааны нөөцийг хянах, нийлүүлэгч удирдах.' },
    { icon: Users, title: 'Харилцагч', desc: 'Харилцагчдын мэдээлэл, тооцоо, авлага бүртгэл.' },
    { icon: BarChart3, title: 'Тайлан', desc: 'Орлого, борлуулалт, ашгийн тайланг шууд харах.' },
    { icon: Shield, title: 'Аюулгүй', desc: 'PIN хамгаалалт, эрхийн хяналт, аудит лог.' },
    { icon: Smartphone, title: 'Мобайл', desc: 'Утаснаас бүрэн удирдах. PWA дэмжлэг.' },
];

const categories = [
    '📦 Карго/Импорт', '🏪 Бөөний худалдаа', '📱 Онлайн дэлгүүр', '🍔 Хоол/Хүргэлт',
    '🔧 Засвар/Үйлчилгээ', '🖨️ Хэвлэл', '💐 Цэцэг/Бэлэг', '💊 Эмийн сан',
    '🚗 Авто эд анги', '📋 Бусад',
];

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing">
            {/* Nav */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-nav-brand">
                        <div className="landing-logo">L</div>
                        <span className="landing-brand-text">Liscord</span>
                    </div>
                    <div className="landing-nav-links hide-mobile">
                        <a href="#features">Боломжууд</a>
                        <a href="#categories">Ангилал</a>
                        <a href="#pricing">Үнэ</a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="btn btn-ghost" onClick={() => navigate('/login')}>Нэвтрэх</button>
                        <button className="btn btn-primary" onClick={() => navigate('/register')}>
                            Бүртгүүлэх
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-glow" />
                <div className="landing-hero-content animate-fade-in">
                    <div className="landing-hero-badge">
                        <Zap size={14} /> Шинэ! AI бараа тайлбар үүсгэгч
                    </div>
                    <h1 className="landing-hero-title">
                        Google Sheets-ээс
                        <br />
                        <span className="gradient-text">10 дахин хурдан</span>
                        <br />
                        бараа захиалгын бүртгэл
                    </h1>
                    <p className="landing-hero-desc">
                        Монгол бизнест зориулсан захиалга, бараа, харилцагч, тайлангийн систем.
                        Бүх зүйлийг нэг дороос удирдаарай.
                    </p>
                    <div className="landing-hero-actions">
                        <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>
                            Үнэгүй эхлэх <ArrowRight size={18} />
                        </button>
                        <button className="btn btn-secondary btn-xl" onClick={() => navigate('/app')}>
                            Demo харах
                        </button>
                    </div>
                    <div className="landing-hero-stats">
                        <div className="landing-hero-stat">
                            <span className="landing-hero-stat-value">500+</span>
                            <span className="landing-hero-stat-label">Бизнес</span>
                        </div>
                        <div className="landing-hero-stat-divider" />
                        <div className="landing-hero-stat">
                            <span className="landing-hero-stat-value">50K+</span>
                            <span className="landing-hero-stat-label">Захиалга</span>
                        </div>
                        <div className="landing-hero-stat-divider" />
                        <div className="landing-hero-stat">
                            <span className="landing-hero-stat-value">99.9%</span>
                            <span className="landing-hero-stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-section" id="features">
                <h2 className="landing-section-title">Бүх боломжууд нэг дор</h2>
                <p className="landing-section-subtitle">Бизнесийн өдөр тутмын бүх ажлыг хялбарчлана</p>
                <div className="landing-features-grid">
                    {features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <div key={i} className="landing-feature-card card card-glass">
                                <div className="landing-feature-icon">
                                    <Icon size={24} />
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Categories */}
            <section className="landing-section landing-section-dark" id="categories">
                <h2 className="landing-section-title">10+ төрлийн бизнест тохирно</h2>
                <p className="landing-section-subtitle">Ангилал сонгоход бүх зүйл таны бизнест зориулагдана</p>
                <div className="landing-categories">
                    {categories.map((cat, i) => (
                        <div key={i} className="landing-category-chip">{cat}</div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="landing-section" id="pricing">
                <h2 className="landing-section-title">Энгийн үнийн бодлого</h2>
                <p className="landing-section-subtitle">Жижиг бизнест үнэгүй. Өсөхийн хэрээр шинэчлэнэ.</p>
                <div className="landing-pricing-grid">
                    <div className="landing-pricing-card card">
                        <div className="landing-pricing-tier">Үнэгүй</div>
                        <div className="landing-pricing-price">₮0<span>/сар</span></div>
                        <ul className="landing-pricing-features">
                            <li>✅ 100 захиалга / сар</li>
                            <li>✅ 1 хэрэглэгч</li>
                            <li>✅ 50 бараа</li>
                            <li>✅ 500MB хадгалалт</li>
                            <li>❌ Тайлан</li>
                            <li>❌ Чат</li>
                        </ul>
                        <button className="btn btn-secondary btn-full" onClick={() => navigate('/register')}>
                            Эхлэх
                        </button>
                    </div>
                    <div className="landing-pricing-card card landing-pricing-popular">
                        <div className="landing-pricing-badge">Хамгийн их сонголт</div>
                        <div className="landing-pricing-tier">Про</div>
                        <div className="landing-pricing-price">₮29,900<span>/сар</span></div>
                        <ul className="landing-pricing-features">
                            <li>✅ Хязгааргүй захиалга</li>
                            <li>✅ 5 хэрэглэгч</li>
                            <li>✅ Хязгааргүй бараа</li>
                            <li>✅ 5GB хадгалалт</li>
                            <li>✅ Тайлан + PDF</li>
                            <li>✅ Чат</li>
                        </ul>
                        <button className="btn btn-primary btn-full" onClick={() => navigate('/register')}>
                            14 хоног үнэгүй <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="landing-pricing-card card">
                        <div className="landing-pricing-tier">Бизнес</div>
                        <div className="landing-pricing-price">₮59,900<span>/сар</span></div>
                        <ul className="landing-pricing-features">
                            <li>✅ Бүх Про боломж</li>
                            <li>✅ 20 хэрэглэгч</li>
                            <li>✅ 50GB хадгалалт</li>
                            <li>✅ HR / Цалин</li>
                            <li>✅ B2B интеграци</li>
                            <li>✅ Тусгай дэмжлэг</li>
                        </ul>
                        <button className="btn btn-secondary btn-full">Холбогдох</button>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="landing-cta">
                <h2>Бизнесээ өнөөдрөөс хялбар удирдаарай</h2>
                <p>Үнэгүй бүртгүүлж, 2 минутад эхлэх боломжтой</p>
                <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>
                    Үнэгүй эхлэх <ArrowRight size={18} />
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <div className="landing-logo">L</div>
                        <span>Liscord</span>
                    </div>
                    <div className="landing-footer-links">
                        <a href="/terms">Үйлчилгээний нөхцөл</a>
                        <a href="/privacy">Нууцлал</a>
                        <a href="mailto:support@liscord.com">Холбоо барих</a>
                    </div>
                    <p className="landing-footer-copy">© 2026 Liscord. Бүх эрх хуулиар хамгаалагдсан.</p>
                </div>
            </footer>
        </div>
    );
}
