import { useState } from 'react';
import { X, Calendar, Clock, User, Scissors } from 'lucide-react';
import { useBusinessStore } from '../../../store';
import { appointmentService } from '../../../services/db';
import type { Service, Employee } from '../../../types';
import { format, addMinutes } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    services: Service[];
    staff: Employee[];
    initialDate?: Date;
    initialStaffId?: string;
}

export function NewAppointmentModal({ isOpen, onClose, services, staff, initialDate = new Date(), initialStaffId }: Props) {
    const { business } = useBusinessStore();
    const [loading, setLoading] = useState(false);

    // Form
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [employeeId, setEmployeeId] = useState(initialStaffId || '');

    // Time
    const [dateStr, setDateStr] = useState(format(initialDate, 'yyyy-MM-dd'));
    const [timeStr, setTimeStr] = useState(format(initialDate, 'HH:mm'));

    if (!isOpen || !business) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serviceId || !employeeId || !customerName) {
            toast.error('Мэдээллээ гүйцэд оруулна уу');
            return;
        }

        const selectedService = services.find(s => s.id === serviceId);
        const selectedStaff = staff.find(s => s.id === employeeId);

        if (!selectedService || !selectedStaff) return;

        // Parse start date
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        const startTime = new Date(year, month - 1, day, hours, minutes);
        const endTime = addMinutes(startTime, selectedService.durationMinutes);

        try {
            setLoading(true);
            await appointmentService.createAppointment(business.id, {
                customerId: null,
                customerName,
                customerPhone,
                serviceId,
                serviceName: selectedService.name,
                durationMinutes: selectedService.durationMinutes,
                employeeId,
                employeeName: selectedStaff.name || selectedStaff.email,
                startTime,
                endTime,
                status: 'scheduled',
                notes: '',
                totalPrice: selectedService.price,
                paymentStatus: 'unpaid'
            });

            toast.success('Цаг амжилттай бүртгэгдлээ');
            onClose();
        } catch (error) {
            toast.error('Алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Шинэ цаг захиалга</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">Үйлчлүүлэгч</label>
                            <input
                                className="input"
                                placeholder="Нэр"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label className="form-label">Утас</label>
                            <input
                                className="input"
                                placeholder="Утасны дугаар"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Scissors size={14} className="mr-sm" /> Үйлчилгээ</label>
                        <select className="input" value={serviceId} onChange={e => setServiceId(e.target.value)}>
                            <option value="">Сонгох...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} мин) - ₮{s.price.toLocaleString()}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><User size={14} className="mr-sm" /> Ажилтан</label>
                        <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                            <option value="">Сонгох...</option>
                            {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.name || s.email}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label"><Calendar size={14} className="mr-sm" /> Огноо</label>
                            <input
                                type="date"
                                className="input"
                                value={dateStr}
                                onChange={e => setDateStr(e.target.value)}
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label className="form-label"><Clock size={14} className="mr-sm" /> Цаг</label>
                            <input
                                type="time"
                                className="input"
                                value={timeStr}
                                onChange={e => setTimeStr(e.target.value)}
                            />
                        </div>
                    </div>
                </form>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} type="button">Цуцлах</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !serviceId || !employeeId || !customerName}>
                        {loading ? 'Хадгалж байна...' : 'Хадгалах'}
                    </button>
                </div>
            </div>
        </div>
    );
}
