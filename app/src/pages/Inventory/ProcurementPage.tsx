import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Plus, Loader2, MoreVertical } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { procurementService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'received': return <span className="badge badge-success">Хүлээж авсан</span>;
            case 'pending': return <span className="badge badge-warning">Хүлээгдэж буй</span>;
            case 'draft': return <span className="badge badge-info">Ноорог</span>;
            case 'cancelled': return <span className="badge badge-danger">Цуцалсан</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const handleCreateOrder = () => {
        toast('Шинэ PO үүсгэх модал удахгүй нэмэгдэнэ. Одоогоор зөвхөн жагсаалт баталгаажсан.');
    };

    return (
        <>
            <Header title="Худалдан Авалт" />
            <div className="page">
                <div className="page-header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Нийлүүлэгч эсвэл PO кодоор хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex-gap">
                        <select
                            className="input"
                            style={{ width: '150px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">Бүх төлөв</option>
                            <option value="draft">Ноорог</option>
                            <option value="pending">Хүлээгдэж буй</option>
                            <option value="received">Хүлээж авсан</option>
                        </select>
                        <button className="btn btn-primary gradient-btn" onClick={handleCreateOrder}>
                            <Plus size={18} /> Шинэ PO
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}>
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>PO Код</th>
                                    <th>Огноо</th>
                                    <th>Нийлүүлэгч</th>
                                    <th>Дүн</th>
                                    <th>Барааны тоо</th>
                                    <th>Төлөв</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            Захиалга олдсонгүй
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 600 }}>#{order.id.slice(0, 6).toUpperCase()}</td>
                                            <td>{order.createdAt ? format(order.createdAt, 'yyyy/MM/dd HH:mm') : '-'}</td>
                                            <td>{order.supplierName || 'Тодорхойгүй'}</td>
                                            <td style={{ fontWeight: 600 }}>{order.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td>{order.items?.length || 0} нэр төрөл</td>
                                            <td>{getStatusBadge(order.status)}</td>
                                            <td>
                                                <button className="btn-icon">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
