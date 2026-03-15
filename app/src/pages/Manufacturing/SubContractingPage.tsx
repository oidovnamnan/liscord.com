import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Users } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const SUB_FIELDS: CrudField[] = [
    { name: 'contractorName', label: 'Туслан гүйцэтгэгч', type: 'text', required: true },
    { name: 'projectName', label: 'Төсөл', type: 'text', required: true },
    { name: 'scope', label: 'Хамрах хүрээ', type: 'text' },
    { name: 'contractAmount', label: 'Гэрээний дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'draft', label: 'Ноорог' }, { value: 'active', label: 'Идэвхтэй' }, { value: 'completed', label: 'Дууссан' }, { value: 'terminated', label: 'Цуцалсан' },
        ]
    },
    { name: 'startDate', label: 'Эхлэх', type: 'date' }, { name: 'endDate', label: 'Дуусах', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function SubContractingPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/subContracts`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Users size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Туслан Гүйцэтгэгч</h3>
                            <div className="fds-hero-desc">Туслан гүйцэтгэгчийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Гэрээ
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Гүйцэтгэгч</th><th>Төсөл</th><th>Хүрээ</th><th>Дүн</th><th>Хугацаа</th><th>Төлөв</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.contractorName}</td><td>{i.projectName}</td><td>{i.scope || '-'}</td><td>{i.contractAmount ? i.contractAmount.toLocaleString() + ' ₮' : '-'}</td><td>{i.startDate || '-'} → {i.endDate || '-'}</td><td><span className={`badge ${i.status === 'completed' ? 'badge-success' : i.status === 'active' ? 'badge-info' : i.status === 'terminated' ? 'badge-danger' : ''}`}>{i.status === 'completed' ? 'Дууссан' : i.status === 'active' ? 'Идэвхтэй' : i.status === 'terminated' ? 'Цуцалсан' : 'Ноорог'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="Туслан гүйцэтгэлт" icon={<Users size={20} />} collectionPath="businesses/{bizId}/subContracts" fields={SUB_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
