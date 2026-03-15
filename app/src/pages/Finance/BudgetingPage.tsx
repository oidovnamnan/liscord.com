import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const BUDGET_FIELDS: CrudField[] = [
    { name: 'name', label: 'Төсвийн нэр', type: 'text', required: true, span: 2, placeholder: 'Q1 Маркетинг төсөв' },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'marketing', label: 'Маркетинг' },
            { value: 'operations', label: 'Үйл ажиллагаа' },
            { value: 'salary', label: 'Цалин' },
            { value: 'development', label: 'Хөгжүүлэлт' },
            { value: 'rent', label: 'Түрээс' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'period', label: 'Хугацаа', type: 'select', options: [
            { value: 'monthly', label: 'Сар' },
            { value: 'quarterly', label: 'Улирал' },
            { value: 'annual', label: 'Жил' },
        ]
    },
    { name: 'plannedAmount', label: 'Төлөвлөсөн', type: 'currency', required: true },
    { name: 'actualAmount', label: 'Бодит', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' },
            { value: 'overbudget', label: 'Хэтэрсэн' },
            { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function BudgetingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/budgets`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const totalPlanned = budgets.reduce((s, b) => s + (b.plannedAmount || 0), 0);
    const totalActual = budgets.reduce((s, b) => s + (b.actualAmount || 0), 0);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Target size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Төсөв</h3>
                            <div className="fds-hero-desc">Төсвийн төлөвлөлт, хяналт</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Төсөв
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: 'rgba(52,152,219,0.1)', color: '#3498db' }}><Target size={20} /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalPlanned.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Төлөвлөсөн</div></div></div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: 'rgba(46,204,113,0.1)', color: '#2ecc71' }}><TrendingUp size={20} /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalActual.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Бодит</div></div></div></div>
                    <div className="card" style={{ padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ padding: 10, borderRadius: 10, background: totalActual > totalPlanned ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)', color: totalActual > totalPlanned ? '#e74c3c' : '#2ecc71' }}><AlertTriangle size={20} /></div><div><div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}%</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Гүйцэтгэл</div></div></div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Төсөв</th><th>Ангилал</th><th>Хугацаа</th><th>Төлөвлөсөн</th><th>Бодит</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {budgets.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Төсөв олдсонгүй</td></tr>
                                ) : (
                                    budgets.map(b => (
                                        <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(b); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>{b.name}</td>
                                            <td>{b.category || '-'}</td>
                                            <td>{b.period || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{(b.plannedAmount || 0).toLocaleString()} ₮</td>
                                            <td style={{ fontWeight: 600, color: (b.actualAmount || 0) > (b.plannedAmount || 0) ? '#e74c3c' : '#2ecc71' }}>{(b.actualAmount || 0).toLocaleString()} ₮</td>
                                            <td><span className={`badge ${b.status === 'overbudget' ? 'badge-danger' : b.status === 'completed' ? 'badge-soft' : 'badge-success'}`}>{b.status === 'overbudget' ? 'Хэтэрсэн' : b.status === 'completed' ? 'Дууссан' : 'Идэвхтэй'}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Төсөв" icon={<Target size={20} />} collectionPath="businesses/{bizId}/budgets" fields={BUDGET_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
