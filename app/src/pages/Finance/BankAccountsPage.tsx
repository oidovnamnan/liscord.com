import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Landmark, Loader2, MoreVertical, ShieldCheck, TrendingUp, CreditCard } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { bankService } from '../../services/db';
import { toast } from 'react-hot-toast';

export function BankAccountsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        const unsubscribe = bankService.subscribeAccounts(business.id, (data) => {
            setAccounts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const handleAddAccount = () => {
        toast('Банкны данс нэмэх модал удахгүй нэмэгдэнэ.');
    };

    return (
        <>
            <Header title="Банкны Данс & Холболт" action={{ label: 'Данс нэмэх', onClick: handleAddAccount }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                    {loading ? (
                        <div className="flex-center" style={{ gridColumn: '1 / -1', height: '200px' }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '60px' }}>
                            <Landmark size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Данс бүртгэгдээгүй байна</h3>
                            <button className="btn btn-primary" onClick={handleAddAccount} style={{ marginTop: 16 }}>Данс нэмэх</button>
                        </div>
                    ) : (
                        accounts.map(acc => (
                            <div key={acc.id} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: '100px',
                                    height: '100px',
                                    background: 'var(--primary)',
                                    opacity: 0.05,
                                    borderRadius: '0 0 0 100%',
                                    zIndex: 0
                                }} />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            background: 'var(--bg-soft)',
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary)'
                                        }}>
                                            <Landmark size={24} />
                                        </div>
                                        <button className="btn-icon"><MoreVertical size={18} /></button>
                                    </div>

                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{acc.bankName || 'Банк'}</div>
                                        <h3 style={{ margin: '4px 0', fontSize: '1.2rem' }}>{acc.accountName}</h3>
                                        <div style={{ fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>{acc.accountNumber}</div>
                                    </div>

                                    <div className="divider" />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Үлдэгдэл</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                                                {acc.balance?.toLocaleString()} {acc.currency || '₮'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#2ecc71', fontWeight: 600 }}>
                                            <ShieldCheck size={16} /> Холбогдсон
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                                        <button className="btn btn-soft btn-sm" style={{ flex: 1 }}><CreditCard size={14} /> Хуулга</button>
                                        <button className="btn btn-soft btn-sm" style={{ flex: 1 }}><TrendingUp size={14} /> Шинжилгээ</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
