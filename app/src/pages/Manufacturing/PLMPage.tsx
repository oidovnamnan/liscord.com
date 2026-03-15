import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Database, GitBranch, Workflow} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const PLM_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true, span: 2 },
    { name: 'version', label: 'Хувилбар', type: 'text', placeholder: 'v1.0' },
    {
        name: 'stage', label: 'Үе шат', type: 'select', options: [
            { value: 'concept', label: '💡 Санаа' }, { value: 'design', label: '✏️ Дизайн' }, { value: 'prototype', label: '🔧 Прототип' },
            { value: 'testing', label: '🧪 Туршилт' }, { value: 'production', label: '🏭 Үйлдвэрлэл' }, { value: 'retired', label: '📦 Зогссон' },
        ]
    },
    { name: 'owner', label: 'Хариуцагч', type: 'text' },
    { name: 'launchDate', label: 'Гарах огноо', type: 'date' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];
export function PLMPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/plm`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><Workflow size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">PLM</h3>
                            <div className="fds-hero-desc">Бүтээгдэхүүний амьдралын цикл</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Бүтээгдэхүүн
                    </button>
                </div>
            </div>
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Хувилбар</th><th>Үе шат</th><th>Хариуцагч</th><th>Огноо</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.productName}</td><td><GitBranch size={12} /> {i.version || '-'}</td><td><span className="badge">{i.stage || '-'}</span></td><td>{i.owner || '-'}</td><td>{i.launchDate || '-'}</td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="PLM" icon={<Database size={20} />} collectionPath="businesses/{bizId}/plm" fields={PLM_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
