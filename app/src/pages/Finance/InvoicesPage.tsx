import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, MoreVertical, CheckCircle2, XCircle, Clock, CreditCard, Printer } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { invoiceService } from '../../services/db';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function InvoicesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = invoiceService.subscribeInvoices(business.id, (data) => {
            setInvoices(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredInvoices = invoices.filter(inv =>
        (inv.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="badge badge-success"><CheckCircle2 size={12} /> Төлөгдсөн</span>;
            case 'unpaid': return <span className="badge badge-warning"><Clock size={12} /> Төлөгдөөгүй</span>;
            case 'overdue': return <span className="badge badge-danger"><XCircle size={12} /> Хугацаа хэтэрсэн</span>;
            case 'void': return <span className="badge badge-soft">Хүчингүй</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const handleCreateInvoice = () => {
        toast('Шинэ нэхэмжлэх үүсгэх модал удахгүй нэмэгдэнэ.');
    };

    return (
        <>
            <Header title="Нэхэмжлэх (Invoices)" action={{ label: 'Шинэ нэхэмжлэх', onClick: handleCreateInvoice }} />
            <div className="page">
                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Нэхэмжлэх № эсвэл харилцагчаар хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                                    <th>Дугаар</th>
                                    <th>Огноо</th>
                                    <th>Харилцагч</th>
                                    <th>Дүн</th>
                                    <th>Төлөв</th>
                                    <th>Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                            Нэхэмжлэх олдсонгүй
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td style={{ fontWeight: 600 }}>#{inv.invoiceNumber || inv.id.slice(0, 6).toUpperCase()}</td>
                                            <td>{inv.createdAt ? format(inv.createdAt, 'yyyy/MM/dd') : '-'}</td>
                                            <td>{inv.customerName || 'Харилцагчгүй'}</td>
                                            <td style={{ fontWeight: 700 }}>{inv.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td>{getStatusBadge(inv.status)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn-icon" title="Хэвлэх">
                                                        <Printer size={16} />
                                                    </button>
                                                    <button className="btn-icon" title="Төлөх">
                                                        <CreditCard size={16} />
                                                    </button>
                                                    <button className="btn-icon">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
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
