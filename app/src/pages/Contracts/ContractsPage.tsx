import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { FileText, Calendar, DollarSign, Users, AlertTriangle, CheckCircle2, Clock, Plus, Search, ChevronRight } from 'lucide-react';

const mockContracts = [
    { id: 'C-001', title: 'Оффис түрээсийн гэрээ', partner: 'Номин Холдинг', type: 'lease', status: 'active', startDate: '2025-01-01', endDate: '2026-12-31', amount: 3500000, monthly: true },
    { id: 'C-002', title: 'Зээлийн гэрээ #2024-45', partner: 'Хаан Банк', type: 'loan', status: 'active', startDate: '2024-06-15', endDate: '2027-06-15', amount: 50000000, monthly: true },
    { id: 'C-003', title: 'Тоног төхөөрөмж лизинг', partner: 'Монголын Лизинг', type: 'leasing', status: 'active', startDate: '2025-03-01', endDate: '2028-03-01', amount: 25000000, monthly: true },
    { id: 'C-004', title: 'Ломбардын зээл', partner: 'Голомт Ломбард', type: 'pawn', status: 'warning', startDate: '2025-10-01', endDate: '2026-04-01', amount: 2000000, monthly: false },
    { id: 'C-005', title: 'Машин түрээсийн гэрээ', partner: 'Авто Трейд ХХК', type: 'vehicle', status: 'completed', startDate: '2024-01-01', endDate: '2025-12-31', amount: 1800000, monthly: true },
    { id: 'C-006', title: 'Агуулахын түрээс', partner: 'БиДиСек ХХК', type: 'lease', status: 'expired', startDate: '2023-06-01', endDate: '2025-05-31', amount: 2200000, monthly: true },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    active: { label: 'Идэвхтэй', color: '#0be881', icon: CheckCircle2 },
    warning: { label: 'Анхааруулга', color: '#f7b731', icon: AlertTriangle },
    completed: { label: 'Дууссан', color: '#4b7bec', icon: CheckCircle2 },
    expired: { label: 'Хугацаа дууссан', color: '#fc5c65', icon: Clock },
};

const typeLabels: Record<string, string> = {
    lease: '🏢 Түрээс',
    loan: '🏦 Зээл',
    leasing: '📋 Лизинг',
    pawn: '💎 Ломбард',
    vehicle: '🚗 Машин'
};

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ContractsPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');

    const filtered = mockContracts.filter(c => {
        if (filter !== 'all' && c.status !== filter) return false;
        if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.partner.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const activeCount = mockContracts.filter(c => c.status === 'active').length;
    const totalValue = mockContracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.amount, 0);
    const warningCount = mockContracts.filter(c => c.status === 'warning').length;

    return (
        <>
            <Header title="Гэрээ / Бацаалан" subtitle={`Нийт ${mockContracts.length} гэрээ`} />
            <div className="page animate-fade-in">
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(11,232,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={20} color="#0be881" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeCount}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Идэвхтэй гэрээ</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(75,123,236,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DollarSign size={20} color="#4b7bec" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{fmt(totalValue)}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Нийт дүн</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(247,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={20} color="#f7b731" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{warningCount}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Анхааруулга</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(165,94,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} color="#a55eea" />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{new Set(mockContracts.map(c => c.partner)).size}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Түнш байгууллага</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input className="input" placeholder="Гэрээ, түнш хайх..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'active', 'warning', 'expired'].map(s => (
                            <button key={s} className={`btn btn-ghost ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ fontSize: '0.8rem' }}>
                                {s === 'all' ? 'Бүгд' : statusConfig[s]?.label || s}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary">
                        <Plus size={16} /> Шинэ гэрээ
                    </button>
                </div>

                {/* Contract List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map(contract => {
                        const status = statusConfig[contract.status];
                        return (
                            <div key={contract.id} className="card card-clickable" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                    {typeLabels[contract.type]?.split(' ')[0] || '📄'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{contract.title}</div>
                                    <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                        <span>{contract.partner}</span>
                                        <span>•</span>
                                        <span><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{contract.startDate} — {contract.endDate}</span>
                                        <span>•</span>
                                        <span>{typeLabels[contract.type]}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmt(contract.amount)}</div>
                                    {contract.monthly && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>сар бүр</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    <span className="badge" style={{ background: `${status.color}22`, color: status.color, fontWeight: 600, fontSize: '0.75rem' }}>
                                        {status.label}
                                    </span>
                                    <ChevronRight size={16} color="var(--text-secondary)" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
