import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { Search, Plus, Phone, Shield, MoreVertical, Clock } from 'lucide-react';
import './EmployeesPage.css';

interface EmployeeRow {
    id: string;
    name: string;
    phone: string;
    position: string;
    positionColor: string;
    status: 'active' | 'inactive';
    joinedAt: string;
    lastActive: string;
    ordersToday: number;
    permissions: string[];
}

const demoEmployees: EmployeeRow[] = [
    { id: '1', name: 'Бат-Эрдэнэ', phone: '9900-1234', position: 'Эзэмшигч', positionColor: '#6c5ce7', status: 'active', joinedAt: '2024.01.01', lastActive: '2 мин', ordersToday: 8, permissions: ['Бүгд'] },
    { id: '2', name: 'Сараа', phone: '9911-5678', position: 'Менежер', positionColor: '#0dbff0', status: 'active', joinedAt: '2024.06.15', lastActive: '15 мин', ordersToday: 12, permissions: ['Захиалга', 'Бараа', 'Тайлан'] },
    { id: '3', name: 'Дорж', phone: '8855-9012', position: 'Борлуулагч', positionColor: '#ff6b9d', status: 'active', joinedAt: '2025.01.10', lastActive: '1 цаг', ordersToday: 5, permissions: ['Захиалга', 'Бараа'] },
    { id: '4', name: 'Нараа', phone: '8833-2222', position: 'Хүргэгч', positionColor: '#ff9f43', status: 'active', joinedAt: '2025.03.01', lastActive: '30 мин', ordersToday: 7, permissions: ['Хүргэлт'] },
    { id: '5', name: 'Тамир', phone: '9922-1111', position: 'Нягтлан', positionColor: '#0be881', status: 'inactive', joinedAt: '2025.06.01', lastActive: '3 өдөр', ordersToday: 0, permissions: ['Тайлан', 'Төлбөр'] },
];

export function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [employees] = useState(demoEmployees);

    const filtered = employees.filter(e => {
        if (!search) return true;
        const s = search.toLowerCase();
        return e.name.toLowerCase().includes(s) || e.phone.includes(s) || e.position.toLowerCase().includes(s);
    });

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
                        <div className="stat-card-label">Өнөөдрийн нийт захиалга</div>
                        <div className="stat-card-value">{employees.reduce((s, e) => s + e.ordersToday, 0)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Албан тушаал</div>
                        <div className="stat-card-value">{new Set(employees.map(e => e.position)).size}</div>
                    </div>
                </div>

                <div className="employees-list stagger-children">
                    {filtered.map(emp => (
                        <div key={emp.id} className="employee-card card card-clickable">
                            <div className="employee-header">
                                <div className="employee-avatar" style={{ borderColor: emp.positionColor }}>
                                    {emp.name.charAt(0)}
                                    <span className={`employee-status-dot ${emp.status}`} />
                                </div>
                                <div className="employee-info">
                                    <div className="employee-name">{emp.name}</div>
                                    <div className="employee-position" style={{ color: emp.positionColor }}>
                                        <Shield size={12} /> {emp.position}
                                    </div>
                                </div>
                                <div className="employee-meta">
                                    <div className="employee-active"><Clock size={12} /> {emp.lastActive}</div>
                                    <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                            <div className="employee-details">
                                <span><Phone size={12} /> {emp.phone}</span>
                                <span>Өнөөдөр: {emp.ordersToday} захиалга</span>
                                <span>Эрх: {emp.permissions.join(', ')}</span>
                            </div>
                        </div>
                    ))}
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
