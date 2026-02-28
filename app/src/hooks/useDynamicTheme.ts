import { useEffect } from 'react';
import { useBusinessStore } from '../store';

// Default theme colors based on business category
export const CATEGORY_COLORS: Record<string, string> = {
    'cargo': '#3498db',         // Blue
    'cargo_import': '#3498db',  // Blue
    'wholesale': '#27ae60',     // Green
    'online_store': '#e84393',  // Pink
    'social_store': '#e84393',  // Pink
    'food_delivery': '#e67e22', // Orange
    'repair_service': '#3b82f6',// Slate Blue
    'beauty_salon': '#9b59b6',  // Purple
    'hotel': '#1abc9c',         // Teal
    'car_rental': '#e74c3c',    // Red
    'default': '#6c5ce7'        // Liscord Purple (Default)
};

export const useDynamicTheme = () => {
    const { business } = useBusinessStore();

    useEffect(() => {
        if (!business) return;

        // Determine the base color
        // 1. Check if the business explicitly set a custom brand color
        // 2. Fallback to category default
        // 3. Fallback to global default
        let themeColor = CATEGORY_COLORS['default'];

        if (business.brandColor) {
            themeColor = business.brandColor;
        } else if (business.category && CATEGORY_COLORS[business.category]) {
            themeColor = CATEGORY_COLORS[business.category];
        }

        // Apply it to the CSS variables on the root document
        const root = document.documentElement;

        // Main primary color
        root.style.setProperty('--primary', themeColor);

        // Helper to convert hex to rgb for opacity-based backgrounds
        const hexToRgb = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };

        if (themeColor.startsWith('#')) {
            try {
                const rgb = hexToRgb(themeColor);
                root.style.setProperty('--primary-rgb', rgb);
                root.style.setProperty('--primary-light', `rgba(${rgb}, 0.15)`);
                root.style.setProperty('--primary-tint', `rgba(${rgb}, 0.08)`);
            } catch (e) {
                console.warn('Failed to parse brand color for RGB extraction', e);
            }
        }

        return () => {
            // Optional cleanup if we want to reset when unmounting the whole app
            // root.style.removeProperty('--primary');
        };
    }, [business?.category, business?.brandColor]);
};
