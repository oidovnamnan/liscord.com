import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, CheckCircle} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const APPROVAL_FIELDS: CrudField[] = [
    { name: 'title', label: 'Гарчиг', type: 'text', required: true, span: 2 },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'expense', label: '💰 Зардал' },
            { value: 'leave', label: '🏖 Чөлөө' },
            { value: 'purchase', label: '🛒 Худалдан авалт' },
            { value: 'contract', label: '📄 Гэрээ' },
            { value: 'policy', label: '📋 Дүрэм' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'requestedBy', label: 'Хүсэлт гаргагч', type: 'text', required: true },
    { name: 'amount', label: 'Дүн', type: 'currency' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'pending', options: [
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
        ]
    },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function ApprovalsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/approvals`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <span className="badge badge-success"><CheckCircle2 size={12} /> Зөвшөөрсөн</span>;
            case 'rejected': return <span className="badge badge-danger"><XCircle size={12} /> Татгалзсан</span>;
            default: return <span className="badge badge-warning"><Clock size={12} /> Хүлээгдэж буй</span>;
        }
    };

    return (
        <HubLayout hubId="workspace-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><CheckCircle size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Зөвшөөрөл</h3>
                            <div className="fds-hero-desc">Хүсэлт зөвшөөрлийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Хүсэлт
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '20px 0' }}>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f39c12' }}>{approvals.filter(a => a.status === 'pending').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Хүлээгдэж мутуй</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2ecc71' }}>{approvals.filter(a => a.status === 'approved').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Зөвшөөрсөн</div></div>
                    <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e74c3c' }}>{approvals.filter(a => a.status === 'rejected').length}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Татгалзсан</div></div>
                </div>
                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Гарчиг</th><th>Төрөл</th><th>Хүсэгч</th><th>Дүн</th><th>Төлөв</th></tr></thead>
                            <tbody>
                                {approvals.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Хүсэлт олдсонгүй</td></tr>
                                ) : (
                                    approvals.map(a => (
                                        <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(a); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>{a.title}</td>
                                            <td>{a.type || '-'}</td>
                                            <td>{a.requestedBy || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{a.amount ? a.amount.toLocaleString() + ' ₮' : '-'}</td>
                                            <td>{getStatusBadge(a.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Зөвшөөрөл" icon={<ClipboardCheck size={20} />} collectionPath="businesses/{bizId}/approvals" fields={APPROVAL_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
