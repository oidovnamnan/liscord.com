import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore, useAuthStore } from '../../store';
import { attendanceService } from '../../services/db';
import type { Attendance } from '../../types';
import { Play, LogIn, LogOut, Coffee, Calendar, Search } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { format, differenceInMinutes } from 'date-fns';
import { mn } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import './AttendancePage.css';

export function AttendancePage() {
    const { business, employee } = useBusinessStore();
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayRecords, setTodayRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    const EMP_ID = employee?.id || user?.uid || 'guest';
    const EMP_NAME = employee?.name || user?.displayName || 'Зочин';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);

        const yyyy = currentTime.getFullYear();
        const mm = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dd = String(currentTime.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;

        const unsnap = attendanceService.subscribeDailyAttendance(business.id, dateString, (data) => {
            setTodayRecords(data as Attendance[]);
            setLoading(false);
        });

        return () => { unsnap(); };
        // Only re-run when actual day changes, but simplistic approach is fine here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id]);

    const myRecord = todayRecords.find(r => r.employeeId === EMP_ID);
    const isClockedIn = !!myRecord?.clockInTime && !myRecord?.clockOutTime;
    const isOnBreak = !!myRecord?.breakStartTime && !myRecord?.breakEndTime;

    const handleClockIn = async () => {
        if (!business?.id) return;
        try {
            await attendanceService.clockIn(business.id, EMP_ID, EMP_NAME);
            toast.success('Ажилд ирснээр бүртгэгдлээ');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleClockOut = async () => {
        if (!business?.id || !myRecord) return;
        try {
            // Calculate basic total minutes (ignores break deduction for this demo)
            const totalMins = differenceInMinutes(new Date(), myRecord.clockInTime as Date);
            await attendanceService.clockOut(business.id, myRecord.id, totalMins);
            toast.success('Ажлаас бууснаар бүртгэгдлээ');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const handleBreakToggle = async () => {
        if (!business?.id || !myRecord) return;
        try {
            if (isOnBreak) {
                await attendanceService.endBreak(business.id, myRecord.id);
                toast.success('Завсарлага дууслаа');
            } else {
                await attendanceService.startBreak(business.id, myRecord.id);
                toast.success('Завсарлага эхэллээ');
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            toast.error('Алдаа гарлаа');
        }
    };

    const formatTimeObj = (time: Date | null) => {
        if (!time) return '--:--';
        return format(time, 'HH:mm');
    };

    if (loading) return <div className="page-container flex-center">Цаг бүртгэл уншиж байна...</div>;

    return (
        <HubLayout hubId="staff-hub">
            <div className="page-container attendance-page animate-fade-in">
                <Header
                    title="Цаг бүртгэл & Хүний нөөц"
                    subtitle="Ажилчдын ирц, цагийн хуваарь"
                    action={{
                        label: "Тайлан татах",
                        onClick: () => toast('Тайлан Excel үүсгэх (Удахгүй)')
                    }}
                />

                <div className="attendance-toolbar">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <Calendar size={18} /> Өнөөдөр: {format(currentTime, 'yyyy оны MM сарын dd', { locale: mn })}
                    </div>

                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
                        <input type="text" placeholder="Ажилтан хайх..." className="search-input" />
                    </div>
                </div>

                <div className="attendance-board">
                    <div className="clock-panel">
                        <div className="live-clock-date">{format(currentTime, 'EEEE', { locale: mn }).toUpperCase()}</div>
                        <div className="live-clock-time">{format(currentTime, 'HH:mm:ss')}</div>

                        <div className="clock-actions">
                            {!myRecord && (
                                <button className="clock-btn in" onClick={handleClockIn}>
                                    <LogIn size={20} /> Ажилд ирэх
                                </button>
                            )}

                            {isClockedIn && (
                                <>
                                    <button className={`clock-btn ${isOnBreak ? 'in' : 'break'}`} onClick={handleBreakToggle}>
                                        {isOnBreak ? <Play size={20} /> : <Coffee size={20} />}
                                        {isOnBreak ? 'Ажилдаа Орох' : 'Завсарлах'}
                                    </button>
                                    {!isOnBreak && (
                                        <button className="clock-btn out" onClick={handleClockOut}>
                                            <LogOut size={20} /> Буух
                                        </button>
                                    )}
                                </>
                            )}

                            {myRecord?.clockOutTime && (
                                <div style={{ color: 'var(--success)', fontWeight: 700, padding: '16px' }}>
                                    Өнөөдрийн цаг бүртгэгдсэн байна. ({Math.floor(myRecord.totalWorkedMinutes / 60)}ц {myRecord.totalWorkedMinutes % 60}м)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="attendance-table-container">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th>Ажилтан</th>
                                    <th>Ирсэн цаг</th>
                                    <th>Завсарлага</th>
                                    <th>Буусан цаг</th>
                                    <th>Нийт ажилласан</th>
                                    <th>Төлөв</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            Өнөөдөр ажилд ирсэн хүн бүртгэгдээгүй байна.
                                        </td>
                                    </tr>
                                )}
                                {todayRecords.map(record => {
                                    const active = !!record.clockInTime && !record.clockOutTime;
                                    const onBreak = !!record.breakStartTime && !record.breakEndTime;

                                    return (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {record.employeeName}
                                                {record.employeeId === EMP_ID && <span style={{ marginLeft: '8px', fontSize: '11px', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px' }}>ТАНЫ БҮРТГЭЛ</span>}
                                            </td>
                                            <td><span className="time-badge active">{formatTimeObj(record.clockInTime)}</span></td>
                                            <td>
                                                <span className="time-badge" style={{ color: onBreak ? 'var(--warning)' : 'inherit' }}>
                                                    {formatTimeObj(record.breakStartTime)} {record.breakEndTime && `- ${formatTimeObj(record.breakEndTime)}`}
                                                </span>
                                            </td>
                                            <td><span className="time-badge">{formatTimeObj(record.clockOutTime)}</span></td>
                                            <td>
                                                {record.clockOutTime
                                                    ? `${Math.floor(record.totalWorkedMinutes / 60)}ц ${record.totalWorkedMinutes % 60}м`
                                                    : '--'}
                                            </td>
                                            <td>
                                                {active ? (
                                                    <span style={{ color: onBreak ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontSize: '13px' }}>
                                                        {onBreak ? 'Завсарласан' : 'Ажиллаж байна'}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>
                                                        Буусан
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
