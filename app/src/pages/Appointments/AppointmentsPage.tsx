import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { appointmentService, serviceCatalogService, businessService } from '../../services/db';
import type { Appointment, Service, Employee } from '../../types';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, subDays, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { toast } from 'react-hot-toast';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { HubLayout } from '../../components/common/HubLayout';
import './AppointmentsPage.css';

// Settings Helpers
const START_HOUR = 9;
const END_HOUR = 20; // Will be dynamic based on business.settings.workHours eventually
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_INTERVAL_MINS = 30; // 30-min clickable slots

export function AppointmentsPage() {
    const { business } = useBusinessStore();
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedStaff, setSelectedStaff] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialDate, setModalInitialDate] = useState<Date>(new Date());
    const [modalInitialStaff, setModalInitialStaff] = useState<string>('');

    const handleOpenModal = (date: Date = new Date(), staffId: string = '') => {
        setModalInitialDate(date);
        setModalInitialStaff(staffId);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (!business?.id) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsnaps: any[] = [];

        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Staff for columns
                const employees = await businessService.getEmployees(business.id);
                // In a real salon, you'd filter by role like 'stylist' or 'doctor', keeping it simple for now
                setStaff(employees.filter(e => e.status === 'active'));

                // Services
                unsnaps.push(serviceCatalogService.subscribeServices(business.id, (data) => {
                    setServices(data as Service[]);
                }));

                // Appointments for the selected day
                const sd = startOfDay(viewDate);
                const ed = endOfDay(viewDate);
                unsnaps.push(appointmentService.subscribeAppointments(business.id, sd, ed, (data) => {
                    setAppointments(data as Appointment[]);
                }));
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_err) {
                toast.error('Мэдээлэл татахад алдаа гарлаа');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
        return () => { unsnaps.forEach(u => u && u()) };
    }, [business?.id, viewDate]);

    // Navigation
    const handleNextDay = () => setViewDate(addDays(viewDate, 1));
    const handlePrevDay = () => setViewDate(subDays(viewDate, 1));
    const handleToday = () => setViewDate(new Date());

    // Grid Utility
    const timeLabels = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
        const h = START_HOUR + i;
        return `${h.toString().padStart(2, '0')}:00`;
    });

    // Calculate Y position and height for an appointment block
    const getBlockStyle = (startTime: Date, durationMinutes: number) => {
        const start = startTime.getHours() * 60 + startTime.getMinutes();
        const gridStart = START_HOUR * 60;

        // Ensure within bounds
        const offsetMins = Math.max(0, start - gridStart);

        // 60px per hour = 1px per minute
        const topPx = offsetMins;
        const heightPx = Math.max(30, durationMinutes); // min 30px height

        return { top: `${topPx}px`, height: `${heightPx}px` };
    };

    if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Уншиж байна...</div>;

    const visibleStaff = selectedStaff === 'all' ? staff : staff.filter(s => s.id === selectedStaff);

    return (
        <HubLayout hubId="industry-hub">
            <div className="page-container appointments-page animate-fade-in">
                <Header
                    title="Цаг захиалга"
                    subtitle="Календарь болон цагийн хуваарь удирдах"
                    action={{
                        label: "Цаг бүртгэх",
                        onClick: () => handleOpenModal(viewDate, selectedStaff !== 'all' ? selectedStaff : '')
                    }}
                />

                <div className="page-content" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="calendar-container">

                        {/* Header Controls */}
                        <div className="calendar-header">
                            <div className="calendar-navigation">
                                <button className="btn btn-icon btn-secondary" onClick={handlePrevDay}>
                                    <ChevronLeft size={20} />
                                </button>
                                <button className="btn btn-secondary" onClick={handleToday}>Өнөөдөр</button>
                                <button className="btn btn-icon btn-secondary" onClick={handleNextDay}>
                                    <ChevronRight size={20} />
                                </button>
                                <div className="calendar-title">
                                    {format(viewDate, 'yyyy оны MM-р сарын dd')}
                                </div>
                            </div>

                            <div className="calendar-filters" style={{ display: 'flex', gap: '8px' }}>
                                <select className="input input-sm" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                                    <option value="all">Бүх үйлчилгээ</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <select className="input input-sm" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                                    <option value="all">Бүх ажилтан</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                                </select>
                                <div className="calendar-view-toggles hide-mobile">
                                    <button className="calendar-view-btn active">Өдөр</button>
                                    <button className="calendar-view-btn">7 хоног</button>
                                    <button className="calendar-view-btn">Сар</button>
                                </div>
                            </div>
                        </div>

                        {/* Main Grid View */}
                        <div className="calendar-grid">

                            {/* Time Axis (Y) */}
                            <div className="calendar-time-axis">
                                <div className="staff-header" style={{ borderBottom: 'none' }}>
                                    <Clock size={16} />
                                </div>
                                {timeLabels.slice(0, -1).map(time => (
                                    <div key={time} className="time-slot-label">
                                        {time}
                                    </div>
                                ))}
                            </div>

                            {/* Staff Columns (X) */}
                            <div className="calendar-staff-columns">
                                {visibleStaff.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>
                                        Ажилтан одоогоор бүртгэгдээгүй байна. <br />Тохиргоо руу орж ажилтан нэмнэ үү.
                                    </div>
                                ) : (
                                    visibleStaff.map(emp => {
                                        const empAppointments = appointments.filter(a => a.employeeId === emp.id && (selectedService === 'all' || a.serviceId === selectedService));

                                        return (
                                            <div key={emp.id} className="staff-column">
                                                {/* Column Header */}
                                                <div className="staff-header">
                                                    <div className="staff-avatar">{emp.name?.charAt(0) || '?'}</div>
                                                    <span className="text-truncate">{emp.name || emp.email}</span>
                                                </div>

                                                {/* Grid background lines */}
                                                <div className="time-grid-lines">
                                                    {timeLabels.slice(0, -1).map(time => (
                                                        <div key={time} className="grid-line" />
                                                    ))}
                                                </div>

                                                {/* Clickable slot layer */}
                                                <div className="slot-interaction-layer">
                                                    {/* Calculate number of 30min slots */}
                                                    {Array.from({ length: TOTAL_HOURS * 2 }).map((_, idx) => {
                                                        const slotTime = addMinutes(startOfDay(viewDate), START_HOUR * 60 + (idx * SLOT_INTERVAL_MINS));
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="interactive-slot"
                                                                onClick={() => handleOpenModal(slotTime, emp.id)}
                                                                title={`${format(slotTime, 'HH:mm')} - Цаг нэмэх`}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                {/* Render Appointments */}
                                                {empAppointments.map(app => {
                                                    const service = services.find(s => s.id === app.serviceId);
                                                    const bg = service?.color || 'var(--primary)';

                                                    return (
                                                        <div
                                                            key={app.id}
                                                            className="appointment-block"
                                                            style={{
                                                                ...getBlockStyle(app.startTime, app.durationMinutes),
                                                                backgroundColor: bg
                                                            }}
                                                            onClick={() => toast(`Үзэх: ${app.customerName}`)}
                                                        >
                                                            <div className="appointment-time">
                                                                {format(app.startTime, 'HH:mm')} - {format(app.endTime, 'HH:mm')}
                                                            </div>
                                                            <div className="appointment-title">{app.serviceName}</div>
                                                            <div className="appointment-subtitle">{app.customerName}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                <NewAppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    services={services}
                    staff={staff}
                    initialDate={modalInitialDate}
                    initialStaffId={modalInitialStaff}
                />
            </div>
        </HubLayout>
    );
}
