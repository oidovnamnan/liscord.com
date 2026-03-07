import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const COMMISSION_FIELDS: CrudField[] = [
    { name: 'salesperson', label: 'Борлуулагч', type: 'text', required: true },
    { name: 'dealName', label: 'Хэлцэл', type: 'text', required: true },
    { name: 'dealAmount', label: 'Хэлцлийн дүн', type: 'currency', required: true },
    { name: 'commissionRate', label: 'Шимтгэл %', type: 'number', required: true },
    { name: 'commissionAmount', label: 'Шимтгэл дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Тооцоогүй' },
            { value: 'approved', label: 'Баталсан' },
            { value: 'paid', label: 'Олгосон' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
];

export function SalesCommissionsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [commissions, setCommissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/salesCommissions`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalCommissions = commissions.reduce((s, c) => s + (c.commissionAmount || 0), 0);

    return (
        <HubLayout hubId="crm-hub">
            <div className="page-container animate-fade-in">
                <Header title="Борлуулалтын Шимтгэл" action={{ label: '+ Шимтгэл', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><DollarSign size={24} color="var(--primary)" /><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{commissions.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><TrendingUp size={24} color="#2ecc71" /><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalCommissions.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт шимтгэл</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><Users size={24} color="#9b59b6" /><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{new Set(commissions.map(c => c.salesperson)).size}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Борлуулагч</div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Борлуулагч</th><th>Хэлцэл</th><th>Хэлцлийн дүн</th><th>%</th><th>Шимтгэл</th><th>Төлөв</th></tr></thead>
                            <tbody>{commissions.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                commissions.map(c => (
                                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(c); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{c.salesperson}</td><td>{c.dealName}</td>
                                        <td>{(c.dealAmount || 0).toLocaleString()} ₮</td><td>{c.commissionRate}%</td>
                                        <td style={{ fontWeight: 700, color: '#2ecc71' }}>{(c.commissionAmount || 0).toLocaleString()} ₮</td>
                                        <td><span className={`badge ${c.status === 'paid' ? 'badge-success' : c.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>{c.status === 'paid' ? 'Олгосон' : c.status === 'approved' ? 'Баталсан' : 'Тооцоогүй'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Борлуулалтын шимтгэл" icon={<DollarSign size={20} />} collectionPath="businesses/{bizId}/salesCommissions" fields={COMMISSION_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
