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
        hasSettings: true,
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
        route: '/app/analytics',
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
        route: '/app/messenger',
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
        hasSettings: true,
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
        route: '/app/cargo',
        isCore: false,
        hasSettings: true,
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
    },

    // --- 8. Retail & E-Commerce ---
    {
        id: 'pos',
        name: 'ПОС / Касс',
        description: 'Дэлгүүр болон худалдааны цэгийн борлуулалтын систем.',
        icon: 'Terminal',
        route: '/app/pos',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'barcodes',
        name: 'Баркод & Шошго',
        description: 'Барааны баркод үүсгэх, хэвлэх, скан хийх төхөөрөмжийн холболт.',
        icon: 'Barcode',
        route: '/app/barcodes',
        isCore: false,
        category: 'operations',
        hubId: 'inventory-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'procurement',
        name: 'Худалдан Авалт',
        description: 'Нийлүүлэгчдээс бараа захиалах, тендер, нийлүүлэлтийн хяналт.',
        icon: 'ShoppingCart',
        route: '/app/procurement',
        isCore: false,
        category: 'operations',
        hubId: 'inventory-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'branches',
        name: 'Салбар Удирдлага',
        description: 'Олон салбар хоорондын бараа шилжүүлэг, нэгдсэн хяналт.',
        icon: 'Network',
        route: '/app/branches',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },

    // --- 9. Financial Advanced ---
    {
        id: 'ebarimt',
        name: 'И-Баримт (НӨАТ)',
        description: 'Татварын системийн холболт, НӨАТ-ын баримт хэвлэх.',
        icon: 'Stamp',
        route: '/app/ebarimt',
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
        id: 'invoices',
        name: 'Нэхэмжлэх & И-Мэйл',
        description: 'Цахим нэхэмжлэл (E-invoice) үүсгэх, имэйлээр илгээх, сануулах.',
        icon: 'Receipt',
        route: '/app/invoices',
        isCore: false,
        category: 'finance',
        hubId: 'finance-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'expenses',
        name: 'Зардлын Хяналт',
        description: 'Томилолт болон урсгал зардлын хүсэлт, төсөв хяналт.',
        icon: 'ReceiptText',
        route: '/app/expenses',
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
        id: 'assets',
        name: 'Үндсэн Хөрөнгө',
        description: 'Байгууллагын үндсэн хөрөнгийн бүртгэл, элэгдэл тооцоолол.',
        icon: 'Laptop',
        route: '/app/assets',
        isCore: false,
        category: 'finance',
        hubId: 'finance-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 10. Marketing & Online ---
    {
        id: 'campaigns',
        name: 'Маркетинг / Урамшуулал',
        description: 'Промо код, хөнгөлөлт, бөөнөөр и-мэйл/мессеж илгээх.',
        icon: 'Megaphone',
        route: '/app/campaigns',
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
        id: 'loyalty',
        name: 'Лоялти & Оноо',
        description: 'Хэрэглэгчийн гишүүнчлэл, урамшууллын оноо цуглуулах систем.',
        icon: 'Star',
        route: '/app/loyalty',
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
        id: 'website',
        name: 'Вэбсайт Бүтээгч',
        description: 'Бизнесийн өөрийн онлайн дэлгүүр, лендинг хуудсыг кодгүйгээр үүсгэх.',
        icon: 'Globe',
        route: '/app/website',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },

    // --- 11. Advanced HR ---
    {
        id: 'recruitment',
        name: 'Сонгон Шалгаруулалт',
        description: 'Ажлын байрны зар, анкет цуглуулах, ярилцлагын явц.',
        icon: 'UserPlus',
        route: '/app/recruitment',
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
        id: 'leave',
        name: 'Чөлөө & Ээлжийн амралт',
        description: 'Чөлөөний хүсэлт, өвчтэй болон амралтын бүртгэл зохицуулалт.',
        icon: 'CalendarOff',
        route: '/app/leave',
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
        id: 'performance',
        name: 'Гүйцэтгэлийн Үнэлгээ',
        description: 'KPI, зорилтот хэмжүүр (OKR), ажилтны үнэлгээний систем.',
        icon: 'Target',
        route: '/app/performance',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },

    // --- 12. Niche / Specific Verticals ---
    {
        id: 'restaurant',
        name: 'Ресторан & Кафе',
        description: 'Хоолны орц, жор, ширээний захиалга (KOT/BOT), дижитал цэс.',
        icon: 'Utensils',
        route: '/app/restaurant',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'education',
        name: 'Сургалт & Курс',
        description: 'Сургалтын төв, анги бүрдүүлэлт, сурагчдын ирц болон дүн.',
        icon: 'GraduationCap',
        route: '/app/education',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'fitness',
        name: 'Фитнес & Клуб',
        description: 'Гишүүнчлэлийн бүртгэл, хугацаатай эрх, дасгалжуулагчийн хуваарь.',
        icon: 'Dumbbell',
        route: '/app/fitness',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'salon',
        name: 'Гоо Сайхан & Салон',
        description: 'Үйлчилгээний өртөг, мастеруудын цаг захиалга, комисс.',
        icon: 'Scissors',
        route: '/app/salon',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 15000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 144000, durationDays: 365 }
        ]
    },
    {
        id: 'real-estate',
        name: 'Үл Хөдлөх Хөрөнгө',
        description: 'Байр, оффисын түрээс, хурал борлуулалт, лизинг бүртгэл.',
        icon: 'Building',
        route: '/app/real-estate',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'healthcare',
        name: 'Эмнэлэг & Клиник',
        description: 'Өвчтөний карт, оношлогооны түүх, эмнэлгийн үйлчилгээний бүртгэл.',
        icon: 'Stethoscope',
        route: '/app/healthcare',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },

    // --- 13. Collaboration ---
    {
        id: 'tasks',
        name: 'Ажил Үүрэг (To-Do)',
        description: 'Багийн өдөр тутмын даалгавар, төлөвлөгөө хянах самбар.',
        icon: 'CheckSquare',
        route: '/app/tasks',
        isCore: false,
        category: 'operations',
        hubId: 'projects-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 10000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 96000, durationDays: 365 }
        ]
    },
    {
        id: 'knowledge',
        name: 'Мэдлэгийн Сан',
        description: 'Дотоод дүрэм журам, байгууллагын гарын авлага, зааварчилгаа.',
        icon: 'BookOpen',
        route: '/app/knowledge',
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
