/* ====================================
   Liscord TypeScript Types — FULL
   ==================================== */

import type { Timestamp } from 'firebase/firestore';

// ============ FIRESTORE TIMESTAMP HELPER ============
export type FSTimestamp = Timestamp | Date;

// ============ USER ============
export interface User {
    uid: string;
    phone: string | null;
    email: string | null;
    displayName: string;
    photoURL: string | null;
    businessIds: string[];
    activeBusiness: string | null;
    language: string;
    isSuperAdmin?: boolean;
    createdAt: Date;
}

// ============ BUSINESS ============
export type BusinessCategory =
    | 'cargo'
    | 'wholesale'
    | 'online_shop'
    | 'food_delivery'
    | 'repair'
    | 'printing'
    | 'furniture'
    | 'flowers'
    | 'pharmacy'
    | 'auto_parts'
    | 'general';

export const BUSINESS_CATEGORIES: Record<BusinessCategory, { label: string; icon: string; desc: string }> = {
    cargo: { label: 'Карго / Импорт', icon: '📦', desc: 'Хятадаас бараа тээвэрлэх' },
    wholesale: { label: 'Бөөний худалдаа', icon: '🏪', desc: 'Бөөний борлуулалт' },
    online_shop: { label: 'Онлайн / Сошиал шоп', icon: '📱', desc: 'Facebook, Instagram дэлгүүр' },
    food_delivery: { label: 'Хоол / Хүргэлт', icon: '🍔', desc: 'Захиалга, хүргэлт' },
    repair: { label: 'Засвар үйлчилгээ', icon: '🔧', desc: 'Техник засвар' },
    printing: { label: 'Хэвлэл / Дизайн', icon: '🖨️', desc: 'Хэвлэл, лого дизайн' },
    furniture: { label: 'Тавилга / Интерьер', icon: '🛋️', desc: 'Тавилга үйлдвэрлэл' },
    flowers: { label: 'Цэцэг / Бэлэг', icon: '🌸', desc: 'Цэцэгчин, бэлэгний дэлгүүр' },
    pharmacy: { label: 'Эм / Эрүүл мэнд', icon: '💊', desc: 'Эмийн сан' },
    auto_parts: { label: 'Авто сэлбэг', icon: '🚗', desc: 'Авто сэлбэг, тос' },
    general: { label: 'Ерөнхий бизнес', icon: '📋', desc: 'Бусад төрлийн бизнес' },
};

export interface Business {
    id: string;
    name: string;
    slug?: string; // Add slug for storefront URL
    category: BusinessCategory;
    country: string;
    currency: string;
    ownerId: string;
    ownerName: string;
    logo: string | null;
    phone: string;
    email: string;
    address: string;
    settings: BusinessSettings;
    features: Record<string, boolean>;
    stats: BusinessStats;
    subscription: {
        plan: 'free' | 'pro' | 'business';
        expiresAt: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface BusinessSettings {
    orderPrefix: string;
    orderCounter: number;
    pin: string;
    timezone: string;
    workDays: number[];
    workHours: { start: string; end: string };
    cargoConfig?: {
        defaultFee: number;
        isIncludedByDefault: boolean;
    };
    defaultSourceId?: string;
    storefront?: {
        enabled: boolean;
        theme?: 'light' | 'dark';
    };
}

export interface OrderSource {
    id: string;
    name: string;
    icon?: string;
    businessId: string;
    defaultAccountId?: string;
    isDeleted: boolean;
    createdAt: Date;
}

export interface SocialAccount {
    id: string;
    name: string;
    sourceId: string;
    businessId: string;
    isDeleted: boolean;
    createdAt: Date;
}

export interface BusinessStats {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    totalEmployees: number;
}

// ============ EMPLOYEE / PERMISSION ============
export type EmployeeStatus = 'active' | 'inactive' | 'pending_invite';

export interface Employee {
    id: string;
    userId: string;
    businessId: string;
    name: string;
    phone: string;
    email: string | null;
    avatar: string | null;
    positionId: string;
    positionName: string;
    role: 'owner' | 'employee';
    status: EmployeeStatus;
    joinedAt: Date;
    lastActiveAt: Date | null;
    stats: {
        totalOrdersCreated: number;
        totalOrdersHandled: number;
    };
}

export interface Position {
    id: string;
    name: string;
    description: string;
    color: string;
    isSystem: boolean;
    isDefault: boolean;
    permissions: string[];
    employeeCount: number;
    order: number;
}

// All possible permissions
export const ALL_PERMISSIONS: Record<string, { label: string; group: string }> = {
    'orders.view_all': { label: 'Бүх захиалга харах', group: 'Захиалга' },
    'orders.view_own': { label: 'Өөрийн захиалга харах', group: 'Захиалга' },
    'orders.create': { label: 'Захиалга үүсгэх', group: 'Захиалга' },
    'orders.edit_all': { label: 'Бүх захиалга засах', group: 'Захиалга' },
    'orders.edit_own': { label: 'Өөрийн захиалга засах', group: 'Захиалга' },
    'orders.delete': { label: 'Захиалга устгах', group: 'Захиалга' },
    'orders.change_status': { label: 'Статус өөрчлөх', group: 'Захиалга' },
    'orders.view_financials': { label: 'Мөнгөн дүн харах', group: 'Захиалга' },
    'orders.manage_payments': { label: 'Төлбөр удирдах', group: 'Захиалга' },
    'orders.export': { label: 'Экспортлох', group: 'Захиалга' },
    'customers.view': { label: 'Харилцагч харах', group: 'Харилцагч' },
    'customers.create': { label: 'Харилцагч нэмэх', group: 'Харилцагч' },
    'customers.edit': { label: 'Харилцагч засах', group: 'Харилцагч' },
    'customers.delete': { label: 'Харилцагч устгах', group: 'Харилцагч' },
    'products.view': { label: 'Бараа харах', group: 'Бараа' },
    'products.create': { label: 'Бараа нэмэх', group: 'Бараа' },
    'products.edit': { label: 'Бараа засах', group: 'Бараа' },
    'products.delete': { label: 'Бараа устгах', group: 'Бараа' },
    'products.manage_stock': { label: 'Нөөц удирдах', group: 'Бараа' },
    'products.view_cost': { label: 'Өртөг харах', group: 'Бараа' },
    'reports.view_dashboard': { label: 'Dashboard харах', group: 'Тайлан' },
    'reports.view_sales': { label: 'Борлуулалтын тайлан', group: 'Тайлан' },
    'reports.export': { label: 'Тайлан экспортлох', group: 'Тайлан' },
    'team.view': { label: 'Ажилтан харах', group: 'Баг' },
    'team.invite': { label: 'Ажилтан урих', group: 'Баг' },
    'team.edit': { label: 'Ажилтан засах', group: 'Баг' },
    'team.remove': { label: 'Ажилтан хасах', group: 'Баг' },
    'team.manage_positions': { label: 'Албан тушаал удирдах', group: 'Баг' },
    'settings.view': { label: 'Тохиргоо харах', group: 'Тохиргоо' },
    'settings.edit_business': { label: 'Бизнес мэдээлэл засах', group: 'Тохиргоо' },
    'settings.manage_billing': { label: 'Төлбөр удирдах', group: 'Тохиргоо' },
};

// ============ ORDER ============
export interface OrderStatusConfig {
    id: string;
    label: string;
    color: string;
    order: number;
    isSystem: boolean;
    isActive: boolean;
}

export type OrderStatus =
    | 'new' | 'confirmed' | 'preparing' | 'ready'
    | 'shipping' | 'delivered' | 'completed' | 'cancelled'
    | string;

export type LegacyOrderSource = 'facebook' | 'instagram' | 'tiktok' | 'website' | 'phone' | 'pos' | 'other';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'qpay' | 'bank' | 'card' | 'credit';

export interface OrderItem {
    productId: string | null;
    name: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    totalPrice: number;
    image?: string | null;
}

export interface OrderPayment {
    id: string;
    amount: number;
    method: PaymentMethod;
    note: string;
    paidAt: Date;
    recordedBy: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string; // Dynamic status ID
    paymentStatus: PaymentStatus;

    customer: {
        id: string | null;
        name: string;
        phone: string;
        socialHandle?: string;
    };

    source?: LegacyOrderSource;
    sourceId?: string;
    accountId?: string;
    paymentScreenshot?: string;

    items: OrderItem[];

    financials: {
        subtotal: number;
        discountType: 'percent' | 'fixed';
        discountValue: number;
        discountAmount: number;
        deliveryFee: number;
        cargoFee: number;
        cargoIncluded: boolean;
        totalAmount: number;
        payments: OrderPayment[];
        paidAmount: number;
        balanceDue: number;
    };

    assignedTo: string | null;
    assignedToName: string | null;
    notes: string;
    internalNotes: string;
    deliveryAddress: string;
    locationCode?: string | null;
    statusHistory: Array<{
        status: OrderStatus;
        at: Date;
        by: string;
        byName: string;
        updatedBy?: string;
        timestamp?: Date;
    }>;
    tags: string[];

    createdBy: string;
    createdByName: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    cancelReason?: string;
}

// ============ CUSTOMER ============
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    company: string;
    socialHandle?: string;
    tags: string[];
    notes: string;
    stats: {
        totalOrders: number;
        totalSpent: number;
        totalDebt: number;
        lastOrderAt: Date | null;
    };
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}

// ============ PRODUCT ============
export interface Product {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    categoryName: string;
    sku: string;
    barcode: string;
    images: string[];
    pricing: {
        salePrice: number;
        costPrice: number;
        wholesalePrice: number;
    };
    productType: 'ready' | 'preorder';
    stock: {
        quantity: number;
        lowStockThreshold: number;
        trackInventory: boolean;
    };
    cargoFee?: {
        amount: number;
        isIncluded: boolean;
        cargoTypeId?: string;
        cargoValue?: number;
    };
    unitType: string;
    isActive: boolean;
    stats: {
        totalSold: number;
        totalRevenue: number;
    };
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}

// ============ CATEGORY ============
export interface Category {
    id: string;
    name: string;
    description: string;
    color?: string;
    productCount: number;
    isDeleted: boolean;
    createdAt: Date;
}

export interface CargoType {
    id: string;
    name: string;
    fee: number;
    unit: string; // ш, кг, л, м3
    isDeleted: boolean;
    createdAt: Date;
}

// ============ NAVIGATION ============
export interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    permission?: string;
    badge?: number;
}

// ============ CARGO PACKAGES & SHELVES ============
export interface ScannedItem {
    id: string;
    imageUrl: string;
    extractedText: string;
    matchedOrderId: string | null;
    matchedOrderNumber: string | null;
    isConflicted: boolean;
    locationCode?: string; // e.g. "A-1" (Shelf ID/Code)
}

export interface PackageBatch {
    id: string;
    batchName: string; // e.g., "Улаан-Үд ачаа #45"
    status: 'processing' | 'completed';
    scannedItems: ScannedItem[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Shelf {
    id: string;
    locationCode: string; // e.g. B-04
    level: 'top' | 'middle' | 'bottom';
    isFull: boolean;
    createdBy: string;
    createdAt: Date;
}
