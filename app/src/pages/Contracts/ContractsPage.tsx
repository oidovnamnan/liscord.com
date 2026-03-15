import { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Users, AlertTriangle, CheckCircle2, Clock, Search, ChevronRight, Edit2, FileSignature} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const CONTRACT_FIELDS: CrudField[] = [
    { name: 'title', label: 'Гэрээний нэр', type: 'text', required: true, span: 2, placeholder: 'Оффис түрээсийн гэрээ' },
    { name: 'partner', label: 'Хамтрагч', type: 'text', required: true, placeholder: 'Номин Холдинг' },
    {
        name: 'type', label: 'Төрөл', type: 'select', required: true, options: [
            { value: 'lease', label: '🏢 Түрээс' },
            { value: 'loan', label: '🏦 Зээл' },
            { value: 'leasing', label: '📋 Лизинг' },
            { value: 'pawn', label: '💎 Ломбард' },
            { value: 'vehicle', label: '🚗 Машин' },
            { value: 'service', label: '🔧 Үйлчилгээ' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'active', options: [
            { value: 'active', label: 'Идэвхтэй' },
            { value: 'warning', label: 'Анхааруулга' },
            { value: 'completed', label: 'Дууссан' },
            { value: 'expired', label: 'Хугацаа дууссан' },
        ]
    },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true },
    { name: 'monthly', label: 'Сар бүр төлөх', type: 'toggle' },
    { name: 'startDate', label: 'Эхлэх огноо', type: 'date', required: true },
    { name: 'endDate', label: 'Дуусах огноо', type: 'date', required: true },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Идэвхтэй', color: '#0be881' },
    warning: { label: 'Анхааруулга', color: '#f7b731' },
    completed: { label: 'Дууссан', color: '#4b7bec' },
    expired: { label: 'Хугацаа дууссан', color: '#fc5c65' },
};

const typeLabels: Record<string, string> = {
    lease: '🏢 Түрээс', loan: '🏦 Зээл', leasing: '📋 Лизинг',
    pawn: '💎 Ломбард', vehicle: '🚗 Машин', service: '🔧 Үйлчилгээ', other: '📄 Бусад'
};

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function ContractsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const q = query(collection(db, `businesses/${business.id}/contracts`), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setContracts(data);
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = contracts.filter(c => {
        if (filter !== 'all' && c.status !== filter) return false;
        if (search && !(c.title || '').toLowerCase().includes(search.toLowerCase()) && !(c.partner || '').toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const activeCount = contracts.filter(c => c.status === 'active').length;
    const totalValue = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.amount || 0), 0);
    const warningCount = contracts.filter(c => c.status === 'warning').length;

    return (
            <div className="animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><FileSignature size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Гэрээ</h3>
                            <div className="fds-hero-desc">Гэрээ, хэлцлийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Шинэ гэрээ
                    </button>
                </div>
            </div>
            <div className="page animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(11,232,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} color="#0be881" /></div>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeCount}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Идэвхтэй гэрээ</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(75,123,236,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={20} color="#4b7bec" /></div>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{fmt(totalValue)}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт дүн</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(247,183,49,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={20} color="#f7b731" /></div>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{warningCount}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Анхааруулга</div></div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(165,94,234,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} color="#a55eea" /></div>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{new Set(contracts.map(c => c.partner)).size}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Түнш байгууллага</div></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="input" placeholder="Гэрээ, түнш хайх..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {['all', 'active', 'warning', 'expired'].map(s => (
                            <button key={s} className={`btn btn-ghost ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ fontSize: '0.8rem' }}>
                                {s === 'all' ? 'Бүгд' : statusConfig[s]?.label || s}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? (
                        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Ачаалж байна...</div>
                    ) : filtered.length === 0 ? (
                        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Гэрээ олдсонгүй</div>
                    ) : (
                        filtered.map(contract => {
                            const status = statusConfig[contract.status] || statusConfig.active;
                            return (
                                <div key={contract.id} className="card card-clickable" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => { setEditingItem(contract); setShowModal(true); }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                        {(typeLabels[contract.type] || '📄').split(' ')[0]}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{contract.title || 'Гэрээ'}</div>
                                        <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            <span>{contract.partner}</span><span>•</span>
                                            <span><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{contract.startDate || '-'} — {contract.endDate || '-'}</span>
                                            <span>•</span><span>{typeLabels[contract.type] || contract.type}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmt(contract.amount || 0)}</div>
                                        {contract.monthly && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>сар бүр</div>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <span className="badge" style={{ background: `${status.color}22`, color: status.color, fontWeight: 600, fontSize: '0.75rem' }}>{status.label}</span>
                                        <ChevronRight size={16} color="var(--text-muted)" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal
                    title="Гэрээ"
                    icon={<FileText size={20} />}
                    collectionPath="businesses/{bizId}/contracts"
                    fields={CONTRACT_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
            </div>
        );
}
