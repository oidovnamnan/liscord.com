import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Building2, Palette, Bell, Shield, Users, CreditCard, Globe, Moon, Sun, Monitor, Loader2, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useBusinessStore, useUIStore } from '../../store';
import { businessService, teamService } from '../../services/db';
import { toast } from 'react-hot-toast';
import { PINModal } from '../../components/common/PINModal';
import type { Position, Employee } from '../../types';
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
        { id: 'billing', label: 'Төлбөр', icon: CreditCard },
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
