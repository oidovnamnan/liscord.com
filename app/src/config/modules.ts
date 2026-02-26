import type { AppModule } from '../types';

export const LISCORD_MODULES: AppModule[] = [
    // --- 1. Operations Core (Most Important) ---
    {
        id: 'orders',
        name: 'Захиалга',
        description: 'Захиалга удирдлага болон борлуулалтын систем.',
        icon: 'PackageSearch',
        route: '/app/orders',
        isCore: true,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'products',
        name: 'Бараа Материал',
        description: 'Бараа бүтээгдэхүүний нэр төрөл, үнэ болон ангилал.',
        icon: 'Box',
        route: '/app/products',
        isCore: true,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'inventory',
        name: 'Агуулах / Нөөц',
        description: 'Барааны үлдэгдэл болон нөөцийн менежмент.',
        icon: 'Boxes',
        route: '/app/inventory',
        isCore: true,
        category: 'operations',
        hubId: 'inventory-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'analytics',
        name: 'Анализ & Тайлан',
        description: 'Бизнесийн өсөлтийн нарийвчилсан статистик графикууд.',
        icon: 'BarChart3',
        route: '/app/reports',
        isCore: true,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 2. Finance Hub ---
    {
        id: 'finance',
        name: 'Санхүү',
        description: 'Орлого, зарлага болон НӨАТ-ын тайлан.',
        icon: 'Wallet',
        route: '/app/finance',
        isCore: false,
        category: 'finance',
        hubId: 'finance-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'payments',
        name: 'Төлбөр Тооцоо',
        description: 'Харилцагчдын төлбөрийн түүх болон бүртгэл.',
        icon: 'CreditCard',
        route: '/app/payments',
        isCore: false,
        category: 'finance',
        hubId: 'finance-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'loans',
        name: 'Зээл / Ломбард',
        description: 'Зээлийн тооцоо, барьцаа болон зээлийн гэрээ.',
        icon: 'Banknote',
        route: '/app/loans',
        isCore: false,
        category: 'finance',
        hubId: 'finance-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },

    // --- 3. CRM & Sales Hub ---
    {
        id: 'customers',
        name: 'Хэрэглэгчид (CRM)',
        description: 'Харилцагчийн түүх, сегментчлэл, CRM систем.',
        icon: 'Contact',
        route: '/app/customers',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'messenger',
        name: 'Чаат & Харилцаа',
        description: 'Сошиал сувгуудын зурвасуудыг нэг цонхноос хариулах.',
        icon: 'MessageCircle',
        route: '/app/chat',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'b2b',
        name: 'B2B Marketplace',
        description: 'Бусад бизнесүүдтэй холбогдох, бараа нийлүүлэлт.',
        icon: 'Globe',
        route: '/app/b2b',
        isCore: false,
        category: 'sales',
        hubId: 'b2b-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'b2b-provider',
        name: 'Нийлүүлэгч самбар',
        description: 'Нийлүүлэгчийн удирдлагын хянах самбар.',
        icon: 'Building2',
        route: '/app/b2b-provider',
        isCore: false,
        category: 'sales',
        hubId: 'b2b-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },

    // --- 4. Staff & HR Hub ---
    {
        id: 'employees',
        name: 'Ажилтан',
        description: 'Ажилчдын мэдээлэл, албан тушаал, эрхийн удирдлага.',
        icon: 'Users',
        route: '/app/employees',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'attendance',
        name: 'Ирц бүртгэл',
        description: 'Цаг бүртгэл, хоцролт болон ирцийн статистик.',
        icon: 'Clock',
        route: '/app/attendance',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'payroll',
        name: 'Цалин Бодолт',
        description: 'Цалин бодолт, урьдчилгаа болон шимтгэлийн тооцоо.',
        icon: 'Coins',
        route: '/app/payroll',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 5. Logistics & Cargo ---
    {
        id: 'cargo',
        name: 'Карго Тээвэр',
        description: 'Илгээмж бүртгэл, AI текст унших каргоны систем.',
        icon: 'Truck',
        route: '/app/packages',
        isCore: false,
        category: 'services',
        hubId: 'logistics-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'delivery',
        name: 'Хүргэлт',
        description: 'Түгээлт, жолооч болон хүргэлтийн төлөв хянах.',
        icon: 'MapPin',
        route: '/app/delivery',
        isCore: false,
        category: 'services',
        hubId: 'logistics-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'vehicles',
        name: 'Авто Парк',
        description: 'Тээврийн хэрэгсэл, техник түрээс болон бүртгэл.',
        icon: 'Car',
        route: '/app/vehicles',
        isCore: false,
        category: 'services',
        hubId: 'logistics-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 6. Manufacturing & Projects ---
    {
        id: 'manufacturing',
        name: 'Үйлдвэрлэл',
        description: 'Бүтээгдэхүүн үйлдвэрлэлийн процесс, өртөг тооцоолол.',
        icon: 'Factory',
        route: '/app/manufacturing',
        isCore: false,
        category: 'operations',
        hubId: 'inventory-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'projects',
        name: 'Төсөл',
        description: 'Төслийн төлөвлөлт, гүйцэтгэл, канбан самбар.',
        icon: 'Briefcase',
        route: '/app/projects',
        isCore: false,
        category: 'operations',
        hubId: 'projects-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 7. Specialized Services ---
    {
        id: 'appointments',
        name: 'Цаг захиалга',
        description: 'Үйлчилгээний цаг захиалга болон календарь.',
        icon: 'CalendarClock',
        route: '/app/appointments',
        isCore: false,
        category: 'services',
        hubId: 'services-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'rooms',
        name: 'Өрөө / Талбай',
        description: 'Зочид буудал, дундын оффис, өрөө түрээсийн удирдлага.',
        icon: 'DoorOpen',
        route: '/app/rooms',
        isCore: false,
        category: 'services',
        hubId: 'services-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'queue',
        name: 'Очер дараалал',
        description: 'Дараалал үүсгэх, дугаар олгох үйлчилгээний систем.',
        icon: 'ListOrdered',
        route: '/app/queue',
        isCore: false,
        category: 'services',
        hubId: 'services-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'support',
        name: 'Гомдол & Буцаалт',
        description: 'Хэрэглэгчийн санал гомдол, баталгаат засвар, буцаалт.',
        icon: 'LifeBuoy',
        route: '/app/support',
        isCore: false,
        category: 'services',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'contracts',
        name: 'Гэрээ',
        description: 'Түрээс, хамтын ажиллагааны гэрээний менежмент.',
        icon: 'FileText',
        route: '/app/contracts',
        isCore: false,
        category: 'services',
        hubId: 'services-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'tickets',
        name: 'Тасалбар / Tickets',
        description: 'Дэмжлэгийн тасалбар, ивент тасалбар бүртгэл.',
        icon: 'Ticket',
        route: '/app/tickets',
        isCore: false,
        category: 'operations',
        hubId: 'projects-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    }
];

export const CORE_MODULES = LISCORD_MODULES.filter(m => m.isCore).map(m => m.id);
