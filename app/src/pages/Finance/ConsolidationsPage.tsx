import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { LayoutDashboard, PieChart, BarChart3, Layers} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const CONSOLIDATION_FIELDS: CrudField[] = [
    { name: 'name', label: 'Нэр', type: 'text', required: true, span: 2, placeholder: 'Q1 2024 Нэгтгэл' },
    {
        name: 'period', label: 'Хугацаа', type: 'select', required: true, options: [
            { value: 'monthly', label: 'Сар' }, { value: 'quarterly', label: 'Улирал' }, { value: 'annual', label: 'Жил' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' }, { value: 'in_progress', label: 'Хийгдэж буй' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'totalRevenue', label: 'Нийт орлого', type: 'currency' },
    { name: 'totalExpense', label: 'Нийт зардал', type: 'currency' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function ConsolidationsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/consolidations`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Layers size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Нэгтгэл</h3>
                            <div className="fds-hero-desc">Санхүүгийн нэгтгэл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Нэгтгэл
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нэр</th><th>Хугацаа</th><th>Орлого</th><th>Зардал</th><th>Ашиг</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Нэгтгэл олдсонгүй</td></tr> :
                                items.map(i => (
                                    <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{i.name}</td><td>{i.period || '-'}</td>
                                        <td style={{ color: '#2ecc71' }}>{(i.totalRevenue || 0).toLocaleString()} ₮</td>
                                        <td style={{ color: '#e74c3c' }}>{(i.totalExpense || 0).toLocaleString()} ₮</td>
                                        <td style={{ fontWeight: 700 }}>{((i.totalRevenue || 0) - (i.totalExpense || 0)).toLocaleString()} ₮</td>
                                        <td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'in_progress' ? 'badge-info' : ''}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'in_progress' ? 'Хийгдэж буй' : 'Ноорог'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Нэгтгэл" icon={<PieChart size={20} />} collectionPath="businesses/{bizId}/consolidations" fields={CONSOLIDATION_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
