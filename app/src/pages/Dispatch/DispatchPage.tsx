import { useState, useEffect, useMemo } from 'react';
import { Header } from '../../components/layout/Header';
import { HubLayout } from '../../components/common/HubLayout';
import { useBusinessStore } from '../../store';
import { deliveryService, vehicleService } from '../../services/db';
import type { DeliveryRecord, Vehicle } from '../../types';
import { Truck, Map as MapIcon, Navigation, Radio, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Dispatch.css';

export function DispatchPage() {
    const { business } = useBusinessStore();
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        if (!business?.id) return;
        const unsubDeliveries = deliveryService.subscribeDeliveries(business.id, (data) => setDeliveries(data));
        const unsubVehicles = vehicleService.subscribeVehicles(business.id, (data) => setVehicles(data));

        return () => { unsubDeliveries(); unsubVehicles(); };
    }, [business?.id]);

    const pendingOrders = useMemo(() => deliveries.filter(d => d.status === 'pending'), [deliveries]);
    const inTransitOrders = useMemo(() => deliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up'), [deliveries]);
    const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'available'), [vehicles]);

    const handleAssign = (order: DeliveryRecord, vehicle: Vehicle) => {
        toast.promise(
            deliveryService.assignDriver(business!.id, order.id, vehicle.id, vehicle.plateNumber),
            {
                loading: 'Оноож байна...',
                success: `${vehicle.plateNumber} техникт оноолоо`,
                error: 'Алдаа гарлаа'
            }
        );
    };

    return (
        <HubLayout hubId="logistics-hub">
            <Header
                title="Диспетчерын хяналт"
                subtitle="Хүргэлтийн захиалгыг жолооч, техникт бодит хугацаанд хувиарлах"
                action={{
                    label: "Live Map",
                    onClick: () => toast('Газрын зураг идэвхжиж байна...')
                }}
            />

            <div className="dispatch-dashboard grid-12">
                {/* Column 1: Incoming Orders */}
                <div className="col-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                            <Radio size={14} className="text-danger animate-pulse" /> Шинэ захиалгууд ({pendingOrders.length})
                        </h3>
                    </div>
                    <div className="orders-panel flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {pendingOrders.length === 0 ? (
                            <div className="card p-8 text-center text-muted border-dashed">Шинэ захиалга байхгүй</div>
                        ) : (
                            pendingOrders.map(order => (
                                <div key={order.id} className="card p-4 hover-lift shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold">ORD-{order.orderNumber}</span>
                                        <span className={`badge ${order.priority === 'urgent' ? 'badge-danger' : 'badge-preparing'}`}>
                                            {order.priority === 'urgent' ? 'Яаралтай' : 'Энгийн'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted mb-3 flex items-center gap-2">
                                        <Navigation size={12} /> Сүхбаатар дүүрэг...
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="input input-sm flex-1"
                                            onChange={(e) => {
                                                const v = vehicles.find(v => v.id === e.target.value);
                                                if (v) handleAssign(order, v);
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Жолооч оноох</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Column 2: Active Dispatch & Map */}
                <div className="col-8 flex flex-col gap-6">
                    <div className="dispatch-map card" style={{ height: '300px', background: 'var(--surface-2)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="text-center text-muted">
                            <MapIcon size={48} className="mb-4 opacity-20" />
                            <p>Бодит хугацааны хяналтын зураг</p>
                            <div className="flex gap-8 mt-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-primary">{availableVehicles.length}</div>
                                    <div className="text-xs">Замд байна</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-success">{inTransitOrders.length}</div>
                                    <div className="text-xs">Түгээж буй</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="active-deliveries">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-4 px-2">Замд байгаа аялалууд</h3>
                        <div className="grid-2 gap-4">
                            {inTransitOrders.length === 0 ? (
                                <div className="card col-span-2 p-8 text-center text-muted">Одоогоор замд аялал байхгүй баүүна.</div>
                            ) : (
                                inTransitOrders.map(order => (
                                    <div key={order.id} className="card p-4 flex gap-4 items-center border-l-4 border-l-success">
                                        <div className="icon-wrap bg-success-light p-3 rounded-full">
                                            <Truck size={20} className="text-success" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold">ORD-{order.orderNumber}</div>
                                            <div className="text-xs text-muted flex items-center gap-1">
                                                <User size={10} /> {order.driverName || 'Тодорхойгүй'} • {order.status}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <button className="btn btn-ghost btn-sm" onClick={() => toast('Байршил харах')}><Navigation size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HubLayout>
    );
}
