import { useEffect, useState } from 'react';
import { Search, Plus, Phone, Shield, MoreVertical, Clock } from 'lucide-react';
import { useBusinessStore } from '../../store';
import { teamService } from '../../services/db';
import type { Employee } from '../../types';
import { Header } from '../../components/layout/Header';
import './EmployeesPage.css';

export function EmployeesPage() {
    const { business } = useBusinessStore();
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (!business) return;
        return teamService.subscribeEmployees(business.id, (data) => {
            setEmployees(data);
        });
    }, [business]);

    const filtered = employees.filter(e => {
        if (!search) return true;
        const s = search.toLowerCase();
        return e.name?.toLowerCase().includes(s) ||
            e.phone?.includes(s) ||
            e.positionName?.toLowerCase().includes(s);
    });

    const getRoleColor = (role?: string) => {
        if (role === 'owner') return '#6c5ce7';
        return '#0dbff0';
    };

    return (
        <>
            <Header title="Ажилтан" subtitle={`Нийт ${employees.length} ажилтан`} action={{ label: 'Урих', onClick: () => setShowInvite(true) }} />
            <div className="page">
                <div className="orders-toolbar">
                    <div className="orders-search">
                        <Search size={18} className="orders-search-icon" />
                        <input className="input orders-search-input" placeholder="Нэр, утас, албан тушаал хайх..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Идэвхтэй</div>
                        <div className="stat-card-value">{employees.filter(e => e.status === 'active').length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Нийт баг</div>
                        <div className="stat-card-value">{employees.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Албан тушаал</div>
                        <div className="stat-card-value">{new Set(employees.map(e => e.positionId)).size}</div>
                    </div>
                </div>

                <div className="employees-list stagger-children">
                    {filtered.map(emp => {
                        const displayName = emp.name || emp.userId || 'Мэдэгдэхгүй';
                        const roleColor = getRoleColor(emp.role);
                        return (
                            <div key={emp.id} className="employee-card card card-clickable">
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
                                    <div className="employee-meta">
                                        <div className="employee-active"><Clock size={12} /> {emp.status === 'active' ? 'Идэвхтэй' : 'Хүлээгдэж буй'}</div>
                                        <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={16} /></button>
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

            {showInvite && (
                <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Ажилтан урих</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowInvite(false)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Утасны дугаар <span className="required">*</span></label>
                                <input className="input" placeholder="+976 9900 1234" autoFocus />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Албан тушаал</label>
                                <select className="input select">
                                    <option>Борлуулагч</option>
                                    <option>Менежер</option>
                                    <option>Хүргэгч</option>
                                    <option>Нягтлан</option>
                                </select>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Урилга линк тухайн дугаар руу SMS-ээр илгээгдэнэ.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>Болих</button>
                            <button className="btn btn-primary" onClick={() => setShowInvite(false)}><Plus size={16} /> Урих</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
