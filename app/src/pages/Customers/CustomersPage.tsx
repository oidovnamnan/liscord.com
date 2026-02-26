import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Header } from '../../components/layout/Header';
import { Search, Plus, Phone, Mail, MoreVertical, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { customerService } from '../../services/db';
import type { Customer } from '../../types';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './CustomersPage.css';

function fmt(n: number) { return '₮' + n.toLocaleString('mn-MN'); }

export function CustomersPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;

        setLoading(true);
        const unsubscribe = customerService.subscribeCustomers(business.id, (data) => {
            setCustomers(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [business?.id]);

    const filtered = customers.filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || (c.phone || '').includes(s) || (c.email || '').toLowerCase().includes(s);
    });

    return (
        <HubLayout hubId="crm-hub">
            <Header
                title="Харилцагч"
                subtitle={loading ? 'Уншиж байна...' : `Нийт ${customers.length} харилцагч`}
                action={{ label: 'Шинэ харилцагч', onClick: () => setShowCreate(true) }}
            />
            <div className="page">
                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Нэр, утас, и-мэйл хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Нийт харилцагч</div>
                        <div className="stat-card-value">{loading ? '...' : customers.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">VIP харилцагч</div>
                        <div className="stat-card-value">{loading ? '...' : customers.filter(c => (c.tags || []).includes('VIP')).length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Нийт авлага</div>
                        <div className="stat-card-value" style={{ fontSize: '1.3rem' }}>{loading ? '...' : fmt(customers.reduce((s, c) => s + (c.stats?.totalDebt || 0), 0))}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">B2B харилцагч</div>
                        <div className="stat-card-value">{loading ? '...' : customers.filter(c => (c.tags || []).includes('B2B')).length}</div>
                    </div>
                </div>

                {/* Customers list */}
                <div className="customers-list stagger-children">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={32} className="animate-spin" />
                            <p>Харилцагч ачаалж байна...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <h3>Харилцагч олдсонгүй</h3>
                            <p>Хайлтын нөхцөлөө өөрчилнө үү</p>
                        </div>
                    ) : (
                        filtered.map(c => (
                            <div key={c.id} className="customer-card card card-clickable">
                                <div className="customer-card-header">
                                    <div className="customer-avatar" style={{ background: (c.tags || []).includes('VIP') ? 'var(--gradient-accent)' : 'var(--gradient-secondary)' }}>
                                        {(c.name || '?').charAt(0)}
                                    </div>
                                    <div className="customer-info">
                                        <div className="customer-name">
                                            {c.name}
                                            {(c.tags || []).map(t => (
                                                <span key={t} className={`badge ${t === 'VIP' ? 'badge-confirmed' : t === 'B2B' ? 'badge-shipping' : 'badge-new'}`} style={{ marginLeft: 6 }}>{t}</span>
                                            ))}
                                        </div>
                                        <div className="customer-contacts">
                                            <span><Phone size={12} /> {c.phone}</span>
                                            {c.email && <span><Mail size={12} /> {c.email}</span>}
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={16} /></button>
                                </div>
                                <div className="customer-card-stats">
                                    <div className="customer-stat">
                                        <ShoppingCart size={14} />
                                        <span>{(c.stats?.totalOrders || 0)} захиалга</span>
                                    </div>
                                    <div className="customer-stat">
                                        <DollarSign size={14} />
                                        <span>{fmt(c.stats?.totalSpent || 0)}</span>
                                    </div>
                                    {(c.stats?.totalDebt || 0) > 0 && (
                                        <div className="customer-stat customer-stat-debt">
                                            ⚠️ Авлага: {fmt(c.stats.totalDebt)}
                                        </div>
                                    )}
                                    <div className="customer-stat-date">
                                        Сүүлд: {c.stats?.lastOrderAt ? new Date(c.stats.lastOrderAt).toLocaleDateString('mn-MN') : '-'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} />}
        </HubLayout>
    );
}

function CreateCustomerModal({ onClose }: { onClose: () => void }) {
    const { business } = useBusinessStore();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business || !user) return;

        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const phone = fd.get('phone') as string;
        const email = fd.get('email') as string;
        const address = fd.get('address') as string;

        if (!name || !phone) {
            toast.error('Нэр, утасны дугаар оруулна уу');
            return;
        }

        setLoading(true);
        try {
            await customerService.createCustomer(business.id, {
                name,
                phone,
                email,
                address,
                company: '',
                tags: [],
                notes: '',
                stats: {
                    totalOrders: 0,
                    totalSpent: 0,
                    totalDebt: 0,
                    lastOrderAt: null
                },
                createdBy: user.uid,
                isDeleted: false
            });
            onClose();
            toast.success('Харилцагч амжилттай бүртгэгдлээ');
        } catch (error: any) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Шинэ харилцагч</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Нэр <span className="required">*</span></label>
                            <input className="input" name="name" placeholder="Болд" autoFocus required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Утас <span className="required">*</span></label>
                            <input className="input" name="phone" placeholder="8800-1234" required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">И-мэйл</label>
                            <input className="input" name="email" placeholder="bold@mail.com" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Хаяг</label>
                            <input className="input" name="address" placeholder="БЗД, 3-р хороо" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Нэмэх</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
