import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { roomService, bookingService } from '../../services/db';
import type { Room, Booking } from '../../types';
import { Plus, Users, BedDouble, Calendar as CalendarIcon, Clock, Brush } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './RoomsPage.css';

export function RoomsPage() {
    const { business } = useBusinessStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapRooms: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapBookings: any;

        const load = async () => {
            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());

            unsnapRooms = roomService.subscribeRooms(business.id, (data) => {
                setRooms(data as Room[]);
            });

            unsnapBookings = bookingService.subscribeBookings(business.id, todayStart, todayEnd, (data) => {
                setTodayBookings(data as Booking[]);
                setLoading(false);
            });
        };

        load();

        return () => {
            if (unsnapRooms) unsnapRooms();
            if (unsnapBookings) unsnapBookings();
        };
    }, [business?.id]);

    const getRoomBooking = (roomId: string) => {
        return todayBookings.find(b => b.roomId === roomId && (b.status === 'checked_in' || b.status === 'reserved'));
    };

    if (loading) return <div className="page-container flex-center">Өрөөнүүд уншиж байна...</div>;

    const stats = {
        available: rooms.filter(r => r.status === 'available').length,
        occupied: rooms.filter(r => r.status === 'occupied').length,
        cleaning: rooms.filter(r => r.status === 'cleaning').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
    };

    return (
        <HubLayout hubId="services-hub">
            <div className="page-container rooms-page animate-fade-in">
                <Header
                    title="Өрөө / Талбайн удирдлага"
                    subtitle="Өрөөний сан болон захиалгын хяналт"
                    action={{
                        label: "Захиалга үүсгэх",
                        onClick: () => toast('Шинэ захиалга бүртгэх (Удахгүй)')
                    }}
                />

                <div className="rooms-toolbar">
                    <div className="room-stats">
                        <div className="stat-item">
                            <div className="stat-dot available"></div>
                            <span>Сул ({stats.available})</span>
                        </div>
                        <div className="stat-item">
                            <div className="stat-dot occupied"></div>
                            <span>Хүнтэй ({stats.occupied})</span>
                        </div>
                        <div className="stat-item">
                            <div className="stat-dot cleaning"></div>
                            <span>Цэвэрлэгээ ({stats.cleaning})</span>
                        </div>
                        <div className="stat-item">
                            <div className="stat-dot maintenance"></div>
                            <span>Засвартай ({stats.maintenance})</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-secondary" onClick={() => toast('Өрөө нэмэх үйлдэл')}>
                            <Plus size={16} className="mr-sm" /> Өрөө нэмэх
                        </button>
                        <button className="btn btn-outline" title="Түүх харах">
                            <CalendarIcon size={16} />
                        </button>
                    </div>
                </div>

                {rooms.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Шинээр өрөө эсвэл талбай үүсгэнэ үү.
                    </div>
                ) : (
                    <div className="room-grid">
                        {rooms.map(room => {
                            const activeBooking = getRoomBooking(room.id);

                            return (
                                <div
                                    key={room.id}
                                    className="room-card"
                                    onClick={() => toast(`${room.name} дэлгэрэнгүй`)}
                                >
                                    <div className={`room-status-bar ${room.status}`}></div>

                                    <div className="room-card-header">
                                        <div className="room-name">{room.name}</div>
                                        <div className="room-type">{room.type}</div>
                                    </div>

                                    <div className="room-details">
                                        <div className="room-detail-row">
                                            <Users size={14} />
                                            <span>Хүчин чадал: {room.capacity} хүн</span>
                                        </div>
                                        <div className="room-detail-row">
                                            <BedDouble size={14} />
                                            <span>₮{room.pricePerNight.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {activeBooking && room.status === 'occupied' && (
                                        <div className="active-booking">
                                            <div className="active-booking-name">{activeBooking.customerName}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <Clock size={12} />
                                                {format(activeBooking.checkOutTime, 'HH:mm')} хүртэл
                                            </div>
                                        </div>
                                    )}

                                    {!activeBooking && room.status === 'cleaning' && (
                                        <div className="active-booking" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Brush size={14} /> Цэвэрлэгч дуудсан
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
