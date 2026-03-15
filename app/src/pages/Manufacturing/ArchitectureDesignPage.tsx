import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Compass, Ruler} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const ARCH_FIELDS: CrudField[] = [
    { name: 'projectName', label: 'Төслийн нэр', type: 'text', required: true, span: 2 },
    {
        name: 'phase', label: 'Үе шат', type: 'select', options: [
            { value: 'concept', label: 'Санаа' }, { value: 'schematic', label: 'Ерөнхий зураг' }, { value: 'detailed', label: 'Нарийвчилсан зураг' }, { value: 'construction', label: 'Барилга' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'client', label: 'Захиалагч', type: 'text' },
    { name: 'area', label: 'Талбай (м²)', type: 'number' },
    { name: 'budget', label: 'Төсөв', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' }, { value: 'on_hold', label: 'Хойшлогдсон' }, { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function ArchitectureDesignPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/architectureDesigns`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Ruler size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Архитектур Дизайн</h3>
                            <div className="fds-hero-desc">Архитектурын зураг төсөл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Төсөл
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Төсөл</th><th>Захиалагч</th><th>Талбай</th><th>Төсөв</th><th>Үе шат</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.projectName}</td><td>{i.client || '-'}</td><td>{i.area || '-'} м²</td><td>{i.budget ? i.budget.toLocaleString() + ' ₮' : '-'}</td><td><span className="badge">{i.phase || '-'}</span></td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'on_hold' ? 'badge-warning' : 'badge-info'}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'on_hold' ? 'Хойшлогдсон' : 'Идэвхтэй'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="АД төсөл" icon={<Compass size={20} />} collectionPath="businesses/{bizId}/architectureDesigns" fields={ARCH_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
