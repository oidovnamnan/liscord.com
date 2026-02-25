import {
    ShoppingCart, Package, Truck, Network, Briefcase, Factory,
    Calendar, Landmark, Layers, Clock, DollarSign, PieChart,
    Building2, FileText, BarChart3, Receipt, Warehouse, Ticket, LayoutDashboard
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AppModule {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    path?: string;          // Optional path for the "Open" button
    isCore?: boolean;       // Core modules cannot be uninstalled
}

export const APP_MODULES: AppModule[] = [
    // --- Core Systems (Always visible, cannot be uninstalled via App Store) ---
    // NOTE: Settings and App Store Manager itself is implicitly core, no need to list it as a toggleable module.

    // --- Installable Apps ---
    { id: 'dashboard', name: 'Хянах самбар', description: 'Үндсэн үзүүлэлтүүд', icon: LayoutDashboard },
    { id: 'reports', name: 'Тайлан', description: 'Борлуулалт, ашгийн тайлан', icon: BarChart3 },

    { id: 'orders', name: 'Борлуулалт & POS', description: 'Дэлгүүр, кассын борлуулалт', icon: ShoppingCart },
    { id: 'products', name: 'Бараа бүртгэл', description: 'Төрөл, үнэ, үлдэгдэл удирдах', icon: Package },
    { id: 'inventory', name: 'Агуулах & Нөөц', description: 'Олон агуулах хооронд шилжүүлэх', icon: Warehouse },

    { id: 'customers', name: 'Харилцагч (CRM)', description: 'Үйлчлүүлэгчдийн түүх, өр авлага', icon: Building2 },
    { id: 'chat', name: 'Чат & Message', description: 'Сошиал чат нэгтгэл', icon: FileText },

    { id: 'delivery', name: 'Хүргэлт (Жолооч)', description: 'Дотоод хүргэлтийн зохицуулалт', icon: Truck },
    { id: 'packages', name: 'Ачаа (AI)', description: 'Хил дамнасан ачаа тээвэрлэх', icon: Package },
    { id: 'cargo', name: 'Ухаалаг Карго', description: 'Кг, м3, ширхгээр үнэ бодох (Zamex загвар)', icon: Truck },

    { id: 'b2b', name: 'B2B Маркетплейс', description: 'Байгууллага хоорондын худалдаа', icon: Network },
    { id: 'b2b-provider', name: 'B2B Хүсэлтүүд', description: 'Нийлүүлэгчийн удирдлагын самбар', icon: Briefcase },

    { id: 'finance', name: 'Санхүү & Орлого зарлага', description: 'Өдөр тутмын гүйлгээ', icon: PieChart },
    { id: 'payments', name: 'Төлбөр тооцоо', description: 'Шилжүүлэг, QPay, НӨАТ', icon: DollarSign },

    { id: 'manufacturing', name: 'Үйлдвэрлэл', description: 'Орц найрлага, гарц тооцох', icon: Factory },
    { id: 'projects', name: 'Төсөл & Үйлчилгээ', description: 'Урт хугацааны төслийн явц', icon: Briefcase },

    { id: 'appointments', name: 'Цаг захиалга', description: 'Гоо сайхан, эмнэлэг, уулзалт', icon: Calendar },
    { id: 'rooms', name: 'Өрөө & Талбай', description: 'Зочид буудал, түрээсийн талбай', icon: LayoutDashboard },

    { id: 'vehicles', name: 'Машин & Техник', description: 'Машин түрээс, техник үйлчилгээ', icon: Truck },
    { id: 'tickets', name: 'Тасалбар', description: 'Тоглолт, арга хэмжээний тасалбар', icon: Ticket },

    { id: 'loans', name: 'Зээл & Ломбард', description: 'Хүүний бодолт, барьцаа хөрөнгө', icon: Landmark },
    { id: 'queue', name: 'Дараалал (Queue)', description: 'Угаалга, салон, эмнэлгийн дараалал', icon: Layers },

    { id: 'attendance', name: 'Цаг бүртгэл', description: 'Ажилчдын ирсэн/явсан цаг', icon: Clock },
    { id: 'payroll', name: 'Цалин бодолт', description: 'Үндсэн цалин, урамшуулал', icon: DollarSign },
    { id: 'contracts', name: 'Гэрээ удирдлага', description: 'Гэрээ үүсгэх, хянах', icon: Receipt },
];
