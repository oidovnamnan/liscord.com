/**
 * Module Accessibility Utilities
 * 
 * Модулийн харагдах/нэвтрэх эрхийг нэг газраас шийдвэрлэнэ.
 * Sidebar, ModuleGuard, HubLayout, SettingsPage бүгд энэ helper-ийг ашиглана.
 */

import { LISCORD_MODULES } from '../config/modules';
import type { AppModule, Business } from '../types';

type ModuleDefaults = Record<string, Record<string, string>>;

/**
 * Check if a module subscription has expired
 */
export function isSubscriptionExpired(business: Business | null, moduleId: string): boolean {
    const subscription = business?.moduleSubscriptions?.[moduleId];
    if (!subscription?.expiresAt) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expiresAt = subscription.expiresAt as any;
    const expiryDate = typeof expiresAt.toDate === 'function'
        ? expiresAt.toDate()
        : new Date(expiresAt);

    return expiryDate < new Date();
}

/**
 * Check if a module is accessible for a given business
 * 
 * Returns { accessible, reason } for debugging & UI display
 */
export function isModuleAccessible(
    moduleId: string,
    business: Business | null,
    moduleDefaults?: ModuleDefaults
): { accessible: boolean; reason: string } {
    if (!business) return { accessible: false, reason: 'no_business' };

    // 1. Core modules are always accessible
    const mod = LISCORD_MODULES.find(m => m.id === moduleId);
    if (mod?.isCore) return { accessible: true, reason: 'core' };

    // 2. Check if explicitly enabled (installed via App Store)
    const isInstalled = business.activeModules?.includes(moduleId) ?? false;

    // 3. Check if module is "core" for this business category (via SuperAdmin defaults)
    const isCategoryCore = moduleDefaults?.[business.category]?.[moduleId] === 'core';

    if (!isInstalled && !isCategoryCore) {
        return { accessible: false, reason: 'not_installed' };
    }

    // 4. Check subscription expiry
    if (isSubscriptionExpired(business, moduleId)) {
        return { accessible: false, reason: 'expired' };
    }

    return { accessible: true, reason: isInstalled ? 'installed' : 'category_core' };
}

/**
 * Get all modules visible in the sidebar for a given business
 * 
 * Includes hub deduplication logic
 */
export function getVisibleModules(
    business: Business | null,
    moduleDefaults: ModuleDefaults
): AppModule[] {
    if (!business) return LISCORD_MODULES.filter(m => m.isCore);

    return LISCORD_MODULES.filter((mod, index, self) => {
        // Core modules always visible
        if (mod.isCore) return true;

        // Hide modules that are purely for Settings page
        const placement = mod.placement || 'sidebar';
        if (placement === 'settings') return false;

        // Check accessibility (includes activeModules, category core, and expiry)
        const { accessible } = isModuleAccessible(mod.id, business, moduleDefaults);
        if (!accessible) return false;

        // Hub deduplication: only show the first enabled module per hub
        if (mod.hubId) {
            return self.findIndex(m =>
                m.hubId === mod.hubId && isModuleAccessible(m.id, business, moduleDefaults).accessible
            ) === index;
        }

        return true;
    });
}
