import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const QC_FIELDS: CrudField[] = [
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'batchNumber', label: 'Багцийн дугаар', type: 'text' },
    { name: 'inspector', label: 'Шалгагч', type: 'text' },
    {
        name: 'result', label: 'Дүн', type: 'select', required: true, options: [
            { value: 'pass', label: '✅ Тэнцсэн' }, { value: 'fail', label: '❌ Тэнцээгүй' }, { value: 'partial', label: '⚠ Хэсэгчлэн' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'defectsFound', label: 'Гэмтэл', type: 'number', defaultValue: '0' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];
export function QualityControlPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/qualityControl`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setChecks(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <Header title="Чанарын Хяналт" action={{ label: '+ Шалгалт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Бүтээгдэхүүн</th><th>Багц</th><th>Шалгагч</th><th>Огноо</th><th>Гэмтэл</th><th>Дүн</th></tr></thead>
                            <tbody>{checks.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Шалгалт олдсонгүй</td></tr> :
                                checks.map(c => (<tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(c); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{c.productName}</td><td>{c.batchNumber || '-'}</td><td>{c.inspector || '-'}</td><td>{c.date || '-'}</td><td style={{ color: (c.defectsFound || 0) > 0 ? '#e74c3c' : '#2ecc71' }}>{c.defectsFound || 0}</td><td><span className={`badge ${c.result === 'pass' ? 'badge-success' : c.result === 'fail' ? 'badge-danger' : 'badge-warning'}`}>{c.result === 'pass' ? 'Тэнцсэн' : c.result === 'fail' ? 'Тэнцээгүй' : 'Хэсэгчлэн'}</span></td></tr>))}
                            </tbody></table>)}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Чанарын шалгалт" icon={<ShieldCheck size={20} />} collectionPath="businesses/{bizId}/qualityControl" fields={QC_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
