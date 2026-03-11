import { useState, useEffect } from 'react';
import { Truck, Plus, Package, CheckCircle2, Clock, MapPin, Search, Loader2, MoreHorizontal, Eye } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Inventory/InventoryPage.css';

const FIELDS: CrudField[] = [
    { name: 'client', label: 'Үйлчлүүлэгч', type: 'text', required: true },
    { name: 'origin', label: 'Гарах газар', type: 'text', required: true },
    { name: 'destination', label: 'Хүрэх газар', type: 'text', required: true },
    { name: 'weight', label: 'Жин (кг)', type: 'number' },
    {
        name: 'service', label: 'Үйлчилгээ', type: 'select', options: [
            { value: 'warehouse', label: 'Агуулахын хадгалалт' },
            { value: 'transport', label: 'Тээвэрлэлт' },
            { value: 'fulfillment', label: 'Гүйцэтгэл (Fulfillment)' }
        ]
    },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'received', options: [
            { value: 'received', label: 'Хүлээн авсан' },
            { value: 'processing', label: 'Боловсруулж буй' },
            { value: 'shipped', label: 'Илгээсэн' },
            { value: 'delivered', label: 'Хүргэсэн' }
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

const STATUS_MAP: Record<string, { label: string; badge: string; color: string }> = {
    received: { label: 'Хүлээн авсан', badge: 'badge-secondary', color: 'var(--text-muted)' },
    processing: { label: 'Боловсруулж буй', badge: 'badge-warning', color: '#f59e0b' },
    shipped: { label: 'Илгээсэн', badge: 'badge-primary', color: 'var(--primary)' },
    delivered: { label: 'Хүргэсэн', badge: 'badge-success', color: '#10b981' },
};

const SERVICE_MAP: Record<string, string> = {
    warehouse: 'Агуулах',
    transport: 'Тээвэр',
    fulfillment: 'Гүйцэтгэл',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Logistics3PLPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (!business?.id) return;
        const q = query(
            collection(db, `businesses/${business.id}/logistics3pl`),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, s => {
            setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [business?.id]);

    const filtered = items.filter(item => {
        const matchSearch = !searchTerm ||
            item.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.destination?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: items.length,
        delivered: items.filter(i => i.status === 'delivered').length,
        processing: items.filter(i => i.status === 'processing').length,
        shipped: items.filter(i => i.status === 'shipped').length,
    };

    return (
        <div className="inventory-page">
            {/* Premium Hero */}
            <div className="page-hero" style={{ marginBottom: 8 }}>
                <div className="page-hero-left">
                    <div className="page-hero-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <Truck size={24} color="white" />
                    </div>
                    <div>
                        <h2 className="page-hero-title">3PL Логистик</h2>
                        <p className="page-hero-subtitle">
                            {items.length > 0 ? `${items.length} захиалга • ${stats.delivered} хүргэгдсэн` : 'Гуравдагч талын логистик үйлчилгээ'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-primary gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                        <Plus size={18} />
                        <span>Захиалга нэмэх</span>
                    </button>
                </div>
            </div>

            {/* Glassmorphism Stats Grid */}
            <div className="inv-stats-grid">
                <div className="inv-stat-card clickable" onClick={() => setStatusFilter('all')}>
                    <div className="inv-stat-content">
                        <span className="inv-stat-label">НИЙТ ЗАХИАЛГА</span>
                        <span className="inv-stat-value">{stats.total}</span>
                    </div>
                    <div className="inv-stat-icon icon-primary">
                        <Package size={22} />
                    </div>
                </div>
                <div className="inv-stat-card clickable" onClick={() => setStatusFilter('delivered')}>
                    <div className="inv-stat-content">
                        <span className="inv-stat-label">ХҮРГЭГДСЭН</span>
                        <span className="inv-stat-value">{stats.delivered}</span>
                    </div>
                    <div className="inv-stat-icon icon-green">
                        <CheckCircle2 size={22} />
                    </div>
                </div>
                <div className="inv-stat-card clickable" onClick={() => setStatusFilter('processing')}>
                    <div className="inv-stat-content">
                        <span className="inv-stat-label">БОЛОВСРУУЛЖ БУЙ</span>
                        <span className="inv-stat-value">{stats.processing}</span>
                    </div>
                    <div className="inv-stat-icon icon-red">
                        <Clock size={22} />
                    </div>
                </div>
                <div className="inv-stat-card clickable" onClick={() => setStatusFilter('shipped')}>
                    <div className="inv-stat-content">
                        <span className="inv-stat-label">ИЛГЭЭСЭН</span>
                        <span className="inv-stat-value">{stats.shipped}</span>
                    </div>
                    <div className="inv-stat-icon icon-cyan">
                        <MapPin size={22} />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="inv-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', flexWrap: 'nowrap' }}>
                <div className="orders-search" style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        placeholder="Хайх... (үйлчлүүлэгч, газар)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 36, height: 40, fontSize: '0.85rem' }}
                    />
                </div>
                <select
                    className="input select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: 180, height: 40, fontSize: '0.82rem', flexShrink: 0, paddingRight: 32 }}
                >
                    <option value="all">Бүх төлөв</option>
                    <option value="received">Хүлээн авсан</option>
                    <option value="processing">Боловсруулж буй</option>
                    <option value="shipped">Илгээсэн</option>
                    <option value="delivered">Хүргэсэн</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                {loading ? (
                    <div style={{ padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ачаалж байна...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 64, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Package size={28} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                                {searchTerm || statusFilter !== 'all' ? 'Илэрц олдсонгүй' : 'Захиалга байхгүй'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Хайлтын нөхцөлийг өөрчлөөд дахин шалгана уу'
                                    : '"Захиалга нэмэх" товч дарж эхний захиалгаа үүсгэнэ үү'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 20 }}>ҮЙЛЧЛҮҮЛЭГЧ</th>
                                <th>МАРШРУТ</th>
                                <th>ЖИН</th>
                                <th>ҮЙЛЧИЛГЭЭ</th>
                                <th>ТӨЛӨВ</th>
                                <th style={{ width: 48 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const s = STATUS_MAP[item.status] || STATUS_MAP.received;
                                return (
                                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(item); setShowModal(true); }}>
                                        <td style={{ paddingLeft: 20 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.client}</div>
                                            {item.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes}</div>}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                                                <span style={{ fontWeight: 600 }}>{item.origin}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>→</span>
                                                <span style={{ fontWeight: 600 }}>{item.destination}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                {item.weight ? `${item.weight} кг` : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-soft" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                                                {SERVICE_MAP[item.service] || item.service || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${s.badge}`} style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.02em' }}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setEditingItem(item); setShowModal(true); }}>
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Total count footer */}
            {!loading && filtered.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{filtered.length} захиалга{statusFilter !== 'all' ? ` (${STATUS_MAP[statusFilter]?.label || statusFilter})` : ''}</span>
                </div>
            )}

            {showModal && (
                <GenericCrudModal
                    title="3PL захиалга"
                    icon={<Truck size={20} />}
                    collectionPath="businesses/{bizId}/logistics3pl"
                    fields={FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
