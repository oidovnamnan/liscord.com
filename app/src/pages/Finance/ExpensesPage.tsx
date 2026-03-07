import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, TrendingDown, Receipt, Edit2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { expenseService } from '../../services/db';
import { format } from 'date-fns';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const EXPENSE_FIELDS: CrudField[] = [
    { name: 'description', label: 'Утга / Тайлбар', type: 'text', required: true, placeholder: 'Оффисийн түрээс, цалин гэх мэт', span: 2 },
    { name: 'amount', label: 'Дүн', type: 'currency', required: true, placeholder: '0' },
    {
        name: 'category', label: 'Ангилал', type: 'select', required: true, options: [
            { value: 'rent', label: 'Түрээс' },
            { value: 'salary', label: 'Цалин' },
            { value: 'utilities', label: 'Нийтийн үйлчилгээ' },
            { value: 'transport', label: 'Тээвэр' },
            { value: 'marketing', label: 'Маркетинг' },
            { value: 'supplies', label: 'Хангамж' },
            { value: 'food', label: 'Хоол, ундаа' },
            { value: 'maintenance', label: 'Засвар, үйлчилгээ' },
            { value: 'insurance', label: 'Даатгал' },
            { value: 'tax', label: 'Татвар' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    {
        name: 'paymentMethod', label: 'Төлбөрийн хэлбэр', type: 'select', options: [
            { value: 'cash', label: 'Бэлэн' },
            { value: 'transfer', label: 'Шилжүүлэг' },
            { value: 'card', label: 'Карт' },
            { value: 'qpay', label: 'QPay' },
        ]
    },
    { name: 'date', label: 'Огноо', type: 'date' },
    { name: 'notes', label: 'Нэмэлт тэмдэглэл', type: 'textarea', span: 2 },
];

export function ExpensesPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = expenseService.subscribeExpenses(business.id, (data) => {
            setExpenses(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    const filteredExpenses = expenses.filter(e =>
        (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalThisMonth = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return (
        <>
            <Header title="Зардлын Хяналт" action={{ label: '+ Шинэ зардал', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}><TrendingDown size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalThisMonth.toLocaleString()} ₮</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт зардал</div>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 10, borderRadius: 10, background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}><Receipt size={20} /></div>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{expenses.length}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Нийт бүртгэл</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="page-header-actions" style={{ marginBottom: 20 }}>
                    <div className="search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Зардлын утга, ангиллаар хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '300px' }}><Loader2 className="animate-spin" size={32} /></div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Огноо</th><th>Утга</th><th>Ангилал</th><th>Дүн</th><th>Төлбөр</th><th>Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Зардал олдсонгүй</td></tr>
                                ) : (
                                    filteredExpenses.map(e => (
                                        <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => { setEditingItem(e); setShowModal(true); }}>
                                            <td>{e.createdAt ? format(e.createdAt, 'yyyy/MM/dd') : e.date || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{e.description || 'Тайлбаргүй'}</td>
                                            <td><span className="badge">{e.category || 'Бусад'}</span></td>
                                            <td style={{ fontWeight: 700, color: '#e74c3c' }}>-{e.amount?.toLocaleString() || 0} ₮</td>
                                            <td>{e.paymentMethod || 'Бэлэн'}</td>
                                            <td><button className="btn-icon" onClick={ev => { ev.stopPropagation(); setEditingItem(e); setShowModal(true); }}><Edit2 size={16} /></button></td>
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
                    title="Зардал"
                    icon={<Receipt size={20} />}
                    collectionPath="businesses/{bizId}/expenses"
                    fields={EXPENSE_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
