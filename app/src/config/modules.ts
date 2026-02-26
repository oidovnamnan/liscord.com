import type { AppModule } from '../types';

export const LISCORD_MODULES: AppModule[] = [
    {
        id: 'orders',
        name: 'Захиалга',
        description: 'Захиалга удирдлага болон ПОС борлуулалтын систем.',
        icon: 'PackageSearch',
        route: '/app/orders',
        isCore: true,
        category: 'operations'
    },
    {
        id: 'inventory',
        name: 'Агуулах & Бараа',
        description: 'Барааны үлдэгдэл, үнэ болон үйлдвэрлэлийн менежмент.',
        icon: 'Boxes',
        route: '/app/inventory',
        isCore: true,
        category: 'operations'
    },
    {
        id: 'finance',
        name: 'Санхүү & Төлбөр',
        description: 'Орлого, зарлага, авлага болон зээлийн тооцоо.',
        icon: 'Wallet',
        route: '/app/finance',
        isCore: false,
        category: 'finance'
    },
    {
        id: 'hrm',
        name: 'Хүний Нөөц (HRM)',
        description: 'Ажилчдын ирц, цалин бодолт болон гүйцэтгэлийн удирдлага.',
        icon: 'Users',
        route: '/app/employees',
        isCore: false,
        category: 'staff'
    },
    {
        id: 'cargo',
        name: 'Карго Тээвэр',
        description: 'Олон улсын болон дотоод тээвэр, илгээмжийн бүртгэл.',
        icon: 'Truck',
        route: '/app/packages',
        isCore: false,
        category: 'services'
    },
    {
        id: 'delivery',
        name: 'Хүргэлт & Логистик',
        description: 'Хүргэлтийн тооцоо, жолооч болон тээврийн хэрэгслийн удирдлага.',
        icon: 'MapPin',
        route: '/app/delivery',
        isCore: false,
        category: 'services'
    },
    {
        id: 'projects',
        name: 'Төсөл & Даалгавар',
        description: 'Төслийн төлөвлөлт, гүйцэтгэл болон тасалбарын систем.',
        icon: 'Briefcase',
        route: '/app/projects',
        isCore: false,
        category: 'operations'
    },
    {
        id: 'booking',
        name: 'Үйлчилгээ & Захиалга',
        description: 'Цаг захиалга, өрөө түрээс болон очер дараалал.',
        icon: 'CalendarClock',
        route: '/app/appointments',
        isCore: false,
        category: 'services'
    },
    {
        id: 'customers',
        name: 'Хэрэглэгчид (CRM)',
        description: 'Харилцагчийн түүх, сегментчлэл болон харилцааны удирдлага.',
        icon: 'Contact',
        route: '/app/customers',
        isCore: false,
        category: 'sales'
    },
    {
        id: 'analytics',
        name: 'Анализ & Тайлан',
        description: 'Бизнесийн өсөлт болон ашигт ажиллагааны нарийвчилсан тайлан.',
        icon: 'BarChart3',
        route: '/app/reports',
        isCore: true,
        category: 'operations'
    },
    {
        id: 'messenger',
        name: 'Чаат & Харилцаа',
        description: 'Сошиал сувгуудын зурвасуудыг нэг цонхноос хариулах.',
        icon: 'MessageCircle',
        route: '/app/chat',
        isCore: false,
        category: 'sales'
    },
    {
        id: 'b2b',
        name: 'B2B Платформ',
        description: 'Бусад бизнесүүдтэй холбогдох, ханган нийлүүлэлтийн сүлжээ.',
        icon: 'Building2',
        route: '/app/b2b',
        isCore: false,
        category: 'sales'
    }
];

export const CORE_MODULES = LISCORD_MODULES.filter(m => m.isCore).map(m => m.id);
