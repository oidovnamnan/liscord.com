import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy,
    onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { convertTimestamps } from './helpers';

// ============ SHELF & PACKAGE SERVICES ============

export const shelfService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeShelves(bizId: string, callback: (shelves: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'shelves'), orderBy('locationCode'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    async createShelf(bizId: string, data: { locationCode: string; level: 'top' | 'middle' | 'bottom'; isFull: boolean; createdBy: string }) {
        const newRef = doc(collection(db, 'businesses', bizId, 'shelves'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            createdAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateShelf(bizId: string, shelfId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'shelves', shelfId), data);
    },

    async deleteShelf(bizId: string, shelfId: string) {
        await deleteDoc(doc(db, 'businesses', bizId, 'shelves', shelfId));
    },

    async getShelfByCode(bizId: string, code: string) {
        const q = query(collection(db, 'businesses', bizId, 'shelves'), where('locationCode', '==', code.toUpperCase()));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return convertTimestamps({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
};

export const packageService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeBatches(bizId: string, callback: (batches: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'packages'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createBatch(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'packages'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            status: 'processing',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    },
};

// ============ APPOINTMENT SERVICES ============

export const serviceCatalogService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeServices(bizId: string, callback: (services: any[]) => void) {
        const q = query(collection(db, 'businesses', bizId, 'services'), where('isDeleted', '==', false));
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createService(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'services'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            isActive: true,
            isDeleted: false,
            createdAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateService(bizId: string, serviceId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'services', serviceId), data);
    },

    async deleteService(bizId: string, serviceId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'services', serviceId), {
            isDeleted: true,
            isActive: false
        });
    }
};

export const appointmentService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeAppointments(bizId: string, startDate: Date, endDate: Date, callback: (appointments: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'appointments'),
            where('isDeleted', '==', false),
            where('startTime', '>=', startDate),
            where('startTime', '<=', endDate),
            orderBy('startTime', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createAppointment(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'appointments'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'scheduled',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateAppointment(bizId: string, appId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'appointments', appId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteAppointment(bizId: string, appId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'appointments', appId), {
            isDeleted: true,
            status: 'cancelled',
            updatedAt: serverTimestamp()
        });
    }
};

// ============ PROJECT SERVICES ============

export const projectService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeProjects(bizId: string, callback: (projects: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'projects'),
            where('isDeleted', '==', false),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createProject(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'projects'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'planning',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateProject(bizId: string, projectId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'projects', projectId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async deleteProject(bizId: string, projectId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'projects', projectId), {
            isDeleted: true,
            status: 'cancelled',
            updatedAt: serverTimestamp()
        });
    }
};

export const taskService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeTasks(bizId: string, projectId: string, callback: (tasks: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'tasks'),
            where('projectId', '==', projectId),
            where('isDeleted', '==', false),
            orderBy('orderIndex', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createTask(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'tasks'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateTask(bizId: string, taskId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'tasks', taskId), {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async updateTaskOrder(bizId: string, tasks: { id: string, status: string, orderIndex: number }[]) {
        const batch = writeBatch(db);
        tasks.forEach(task => {
            const docRef = doc(db, 'businesses', bizId, 'tasks', task.id);
            batch.update(docRef, { status: task.status, orderIndex: task.orderIndex, updatedAt: serverTimestamp() });
        });
        await batch.commit();
    },

    async deleteTask(bizId: string, taskId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'tasks', taskId), {
            isDeleted: true,
            updatedAt: serverTimestamp()
        });
    }
};

// ============ ROOMS & BOOKINGS SERVICES ============

export const roomService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeRooms(bizId: string, callback: (rooms: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'rooms'),
            where('isDeleted', '==', false),
            orderBy('name', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createRoom(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'rooms'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'available',
            isDeleted: false,
        });
        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateRoom(bizId: string, roomId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'rooms', roomId), data);
    },

    async deleteRoom(bizId: string, roomId: string) {
        await updateDoc(doc(db, 'businesses', bizId, 'rooms', roomId), {
            isDeleted: true
        });
    }
};

export const bookingService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeBookings(bizId: string, startDate: Date, endDate: Date, callback: (bookings: any[]) => void) {
        const q = query(
            collection(db, 'businesses', bizId, 'bookings'),
            where('isDeleted', '==', false),
            where('checkInTime', '>=', startDate),
            where('checkInTime', '<=', endDate),
            orderBy('checkInTime', 'asc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() })));
        });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createBooking(bizId: string, data: any) {
        const newRef = doc(collection(db, 'businesses', bizId, 'bookings'));
        await setDoc(newRef, {
            ...data,
            id: newRef.id,
            businessId: bizId,
            status: 'reserved',
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (data.status === 'checked_in') {
            await updateDoc(doc(db, 'businesses', bizId, 'rooms', data.roomId), { status: 'occupied' });
        }

        return newRef.id;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateBooking(bizId: string, bookingId: string, data: any) {
        await updateDoc(doc(db, 'businesses', bizId, 'bookings', bookingId), {
            ...data,
            updatedAt: serverTimestamp()
        });

        if (data.status === 'checked_out' || data.status === 'cancelled') {
            const bookingRef = await getDoc(doc(db, 'businesses', bizId, 'bookings', bookingId));
            if (bookingRef.exists()) {
                const room = bookingRef.data().roomId;
                await updateDoc(doc(db, 'businesses', bizId, 'rooms', room), { status: data.status === 'checked_out' ? 'cleaning' : 'available' });
            }
        }
    }
};
