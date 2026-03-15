import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { ClipboardCheck } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const AUDIT_FIELDS: CrudField[] = [
    { name: 'title', label: 'Нэр', type: 'text', required: true, span: 2, placeholder: '2024 Q1 Тооллого' },
    { name: 'warehouse', label: 'Агуулах', type: 'text' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'planned', options: [
            { value: 'planned', label: 'Төлөвлөсөн' }, { value: 'in_progress', label: 'Явагдаж буй' },
            { value: 'completed', label: 'Дууссан' }, { value: 'discrepancy', label: '⚠ Зөрүүтэй' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'itemsCounted', label: 'Тоолсон бараа', type: 'number' },
    { name: 'discrepancies', label: 'Зөрүүгийн тоо', type: 'number' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function InventoryAuditPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/inventoryAudits`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAudits(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><ClipboardCheck size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Тооллого</h3>
                            <div className="fds-hero-desc">Агуулахын тооллого</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Тооллого
                    </button>
                </div>
            </div>
                <div className="card" style={{ padding: 0, marginTop: 20 }}>
                    {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> : (
                        <table className="table"><thead><tr><th>Нэр</th><th>Агуулах</th><th>Огноо</th><th>Тоолсон</th><th>Зөрүү</th><th>Төлөв</th></tr></thead>
                            <tbody>{audits.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Тооллого олдсонгүй</td></tr> :
                                audits.map(a => (<tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(a); setShowModal(true); }}><td style={{ fontWeight: 600 }}>{a.title}</td><td>{a.warehouse || '-'}</td><td>{a.date || '-'}</td><td>{a.itemsCounted || 0}</td><td style={{ color: (a.discrepancies || 0) > 0 ? '#e74c3c' : '#2ecc71', fontWeight: 600 }}>{a.discrepancies || 0}</td><td><span className={`badge ${a.status === 'completed' ? 'badge-success' : a.status === 'discrepancy' ? 'badge-danger' : a.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>{a.status === 'completed' ? 'Дууссан' : a.status === 'discrepancy' ? 'Зөрүүтэй' : a.status === 'in_progress' ? 'Явагдаж буй' : 'Төлөвлөсөн'}</span></td></tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Тооллого" icon={<ClipboardCheck size={20} />} collectionPath="businesses/{bizId}/inventoryAudits" fields={AUDIT_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
