import { create } from 'zustand';
import type { User, Business, Employee } from '../types';

// ============ AUTH STORE ============
interface AuthState {
    user: User | null;
    impersonatedBusinessId: string | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setImpersonatedBusinessId: (id: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    impersonatedBusinessId: null,
    loading: true,
    setUser: (user) => set({ user }),
    setImpersonatedBusinessId: (id) => set({ impersonatedBusinessId: id }),
    setLoading: (loading) => set({ loading }),
}));

// ============ CART STORE ============
export { useCartStore } from './cartStore';
export type { CartItem } from './cartStore';

// ============ BUSINESS STORE ============
interface BusinessState {
    business: Business | null;
    employee: Employee | null;
    originalEmployee: Employee | null; // Owner's own profile when impersonating another employee
    linkedEmployees: Employee[];
    loading: boolean;
    setBusiness: (business: Business | null) => void;
    setEmployee: (employee: Employee | null) => void;
    setLinkedEmployees: (employees: Employee[]) => void;
    switchToEmployee: (targetEmployee: Employee) => void;
    switchBack: () => void;
    setLoading: (loading: boolean) => void;
    clear: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
    business: null,
    employee: null,
    originalEmployee: null,
    linkedEmployees: [],
    loading: false,
    setBusiness: (business) => set({ business }),
    setEmployee: (employee) => set({ employee }),
    setLinkedEmployees: (employees) => set({ linkedEmployees: employees }),
    switchToEmployee: (targetEmployee) => {
        const { employee, originalEmployee, linkedEmployees } = get();
        if (!employee) return;
        // Save original employee on first switch (for "back to own account")
        const original = originalEmployee || employee;
        // Move current employee back into linked list, remove target from linked list
        const newLinked = linkedEmployees
            .filter(e => e.id !== targetEmployee.id)
            .concat(employee);
        set({ employee: targetEmployee, originalEmployee: original, linkedEmployees: newLinked });
    },
    switchBack: () => {
        const { originalEmployee, employee, linkedEmployees } = get();
        if (!originalEmployee) return;
        // Remove original from linked list (it becomes active), add current back
        const newLinked = linkedEmployees
            .filter(e => e.id !== originalEmployee.id)
            .concat(employee!);
        set({ employee: originalEmployee, originalEmployee: null, linkedEmployees: newLinked });
    },
    setLoading: (loading) => set({ loading }),
    clear: () => set({ business: null, employee: null, originalEmployee: null, linkedEmployees: [], loading: false }),
}));

// ============ UI STORE ============
interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    theme: 'dark' | 'light' | 'system';
    toggleSidebar: () => void;
    toggleSidebarCollapsed: () => void;
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: false,
    sidebarCollapsed: false,
    theme: (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark',
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        const resolved = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
        document.documentElement.setAttribute('data-theme', resolved);
        set({ theme });
    },
}));

// ============ SYSTEM CATEGORIES STORE ============
import { businessCategoryService } from '../services/db';
import { DEFAULT_BUSINESS_CATEGORIES } from '../types';
import type { BusinessCategoryConfig } from '../types';

interface SystemCategoriesState {
    categories: BusinessCategoryConfig[];
    loading: boolean;
    fetched: boolean;
    fetchCategories: () => Promise<void>;
    refresh: () => void;
}

export const useSystemCategoriesStore = create<SystemCategoriesState>((set, get) => ({
    categories: [],
    loading: false,
    fetched: false,
    fetchCategories: async () => {
        if (get().fetched || get().loading) return;
        set({ loading: true });
        try {
            const data = await businessCategoryService.getCategories();
            if (data.length > 0) {
                set({ categories: data, fetched: true });
            } else {
                // Fallback to defaults if DB is empty
                const fallbacks: BusinessCategoryConfig[] = Object.entries(DEFAULT_BUSINESS_CATEGORIES).map(([id, cfg], index) => ({
                    id,
                    ...cfg,
                    isActive: true,
                    order: index
                }));
                set({ categories: fallbacks, fetched: true });
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            set({ loading: false });
        }
    },
    // Optional: method to force refresh after mutation
    refresh: async () => {
        set({ fetched: false, loading: false });
        await get().fetchCategories();
    }
} as SystemCategoriesState));
