import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, MoreVertical, TrendingDown, Receipt } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { expenseService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function ExpensesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = expenseService.subscribeExpenses(business.id, (data) => {
            setExpenses(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredExpenses = expenses.filter(e =>
        (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateExpense = () => {
        toast('Шинэ зардал бүртгэх модал удахгүй нэмэгдэнэ.');
    };

    return (
        <>
            <Header title="Зардлын Хяналт (Expenses)" action={{ label: 'Шинэ зардал', onClick: handleCreateExpense }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}><TrendingDown size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()} ₮</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт зардал (Энэ сар)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Зардлын утга, ангиллаар хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Огноо</th>
                                    <th>Утга</th>
                                    <th>Ангилал</th>
                                    <th>Дүн</th>
                                    <th>Төлбөрийн хэлбэр</th>
                                    <th>Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            Зардал олдсонгүй
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenses.map(e => (
                                        <tr key={e.id}>
                                            <td>{e.createdAt ? format(e.createdAt, 'yyyy/MM/dd') : '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{e.description || 'Тайлбаргүй'}</td>
                                            <td><span className="badge">{e.category || 'Бусад'}</span></td>
                                            <td style={{ fontWeight: 700, color: '#e74c3c' }}>-{e.amount?.toLocaleString() || 0} ₮</td>
                                            <td>{e.paymentMethod || 'Бэлэн'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn-icon" title="Баримт харах">
                                                        <Receipt size={16} />
                                                    </button>
                                                    <button className="btn-icon">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
