import { useState, useEffect } from 'react';
import { HubLayout } from '../../components/common/HubLayout';
import { Link, RefreshCw, ArrowRightLeft, CheckCircle2, Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const BANKSYNC_FIELDS: CrudField[] = [
    {
        name: 'bankName', label: 'Банк', type: 'select', required: true, options: [
            { value: 'khan', label: 'Хаан банк' }, { value: 'golomt', label: 'Голомт банк' },
            { value: 'tdb', label: 'ХХБ' }, { value: 'state', label: 'Төрийн банк' },
            { value: 'xac', label: 'ХАС банк' }, { value: 'ckbank', label: 'Капитрон банк' },
        ]
    },
    { name: 'accountNumber', label: 'Дансны дугаар', type: 'text', required: true },
    { name: 'accountName', label: 'Дансны нэр', type: 'text' },
    { name: 'lastSyncDate', label: 'Сүүлийн синк', type: 'date' },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Холбогдсон' }, { value: 'disconnected', label: 'Холболт тасарсан' }, { value: 'pending', label: 'Хүлээгдэж буй' },
        ]
    },
    { name: 'autoSync', label: 'Автомат синк', type: 'toggle', defaultValue: true },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function BankSyncPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/bankSync`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    return (
        <HubLayout hubId="finance-hub">
            <div className="page-container animate-fade-in">
                <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><RefreshCw size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Банк Тулгалт</h3>
                            <div className="fds-hero-desc">Банкны гүйлгээний тулгалт</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Холболт
                    </button>
                </div>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 20 }}>
                    {loading ? <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div> :
                        connections.length === 0 ? <div className="card" style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}><Link size={48} color="var(--text-muted)" /><h3>Банкны холболт байхгүй</h3></div> :
                            connections.map(c => (
                                <div key={c.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => { setEditingItem(c); setShowModal(true); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'disconnected' ? 'badge-danger' : 'badge-warning'}`}>
                                            {c.status === 'active' ? <><CheckCircle2 size={12} /> Холбогдсон</> : c.status === 'disconnected' ? 'Тасарсан' : <><Clock size={12} /> Хүлээгдэж буй</>}
                                        </span>
                                        {c.autoSync && <RefreshCw size={14} color="#2ecc71" />}
                                    </div>
                                    <h4 style={{ margin: '0 0 4px' }}>{c.bankName}</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.accountNumber} • {c.accountName || ''}</div>
                                    {c.lastSyncDate && <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Сүүлд: {c.lastSyncDate}</div>}
                                </div>
                            ))}
                </div>
            </div>
            {showModal && <GenericCrudModal title="Банкны холболт" icon={<Link size={20} />} collectionPath="businesses/{bizId}/bankSync" fields={BANKSYNC_FIELDS} editingItem={editingItem} onClose={() => setShowModal(false)} />}
        </HubLayout>
    );
}
