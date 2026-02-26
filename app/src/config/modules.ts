import type { AppModule } from '../types';

export const LISCORD_MODULES: AppModule[] = [
    {
        id: 'orders',
        name: 'Захиалга',
        description: 'Бүх сувгаар орж ирсэн захиалгуудыг нэг цонхноос удирдах, төлөв өөрчлөх, нэхэмжлэх илгээх систем.',
        icon: 'PackageSearch',
        route: '/dashboard/orders',
        isCore: false,
        category: 'operations'
    },
    {
        id: 'inventory',
        name: 'Агуулах & Бараа',
        description: 'Бүтээгдэхүүний жагсаалт, үлдэгдэл хянах, үнэ тохируулах менежмент.',
        icon: 'Boxes',
        route: '/dashboard/inventory',
        isCore: false,
        category: 'operations'
    },
    {
        id: 'pos',
        name: 'ПОС / Борлуулалт',
        description: 'Дэлгүүр дээрх биет борлуулалт, E-barimt уншуулах кассын систем.',
        icon: 'MonitorSmartphone',
        route: '/dashboard/pos',
        isCore: false,
        category: 'sales'
    },
    {
        id: 'finance',
        name: 'Санхүү & Татвар',
        description: 'Орлого, зарлага, авлага болон НӨАТ-ын тайлан, E-barimt уншуулах удирдлага.',
        icon: 'Wallet',
        route: '/dashboard/finance',
        isCore: false,
        category: 'finance'
    },
    {
        id: 'hrm',
        name: 'Хүний Нөөц',
        description: 'Ажилчдын ирц, цалин бодолт, урьдчилгаа болон багийн гүйцэтгэлийн удирдлага.',
        icon: 'Users',
        route: '/dashboard/hrm',
        isCore: false,
        category: 'staff'
    },
    {
        id: 'cargo',
        name: 'Карго Тээвэр',
        description: 'Хятадаас карго тээвэрлэдэг болон хот хооронд илгээмж хүргэдэг компаниудад зориулсан бүртгэл.',
        icon: 'Truck',
        route: '/dashboard/cargo',
        isCore: false,
        category: 'services'
    },
    {
        id: 'delivery',
        name: 'Хүргэлт & Логистик',
        description: 'Хот доторх хүргэлтийн тооцоо, жолоочийн удирдлага, газрын зурагтай интеграц.',
        icon: 'MapPin',
        route: '/dashboard/delivery',
        isCore: false,
        category: 'services'
    },
    {
        id: 'b2b',
        name: 'B2B Платформ',
        description: 'Бусад бизнесүүдтэй холбогдох, ханган нийлүүлэлт авах, бөөний сүлжээ үүсгэх.',
        icon: 'Building2',
        route: '/dashboard/b2b',
        isCore: false,
        category: 'sales'
    },
    {
        id: 'customers',
        name: 'Хэрэглэгчид (CRM)',
        description: 'Худалдан авагчдын түүх, оноо цуглуулах, сегментчлэл хийх харилцагчийн удирдлага.',
        icon: 'Contact',
        route: '/dashboard/customers',
        isCore: false,
        category: 'sales'
    },
    {
        id: 'booking',
        name: 'Цаг Захиалга',
        description: 'Гоо сайхан, эмнэлэг зэрэг үйлчилгээний байгууллагуудад зориулсан календарь, цаг захиалга.',
        icon: 'CalendarClock',
        route: '/dashboard/booking',
        isCore: false,
        category: 'services'
    },
    {
        id: 'analytics',
        name: 'Анализ & Тайлан',
        description: 'Бизнесийн өсөлтийн графикууд, ашигт ажиллагааны нарийвчилсан тайлан.',
        icon: 'BarChart3',
        route: '/dashboard/reports',
        isCore: true, // Always visible for now, or maybe make it togglable later
        category: 'operations'
    },
    {
        id: 'messenger',
        name: 'Чаат & Харилцаа',
        description: 'Facebook, Instagram болон вэбсайтын зурвасуудыг нэг дор хүлээн авч хариулах.',
        icon: 'MessageCircle',
        route: '/dashboard/chat',
        isCore: false,
        category: 'sales'
    }
];

export const CORE_MODULES = LISCORD_MODULES.filter(m => m.isCore).map(m => m.id);
