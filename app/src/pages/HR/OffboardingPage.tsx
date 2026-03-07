import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { UserMinus, CheckCircle2, Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const OFFBOARD_FIELDS: CrudField[] = [
    { name: 'employeeName', label: 'Ажилтны нэр', type: 'text', required: true },
    { name: 'department', label: 'Хэлтэс', type: 'text' },
    {
        name: 'reason', label: 'Шалтгаан', type: 'select', required: true, options: [
            { value: 'resignation', label: 'Өөрөө гарсан' },
            { value: 'termination', label: 'Халагдсан' },
            { value: 'retirement', label: 'Тэтгэвэрт' },
            { value: 'contract_end', label: 'Гэрээ дууссан' },
            { value: 'layoff', label: 'Цомхотгол' },
        ]
    },
    { name: 'lastDay', label: 'Сүүлийн ажлын өдөр', type: 'date', required: true },
    {
        name: 'status', label: 'Процесс', type: 'select', defaultValue: 'in_progress', options: [
            { value: 'in_progress', label: 'Явагдаж буй' },
            { value: 'completed', label: 'Дууссан' },
        ]
    },
    { name: 'equipmentReturned', label: 'Тоноглол буцаасан', type: 'toggle' },
    { name: 'exitInterview', label: 'Гарах ярилцлага', type: 'toggle' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function OffboardingPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/offboarding`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="hr-hub">
            <div className="page-container animate-fade-in">
                <Header title="Ажилтан гарах процесс" action={{ label: '+ Бүртгэх', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Ажилтан</th><th>Хэлтэс</th><th>Шалтгаан</th><th>Сүүлийн өдөр</th><th>Тоноглол</th><th>Ярилцлага</th><th>Төлөв</th></tr></thead>
                            <tbody>{records.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Бүртгэл олдсонгүй</td></tr> :
                                records.map(r => (
                                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(r); setShowModal(true); }}>
                                        <td style={{ fontWeight: 600 }}>{r.employeeName}</td>
                                        <td>{r.department || '-'}</td>
                                        <td>{r.reason || '-'}</td>
                                        <td>{r.lastDay || '-'}</td>
                                        <td>{r.equipmentReturned ? <CheckCircle2 size={16} color="#2ecc71" /> : <Clock size={16} color="#f39c12" />}</td>
                                        <td>{r.exitInterview ? <CheckCircle2 size={16} color="#2ecc71" /> : <Clock size={16} color="#f39c12" />}</td>
                                        <td><span className={`badge ${r.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{r.status === 'completed' ? 'Дууссан' : 'Явагдаж буй'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Offboarding" icon={<UserMinus size={20} />} collectionPath="businesses/{bizId}/offboarding" fields={OFFBOARD_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
