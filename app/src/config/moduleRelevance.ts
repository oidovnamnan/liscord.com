/**
 * Module Relevance System
 * 
 * Determines how relevant each module is for each business category.
 * Used in SuperAdmin → Модуль Тохиргоо to auto-sort and color-code modules.
 */

export type RelevanceLevel = 'essential' | 'important' | 'optional' | 'not-needed';

export const RELEVANCE_ORDER: Record<RelevanceLevel, number> = {
    'essential': 0,
    'important': 1,
    'optional': 2,
    'not-needed': 3,
};

export const RELEVANCE_META: Record<RelevanceLevel, { label: string; color: string; bg: string; icon: string }> = {
    'essential': { label: 'Зайлшгүй', color: 'var(--accent-red)', bg: 'var(--red-tint)', icon: '🔴' },
    'important': { label: 'Чухал', color: 'var(--accent-orange)', bg: 'var(--orange-tint)', icon: '🟠' },
    'optional': { label: 'Боломжтой', color: 'var(--primary)', bg: 'var(--primary-light)', icon: '🔵' },
    'not-needed': { label: 'Шаардлагагүй', color: 'var(--text-tertiary)', bg: 'var(--bg-soft)', icon: '⚪' },
};

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL modules — relevant to ALL business categories
// ═══════════════════════════════════════════════════════════════

const UNIVERSAL_ESSENTIAL = ['orders', 'products', 'customers'];
const UNIVERSAL_IMPORTANT = ['payments', 'invoices', 'employees', 'ebarimt', 'finance'];
const UNIVERSAL_OPTIONAL = [
    'barcodes', 'attendance', 'payroll', 'expenses', 'sms-income-sync',
    'analytics', 'custom-reports', 'notes', 'documents', 'data-backup',
    'announcements', 'internal-chat', 'email-smtp', 'push-notifications',
    'audit-trail', 'role-manager', 'access-policy', 'two-factor-auth',
    'sso', 'pass-manager', 'ip-whitelist',
];

// ═══════════════════════════════════════════════════════════════
// CATEGORY-SPECIFIC relevance overrides
// Only specify what DIFFERS from the universal defaults above.
// Anything not listed → 'optional' or 'not-needed' (see logic below)
// ═══════════════════════════════════════════════════════════════

const CATEGORY_RELEVANCE: Record<string, { essential?: string[]; important?: string[]; optional?: string[]; 'not-needed'?: string[] }> = {
    // ─── Карго / Импорт ───
    cargo: {
        essential: ['inventory', 'delivery-app', 'dispatch', 'customs', 'freight', 'multi-warehouse'],
        important: ['procurement', 'wms', 'barcodes', 'cross-docking', 'gps-tracking', 'route-optimize', 'packaging', 'multi-currency', 'quality-control', 'import-cost'],
        optional: ['fleet', 'rma', 'audit-inventory', 'insurance', 'cold-storage'],
        'not-needed': ['appointments', 'rooms', 'vehicles', 'queue', 'loyalty', 'salon', 'hotel-mgt', 'karaoke', 'gym-fitness', 'billiards', 'table-booking', 'digital-menu', 'kds'],
    },

    // ─── Бөөний худалдаа ───
    wholesale: {
        essential: ['inventory', 'procurement', 'barcodes', 'pricing-rules'],
        important: ['multi-warehouse', 'wms', 'delivery-app', 'b2b-portal', 'product-variants', 'audit-inventory', 'serial-tracking'],
        optional: ['drop-shipping', 'rma', 'quality-control', 'packaging', 'fleet', 'warehouse', 'import-cost'],
        'not-needed': ['appointments', 'rooms', 'vehicles', 'queue', 'salon', 'hotel-mgt', 'karaoke', 'gym-fitness', 'table-booking', 'digital-menu'],
    },

    // ─── Онлайн / Сошиал шоп ───
    online_shop: {
        essential: ['inventory', 'delivery-app', 'e-commerce'],
        important: ['barcodes', 'product-variants', 'messenger', 'campaigns', 'loyalty', 'facebook-shop', 'tiktok-shop', 'instagram-api'],
        optional: ['pricing-rules', 'drop-shipping', 'packaging', 'vouchers', 'affiliate', 'seo-tools', 'google-analytics'],
        'not-needed': ['rooms', 'vehicles', 'queue', 'appointments', 'hotel-mgt', 'karaoke', 'wms', 'customs'],
    },

    // ─── Хоол / Хүргэлт ───
    food_delivery: {
        essential: ['delivery-app', 'kds', 'pos', 'digital-menu'],
        important: ['dispatch', 'route-optimize', 'gps-tracking', 'loyalty', 'messenger', 'queue'],
        optional: ['food-costing', 'food-safety', 'table-booking', 'kitchen-printer', 'campaigns'],
        'not-needed': ['rooms', 'vehicles', 'customs', 'wms', 'serial-tracking', 'warranty', 'loans', 'hotel-mgt'],
    },

    // ─── Гоо сайхан / Салон ───
    beauty_salon: {
        essential: ['appointments', 'queue', 'pos'],
        important: ['loyalty', 'messenger', 'campaigns', 'membership', 'shifts'],
        optional: ['vouchers', 'e-commerce', 'instagram-api', 'salon'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'delivery-app', 'rooms', 'vehicles', 'customs', 'serial-tracking', 'b2b-portal', 'freight'],
    },

    // ─── Засвар үйлчилгээ ───
    repair: {
        essential: ['inventory', 'appointments', 'warranty'],
        important: ['serial-tracking', 'rma', 'queue', 'barcodes', 'pos'],
        optional: ['delivery-app', 'procurement', 'product-variants', 'messenger'],
        'not-needed': ['rooms', 'vehicles', 'customs', 'hotel-mgt', 'wms', 'multi-warehouse', 'digital-menu', 'kds'],
    },

    // ─── Зочид буудал ───
    hotel: {
        essential: ['rooms', 'appointments', 'pos'],
        important: ['loyalty', 'membership', 'shifts', 'queue', 'digital-menu', 'table-booking'],
        optional: ['delivery-app', 'messenger', 'campaigns', 'vouchers', 'kds', 'laundry'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'customs', 'serial-tracking', 'freight', 'b2b-portal'],
    },

    // ─── Авто түрээс ───
    car_rental: {
        essential: ['vehicles', 'appointments'],
        important: ['fleet', 'gps-tracking', 'contracts', 'insurance', 'pos'],
        optional: ['delivery-app', 'maintenance', 'messenger', 'loyalty'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'customs', 'rooms', 'digital-menu', 'kds', 'queue'],
    },

    // ─── Авто угаалга ───
    car_wash: {
        essential: ['appointments', 'queue', 'pos'],
        important: ['loyalty', 'membership', 'shifts', 'messenger'],
        optional: ['campaigns', 'vouchers', 'e-commerce'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'delivery-app', 'rooms', 'vehicles', 'customs', 'serial-tracking', 'freight'],
    },

    // ─── Үл хөдлөх ───
    real_estate: {
        essential: ['rooms', 'contracts'],
        important: ['property-mgt', 'messenger', 'leads', 'pos'],
        optional: ['campaigns', 'e-commerce', 'documents', 'maintenance'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'delivery-app', 'customs', 'serial-tracking', 'vehicles', 'digital-menu', 'kds', 'queue'],
    },

    // ─── Боловсрол / Сургалт ───
    education: {
        essential: ['appointments', 'membership'],
        important: ['e-learning', 'calendar', 'messenger', 'pos', 'attendance'],
        optional: ['campaigns', 'vouchers', 'documents', 'surveys', 'training'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'delivery-app', 'customs', 'rooms', 'vehicles', 'serial-tracking', 'freight'],
    },

    // ─── Барилга ───
    construction: {
        essential: ['inventory', 'projects', 'procurement'],
        important: ['bom', 'milestones', 'gantt-chart', 'barcodes', 'fleet', 'contracts'],
        optional: ['quality-control', 'gps-tracking', 'multi-warehouse', 'wms', 'sub-contracting'],
        'not-needed': ['appointments', 'queue', 'rooms', 'salon', 'hotel-mgt', 'digital-menu', 'kds', 'loyalty'],
    },

    // ─── Эм зүй / Фармаси ───
    pharmacy: {
        essential: ['inventory', 'barcodes', 'pos'],
        important: ['procurement', 'serial-tracking', 'product-variants', 'pricing-rules', 'audit-inventory'],
        optional: ['delivery-app', 'multi-warehouse', 'quality-control', 'e-commerce', 'loyalty'],
        'not-needed': ['rooms', 'vehicles', 'customs', 'hotel-mgt', 'appointments', 'queue', 'digital-menu', 'kds', 'wms'],
    },

    // ─── Фитнесс / Gym ───
    fitness: {
        essential: ['appointments', 'membership', 'pos'],
        important: ['queue', 'shifts', 'loyalty', 'attendance', 'gym-fitness'],
        optional: ['campaigns', 'vouchers', 'e-commerce', 'messenger', 'training'],
        'not-needed': ['inventory', 'procurement', 'wms', 'barcodes', 'multi-warehouse', 'delivery-app', 'customs', 'rooms', 'vehicles', 'serial-tracking'],
    },

    // ─── Тавилга / Интерьер ───
    furniture: {
        essential: ['inventory', 'procurement', 'projects'],
        important: ['barcodes', 'product-variants', 'delivery-app', 'pricing-rules', 'wms'],
        optional: ['multi-warehouse', 'audit-inventory', 'rma', 'warranty', 'e-commerce'],
        'not-needed': ['rooms', 'vehicles', 'customs', 'queue', 'appointments', 'hotel-mgt', 'salon', 'digital-menu', 'kds'],
    },

    // ─── Цэцэг / Бэлэг ───
    flowers: {
        essential: ['delivery-app', 'pos'],
        important: ['e-commerce', 'messenger', 'loyalty', 'campaigns', 'vouchers'],
        optional: ['product-variants', 'pricing-rules', 'packaging', 'route-optimize'],
        'not-needed': ['rooms', 'vehicles', 'customs', 'wms', 'serial-tracking', 'warranty', 'appointments', 'hotel-mgt', 'queue'],
    },
};

/**
 * Get the relevance level of a module for a specific business category.
 * Priority: category-specific override → universal → default fallback
 */
export function getModuleRelevance(categoryId: string, moduleId: string): RelevanceLevel {
    // 1. Check category-specific overrides
    const catConfig = CATEGORY_RELEVANCE[categoryId];
    if (catConfig) {
        if (catConfig.essential?.includes(moduleId)) return 'essential';
        if (catConfig.important?.includes(moduleId)) return 'important';
        if (catConfig.optional?.includes(moduleId)) return 'optional';
        if (catConfig['not-needed']?.includes(moduleId)) return 'not-needed';
    }

    // 2. Check universal defaults
    if (UNIVERSAL_ESSENTIAL.includes(moduleId)) return 'essential';
    if (UNIVERSAL_IMPORTANT.includes(moduleId)) return 'important';
    if (UNIVERSAL_OPTIONAL.includes(moduleId)) return 'optional';

    // 3. If category has overrides but module not mentioned → optional
    // If no category config at all → optional (safe default)
    return 'optional';
}
