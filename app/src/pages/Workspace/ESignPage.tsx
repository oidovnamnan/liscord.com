import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { PenTool, FileText } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';
const ESIGN_FIELDS: CrudField[] = [
    { name: 'documentName', label: 'Баримтын нэр', type: 'text', required: true, span: 2 },
    { name: 'signerName', label: 'Гарын үсэг зурагч', type: 'text', required: true },
    { name: 'signerEmail', label: 'И-мэйл', type: 'email' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'signed', label: 'Гарын үсэг зурсан' }, { value: 'declined', label: 'Татгалзсан' }, { value: 'expired', label: 'Хугацаа дууссан' },
        ]
    },
    { name: 'dueDate', label: 'Хугацаа', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function ESignPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/eSignatures`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><PenTool size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Цахим Гарын Үсэг</h3>
                            <div className="fds-hero-desc">Цахим гарын үсгийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Хүсэлт
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Баримт</th><th>Гарын үсэг зурагч</th><th>И-мэйл</th><th>Хугацаа</th><th>Төлөв</th></tr></thead>
                            <tbody>{items.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Хүсэлт олдсонгүй</td></tr> :
                                items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{i.documentName}</td><td>{i.signerName}</td><td>{i.signerEmail || '-'}</td><td>{i.dueDate || '-'}</td><td><span className={`badge ${i.status === 'signed' ? 'badge-success' : i.status === 'declined' ? 'badge-danger' : i.status === 'expired' ? 'badge-soft' : 'badge-warning'}`}>{i.status === 'signed' ? 'Зурсан' : i.status === 'declined' ? 'Татгалзсан' : i.status === 'expired' ? 'Дууссан' : 'Хүлээгдэж буй'}</span></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Цахим гарын үсэг" icon={<PenTool size={20} />} collectionPath="businesses/{bizId}/eSignatures" fields={ESIGN_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
