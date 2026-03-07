import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { CloudIcon, CheckCircle2, AlertCircle, FileText, TrendingUp, Search } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const EBARIMT_FIELDS: CrudField[] = [
    { name: 'receiptNumber', label: 'Баримтын дугаар', type: 'text', required: true },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'sale', label: 'Борлуулалтын' },
            { value: 'return', label: 'Буцаалтын' },
            { value: 'purchase', label: 'Худалдан авалтын' },
        ]
    },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true },
    { name: 'vat', label: 'НӨАТ', type: 'currency' },
    { name: 'customerTin', label: 'Хэрэглэгчийн ТТД', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'sent', options: [
            { value: 'sent', label: 'Илгээсэн' },
            { value: 'confirmed', label: 'Баталгаажсан' },
            { value: 'failed', label: 'Алдаатай' },
            { value: 'cancelled', label: 'Цуцалсан' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function EBarimtPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/ebarimts`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setReceipts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0);
    const totalVat = receipts.reduce((s, r) => s + (r.vat || 0), 0);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <Header title="Е-Баримт" action={{ label: '+ Шинэ баримт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: 'rgba(52,152,219,0.1)' }}><FileText size={20} color="#3498db" /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{receipts.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт баримт</div></div></div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: 'rgba(46,204,113,0.1)' }}><TrendingUp size={20} color="#2ecc71" /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalAmount.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт дүн</div></div></div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: 'rgba(155,89,182,0.1)' }}><CloudIcon size={20} color="#9b59b6" /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalVat.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>НӨАТ</div></div></div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Баримт №</th><th>Төрөл</th><th>Дүн</th><th>НӨАТ</th><th>Огноо</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {receipts.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Баримт олдсонгүй</td></tr>
                                ) : (
                                    receipts.map(r => (
                                        <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(r); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>{r.receiptNumber}</td>
                                            <td>{r.type || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{(r.amount || 0).toLocaleString()} ₮</td>
                                            <td>{(r.vat || 0).toLocaleString()} ₮</td>
                                            <td>{r.date || '-'}</td>
                                            <td><span className={`badge ${r.status === 'confirmed' ? 'badge-success' : r.status === 'failed' ? 'badge-danger' : r.status === 'cancelled' ? 'badge-soft' : 'badge-info'}`}>{r.status === 'confirmed' ? 'Баталгаажсан' : r.status === 'failed' ? 'Алдаатай' : r.status === 'cancelled' ? 'Цуцалсан' : 'Илгээсэн'}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Е-Баримт" icon={<CloudIcon size={20} />} collectionPath="businesses/{bizId}/ebarimts" fields={EBARIMT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
