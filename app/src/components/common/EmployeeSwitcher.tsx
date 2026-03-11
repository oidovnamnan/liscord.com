import { useState } from 'react';
import { useBusinessStore } from '../../store';
import { Shield, ChevronDown, ArrowRightLeft } from 'lucide-react';
import './EmployeeSwitcher.css';

export function EmployeeSwitcher() {
    const { employee, linkedEmployees, switchToEmployee } = useBusinessStore();
    const [open, setOpen] = useState(false);

    if (!employee || linkedEmployees.length === 0) return null;

    return (
        <div className="emp-switcher">
            <button className="emp-switcher-trigger" onClick={() => setOpen(!open)}>
                <div className="emp-switcher-current">
                    <div className="emp-switcher-avatar">
                        {(employee.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="emp-switcher-info">
                        <div className="emp-switcher-name">{employee.name}</div>
                        <div className="emp-switcher-role">
                            <Shield size={10} />
                            {employee.positionName || 'Ажилтан'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={14} className={`emp-switcher-arrow ${open ? 'open' : ''}`} />
            </button>

            {open && (
                <div className="emp-switcher-dropdown">
                    <div className="emp-switcher-label">
                        <ArrowRightLeft size={12} />
                        Эрх солих
                    </div>
                    {linkedEmployees.map(emp => (
                        <button
                            key={emp.id}
                            className="emp-switcher-item"
                            onClick={() => {
                                switchToEmployee(emp);
                                setOpen(false);
                            }}
                        >
                            <div className="emp-switcher-avatar small">
                                {(emp.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="emp-switcher-info">
                                <div className="emp-switcher-name">{emp.name}</div>
                                <div className="emp-switcher-role">
                                    <Shield size={10} />
                                    {emp.positionName || 'Ажилтан'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
