import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, MoreVertical, ShoppingCart, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { procurementService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './ProcurementPage.css';

export function ProcurementPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

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

    const handleCreateOrder = () => {
        toast('Шинэ PO үүсгэх модал удахгүй нэмэгдэнэ. Одоогоор зөвхөн жагсаалт баталгаажсан.');
    };

    const countPending = orders.filter(o => o.status === 'pending').length;
    const countReceived = orders.filter(o => o.status === 'received').length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <HubLayout hubId="inventory-hub">
            <div className="procurement-page animate-fade-in">
                {/* Page Section Header */}
                <div className="page-section-header">
                    <div>
                        <h2 className="page-section-title">Худалдан Авалт (PO)</h2>
                        <p className="page-section-subtitle">Нийлүүлэгчид рүү илгээх худалдан авалтын захиалга (Purchase Orders)</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleCreateOrder}>
                        <Plus size={16} /> Шинэ PO
                    </button>
                </div>

                {/* ====== Stats Grid ====== */}
                <div className="proc-stats-grid">
                    <div className="proc-stat-card">
                        <div className="proc-stat-content">
                            <h4>Нийт PO</h4>
                            <div className="proc-stat-value">{orders.length}</div>
                        </div>
                        <div className="proc-stat-icon icon-primary">
                            <ShoppingCart size={28} />
                        </div>
                    </div>

                    <div className="proc-stat-card">
                        <div className="proc-stat-content">
                            <h4>Хүлээгдэж буй</h4>
                            <div className="proc-stat-value">{countPending}</div>
                        </div>
                        <div className="proc-stat-icon icon-orange">
                            <Truck size={28} />
                        </div>
                    </div>

                    <div className="proc-stat-card">
                        <div className="proc-stat-content">
                            <h4>Хүлээн авсан</h4>
                            <div className="proc-stat-value">{countReceived}</div>
                        </div>
                        <div className="proc-stat-icon icon-green">
                            <CheckCircle2 size={28} />
                        </div>
                    </div>

                    <div className="proc-stat-card">
                        <div className="proc-stat-content">
                            <h4>Нийт Дүн</h4>
                            <div className="proc-stat-value" style={{ fontSize: '1.4rem' }}>
                                {totalAmount > 0 ? (totalAmount / 1000000).toFixed(1) + 'M ₮' : '0 ₮'}
                            </div>
                        </div>
                        <div className="proc-stat-icon icon-cyan">
                            <AlertCircle size={28} />
                        </div>
                    </div>
                </div>

                {/* ====== Search & Filter Toolbar ====== */}
                <div className="proc-toolbar">
                    <div className="proc-search-wrap">
                        <Search size={18} className="proc-search-icon" />
                        <input
                            className="proc-search-input"
                            placeholder="Нийлүүлэгч эсвэл PO кодоор хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className="proc-filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="draft">Ноорог</option>
                        <option value="pending">Хүлээгдэж буй</option>
                        <option value="received">Хүлээж авсан</option>
                    </select>
                </div>

                {/* ====== Premium Table ====== */}
                <div className="proc-table-container">
                    {loading ? (
                        <div className="proc-loading">
                            <Loader2 size={36} className="animate-spin" />
                            <p className="proc-loading-text">Өгөгдөл ачаалж байна...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="proc-empty-state">
                            <div className="proc-empty-icon">
                                <ShoppingCart size={40} />
                            </div>
                            <div className="proc-empty-title">Захиалга олдсонгүй</div>
                            <div className="proc-empty-desc">Хайлтын илэрцэд худалдан авалт олдсонгүй эсвэл бүртгэлгүй байна.</div>
                        </div>
                    ) : (
                        <table className="proc-table">
                            <thead>
                                <tr>
                                    <th>PO Код</th>
                                    <th>Огноо</th>
                                    <th>Нийлүүлэгч</th>
                                    <th>Дүн</th>
                                    <th>Барааны тоо</th>
                                    <th>Төлөв</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const statusInfo = getStatusInfo(order.status);
                                    return (
                                        <tr key={order.id}>
                                            <td>
                                                <span className="proc-po-code">#{order.id.slice(0, 6).toUpperCase()}</span>
                                            </td>
                                            <td>{order.createdAt ? format(order.createdAt, 'yyyy.MM.dd HH:mm') : '-'}</td>
                                            <td className="proc-supplier">{order.supplierName || 'Тодорхойгүй'}</td>
                                            <td className="proc-amount">{order.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td>
                                                <span className="proc-items-count">
                                                    {order.items?.length || 0} төрөл
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`proc-status ${statusInfo.className}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="proc-action-btn">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </HubLayout>
    );
}
