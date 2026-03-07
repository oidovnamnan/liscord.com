import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, CheckCircle2, XCircle, Clock, Send, Download, Edit2, FileText } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { quoteService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const QUOTE_FIELDS: CrudField[] = [
    { name: 'customerName', label: 'Харилцагч', type: 'text', required: true, placeholder: 'Харилцагчийн нэр' },
    { name: 'customerPhone', label: 'Утас', type: 'phone' },
    { name: 'totalAmount', label: 'Нийт дүн', type: 'currency', required: true },
    {
        name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'draft', options: [
            { value: 'draft', label: 'Ноорог' },
            { value: 'sent', label: 'Илгээсэн' },
            { value: 'accepted', label: 'Зөвшөөрөгдсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
        ]
    },
    { name: 'validUntil', label: 'Хүчинтэй хугацаа', type: 'date' },
    { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
];

export function QuotesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = quoteService.subscribeQuotes(business.id, (data) => {
            setQuotes(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredQuotes = quotes.filter(quote =>
        (quote.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quote.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted': return <span className="badge badge-success"><CheckCircle2 size={12} /> Зөвшөөрөгдсөн</span>;
            case 'sent': return <span className="badge badge-info"><Send size={12} /> Илгээсэн</span>;
            case 'draft': return <span className="badge badge-soft"><Clock size={12} /> Ноорог</span>;
            case 'rejected': return <span className="badge badge-danger"><XCircle size={12} /> Татгалзсан</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <>
            <Header title="Үнийн Санал" action={{ label: '+ Шинэ санал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page">
                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Харилцагч эсвэл санал кодоор хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Код</th><th>Огноо</th><th>Харилцагч</th><th>Нийт дүн</th><th>Төлөв</th><th></th></tr></thead>
                            <tbody>
                                {filteredQuotes.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Үнийн санал олдсонгүй</td></tr>
                                ) : (
                                    filteredQuotes.map(quote => (
                                        <tr key={quote.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(quote); setShowModal(true); }}>
                                            <td style={{ fontWeight: 600 }}>QT-{quote.id.slice(0, 4).toUpperCase()}</td>
                                            <td>{quote.createdAt ? format(quote.createdAt, 'yyyy/MM/dd') : '-'}</td>
                                            <td>{quote.customerName || 'Тодорхойгүй'}</td>
                                            <td style={{ fontWeight: 600 }}>{quote.totalAmount?.toLocaleString() || 0} ₮</td>
                                            <td>{getStatusBadge(quote.status)}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn-icon" title="Татах" onClick={ev => ev.stopPropagation()}><Download size={16} /></button>
                                                    <button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(quote); setShowModal(true); }}><Edit2 size={16} /></button>
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
                    title="Үнийн санал"
                    icon={<FileText size={20} />}
                    collectionPath="businesses/{bizId}/quotes"
                    fields={QUOTE_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
