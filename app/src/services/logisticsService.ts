import {
    collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp, writeBatch, increment
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    Vehicle, Trip, DeliveryRecord, FleetLog, VehicleMaintenanceLog, ImportCostCalculation
} from '../types';
import { convertTimestamps } from './helpers';

// ============ VEHICLES & TRIPS SERVICES ============

export const vehicleService = {
    subscribeVehicles(bizId: string, callback: (vehicles: Vehicle[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'vehicles'),
            where('isDeleted', '==', false),
            orderBy('make', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Vehicle)));
        });
    },

    async createVehicle(bizId: string, data: Partial<Vehicle>) {
        const newRef = doc(collection(db, 'businesses', bizId, 'vehicles'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'available',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateVehicle(bizId: string, vehicleId: string, data: Partial<Vehicle>) {
        await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicleId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteVehicle(bizId: string, vehicleId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicleId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

export const tripService = {
    subscribeTrips(bizId: string, startDate: Date, endDate: Date, callback: (trips: Trip[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'trips'),
            where('isDeleted', '==', false),
            where('startDate', '>=', startDate),
            where('startDate', '<=', endDate),
            orderBy('startDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as Trip)));
        });
    },

    async createTrip(bizId: string, data: Partial<Trip>) {
        const newRef = doc(collection(db, 'businesses', bizId, 'trips'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: data.status || 'reserved',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (data.status === 'active' && data.vehicleId) {
            await updateDoc(doc(db, 'businesses', bizId, 'vehicles', data.vehicleId), { status: 'rented' });
        }

        return newRef.id;
    },

    async updateTrip(bizId: string, tripId: string, data: Partial<Trip>) {
        await updateDoc(doc(db, 'businesses', bizId, 'trips', tripId), {
            ...data,
            updatedAt: serverTimestamp()
        });

        if (data.status === 'completed' || data.status === 'cancelled') {
            const tripRef = await getDoc(doc(db, 'businesses', bizId, 'trips', tripId));
            if (tripRef.exists()) {
                const vehicle = tripRef.data().vehicleId;
                await updateDoc(doc(db, 'businesses', bizId, 'vehicles', vehicle), { status: 'available' });
            }
        }
    }
};

// ============ LOGISTICS HUB SERVICES ============

export const deliveryService = {
    subscribeDeliveries(bizId: string, callback: (deliveries: DeliveryRecord[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'deliveries'),
            where('isDeleted', '==', false),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as DeliveryRecord)));
        });
    },

    async createDelivery(bizId: string, data: Partial<DeliveryRecord>) {
        const newRef = doc(collection(db, 'businesses', bizId, 'deliveries'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: data.status || 'pending',
            history: [{ status: data.status || 'pending', at: new Date(), note: 'Үүсгэсэн' }],
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    async updateStatus(bizId: string, deliveryId: string, status: DeliveryRecord['status'], note?: string) {
        const docRef = doc(db, 'businesses', bizId, 'deliveries', deliveryId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;

        const current = snap.data() as DeliveryRecord;
        const history = [...(current.history || []), { status, at: new Date(), note }];

        await updateDoc(docRef, {
            status,
            history,
            updatedAt: serverTimestamp()
        });
    },

    async assignDriver(bizId: string, deliveryId: string, driverId: string, driverName: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'deliveries', deliveryId), {
            driverId,
            driverName,
            status: 'picked_up',
            updatedAt: serverTimestamp()
        });
    }
};

export const fleetService = {
    subscribeLogs(bizId: string, vehicleId: string, callback: (logs: FleetLog[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'fleetLogs'),
            where('vehicleId', '==', vehicleId),
            orderBy('date', 'desc'),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as FleetLog)));
        });
    },

    async addLog(bizId: string, data: Partial<FleetLog>) {
        await addDoc(collection(db, 'businesses', bizId, 'fleetLogs'), {
            ...data,
            createdAt: serverTimestamp()
        });
    }
};

export const maintenanceService = {
    subscribeLogs(bizId: string, vehicleId: string, callback: (logs: VehicleMaintenanceLog[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'maintenanceLogs'),
            where('vehicleId', '==', vehicleId),
            orderBy('date', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as VehicleMaintenanceLog)));
        });
    },

    async addLog(bizId: string, data: Partial<VehicleMaintenanceLog>) {
        await addDoc(collection(db, 'businesses', bizId, 'maintenanceLogs'), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (data.status === 'scheduled') {
            await updateDoc(doc(db, 'businesses', bizId, 'vehicles', data.vehicleId!), { status: 'maintenance' });
        }
    }
};

export const importCostService = {
    subscribeCalculations(bizId: string, callback: (calcs: ImportCostCalculation[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'importCosts'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() } as ImportCostCalculation)));
        });
    },

    async saveCalculation(bizId: string, data: Partial<ImportCostCalculation>) {
        const ref = data.id
            ? doc(db, 'businesses', bizId, 'importCosts', data.id)
            : doc(collection(db, 'businesses', bizId, 'importCosts'));

        await setDoc(ref, {
            ...data,
            id: ref.id,
            businessId: bizId,
            updatedAt: serverTimestamp(),
            createdAt: data.id ? data.createdAt : serverTimestamp()
        }, { merge: true });

        return ref.id;
    }
};

// ============ EVENTS & TICKETS SERVICES ============

export const eventService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeEvents(bizId: string, callback: (events: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'events'),
            where('isDeleted', '==', false),
            orderBy('startDate', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createEvent(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'events'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'draft',
            ticketsSold: 0,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateEvent(bizId: string, eventId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'events', eventId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteEvent(bizId: string, eventId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'events', eventId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

export const ticketService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeTickets(bizId: string, eventId: string, callback: (tickets: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'tickets'),
            where('eventId', '==', eventId),
            where('isDeleted', '==', false)
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createTicket(bizId: string, eventId: string, data: any) {
        const batch = writeBatch(db);

        const ticketRef = doc(collection(db, 'businesses', bizId, 'tickets'));
        batch.set(ticketRef, {
            ...data,
            id: ticketRef.id,
            businessId: bizId,
            eventId,
            status: 'paid',
            checkedInAt: null,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        batch.update(doc(db, 'businesses', bizId, 'events', eventId), {
            ticketsSold: increment(1)
        });

        await batch.commit();
        return ticketRef.id;
    },

    async checkInTicket(bizId: string, ticketId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'tickets', ticketId), {
            status: 'checked_in',
            checkedInAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
};
