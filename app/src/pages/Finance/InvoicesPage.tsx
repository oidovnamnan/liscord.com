import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, Clock, Edit2, Printer, FileText} from 'lucide-react';
import { useBusinessStore } from '../../store';
import { invoiceService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';
import '../Settings/components/FlashDealSettings.css';

const INVOICE_FIELDS: CrudField[] = [
    { name: 'invoiceNumber', label: 'Нэхэмжлэх дугаар', type: 'text', placeholder: 'INV-001' },
    { name: 'customerName', label: 'Харилцагч', type: 'text', required: true, placeholder: 'Харилцагчийн нэр' },
    { name: 'totalAmount', label: 'Нийт дүн', type: 'currency', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', required: true, defaultValue: 'unpaid', options: [
            { value: 'unpaid', label: 'Төлөгдөөгүй' },
            { value: 'paid', label: 'Төлөгдсөн' },
            { value: 'overdue', label: 'Хугацаа хэтэрсэн' },
            { value: 'void', label: 'Хүчингүй' },
        ]
    },
    { name: 'dueDate', label: 'Хугацаа', type: 'date', required: true },
    {
        name: 'paymentMethod', label: 'Төлбөрийн хэлбэр', type: 'select', options: [
            { value: 'transfer', label: 'Шилжүүлэг' },
            { value: 'cash', label: 'Бэлэн' },
            { value: 'card', label: 'Карт' },
        ]
    },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function InvoicesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

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

    return (
            <div className="animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }}>
            <div className="fds-hero">
                <div className="fds-hero-top">
                    <div className="fds-hero-left">
                        <div className="fds-hero-icon"><FileText size={24} /></div>
                        <div>
                            <h3 className="fds-hero-title">Нэхэмжлэх</h3>
                            <div className="fds-hero-desc">Нэхэмжлэхийн удирдлага</div>
                        </div>
                    </div>
                    <button className="fds-add-btn" onClick={() => { setEditingItem(null); setShowModal(true) }}>
                        + Шинэ нэхэмжлэх
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Нэхэмжлэх № эсвэл харилцагчаар хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>Дугаар</th><th>Огноо</th><th>Харилцагч</th><th>Дүн</th><th>Төлөв</th><th>Үйлдэл</th></tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Нэхэмжлэх олдсонгүй</td></tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(inv); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>#{inv.invoiceNumber || inv.id.slice(0, 6).toUpperCase()}</td>
                                            <td>{inv.createdAt ? format(inv.createdAt, 'yyyy/MM/dd') : '-'}</td>
                                            <td>{inv.customerName || 'Харилцагчгүй'}</td>
                                            <td style={{ fontWeight: 700 }}>{inv.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td>{getStatusBadge(inv.status)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn-icon" title="Хэвлэх" onClick={ev => ev.stopPropagation()}><Printer size={16} /></button>
                                                    <button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(inv); setShowModal(true); }}><Edit2 size={16} /></button>
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

            {showModal && (
                <GenericCrudModal
                    title="Нэхэмжлэх"
                    icon={<Printer size={20} />}
                    collectionPath="businesses/{bizId}/invoices"
                    fields={INVOICE_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
            </div>
        );
}
