import { collection, doc, query, where, getDocs, getDoc, addDoc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import type { ServiceProfile, BusinessLink, ServiceRequest, B2BServiceType } from '../types';

export const b2bService = {
    // ============ SERVICE PROFILES ============

    /**
     * Update a business's service profile in the businesses collection
     */
    async updateServiceProfile(businessId: string, profile: ServiceProfile) {
        const docRef = doc(db, 'businesses', businessId);
        await updateDoc(docRef, {
            serviceProfile: profile,
            updatedAt: serverTimestamp(),
        });
    },

    /**
     * Get all public service providers, optionally filtered by type
     */
    async getPublicServiceProviders(serviceType?: B2BServiceType) {
        const q = query(
            collection(db, 'businesses'),
            where('serviceProfile.isProvider', '==', true),
            where('serviceProfile.isPublicListed', '==', true)
        );

        const snapshot = await getDocs(q);
        const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        if (serviceType) {
            return providers.filter(p => p.serviceProfile?.services.some((s: any) => s.type === serviceType && s.isActive));
        }
        return providers;
    },

    // ============ BUSINESS LINKS (CONNECTIONS) ============

    /**
     * Create a new B2B connection link between two businesses
     */
    async createBusinessLink(linkData: Omit<BusinessLink, 'id' | 'createdAt' | 'updatedAt'>) {
        const docRef = await addDoc(collection(db, 'businessLinks'), {
            ...linkData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    },

    /**
     * Get connections for a specific business (as consumer or provider)
     */
    async getBusinessLinks(businessId: string, role: 'consumer' | 'provider') {
        const q = query(
            collection(db, 'businessLinks'),
            where(`${role}.businessId`, '==', businessId),
            orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BusinessLink));
    },

    /**
     * Accept, reject, or pause a link
     */
    async updateBusinessLinkStatus(linkId: string, status: BusinessLink['status']) {
        const docRef = doc(db, 'businessLinks', linkId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    },

    // ============ SERVICE REQUESTS (FORWARDING ORDERS) ============

    /**
     * Send an order from consumer to provider
     */
    async createServiceRequest(requestData: Omit<ServiceRequest, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>) {
        const docRef = await addDoc(collection(db, 'serviceRequests'), {
            ...requestData,
            statusHistory: [{
                status: requestData.status,
                at: new Date(),
                note: 'Хүсэлт илгээсэн'
            }],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Update link stats (optimistic)
        if (requestData.linkId) {
            const linkRef = doc(db, 'businessLinks', requestData.linkId);
            const linkSnap = await getDoc(linkRef);
            if (linkSnap.exists()) {
                const link = linkSnap.data() as BusinessLink;
                await updateDoc(linkRef, {
                    'stats.totalRequests': (link.stats?.totalRequests || 0) + 1,
                    updatedAt: serverTimestamp()
                });
            }
        }

        return docRef.id;
    },

    /**
     * Get service requests
     */
    async getServiceRequests(businessId: string, role: 'consumer' | 'provider', filters?: { status?: string, limitCount?: number }) {
        let qConstraints: any[] = [
            where(`${role}.businessId`, '==', businessId),
            orderBy('createdAt', 'desc')
        ];

        if (filters?.status) {
            qConstraints.push(where('status', '==', filters.status));
        }
        if (filters?.limitCount) {
            qConstraints.push(limit(filters.limitCount));
        }

        const q = query(collection(db, 'serviceRequests'), ...qConstraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps back to dates to avoid React render issues
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            statusHistory: (doc.data().statusHistory || []).map((h: any) => ({
                ...h,
                at: h.at?.toDate() || new Date()
            }))
        } as ServiceRequest));
    },

    /**
     * Provider updates the status of a request (which consumer will see in real-time)
     */
    async updateServiceRequestStatus(requestId: string, status: ServiceRequest['status'], note?: string, changedBy?: string) {
        const reqRef = doc(db, 'serviceRequests', requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) throw new Error('Request not found');

        const reqData = reqSnap.data() as ServiceRequest;
        const newHistoryItem = {
            status,
            at: new Date(),
            note: note || `Статус өөрчиллөө: ${status}`,
            by: changedBy
        };

        const updates: any = {
            status,
            statusHistory: [...(reqData.statusHistory || []), newHistoryItem],
            updatedAt: serverTimestamp()
        };

        // If completed, update link stats
        if (status === 'completed' && reqData.linkId) {
            const linkRef = doc(db, 'businessLinks', reqData.linkId);
            const linkSnap = await getDoc(linkRef);
            if (linkSnap.exists()) {
                const link = linkSnap.data() as BusinessLink;
                updateDoc(linkRef, {
                    'stats.completedRequests': (link.stats?.completedRequests || 0) + 1,
                });
            }
        }

        await updateDoc(reqRef, updates);

        // Sync status back to original order
        if (reqData.sourceOrder?.orderId && reqData.consumer.businessId) {
            try {
                // Determine mapped status string for the consumer's order history
                let consumerStatus: string = status;
                if (status === 'accepted') consumerStatus = 'preparing';
                if (status === 'in_progress') consumerStatus = 'shipping';
                if (status === 'completed') consumerStatus = 'delivered';

                const orderRef = doc(db, `businesses/${reqData.consumer.businessId}/orders`, reqData.sourceOrder.orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    const orderData = orderSnap.data();
                    const newOrderHistory = {
                        status: consumerStatus,
                        at: new Date(),
                        by: reqData.provider.businessId,
                        byName: reqData.provider.businessName,
                        note: `Нийлүүлэгч төлөв өөрчиллөө: ${status} (${note || ''})`
                    };

                    await updateDoc(orderRef, {
                        status: consumerStatus,
                        statusHistory: [...(orderData.statusHistory || []), newOrderHistory],
                        updatedAt: serverTimestamp()
                    });
                }
            } catch (syncError) {
                console.error('Failed to sync status to consumer order:', syncError);
                // We'll swallow this error so the B2B side still succeeds
            }
        }
    }
};
