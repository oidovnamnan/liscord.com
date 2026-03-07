import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Loader2, MoreVertical, Flame, UserPlus } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { leadService } from '../../services/db';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

const STATUSES = [
    { id: 'new', label: 'Шинэ', color: '#3498db' },
    { id: 'contacted', label: 'Холбогдсон', color: '#f39c12' },
    { id: 'qualified', label: 'Сонирхсон', color: '#9b59b6' },
    { id: 'proposal', label: 'Санал өгсөн', color: '#e67e22' },
    { id: 'won', label: 'Амжилттай', color: '#2ecc71' },
    { id: 'lost', label: 'Алга болсон', color: '#e74c3c' }
];

const LEAD_FIELDS: CrudField[] = [
    { name: 'name', label: 'Нэр', type: 'text', required: true, placeholder: 'Харилцагчийн нэр' },
    { name: 'phone', label: 'Утас', type: 'phone', placeholder: '99001122' },
    { name: 'company', label: 'Компани', type: 'text', placeholder: 'Компанийн нэр' },
    { name: 'email', label: 'И-мэйл', type: 'email' },
    { name: 'value', label: 'Боломжийн дүн', type: 'currency' },
    { name: 'status', label: 'Төлөв', type: 'select', defaultValue: 'new', options: STATUSES.map(s => ({ value: s.id, label: s.label })) },
    {
        name: 'priority', label: 'Зэрэглэл', type: 'select', defaultValue: 'medium', options: [
            { value: 'high', label: '🔥 Өндөр' },
            { value: 'medium', label: 'Дунд' },
            { value: 'low', label: 'Бага' },
        ]
    },
    {
        name: 'source', label: 'Эх сурвалж', type: 'select', options: [
            { value: 'website', label: 'Вэбсайт' },
            { value: 'referral', label: 'Танил тал' },
            { value: 'social', label: 'Сошиал' },
            { value: 'phone', label: 'Утасны дуудлага' },
            { value: 'walk-in', label: 'Шууд ирсэн' },
            { value: 'other', label: 'Бусад' },
        ]
    },
    { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
];

export function LeadsPage() {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!business?.id) return;
        const unsubscribe = leadService.subscribeLeads(business.id, (data) => {
            setLeads(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business?.id]);

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin" size={32} /></div>
    );

    return (
        <>
            <Header title="Борлуулалтын Боломж (Leads)" action={{ label: '+ Шинэ Lead', onClick: () => { setEditingItem(null); setShowModal(true); } }} />
            <div className="page" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <div className="page-header-actions" style={{ marginBottom: '20px' }}>
                    <div className="search-box" style={{ maxWidth: '400px' }}>
                        <Search size={18} />
                        <input type="text" placeholder="Нэр, утас, компанийн нэрээр хайх..." />
                    </div>
                </div>

                <div className="kanban-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', height: '100%', paddingBottom: '20px' }}>
                    {STATUSES.map(status => {
                        const statusLeads = leads.filter(l => l.status === status.id);
                        return (
                            <div key={status.id} className="kanban-column" style={{ minWidth: '280px', background: 'var(--bg-soft)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '16px', borderBottom: `2px solid ${status.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{status.label}</h4>
                                    <span className="badge" style={{ background: 'var(--bg-hover)' }}>{statusLeads.length}</span>
                                </div>
                                <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                                    {statusLeads.map(lead => (
                                        <div key={lead.id} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: lead.priority === 'high' ? '3px solid #e74c3c' : 'none', cursor: 'pointer' }} onClick={() => { setEditingItem(lead); setShowModal(true); }}>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{lead.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{lead.company || lead.phone}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{lead.value?.toLocaleString()} ₮</div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {lead.priority === 'high' && <Flame size={14} color="#e74c3c" />}
                                                    <button className="btn-icon" onClick={ev => ev.stopPropagation()}><MoreVertical size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {statusLeads.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: '#999', border: '1px dashed #ddd', borderRadius: '8px' }}>Хоосон</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && (
                <GenericCrudModal
                    title="Lead / Боломж"
                    icon={<UserPlus size={20} />}
                    collectionPath="businesses/{bizId}/leads"
                    fields={LEAD_FIELDS}
                    editingItem={editingItem}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
