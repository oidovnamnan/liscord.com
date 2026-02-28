import { useEffect, useState } from 'react';
import { Search, Plus, Phone, Shield, MoreVertical, Clock, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { teamService } from '../../services/db';
import type { Employee, Position } from '../../types';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import './EmployeesPage.css';

export function EmployeesPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [menuId, setMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (!business) return;
        const unsub1 = teamService.subscribeEmployees(business.id, (data) => {
            setEmployees(data);
        });
        const unsub2 = teamService.subscribePositions(business.id, (data) => {
            setPositions(data);
        });
        return () => { unsub1(); unsub2(); };
    }, [business]);

    const handleDelete = async (emp: Employee) => {
        if (!business) return;
        if (!confirm(`"${emp.name}" ажилтныг хасах уу?`)) return;
        try {
            await teamService.deleteEmployee(business.id, emp.id);
            toast.success('Ажилтан хасагдлаа');
        } catch {
            toast.error('Алдаа гарлаа');
        }
        setMenuId(null);
    };

    const filtered = employees.filter(e => {
        if (e.isDeleted) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return (e.name || '').toLowerCase().includes(s) ||
            (e.phone || '').includes(s) ||
            (e.positionName || '').toLowerCase().includes(s);
    });

    const getRoleColor = (role?: string) => {
        if (role === 'owner') return '#6c5ce7';
        return '#0dbff0';
    };

    return (
        <HubLayout hubId="staff-hub">
            <Header title="Ажилтан" subtitle={`Нийт ${employees.length} ажилтан`} action={{ label: 'Урих', onClick: () => setShowInvite(true) }} />
            <div className="page" onClick={() => setMenuId(null)}>
                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Нэр, утас, албан тушаал хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Идэвхтэй</div>
                        <div className="stat-card-value">{employees.filter(e => e.status === 'active' && !e.isDeleted).length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Нийт баг</div>
                        <div className="stat-card-value">{employees.filter(e => !e.isDeleted).length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Албан тушаал</div>
                        <div className="stat-card-value">{new Set(employees.filter(e => !e.isDeleted).map(e => e.positionId)).size}</div>
                    </div>
                </div>

                <div className="employees-list stagger-children">
                    {filtered.map(emp => {
                        const displayName = emp.name || emp.userId || 'Мэдэгдэхгүй';
                        const roleColor = getRoleColor(emp.role);
                        return (
                            <div key={emp.id} className="employee-card card card-clickable" onClick={() => setEditingEmployee(emp)}>
                                <div className="employee-header">
                                    <div className="employee-avatar" style={{ borderColor: roleColor }}>
                                        {displayName.charAt(0).toUpperCase()}
                                        <span className={`employee-status-dot ${emp.status || 'inactive'}`} />
                                    </div>
                                    <div className="employee-info">
                                        <div className="employee-name">{displayName}</div>
                                        <div className="employee-position" style={{ color: roleColor }}>
                                            <Shield size={12} /> {emp.positionName || 'Ажилтан'}
                                        </div>
                                    </div>
                                    <div className="employee-meta" style={{ position: 'relative' }}>
                                        <div className="employee-active"><Clock size={12} /> {emp.status === 'active' ? 'Идэвхтэй' : 'Хүлээгдэж буй'}</div>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === emp.id ? null : emp.id); }}>
                                            <MoreVertical size={16} />
                                        </button>
                                        {menuId === emp.id && (
                                            <div className="context-menu" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--surface-1)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', padding: 4, minWidth: 140, boxShadow: '0 8px 24px var(--shadow-color)' }}>
                                                <button className="context-item" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={e => { e.stopPropagation(); setMenuId(null); setEditingEmployee(emp); }}><Pencil size={14} /> Засах</button>
                                                <button className="context-item" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={e => { e.stopPropagation(); handleDelete(emp); }}><Trash2 size={14} /> Устгах</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="employee-details">
                                    <span><Phone size={12} /> {emp.phone || 'Утасгүй'}</span>
                                    <span>Өнөөдөр: {emp.stats?.totalOrdersHandled || 0} захиалга</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showInvite && <InviteModal positions={positions} onClose={() => setShowInvite(false)} />}
            {editingEmployee && <EditEmployeeModal employee={editingEmployee} positions={positions} onClose={() => setEditingEmployee(null)} />}
        </HubLayout>
    );
}

function EditEmployeeModal({ employee, positions, onClose }: { employee: Employee; positions: Position[]; onClose: () => void }) {
    const { business } = useBusinessStore();
    const [name, setName] = useState(employee.name || '');
    const [phone, setPhone] = useState(employee.phone || '');
    const [positionId, setPositionId] = useState(employee.positionId || '');
    const [saving, setSaving] = useState(false);

    const selectedPosition = positions.find(p => p.id === positionId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business) return;
        setSaving(true);
        try {
            await teamService.updateEmployee(business.id, employee.id, {
                name: name.trim(),
                phone: phone.trim(),
                positionId: positionId,
                positionName: selectedPosition?.name || 'Ажилтан',
            });
            toast.success('Ажилтан амжилттай шинэчлэгдлээ');
            onClose();
        } catch {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Ажилтан засах</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Нэр</label>
                            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Утас</label>
                            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Албан тушаал</label>
                            <select className="input select" value={positionId} onChange={e => setPositionId(e.target.value)}>
                                <option value="">Ажилтан (ерөнхий)</option>
                                {positions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Pencil size={16} />} Хадгалах
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function InviteModal({ positions, onClose }: { positions: Position[]; onClose: () => void }) {
    const { business } = useBusinessStore();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [positionId, setPositionId] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedPosition = positions.find(p => p.id === positionId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!business) return;
        const trimmedPhone = phone.trim();
        if (!trimmedPhone) {
            toast.error('Утасны дугаар оруулна уу');
            return;
        }

        setSaving(true);
        try {
            await teamService.inviteEmployee(business.id, {
                phone: trimmedPhone,
                name: name.trim() || trimmedPhone,
                positionId: positionId || '',
                positionName: selectedPosition?.name || 'Ажилтан',
                role: 'employee',
                businessId: business.id,
                userId: '',
                email: null,
                avatar: null,
            });
            toast.success('Ажилтан амжилттай нэмэгдлээ!');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Алдаа гарлаа, дахин оролдоно уу');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Ажилтан урих</h2>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Нэр</label>
                            <input className="input" placeholder="Ажилтны нэр" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                            <input className="input" placeholder="+976 9900 1234" value={phone} onChange={e => setPhone(e.target.value)} autoFocus required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Албан тушаал</label>
                            <select className="input select" value={positionId} onChange={e => setPositionId(e.target.value)}>
                                <option value="">Ажилтан (ерөнхий)</option>
                                {positions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Ажилтан нэмэгдсэний дараа урилга линк илгээгдэнэ.
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Урих
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
