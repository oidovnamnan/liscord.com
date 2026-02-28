import { useEffect, useState, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { orderService } from '../../services/db';
import type { Order } from '../../types';
import './PaymentsPage.css';

interface PaymentRow {
    id: string;
    orderNumber: string;
    customer: string;
    type: 'incoming' | 'outgoing';
    method: string;
    amount: number;
    date: Date;
    note: string;
}

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function PaymentsPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!business) return;
        return orderService.subscribeOrders(business.id, (data) => {
            setOrders(data);
        });
    }, [business]);

    // Derived payments array from order.financials.payments
    const allPayments = useMemo(() => {
        const txs: PaymentRow[] = [];
        orders.forEach(o => {
            if (o.isDeleted || o.status === 'cancelled') return;
            if (o.financials?.payments && Array.isArray(o.financials.payments)) {
                o.financials.payments.forEach((p, idx) => {
                    txs.push({
                        id: `${o.id}-pay-${idx}`,
                        orderNumber: o.orderNumber || o.id.substring(0, 6),
                        customer: o.customer?.name || o.customer?.phone || 'Тодорхойгүй',
                        type: 'incoming',
                        amount: p.amount,
                        method: p.method,
                        note: p.note || 'Төлбөр',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        date: p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt as any),
                    });
                });
            }
        });
        return txs.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [orders]);

    const filtered = allPayments.filter(p => {
        const matchSearch = !search || p.customer.toLowerCase().includes(search.toLowerCase()) || p.orderNumber.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'all' || p.type === typeFilter;
        return matchSearch && matchType;
    });

    const totalIn = allPayments.filter(p => p.type === 'incoming').reduce((s, p) => s + p.amount, 0);
    const totalOut = allPayments.filter(p => p.type === 'outgoing').reduce((s, p) => s + p.amount, 0);

    return (
        <HubLayout hubId="finance-hub">
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
                                <div className="payment-date">{(p.date instanceof Date && !isNaN(p.date.valueOf())) ? `${(p.date.getMonth() + 1).toString().padStart(2, '0')}.${p.date.getDate().toString().padStart(2, '0')} ${p.date.getHours().toString().padStart(2, '0')}:${p.date.getMinutes().toString().padStart(2, '0')}` : 'Огноогүй'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </HubLayout>
    );
}
