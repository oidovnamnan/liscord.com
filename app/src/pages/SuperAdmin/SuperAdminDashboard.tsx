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
    Globe,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import './SuperAdmin.css';

export function SuperAdminDashboard() {
    const navigate = useNavigate();

    // Mock stats
    const stats = [
        { label: 'Нийт Бизнес', value: '124', icon: Building2, color: 'blue', growth: '+12%' },
        { label: 'Нийт Хэрэглэгч', value: '840', icon: Users, color: 'purple', growth: '+5%' },
        { label: 'Нийт Орлого (GTV)', value: '₮450.2M', icon: CreditCard, color: 'green', growth: '+28%' },
        { label: 'Идэвхтэй (Live)', value: '42', icon: Activity, color: 'orange', growth: '-2%' },
    ];

    const recentActions = [
        { id: 1, biz: 'Saruul Shop', text: 'бизнес багцаа Business болгож сунгалаа.', time: '12 минутын өмнө', initials: 'SS' },
        { id: 2, biz: 'Eren Cargo', text: 'шинэ салбар "Улаанбаатар" нэмлээ.', time: '45 минутын өмнө', initials: 'EC' },
        { id: 3, biz: 'Gobi Cashmere', text: 'төлбөрийн систем холболоо.', time: '2 цагийн өмнө', initials: 'GC' },
        { id: 4, biz: 'Ochir Printing', text: 'шинэ ажилтан Ц.Болд нэмлээ.', time: '5 цагийн өмнө', initials: 'OP' },
        { id: 5, biz: 'Liscord Tech', text: 'систем шинэчлэлт хийгдлээ.', time: '1 өдрийн өмнө', initials: 'LT' },
    ];

    return (
        <div className="page-container animate-fade-in">
            <Header
                title="Платформ Админ"
                subtitle="Liscord системийн нэгдсэн хяналт болон статистик"
                extra={
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="system-status" style={{ background: 'var(--success-tint)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                            <CheckCircle2 size={14} />
                            Систем хэвийн
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/super/global-settings')}>
                                <Globe size={16} />
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/super/settings')}>
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>
                }
            />

            <div className="page-content">
                <div className="stats-grid">
                    {stats.map((s, idx) => (
                        <div key={idx} className="stat-card hover-card">
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
                                <button className="btn-text" onClick={() => navigate('/super/audit')}>Бүгдийг харах</button>
                            </div>
                            <div className="audit-list">
                                {recentActions.map(action => (
                                    <div key={action.id} className="audit-item">
                                        <div className="audit-avatar" style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}>
                                            {action.initials}
                                        </div>
                                        <div className="audit-content">
                                            <div className="audit-text">
                                                <strong>"{action.biz}"</strong> {action.text}
                                            </div>
                                            <div className="audit-time">{action.time}</div>
                                        </div>
                                        <ShieldAlert size={16} className="text-tertiary" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-side">
                        <div className="card" style={{ height: '100%' }}>
                            <h3 className="card-title" style={{ marginBottom: '20px' }}>Шинэ бизнесүүд</h3>
                            <div className="mini-list">
                                {['Eren Cargo', 'Gobi Cashmere', 'Ochir Printing'].map(name => (
                                    <div key={name} className="mini-item hover-card" style={{ cursor: 'pointer', padding: '16px' }} onClick={() => navigate('/super/businesses')}>
                                        <div className="mini-item-info">
                                            <div className="mini-name">{name}</div>
                                            <div className="mini-desc">Бүртгүүлсэн: Өнөөдөр</div>
                                        </div>
                                        <ArrowUpRight size={16} className="text-primary" />
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-outline" style={{ width: '100%', marginTop: '24px' }} onClick={() => navigate('/super/businesses')}>
                                Бүгдийг удирдах
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
