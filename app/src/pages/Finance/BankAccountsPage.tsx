import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Landmark, Loader2, ShieldCheck, TrendingUp, CreditCard, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { bankService } from '../../services/db';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const BANK_FIELDS: CrudField[] = [
    { name: 'accountName', label: 'Дансны нэр', type: 'text', required: true, placeholder: 'Үндсэн данс' },
    {
        name: 'bankName', label: 'Банкны нэр', type: 'select', required: true, options: [
            { value: 'khan', label: 'Хаан банк' },
            { value: 'golomt', label: 'Голомт банк' },
            { value: 'tdb', label: 'ХХБ' },
            { value: 'state', label: 'Төрийн банк' },
            { value: 'xac', label: 'XacBank' },
            { value: 'bogd', label: 'Богд банк' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'accountNumber', label: 'Дансны дугаар', type: 'text', required: true, placeholder: '5001234567' },
    { name: 'balance', label: 'Үлдэгдэл', type: 'currency' },
    {
        name: 'currency', label: 'Валют', type: 'select', defaultValue: 'MNT', options: [
            { value: 'MNT', label: '₮ (MNT)' },
            { value: 'USD', label: '$ (USD)' },
            { value: 'EUR', label: '€ (EUR)' },
            { value: 'CNY', label: '¥ (CNY)' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function BankAccountsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = bankService.subscribeAccounts(business.id, (data) => {
            setAccounts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    return (
        <>
            <Header title="Банкны Данс" action={{ label: '+ Данс нэмэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                    {loading ? (
                        <div className="flex-center" style={{ gridColumn: '1 / -1', height: '200px' }}><Loader2 className="animate-spin" size={32} /></div>
                    ) : accounts.length === 0 ? (
                        <div className="empty-state card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
                            <Landmark size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                            <h3>Данс бүртгэгдээгүй байна</h3>
                            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ marginTop: 16 }}>Данс нэмэх</button>
                        </div>
                    ) : (
                        accounts.map(acc => (
                            <div key={acc.id} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setEditingItem(acc); setShowModal(true); }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'var(--primary)', opacity: 0.05, borderRadius: '0 0 0 100%' }} />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ width: 48, height: 48, background: 'var(--bg-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <Landmark size={24} />
                                        </div>
                                        <button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(acc); setShowModal(true); }}><Edit2 size={18} /></button>
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
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{acc.balance?.toLocaleString()} {acc.currency || '₮'}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#2ecc71', fontWeight: 600 }}>
                                            <ShieldCheck size={16} /> Холбогдсон
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                                        <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={ev => ev.stopPropagation()}><CreditCard size={14} /> Хуулга</button>
                                        <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={ev => ev.stopPropagation()}><TrendingUp size={14} /> Шинжилгээ</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal
                    title="Банкны данс"
                    icon={<Landmark size={20} />}
                    collectionPath="businesses/{bizId}/bankAccounts"
                    fields={BANK_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
