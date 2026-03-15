import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Receipt } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const CLAIM_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтан', type: 'text', required: true },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'travel', label: '✈️ Албан томилолт' },
            { value: 'meals', label: '🍽 Хоол' },
            { value: 'transport', label: '🚕 Унаа' },
            { value: 'supplies', label: '📦 Хангамж' },
            { value: 'entertainment', label: '🎭 Зугаа' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true },
    { name: 'date', label: 'Огноо', type: 'date', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
            { value: 'paid', label: 'Олгосон' },
        ]
    },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function ExpensesClaimPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/expenseClaims`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalPending = claims.filter(c => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Receipt size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Зардлын Нэхэмжлэл</h3>
                            <div className="fds-hero-desc">Зардлын нэхэмжлэлийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Нэхэмжлэх
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{claims.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f39c12' }}>{claims.filter(c => c.status === 'pending').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Хүлээгдэж буй</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e74c3c' }}>{totalPending.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Хүлээгдэж буй дүн</div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Ажилтан</th><th>Ангилал</th><th>Дүн</th><th>Огноо</th><th>Төлөв</th></tr></thead>
                            <tbody>{claims.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Нэхэмжлэх олдсонгүй</td></tr> :
                                claims.map(c => (
                                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(c); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{c.employeeName}</td>
                                        <td>{c.category || '-'}</td>
                                        <td style={{ fontWeight: 600 }}>{(c.amount || 0).toLocaleString()} ₮</td>
                                        <td>{c.date || '-'}</td>
                                        <td><span className={`badge ${c.status === 'approved' ? 'badge-success' : c.status === 'rejected' ? 'badge-danger' : c.status === 'paid' ? 'badge-info' : 'badge-warning'}`}>{c.status === 'approved' ? 'Зөвшөөрсөн' : c.status === 'rejected' ? 'Татгалзсан' : c.status === 'paid' ? 'Олгосон' : 'Хүлээгдэж буй'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Зардлын нэхэмжлэх" icon={<Receipt size={20} />} collectionPath="businesses/{bizId}/expenseClaims" fields={CLAIM_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
