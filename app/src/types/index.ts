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
    uiVersion?: 'v1' | 'v2'; // For toggling UX versions
    createdAt: Date;
}

// ============ APP STORE MODULE ============
export interface AppModulePricingPlan {
    id: string;             // e.g. '30-days', '365-days'
    name: string;           // e.g. '30 хоног', '1 жил'
    price: number;
    durationDays: number;
}

export interface AppModule {
    id: string;             // unique identifier, e.g. 'inventory', 'hrm'
    name: string;           // Display name in App Store
    description: string;    // Short description
    icon: string;           // Lucide icon name or emoji
    route: string;          // Sidebar active route prefix (e.g. '/app/inventory')
    isCore: boolean;        // If true, cannot be uninstalled (e.g. Settings, Dashboard)
    category: 'operations' | 'finance' | 'staff' | 'sales' | 'services' | 'industry' | 'logistics' | 'education' | 'manufacturing' | 'professional' | 'service' | 'ecommerce' | 'marketing' | 'tools' | 'ai' | 'facility' | 'entertainment' | 'nonprofit' | 'b2b'; // Expanded categories
    categories?: string[];  // Multi-dimensional categorization
    tags?: string[];        // Additional metadata
    hubId?: string;         // For tabbed navigation (e.g. 'inventory-hub')
    isFree?: boolean;       // Phase 41: App Store pricing
    price?: number;         // Price in local currency (legacy)
    durationDays?: number;  // Subscription period (legacy)
    hasSettings?: boolean;  // Системийн Тохиргоо руу тусгай цэс нэмэх эсэх
    settingsRoute?: string; // Тохиргоо цэсний зам (e.g. '/app/settings/orders')
    placement?: 'sidebar' | 'settings' | 'both'; // Хаана харагдахыг тодорхойлох (default: 'sidebar')
    plans?: AppModulePricingPlan[]; // Multi-pricing support
}

// ============ BUSINESS ============
export type BusinessCategory = string;

export interface BusinessCategoryConfig {
    id: string;
    label: string;
    icon: string;
    desc: string;
    isActive: boolean;
    order: number;
}
export const DEFAULT_BUSINESS_CATEGORIES: Record<string, { label: string; icon: string; desc: string }> = {
    // Original 11
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
    // 14 New
    beauty_salon: { label: 'Гоо сайхан / Салон', icon: '💅', desc: 'Цаг захиалга, үйлчилгээ' },
    tailoring: { label: 'Оёдол / Загвар', icon: '✂️', desc: 'Хэмжээ авах, захиалгат хувцас' },
    real_estate: { label: 'Үл хөдлөх хөрөнгө', icon: '🏢', desc: 'Түрээс, борлуулалт' },
    education: { label: 'Сургалтын төв', icon: '🎓', desc: 'Элсэлт, ирц бүртгэл' },
    rentals: { label: 'Түрээсийн үйлчилгээ', icon: '🔄', desc: 'Хувцас, тоног төхөөрөмж түрээс' },
    events: { label: 'Арга хэмжээ / Ивент', icon: '🎟️', desc: 'Тасалбар, зохион байгуулалт' },
    cleaning: { label: 'Гэр цэвэрлэгээ', icon: '🧹', desc: 'Дуудлагын үйлчилгээ' },
    clinic: { label: 'Эмнэлэг / Клиник', icon: '🩺', desc: 'Шүд, дотор, жижиг клиник' },
    agency: { label: 'Агентлаг / Үйлчилгээ', icon: '💼', desc: 'Хууль, санхүү, зөвлөх' },
    veterinary: { label: 'Мал эмнэлэг', icon: '🐾', desc: 'Гэрийн тэжээвэр амьтны эмнэлэг' },
    laundry: { label: 'Хими цэвэрлэгээ', icon: '👕', desc: 'Угаалга, индүүдлэг' },
    utilities: { label: 'Дэд бүтэц / Хөгжил', icon: '💧', desc: 'Ус, цахилгаан түгээх' },
    tourism: { label: 'Аялал жуулчлал', icon: '✈️', desc: 'Аяллын багц, урьдчилсан захиалга' },
    fitness: { label: 'Спорт / Фитнес', icon: '🏋️', desc: 'Клубийн гишүүнчлэл' },
    // 19 Massive Expansion
    construction: { label: 'Барилга / Гүйцэтгэл', icon: '🏗️', desc: 'Барилга угсралт, төслийн удирдлага' },
    heavy_equipment: { label: 'Техник түрээс', icon: '🚜', desc: 'Хүнд машин механизм түрээс' },
    car_rental: { label: 'Авто машин түрээс', icon: '🚙', desc: 'Өдрийн болон урт хугацааны түрээс' },
    pawnshop: { label: 'Ломбард / Зээл', icon: '🏦', desc: 'Бацаалан зээлдүүлэх' },
    car_wash: { label: 'Авто угаалга / Detailing', icon: '🧽', desc: 'Угаалга, өнгөлгөө' },
    photo_studio: { label: 'Фото студи / Продакшн', icon: '📸', desc: 'Зураг авалт, студи түрээс' },
    bakery: { label: 'Бэйкери / Кофе', icon: '🥐', desc: 'Нарийн боов, кофе шоп' },
    bar_pub: { label: 'Бар / Паб / Клуб', icon: '🍻', desc: 'Шөнийн цэнгээний газар, уушийн газар' },
    hotel: { label: 'Зочид буудал / Ресорт', icon: '🏨', desc: 'Өрөө захиалга, амралтын газар' },
    coworking: { label: 'Дундын оффис', icon: '💻', desc: 'Ширээ болон оффис түрээс' },
    agriculture: { label: 'ХАА / Ферм', icon: '🌾', desc: 'Газар тариалан, мал аж ахуй' },
    delivery_fleet: { label: 'Хот доторх түгээлт', icon: '🛵', desc: 'Шуудан, илгээмжийн түгээлт' },
    childcare: { label: 'Цэцэрлэг / Өдөр өнжүүлэх', icon: '🧸', desc: 'Хүүхэд харах үйлчилгээ' },
    entertainment: { label: 'Тоглоомын төв / PC', icon: '🎮', desc: 'PS5, PC, VR тоглоомын газар' },
    hardware_store: { label: 'Барилгын материал', icon: '🧱', desc: 'Түмэн бодис, барилгын дэлгүүр' },
    thrift_store: { label: 'Хуучин хувцас / Комисс', icon: '♻️', desc: 'Комиссын дэлгүүр' },
    moving: { label: 'Нүүлгэлт / Ачаа', icon: '📦', desc: 'Гэр болон оффис нүүлгэлт' },
    transport: { label: 'Зорчигч тээвэр', icon: '🚌', desc: 'Хот хооронд болон тусгай тээвэр' },
    storage: { label: 'Агуулах түрээс', icon: '🔐', desc: 'Self-storage, эд зүйлс хадгалах' },
    // General
    custom: { label: 'Миний угсралт (Custom)', icon: '🛠️', desc: 'Өөрийн бизнесээ үүсгээд модулиудаа сонгож угсрах' },
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
    // B2B Ecosystem
    serviceProfile?: ServiceProfile;
    // Config
    settings: BusinessSettings;
    features: Record<string, boolean>;
    activeModules?: string[]; // E.g., ['pos', 'inventory', 'rooms', 'queue']
    moduleSubscriptions?: Record<string, {
        expiresAt: FSTimestamp;
        subscribedAt: FSTimestamp;
        status: 'active' | 'expired';
    }>; // Phase 41: Module-specific subscriptions
    brandColor?: string; // Phase 40: Dynamic Theme Color
    stats: BusinessStats;
    subscription: {
        plan: 'free' | 'pro' | 'business';
        expiresAt: Date | null;
        hasV2Access?: boolean; // Access flag for V2 Pro Max
    };
    createdAt: Date;
    updatedAt: Date;
    lastStorefrontChangeAt?: Date;
    isDisabled?: boolean;
}

export interface BusinessRequest {
    id: string;
    businessId: string;
    businessName: string;
    type: 'storefront_change';
    requestedData: {
        name?: string;
        slug?: string;
    };
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

export interface PlatformPayment {
    id: string;
    businessId: string;
    businessName: string;
    plan: 'pro' | 'business';
    amount: number;
    months: number;
    paymentMethod: 'qpay' | 'bank_transfer' | 'cash' | 'manual';
    status: 'pending' | 'success' | 'failed';
    createdAt: Date;
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
        theme?: string; // e.g., 'minimal', 'fashion', 'commerce', etc.
        name?: string;
        installedThemes?: string[]; // IDs of installed/purchased themes
        showFooter?: boolean;
    };
    ebarimt?: {
        enabled: boolean;
        companyRegNo: string;
        posId: string;
        vatPercent: number;
        cityTaxPercent: number;
    };
    qpay?: {
        enabled: boolean;
        merchantId: string;
        username: string;
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
    // Cargo specific
    totalPackages?: number;
    packagesInTransit?: number;
    packagesArrived?: number;
    totalBatches?: number;
}

// ============ B2B ECOSYSTEM ============
export type B2BServiceType = 'cargo' | 'delivery' | 'wholesale' | 'printing' | 'generic';

export interface ServicePricing {
    type: 'flat' | 'zone_based' | 'weight_based' | 'custom';
    basePrice: number;
    zones?: { district: string; price: number }[];
    urgentMultiplier?: number;
    fragileExtra?: number;
    weightExtra?: { above: number; perKg: number };
}

export interface ServiceProfile {
    isProvider: boolean;
    services: {
        id: string;
        type: B2BServiceType;
        name: string;
        description: string;
        isActive: boolean;
        terms: {
            coverageAreas?: string[];
            operatingHours?: { start: string; end: string };
            estimatedTime?: string;
            maxWeight?: number;
            customTerms?: string;
        };
        pricing: ServicePricing;
    }[];
    isPublicListed: boolean;
    rating: { average: number; count: number };
}

export interface BusinessLink {
    id: string;
    consumer: {
        businessId: string;
        businessName: string;
        category: string;
    };
    provider: {
        businessId: string;
        businessName: string;
        category: string;
        serviceType: B2BServiceType;
    };
    status: 'pending' | 'active' | 'paused' | 'terminated';
    terms: {
        pricingAgreed: boolean;
        specialRate?: number;
        paymentTerms: 'per_order' | 'weekly' | 'monthly' | 'prepaid';
        autoAccept: boolean;
        notifyOn: string[];
    };
    stats: {
        totalRequests: number;
        completedRequests: number;
        averageRating: number;
        totalSpent: number;
    };
    initiatedBy: 'consumer' | 'provider';
    createdAt: Date;
    updatedAt: Date;
}

export interface ServiceRequest {
    id: string;
    linkId: string; // ID of the BusinessLink
    serviceType: B2BServiceType;
    consumer: {
        businessId: string;
        businessName: string;
    };
    provider: {
        businessId: string;
        businessName: string;
    };
    sourceOrder?: {
        orderId: string;
        orderNumber: string;
        customerName: string;
        customerPhone: string;
    };
    providerOrder?: {
        orderId: string;
        orderNumber: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: any; // Dynamic based on serviceType (delivery details, cargo details, wholesale items)
    pricing: {
        estimatedFee: number;
        finalFee: number;
        paidByConsumer: boolean;
        paymentMethod: 'per_order' | 'monthly_invoice' | 'prepaid';
    };
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
    statusHistory: {
        status: string;
        at: Date;
        by?: string;
        note?: string;
    }[];
    assignedTo?: {
        userId: string;
        name: string;
        phone: string;
    };
    review?: {
        rating: number;
        comment: string;
        reviewedAt: Date;
    };
    createdAt: Date;
    updatedAt: Date;
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
    isDeleted?: boolean;
    joinedAt: Date;
    lastActiveAt: Date | null;
    baseSalary?: number;
    commissionRate?: number;
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
    'orders.purchase': { label: 'Эх сурвалжаас худалдан авах (Taobao, 1688)', group: 'Захиалга' },
    'orders.manage_delivery': { label: 'Хүргэлт, ложистик удирдах', group: 'Захиалга' },
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
    'finance.manage': { label: 'Санхүү, орлого зарлага удирдах', group: 'Санхүү' },
    'team.view': { label: 'Ажилтан харах', group: 'Баг' },
    'team.invite': { label: 'Ажилтан урих', group: 'Баг' },
    'team.edit': { label: 'Ажилтан засах', group: 'Баг' },
    'team.remove': { label: 'Ажилтан хасах', group: 'Баг' },
    'team.manage_positions': { label: 'Албан тушаал удирдах', group: 'Баг' },
    'payroll.view': { label: 'Цалингийн түүх харах', group: 'Баг' },
    'payroll.manage': { label: 'Цалин бодох, шинэчлэх', group: 'Баг' },
    'settings.view': { label: 'Тохиргоо харах', group: 'Тохиргоо' },
    'settings.edit_business': { label: 'Бизнес мэдээлэл засах', group: 'Тохиргоо' },
    'settings.manage_cargo_sources': { label: 'Карго, эх сурвалж удирдах', group: 'Тохиргоо' },
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

// ============ PAYROLL ============
export interface PayrollEntry {
    id: string;
    employeeId: string;
    employeeName: string;
    month: string; // e.g. "2024-05"
    baseSalary: number;
    workedHours: number;
    hourlyRate?: number;
    commissions: number;
    deductions: number;
    advances: number;
    netPay: number;
    status: 'draft' | 'paid';
    paidAt?: Date;
    createdAt: Date;
}

export interface ProductVariation {
    id: string;
    sku: string;
    name: string; // e.g. "Red / L"
    salePrice?: number;
    costPrice?: number;
    quantity: number;
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
        comparePrice?: number;
    };
    productType: 'ready' | 'preorder';
    stock: {
        quantity: number;
        lowStockThreshold: number;
        trackInventory: boolean;
    };
    stockBalances?: {
        [warehouseId: string]: number;
    };
    cargoFee?: {
        amount: number;
        isIncluded: boolean;
        cargoTypeId?: string;
        cargoValue?: number;
    };
    unitType: string;
    isActive: boolean;
    variations?: ProductVariation[];
    stats: {
        totalSold: number;
        totalRevenue: number;
    };
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isHidden?: boolean;
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

// ============ WAREHOUSE & SHELVES ============
export interface Warehouse {
    id: string;
    businessId: string;
    name: string;
    location?: string;
    type: 'main' | 'secondary' | 'retail' | 'dark_store' | 'transit';
    description?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface WarehouseZone {
    id: string;
    warehouseId: string;
    name: string;
    type: 'cold' | 'dry' | 'hazardous' | 'racking' | 'pallet' | 'bin';
    capacity?: string;
    description?: string;
    isDeleted: boolean;
    createdAt: Date;
}

export interface Shelf {
    id: string;
    warehouseId: string;
    zoneId?: string;
    locationCode: string; // e.g. B-04
    level?: string;
    isFull: boolean;
    isDeleted: boolean;
    createdBy: string;
    createdAt: Date;
}

// ============ APPOINTMENTS ============

export type AppointmentStatus = 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
    id: string;
    businessId: string;
    customerId: string | null;
    customerName: string;
    customerPhone: string;

    serviceId: string;
    serviceName: string;
    durationMinutes: number; // e.g., 60

    employeeId: string; // Assigned staff member
    employeeName: string;

    startTime: Date;
    endTime: Date;

    status: AppointmentStatus;
    notes: string;

    totalPrice: number;
    paymentStatus: PaymentStatus;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Service {
    id: string;
    businessId: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    color: string; // Hex color for the calendar block
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
}

// ============ PROJECTS & TASKS ============

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
    id: string;
    businessId: string;

    name: string;
    description: string;

    customerId: string | null;
    customerName: string;

    managerId: string;  // Employee leading the project
    managerName: string;

    startDate: Date | null;
    endDate: Date | null;

    budget: number;
    actualCost: number;

    status: ProjectStatus;
    tags: string[];

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectTask {
    id: string;
    businessId: string;
    projectId: string;

    title: string;
    description: string;

    status: TaskStatus;
    priority: Priority;

    assignedTo: string | null; // Employee ID
    assignedToName: string | null;

    dueDate: Date | null;
    estimatedHours: number;
    loggedHours: number;

    orderIndex: number; // For drag and drop ordering within columns

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ ROOMS & BOOKINGS (Hotels, Coworking) ============

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type BookingStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Room {
    id: string;
    businessId: string;

    name: string; // e.g., "101", "Meeting Room A"
    type: string; // e.g., "Standard", "Suite", "Hot Desk"

    capacity: number;
    pricePerNight: number; // Or per hour depending on business type

    status: RoomStatus;
    amenities: string[];

    isDeleted: boolean;
}

export interface Booking {
    id: string;
    businessId: string;

    roomId: string;
    roomName: string;

    customerId: string | null;
    customerName: string;
    customerPhone: string;

    checkInTime: Date;
    checkOutTime: Date;

    status: BookingStatus;

    totalAmount: number;
    depositAmount: number;
    paidAmount: number;

    guestCount: number;
    notes: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ VEHICLES & TRIPS (Car Rental, Transport) ============

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'out_of_service';

export interface Vehicle {
    id: string;
    businessId: string;

    make: string; // e.g., "Toyota"
    model: string; // e.g., "Prius"
    plateNumber: string;

    category: string; // e.g., "Sedan", "Heavy Equipment"
    year: number;
    color: string;

    pricePerDay: number;
    depositAmount: number; // Required safety deposit

    status: VehicleStatus;
    conditionNotes: string; // Base condition/damages
    currentMileage: number;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Trip {
    id: string;
    businessId: string;

    vehicleId: string;
    vehicleName: string; // e.g., "Toyota Prius (0001 УБН)"

    customerId: string | null;
    customerName: string;
    customerPhone: string;

    driverId: string | null; // If rented with a driver/operator
    driverName: string | null;

    startDate: Date;
    endDate: Date;

    startMileage: number;
    endMileage: number | null;

    status: 'reserved' | 'active' | 'completed' | 'cancelled';

    totalAmount: number;
    paidAmount: number;
    depositHeld: number; // Actually held deposit

    damageMarkup: string; // JSON or link to before/after conditions
    notes: string;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ TICKETS & EVENTS (Events, Tourism, Entertainment) ============

export interface Event {
    id: string;
    businessId: string;

    title: string;
    description: string;

    venue: string; // e.g. "UG Arena", "Turquoise trip bus"

    startDate: Date;
    endDate: Date;

    totalCapacity: number;
    ticketsSold: number;

    basePrice: number;

    status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type TicketStatus = 'reserved' | 'paid' | 'checked_in' | 'cancelled';

export interface Ticket {
    id: string; // Used as the base for the QR Code
    businessId: string;

    eventId: string;
    eventTitle: string;

    customerId: string | null;
    customerName: string;
    customerPhone: string;

    seatNumber: string | null; // e.g., "A-12"
    ticketType: string; // e.g., "VIP", "Standard"

    price: number;
    status: TicketStatus;

    checkedInAt: Date | null;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ FINANCE & PAWNSHOP (Micro-loans, Pawn) ============

export type LoanStatus = 'active' | 'overdue' | 'closed' | 'foreclosed';

export interface PawnItem {
    id: string; // Used to track the physical item in vault
    businessId: string;

    categoryId: string; // e.g., "Electronics", "Gold"
    description: string; // e.g., "iPhone 14 Pro Max 256GB"
    estimatedValue: number;

    status: 'vault' | 'for_sale' | 'sold' | 'returned';

    isDeleted: boolean;
}

export interface Loan {
    id: string;
    businessId: string;

    customerId: string;
    customerName: string;
    customerPhone: string;

    pawnItemId: string | null; // Null if unsecured micro-loan
    pawnItemDescription: string | null;

    principalAmount: number;
    interestRatePercent: number; // e.g., 0.5 for 0.5%
    interestType: 'daily' | 'monthly';

    startDate: Date;
    dueDate: Date;

    totalPaid: number;
    currentBalance: number; // principal + accumulated interest - paid

    status: LoanStatus;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ SERVICE QUEUES (Car Wash, Salons, Repair) ============

export type QueueStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled';

export interface ServiceTicket {
    id: string; // e.g., "T-104"
    businessId: string;

    customerId: string | null;
    customerName: string;
    customerPhone: string;

    vehicleOrItemInfo: string; // e.g., "0001 УБН Prius 20", "Nail Polish"
    serviceName: string; // e.g., "Full Wash + Wax"

    price: number;

    assignedWorkerId: string | null;
    assignedWorkerName: string | null;

    status: QueueStatus;

    startTime: Date | null;
    endTime: Date | null;

    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ HR & ATTENDANCE (Цаг бүртгэл) ============

export interface Attendance {
    id: string; // Document ID
    businessId: string;

    employeeId: string;
    employeeName: string;

    dateString: string; // The specific day, e.g. "2024-03-15" for easy querying

    clockInTime: Date | null;
    clockOutTime: Date | null;

    breakStartTime: Date | null;
    breakEndTime: Date | null;

    totalWorkedMinutes: number; // Computed on clock-out

    notes: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ PAYROLL (Цалингийн систем) ============

export interface PayrollRule {
    id: string; // Usually same as employeeId for 1:1 mapping
    businessId: string;
    employeeId: string;
    employeeName: string;

    baseSalary: number; // Сарын үндсэн цалин
    hourlyRate: number; // Цагийн хөлс (0 if not hourly)
    commissionPercent: number; // Үйлчилгээ/Борлуулалтын хувь (0-100)

    isDeleted: boolean;
    updatedAt: Date;
}

export interface PayrollRecord {
    id: string;
    businessId: string;

    employeeId: string;
    employeeName: string;

    periodStart: string; // YYYY-MM-DD
    periodEnd: string;   // YYYY-MM-DD

    baseAmount: number;       // Олгох үндсэн цалингийн дүн
    commissionAmount: number; // Бодогдсон урамшуулал
    deductionAmount: number;  // Суутгал, Торгууль, Урьдчилгаа
    netPay: number;           // Гарт олгох цэвэр цалин

    status: 'draft' | 'paid';

    notes: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ PROCUREMENT (Нийлүүлэлт) ============

export interface Supplier {
    id: string;
    businessId: string;
    name: string;
    contactName?: string;
    phone: string;
    email?: string;
    address?: string;
    category?: string;
    rating?: number;
    isDeleted: boolean;
    createdAt: Date;
}

export interface PurchaseOrder {
    id: string;
    businessId: string;
    orderNumber: string;
    supplierId: string;
    supplierName: string;
    items: {
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    totalAmount: number;
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    expectedDate?: Date;
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ CRM & LEADS (Борлуулалт) ============

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
    id: string;
    businessId: string;
    customerName: string;
    phone: string;
    email?: string;
    source?: string;
    status: LeadStatus;
    value?: number;
    assignedTo?: string;
    assignedToName?: string;
    notes?: string;
    lastContactedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Quote {
    id: string;
    businessId: string;
    quoteNumber: string;
    customerId: string | null;
    customerName: string;
    customerPhone?: string;
    items: {
        productId: string | null;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    totalAmount: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    validUntil?: Date;
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoyaltyConfig {
    pointsPerUnit: number;
    minRedeemPoints: number;
    referralBonus: number;
    tiers: {
        id: string;
        name: string;
        minPoints: number;
        multiplier: number;
    }[];
}

// ============ MARKETING (Маркетинг) ============

export interface Campaign {
    id: string;
    businessId: string;
    name: string;
    type: 'email' | 'social' | 'sms' | 'event';
    status: 'draft' | 'active' | 'completed' | 'paused';
    budget?: number;
    startDate?: Date;
    endDate?: Date;
    stats: {
        reach: number;
        clicks: number;
        conversions: number;
        revenue: number;
    };
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============ FINANCE (Санхүү & Нэхэмжлэх) ============

export interface Invoice {
    id: string;
    businessId: string;
    invoiceNumber: string;
    orderId?: string;
    customerId: string | null;
    customerName: string;
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: 'unpaid' | 'paid' | 'overdue' | 'void';
    dueDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Expense {
    id: string;
    businessId: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    receiptUrl?: string;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BankAccount {
    id: string;
    businessId: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    currency: string;
    balance: number;
    isSyncEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PettyCashTransaction {
    id: string;
    businessId: string;
    type: 'income' | 'expense';
    amount: number;
    title: string;
    note?: string;
    recordedBy: string;
    createdAt: Date;
}

// ============ LOGISTICS & FLEET (BATCH 51-60) ============

export interface VehicleMaintenanceLog {
    id: string;
    vehicleId: string;
    date: Date;
    type: 'repair' | 'service' | 'inspection' | 'oil_change' | 'tire_change' | 'other';
    description: string;
    cost: number;
    mileageAtService: number;
    nextServiceMileage?: number;
    nextServiceDate?: Date;
    receiptUrl?: string;
    performedBy?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface FleetLog {
    id: string;
    vehicleId: string;
    date: Date;
    type: 'fuel' | 'gps_stat' | 'incident';
    value: number; // liters for fuel, km for gps_stat
    cost?: number; // for fuel
    location?: { lat: number; lng: number; address?: string };
    notes?: string;
    recordedBy: string;
    createdAt: Date;
}

export interface DeliveryRecord {
    id: string;
    businessId: string;
    orderId: string;
    orderNumber: string;

    driverId: string | null;
    driverName: string | null;

    status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'returned';
    priority: 'low' | 'normal' | 'high' | 'urgent';

    pickupTime?: Date;
    deliveryTime?: Date;
    estimatedDelivery?: Date;

    proofOfDelivery?: {
        recipientName?: string;
        signatureUrl?: string;
        photoUrls?: string[];
        notes?: string;
    };

    failureReason?: string;
    fare: number; // Delivery fee
    codAmount: number; // Balance to collect

    history: {
        status: string;
        at: Date;
        note?: string;
        location?: { lat: number; lng: number };
    }[];

    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}

export interface ImportCostCalculation {
    id: string;
    businessId: string;
    batchId?: string; // Cargo batch ID

    items: {
        productId: string;
        name: string;
        quantity: number;
        purchasePrice: number; // FOB/EXW price
        weight: number;
        volume: number;

        allocatedCosts: {
            freight: number;
            customs: number;
            insurance: number;
            handling: number;
            other: number;
        };

        finalLandedCost: number; // Per unit
        totalLandedCost: number; // For all units
    }[];

    totals: {
        purchaseAmount: number;
        freightAmount: number;
        customsAmount: number;
        insuranceAmount: number;
        handlingAmount: number;
        otherAmount: number;
        grandTotal: number;
    };

    currency: string;
    exchangeRate: number;
    status: 'draft' | 'finalized';

    createdAt: Date;
    updatedAt: Date;
}

// ============ SALES COMMISSIONS (61) ============
export interface SalesCommission {
    id: string;
    businessId: string;
    repId: string; // Employee ID
    repName: string;
    orderId: string;
    orderNumber: string;
    saleAmount: number;
    commissionRate: number; // e.g., 0.05 for 5%
    commissionAmount: number;
    status: 'pending' | 'calculated' | 'paid' | 'cancelled';
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============ EMAIL BUILDER (62) ============
export interface EmailTemplate {
    id: string;
    businessId: string;
    name: string;
    subject: string;
    content: string; // JSON or HTML
    category: 'marketing' | 'transactional' | 'internal';
    isDefault: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============ SOCIAL LISTENING (63) ============
export interface SocialMention {
    id: string;
    businessId: string;
    platform: 'facebook' | 'instagram' | 'twitter' | 'google' | 'other';
    authorName: string;
    authorImage?: string;
    content: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    link: string;
    status: 'new' | 'replied' | 'ignored';
    createdAt: Date;
}

// ============ VOUCHERS & COUPONS (69) ============
export interface Voucher {
    id: string;
    businessId: string;
    code: string; // e.g., 'SAVE20'
    type: 'fixed' | 'percentage';
    value: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    startDate: Date;
    endDate: Date;
    usageLimit: number;
    usageCount: number;
    isActive: boolean;
    applicableProducts?: string[]; // IDs
    applicableCategories?: string[]; // IDs
    createdAt: Date;
    updatedAt: Date;
}

// ============ FRANCHISE (70) ============
export interface FranchiseReport {
    id: string;
    businessId: string;
    branchId: string;
    branchName: string;
    period: string; // e.g., '2024-03'
    netSales: number;
    royaltyRate: number; // e.g., 0.03 for 3%
    royaltyAmount: number;
    adFeeAmount?: number;
    status: 'pending' | 'billed' | 'paid';
    createdAt: Date;
    updatedAt: Date;
}

// ============ INDUSTRY HUB (71-80) ============

export interface RestaurantTable {
    id: string;
    name: string;
    section: string;
    status: 'empty' | 'occupied' | 'reserved' | 'dirty';
    guestCount: number;
    currentOrderId?: string;
    capacity: number;
    x: number; // For floor plan positioning
    y: number;
}

export interface MenuItem extends Product {
    category: string;
    isSpicy?: boolean;
    isVegetarian?: boolean;
    prepTimeMinutes?: number;
    ingredients: string[];
}

export interface RecipeBOM {
    id: string;
    productId: string;
    ingredients: {
        materialId: string;
        materialName: string;
        quantity: number;
        unit: string;
        costPerUnit: number;
    }[];
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    lastUpdated: Date;
}

export interface KDSOrder {
    id: string;
    orderId: string;
    tableId?: string;
    tableName?: string;
    items: {
        id: string;
        name: string;
        quantity: number;
        status: 'pending' | 'preparing' | 'ready' | 'served';
        notes?: string;
    }[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    startedAt?: Date;
    completedAt?: Date;
    status: 'queue' | 'preparing' | 'ready' | 'completed';
}

export interface VendingMachine {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'maintenance';
    slots: {
        id: string;
        productId: string;
        productName: string;
        currentStock: number;
        maxStock: number;
        price: number;
    }[];
    lastPing: Date;
    totalSales: number;
}

// ============ SMS BANK SYNC ============
export interface SmsTransaction {
    id: string;
    bizId: string;
    rawBody: string;
    sender: string;
    amount: number;
    currency: string;
    date: Date;
    transactionId?: string;
    description?: string;
    isMatched: boolean;
    matchedOrderId?: string;
    status: 'pending' | 'matched' | 'ignored';
    createdAt: Date;
}

export interface SmsSyncConfig {
    bizId: string;
    apiKey: string;
    isEnabled: boolean;
    lastSyncAt?: Date;
    connectedDeviceName?: string;
}
