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
    originalEmployee: Employee | null;
    isImpersonating: boolean;
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
    isImpersonating: false,
    linkedEmployees: [],
    loading: false,
    setBusiness: (business) => set({ business }),
    setEmployee: (employee) => set({ employee }),
    setLinkedEmployees: (employees) => set({ linkedEmployees: employees }),
    switchToEmployee: (targetEmployee) => {
        const { employee, isImpersonating, linkedEmployees } = get();
        // Persist impersonation to sessionStorage for refresh survival
        try { sessionStorage.setItem('impersonatingEmployeeId', targetEmployee.id); } catch {}
        // On first switch, save current employee as original
        if (!isImpersonating) {
            const newLinked = linkedEmployees.filter(e => e.id !== targetEmployee.id);
            if (employee) newLinked.push(employee);
            set({
                employee: targetEmployee,
                originalEmployee: employee,
                isImpersonating: true,
                linkedEmployees: newLinked,
            });
        } else {
            const newLinked = linkedEmployees.filter(e => e.id !== targetEmployee.id);
            if (employee) newLinked.push(employee);
            set({ employee: targetEmployee, linkedEmployees: newLinked });
        }
    },
    switchBack: () => {
        const { originalEmployee, employee, linkedEmployees, isImpersonating } = get();
        if (!isImpersonating) return;
        // Clear persisted impersonation
        try { sessionStorage.removeItem('impersonatingEmployeeId'); } catch {}
        const newLinked = linkedEmployees.filter(e => e.id !== originalEmployee?.id);
        if (employee) newLinked.push(employee);
        set({
            employee: originalEmployee,
            originalEmployee: null,
            isImpersonating: false,
            linkedEmployees: newLinked,
        });
    },
    setLoading: (loading) => set({ loading }),
    clear: () => {
        try { sessionStorage.removeItem('impersonatingEmployeeId'); } catch {}
        set({ business: null, employee: null, originalEmployee: null, isImpersonating: false, linkedEmployees: [], loading: false });
    },
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
