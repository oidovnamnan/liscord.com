import type { AppModule } from '../types';

export const LISCORD_MODULES: AppModule[] = [
    {
        id: 'orders',
        name: 'Борлуулалтын Захиалга',
        description: 'Захиалга үүсгэх, төлөв хянах, хэвлэх',
        icon: 'ShoppingCart',
        route: '/app/orders',
        isCore: true,
        category: 'operations',
        hasSettings: true,
        settingsRoute: '/app/settings?tab=statuses',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'products',
        name: 'Бараа Материал',
        description: 'Каталог, ангилал, үнийн бодлого',
        icon: 'Box',
        route: '/app/products',
        isCore: true,
        category: 'operations',
        hasSettings: true,
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'inventory',
        name: 'Агуулах / Нөөц',
        description: 'Орлого, зарлага, үлдэгдэл',
        icon: 'Boxes',
        route: '/app/inventory',
        isCore: true,
        category: 'operations',
        hasSettings: true,
        hubId: 'inventory-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'multi-warehouse',
        name: 'Олон Агуулах',
        description: 'Салбар хоорондын бараа шилжүүлэг',
        icon: 'Warehouse',
        route: '/app/multi-warehouse',
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
        description: 'Баркод үүсгэх, хэвлэх, скан',
        icon: 'Barcode',
        route: '/app/barcodes',
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
        id: 'procurement',
        name: 'Худалдан Авалт',
        description: 'Нийлүүлэгчийн захиалга, тендер',
        icon: 'ShoppingBag',
        route: '/app/procurement',
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
        id: 'branches',
        name: 'Салбар Удирдлага',
        description: 'Олон салбарын нэгдсэн хяналт',
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
    {
        id: 'audit-inventory',
        name: 'Агуулахын Тооллого',
        description: 'Гар утсаар ухаалаг тооллого',
        icon: 'ClipboardCheck',
        route: '/app/audit-inventory',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'warranty',
        name: 'Баталгаат Хугацаа',
        description: 'Сериал дугаар, хугацаа хяналт',
        icon: 'ShieldCheck',
        route: '/app/warranty',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'wms',
        name: 'Агуулахын Бүсчлэл',
        description: 'Тавиур, бүс (Zone/Bin) кодлох',
        icon: 'Map',
        route: '/app/wms',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'drop-shipping',
        name: 'Шууд Нийлүүлэлт',
        description: 'Агуулахгүйгээр нийлүүлэгчээс хүргэх',
        icon: 'Truck',
        route: '/app/drop-shipping',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'cross-docking',
        name: 'Хурдан Түгээлт',
        description: 'Буулгахгүйгээр шууд түгээх',
        icon: 'ArrowRightLeft',
        route: '/app/cross-docking',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'rma',
        name: 'Буцаалтын Акт',
        description: 'Барааны буцаалт, засварт илгээх',
        icon: 'Undo2',
        route: '/app/rma',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'quality-control',
        name: 'Чанарын Хяналт',
        description: 'Ирсэн барааны шалгалт',
        icon: 'SearchCheck',
        route: '/app/quality-control',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'inventory-forecast',
        name: 'AI Таамаглал',
        description: 'Дараа сарын татан авалтыг AI таамаглах',
        icon: 'LineChart',
        route: '/app/inventory-forecast',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'pricing-rules',
        name: 'Үнийн Бодлого',
        description: 'Автомат хөнгөлөлт, бөөний үнэ',
        icon: 'Tag',
        route: '/app/pricing-rules',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'product-variants',
        name: 'Хувилбарт Бараа',
        description: 'Өнгө/размерын матриц',
        icon: 'Layers',
        route: '/app/product-variants',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'b2b-portal',
        name: 'Бөөний Портал',
        description: 'Бөөний худалдан авагчийн захиалгна',
        icon: 'Globe',
        route: '/app/b2b-portal',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'packaging',
        name: 'Савлагаа',
        description: 'Савлагааны материалын зардал',
        icon: 'Package',
        route: '/app/packaging',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'serial-tracking',
        name: 'Сериал Мөрдөлт',
        description: 'Электрон барааны сериал мөрдөх',
        icon: 'Key',
        route: '/app/serial-tracking',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'finance',
        name: 'Санхүү',
        description: 'Ерөнхий дэвтэр, баланс',
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
        description: 'Авлага, өглөг, түүх',
        icon: 'CreditCard',
        route: '/app/payments',
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
        id: 'invoices',
        name: 'Нэхэмжлэх',
        description: 'Цахим нэхэмжлэл (PDF/Email)',
        icon: 'Receipt',
        route: '/app/invoices',
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
        id: 'ebarimt',
        name: 'И-Баримт (НӨАТ)',
        description: 'Татварын холболт, НӨАТ',
        icon: 'Stamp',
        route: '/app/ebarimt',
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
        id: 'expenses',
        name: 'Зардлын Хяналт',
        description: 'Урсгал зардал, томилолт',
        icon: 'ReceiptText',
        route: '/app/expenses',
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
        id: 'assets',
        name: 'Үндсэн Хөрөнгө',
        description: 'Элэгдэл, бүртгэл',
        icon: 'Laptop',
        route: '/app/assets',
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
        id: 'loans',
        name: 'Зээл / Ломбард',
        description: 'Хүүнийн бодолт, барьцаа',
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
    {
        id: 'budgeting',
        name: 'Төсвийн Хяналт',
        description: 'Алба тус бүрийн төсөв',
        icon: 'Calculator',
        route: '/app/budgeting',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'multi-currency',
        name: 'Олон Валют',
        description: 'Ханшийн зөрүүний тооцоо',
        icon: 'DollarSign',
        route: '/app/multi-currency',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'bank-sync',
        name: 'Банкны Холболт',
        description: 'Гүйлгээ автоматаар нийлэх',
        icon: 'Link',
        route: '/app/bank-sync',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'factoring',
        name: 'Факторинг',
        description: 'Нэхэмжлэх барьцаалсан зээл',
        icon: 'Handshake',
        route: '/app/factoring',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'petty-cash',
        name: 'Бэлэн Касс',
        description: 'Жижиг бэлэн зардал',
        icon: 'Coins',
        route: '/app/petty-cash',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'inter-company',
        name: 'Компани Хоорондын',
        description: 'Охин компаниудын гүйлгээ',
        icon: 'Building2',
        route: '/app/inter-company',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'consolidations',
        name: 'Нэгтгэсэн Тайлан',
        description: 'Толгой компанийн баланс',
        icon: 'BarChart3',
        route: '/app/consolidations',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'crypto-payments',
        name: 'Крипто Төлбөр',
        description: 'Bitcoin, крипто хэтэвч',
        icon: 'Bitcoin',
        route: '/app/crypto-payments',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'employees',
        name: 'Ажилтан',
        description: 'Хувийн хэрэг, албан тушаал',
        icon: 'Users',
        route: '/app/employees',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'attendance',
        name: 'Ирц Бүртгэл',
        description: 'Цаг бүртгэл, хоцролт',
        icon: 'Clock',
        route: '/app/attendance',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'payroll',
        name: 'Цалин Бодолт',
        description: 'НДШ, ХХОАТ тооцоо',
        icon: 'Coins',
        route: '/app/payroll',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'recruitment',
        name: 'Сонгон Шалгаруулалт',
        description: 'Ажлын зар, ATS',
        icon: 'UserPlus',
        route: '/app/recruitment',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'leave',
        name: 'Чөлөө & Амралт',
        description: 'Ээлжийн амралт, өвчтэй',
        icon: 'CalendarOff',
        route: '/app/leave',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'performance',
        name: 'Гүйцэтгэлийн Үнэлгээ',
        description: 'KPI, OKR',
        icon: 'Target',
        route: '/app/performance',
        isCore: false,
        category: 'staff',
        hubId: 'staff-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'training',
        name: 'Дотоод Сургалт (LMS)',
        description: 'Onboarding, шалгалт',
        icon: 'GraduationCap',
        route: '/app/training',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'shifts',
        name: 'Ээлжийн Хуваарь',
        description: '24/7 ажилчдын хуваарь',
        icon: 'Repeat',
        route: '/app/shifts',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'benefits',
        name: 'Урамшууллын Багц',
        description: 'Эрүүл мэнд, спорт',
        icon: 'Gift',
        route: '/app/benefits',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'surveys',
        name: 'Санал Асуулга',
        description: 'Дотоод pulse survey',
        icon: 'FileQuestion',
        route: '/app/surveys',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'offboarding',
        name: 'Ажлаас Гарах',
        description: 'Тойрох хуудас, хүлээлцэх',
        icon: 'UserMinus',
        route: '/app/offboarding',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'timesheets',
        name: 'Цагийн Лог',
        description: 'Гадуур ажилчдын бүртгэл',
        icon: 'Timer',
        route: '/app/timesheets',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'remote-tracker',
        name: 'Зайны Хяналт',
        description: 'Зайнаас ажилчдын мониторинг',
        icon: 'Monitor',
        route: '/app/remote-tracker',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'expenses-claim',
        name: 'Зардлын Нэхэмжлэл',
        description: 'Ажилтны жижиг зардал',
        icon: 'Receipt',
        route: '/app/expenses-claim',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'freelancer-mgt',
        name: 'Гэрээт Ажилтан',
        description: 'Туслан гүйцэтгэгч хяналт',
        icon: 'Contact',
        route: '/app/freelancer-mgt',
        isCore: false,
        category: 'staff',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'customers',
        name: 'CRM Харилцагч',
        description: 'Түүх, сегментчлэл',
        icon: 'Users',
        route: '/app/customers',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'messenger',
        name: 'Чаат & Харилцаа',
        description: 'FB/Insta/WhatsApp нэг цонхноос',
        icon: 'MessageCircle',
        route: '/app/messenger',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'campaigns',
        name: 'Маркетинг',
        description: 'Промо, бөөн Email/SMS',
        icon: 'Megaphone',
        route: '/app/campaigns',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'loyalty',
        name: 'Лоялти & Оноо',
        description: 'Гишүүнчлэл, урамшуулал',
        icon: 'Star',
        route: '/app/loyalty',
        isCore: false,
        category: 'sales',
        hubId: 'crm-hub',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'leads',
        name: 'Борлуулалтын Pipeline',
        description: 'Kanban шатлал',
        icon: 'Filter',
        route: '/app/leads',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'quotes',
        name: 'Үнийн Санал',
        description: 'PDF үнийн санал илгээх',
        icon: 'FileText',
        route: '/app/quotes',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'affiliate',
        name: 'Түншийн Шагнал',
        description: 'Referral хувь тооцох',
        icon: 'Share2',
        route: '/app/affiliate',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'telemarketing',
        name: 'IP Утас CRM',
        description: 'Утасны бичлэг CRM-д',
        icon: 'Phone',
        route: '/app/telemarketing',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'helpdesk',
        name: 'Санал Гомдол',
        description: 'Тасалбар систем',
        icon: 'LifeBuoy',
        route: '/app/helpdesk',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'subscriptions',
        name: 'Захиалгат Төлбөр',
        description: 'Сар бүрийн тогтмол хураамж',
        icon: 'RefreshCw',
        route: '/app/subscriptions',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'sales-commissions',
        name: 'Борлуулалтын Шагнал',
        description: 'Төлөөлөгчийн комисс',
        icon: 'Award',
        route: '/app/sales-commissions',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'email-builder',
        name: 'Имэйл Загвар',
        description: 'Маркетингийн гоё имэйл',
        icon: 'Mail',
        route: '/app/email-builder',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'social-listening',
        name: 'Сошиал Мониторинг',
        description: 'Брэндийн нэр хяналт',
        icon: 'Eye',
        route: '/app/social-listening',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'customer-portal',
        name: 'Харилцагчийн Портал',
        description: 'Нууц үгтэй гэрээ харах',
        icon: 'Layout',
        route: '/app/customer-portal',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'field-sales',
        name: 'Хээрийн Борлуулалт',
        description: 'Мобайл захиалга цуглуулах',
        icon: 'MapPin',
        route: '/app/field-sales',
        isCore: false,
        category: 'sales',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'pos',
        name: 'ПОС / Касс',
        description: 'Жижиглэн худалдааны касс',
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
        id: 'e-commerce',
        name: 'Онлайн Дэлгүүр',
        description: 'Кодгүй вэб дэлгүүр',
        icon: 'Globe',
        route: '/app/e-commerce',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'delivery-app',
        name: 'Хүргэлтийн Апп',
        description: 'Жолоочийн апп',
        icon: 'Smartphone',
        route: '/app/delivery-app',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'vouchers',
        name: 'Бэлгийн Карт',
        description: 'Дижитал/цаасан бэлэг',
        icon: 'Ticket',
        route: '/app/vouchers',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'franchise',
        name: 'Франчайз',
        description: 'Роялти хураамж тооцох',
        icon: 'Building',
        route: '/app/franchise',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'restaurant-pos',
        name: 'Рестораны ПОС',
        description: 'Ширээ хуваах, тооцоо',
        icon: 'Utensils',
        route: '/app/restaurant-pos',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'kds',
        name: 'Гал Тогооны Дэлгэц',
        description: 'Захиалга шууд гарах',
        icon: 'Tv',
        route: '/app/kds',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'table-booking',
        name: 'Ширээ Захиалга',
        description: 'Интерактив зураг',
        icon: 'TableRows',
        route: '/app/table-booking',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'digital-menu',
        name: 'QR Цэс',
        description: 'Утаснаас хоол захиалах',
        icon: 'QrCode',
        route: '/app/digital-menu',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'food-costing',
        name: 'Хоолны Өртөг',
        description: 'Орц, жор, хаягдал',
        icon: 'Beef',
        route: '/app/food-costing',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'self-checkout',
        name: 'Өөрөө Төлөх',
        description: 'Киоск машин',
        icon: 'CupSoda',
        route: '/app/self-checkout',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'weight-scale',
        name: 'Жинлүүр Холболт',
        description: 'Супермаркетын жинлүүр',
        icon: 'Scale',
        route: '/app/weight-scale',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'vending-machine',
        name: 'Автомат Машин',
        description: 'IoT холболт',
        icon: 'AppWindow',
        route: '/app/vending-machine',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'pole-display',
        name: '2-р Дэлгэц',
        description: 'Үйлчлүүлэгч тал дэлгэц',
        icon: 'Tv',
        route: '/app/pole-display',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'omni-sync',
        name: 'Marketplace Sync',
        description: 'Shoppy/Amazon үлдэгдэл',
        icon: 'Zap',
        route: '/app/omni-sync',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'appointments',
        name: 'Цаг Захиалга',
        description: 'Салон, эмнэлгийн цаг',
        icon: 'CalendarClock',
        route: '/app/appointments',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'rooms',
        name: 'Өрөө / Талбай',
        description: 'Зочид буудал, coworking',
        icon: 'DoorOpen',
        route: '/app/rooms',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'queue',
        name: 'Очер Дараалал',
        description: 'Дугаар олгох дэлгэц',
        icon: 'ListOrdered',
        route: '/app/queue',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'rentals',
        name: 'Түрээсийн Удирдлага',
        description: 'Тоног төхөөрөмж түрээс',
        icon: 'Key',
        route: '/app/rentals',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'property-mgt',
        name: 'СӨХ Хураамж',
        description: 'Байрны сарын хураамж',
        icon: 'Building',
        route: '/app/property-mgt',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'cleaning',
        name: 'Цэвэрлэгээ',
        description: 'Дуудлагын үйлчилгээ',
        icon: 'Sparkles',
        route: '/app/cleaning',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'salon',
        name: 'Гоо Сайхан & Салон',
        description: 'Мастерийн комисс',
        icon: 'Scissors',
        route: '/app/salon',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'fitness',
        name: 'Фитнес & Клуб',
        description: 'Гишүүнчлэл, хуваарь',
        icon: 'Dumbbell',
        route: '/app/fitness',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'laundry',
        name: 'Хими Цэвэрлэгээ',
        description: 'Хувцас шошголох',
        icon: 'Wind',
        route: '/app/laundry',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'spa-wellness',
        name: 'Спа & Массаж',
        description: 'Бугуйвч, шүүгээ',
        icon: 'Waves',
        route: '/app/spa-wellness',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'event-tickets',
        name: 'Тасалбар Зарах',
        description: 'QR тасалбар',
        icon: 'Ticket',
        route: '/app/event-tickets',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'field-service',
        name: 'Гадуур Засвар',
        description: 'Инженерийн хуваарь',
        icon: 'Truck',
        route: '/app/field-service',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'repair-shop',
        name: 'Засварын Газар',
        description: 'Төлөв хяналт (PC, утас)',
        icon: 'Wrench',
        route: '/app/repair-shop',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'membership',
        name: 'VIP Гишүүнчлэл',
        description: 'Тогтмол хураамж, эрхүүд',
        icon: 'CreditCard',
        route: '/app/membership',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'facility-mgt',
        name: 'Барилга Засвар',
        description: 'Дуудлага хүлээн авах',
        icon: 'Settings',
        route: '/app/facility-mgt',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'manufacturing',
        name: 'Үйлдвэрлэл',
        description: 'Цехийн захиалга, процесс',
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
        id: 'mrp',
        name: 'Материал Төлөвлөлт',
        description: 'Түүхий эдийн таамаглал',
        icon: 'Cpu',
        route: '/app/mrp',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'equipment',
        name: 'Тоног Төхөөрөмж (CMMS)',
        description: 'Засварын мөчлөг',
        icon: 'Cog',
        route: '/app/equipment',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'job-orders',
        name: 'Ажлын Даалгавар',
        description: 'Баркодтай даалгавар хэвлэх',
        icon: 'FileSpreadsheet',
        route: '/app/job-orders',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'projects',
        name: 'Төсөл',
        description: 'Төлөвлөлт, канбан',
        icon: 'Briefcase',
        route: '/app/projects',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'tasks',
        name: 'Ажил Үүрэг (To-Do)',
        description: 'Багийн өдөр тутмын даалгавар',
        icon: 'CheckSquare',
        route: '/app/tasks',
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
        id: 'plm',
        name: 'Бүтээгдэхүүн Хөгжүүлэлт',
        description: 'Шинэ бүтээгдэхүүний мөчлөг',
        icon: 'FlaskConical',
        route: '/app/plm',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'sub-contracting',
        name: 'Туслан Гүйцэтгэгч',
        description: 'Үйлдвэрлэлийн зарим шатыг гадагшлуулах',
        icon: 'Users',
        route: '/app/sub-contracting',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'bom',
        name: 'Жорын Бүрдэл (BOM)',
        description: 'Нэгж бүтээгдэхүүний стандарт жор',
        icon: 'List',
        route: '/app/bom',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'qa',
        name: 'Чанарын Баталгаажуулалт',
        description: 'Бэлэн барааны тест',
        icon: 'ShieldCheck',
        route: '/app/qa',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'milestones',
        name: 'Төслийн Шатлал',
        description: 'Хөрөнгө оруулалтын үе шат',
        icon: 'Flag',
        route: '/app/milestones',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'gantt-chart',
        name: 'Гантт Диаграм',
        description: 'Төслийн цаг хуваарь зураг',
        icon: 'BarChartHorizontal',
        route: '/app/gantt-chart',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'timesheet-billing',
        name: 'Цагийн Нэхэмжлэл',
        description: 'Хуульч, зөвлөхийн 1 цаг = ₮',
        icon: 'Timer',
        route: '/app/timesheet-billing',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'construction',
        name: 'Барилга',
        description: 'Материалын зарцуулалт, гүйцэтгэл',
        icon: 'HardHat',
        route: '/app/construction',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'architecture-design',
        name: 'Зураг Төсөл',
        description: 'Хувилбарын хяналт',
        icon: 'PenTool',
        route: '/app/architecture-design',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'education',
        name: 'Сургалт & Курс',
        description: 'Дүн, хичээлийн хуваарь',
        icon: 'GraduationCap',
        route: '/app/education',
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
        description: 'Өвчтөний карт, EMR',
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
    {
        id: 'pharmacy',
        name: 'Эмийн Сан',
        description: 'Жор, хугацаа анхааруулга',
        icon: 'Pills',
        route: '/app/pharmacy',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'microfinance',
        name: 'ББСБ / Ломбард',
        description: 'Барьцаа үнэлгээ, хүү',
        icon: 'Landmark',
        route: '/app/microfinance',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'real-estate',
        name: 'Үл Хөдлөх Хөрөнгө',
        description: 'Зуучлалын обьект',
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
        id: 'cargo',
        name: 'Карго Тээвэр',
        description: 'Илгээмж, AI текст уншигч',
        icon: 'Truck',
        route: '/app/cargo',
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
        id: 'vehicles',
        name: 'Авто Парк',
        description: 'Даатгал, татвар, гүйлт',
        icon: 'Car',
        route: '/app/vehicles',
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
        id: 'fleet',
        name: 'GPS Парк Хяналт',
        description: 'Түлшний зардал, GPS',
        icon: 'Truck',
        route: '/app/fleet',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'freight',
        name: 'Олон Улсын Тээвэр',
        description: 'Контейнер, гааль',
        icon: 'Ship',
        route: '/app/freight',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'agriculture',
        name: 'Газар Тариалан',
        description: 'Ургац, пестицидийн зарцуулалт',
        icon: 'Sprout',
        route: '/app/agriculture',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'veterinary',
        name: 'Мал Эмнэлэг',
        description: 'Вакцин, амьтны карт',
        icon: 'Cat',
        route: '/app/veterinary',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'mining',
        name: 'Уул Уурхай',
        description: 'Олборлолт, рэйс хяналт',
        icon: 'Mountain',
        route: '/app/mining',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'legal',
        name: 'Хуульч & Өмгөөлөгч',
        description: 'Шүүхийн хэрэг архив',
        icon: 'Gavel',
        route: '/app/legal',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ngo',
        name: 'ТББ & Сан',
        description: 'Хандивлагчийн бүртгэл',
        icon: 'Heart',
        route: '/app/ngo',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'printing',
        name: 'Хэвлэлийн Үйлдвэр',
        description: 'Динамик үнэ (хэмжээ)',
        icon: 'Printer',
        route: '/app/printing',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'car-rental',
        name: 'Автомашин Түрээс',
        description: 'Торгууль, эвдрэл',
        icon: 'CarFront',
        route: '/app/car-rental',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'driving-school',
        name: 'Жолооны Курс',
        description: 'Багшийн цаг хуваарь',
        icon: 'SteeringWheel',
        route: '/app/driving-school',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'parking',
        name: 'Зогсоол',
        description: 'Boom barrier, дугаар уншигч',
        icon: 'ParkingSquare',
        route: '/app/parking',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'library',
        name: 'Номын Сан',
        description: 'Архив менежмент',
        icon: 'Library',
        route: '/app/library',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'tour-operator',
        name: 'Аялал Жуулчлал',
        description: 'Багц угсралт, хөтөч',
        icon: 'Compass',
        route: '/app/tour-operator',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'documents',
        name: 'Бичиг Баримт (EDM)',
        description: 'Тушаал, шийдвэр',
        icon: 'FileText',
        route: '/app/documents',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'e-sign',
        name: 'Тоон Гарын Үсэг',
        description: 'Онлайн баталгаажуулалт',
        icon: 'PenTool',
        route: '/app/e-sign',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'internal-chat',
        name: 'Дотоод Чаат',
        description: 'Slack орлуулагч',
        icon: 'MessageSquare',
        route: '/app/internal-chat',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'approvals',
        name: 'Зөвшөөрлийн Урсгал',
        description: 'Даргаас захирал руу',
        icon: 'CheckCircle2',
        route: '/app/approvals',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'calendar',
        name: 'Дундын Календарь',
        description: 'Уулзалтын захиалга',
        icon: 'Calendar',
        route: '/app/calendar',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'notes',
        name: 'Тэмдэглэл',
        description: 'Notion шиг олон хүнтэй',
        icon: 'StickyNote',
        route: '/app/notes',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'pass-manager',
        name: 'Нууц Үгийн Менежер',
        description: 'Password Vault',
        icon: 'Lock',
        route: '/app/pass-manager',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'video-meetings',
        name: 'Видео Хурал',
        description: 'Систем доторх Zoom',
        icon: 'Video',
        route: '/app/video-meetings',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'whiteboard',
        name: 'Ухаалаг Самбар',
        description: 'Зураг зурах самбар',
        icon: 'Edit3',
        route: '/app/whiteboard',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'announcements',
        name: 'Зарлал',
        description: 'Байгууллагын албан мэдэгдэл',
        icon: 'Volume2',
        route: '/app/announcements',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'analytics',
        name: 'BI Dashboard',
        description: 'Дотоод PowerBI',
        icon: 'BarChart3',
        route: '/app/analytics',
        isCore: true,
        category: 'operations',
        hasSettings: true,
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'automations',
        name: 'RPA Автомат',
        description: '"Бараа дуусвал → мессеж"',
        icon: 'Zap',
        route: '/app/automations',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'api-webhooks',
        name: 'API & Webhook',
        description: '3-дагч аппын холболт',
        icon: 'Webhook',
        route: '/app/api-webhooks',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ocr-scanner',
        name: 'AI Текст Уншигч',
        description: 'Бичиг баримт → текст',
        icon: 'ScanText',
        route: '/app/ocr-scanner',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'audit-trail',
        name: 'Үйлдлийн Лог',
        description: 'Хэн, хэзээ, IP',
        icon: 'History',
        route: '/app/audit-trail',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'data-migration',
        name: 'Дата Импорт',
        description: 'Excel/хуучин систем импортлох',
        icon: 'UploadCloud',
        route: '/app/data-migration',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'custom-reports',
        name: 'Тайлан Зохиогч',
        description: 'Хэрэглэгчийн тайлан',
        icon: 'PieChart',
        route: '/app/custom-reports',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'cctv-sync',
        name: 'Камер AI Ирц',
        description: 'Царайгаар ирц бүртгэх',
        icon: 'Camera',
        route: '/app/cctv-sync',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ai-forecaster',
        name: 'AI Таамаглагч',
        description: '3 жилийн түүхээс эрсдэл',
        icon: 'BrainCircuit',
        route: '/app/ai-forecaster',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ai-chatbot',
        name: 'AI Чатбот',
        description: 'Вэбсайтын автомат хариулагч',
        icon: 'Bot',
        route: '/app/ai-chatbot',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ai-agent',
        name: 'AI Туслах (Antigravity)',
        description: 'Системийн тархи, ухаалаг ко-пилот',
        icon: 'Bot',
        route: '/app/ai-agent',
        isCore: true,
        category: 'operations',
        hasSettings: true,
        settingsRoute: '/app/settings?tab=ai-agent',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'gdpr-compliance',
        name: 'GDPR Нийцлэл',
        description: 'Хувийн мэдээллийн хамгаалалт',
        icon: 'Shield',
        route: '/app/gdpr-compliance',
        isCore: false,
        category: 'operations',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'data-backup',
        name: 'Автомат Нөөцлөлт',
        description: 'Өдөр бүрийн нөөцлөх',
        icon: 'Database',
        route: '/app/data-backup',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ip-whitelist',
        name: 'IP Хязгаарлалт',
        description: 'Зөвшөөрөгдсөн IP',
        icon: 'Globe',
        route: '/app/ip-whitelist',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'two-factor-auth',
        name: '2FA Баталгаажуулалт',
        description: 'SMS/Authenticator нэвтрэлт',
        icon: 'Smartphone',
        route: '/app/two-factor-auth',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'role-manager',
        name: 'Эрхийн Удирдлага',
        description: 'Нарийн permission тохиргоо',
        icon: 'UserLock',
        route: '/app/role-manager',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'session-manager',
        name: 'Сессийн Хяналт',
        description: 'Идэвхтэй төхөөрөмж хянах',
        icon: 'Activity',
        route: '/app/session-manager',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'document-encryption',
        name: 'Баримт Шифрлэлт',
        description: 'Нууцлагдсан файл хадгалах',
        icon: 'FileLock',
        route: '/app/document-encryption',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'sso',
        name: 'Single Sign-On',
        description: 'Google/Microsoft нэвтрэлт',
        icon: 'LogIn',
        route: '/app/sso',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'access-policy',
        name: 'Хандалтын Бодлого',
        description: 'Цагийн хязгаарлалт (9-18)',
        icon: 'CalendarRange',
        route: '/app/access-policy',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'pen-test-report',
        name: 'Аюулгүй Байдлын Тайлан',
        description: 'Автомат эмзэг байдлын скан',
        icon: 'AlertTriangle',
        route: '/app/pen-test-report',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'tax-reporting',
        name: 'Татварын Тайлан',
        description: 'НӨАТ, ААНОАТ, ТТ-11',
        icon: 'Receipt',
        route: '/app/tax-reporting',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'customs-declaration',
        name: 'Гаалийн Мэдүүлэг',
        description: 'ГТМ бөглөх, илгээх',
        icon: 'FileText',
        route: '/app/customs-declaration',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'labor-compliance',
        name: 'Хөдөлмөрийн Хууль',
        description: 'НДШ, ХХОАТ автомат',
        icon: 'Gavel',
        route: '/app/labor-compliance',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'anti-fraud',
        name: 'Залилангийн Илрүүлэлт',
        description: 'AI-д суурилсан сэжигтэй үйлдэл',
        icon: 'Spy',
        route: '/app/anti-fraud',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'contract-compliance',
        name: 'Гэрээний Нийцлэл',
        description: 'Гэрээний хугацаа анхааруулга',
        icon: 'ShieldCheck',
        route: '/app/contract-compliance',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'insurance',
        name: 'Даатгалын Удирдлага',
        description: 'Полисийн хугацаа, нэхэмжлэл',
        icon: 'Shield',
        route: '/app/insurance',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'risk-assessment',
        name: 'Эрсдэлийн Үнэлгээ',
        description: 'Бизнесийн эрсдэл хянах',
        icon: 'Crosshair',
        route: '/app/risk-assessment',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'environmental',
        name: 'Байгаль Орчин',
        description: 'CO2, хог хаягдлын тайлан',
        icon: 'Leaf',
        route: '/app/environmental',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'health-safety',
        name: 'ХАБЭА',
        description: 'Ажлын байрны аюулгүй байдал',
        icon: 'ShieldAlert',
        route: '/app/health-safety',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'whistleblower',
        name: 'Нууц Гомдол',
        description: 'Ажилтны нэргүй мэдэгдэл',
        icon: 'Megaphone',
        route: '/app/whistleblower',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'data-retention',
        name: 'Өгөгдөл Хадгалалт',
        description: 'Автомат устгалтын бодлого',
        icon: 'Trash2',
        route: '/app/data-retention',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'vendor-compliance',
        name: 'Нийлүүлэгч Шалгалт',
        description: 'Нийлүүлэгчийн нийцлэл',
        icon: 'ShieldCheck',
        route: '/app/vendor-compliance',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'export-control',
        name: 'Экспортын Хяналт',
        description: 'Хориотой бараа шалгалт',
        icon: 'Globe',
        route: '/app/export-control',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'energy-audit',
        name: 'Эрчим Хүчний Аудит',
        description: 'Цахилгаан, дулааны зардал',
        icon: 'Zap',
        route: '/app/energy-audit',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'food-safety',
        name: 'Хүнсний Аюулгүй Байдал',
        description: 'HACCP, лабораторийн шинжилгээ',
        icon: 'ShieldCheck',
        route: '/app/food-safety',
        isCore: false,
        category: 'finance',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'qpay-integration',
        name: 'QPay Холболт',
        description: 'QPay QR төлбөр',
        icon: 'QrCode',
        route: '/app/qpay-integration',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'socialpay',
        name: 'SocialPay Холболт',
        description: 'SocialPay интеграц',
        icon: 'Smartphone',
        route: '/app/socialpay',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'khan-bank-api',
        name: 'Хаан Банк API',
        description: 'Автомат гүйлгээ',
        icon: 'Link',
        route: '/app/khan-bank-api',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'golomt-api',
        name: 'Голомт Банк API',
        description: 'Автомат гүйлгээ',
        icon: 'Link',
        route: '/app/golomt-api',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'ebarimt-api',
        name: 'И-Баримт API',
        description: 'Татварын шууд холболт',
        icon: 'Link',
        route: '/app/ebarimt-api',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'facebook-shop',
        name: 'Facebook Дэлгүүр',
        description: 'FB Shops интеграц',
        icon: 'Facebook',
        route: '/app/facebook-shop',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'instagram-api',
        name: 'Instagram API',
        description: 'Инста шууд худалдаа',
        icon: 'Instagram',
        route: '/app/instagram-api',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'tiktok-shop',
        name: 'TikTok Shop',
        description: 'TikTok борлуулалт',
        icon: 'Video',
        route: '/app/tiktok-shop',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'google-analytics',
        name: 'Google Analytics',
        description: 'Вэб статистик',
        icon: 'BarChart',
        route: '/app/google-analytics',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'sms-gateway',
        name: 'SMS Илгээгч',
        description: 'Бөөн SMS интеграц',
        icon: 'MessageSquare',
        route: '/app/sms-gateway',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'email-smtp',
        name: 'Email SMTP',
        description: 'Автомат Email серверийн холболт',
        icon: 'Mail',
        route: '/app/email-smtp',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'push-notifications',
        name: 'Push Мэдэгдэл',
        description: 'Мобайл push notification',
        icon: 'Bell',
        route: '/app/push-notifications',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'iot-sensors',
        name: 'IoT Мэдрэгч',
        description: 'Температур, чийглэг хяналт',
        icon: 'Thermometer',
        route: '/app/iot-sensors',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'cold-storage',
        name: 'Хүйтэн Агуулах',
        description: 'Хөргөлтийн хяналт',
        icon: 'Snowflake',
        route: '/app/cold-storage',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'smart-lock',
        name: 'Ухаалаг Түгжээ',
        description: 'Оффис/өрөөний түлхүүрлэс',
        icon: 'Lock',
        route: '/app/smart-lock',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'rfid-tracking',
        name: 'RFID Мөрдөлт',
        description: 'Барааны RFID чип уншигч',
        icon: 'Radio',
        route: '/app/rfid-tracking',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'gps-tracking',
        name: 'GPS Хяналт',
        description: 'Хүргэлтийн байршил',
        icon: 'Navigation',
        route: '/app/gps-tracking',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'biometric',
        name: 'Биометрик Төхөөрөмж',
        description: 'Хурууны хээ, царай',
        icon: 'Fingerprint',
        route: '/app/biometric',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'receipt-printer',
        name: 'Тасалбар Хэвлэгч',
        description: 'POS принтерийн драйвер',
        icon: 'Printer',
        route: '/app/receipt-printer',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'cash-drawer',
        name: 'Мөнгөний Хайрцаг',
        description: 'Кассын хайрцаг нээх',
        icon: 'Wallet',
        route: '/app/cash-drawer',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'label-printer',
        name: 'Шошго Хэвлэгч',
        description: 'Баркод шошгоны принтер',
        icon: 'Printer',
        route: '/app/label-printer',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'scanner-gun',
        name: 'Скан Буу',
        description: 'USB/Bluetooth скан',
        icon: 'Scan',
        route: '/app/scanner-gun',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'kitchen-printer',
        name: 'Гал Тогооны Принтер',
        description: 'Тогоочийн тасалбар',
        icon: 'Printer',
        route: '/app/kitchen-printer',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'customer-display',
        name: 'Хэрэглэгчийн Дэлгэц',
        description: 'Төлбөрийн мэдээлэл',
        icon: 'Tv',
        route: '/app/customer-display',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
    {
        id: 'marketplace-hub',
        name: 'Marketplace Hub',
        description: 'Бүх marketplace-г нэг дороос',
        icon: 'Boxes',
        route: '/app/marketplace-hub',
        isCore: false,
        category: 'services',
        isFree: false,
        plans: [
            { id: 'monthly', name: '30 хоног', price: 20000, durationDays: 30 },
            { id: 'yearly', name: '1 жил', price: 192000, durationDays: 365 }
        ]
    },
];

export const CORE_MODULES = LISCORD_MODULES.filter(m => m.isCore).map(m => m.id);
