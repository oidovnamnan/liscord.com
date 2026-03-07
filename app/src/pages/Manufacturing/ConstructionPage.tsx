import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { Building, HardHat } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const CONST_FIELDS: CrudField[] = [
    { name: 'projectName', label: 'Төслийн нэр', type: 'text', required: true, span: 2 },
    { name: 'location', label: 'Байршил', type: 'text' },
    { name: 'contractor', label: 'Гүйцэтгэгч', type: 'text' },
    { name: 'budget', label: 'Төсөв', type: 'currency' },
    { name: 'spent', label: 'Зарцуулсан', type: 'currency' },
    { name: 'progress', label: 'Ахиц (%)', type: 'number' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'planning', options: [
            { value: 'planning', label: 'Төлөвлөж буй' }, { value: 'in_progress', label: 'Явагдаж буй' }, { value: 'completed', label: 'Дууссан' }, { value: 'on_hold', label: 'Хойшлогдсон' },
        ]
    },
    { name: 'startDate', label: 'Эхлэх', type: 'date' },
    { name: 'endDate', label: 'Дуусах', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function ConstructionPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/construction`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="Барилга & Бүтээн Байгуулалт" action={{ label: '+ Төсөл', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Төсөл</th><th>Байршил</th><th>Гүйцэтгэгч</th><th>Төсөв</th><th>Ахиц</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.projectName}</td><td>{i.location || '-'}</td><td>{i.contractor || '-'}</td><td>{i.budget ? i.budget.toLocaleString() + ' ₮' : '-'}</td><td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-hover)' }}><div style={{ height: '100%', width: `${i.progress || 0}%`, background: 'var(--primary)', borderRadius: 3 }} /></div><span style={{ fontSize: '0.8rem' }}>{i.progress || 0}%</span></div></td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'in_progress' ? 'badge-info' : i.status === 'on_hold' ? 'badge-danger' : 'badge-warning'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'in_progress' ? 'Явагдаж буй' : i.status === 'on_hold' ? 'Хойшлогдсон' : 'Төлөвлөж буй'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Барилга" icon={<Building size={20} />} collectionPath="businesses/{bizId}/construction" fields={CONST_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
