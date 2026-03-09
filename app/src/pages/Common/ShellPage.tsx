import { useState, useEffect, useMemo } from 'react';
import '../Inventory/InventoryPage.css';
import { Plus, Settings, Search, Edit2, Database, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LISCORD_MODULES } from '../../config/modules';
import { useBusinessStore } from '../../store';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { GenericCrudModal, type CrudField } from '../../components/common/GenericCrudModal';

interface ShellPageProps {
    title: string;
    moduleId?: string;
}

// ═══════════════════════════════════════════════
// Auto-generate sensible collection name & fields
// per module category
// ═══════════════════════════════════════════════
function getModuleConfig(moduleId: string): { collectionName: string; fields: CrudField[]; columns: string[] } {
    const mod = LISCORD_MODULES.find(m => m.id === moduleId);
    const cat = mod?.category || '';

    // Module-specific overrides
    const specificConfigs: Record<string, { col: string; fields: CrudField[]; columns: string[] }> = {
        'branches': {
            col: 'branches', fields: [
                { name: 'name', label: 'Салбарын нэр', type: 'text', required: true, span: 2 },
                { name: 'address', label: 'Хаяг', type: 'text', span: 2 },
                { name: 'phone', label: 'Утас', type: 'phone' },
                { name: 'manager', label: 'Менежер', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Идэвхтэй' }, { value: 'inactive', label: 'Идэвхгүй' }
                    ], defaultValue: 'active'
                },
            ], columns: ['name', 'address', 'phone', 'status']
        },

        'affiliate': {
            col: 'affiliates', fields: [
                { name: 'name', label: 'Түншийн нэр', type: 'text', required: true },
                { name: 'code', label: 'Код', type: 'text', required: true },
                { name: 'commission', label: 'Шимтгэл %', type: 'number', suffix: '%' },
                { name: 'phone', label: 'Утас', type: 'phone' },
                { name: 'totalSales', label: 'Нийт борлуулалт', type: 'currency' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Идэвхтэй' }, { value: 'inactive', label: 'Идэвхгүй' }
                    ], defaultValue: 'active'
                },
            ], columns: ['name', 'code', 'commission', 'status']
        },

        'telemarketing': {
            col: 'telemarketingCalls', fields: [
                { name: 'customerName', label: 'Харилцагч', type: 'text', required: true },
                { name: 'phone', label: 'Утас', type: 'phone', required: true },
                { name: 'purpose', label: 'Зорилго', type: 'text' },
                {
                    name: 'result', label: 'Үр дүн', type: 'select', options: [
                        { value: 'answered', label: 'Хариулсан' }, { value: 'no_answer', label: 'Хариулаагүй' },
                        { value: 'callback', label: 'Дахин залгах' }, { value: 'interested', label: 'Сонирхсон' },
                    ]
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['customerName', 'phone', 'result']
        },

        'subscriptions': {
            col: 'subscriptionPlans', fields: [
                { name: 'name', label: 'Төлөвлөгөөний нэр', type: 'text', required: true },
                { name: 'price', label: 'Үнэ (сар)', type: 'currency', required: true },
                { name: 'duration', label: 'Хугацаа (сар)', type: 'number', defaultValue: 1 },
                { name: 'features', label: 'Онцлог', type: 'textarea', span: 2 },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Идэвхтэй' }, { value: 'inactive', label: 'Идэвхгүй' }
                    ], defaultValue: 'active'
                },
            ], columns: ['name', 'price', 'duration', 'status']
        },

        'customs': {
            col: 'customsDeclarations', fields: [
                { name: 'declarationNo', label: 'Мэдүүлгийн дугаар', type: 'text', required: true },
                {
                    name: 'type', label: 'Төрөл', type: 'select', options: [
                        { value: 'import', label: 'Импорт' }, { value: 'export', label: 'Экспорт' }
                    ]
                },
                { name: 'amount', label: 'Дүн', type: 'currency' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'cleared', label: 'Шийдвэрлэсэн' },
                        { value: 'held', label: 'Барьсан' }
                    ]
                },
                { name: 'notes', label: 'Тайлбар', type: 'textarea', span: 2 },
            ], columns: ['declarationNo', 'type', 'amount', 'status']
        },

        'hotel-mgt': {
            col: 'hotelRooms', fields: [
                { name: 'roomNumber', label: 'Өрөөний дугаар', type: 'text', required: true },
                {
                    name: 'type', label: 'Төрөл', type: 'select', options: [
                        { value: 'standard', label: 'Стандарт' }, { value: 'deluxe', label: 'Делюкс' },
                        { value: 'suite', label: 'Suite' }, { value: 'vip', label: 'VIP' }
                    ]
                },
                { name: 'pricePerNight', label: 'Нэг шөнийн үнэ', type: 'currency', required: true },
                { name: 'capacity', label: 'Багтаамж', type: 'number' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'available', label: 'Чөлөөтэй' }, { value: 'occupied', label: 'Захиалгатай' },
                        { value: 'maintenance', label: 'Засвартай' }
                    ], defaultValue: 'available'
                },
            ], columns: ['roomNumber', 'type', 'pricePerNight', 'status']
        },

        'event-planning': {
            col: 'events', fields: [
                { name: 'name', label: 'Эвентийн нэр', type: 'text', required: true, span: 2 },
                { name: 'date', label: 'Огноо', type: 'date', required: true },
                { name: 'venue', label: 'Байршил', type: 'text' },
                { name: 'budget', label: 'Төсөв', type: 'currency' },
                { name: 'guestCount', label: 'Зочдын тоо', type: 'number' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'planning', label: 'Төлөвлөж буй' }, { value: 'confirmed', label: 'Батлагдсан' },
                        { value: 'completed', label: 'Дууссан' }, { value: 'cancelled', label: 'Цуцлагдсан' }
                    ], defaultValue: 'planning'
                },
            ], columns: ['name', 'date', 'venue', 'status']
        },

        'ticketing': {
            col: 'tickets', fields: [
                { name: 'eventName', label: 'Арга хэмжээ', type: 'text', required: true },
                {
                    name: 'ticketType', label: 'Тасалбарын төрөл', type: 'select', options: [
                        { value: 'vip', label: 'VIP' }, { value: 'standard', label: 'Стандарт' }, { value: 'economy', label: 'Энгийн' }
                    ]
                },
                { name: 'price', label: 'Үнэ', type: 'currency', required: true },
                { name: 'quantity', label: 'Тоо ширхэг', type: 'number', required: true },
                { name: 'soldCount', label: 'Зарагдсан', type: 'number', defaultValue: 0 },
            ], columns: ['eventName', 'ticketType', 'price', 'quantity']
        },

        'school-mgt': {
            col: 'students', fields: [
                { name: 'name', label: 'Сурагчийн нэр', type: 'text', required: true },
                { name: 'grade', label: 'Анги', type: 'text', required: true },
                { name: 'parentPhone', label: 'Эцэг эхийн утас', type: 'phone' },
                { name: 'parentName', label: 'Эцэг/эхийн нэр', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Суралцаж буй' }, { value: 'graduated', label: 'Төгссөн' },
                        { value: 'transferred', label: 'Шилжсэн' }
                    ], defaultValue: 'active'
                },
            ], columns: ['name', 'grade', 'parentPhone', 'status']
        },

        'e-learning': {
            col: 'courses', fields: [
                { name: 'title', label: 'Хичээлийн нэр', type: 'text', required: true, span: 2 },
                { name: 'instructor', label: 'Багш', type: 'text' },
                { name: 'duration', label: 'Хугацаа (цаг)', type: 'number' },
                { name: 'price', label: 'Үнэ', type: 'currency' },
                {
                    name: 'level', label: 'Түвшин', type: 'select', options: [
                        { value: 'beginner', label: 'Анхан шат' }, { value: 'intermediate', label: 'Дунд' }, { value: 'advanced', label: 'Ахисан' }
                    ]
                },
                { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
            ], columns: ['title', 'instructor', 'price', 'level']
        },

        'tutor': {
            col: 'tutorSessions', fields: [
                { name: 'studentName', label: 'Сурагч', type: 'text', required: true },
                { name: 'subject', label: 'Хичээл', type: 'text', required: true },
                { name: 'date', label: 'Огноо', type: 'date', required: true },
                { name: 'duration', label: 'Хугацаа (мин)', type: 'number' },
                { name: 'fee', label: 'Төлбөр', type: 'currency' },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['studentName', 'subject', 'date', 'fee']
        },

        'library': {
            col: 'libraryBooks', fields: [
                { name: 'title', label: 'Номын нэр', type: 'text', required: true, span: 2 },
                { name: 'author', label: 'Зохиогч', type: 'text' },
                { name: 'isbn', label: 'ISBN', type: 'text' },
                { name: 'category', label: 'Ангилал', type: 'text' },
                { name: 'quantity', label: 'Тоо ширхэг', type: 'number', required: true },
                {
                    name: 'status', label: 'Байдал', type: 'select', options: [
                        { value: 'available', label: 'Бэлэн' }, { value: 'borrowed', label: 'Зээлдүүлсэн' }, { value: 'reserved', label: 'Захиалсан' }
                    ], defaultValue: 'available'
                },
            ], columns: ['title', 'author', 'quantity', 'status']
        },

        'manufacturing-erp': {
            col: 'productionOrders', fields: [
                { name: 'productName', label: 'Бүтээгдэхүүн', type: 'text', required: true, span: 2 },
                { name: 'quantity', label: 'Тоо хэмжээ', type: 'number', required: true },
                { name: 'dueDate', label: 'Хугацаа', type: 'date' },
                {
                    name: 'priority', label: 'Ач холбогдол', type: 'select', options: [
                        { value: 'high', label: 'Яаралтай' }, { value: 'medium', label: 'Дунд' }, { value: 'low', label: 'Бага' }
                    ]
                },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'planned', label: 'Төлөвлөсөн' }, { value: 'in_progress', label: 'Үйлдвэрлэж буй' },
                        { value: 'completed', label: 'Дууссан' }, { value: 'cancelled', label: 'Цуцлагдсан' }
                    ], defaultValue: 'planned'
                },
            ], columns: ['productName', 'quantity', 'dueDate', 'status']
        },

        'maintenance': {
            col: 'maintenanceOrders', fields: [
                { name: 'equipmentName', label: 'Тоног төхөөрөмж', type: 'text', required: true, span: 2 },
                { name: 'issue', label: 'Асуудал', type: 'textarea', span: 2 },
                {
                    name: 'priority', label: 'Ач холбогдол', type: 'select', options: [
                        { value: 'critical', label: 'Маш яаралтай' }, { value: 'high', label: 'Яаралтай' },
                        { value: 'medium', label: 'Дунд' }, { value: 'low', label: 'Бага' }
                    ]
                },
                { name: 'assignedTo', label: 'Хариуцагч', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'open', label: 'Нээлттэй' }, { value: 'in_progress', label: 'Шийдвэрлэж буй' },
                        { value: 'resolved', label: 'Шийдсэн' }
                    ], defaultValue: 'open'
                },
            ], columns: ['equipmentName', 'priority', 'assignedTo', 'status']
        },

        'quality-assurance': {
            col: 'qaChecks', fields: [
                { name: 'itemName', label: 'Шалгах зүйл', type: 'text', required: true, span: 2 },
                { name: 'inspector', label: 'Шалгагч', type: 'text' },
                { name: 'checkDate', label: 'Огноо', type: 'date' },
                {
                    name: 'result', label: 'Үр дүн', type: 'select', options: [
                        { value: 'pass', label: 'Тэнцсэн' }, { value: 'fail', label: 'Тэнцээгүй' }, { value: 'pending', label: 'Хүлээгдэж буй' }
                    ]
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['itemName', 'inspector', 'checkDate', 'result']
        },

        'law-firm': {
            col: 'legalCases', fields: [
                { name: 'caseNumber', label: 'Хэрэг №', type: 'text', required: true },
                { name: 'clientName', label: 'Үйлчлүүлэгч', type: 'text', required: true },
                {
                    name: 'caseType', label: 'Төрөл', type: 'select', options: [
                        { value: 'civil', label: 'Иргэний' }, { value: 'criminal', label: 'Эрүүгийн' },
                        { value: 'corporate', label: 'Компаний' }, { value: 'family', label: 'Гэр бүлийн' }
                    ]
                },
                { name: 'assignedLawyer', label: 'Хариуцагч өмгөөлөгч', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'open', label: 'Нээлттэй' }, { value: 'in_progress', label: 'Явагдаж буй' },
                        { value: 'closed', label: 'Хаагдсан' }
                    ], defaultValue: 'open'
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['caseNumber', 'clientName', 'caseType', 'status']
        },

        'accounting-firm': {
            col: 'accountingClients', fields: [
                { name: 'companyName', label: 'Компаний нэр', type: 'text', required: true, span: 2 },
                { name: 'contactPerson', label: 'Холбоо барих', type: 'text' },
                { name: 'phone', label: 'Утас', type: 'phone' },
                {
                    name: 'serviceType', label: 'Үйлчилгээний төрөл', type: 'select', options: [
                        { value: 'bookkeeping', label: 'Нягтлан бодох' }, { value: 'tax', label: 'Татвар' },
                        { value: 'audit', label: 'Аудит' }, { value: 'payroll', label: 'Цалингийн тооцоо' }
                    ]
                },
                { name: 'monthlyFee', label: 'Сарын төлбөр', type: 'currency' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Идэвхтэй' }, { value: 'inactive', label: 'Идэвхгүй' }
                    ], defaultValue: 'active'
                },
            ], columns: ['companyName', 'serviceType', 'monthlyFee', 'status']
        },

        'consulting': {
            col: 'consultingProjects', fields: [
                { name: 'projectName', label: 'Төслийн нэр', type: 'text', required: true, span: 2 },
                { name: 'clientName', label: 'Үйлчлүүлэгч', type: 'text', required: true },
                { name: 'consultant', label: 'Зөвлөх', type: 'text' },
                { name: 'startDate', label: 'Эхлэх огноо', type: 'date' },
                { name: 'budget', label: 'Төсөв', type: 'currency' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'proposal', label: 'Санал' }, { value: 'active', label: 'Идэвхтэй' },
                        { value: 'completed', label: 'Дууссан' }, { value: 'cancelled', label: 'Цуцлагдсан' }
                    ], defaultValue: 'proposal'
                },
            ], columns: ['projectName', 'clientName', 'budget', 'status']
        },

        'travel-agency': {
            col: 'travelPackages', fields: [
                { name: 'packageName', label: 'Аяллын нэр', type: 'text', required: true, span: 2 },
                { name: 'destination', label: 'Очих газар', type: 'text', required: true },
                { name: 'duration', label: 'Хугацаа (хоног)', type: 'number' },
                { name: 'price', label: 'Үнэ', type: 'currency', required: true },
                { name: 'capacity', label: 'Багтаамж', type: 'number' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'available', label: 'Бэлэн' }, { value: 'sold_out', label: 'Дууссан' }, { value: 'draft', label: 'Ноорог' }
                    ], defaultValue: 'available'
                },
            ], columns: ['packageName', 'destination', 'price', 'status']
        },
    };

    if (specificConfigs[moduleId]) {
        const c = specificConfigs[moduleId];
        return { collectionName: c.col, fields: c.fields, columns: c.columns };
    }

    // ═══════════════════════════════════════════════
    // Category-level fallback configs
    // ═══════════════════════════════════════════════
    const categoryFallbacks: Record<string, { col: string; fields: CrudField[]; columns: string[] }> = {
        'compliance': {
            col: moduleId.replace(/-/g, '_'), fields: [
                { name: 'title', label: 'Гарчиг', type: 'text', required: true, span: 2 },
                { name: 'type', label: 'Төрөл', type: 'text' },
                { name: 'date', label: 'Огноо', type: 'date' },
                { name: 'assignedTo', label: 'Хариуцагч', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'pending', label: 'Хүлээгдэж буй' }, { value: 'in_review', label: 'Шалгагдаж буй' },
                        { value: 'compliant', label: 'Нийцтэй' }, { value: 'non_compliant', label: 'Нийцгүй' }
                    ], defaultValue: 'pending'
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['title', 'assignedTo', 'date', 'status']
        },

        'integration': {
            col: moduleId.replace(/-/g, '_'), fields: [
                { name: 'name', label: 'Нэр', type: 'text', required: true, span: 2 },
                { name: 'apiKey', label: 'API Түлхүүр', type: 'text' },
                { name: 'endpoint', label: 'Endpoint URL', type: 'text', span: 2 },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'active', label: 'Холбогдсон' }, { value: 'inactive', label: 'Салгасан' },
                        { value: 'testing', label: 'Туршилт' }
                    ], defaultValue: 'inactive'
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['name', 'endpoint', 'status']
        },

        'iot': {
            col: moduleId.replace(/-/g, '_'), fields: [
                { name: 'deviceName', label: 'Төхөөрөмжийн нэр', type: 'text', required: true },
                { name: 'serialNumber', label: 'Серийн дугаар', type: 'text' },
                { name: 'location', label: 'Байршил', type: 'text' },
                { name: 'type', label: 'Төрөл', type: 'text' },
                {
                    name: 'status', label: 'Төлөв', type: 'select', options: [
                        { value: 'online', label: 'Онлайн' }, { value: 'offline', label: 'Оффлайн' }, { value: 'error', label: 'Алдаатай' }
                    ], defaultValue: 'online'
                },
                { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
            ], columns: ['deviceName', 'serialNumber', 'location', 'status']
        },
    };

    if (cat && categoryFallbacks[cat]) {
        return { collectionName: categoryFallbacks[cat].col, fields: categoryFallbacks[cat].fields, columns: categoryFallbacks[cat].columns };
    }

    // ═══════════════════════════════════════════════
    // Ultimate generic fallback
    // ═══════════════════════════════════════════════
    const colName = moduleId.replace(/-/g, '_');
    return {
        collectionName: colName,
        fields: [
            { name: 'name', label: 'Нэр', type: 'text', required: true, span: 2 },
            { name: 'description', label: 'Тайлбар', type: 'textarea', span: 2 },
            { name: 'type', label: 'Төрөл', type: 'text' },
            {
                name: 'status', label: 'Төлөв', type: 'select', options: [
                    { value: 'active', label: 'Идэвхтэй' }, { value: 'pending', label: 'Хүлээгдэж буй' },
                    { value: 'completed', label: 'Дууссан' }, { value: 'archived', label: 'Архивлагдсан' }
                ], defaultValue: 'active'
            },
            { name: 'notes', label: 'Тэмдэглэл', type: 'textarea', span: 2 },
        ],
        columns: ['name', 'type', 'status'],
    };
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, { bg: string; text: string }> = {
        active: { bg: 'rgba(0,206,158,0.1)', text: '#00ce9e' },
        available: { bg: 'rgba(0,206,158,0.1)', text: '#00ce9e' },
        online: { bg: 'rgba(0,206,158,0.1)', text: '#00ce9e' },
        compliant: { bg: 'rgba(0,206,158,0.1)', text: '#00ce9e' },
        pass: { bg: 'rgba(0,206,158,0.1)', text: '#00ce9e' },
        completed: { bg: 'rgba(108,92,231,0.1)', text: '#6c5ce7' },
        closed: { bg: 'rgba(108,92,231,0.1)', text: '#6c5ce7' },
        graduated: { bg: 'rgba(108,92,231,0.1)', text: '#6c5ce7' },
        resolved: { bg: 'rgba(108,92,231,0.1)', text: '#6c5ce7' },
        pending: { bg: 'rgba(253,203,110,0.1)', text: '#e17055' },
        in_progress: { bg: 'rgba(9,132,227,0.1)', text: '#0984e3' },
        in_review: { bg: 'rgba(9,132,227,0.1)', text: '#0984e3' },
        planning: { bg: 'rgba(9,132,227,0.1)', text: '#0984e3' },
        open: { bg: 'rgba(9,132,227,0.1)', text: '#0984e3' },
        inactive: { bg: 'rgba(99,110,114,0.1)', text: '#636e72' },
        offline: { bg: 'rgba(99,110,114,0.1)', text: '#636e72' },
        cancelled: { bg: 'rgba(214,48,49,0.1)', text: '#d63031' },
        fail: { bg: 'rgba(214,48,49,0.1)', text: '#d63031' },
        non_compliant: { bg: 'rgba(214,48,49,0.1)', text: '#d63031' },
        error: { bg: 'rgba(214,48,49,0.1)', text: '#d63031' },
    };
    const c = colors[status] || { bg: 'rgba(99,110,114,0.1)', text: '#636e72' };
    const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return (
        <span style={{
            display: 'inline-block', padding: '4px 10px', borderRadius: 8,
            fontSize: '0.75rem', fontWeight: 700, background: c.bg, color: c.text,
            textTransform: 'capitalize',
        }}>
            {label}
        </span>
    );
};

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export function ShellPage({ title, moduleId }: ShellPageProps) {
    const module = moduleId ? LISCORD_MODULES.find(m => m.id === moduleId) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ModuleIcon = module?.icon ? (Icons as any)[module.icon] || Database : Database;

    const { business } = useBusinessStore();
    const bizId = business?.id || '';

    const config = useMemo(() => getModuleConfig(moduleId || ''), [moduleId]);
    const collectionPath = `businesses/{bizId}/${config.collectionName}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);

    // Real-time Firestore subscription
    useEffect(() => {
        if (!bizId || !config.collectionName) { setLoading(false); return; }

        const colRef = collection(db, 'businesses', bizId, config.collectionName);
        const q = query(colRef, where('isDeleted', '==', false), orderBy('createdAt', 'desc'), limit(200));

        const unsub = onSnapshot(q, (snap) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setItems(data);
            setLoading(false);
        }, () => {
            // If query fails (no index), try without orderBy
            const fallbackQ = query(colRef, where('isDeleted', '==', false), limit(200));
            onSnapshot(fallbackQ, (snap) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                setItems(data);
                setLoading(false);
            });
        });

        return () => unsub();
    }, [bizId, config.collectionName]);

    // Filtered items
    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        const s = search.toLowerCase();
        return items.filter(item =>
            config.columns.some(col => String(item[col] || '').toLowerCase().includes(s))
        );
    }, [items, search, config.columns]);

    const formatValue = (val: unknown): string => {
        if (val === null || val === undefined) return '—';
        if (typeof val === 'number') return val.toLocaleString();
        return String(val);
    };

    return (
        <>
            <div className="inventory-page animate-fade-in">
                <div className="page-hero" style={{ marginBottom: 8 }}>
                    <div className="page-hero-left">
                        <div className="page-hero-icon">
                            <ModuleIcon size={24} />
                        </div>
                        <div>
                            <h2 className="page-hero-title">{title}</h2>
                            <p className="page-hero-subtitle">
                                {loading ? 'Ачааллаж байна...' : `${filtered.length} бичлэг`}
                            </p>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }} style={{ gap: 6 }}>
                        <Plus size={16} /> Нэмэх
                    </button>
                </div>

                {/* Toolbar */}
                <div className="inv-toolbar" style={{ marginBottom: 24 }}>
                    <div className="inv-search-wrap">
                        <Search size={18} className="inv-search-icon" />
                        <input
                            className="inv-search-input"
                            placeholder="Хайх..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Data Table */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '60px 20px',
                        background: 'var(--bg-card)', borderRadius: 16,
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px auto',
                            background: 'rgba(var(--primary-rgb), 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ModuleIcon size={28} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>
                            {search ? 'Хайлтад тохирох бичлэг олдсонгүй' : 'Одоогоор бичлэг байхгүй'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                            {search ? 'Хайлтын утгаа өөрчлөнө үү' : 'Эхний бичлэгээ нэмж эхлээрэй'}
                        </p>
                        {!search && (
                            <button className="btn btn-primary gradient-btn" onClick={() => { setEditingItem(null); setShowModal(true); }}>
                                <Plus size={16} /> Нэмэх
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: 16,
                        border: '1px solid var(--border-color)', overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        {config.columns.map(col => {
                                            const field = config.fields.find(f => f.name === col);
                                            return (
                                                <th key={col} style={{
                                                    padding: '12px 16px', textAlign: 'left',
                                                    fontSize: '0.75rem', fontWeight: 700,
                                                    color: 'var(--text-muted)', textTransform: 'uppercase',
                                                    letterSpacing: '0.5px', whiteSpace: 'nowrap'
                                                }}>
                                                    {field?.label || col}
                                                </th>
                                            );
                                        })}
                                        <th style={{ padding: '12px 16px', width: 48 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(item => (
                                        <tr key={item.id}
                                            onClick={() => { setEditingItem(item); setShowModal(true); }}
                                            style={{
                                                borderBottom: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {config.columns.map(col => (
                                                <td key={col} style={{
                                                    padding: '12px 16px', fontSize: '0.9rem',
                                                    whiteSpace: 'nowrap',
                                                    fontWeight: col === config.columns[0] ? 600 : 400,
                                                }}>
                                                    {col === 'status' || col === 'result' || col === 'level' ?
                                                        <StatusBadge status={item[col] || 'pending'} /> :
                                                        formatValue(item[col])
                                                    }
                                                </td>
                                            ))}
                                            <td style={{ padding: '12px 8px' }}>
                                                <button className="btn btn-ghost btn-sm btn-icon" onClick={e => {
                                                    e.stopPropagation();
                                                    setEditingItem(item);
                                                    setShowModal(true);
                                                }}>
                                                    <Edit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settings link */}
                {module?.hasSettings && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <a href={`/app/settings?tab=${moduleId}`} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                            <Settings size={14} /> Тохиргоо
                        </a>
                    </div>
                )}
            </div>

            {/* CRUD Modal */}
            {showModal && (
                <GenericCrudModal
                    title={title}
                    subtitle={module?.description}
                    icon={<ModuleIcon size={20} />}
                    collectionPath={collectionPath}
                    fields={config.fields}
                    editingItem={editingItem}
                    onClose={() => { setShowModal(false); setEditingItem(null); }}
                />
            )}
        </>
    );
}
