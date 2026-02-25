import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { vehicleService, tripService } from '../../services/db';
import type { Vehicle, Trip } from '../../types';
import { Plus, Filter } from 'lucide-react';
import { format, addDays, startOfDay, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import './VehiclesPage.css';

const TIMELINE_DAYS = 14;

export function VehiclesPage() {
    const { business } = useBusinessStore();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(startOfDay(new Date()));

    // Generate timeline headers
    const timelineDates = Array.from({ length: TIMELINE_DAYS }).map((_, i) => addDays(startDate, i));

    useEffect(() => {
        if (!business?.id) return;
        setLoading(true);
        let unsnapVehicles: any;
        let unsnapTrips: any;

        const load = async () => {
            const endDate = addDays(startDate, TIMELINE_DAYS);

            unsnapVehicles = vehicleService.subscribeVehicles(business.id, (data) => {
                setVehicles(data as Vehicle[]);
            });

            unsnapTrips = tripService.subscribeTrips(business.id, startDate, endDate, (data) => {
                setTrips(data as Trip[]);
                setLoading(false);
            });
        };

        load();

        return () => {
            if (unsnapVehicles) unsnapVehicles();
            if (unsnapTrips) unsnapTrips();
        };
    }, [business?.id, startDate]);

    // Calculate position for the trip bar
    const getTripStyle = (trip: Trip) => {
        // Find start col
        let startDiff = differenceInDays(startOfDay(trip.startDate), startDate);
        let duration = differenceInDays(startOfDay(trip.endDate), startOfDay(trip.startDate)) + 1; // inclusive days

        // Handle trips starting before our timeline view
        if (startDiff < 0) {
            duration += startDiff; // reduce duration
            startDiff = 0;
        }

        // Handle trips ending after our timeline view
        if (startDiff + duration > TIMELINE_DAYS) {
            duration = TIMELINE_DAYS - startDiff;
        }

        if (duration <= 0) return { display: 'none' };

        // We use grid columns: Col 1 is info, Col 2 is Day 0. So Day N starts at grid-column: startDiff + 2
        return {
            gridColumnStart: startDiff + 2,
            gridColumnEnd: startDiff + 2 + duration,
        };
    };

    if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Мэдээлэл уншиж байна...</div>;

    return (
        <div className="page-container vehicles-page animate-fade-in">
            <Header
                title="Техник, Тээврийн хэрэгсэл"
                subtitle="Түрээс болон Аяллын хяналт"
                action={{
                    label: "Захиалга үүсгэх",
                    onClick: () => toast('Шинэ түрээс үүсгэх (Удахгүй)')
                }}
            />

            <div className="vehicles-toolbar">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={() => setStartDate(addDays(startDate, -7))}>&lt; Өмнөх долоо хоног</button>
                    <span style={{ fontWeight: 600 }}>
                        {format(startDate, 'yyyy.MM.dd')} - {format(addDays(startDate, TIMELINE_DAYS - 1), 'yyyy.MM.dd')}
                    </span>
                    <button className="btn btn-outline" onClick={() => setStartDate(addDays(startDate, 7))}>Дараагийн долоо хоног &gt;</button>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline" title="Шүүлтүүр">
                        <Filter size={16} />
                    </button>
                    <button className="btn btn-secondary" onClick={() => toast('Машин бүртгэх')}>
                        <Plus size={16} className="mr-sm" /> Машин бүртгэх
                    </button>
                </div>
            </div>

            <div className="timeline-container">
                <div className="timeline-grid" style={{ gridTemplateRows: `50px repeat(${vehicles.length}, minmax(60px, auto))` }}>

                    {/* Header Row */}
                    <div className="timeline-header-cell sticky-col" style={{ gridColumn: 1, gridRow: 1 }}>
                        Машин / Техник
                    </div>
                    {timelineDates.map((date, i) => (
                        <div key={i} className="timeline-header-cell" style={{ gridColumn: i + 2, gridRow: 1 }}>
                            <div>{format(date, 'MMM')}</div>
                            <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{format(date, 'dd')}</div>
                        </div>
                    ))}

                    {/* Data Rows */}
                    {vehicles.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Машин бүртгээгүй байна.
                        </div>
                    )}

                    {vehicles.map((vehicle, vIndex) => {
                        const rowNum = vIndex + 2; // Row 1 is header
                        const vehicleTrips = trips.filter(t => t.vehicleId === vehicle.id);

                        return (
                            <div key={vehicle.id} style={{ display: 'contents' }}>
                                {/* Sticky Info Column */}
                                <div className="timeline-row-cell sticky-col" style={{ gridColumn: 1, gridRow: rowNum }}>
                                    <div className="vehicle-name">
                                        <span className={`status-dot ${vehicle.status}`}></span>
                                        {vehicle.make} {vehicle.model}
                                    </div>
                                    <div className="vehicle-meta">{vehicle.plateNumber} • {vehicle.category}</div>
                                </div>

                                {/* Matrix Background Cells */}
                                {timelineDates.map((_, i) => (
                                    <div key={i} className="timeline-row-cell" style={{ gridColumn: i + 2, gridRow: rowNum }}>
                                        {/* Empty cell for border/bg layout */}
                                    </div>
                                ))}

                                {/* Overlay Trips */}
                                {vehicleTrips.map(trip => (
                                    <div
                                        key={trip.id}
                                        className={`trip-bar ${trip.status}`}
                                        style={{ ...getTripStyle(trip), gridRow: rowNum }}
                                        onClick={() => toast(`Захиалагч: ${trip.customerName}\nУтас: ${trip.customerPhone}`)}
                                    >
                                        {trip.customerName}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
