import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import './PaymentsPage.css';

interface PaymentRow {
    id: string;
    orderNumber: string;
    customer: string;
    type: 'incoming' | 'outgoing';
    method: string;
    amount: number;
    date: string;
    note: string;
}

const demoPayments: PaymentRow[] = [
    { id: '1', orderNumber: 'ORD-0055', customer: 'Болд', type: 'incoming', method: 'Данс', amount: 5000000, date: '2026.02.22 14:30', note: 'Урьдчилгаа' },
    { id: '2', orderNumber: 'ORD-0054', customer: 'Сараа', type: 'incoming', method: 'Бэлэн', amount: 3200000, date: '2026.02.22 13:15', note: 'Бүтнээр' },
    { id: '3', orderNumber: '-', customer: 'Нийлүүлэгч А', type: 'outgoing', method: 'Данс', amount: 8500000, date: '2026.02.22 11:00', note: 'Бараа татан авалт' },
    { id: '4', orderNumber: 'ORD-0052', customer: 'Оюуна', type: 'incoming', method: 'QPay', amount: 950000, date: '2026.02.21 16:45', note: '' },
    { id: '5', orderNumber: 'ORD-0051', customer: 'Ганаа', type: 'incoming', method: 'Данс', amount: 1500000, date: '2026.02.21 15:20', note: 'Хэсэгчилсэн' },
    { id: '6', orderNumber: '-', customer: 'Тээвэр', type: 'outgoing', method: 'Бэлэн', amount: 350000, date: '2026.02.21 10:00', note: 'Хүргэлтийн зардал' },
    { id: '7', orderNumber: 'ORD-0050', customer: 'Тамир', type: 'incoming', method: 'SocialPay', amount: 1800000, date: '2026.02.20 18:00', note: '' },
    { id: '8', orderNumber: 'ORD-0048', customer: 'Мөнхбат', type: 'incoming', method: 'Данс', amount: 2000000, date: '2026.02.20 14:30', note: 'Хэсэгчилсэн 1' },
];

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function PaymentsPage() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

    const filtered = demoPayments.filter(p => {
        const matchSearch = !search || p.customer.toLowerCase().includes(search.toLowerCase()) || p.orderNumber.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'all' || p.type === typeFilter;
        return matchSearch && matchType;
    });

    const totalIn = demoPayments.filter(p => p.type === 'incoming').reduce((s, p) => s + p.amount, 0);
    const totalOut = demoPayments.filter(p => p.type === 'outgoing').reduce((s, p) => s + p.amount, 0);

    return (
        <>
            <Header title="Төлбөр тооцоо" subtitle="Орлого, зарлага бүртгэл" />
            <div className="page">
                <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(11, 232, 129, 0.15)', color: '#0be881' }}><ArrowDownRight size={20} /></div>
                        </div>
                        <div className="stat-card-value" style={{ background: 'linear-gradient(135deg, #0be881, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(totalIn)}</div>
                        <div className="stat-card-label">Нийт орлого</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><ArrowUpRight size={20} /></div>
                        </div>
                        <div className="stat-card-value" style={{ background: 'linear-gradient(135deg, #ef4444, #ff6b9d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(totalOut)}</div>
                        <div className="stat-card-label">Нийт зарлага</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <div className="stat-card-icon" style={{ background: 'rgba(108, 92, 231, 0.15)', color: '#6c5ce7' }}><DollarSign size={20} /></div>
                        </div>
                        <div className="stat-card-value">{fmt(totalIn - totalOut)}</div>
                        <div className="stat-card-label">Цэвэр</div>
                    </div>
                </div>

                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Нэр, захиалга хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="orders-status-bar" style={{ marginBottom: 0 }}>
                        <button className={`orders-status-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Бүгд</button>
                        <button className={`orders-status-chip ${typeFilter === 'incoming' ? 'active' : ''}`} onClick={() => setTypeFilter('incoming')}>Орлого</button>
                        <button className={`orders-status-chip ${typeFilter === 'outgoing' ? 'active' : ''}`} onClick={() => setTypeFilter('outgoing')}>Зарлага</button>
                    </div>
                </div>

                <div className="payments-list stagger-children" style={{ marginTop: 'var(--space-md)' }}>
                    {filtered.map(p => (
                        <div key={p.id} className={`payment-card card ${p.type}`}>
                            <div className="payment-icon-wrap">
                                {p.type === 'incoming' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div className="payment-info">
                                <div className="payment-customer">{p.customer}</div>
                                <div className="payment-details">
                                    {p.orderNumber !== '-' && <span>#{p.orderNumber}</span>}
                                    <span>{p.method}</span>
                                    {p.note && <span>• {p.note}</span>}
                                </div>
                            </div>
                            <div className="payment-right">
                                <div className={`payment-amount ${p.type}`}>
                                    {p.type === 'incoming' ? '+' : '-'}{fmt(p.amount)}
                                </div>
                                <div className="payment-date">{p.date}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
