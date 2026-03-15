import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, MoreVertical, ShoppingCart, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { procurementService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import { HubLayout } from '../../components/common/HubLayout';
import './InventoryPage.css';
import './ProcurementPage.css';

const PO_FIELDS: CrudField[] = [
    { name: 'supplierName', label: 'Нийлүүлэгч', type: 'text', required: true, placeholder: 'Нийлүүлэгчийн нэр' },
    { name: 'supplierPhone', label: 'Утас', type: 'phone' },
    { name: 'totalAmount', label: 'Нийт дүн', type: 'currency', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'received', label: 'Хүлээж авсан' },
            { value: 'cancelled', label: 'Цуцалсан' },
        ]
    },
    { name: 'expectedDate', label: 'Хүлээгдэж буй огноо', type: 'date' },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function ProcurementPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = procurementService.subscribeOrders(business.id, (data) => {
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.id || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'received': return { label: 'Хүлээж авсан', className: 'status-received' };
            case 'pending': return { label: 'Хүлээгдэж буй', className: 'status-pending' };
            case 'draft': return { label: 'Ноорог', className: 'status-draft' };
            case 'cancelled': return { label: 'Цуцалсан', className: 'status-cancelled' };
            default: return { label: status, className: 'status-draft' };
        }
    };

    const countPending = orders.filter(o => o.status === 'pending').length;
    const countReceived = orders.filter(o => o.status === 'received').length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <HubLayout hubId="inventory-hub">
            <div style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
                {/* ── Premium Hero ── */}
                <div className="inv-hero po-hero">
                    <div className="inv-hero-top">
                        <div className="inv-hero-left">
                            <div className="inv-hero-icon"><ShoppingCart size={24} /></div>
                            <div>
                                <h2 className="inv-hero-title">Худалдан Авалт (PO)</h2>
                                <div className="inv-hero-desc">Нийлүүлэгчид рүү илгээх худалдан авалтын захиалга</div>
                            </div>
                        </div>
                        <button className="inv-hero-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                            <Plus size={16} />
                            <span>Шинэ PO</span>
                        </button>
                    </div>
                    <div className="inv-hero-stats">
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{orders.length}</div>
                            <div className="inv-hero-stat-label">Нийт PO</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{countPending}</div>
                            <div className="inv-hero-stat-label">Хүлээгдэж буй</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{countReceived}</div>
                            <div className="inv-hero-stat-label">Хүлээн авсан</div>
                        </div>
                        <div className="inv-hero-stat">
                            <div className="inv-hero-stat-value">{totalAmount > 0 ? (totalAmount / 1000000).toFixed(1) + 'M ₮' : '0 ₮'}</div>
                            <div className="inv-hero-stat-label">Нийт Дүн</div>
                        </div>
                    </div>
                </div>

                {/* ── Card Container (toolbar + table) ── */}
                <div className="inv-page-card">

                <div className="inv-toolbar">
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input className="inv-search-input" placeholder="Нийлүүлэгч эсвэл PO кодоор хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            minWidth: 140,
                            height: 46,
                            cursor: 'pointer',
                            padding: '0 40px 0 16px',
                            fontFamily: 'inherit',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            background: `var(--surface-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center`,
                            border: '1.5px solid var(--border-primary)',
                            borderRadius: 14,
                            appearance: 'none' as const,
                            WebkitAppearance: 'none' as const,
                            outline: 'none',
                        }}
                    >
                        <option value="all">Бүх төлөв</option><option value="draft">Ноорог</option><option value="pending">Хүлээгдэж буй</option><option value="received">Хүлээж авсан</option>
                    </select>
                </div>

                <div className="proc-table-container">
                    {loading ? (
                        <div className="proc-loading"><Loader2 size={36} className="animate-spin" /><p className="proc-loading-text">Өгөгдөл ачаалж байна...</p></div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="proc-empty-state"><div className="proc-empty-icon"><ShoppingCart size={40} /></div><div className="proc-empty-title">Захиалга олдсонгүй</div></div>
                    ) : (
                        <table className="proc-table">
                            <thead><tr><th>PO Код</th><th>Огноо</th><th>Нийлүүлэгч</th><th>Дүн</th><th>Барааны тоо</th><th>Төлөв</th><th style={{ width: 50 }}></th></tr></thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const statusInfo = getStatusInfo(order.status);
                                    return (
                                        <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(order); setShowModal(true); }}>
                                            <td><span className="proc-po-code">#{order.id.slice(0, 6).toUpperCase()}</span></td>
                                            <td>{order.createdAt ? format(order.createdAt, 'yyyy.MM.dd HH:mm') : '-'}</td>
                                            <td className="proc-supplier">{order.supplierName || 'Тодорхойгүй'}</td>
                                            <td className="proc-amount">{order.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td><span className="proc-items-count">{order.items?.length || 0} төрөл</span></td>
                                            <td><span className={`proc-status ${statusInfo.className}`}>{statusInfo.label}</span></td>
                                            <td><button className="proc-action-btn" onClick={ev => ev.stopPropagation()}><MoreVertical size={18} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                </div>{/* /inv-page-card */}
            </div>

            {showModal && (
                <GenericCrudModal
                    title="Худалдан авалт (PO)"
                    icon={<ShoppingCart size={20} />}
                    collectionPath="businesses/{bizId}/procurementOrders"
                    fields={PO_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </HubLayout>
    );
}
