import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { ShieldCheck } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
const QA_FIELDS: CrudField[] = [
    { name: 'testName', label: 'Шалгалтын нэр', type: 'text', required: true, span: 2 },
    { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true },
    { name: 'tester', label: 'Шалгагч', type: 'text' },
    {
        name: 'result', label: 'Дүн', type: 'select', required: true, options: [
            { value: 'pass', label: '✅ Тэнцсэн' }, { value: 'fail', label: '❌ Тэнцээгүй' }, { value: 'conditional', label: '⚠ Нөхцөлтэй' },
        ]
    },
    {
        name: 'severity', label: 'Түвшин', type: 'select', options: [
            { value: 'critical', label: 'Ноцтой' }, { value: 'major', label: 'Чухал' }, { value: 'minor', label: 'Бага' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'findings', label: 'Олдворууд', type: 'textarea', span: 2 },
];
export function QAPage() {
    const { business } = useBusinessStore(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [showModal, setShowModal] = useState(false); const [editingItem, setEditingItem] = useState<any>(null);
    useEffect(() => { if (!business?.id) return; const q = query(collection(db, `businesses/${business.id}/qa`), orderBy('createdAt', 'desc')); const unsub = onSnapshot(q, (snap) => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))); setLoading(false); }); return () => unsub(); }, [business?.id]);
    return (
        <HubLayout hubId="manufacturing-hub"><div className="page-container animate-fade-in"><Header title="Чанарын Баталгаа (QA)" action={{ label: '+ Шалгалт', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="card" style={{ padding: 0, marginTop: 20 }}>{loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (<table className="table"><thead><tr><th>Шалгалт</th><th>Бүтээгдэхүүн</th><th>Шалгагч</th><th>Огноо</th><th>Түвшин</th><th>Дүн</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Олдсонгүй</td></tr> : items.map(i => (<tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(i); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{i.testName}</td><td>{i.productName}</td><td>{i.tester || '-'}</td><td>{i.date || '-'}</td><td>{i.severity || '-'}</td><td><span className={`badge ${i.result === 'pass' ? 'badge-success' : i.result === 'fail' ? 'badge-danger' : 'badge-warning'}`}>{i.result === 'pass' ? 'Тэнцсэн' : i.result === 'fail' ? 'Тэнцээгүй' : 'Нөхцөлтэй'}</span></td></tr>))}</tbody></table>)}</div>
        </div>{showModal && <GenericCrudModal title="QA шалгалт" icon={<ShieldCheck size={20} />} collectionPath="businesses/{bizId}/qa" fields={QA_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>);
}
