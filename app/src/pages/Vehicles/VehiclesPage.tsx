import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { vehicleService, tripService, maintenanceService } from '../../services/db';
import type { Vehicle, Trip, VehicleMaintenanceLog } from '../../types';
import { Plus, Filter, Calendar, List, Wrench, Clock } from 'lucide-react';
import { format, addDays, startOfDay, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { HubLayout } from '../../components/common/HubLayout';
import './VehiclesPage.css';

const TIMELINE_DAYS = 14;

export function VehiclesPage() {
    const { business } = useBusinessStore();
    const [view, setView] = useState<'timeline' | 'list' | 'maintenance'>('timeline');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [maintLogs, setMaintLogs] = useState<VehicleMaintenanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(startOfDay(new Date()));
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const timelineDates = Array.from({ length: TIMELINE_DAYS }).map((_, i) => addDays(startDate, i));

    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapVehicles: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapTrips: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapMaint: any;

        const load = async () => {
            const endDate = addDays(startDate, TIMELINE_DAYS);

            unsnapVehicles = vehicleService.subscribeVehicles(business.id, (data) => {
                setVehicles(data as Vehicle[]);
                if (data.length > 0 && !selectedVehicleId) setSelectedVehicleId(data[0].id);
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
            if (unsnapMaint) unsnapMaint();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id, startDate]);

    useEffect(() => {
        if (!business?.id || !selectedVehicleId || view !== 'maintenance') return;
        const unsub = maintenanceService.subscribeLogs(business.id, selectedVehicleId, (data) => {
            setMaintLogs(data);
        });
        return () => unsub();
    }, [business?.id, selectedVehicleId, view]);

    const getTripStyle = (trip: Trip) => {
        let startDiff = differenceInDays(startOfDay(trip.startDate), startDate);
        let duration = differenceInDays(startOfDay(trip.endDate), startOfDay(trip.startDate)) + 1;
        if (startDiff < 0) { duration += startDiff; startDiff = 0; }
        if (startDiff + duration > TIMELINE_DAYS) { duration = TIMELINE_DAYS - startDiff; }
        if (duration <= 0) return { display: 'none' };
        return { gridColumnStart: startDiff + 2, gridColumnEnd: startDiff + 2 + duration };
    };

    const renderTimeline = () => (
        <div className="timeline-container stagger-children">
            <div className="vehicles-toolbar">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setStartDate(addDays(startDate, -7))}>&lt; Өмнөх</button>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {format(startDate, 'yyyy.MM.dd')} - {format(addDays(startDate, TIMELINE_DAYS - 1), 'yyyy.MM.dd')}
                    </span>
                    <button className="btn btn-outline btn-sm" onClick={() => setStartDate(addDays(startDate, 7))}>Дараагийн &gt;</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-outline btn-sm"><Filter size={14} /> Шүүлтүүр</button>
                </div>
            </div>

            <div className="timeline-grid-wrapper card">
                <div className="timeline-grid" style={{ gridTemplateRows: `50px repeat(${vehicles.length}, minmax(60px, auto))` }}>
                    <div className="timeline-header-cell sticky-col" style={{ gridColumn: 1, gridRow: 1 }}>Машин / Техник</div>
                    {timelineDates.map((date, i) => (
                        <div key={i} className="timeline-header-cell" style={{ gridColumn: i + 2, gridRow: 1 }}>
                            <div className="text-xs">{format(date, 'MMM')}</div>
                            <div className="text-lg font-bold">{format(date, 'dd')}</div>
                        </div>
                    ))}

                    {vehicles.map((vehicle, vIndex) => {
                        const rowNum = vIndex + 2;
                        const vehicleTrips = trips.filter(t => t.vehicleId === vehicle.id);
                        return (
                            <div key={vehicle.id} style={{ display: 'contents' }}>
                                <div className="timeline-row-cell sticky-col" style={{ gridColumn: 1, gridRow: rowNum }}>
                                    <div className="vehicle-info-mini">
                                        <div className="font-bold">{vehicle.make} {vehicle.model}</div>
                                        <div className="text-xs text-muted">{vehicle.plateNumber}</div>
                                    </div>
                                </div>
                                {timelineDates.map((_, i) => (
                                    <div key={i} className="timeline-row-cell" style={{ gridColumn: i + 2, gridRow: rowNum }}></div>
                                ))}
                                {vehicleTrips.map(trip => (
                                    <div
                                        key={trip.id}
                                        className={`trip-bar ${trip.status}`}
                                        style={{ ...getTripStyle(trip), gridRow: rowNum }}
                                        onClick={() => toast(`Захиалагч: ${trip.customerName}`)}
                                    >
                                        <span className="text-xs truncate">{trip.customerName}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderMaintenance = () => (
        <div className="maintenance-view grid-list" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
            <div className="vehicle-selector flex flex-col gap-2">
                <h4 className="text-sm font-bold text-muted uppercase mb-2">Техник сонгох</h4>
                {vehicles.map(v => (
                    <div
                        key={v.id}
                        className={`card p-3 cursor-pointer hover-lift ${selectedVehicleId === v.id ? 'border-primary bg-primary-light' : ''}`}
                        onClick={() => setSelectedVehicleId(v.id)}
                        style={{ border: selectedVehicleId === v.id ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}
                    >
                        <div className="font-bold">{v.make} {v.model}</div>
                        <div className="text-xs text-muted">{v.plateNumber}</div>
                    </div>
                ))}
            </div>
            <div className="maint-content card p-0">
                <div className="p-4 border-b flex justify-between items-center bg-surface-2">
                    <h3 className="m-0 text-lg">Засвар үйлчилгээний түүх</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => toast('Шинэ бүртгэл')}>
                        <Plus size={14} /> Бүртгэл нэмэх
                    </button>
                </div>
                <div className="maint-list">
                    {maintLogs.length === 0 ? (
                        <div className="p-12 text-center text-muted">Түүх байхгүй байна.</div>
                    ) : (
                        maintLogs.map(log => (
                            <div key={log.id} className="p-4 border-b flex justify-between hover-bg">
                                <div className="flex gap-4">
                                    <div className="icon-box bg-surface-2" style={{ padding: '10px', borderRadius: '10px' }}>
                                        <Wrench size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-bold">{log.description}</div>
                                        <div className="text-xs text-muted flex gap-2">
                                            <Calendar size={12} /> {format(new Date(log.date), 'yyyy.MM.dd')}
                                            <Clock size={12} /> {log.mileageAtService} км
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-success">₮{log.cost?.toLocaleString()}</div>
                                    <div className={`badge badge-sm ${log.status === 'completed' ? 'badge-success' : 'badge-preparing'}`}>
                                        {log.status === 'completed' ? 'Дууссан' : 'Төлөвлөсөн'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Техник & Тээвэр"
                subtitle="Парк ашиглалт, түрээс болон засвар үйлчилгээний хяналт"
                action={{
                    label: "Шинэ техник нэмэх",
                    onClick: () => toast('Шинэ техник бүртгэх')
                }}
            />

            <div className="view-switcher flex gap-4 mb-6 border-b pb-2">
                <button
                    className={`btn-tab ${view === 'timeline' ? 'active' : ''}`}
                    onClick={() => setView('timeline')}
                >
                    <Calendar size={16} /> Календарь
                </button>
                <button
                    className={`btn-tab ${view === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setView('maintenance')}
                >
                    <Wrench size={16} /> Засвар үйлчилгээ
                </button>
                <button
                    className={`btn-tab ${view === 'list' ? 'active' : ''}`}
                    onClick={() => setView('list')}
                >
                    <List size={16} /> Бүх техник
                </button>
            </div>

            <div className="page-content">
                {loading ? (
                    <div className="text-center p-12 text-muted">Ачаалж байна...</div>
                ) : (
                    <>
                        {view === 'timeline' && renderTimeline()}
                        {view === 'maintenance' && renderMaintenance()}
                        {view === 'list' && (
                            <div className="card text-center p-12 text-muted">Жагсаалт харагдац удахгүй...</div>
                        )}
                    </>
                )}
            </div>
        </HubLayout>
    );
}
