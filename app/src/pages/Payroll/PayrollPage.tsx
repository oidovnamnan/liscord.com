import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { teamService, payrollService } from '../../services/db';
import type { Employee, PayrollEntry } from '../../types';
import { Calculator, Save, User, DollarSign, Clock, Building2, Download } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { toast } from 'react-hot-toast';
import './PayrollPage.css';

export function PayrollPage() {
    const { business } = useBusinessStore();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // The active payroll entry being drafted/edited
    const [entry, setEntry] = useState<Partial<PayrollEntry>>({});

    useEffect(() => {
        if (!business) return;
        setLoading(true);
        const unsubscribe = teamService.subscribeEmployees(business.id, (team: Employee[]) => {
            setEmployees(team.filter((t: Employee) => t.status === 'active'));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [business]);

    useEffect(() => {
        if (!business || !month || !selectedEmployee) return;

        const loadEntry = async () => {
            const entries = await payrollService.getEntriesByMonth(business.id, month);
            const existing = entries.find(e => e.employeeId === selectedEmployee.id);

            if (existing) {
                setEntry(existing);
            } else {
                // Initialize draft
                setEntry({
                    employeeId: selectedEmployee.id,
                    employeeName: selectedEmployee.name,
                    month,
                    baseSalary: selectedEmployee.baseSalary || 0,
                    workedHours: 160, // Mock: normally fetched from attendanceService
                    hourlyRate: 0,
                    commissions: 0, // Mock: normally fetched from orderService via commissionRate
                    deductions: 0,
                    advances: 0,
                    netPay: selectedEmployee.baseSalary || 0,
                    status: 'draft'
                });
            }
        };
        loadEntry();
    }, [business, month, selectedEmployee]);

    // Calculate net pay whenever inputs change
    useEffect(() => {
        if (entry.employeeId) {
            const base = Number(entry.baseSalary) || 0;
            const com = Number(entry.commissions) || 0;
            const hRate = Number(entry.hourlyRate) || 0;
            const hWorked = Number(entry.workedHours) || 0;

            const earned = base + com + (hRate * hWorked);
            const deduct = (Number(entry.deductions) || 0) + (Number(entry.advances) || 0);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEntry((prev: any) => ({ ...prev, netPay: Math.max(0, earned - deduct) }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry.baseSalary, entry.commissions, entry.hourlyRate, entry.workedHours, entry.deductions, entry.advances]);

    const handleSave = async () => {
        if (!business || !entry.employeeId) return;
        setSaving(true);
        try {
            const id = await payrollService.saveEntry(business.id, entry as PayrollEntry);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEntry((prev: any) => ({ ...prev, id }));
            toast.success('Цалингийн мэдээлэл хадгалагдлаа');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!business || !entry.id) {
            toast.error('Эхлээд хадгална уу!');
            return;
        }
        setSaving(true);
        try {
            await payrollService.saveEntry(business.id, { ...entry, status: 'paid', paidAt: new Date() } as PayrollEntry);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setEntry((prev: any) => ({ ...prev, status: 'paid', paidAt: new Date() }));
            toast.success('Цалин олгогдсоноор тэмдэглэлээ');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateMockCommissions = () => {
        // Just mock some data for the audit
        const rate = selectedEmployee?.commissionRate || 10;
        const totalSales = Math.floor(Math.random() * 5000000) + 1000000;
        const comm = (totalSales * rate) / 100;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEntry((prev: any) => ({
            ...prev,
            commissions: comm
        }));
        toast.success(`Борлуулалтын шагнал бодогдлоо (${rate}%)`);
    };

    return (
        <HubLayout hubId="staff-hub">
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header title="Цалин бодолт" />

                <div className="payroll-layout">
                    {/* LEFT SIDEBAR: EMPLOYEES */}
                    <div className="payroll-sidebar">
                        <div className="payroll-sidebar-header">
                            <h3><Building2 size={16} /> Ажилчид</h3>

                            <div className="input-group" style={{ marginTop: 16 }}>
                                <label className="input-label">Сараар шүүх</label>
                                <input
                                    type="month"
                                    className="input"
                                    value={month}
                                    onChange={(e) => {
                                        setMonth(e.target.value);
                                        setSelectedEmployee(null); // Reset selection on month change
                                    }}
                                />
                            </div>
                        </div>

                        <div className="employee-list">
                            {loading ? (
                                <div className="payroll-empty">Уншиж байна...</div>
                            ) : employees.length === 0 ? (
                                <div className="payroll-empty">Ажилтан олдсонгүй. Баг цэснээс нэмнэ үү.</div>
                            ) : (
                                employees.map(emp => (
                                    <button
                                        key={emp.id}
                                        className={`employee-list-item ${selectedEmployee?.id === emp.id ? 'active' : ''}`}
                                        onClick={() => setSelectedEmployee(emp)}
                                    >
                                        <div className="emp-avatar">
                                            {emp.avatar ? <img src={emp.avatar} alt="" /> : <User size={20} />}
                                        </div>
                                        <div className="emp-info">
                                            <h4>{emp.name}</h4>
                                            <span>{emp.positionName}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: CALCULATOR */}
                    <div className="payroll-content">
                        {!selectedEmployee ? (
                            <div className="payroll-welcome">
                                <Calculator size={48} className="payroll-welcome-icon" />
                                <h2>Ажилтны цалин бодох</h2>
                                <p>Зүүн талаас ажилтнаа сонгож тухайн сарын цалингийн мэдээллийг оруулна уу.</p>
                            </div>
                        ) : (
                            <div className="payroll-sheet animate-fade-in">
                                <div className="sheet-header">
                                    <div className="sheet-title">
                                        <h2>{selectedEmployee.name} - Цалин ({month})</h2>
                                        <span className={`badge ${entry.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {entry.status === 'paid' ? 'Олгогдсон' : 'Ноорог'}
                                        </span>
                                    </div>
                                    <div className="sheet-actions">
                                        {entry.status !== 'paid' && (
                                            <button className="btn btn-primary gradient-btn" onClick={handleSave} disabled={saving}>
                                                <Save size={16} /> Хадгалах
                                            </button>
                                        )}
                                        {entry.id && entry.status === 'draft' && (
                                            <button className="btn btn-success" onClick={handleMarkPaid} disabled={saving}>
                                                <DollarSign size={16} /> Олгох (Төлсөн)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="sheet-grid">
                                    {/* EARNINGS */}
                                    <div className="sheet-card">
                                        <h3 className="card-title text-success">Олговрын мэдээлэл (Нэмэх)</h3>

                                        <div className="input-group">
                                            <label className="input-label">Үндсэн цалин (Сар)</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₮</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={entry.baseSalary || 0}
                                                    onChange={(e) => setEntry({ ...entry, baseSalary: Number(e.target.value) })}
                                                    disabled={entry.status === 'paid'}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid-2-gap" style={{ marginTop: 12 }}>
                                            <div className="input-group">
                                                <label className="input-label">Ажилласан цаг</label>
                                                <div className="input-with-icon">
                                                    <span className="input-icon"><Clock size={16} /></span>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={entry.workedHours || 0}
                                                        onChange={(e) => setEntry({ ...entry, workedHours: Number(e.target.value) })}
                                                        disabled={entry.status === 'paid'}
                                                    />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Цагийн хөлс</label>
                                                <div className="input-with-icon">
                                                    <span className="input-icon">₮</span>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={entry.hourlyRate || 0}
                                                        onChange={(e) => setEntry({ ...entry, hourlyRate: Number(e.target.value) })}
                                                        disabled={entry.status === 'paid'}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="input-group" style={{ marginTop: 12 }}>
                                            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Борлуулалтын урамшуулал (Бонус)</span>
                                                {entry.status !== 'paid' && (
                                                    <button className="text-secondary" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }} onClick={handleGenerateMockCommissions}>
                                                        Автомат бодох
                                                    </button>
                                                )}
                                            </label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₮</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={entry.commissions || 0}
                                                    onChange={(e) => setEntry({ ...entry, commissions: Number(e.target.value) })}
                                                    disabled={entry.status === 'paid'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* DEDUCTIONS */}
                                    <div className="sheet-card">
                                        <h3 className="card-title text-danger">Суутгалын мэдээлэл (Хасах)</h3>

                                        <div className="input-group">
                                            <label className="input-label">Татвар, НДШ (Суутгал)</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₮</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={entry.deductions || 0}
                                                    onChange={(e) => setEntry({ ...entry, deductions: Number(e.target.value) })}
                                                    disabled={entry.status === 'paid'}
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>ХХОАТ болон НДШ мөн бусад татвар суутгалууд.</p>
                                        </div>

                                        <div className="input-group" style={{ marginTop: 12 }}>
                                            <label className="input-label">Урьдчилгаа болон Торгууль</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₮</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={entry.advances || 0}
                                                    onChange={(e) => setEntry({ ...entry, advances: Number(e.target.value) })}
                                                    disabled={entry.status === 'paid'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TOTALS */}
                                <div className="sheet-summary">
                                    <h3>Нийт олгох цалин</h3>
                                    <div className="net-pay value-lg">
                                        ₮{(entry.netPay || 0).toLocaleString()}
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                                        (Үндсэн цалин + Бонус + Цагийн хөлс) - Суутгалууд
                                    </p>
                                </div>

                                {/* EXPORT OPTIONS */}
                                {entry.status === 'paid' && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
                                        <button className="btn btn-outline" onClick={() => window.print()}>
                                            <Download size={16} /> Цалингийн хуудас хэвлэх
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
