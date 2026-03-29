import {
    doc, getDoc, collection, runTransaction, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Order, Business, Customer } from '../types';

export const walletService = {
    /**
     * Applies cashback to a customer's wallet if the business has Wallet feature enabled 
     * and a valid orderCashbackPct > 0 configured.
     * Prevents double-processing by checking a specific field on the order.
     */
    async processOrderCashback(bizId: string, orderId: string, employeeProfile?: any): Promise<void> {
        if (!bizId || !orderId) return;

        const orderRef = doc(db, 'businesses', bizId, 'orders', orderId);
        const bizRef = doc(db, 'businesses', bizId);

        try {
            await runTransaction(db, async (t) => {
                const [orderSnap, bizSnap] = await Promise.all([
                    t.get(orderRef),
                    t.get(bizRef)
                ]);

                if (!orderSnap.exists() || !bizSnap.exists()) return;

                const order = orderSnap.data() as Order;
                const biz = bizSnap.data() as Business;

                // Validation checks
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (order.isDeleted || order.orderType === 'membership' || (order as any).cashbackApplied) {
                    return; // Already deleted, non-product order, or already processed
                }

                // Payment must be fully paid to get cashback
                if (order.paymentStatus !== 'paid') {
                    return;
                }

                const walletSettings = biz.settings?.wallet;
                if (!walletSettings?.enabled) return; // Wallet not enabled

                const cashbackPct = walletSettings.rewardEvents?.orderCashbackPct || 0;
                if (cashbackPct <= 0) return; // No cashback percentage

                const customerId = order.customer?.id;
                if (!customerId) return; // Guest order, no profile to attach wallet balance to

                const finalTotal = order.financials?.totalAmount || 0;
                if (finalTotal <= 0) return;

                // Calculate Cashback Amount
                const cashbackAmount = Math.floor(finalTotal * (cashbackPct / 100));

                if (cashbackAmount > 0) {
                    const custRef = doc(db, 'businesses', bizId, 'customers', customerId);
                    const custSnap = await t.get(custRef);

                    if (custSnap.exists()) {
                        const custData = custSnap.data() as Customer;
                        const currentBalance = custData.walletBalance || 0;
                        const newBalance = currentBalance + cashbackAmount;

                        // Update Order
                        t.update(orderRef, {
                            cashbackApplied: true,
                            cashbackAmount: cashbackAmount,
                            updatedAt: serverTimestamp()
                        });

                        // Update Customer Wallet
                        t.update(custRef, {
                            walletBalance: newBalance,
                            updatedAt: serverTimestamp()
                        });

                        // Create transaction record
                        const txRef = doc(collection(db, 'businesses', bizId, 'wallet_transactions'));
                        t.set(txRef, {
                            businessId: bizId,
                            customerId: customerId,
                            orderId: orderId,
                            amount: cashbackAmount,
                            type: 'cashback',
                            reason: `Худалдан авалтын буцаан олголт (${cashbackPct}%) - Захиалга #${order.orderNumber}`,
                            createdAt: serverTimestamp(),
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            createdBy: (employeeProfile as any)?.uid || 'system'
                        });
                    }
                }
            });
            console.log(`[WalletService] Cashback processed for order: ${orderId}`);
        } catch (error) {
            console.error('[WalletService] Error processing cashback:', error);
        }
    },

    /**
     * Deducts wallet balance when a customer uses their wallet points during checkout.
     * This should be called immediately after the order is successfully created.
     */
    async deductWalletOnCheckout(bizId: string, customerId: string, orderId: string, amount: number): Promise<void> {
        if (!bizId || !customerId || !orderId || amount <= 0) return;

        const custRef = doc(db, 'businesses', bizId, 'customers', customerId);
        
        try {
            await runTransaction(db, async (t) => {
                const custSnap = await t.get(custRef);
                if (!custSnap.exists()) return;

                const custData = custSnap.data() as Customer;
                const currentBalance = custData.walletBalance || 0;

                if (currentBalance < amount) {
                    throw new Error('Insufficient wallet balance');
                }

                // Deduct balance
                t.update(custRef, {
                    walletBalance: currentBalance - amount,
                    updatedAt: serverTimestamp()
                });

                // Create transaction record
                const txRef = doc(collection(db, 'businesses', bizId, 'wallet_transactions'));
                t.set(txRef, {
                    businessId: bizId,
                    customerId: customerId,
                    orderId: orderId,
                    amount: -amount,
                    type: 'usage',
                    reason: `Худалдан авалтанд зарцуулав - Захиалга #${orderId.slice(-6)}`,
                    createdAt: serverTimestamp(),
                    createdBy: customerId
                });
            });
            console.log(`[WalletService] Wallet deducted for checkout: ${amount}`);
        } catch (error) {
            console.error('[WalletService] Error deducting wallet on checkout:', error);
            throw error;
        }
    },

    /**
     * Awards community post bonus to the customer's wallet.
     */
    async awardCommunityPostBonus(bizId: string, customerId: string, amount: number, postId: string): Promise<void> {
        if (!bizId || !customerId || amount <= 0) return;

        const customerRef = doc(db, 'businesses', bizId, 'customers', customerId);
        const transactionRef = doc(collection(db, 'businesses', bizId, 'wallet_transactions'));

        try {
            await runTransaction(db, async (t) => {
                const customerSnap = await t.get(customerRef);
                if (!customerSnap.exists()) {
                    throw new Error("Customer does not exist.");
                }

                const currentBalance = customerSnap.data()?.walletBalance || 0;
                
                // Add wallet balance
                t.update(customerRef, {
                    walletBalance: currentBalance + amount,
                    updatedAt: serverTimestamp()
                });

                // Record transaction
                t.set(transactionRef, {
                    businessId: bizId,
                    customerId,
                    amount: amount,
                    type: 'community_post_bonus',
                    reason: 'Feed Post Урамшуулал',
                    orderId: postId, // using orderId to store postId
                    createdBy: 'system_feed',
                    createdAt: serverTimestamp()
                });
            });
            console.log(`[WalletService] Awarded ${amount} for community post: ${postId}`);
        } catch (error) {
            console.error('[WalletService] Error in awardCommunityPostBonus:', error);
            throw error;
        }
    }
};
