import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Shield, Trash2, X, UserPlus, Phone, Mail, Briefcase, Clock, Edit2, Eye, DollarSign, AlertTriangle, Settings } from 'lucide-react';
import { teamService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../../components/common/PINModal';
import { ALL_PERMISSIONS, type Position, type Employee } from '../../../types';
import { useBusinessStore } from '../../../store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import './TeamSettings.css';

// ============ MAIN COMPONENT ============
export function TeamSettings({ bizId }: { bizId: string }) {
    const [subTab, setSubTab] = useState<'employees' | 'positions' | 'limits'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [showPosModal, setShowPosModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [showPIN, setShowPIN] = useState(false);
    const [showCreateEmployee, setShowCreateEmployee] = useState(false);
    const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const u1 = teamService.subscribeEmployees(bizId, setEmployees);
        const u2 = teamService.subscribePositions(bizId, setPositions);
        return () => { u1(); u2(); };
    }, [bizId]);

    const activeEmployees = useMemo(() => employees.filter(e => !e.isDeleted && e.status === 'active'), [employees]);
    const pendingEmployees = useMemo(() => employees.filter(e => !e.isDeleted && e.status === 'pending_invite'), [employees]);
    const allVisible = useMemo(() => employees.filter(e => !e.isDeleted), [employees]);

    const handleDeletePos = (id: string) => {
        setSelectedPosId(id);
        setShowPIN(true);
    };

    const confirmDelete = async () => {
        if (!selectedPosId) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await teamService.updatePosition(bizId, selectedPosId, { isDeleted: true } as any);
            toast.success('Устгагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setShowPIN(false); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <span className="team-status-badge active">Идэвхтэй</span>;
            case 'pending_invite': return <span className="team-status-badge pending">Хүлээгдэж буй</span>;
            case 'inactive': return <span className="team-status-badge inactive">Идэвхгүй</span>;
            default: return null;
        }
    };

    const subTabs = [
        { id: 'employees' as const, label: 'Ажилчид', icon: Users },
        { id: 'positions' as const, label: 'Эрхүүд / Тушаал', icon: Shield },
        { id: 'limits' as const, label: 'Хязгаарлалт', icon: AlertTriangle },
    ];

    return (
        <div className="settings-section animate-fade-in">
            {/* ── Dashboard Header ── */}
            <div className="team-dashboard-header">
                <h2>Баг удирдлага</h2>
                <p className="team-desc">Ажилтан нэмэх, эрх тохируулах, хязгаарлалт тогтоох</p>
            </div>

            <div className="team-stats-grid">
                <div className="team-stat-card">
                    <div className="team-stat-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7' }}><Users size={20} /></div>
                    <div className="team-stat-info">
                        <div className="team-stat-value">{allVisible.length}</div>
                        <div className="team-stat-label">Нийт ажилтан</div>
                    </div>
                </div>
                <div className="team-stat-card">
                    <div className="team-stat-icon" style={{ background: 'rgba(0, 206, 158, 0.1)', color: '#00ce9e' }}><Eye size={20} /></div>
                    <div className="team-stat-info">
                        <div className="team-stat-value">{activeEmployees.length}</div>
                        <div className="team-stat-label">Идэвхтэй</div>
                    </div>
                </div>
                <div className="team-stat-card">
                    <div className="team-stat-icon" style={{ background: 'rgba(253, 203, 110, 0.1)', color: '#e17055' }}><Clock size={20} /></div>
                    <div className="team-stat-info">
                        <div className="team-stat-value">{pendingEmployees.length}</div>
                        <div className="team-stat-label">Хүлээгдэж буй</div>
                    </div>
                </div>
                <div className="team-stat-card">
                    <div className="team-stat-icon" style={{ background: 'rgba(9, 132, 227, 0.1)', color: '#0984e3' }}><Shield size={20} /></div>
                    <div className="team-stat-info">
                        <div className="team-stat-value">{positions.filter(p => !(p as any).isDeleted).length}</div> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                        <div className="team-stat-label">Албан тушаал</div>
                    </div>
                </div>
            </div>

            {/* ── Sub Tabs ── */}
            <div className="team-sub-tabs">
                {subTabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            className={`team-sub-tab ${subTab === t.id ? 'active' : ''}`}
                            onClick={() => setSubTab(t.id)}
                        >
                            <Icon size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Employees Tab ── */}
            {subTab === 'employees' && (
                <div className="team-section animate-fade-in">
                    <div className="team-section-header">
                        <h3>Ажилчид ({allVisible.length})</h3>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowCreateEmployee(true)}>
                            <UserPlus size={14} /> Ажилтан нэмэх
                        </button>
                    </div>

                    {allVisible.length === 0 ? (
                        <div className="team-empty-state">
                            <Users size={48} />
                            <h4>Ажилтан байхгүй</h4>
                            <p>Багтаа ажилтан нэмээрэй</p>
                            <button className="btn btn-primary gradient-btn" onClick={() => setShowCreateEmployee(true)}>
                                <UserPlus size={16} /> Эхний ажилтан нэмэх
                            </button>
                        </div>
                    ) : (
                        <div className="team-employee-grid">
                            {allVisible.map(emp => (
                                <div key={emp.id} className="team-employee-card" onClick={() => setSelectedEmployee(emp)}>
                                    <div className="team-emp-top">
                                        <div className={`team-emp-avatar ${emp.status}`}>
                                            {emp.avatar || emp.name.charAt(0)}
                                            <span className={`team-emp-status-dot ${emp.status}`} />
                                        </div>
                                        <div className="team-emp-info">
                                            <div className="team-emp-name">{emp.name}</div>
                                            <div className="team-emp-position">{emp.positionName || 'Ажилтан'}</div>
                                        </div>
                                        {getStatusBadge(emp.status)}
                                    </div>
                                    <div className="team-emp-details">
                                        {emp.phone && (
                                            <div className="team-emp-detail-item">
                                                <Phone size={12} />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                        {emp.email && (
                                            <div className="team-emp-detail-item">
                                                <Mail size={12} />
                                                <span>{emp.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="team-emp-stats">
                                        <div className="team-emp-stat">
                                            <span className="team-emp-stat-value">{emp.stats?.totalOrdersCreated || 0}</span>
                                            <span className="team-emp-stat-label">Захиалга</span>
                                        </div>
                                        <div className="team-emp-stat">
                                            <span className="team-emp-stat-value">{emp.stats?.totalOrdersHandled || 0}</span>
                                            <span className="team-emp-stat-label">Хариуцсан</span>
                                        </div>
                                        {emp.baseSalary ? (
                                            <div className="team-emp-stat">
                                                <span className="team-emp-stat-value">₮{(emp.baseSalary / 1000).toFixed(0)}K</span>
                                                <span className="team-emp-stat-label">Цалин</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Positions Tab ── */}
            {subTab === 'positions' && (
                <div className="team-section animate-fade-in">
                    <div className="team-section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="icon-badge"><Shield size={16} /></div>
                            <h3>Албан тушаалууд</h3>
                        </div>
                        <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingPosition(null); setShowPosModal(true); }}>
                            <Plus size={14} /> Нэмэх
                        </button>
                    </div>
                    <div className="team-positions-grid">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {positions.filter(p => !(p as any).isDeleted).map(pos => (
                            <div key={pos.id} className="team-position-card">
                                <div className="team-pos-header">
                                    <div className="team-pos-info">
                                        <div className="team-pos-color" style={{ background: pos.color || '#6c5ce7' }} />
                                        <div>
                                            <div className="team-pos-name">{pos.name}</div>
                                            <div className="team-pos-desc">{pos.description || 'Тайлбар байхгүй'}</div>
                                        </div>
                                    </div>
                                    <div className="team-pos-actions">
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingPosition(pos); setShowPosModal(true); }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeletePos(pos.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="team-pos-perms">
                                    <span className="team-pos-perm-count">{pos.permissions?.length || 0} эрх</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Limits Tab ── */}
            {subTab === 'limits' && <EmployeeLimitsTab bizId={bizId} />}

            {/* Modals */}
            {showPosModal && <CreatePositionModal bizId={bizId} editingPosition={editingPosition} onClose={() => setShowPosModal(false)} />}
            {showPIN && <PINModal title="Устгах баталгаажуулалт" description="Албан тушаалын эрхийг устгахын тулд PIN кодыг оруулна уу." onSuccess={confirmDelete} onClose={() => setShowPIN(false)} />}
            {showCreateEmployee && <CreateEmployeeModal bizId={bizId} positions={positions} onClose={() => setShowCreateEmployee(false)} />}
            {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} bizId={bizId} positions={positions} onClose={() => setSelectedEmployee(null)} />}
        </div>
    );
}

// ============ CREATE EMPLOYEE MODAL ============
function CreateEmployeeModal({ bizId, positions, onClose }: { bizId: string; positions: Position[]; onClose: () => void }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const phone = fd.get('phone') as string;

        if (!name.trim()) { toast.error('Нэр оруулна уу'); return; }
        if (!phone.trim()) { toast.error('Утас оруулна уу'); return; }

        setLoading(true);
        try {
            const posId = fd.get('positionId') as string;
            const pos = positions.find(p => p.id === posId);

            await teamService.inviteEmployee(bizId, {
                name: name.trim(),
                phone: phone.trim(),
                email: (fd.get('email') as string)?.trim() || null,
                positionId: posId || '',
                positionName: pos?.name || 'Ажилтан',
                role: 'employee',
                status: 'active',
                baseSalary: Number(fd.get('baseSalary')) || 0,
                avatar: null,
                userId: '',
                businessId: bizId,
            });
            toast.success(`${name} амжилттай нэмэгдлээ`);
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal team-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}><UserPlus size={20} /></div>
                        <div>
                            <h2 style={{ margin: 0 }}>Ажилтан нэмэх</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Шинэ ажилтан бүртгэх</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Нэр <span className="required">*</span></label>
                                <input className="input" name="name" placeholder="Ажилтны нэр" autoFocus required style={{ height: 44 }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Утас <span className="required">*</span></label>
                                <input className="input" name="phone" placeholder="+976 9900 1234" required style={{ height: 44 }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">И-мэйл</label>
                                <input className="input" name="email" type="email" placeholder="email@example.com" style={{ height: 44 }} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Албан тушаал</label>
                                <select className="input select" name="positionId" style={{ height: 44 }}>
                                    <option value="">Сонгох...</option>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {positions.filter(p => !(p as any).isDeleted).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Үндсэн цалин (₮)</label>
                            <input className="input" name="baseSalary" type="number" placeholder="0" style={{ height: 44 }} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading}>
                            <UserPlus size={16} /> {loading ? 'Нэмж байна...' : 'Нэмэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

// ============ EMPLOYEE DETAIL MODAL ============
function EmployeeDetailModal({ employee, bizId, positions, onClose }: { employee: Employee; bizId: string; positions: Position[]; onClose: () => void }) {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDeletePIN, setShowDeletePIN] = useState(false);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const posId = fd.get('positionId') as string;
            const pos = positions.find(p => p.id === posId);
            await teamService.updateEmployee(bizId, employee.id, {
                name: (fd.get('name') as string).trim(),
                phone: (fd.get('phone') as string).trim(),
                email: (fd.get('email') as string)?.trim() || null,
                positionId: posId,
                positionName: pos?.name || employee.positionName,
                baseSalary: Number(fd.get('baseSalary')) || 0,
            });
            toast.success('Амжилттай хадгаллаа');
            setEditing(false);
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        try {
            await teamService.deleteEmployee(bizId, employee.id);
            toast.success('Ажилтан хасагдлаа');
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); }
    };

    const joinDate = employee.joinedAt ? new Date(employee.joinedAt).toLocaleDateString('mn-MN') : '—';

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal team-modal team-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className={`team-emp-avatar large ${employee.status}`}>
                            {employee.avatar || employee.name.charAt(0)}
                            <span className={`team-emp-status-dot ${employee.status}`} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0 }}>{employee.name}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{employee.positionName || 'Ажилтан'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>
                            <Edit2 size={14} /> {editing ? 'Болих' : 'Засах'}
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleSave}>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">Нэр</label>
                                    <input className="input" name="name" defaultValue={employee.name} style={{ height: 44 }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Утас</label>
                                    <input className="input" name="phone" defaultValue={employee.phone} style={{ height: 44 }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label className="input-label">И-мэйл</label>
                                    <input className="input" name="email" defaultValue={employee.email || ''} style={{ height: 44 }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Тушаал</label>
                                    <select className="input select" name="positionId" defaultValue={employee.positionId} style={{ height: 44 }}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {positions.filter(p => !(p as any).isDeleted).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Үндсэн цалин (₮)</label>
                                <input className="input" name="baseSalary" type="number" defaultValue={employee.baseSalary || 0} style={{ height: 44 }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-ghost text-danger" onClick={() => setShowDeletePIN(true)}>
                                <Trash2 size={14} /> Хасах
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Болих</button>
                                <button type="submit" className="btn btn-primary gradient-btn" disabled={loading}>
                                    {loading ? 'Хадгалж байна...' : 'Хадгалах'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="modal-body">
                        <div className="team-detail-grid">
                            <div className="team-detail-section">
                                <h4><Briefcase size={16} /> Мэдээлэл</h4>
                                <div className="team-detail-list">
                                    <div className="team-detail-row">
                                        <span className="team-detail-label">Утас</span>
                                        <span className="team-detail-value">{employee.phone || '—'}</span>
                                    </div>
                                    <div className="team-detail-row">
                                        <span className="team-detail-label">И-мэйл</span>
                                        <span className="team-detail-value">{employee.email || '—'}</span>
                                    </div>
                                    <div className="team-detail-row">
                                        <span className="team-detail-label">Тушаал</span>
                                        <span className="team-detail-value">{employee.positionName || 'Ажилтан'}</span>
                                    </div>
                                    <div className="team-detail-row">
                                        <span className="team-detail-label">Нэгдсэн</span>
                                        <span className="team-detail-value">{joinDate}</span>
                                    </div>
                                    <div className="team-detail-row">
                                        <span className="team-detail-label">Статус</span>
                                        <span className="team-detail-value">{employee.status === 'active' ? '🟢 Идэвхтэй' : employee.status === 'pending_invite' ? '🟡 Хүлээгдэж буй' : '⚫ Идэвхгүй'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="team-detail-section">
                                <h4><DollarSign size={16} /> Цалин & Гүйцэтгэл</h4>
                                <div className="team-detail-stats-grid">
                                    <div className="team-mini-stat">
                                        <div className="team-mini-stat-value">₮{((employee.baseSalary || 0) / 1000).toFixed(0)}K</div>
                                        <div className="team-mini-stat-label">Үндсэн цалин</div>
                                    </div>
                                    <div className="team-mini-stat">
                                        <div className="team-mini-stat-value">{employee.stats?.totalOrdersCreated || 0}</div>
                                        <div className="team-mini-stat-label">Үүсгэсэн</div>
                                    </div>
                                    <div className="team-mini-stat">
                                        <div className="team-mini-stat-value">{employee.stats?.totalOrdersHandled || 0}</div>
                                        <div className="team-mini-stat-label">Хариуцсан</div>
                                    </div>
                                    <div className="team-mini-stat">
                                        <div className="team-mini-stat-value">{employee.commissionRate ? `${employee.commissionRate}%` : '—'}</div>
                                        <div className="team-mini-stat-label">Шимтгэл</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showDeletePIN && <PINModal title="Ажилтан хасах" description={`${employee.name}-г багаас хасахын тулд PIN оруулна уу.`} onSuccess={handleDelete} onClose={() => setShowDeletePIN(false)} />}
        </div>,
        document.body
    );
}

// ============ EMPLOYEE LIMITS TAB ============
function EmployeeLimitsTab({ bizId }: { bizId: string }) {
    const { business } = useBusinessStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = (business?.settings as any) || {};
    const limits = settings.employeeLimits || {};

    const [form, setForm] = useState({
        maxDiscountPercent: limits.maxDiscountPercent ?? 10,
        maxDiscountPercentManager: limits.maxDiscountPercentManager ?? 20,
        maxRefundAmount: limits.maxRefundAmount ?? 500000,
        canDeleteOrders: limits.canDeleteOrders ?? false,
        canChangePrice: limits.canChangePrice ?? false,
        orderEditWindow: limits.orderEditWindow ?? 60,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const bizRef = doc(db, 'businesses', bizId);
            await updateDoc(bizRef, { 'settings.employeeLimits': form });
            toast.success('Хязгаарлалт хадгалагдлаа');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setSaving(false); }
    };

    return (
        <div className="team-section animate-fade-in">
            <div className="team-section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="icon-badge"><Settings size={16} /></div>
                    <div>
                        <h3 style={{ margin: 0 }}>Ажилтны хязгаарлалт</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Ажилтнууд ямар үйлдэл хийж болох хязгаарыг тохируулна</p>
                    </div>
                </div>
                <button className="btn btn-primary btn-sm gradient-btn" onClick={handleSave} disabled={saving}>
                    {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
            </div>

            <div className="team-limits-grid">
                {/* Discount Limits */}
                <div className="settings-card team-limit-card">
                    <div className="team-limit-header">
                        <DollarSign size={18} />
                        <h4>Хөнгөлөлтийн хязгаар</h4>
                    </div>
                    <div className="team-limit-body">
                        <div className="team-limit-row">
                            <label>Ажилтны хамгийн их хөнгөлөлт</label>
                            <div className="team-limit-input-row">
                                <input
                                    type="range"
                                    min={0} max={50}
                                    value={form.maxDiscountPercent}
                                    onChange={e => setForm(f => ({ ...f, maxDiscountPercent: Number(e.target.value) }))}
                                    className="team-slider"
                                />
                                <span className="team-limit-value">{form.maxDiscountPercent}%</span>
                            </div>
                        </div>
                        <div className="team-limit-row">
                            <label>Менежерийн хамгийн их хөнгөлөлт</label>
                            <div className="team-limit-input-row">
                                <input
                                    type="range"
                                    min={0} max={100}
                                    value={form.maxDiscountPercentManager}
                                    onChange={e => setForm(f => ({ ...f, maxDiscountPercentManager: Number(e.target.value) }))}
                                    className="team-slider"
                                />
                                <span className="team-limit-value">{form.maxDiscountPercentManager}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Limits */}
                <div className="settings-card team-limit-card">
                    <div className="team-limit-header">
                        <AlertTriangle size={18} />
                        <h4>Буцаалтын хязгаар</h4>
                    </div>
                    <div className="team-limit-body">
                        <div className="team-limit-row">
                            <label>Хамгийн их буцаалтын дүн</label>
                            <div className="input-group" style={{ marginTop: 8 }}>
                                <input
                                    className="input"
                                    type="number"
                                    value={form.maxRefundAmount}
                                    onChange={e => setForm(f => ({ ...f, maxRefundAmount: Number(e.target.value) }))}
                                    style={{ height: 44 }}
                                />
                                <span className="input-suffix">₮</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Permissions */}
                <div className="settings-card team-limit-card">
                    <div className="team-limit-header">
                        <Shield size={18} />
                        <h4>Үйлдлийн эрх</h4>
                    </div>
                    <div className="team-limit-body">
                        <div className="team-limit-toggle-row">
                            <div>
                                <div className="team-limit-toggle-label">Захиалга устгах</div>
                                <div className="team-limit-toggle-desc">Ажилтан захиалга устгаж болох эсэх</div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={form.canDeleteOrders} onChange={e => setForm(f => ({ ...f, canDeleteOrders: e.target.checked }))} />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                        <div className="team-limit-toggle-row">
                            <div>
                                <div className="team-limit-toggle-label">Үнэ өөрчлөх</div>
                                <div className="team-limit-toggle-desc">Ажилтан барааны үнэ өөрчлөх эсэх</div>
                            </div>
                            <label className="toggle">
                                <input type="checkbox" checked={form.canChangePrice} onChange={e => setForm(f => ({ ...f, canChangePrice: e.target.checked }))} />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Time Window */}
                <div className="settings-card team-limit-card">
                    <div className="team-limit-header">
                        <Clock size={18} />
                        <h4>Цагийн хязгаар</h4>
                    </div>
                    <div className="team-limit-body">
                        <div className="team-limit-row">
                            <label>Захиалга засах цонх</label>
                            <p className="team-limit-desc">Захиалга үүсгэснээс хэдэн минутын дотор засаж болох</p>
                            <div className="team-limit-input-row">
                                <input
                                    type="range"
                                    min={5} max={1440}
                                    value={form.orderEditWindow}
                                    onChange={e => setForm(f => ({ ...f, orderEditWindow: Number(e.target.value) }))}
                                    className="team-slider"
                                />
                                <span className="team-limit-value">{form.orderEditWindow >= 60 ? `${Math.floor(form.orderEditWindow / 60)} цаг` : `${form.orderEditWindow} мин`}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============ CREATE POSITION MODAL ============
function CreatePositionModal({ bizId, editingPosition, onClose }: { bizId: string; editingPosition: Position | null; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [selectedPerms, setSelectedPerms] = useState<string[]>(editingPosition?.permissions || []);

    const togglePermission = (permId: string) => {
        setSelectedPerms(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const toggleGroup = (_groupName: string, permIds: string[]) => {
        const allSelected = permIds.every(id => selectedPerms.includes(id));
        if (allSelected) {
            setSelectedPerms(prev => prev.filter(p => !permIds.includes(p)));
        } else {
            setSelectedPerms(prev => Array.from(new Set([...prev, ...permIds])));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            const data = {
                name: fd.get('name') as string,
                description: fd.get('description') as string,
                color: '#6c5ce7',
                permissions: selectedPerms,
            };

            if (editingPosition) {
                await teamService.updatePosition(bizId, editingPosition.id, data);
                toast.success('Амжилттай засагдлаа');
            } else {
                await teamService.createPosition(bizId, {
                    ...data,
                    order: 1,
                    isSystem: false,
                    isDefault: false
                });
                toast.success('Амжилттай үүсгэлээ');
            }
            onClose();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    // Group permissions by category
    const groupedPermissions: Record<string, { id: string; label: string }[]> = {};
    Object.entries(ALL_PERMISSIONS).forEach(([id, perm]) => {
        if (!groupedPermissions[perm.group]) groupedPermissions[perm.group] = [];
        groupedPermissions[perm.group].push({ id, label: perm.label });
    });

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 800, width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="icon-badge" style={{ background: 'var(--primary)', color: 'white' }}><Shield size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editingPosition ? 'Албан тушаал засах' : 'Шинэ албан тушаал'}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Системд хандах эрхийн тохиргоо</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="modal-body" style={{ padding: 0, overflowY: 'auto' }}>

                        {/* SECTION 1: BASIC INFO */}
                        <div className="modal-section" style={{ padding: '24px 32px' }}>
                            <div className="modal-section-title" style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 16 }}>Үндсэн мэдээлэл</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 600 }}>Албан тушаалын нэр *</label>
                                    <input className="input" name="name" required defaultValue={editingPosition?.name} placeholder="Жнь: Менежер, Салбарын эрхлэгч..." style={{ height: 48 }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 600 }}>Тайлбар</label>
                                    <input className="input" name="description" defaultValue={editingPosition?.description} placeholder="Тухайн албан тушаалын үүрэг" style={{ height: 48 }} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PERMISSIONS */}
                        <div className="modal-section" style={{ padding: '24px 32px', background: 'var(--bg-soft)', borderTop: '1px solid var(--border-primary)' }}>
                            <div className="modal-section-title" style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 20 }}>Системийн эрхүүд</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                                {Object.entries(groupedPermissions).map(([groupName, perms]) => {
                                    const allSelected = perms.every(p => selectedPerms.includes(p.id));
                                    const someSelected = perms.some(p => selectedPerms.includes(p.id));

                                    return (
                                        <div key={groupName} className="settings-card" style={{ padding: 20, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={input => { if (input) input.indeterminate = !allSelected && someSelected; }}
                                                    onChange={() => toggleGroup(groupName, perms.map(p => p.id))}
                                                    id={`group-${groupName}`}
                                                    style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: 18, height: 18 }}
                                                />
                                                <label htmlFor={`group-${groupName}`} style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', flex: 1, margin: 0 }}>{groupName}</label>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {perms.map(perm => (
                                                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPerms.includes(perm.id)}
                                                            onChange={() => togglePermission(perm.id)}
                                                            style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: 16, height: 16, marginTop: 2 }}
                                                        />
                                                        {perm.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '20px 32px', background: '#fff', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontWeight: 600 }}>Болих</button>
                        <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ padding: '0 24px', fontWeight: 600 }}>
                            {editingPosition ? 'Өөрчлөлтийг хадгалах' : 'Үүсгэх'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
