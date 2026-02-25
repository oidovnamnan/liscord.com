import {
    Users,
    Building2,
    CreditCard,
    Activity,
    ArrowUpRight,
    TrendingUp,
    ShieldAlert,
    Settings,
    DollarSign,
    Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SuperAdmin.css';

export function SuperAdminDashboard() {
    const navigate = useNavigate();

    // Mock stats for now
    const stats = [
        { label: 'Нийт Бизнес', value: '124', icon: Building2, color: 'blue', growth: '+12%' },
        { label: 'Нийт Хэрэглэгч', value: '840', icon: Users, color: 'purple', growth: '+5%' },
        { label: 'Нийт Орлого (GTV)', value: '₮450.2M', icon: CreditCard, color: 'green', growth: '+28%' },
        { label: 'Идэвхтэй (Live)', value: '42', icon: Activity, color: 'orange', growth: '-2%' },
    ];

    return (
        <div className="super-admin-page">
            <header className="super-header">
                <div>
                    <h1 className="page-title">🦅 Платформ Админ</h1>
                    <p className="text-secondary">Liscord системийн нэгдсэн хяналт</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="system-status">
                        <span className="status-dot online"></span>
                        Систем хэвийн
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate('/super/categories')}>
                        <Building2 size={18} /> Бизнесийн ангилал
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/super/finance')}>
                        <DollarSign size={18} /> Санхүү
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/super/audit')}>
                        <ShieldAlert size={18} /> Аудит
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/super/settings')}>
                        <Settings size={18} /> Модуль тохиргоо
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/super/global-settings')}>
                        <Globe size={18} /> Глобал Тохиргоо
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                {stats.map((s, idx) => (
                    <div key={idx} className="stat-card">
                        <div className={`stat-icon ${s.color}`}>
                            <s.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{s.label}</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{s.value}</span>
                                <span className={`stat-growth ${s.growth.startsWith('+') ? 'up' : 'down'}`}>
                                    {s.growth} <TrendingUp size={12} />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="dashboard-sections">
                <div className="dashboard-main">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Сүүлчийн үйлдлүүд</h2>
                            <button className="btn-text">Бүгдийг харах</button>
                        </div>
                        <div className="audit-list">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="audit-item">
                                    <div className="audit-avatar">SH</div>
                                    <div className="audit-content">
                                        <div className="audit-text">
                                            <strong>"Saruul Shop"</strong> бизнес багцаа <strong>Business</strong> болгож сунгалаа.
                                        </div>
                                        <div className="audit-time">12 минутын өмнө</div>
                                    </div>
                                    <ShieldAlert size={16} className="text-tertiary" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dashboard-side">
                    <div className="card">
                        <h3 className="card-title">Шинэ бизнесүүд</h3>
                        <div className="mini-list">
                            {['Eren Cargo', 'Gobi Cashmere', 'Ochir Printing'].map(name => (
                                <div key={name} className="mini-item">
                                    <div className="mini-item-info">
                                        <div className="mini-name">{name}</div>
                                        <div className="mini-desc">Бүртгүүлсэн: Өнөөдөр</div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-tertiary" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
