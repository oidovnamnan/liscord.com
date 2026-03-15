import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const TB_FIELDS: CrudField[] = [
    { name: 'projectName', label: 'Төсөл', type: 'text', required: true },
    { name: 'employeeName', label: 'Ажилтан', type: 'text', required: true },
    { name: 'hours', label: 'Цаг', type: 'number', required: true },
    { name: 'hourlyRate', label: 'Цагийн хөлс', type: 'currency' },
    { name: 'totalBilled', label: 'Нийт дүн', type: 'currency' },
    { name: 'date', label: 'Огноо', type: 'date' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'unbilled', options: [
            { value: 'unbilled', label: 'Тооцоогүй' }, { value: 'billed', label: 'Тооцсон' }, { value: 'paid', label: 'Төлсөн' },
        ]
    },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];
export function TimesheetBillingPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/timesheetBilling`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    const totalBilled = items.reduce((s, i) => s + (i.totalBilled || 0), 0);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Clock size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Цагийн Тооцоо</h3>
                            <div className="fds-hero-desc">Цагийн бүртгэл, нэхэмжлэл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Бүртгэл
                    </button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0' }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{items.length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт бүртгэл</div></div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3498db' }}>{items.reduce((s, i) => s + (i.hours || 0), 0)}ц</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт цаг</div></div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2ecc71' }}>{totalBilled.toLocaleString()} ₮</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт дүн</div></div>
            </div>
            <div className="card" style={{ padding: 0 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Төсөл</th><th>Ажилтан</th><th>Цаг</th><th>Хөлс</th><th>Нийт</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.projectName}</td><td>{i.employeeName}</td><td>{i.hours}ц</td><td>{i.hourlyRate ? i.hourlyRate.toLocaleString() + ' ₮' : '-'}</td><td style={{ fontWeight: 700, color: '#2ecc71' }}>{i.totalBilled ? i.totalBilled.toLocaleString() + ' ₮' : '-'}</td><td><span className={`badge ${i.status === 'paid' ? 'badge-success' : i.status === 'billed' ? 'badge-info' : 'badge-warning'}`}>{i.status === 'paid' ? 'Төлсөн' : i.status === 'billed' ? 'Тооцсон' : 'Тооцоогүй'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Цаг & тооцоо" icon={<Clock size={20} />} collectionPath="businesses/{bizId}/timesheetBilling" fields={TB_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
