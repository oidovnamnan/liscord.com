import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../Settings/components/FlashDealSettings.css';
import { Search, Plus, Phone, Mail, MoreVertical, ShoppingCart, DollarSign, Loader2, Pencil, Trash2, Users } from 'lucide-react';
import { useBusinessStore, useAuthStore } from '../../store';
import { customerService } from '../../services/db';
import type { Customer } from '../../types';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import { fmt } from '../../utils/format';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../../components/common/PermissionGate';
import './CustomersPage.css';



export function CustomersPage() {
    const { business } = useBusinessStore();
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [customersLimit, setCustomersLimit] = useState(50);
    const [hasMore, setHasMore] = useState(true);
    const [menuId, setMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close context menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleDelete = async (c: Customer) => {
        if (!business) return;
        if (!confirm(`"${c.name}" харилцагчийг устгах уу?`)) return;
        try {
            await customerService.updateCustomer(business.id, c.id, { isDeleted: true });
            toast.success('Харилцагч устгагдлаа');
        } catch {
            toast.error('Алдаа гарлаа');
        }
        setMenuId(null);
    };

    useEffect(() => {
        if (!business?.id) return;

        setTimeout(() => setLoading(true), 0);
        const unsubscribe = customerService.subscribeCustomers(business.id, (data) => {
            setCustomers(data);
            setHasMore(data.length === customersLimit);
            setLoading(false);
        }, customersLimit);

        return () => unsubscribe();
    }, [business?.id, customersLimit]);

    const filtered = customers.filter(c => {
        if (c.isDeleted) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || (c.phone || '').includes(s) || (c.email || '').toLowerCase().includes(s);
    });

    return (
        <HubLayout hubId="crm-hub">
            <div className="page">
                <div className="fds-hero">
                    <div className="fds-hero-top">
                        <div className="fds-hero-left">
                            <div className="fds-hero-icon"><Users size={24} /></div>
                            <div>
                                <h3 className="fds-hero-title">Харилцагчид</h3>
                                <div className="fds-hero-desc">{loading ? 'Уншиж байна...' : `Нийт ${customers.length} харилцагч`}</div>
                            </div>
                        </div>
                        <PermissionGate permission="customers.create">
                            <button className="fds-add-btn" onClick={() => setShowCreate(true)}>
                                <Plus size={14} /> Шинэ харилцагч
                            </button>
                        </PermissionGate>
                    </div>
                </div>
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
                            <div key={c.id} className="customer-card card card-clickable" onClick={() => setEditingCustomer(c)}>
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
                                    <div style={{ position: 'relative' }}>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }}><MoreVertical size={16} /></button>
                                        {menuId === c.id && (
                                            <div ref={menuRef} className="context-menu" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--surface-1)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', padding: 4, minWidth: 140, boxShadow: '0 8px 24px var(--shadow-color)' }}>
                                                {hasPermission('customers.edit') && (
                                                    <button className="context-item" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={e => { e.stopPropagation(); setMenuId(null); setEditingCustomer(c); }}><Pencil size={14} /> Засах</button>
                                                )}
                                                {hasPermission('customers.delete') && (
                                                    <button className="context-item" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={e => { e.stopPropagation(); handleDelete(c); }}><Trash2 size={14} /> Устгах</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
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

                {hasMore && customers.length > 0 && (
                    <div className="flex justify-center py-6 mt-4">
                        <button
                            className="btn btn-secondary"
                            style={{ minWidth: '200px', margin: '20px auto', display: 'block' }}
                            onClick={() => setCustomersLimit(prev => prev + 50)}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : `Дараагийн 50 харилцагч (Одоо ${customers.length})`}
                        </button>
                    </div>
                )}
            </div>

            {showCreate && <CreateCustomerModal onClose={() => setShowCreate(false)} />}
            {editingCustomer && <EditCustomerModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} />}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
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

function EditCustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone || '');
    const [email, setEmail] = useState(customer.email || '');
    const [address, setAddress] = useState(customer.address || '');
    const [tags, setTags] = useState((customer.tags || []).join(', '));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!business) return;
        if (!name.trim() || !phone.trim()) {
            toast.error('Нэр, утасны дугаар оруулна уу');
            return;
        }
        setLoading(true);
        try {
            await customerService.updateCustomer(business.id, customer.id, {
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim() || '',
                address: address.trim() || '',
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            });
            toast.success('Харилцагч амжилттай шинэчлэгдлээ');
            onClose();
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Харилцагч засах</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Нэр <span className="required">*</span></label>
                            <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Утас <span className="required">*</span></label>
                            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">И-мэйл</label>
                            <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Хаяг</label>
                            <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Tags (таслалаар)</label>
                            <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="VIP, B2B" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Pencil size={16} /> Хадгалах</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
