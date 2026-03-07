import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Bitcoin, ShieldCheck } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const CRYPTO_FIELDS: CrudField[] = [
    { name: 'walletAddress', label: 'Хэтэвчийн хаяг', type: 'text', required: true, span: 2 },
    {
        name: 'currency', label: 'Криптовалют', type: 'select', required: true, options: [
            { value: 'BTC', label: '₿ Bitcoin' }, { value: 'ETH', label: 'Ξ Ethereum' },
            { value: 'USDT', label: '$ USDT' }, { value: 'USDC', label: '$ USDC' },
        ]
    },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'receive', label: 'Хүлээн авах' }, { value: 'send', label: 'Илгээх' }, { value: 'exchange', label: 'Хөрвүүлэх' },
        ]
    },
    { name: 'amount', label: 'Криптод хэмжээ', type: 'number', required: true },
    { name: 'fiatAmount', label: 'MNT дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'confirmed', label: 'Баталгаажсан' }, { value: 'failed', label: 'Алдаатай' },
        ]
    },
    { name: 'txHash', label: 'Гүйлгээний хэш', type: 'text', span: 2 },
];

export function CryptoPaymentsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [txs, setTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/cryptoPayments`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header title="Крипто Төлбөр" action={{ label: '+ Гүйлгээ', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        txs.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Bitcoin size={48} color="var(--text-muted)" /><h3>Гүйлгээ байхгүй</h3></div> :
                            txs.map(t => (
                                <div key={t.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(t); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span className="badge badge-info">{t.currency}</span>
                                        <span className={`badge ${t.status === 'confirmed' ? 'badge-success' : t.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>{t.status === 'confirmed' ? 'Баталгаажсан' : t.status === 'failed' ? 'Алдаатай' : 'Хүлээгдэж буй'}</span>
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t.amount} {t.currency}</div>
                                    {t.fiatAmount && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.fiatAmount.toLocaleString()} ₮</div>}
                                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.walletAddress}</div>
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Крипто гүйлгээ" icon={<Bitcoin size={20} />} collectionPath="businesses/{bizId}/cryptoPayments" fields={CRYPTO_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
