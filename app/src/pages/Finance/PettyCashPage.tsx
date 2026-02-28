import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Loader2, MoreVertical, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { pettyCashService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function PettyCashPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        const unsubscribe = pettyCashService.subscribeTransactions(business.id, (data) => {
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const handleAddTransaction = () => {
        toast('Бэлэн касс руу гүйлгээ нэмэх модал удахгүй нэмэгдэнэ.');
    };

    const currentBalance = transactions.reduce((sum, tx) => {
        return sum + (tx.type === 'income' ? (tx.amount || 0) : -(tx.amount || 0));
    }, 0);

    return (
        <>
            <Header title="Бэлэн Касс (Petty Cash)" action={{ label: 'Гүйлгээ', onClick: handleAddTransaction }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 24, background: 'var(--primary)', color: 'white' }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Нийт үлдэгдэл</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>{currentBalance.toLocaleString()} ₮</div>
                    </div>
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Орлого (Нийт)</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2ecc71' }}>
                            {transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()} ₮
                        </div>
                    </div>
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Зарлага (Нийт)</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e74c3c' }}>
                            {transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()} ₮
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div className="card-header" style={{ padding: 16 }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={18} /> Гүйлгээний түүх
                        </h3>
                    </div>
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
                                    <th>Төрөл</th>
                                    <th>Дүн</th>
                                    <th>Тайлбар</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            Гүйлгээ олдсонгүй
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td>{tx.createdAt ? format(tx.createdAt, 'HH:mm dd/MM') : '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{tx.title || 'Тодорхойгүй'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: tx.type === 'income' ? '#2ecc71' : '#e74c3c' }}>
                                                    {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                    {tx.type === 'income' ? 'Орлого' : 'Зарлага'}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>{tx.amount?.toLocaleString() || 0} ₮</td>
                                            <td>{tx.note || '-'}</td>
                                            <td><button className="btn-icon"><MoreVertical size={16} /></button></td>
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
