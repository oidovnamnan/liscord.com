import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, MoreVertical, Shield, Trash2, X } from 'lucide-react';
import { teamService } from '../../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../../components/common/PINModal';
import { ALL_PERMISSIONS, type Position, type Employee } from '../../../types';

export function TeamSettings({ bizId }: { bizId: string }) {
    const [subTab, setSubTab] = useState<'employees' | 'positions'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [showPosModal, setShowPosModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [showPIN, setShowPIN] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [selectedPosId, setSelectedPosId] = useState<string | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const u1 = teamService.subscribeEmployees(bizId, setEmployees);
        const u2 = teamService.subscribePositions(bizId, setPositions);
        return () => { u1(); u2(); };
    }, [bizId]);

    const handleDeletePos = (id: string) => {
        setSelectedPosId(id);
        setShowPIN(true);
    };

    const confirmDelete = async () => {
        if (!selectedPosId) return;
        try {
            await teamService.updatePosition(bizId, selectedPosId, { isDeleted: true } as any);
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setShowPIN(false); }
    };

    return (
        <div className="settings-section animate-fade-in">
            <h2>Баг</h2>
            <div className="settings-card">
                <div className="settings-card-header" style={{ marginBottom: 0 }}>
                    <div className="settings-card-icon"><Users size={20} /></div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Багийн гишүүд болон эрх</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Багийн гишүүдийг урих, тэдний системд хандах эрхийг удирдах.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 4, marginTop: 24, marginBottom: 32, padding: 4, background: 'var(--bg-soft)', borderRadius: 12, width: 'fit-content' }}>
                    <button
                        className={`btn btn-sm ${subTab === 'employees' ? '' : 'btn-ghost'}`}
                        onClick={() => setSubTab('employees')}
                        style={{ borderRadius: 8, padding: '6px 16px', background: subTab === 'employees' ? '#fff' : 'transparent', color: subTab === 'employees' ? '#000' : 'inherit', boxShadow: subTab === 'employees' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                    >Ажилчид</button>
                    <button
                        className={`btn btn-sm ${subTab === 'positions' ? '' : 'btn-ghost'}`}
                        onClick={() => setSubTab('positions')}
                        style={{ borderRadius: 8, padding: '6px 16px', background: subTab === 'positions' ? '#fff' : 'transparent', color: subTab === 'positions' ? '#000' : 'inherit', boxShadow: subTab === 'positions' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}
                    >Эрхүүд / Албан тушаал</button>
                </div>

                {subTab === 'employees' ? (
                    <div className="team-list">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ margin: 0 }}>Ажилчид ({employees.length})</h3>
                            <button className="btn btn-primary btn-sm gradient-btn" onClick={() => setShowInvite(true)}><Plus size={14} /> Урих</button>
                        </div>
                        <div className="employee-grid">
                            {employees.map(emp => (
                                <div key={emp.id} className="settings-card employee-card">
                                    <div className="employee-avatar">{emp.avatar || emp.name.charAt(0)}</div>
                                    <div className="employee-info">
                                        <div className="employee-name">{emp.name}</div>
                                        <div className="employee-role">{emp.positionName || 'Ажилтан'}</div>
                                    </div>
                                    <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="positions-list">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="icon-badge"><Shield size={16} /></div>
                                <h3 style={{ margin: 0 }}>Албан тушаалууд</h3>
                            </div>
                            <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingPosition(null); setShowPosModal(true); }}>
                                <Plus size={14} /> Нэмэх
                            </button>
                        </div>
                        <div className="positions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                            {positions.filter(p => !(p as any).isDeleted).map(pos => (
                                <div key={pos.id} className="settings-card position-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div className="position-info">
                                            <div className="position-name" style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{pos.name}</div>
                                            <div className="position-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pos.description || 'Тайлбар байхгүй'}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingPosition(pos); setShowPosModal(true); }}>
                                                <MoreVertical size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeletePos(pos.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showPosModal && <CreatePositionModal bizId={bizId} editingPosition={editingPosition} onClose={() => setShowPosModal(false)} />}
            {showPIN && <PINModal title="Устгах баталгаажуулалт" description="Албан тушаалын эрхийг устгахын тулд PIN кодыг оруулна уу." onSuccess={confirmDelete} onClose={() => setShowPIN(false)} />}
            {showInvite && <InviteEmployeeModal onClose={() => setShowInvite(false)} positions={positions} />}
        </div>
    );
}

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
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
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

function InviteEmployeeModal({ onClose, positions }: { onClose: () => void; positions: Position[] }) {
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ажилтан урих</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group">
                        <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                        <input className="input" placeholder="+976 9900 1234" autoFocus />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Албан тушаал</label>
                        <select className="input select">
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Урилга линк тухайн дугаар руу SMS-ээр илгээгдэнэ.
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Болих</button>
                    <button className="btn btn-primary" onClick={onClose}><Plus size={16} /> Урих</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
