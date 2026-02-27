import type { BusinessCategory } from '../types';

export interface BusinessFeatures {
    hasOrders: boolean;       // Orders, Sales
    hasProducts: boolean;     // Standard Products/Menu
    hasInventory: boolean;    // Advanced Warehouse/Stock
    hasDelivery: boolean;     // Delivery Tracking
    hasPackages: boolean;     // Cargo AI tracking
    hasAppointments: boolean; // Calendar, Bookings, Appointments
    hasContracts: boolean;    // Leases, Pawn Tickets, Rental Agreements
    hasVehicles: boolean;     // Car Rental, Equipment, Transport
    hasRooms: boolean;        // Hotels, Coworking, Storage
    hasTickets: boolean;      // Events, Transport seats
    hasProjects: boolean;     // Construction, Agency, Printing
}

const DEFAULT_FEATURES: BusinessFeatures = {
    hasOrders: true,
    hasProducts: true,
    hasInventory: false,
    hasDelivery: false,
    hasPackages: false,
    hasAppointments: false,
    hasContracts: false,
    hasVehicles: false,
    hasRooms: false,
    hasTickets: false,
    hasProjects: false,
};

// Map each of the 44 categories to their specific UI needs
export const CATEGORY_FEATURES: Record<BusinessCategory, BusinessFeatures> = {
    custom: { ...DEFAULT_FEATURES, hasInventory: true, hasDelivery: true },
    // --- Original 11 ---
    cargo: { ...DEFAULT_FEATURES, hasProducts: false, hasDelivery: true, hasPackages: true },
    wholesale: { ...DEFAULT_FEATURES, hasInventory: true, hasDelivery: true },
    online_shop: { ...DEFAULT_FEATURES, hasDelivery: true },
    food_delivery: { ...DEFAULT_FEATURES, hasDelivery: true },
    repair: { ...DEFAULT_FEATURES, hasInventory: true, hasAppointments: true },
    printing: { ...DEFAULT_FEATURES, hasProjects: true },
    furniture: { ...DEFAULT_FEATURES, hasInventory: true, hasProjects: true },
    flowers: { ...DEFAULT_FEATURES, hasDelivery: true },
    pharmacy: { ...DEFAULT_FEATURES, hasInventory: true },
    auto_parts: { ...DEFAULT_FEATURES, hasInventory: true },

    // --- New Layout Categories ---
    beauty_salon: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true },
    tailoring: { ...DEFAULT_FEATURES, hasAppointments: true, hasProjects: true },
    real_estate: { ...DEFAULT_FEATURES, hasProducts: false, hasContracts: true, hasRooms: true },
    education: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true }, // Classes
    rentals: { ...DEFAULT_FEATURES, hasContracts: true, hasInventory: true },
    events: { ...DEFAULT_FEATURES, hasProducts: false, hasTickets: true },
    cleaning: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true },
    clinic: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true },
    agency: { ...DEFAULT_FEATURES, hasProducts: false, hasProjects: true, hasContracts: true },
    veterinary: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true, hasInventory: true },
    laundry: { ...DEFAULT_FEATURES, hasOrders: true, hasPackages: true }, // Use packages for tracking laundry items
    utilities: { ...DEFAULT_FEATURES, hasProducts: false, hasContracts: true, hasDelivery: true },
    tourism: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true, hasTickets: true, hasProjects: true },
    fitness: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true, hasContracts: true },

    // --- Massive Expansion ---
    construction: { ...DEFAULT_FEATURES, hasProducts: false, hasInventory: true, hasProjects: true, hasContracts: true },
    heavy_equipment: { ...DEFAULT_FEATURES, hasProducts: false, hasVehicles: true, hasContracts: true },
    car_rental: { ...DEFAULT_FEATURES, hasProducts: false, hasVehicles: true, hasContracts: true },
    pawnshop: { ...DEFAULT_FEATURES, hasProducts: false, hasInventory: true, hasContracts: true },
    car_wash: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true, hasOrders: true },
    photo_studio: { ...DEFAULT_FEATURES, hasProducts: false, hasAppointments: true },
    bakery: { ...DEFAULT_FEATURES, hasInventory: true },
    bar_pub: { ...DEFAULT_FEATURES, hasInventory: true }, // Needs Tabs
    hotel: { ...DEFAULT_FEATURES, hasProducts: false, hasRooms: true, hasAppointments: true },
    coworking: { ...DEFAULT_FEATURES, hasProducts: false, hasRooms: true, hasContracts: true },
    agriculture: { ...DEFAULT_FEATURES, hasInventory: true, hasProjects: true },
    delivery_fleet: { ...DEFAULT_FEATURES, hasProducts: false, hasDelivery: true, hasPackages: true, hasVehicles: true },
    childcare: { ...DEFAULT_FEATURES, hasProducts: false, hasContracts: true, hasAppointments: true },
    entertainment: { ...DEFAULT_FEATURES, hasProducts: false, hasRooms: true, hasAppointments: true },
    hardware_store: { ...DEFAULT_FEATURES, hasInventory: true },
    thrift_store: { ...DEFAULT_FEATURES, hasInventory: true, hasContracts: true }, // Consignment contracts
    moving: { ...DEFAULT_FEATURES, hasProducts: false, hasDelivery: true, hasVehicles: true },
    transport: { ...DEFAULT_FEATURES, hasProducts: false, hasTickets: true, hasVehicles: true },
    storage: { ...DEFAULT_FEATURES, hasProducts: false, hasRooms: true, hasContracts: true },

    // --- General ---
    general: { ...DEFAULT_FEATURES },
};

export const getFeatures = (category?: BusinessCategory): BusinessFeatures => {
    if (!category) return DEFAULT_FEATURES;
    return CATEGORY_FEATURES[category] || DEFAULT_FEATURES;
};
