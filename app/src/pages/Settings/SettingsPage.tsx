import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Building2, Palette, Bell, Shield, Users, CreditCard, Globe, Moon, Sun, Monitor, Loader2, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useBusinessStore, useUIStore } from '../../store';
import { businessService, teamService, cargoService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../components/common/PINModal';
import type { Position, Employee, CargoType } from '../../types';
import './SettingsPage.css';

export function SettingsPage() {
    const { business } = useBusinessStore();
    const { theme, setTheme } = useUIStore();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'general', label: 'Ерөнхий', icon: Building2 },
        { id: 'appearance', label: 'Харагдац', icon: Palette },
        { id: 'notifications', label: 'Мэдэгдэл', icon: Bell },
        { id: 'security', label: 'Аюулгүй байдал', icon: Shield },
        { id: 'team', label: 'Баг', icon: Users },
        { id: 'cargo', label: 'Карго', icon: Globe },
        { id: 'language', label: 'Хэл', icon: Globe },
    ];

    const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await businessService.updateBusiness(business.id, {
                name: fd.get('name') as string,
                phone: fd.get('phone') as string,
                email: fd.get('email') as string,
                address: fd.get('address') as string,
            });
            toast.success('Тохиргоо хадгалагдлаа');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    const handleUpdatePIN = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!business) return;
        const pin = (new FormData(e.currentTarget)).get('pin') as string;
        if (pin.length < 4) return toast.error('PIN код дутуу байна');
        setLoading(true);
        try {
            await businessService.updateBusiness(business.id, { settings: { ...business.settings, pin } });
            toast.success('PIN код шинэчлэгдлээ');
        } catch (error) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return (
        <>
            <Header title="Тохиргоо" />
            <div className="page">
                <div className="settings-layout">
                    <div className="settings-sidebar">
                        {tabs.map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} className={`settings-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                                    <Icon size={18} /> {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="settings-content">
                        {activeTab === 'general' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Бизнесийн мэдээлэл</h2>
                                <form className="settings-form" onSubmit={handleUpdateBusiness}>
                                    <div className="input-group"><label className="input-label">Бизнесийн нэр</label><input className="input" name="name" defaultValue={business?.name} required /></div>
                                    <div className="grid-2-gap"><div className="input-group"><label className="input-label">Утас</label><input className="input" name="phone" defaultValue={business?.phone} /></div><div className="input-group"><label className="input-label">И-мэйл</label><input className="input" name="email" defaultValue={business?.email} /></div></div>
                                    <div className="input-group"><label className="input-label">Хаяг</label><input className="input" name="address" defaultValue={business?.address} /></div>
                                    <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}</button>
                                </form>
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Аюулгүй байдал</h2>
                                <form className="settings-form" onSubmit={handleUpdatePIN}>
                                    <div className="input-group"><label className="input-label">PIN код (Чухал үйлдлийн баталгаажуулалт)</label><input className="input" name="pin" type="password" defaultValue={business?.settings?.pin} style={{ maxWidth: 200 }} required /></div>
                                    <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : 'PIN шинэчлэх'}</button>
                                </form>
                            </div>
                        )}
                        {activeTab === 'team' && <TeamSettings bizId={business?.id || ''} />}
                        {activeTab === 'appearance' && (
                            <div className="settings-section animate-fade-in">
                                <h2>Харагдац</h2>
                                <div className="theme-options">
                                    <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><Moon size={24} /><span>Бараан</span></button>
                                    <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><Sun size={24} /><span>Цайвар</span></button>
                                    <button className={`theme-option ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}><Monitor size={24} /><span>Системийн</span></button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'cargo' && <CargoSettings bizId={business?.id || ''} />}
                    </div>
                </div>
            </div>
        </>
    );
}

function TeamSettings({ bizId }: { bizId: string }) {
    const [subTab, setSubTab] = useState<'employees' | 'positions'>('employees');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [showPosModal, setShowPosModal] = useState(false);
    const [showPIN, setShowPIN] = useState(false);
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
            <div className="settings-subtabs">
                <button className={`settings-subtab ${subTab === 'employees' ? 'active' : ''}`} onClick={() => setSubTab('employees')}>Ажилчид</button>
                <button className={`settings-subtab ${subTab === 'positions' ? 'active' : ''}`} onClick={() => setSubTab('positions')}>Эрхүүд / Албан тушаал</button>
            </div>

            {subTab === 'employees' ? (
                <div className="team-list">
                    <div className="section-header-compact"><h3>Ажилчид ({employees.length})</h3><button className="btn btn-primary btn-sm"><Plus size={14} /> Урих</button></div>
                    <div className="employee-grid">
                        {employees.map(emp => (
                            <div key={emp.id} className="employee-card card">
                                <div className="employee-avatar">{emp.avatar || emp.name.charAt(0)}</div>
                                <div className="employee-info"><div className="employee-name">{emp.name}</div><div className="employee-role">{emp.positionName}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="positions-list">
                    <div className="section-header-compact"><h3>Албан тушаалууд</h3><button className="btn btn-primary btn-sm" onClick={() => setShowPosModal(true)}><Plus size={14} /> Нэмэх</button></div>
                    <div className="positions-grid">
                        {positions.filter(p => !(p as any).isDeleted).map(pos => (
                            <div key={pos.id} className="position-card card">
                                <div className="position-info"><div className="position-name">{pos.name}</div><div className="position-desc">{pos.description}</div></div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={14} /></button>
                                    <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDeletePos(pos.id)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showPosModal && <CreatePositionModal bizId={bizId} onClose={() => setShowPosModal(false)} />}
            {showPIN && <PINModal title="Устгах баталгаажуулалт" description="Албан тушаалын эрхийг устгахын тулд PIN кодыг оруулна уу." onSuccess={confirmDelete} onClose={() => setShowPIN(false)} />}
        </div>
    );
}

function CreatePositionModal({ bizId, onClose }: { bizId: string; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setLoading(true);
        try {
            await teamService.createPosition(bizId, {
                name: fd.get('name') as string,
                description: fd.get('description') as string,
                color: '#6c5ce7',
                permissions: [],
                order: 1,
                isSystem: false,
                isDefault: false
            });
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };
    return (
        <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Шинэ албан тушаал</h2><button onClick={onClose}>✕</button></div>
            <form onSubmit={handleSubmit}><div className="modal-body">
                <div className="input-group"><label className="input-label">Нэр</label><input className="input" name="name" required /></div>
                <div className="input-group"><label className="input-label">Тайлбар</label><input className="input" name="description" /></div>
            </div><div className="modal-footer"><button type="submit" className="btn btn-primary" disabled={loading}>Хадгалах</button></div></form>
        </div></div>
    );
}

function CargoSettings({ bizId }: { bizId: string }) {
    const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState<CargoType | null>(null);

    useEffect(() => {
        if (!bizId) return;
        const unsubscribe = cargoService.subscribeCargoTypes(bizId, setCargoTypes);
        return () => unsubscribe();
    }, [bizId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Энэ каргоны төрлийг устгах уу?')) return;
        try {
            await cargoService.updateCargoType(bizId, id, { isDeleted: true });
            toast.success('Устгагдлаа');
        } catch (e) { toast.error('Алдаа гарлаа'); }
    };

    return (
        <div className="settings-section animate-fade-in">
            <div className="section-header-compact">
                <h3>Каргоны төрлүүд</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingType(null); setShowModal(true); }}>
                    <Plus size={14} /> Төрөл нэмэх
                </button>
            </div>

            <div className="cargo-types-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
                {cargoTypes.map(type => (
                    <div key={type.id} className="card cargo-type-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{type.name}</div>
                            <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>
                                ₮{type.fee.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {type.unit}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingType(type); setShowModal(true); }}>
                                <MoreVertical size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(type.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {cargoTypes.length === 0 && (
                    <div className="empty-state-mini" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                        <Globe size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
                        <div style={{ color: 'var(--text-muted)' }}>Каргоны төрөл бүртгэгдээгүй байна</div>
                    </div>
                )}
            </div>

            {showModal && (
                <CargoTypeModal
                    bizId={bizId}
                    onClose={() => setShowModal(false)}
                    editingType={editingType}
                />
            )}
        </div>
    );
}

function CargoTypeModal({ bizId, onClose, editingType }: { bizId: string; onClose: () => void; editingType: CargoType | null }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = {
            name: fd.get('name') as string,
            fee: Number(fd.get('fee')),
            unit: fd.get('unit') as string,
        };

        setLoading(true);
        try {
            if (editingType) {
                await cargoService.updateCargoType(bizId, editingType.id, data);
            } else {
                await cargoService.createCargoType(bizId, data);
            }
            toast.success('Амжилттай');
            onClose();
        } catch (e) { toast.error('Алдаа гарлаа'); } finally { setLoading(false); }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <h2>{editingType ? 'Төрөл засах' : 'Шинэ каргоны төрөл'}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Төрлийн нэр</label>
                            <input className="input" name="name" defaultValue={editingType?.name} placeholder="Жишээ: Жижиг бараа" required autoFocus />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Төлбөр (₮)</label>
                                <input className="input" name="fee" type="number" defaultValue={editingType?.fee} placeholder="2000" required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Хэмжих нэгж</label>
                                <select className="input select" name="unit" defaultValue={editingType?.unit || 'ш'}>
                                    <option value="ш">ш (ширхэг)</option>
                                    <option value="кг">кг (килограмм)</option>
                                    <option value="л">л (литр)</option>
                                    <option value="м3">м3 (куб метр)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Болих</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Хадгалах'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
