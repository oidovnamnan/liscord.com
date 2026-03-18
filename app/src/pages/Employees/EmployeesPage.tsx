import { useEffect, useState } from 'react';
import { Search, Plus, Phone, Shield, MoreVertical, Clock, Loader2, Pencil, Trash2, Users, Briefcase, Send } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { teamService } from '../../services/db';
import type { Employee, Position } from '../../types';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import './EmployeesPage.css';

export function EmployeesPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
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

    const handleReinvite = async (emp: Employee) => {
        if (!business) return;
        const loginUrl = `https://www.liscord.com/app`;
        const message = `Сайн байна уу ${emp.name}! ${business.name} бизнесийн багт таныг урьсан байна. Доорх линкээр нэвтэрнэ үү: ${loginUrl}`;
        
        // Try to open SMS app with pre-filled message
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (isMobile && emp.phone) {
            // iOS uses &body=, Android uses ?body=
            const isIOS = /iPhone|iPad/i.test(navigator.userAgent);
            const smsUrl = isIOS 
                ? `sms:${emp.phone}&body=${encodeURIComponent(message)}`
                : `sms:${emp.phone}?body=${encodeURIComponent(message)}`;
            window.open(smsUrl, '_self');
            toast.success('SMS апп нээгдлээ');
        } else {
            // Desktop: copy link to clipboard
            try {
                await navigator.clipboard.writeText(message);
                toast.success(`Мессеж хуулагдлаа! ${emp.name} (${emp.phone})-д илгээнэ үү`, { duration: 5000 });
            } catch {
                toast.success(`Нэвтрэх линк: ${loginUrl}`, { duration: 5000 });
            }
        }
        setMenuId(null);
    };

    const filtered = employees.filter(e => {
        if (e.isDeleted) return false;
        if (statusFilter === 'active' && e.status !== 'active') return false;
        if (statusFilter === 'pending' && e.status === 'active') return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return (e.name || '').toLowerCase().includes(s) ||
            (e.phone || '').includes(s) ||
            (e.positionName || '').toLowerCase().includes(s);
    });

    const activeCount = employees.filter(e => e.status === 'active' && !e.isDeleted).length;
    const totalCount = employees.filter(e => !e.isDeleted).length;
    const pendingCount = totalCount - activeCount;
    const positionCount = new Set(employees.filter(e => !e.isDeleted).map(e => e.positionId)).size;

    const getAvatarGradient = (name: string) => {
        const colors = [
            'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            'linear-gradient(135deg, #8b5cf6, #a855f7)',
            'linear-gradient(135deg, #f97316, #f59e0b)',
            'linear-gradient(135deg, #ef4444, #f87171)',
            'linear-gradient(135deg, #22c55e, #10b981)',
            'linear-gradient(135deg, #ec4899, #db2777)',
            'linear-gradient(135deg, #6366f1, #818cf8)',
        ];
        const idx = (name || '').charCodeAt(0) % colors.length;
        return colors[idx];
    };

    return (
        <HubLayout hubId="staff-hub">
            <div className="animate-fade-in" style={{ padding: '24px clamp(16px, 3vw, 32px) 32px' }} onClick={() => setMenuId(null)}>
                {/* ── Gradient Hero ── */}
                <div className="emp-hero">
                    <div className="emp-hero-top">
                        <div className="emp-hero-left">
                            <div className="emp-hero-icon">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="emp-hero-title">Ажилтан</h3>
                                <div className="emp-hero-desc">Багийн бүрэлдэхүүн, албан тушаал, эрх удирдах</div>
                            </div>
                        </div>
                        <button className="emp-invite-btn" onClick={() => setShowInvite(true)}>
                            <Plus size={16} /> Урих
                        </button>
                    </div>

                    <div className="emp-hero-stats">
                        <div className="emp-hero-stat">
                            <div className="emp-hero-stat-value">{activeCount}</div>
                            <div className="emp-hero-stat-label">Идэвхтэй</div>
                        </div>
                        <div className="emp-hero-stat">
                            <div className="emp-hero-stat-value">{totalCount}</div>
                            <div className="emp-hero-stat-label">Нийт баг</div>
                        </div>
                        <div className="emp-hero-stat">
                            <div className="emp-hero-stat-value">{pendingCount}</div>
                            <div className="emp-hero-stat-label">Хүлээгдэж</div>
                        </div>
                        <div className="emp-hero-stat">
                            <div className="emp-hero-stat-value">{positionCount}</div>
                            <div className="emp-hero-stat-label">Албан тушаал</div>
                        </div>
                    </div>
                </div>

                {/* ── Main Content Card ── */}
                <div className="emp-card">
                    {/* Toolbar: Search + Filter Tabs */}
                    <div className="emp-toolbar">
                        <div className="emp-search-wrap">
                            <Search size={18} />
                            <input
                                placeholder="Нэр, утас, албан тушаал хайх..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="emp-filter-tabs">
                            <button className={`emp-filter-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                                Бүгд <span className="emp-filter-count">{totalCount}</span>
                            </button>
                            <button className={`emp-filter-tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>
                                Идэвхтэй <span className="emp-filter-count">{activeCount}</span>
                            </button>
                            <button className={`emp-filter-tab ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
                                Хүлээгдэж <span className="emp-filter-count">{pendingCount}</span>
                            </button>
                        </div>
                    </div>

                    {/* Employee List */}
                    {filtered.length === 0 ? (
                        <div className="emp-empty">
                            <div className="emp-empty-icon">👥</div>
                            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Ажилтан олдсонгүй</h3>
                            <p style={{ fontSize: '0.85rem' }}>Шинэ ажилтан нэмэхийн тулд "Урих" товчийг дарна уу</p>
                        </div>
                    ) : (
                        <div className="emp-list">
                            {filtered.map(emp => {
                                const displayName = emp.name || emp.userId || 'Мэдэгдэхгүй';
                                return (
                                    <div key={emp.id} className="emp-row" onClick={() => setEditingEmployee(emp)}>
                                        <div className="emp-avatar" style={{ background: getAvatarGradient(displayName) }}>
                                            {displayName.charAt(0).toUpperCase()}
                                            <span className={`emp-status-dot ${emp.status || 'inactive'}`} />
                                        </div>
                                        <div className="emp-info">
                                            <div className="emp-name">{displayName}</div>
                                            <div className="emp-position">
                                                <Shield size={10} /> {emp.positionName || 'Ажилтан'}
                                            </div>
                                            {emp.phone && (
                                                <div className="emp-phone">
                                                    <Phone size={10} /> {emp.phone}
                                                </div>
                                            )}
                                        </div>
                                        <div className="emp-meta">
                                            <span className={`emp-status-badge ${emp.status || 'inactive'}`}>
                                                <Clock size={10} /> {emp.status === 'active' ? 'Идэвхтэй' : 'Хүлээгдэж буй'}
                                            </span>
                                            <button className="emp-menu-btn" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === emp.id ? null : emp.id); }}>
                                                <MoreVertical size={16} />
                                            </button>
                                            {menuId === emp.id && (
                                                <div className="emp-context-menu" onClick={e => e.stopPropagation()}>
                                                    <button className="emp-context-item" onClick={e => { e.stopPropagation(); setMenuId(null); setEditingEmployee(emp); }}>
                                                        <Pencil size={14} /> Засах
                                                    </button>
                                                    {emp.status !== 'active' && (
                                                        <button className="emp-context-item" onClick={e => { e.stopPropagation(); handleReinvite(emp); }}>
                                                            <Send size={14} /> Дахин урих
                                                        </button>
                                                    )}
                                                    <button className="emp-context-item danger" onClick={e => { e.stopPropagation(); handleDelete(emp); }}>
                                                        <Trash2 size={14} /> Устгах
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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

    // Linked employees state
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [linkedIds, setLinkedIds] = useState<string[]>(employee.linkedEmployeeIds || []);
    const [linkTarget, setLinkTarget] = useState('');
    const [linking, setLinking] = useState(false);

    const selectedPosition = positions.find(p => p.id === positionId);

    useEffect(() => {
        if (!business) return;
        const unsub = teamService.subscribeEmployees(business.id, (data) => {
            setAllEmployees(data.filter(e => !e.isDeleted && e.id !== employee.id));
        });
        return () => unsub();
    }, [business, employee.id]);

    const linkedEmployees = allEmployees.filter(e => linkedIds.includes(e.id));
    const availableToLink = allEmployees.filter(e => !linkedIds.includes(e.id) && e.status === 'active');

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

    async function handleLink() {
        if (!business || !linkTarget) return;
        setLinking(true);
        try {
            await teamService.linkEmployee(business.id, employee.id, linkTarget);
            setLinkedIds(prev => [...prev, linkTarget]);
            setLinkTarget('');
            toast.success('Давхар эрх холбогдлоо');
        } catch {
            toast.error('Холбоход алдаа гарлаа');
        } finally {
            setLinking(false);
        }
    }

    async function handleUnlink(targetId: string) {
        if (!business) return;
        setLinking(true);
        try {
            await teamService.unlinkEmployee(business.id, employee.id, targetId);
            setLinkedIds(prev => prev.filter(id => id !== targetId));
            toast.success('Давхар эрх салгагдлаа');
        } catch {
            toast.error('Салгахад алдаа гарлаа');
        } finally {
            setLinking(false);
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

                        {/* Linked Employees Section */}
                        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <Users size={14} />
                                Давхар эрх холбох
                            </label>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                                Энэ ажилтанд бусад ажилтны эрхийг давхар хариуцуулах. Тухайн хүн аккаунт дотроосоо нөгөө ажилтны эрх рүү шилжиж ажиллах боломжтой.
                            </p>

                            {/* Currently linked */}
                            {linkedEmployees.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {linkedEmployees.map(le => (
                                        <div key={le.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-secondary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.65rem', fontWeight: 700
                                                }}>
                                                    {le.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{le.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{le.positionName || 'Ажилтан'}</div>
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn-ghost btn-sm" disabled={linking}
                                                style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
                                                onClick={() => handleUnlink(le.id)}>
                                                Салгах
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new link */}
                            {availableToLink.length > 0 && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select className="input select" value={linkTarget} onChange={e => setLinkTarget(e.target.value)} style={{ flex: 1 }}>
                                        <option value="">Ажилтан сонгох...</option>
                                        {availableToLink.map(e => (
                                            <option key={e.id} value={e.id}>{e.name} — {e.positionName || 'Ажилтан'}</option>
                                        ))}
                                    </select>
                                    <button type="button" className="btn btn-primary btn-sm" disabled={!linkTarget || linking} onClick={handleLink}
                                        style={{ whiteSpace: 'nowrap', gap: 4 }}>
                                        {linking ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Холбох
                                    </button>
                                </div>
                            )}
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
