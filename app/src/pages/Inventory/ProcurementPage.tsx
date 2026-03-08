import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, MoreVertical, ShoppingCart, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { procurementService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import { HubLayout } from '../../components/common/HubLayout';
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
            <div className="procurement-page animate-fade-in">
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">Худалдан Авалт (PO)</h2>
                            <p className="page-hero-subtitle">Нийлүүлэгчид рүү илгээх худалдан авалтын захиалга</p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        <Plus size={16} /> Шинэ PO
                    </button>
                </div>

                <div className="proc-stats-grid">
                    <div className="proc-stat-card"><div className="proc-stat-content"><h4>Нийт PO</h4><div className="proc-stat-value">{orders.length}</div></div><div className="proc-stat-icon icon-primary"><ShoppingCart size={28} /></div></div>
                    <div className="proc-stat-card"><div className="proc-stat-content"><h4>Хүлээгдэж буй</h4><div className="proc-stat-value">{countPending}</div></div><div className="proc-stat-icon icon-orange"><Truck size={28} /></div></div>
                    <div className="proc-stat-card"><div className="proc-stat-content"><h4>Хүлээн авсан</h4><div className="proc-stat-value">{countReceived}</div></div><div className="proc-stat-icon icon-green"><CheckCircle2 size={28} /></div></div>
                    <div className="proc-stat-card"><div className="proc-stat-content"><h4>Нийт Дүн</h4><div className="proc-stat-value" style={{ fontSize: '1.4rem' }}>{totalAmount > 0 ? (totalAmount / 1000000).toFixed(1) + 'M ₮' : '0 ₮'}</div></div><div className="proc-stat-icon icon-cyan"><AlertCircle size={28} /></div></div>
                </div>

                <div className="proc-toolbar">
                    <div className="proc-search-wrap">
                        <Search size={18} className="proc-search-icon" />
                        <input className="proc-search-input" placeholder="Нийлүүлэгч эсвэл PO кодоор хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="proc-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
