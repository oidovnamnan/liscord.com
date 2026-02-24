import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types';

export interface CartItem {
    id: string; // unique string for this variant item
    product: Product;
    quantity: number;
    price: number; // The price at the time of adding
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
                    if (existing) {
                        return {
                            items: state.items.map(i =>
                                i.id === id ? { ...i, quantity: i.quantity + newItem.quantity } : i
                            ),
                            isOpen: true
                        };
                    }
                    return {
                        items: [...state.items, { ...newItem, id }],
                        isOpen: true
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
                    items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)
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
