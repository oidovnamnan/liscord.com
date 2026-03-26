import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

export interface CartItem {
    id: string; // unique string for this variant item
    product: Product;
    quantity: number;
    price: number; // The price at the time of adding
    maxQuantity?: number; // Flash deal limit
    isFlashDeal?: boolean; // Flash deal item marker
    variant?: {
        color?: string;
        size?: string;
    };
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, newQuantity: number) => void;
    clearCart: () => void;
    setIsOpen: (isOpen: boolean) => void;
    totalAmount: () => number;
    totalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                const variantKey = `${newItem.variant?.color || ''}-${newItem.variant?.size || ''}`;
                const id = `${newItem.product.id}-${variantKey}`;

                set((state) => {
                    const existing = state.items.find(i => i.id === id);
                    const max = newItem.maxQuantity || existing?.maxQuantity;
                    if (existing) {
                        const newQty = existing.quantity + newItem.quantity;
                        return {
                            items: state.items.map(i =>
                                i.id === id ? { ...i, quantity: max ? Math.min(newQty, max) : newQty } : i
                            ),
                        };
                    }
                    const initQty = max ? Math.min(newItem.quantity, max) : newItem.quantity;
                    return {
                        items: [...state.items, { ...newItem, id, quantity: initQty }],
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter(i => i.id !== id)
                }));
            },

            updateQuantity: (id, qty) => {
                set((state) => ({
                    items: state.items.map(i => {
                        if (i.id !== id) return i;
                        let q = Math.max(1, qty);
                        if (i.maxQuantity) q = Math.min(q, i.maxQuantity);
                        return { ...i, quantity: q };
                    })
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            setIsOpen: (isOpen) => {
                set({ isOpen });
            },

            totalAmount: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            },

            totalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'liscord-cart',
        }
    )
);
