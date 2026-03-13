/**
 * Module Permissions Registry
 * 
 * Модуль бүрийн эрхүүд энд тодорхойлогдоно.
 * Бизнес модуль суулгахад, тухайн модулийн эрхүүд
 * автоматаар "Эрхүүд / Тушаал" тохиргоонд нэмэгдэнэ.
 */

import type { ModulePermission } from '../types';

// Core system permissions (always available)
export const CORE_PERMISSIONS: { group: string; permissions: ModulePermission[] }[] = [
    {
        group: 'Тохиргоо',
        permissions: [
            { id: 'settings.view', label: 'Тохиргоо харах' },
            { id: 'settings.edit_business', label: 'Бизнес мэдээлэл засах' },
            { id: 'settings.edit_orders', label: 'Захиалгын тохиргоо' },
            { id: 'settings.manage_statuses', label: 'Статус удирдах' },
            { id: 'settings.edit_notifications', label: 'Мэдэгдэл тохиргоо' },
            { id: 'settings.manage_billing', label: 'Багц/төлбөр удирдах' },
            { id: 'settings.manage_limits', label: 'Хязгаарлалт тохиргоо' },
            { id: 'settings.delete_business', label: 'Бизнес устгах (PIN)' },
        ]
    },
    {
        group: 'Баг',
        permissions: [
            { id: 'team.view', label: 'Ажилтан харах' },
            { id: 'team.invite', label: 'Ажилтан нэмэх/урих' },
            { id: 'team.edit', label: 'Ажилтан засах' },
            { id: 'team.remove', label: 'Ажилтан хасах' },
            { id: 'team.manage_positions', label: 'Албан тушаал удирдах' },
            { id: 'team.manage_permissions', label: 'Эрх тохируулах' },
            { id: 'team.view_activity', label: 'Идэвхжилийн лог харах' },
        ]
    },
    {
        group: 'Тайлан',
        permissions: [
            { id: 'reports.view_dashboard', label: 'Dashboard харах' },
            { id: 'reports.view_sales', label: 'Борлуулалтын тайлан' },
            { id: 'reports.view_revenue', label: 'Орлогын тайлан' },
            { id: 'reports.view_inventory', label: 'Нөөцийн тайлан' },
            { id: 'reports.view_customers', label: 'Харилцагчийн тайлан' },
            { id: 'reports.view_employees', label: 'Ажилтны тайлан' },
            { id: 'reports.export', label: 'Тайлан экспортлох' },
        ]
    },
    {
        group: 'Аудит',
        permissions: [
            { id: 'audit.view_own', label: 'Өөрийн лог харах' },
            { id: 'audit.view_all', label: 'Бүх лог харах' },
            { id: 'audit.export', label: 'Лог экспортлох' },
            { id: 'approval.decide', label: 'Зөвшөөрөл шийдвэрлэх' },
        ]
    },
];

/**
 * Module-specific permissions
 * Key = module id, Value = permissions array
 */
export const MODULE_PERMISSIONS: Record<string, ModulePermission[]> = {
    // ═══════════════════════════════════════
    // OPERATIONS (1-20)
    // ═══════════════════════════════════════
    'orders': [
        { id: 'orders.view_all', label: 'Бүх захиалга харах' },
        { id: 'orders.view_own', label: 'Өөрийн захиалга харах' },
        { id: 'orders.create', label: 'Захиалга үүсгэх' },
        { id: 'orders.edit_all', label: 'Бүх захиалга засах' },
        { id: 'orders.edit_own', label: 'Өөрийн захиалга засах' },
        { id: 'orders.delete', label: 'Захиалга устгах' },
        { id: 'orders.change_status', label: 'Статус өөрчлөх' },
        { id: 'orders.assign', label: 'Ажилтанд оноох' },
        { id: 'orders.view_financials', label: 'Мөнгөн дүн харах' },
        { id: 'orders.manage_payments', label: 'Төлбөр бүртгэх' },
        { id: 'orders.process_refund', label: 'Буцаалт хийх' },
        { id: 'orders.apply_discount', label: 'Хөнгөлөлт олгох' },
        { id: 'orders.export', label: 'Экспортлох' },
        { id: 'orders.bulk_actions', label: 'Бөөнөөр үйлдэл хийх' },
        { id: 'orders.print', label: 'Хэвлэх' },
        { id: 'orders.add_notes', label: 'Тэмдэглэл нэмэх' },
        { id: 'orders.manage_delivery', label: 'Хүргэлт удирдах' },
    ],

    'products': [
        { id: 'products.view', label: 'Бараа харах' },
        { id: 'products.create', label: 'Бараа нэмэх' },
        { id: 'products.edit', label: 'Бараа засах' },
        { id: 'products.delete', label: 'Бараа устгах' },
        { id: 'products.view_cost', label: 'Өртөг харах' },
        { id: 'products.manage_pricing', label: 'Үнэ тохируулах' },
        { id: 'products.manage_categories', label: 'Ангилал удирдах' },
        { id: 'products.manage_images', label: 'Зураг удирдах' },
        { id: 'products.manage_stock', label: 'Нөөц удирдах' },
    ],

    'categories': [
        { id: 'categories.view', label: 'Ангилал харах' },
        { id: 'categories.create', label: 'Ангилал нэмэх' },
        { id: 'categories.edit', label: 'Ангилал засах' },
        { id: 'categories.delete', label: 'Ангилал устгах' },
        { id: 'categories.manage_memberships', label: 'Гишүүнчлэл удирдах' },
    ],

    'inventory': [
        { id: 'inventory.view', label: 'Нөөц харах' },
        { id: 'inventory.adjust', label: 'Нөөц тохируулах (+/-)' },
        { id: 'inventory.transfer', label: 'Шилжүүлэг хийх' },
        { id: 'inventory.receive', label: 'Бараа хүлээж авах' },
        { id: 'inventory.write_off', label: 'Акталж хасах' },
        { id: 'inventory.export', label: 'Нөөцийн тайлан экспорт' },
    ],

    'multi-warehouse': [
        { id: 'warehouse.view', label: 'Агуулах харах' },
        { id: 'warehouse.create', label: 'Агуулах нэмэх' },
        { id: 'warehouse.edit', label: 'Агуулах засах' },
        { id: 'warehouse.transfer', label: 'Агуулах хоорондын шилжүүлэг' },
    ],

    'barcodes': [
        { id: 'barcodes.generate', label: 'Баркод үүсгэх' },
        { id: 'barcodes.print', label: 'Баркод хэвлэх' },
        { id: 'barcodes.scan', label: 'Баркод уншуулах' },
    ],

    'procurement': [
        { id: 'procurement.view', label: 'Худалдан авалт харах' },
        { id: 'procurement.create', label: 'Захиалга үүсгэх' },
        { id: 'procurement.approve', label: 'Захиалга зөвшөөрөх' },
        { id: 'procurement.receive', label: 'Бараа хүлээж авах' },
        { id: 'procurement.manage_vendors', label: 'Нийлүүлэгч удирдах' },
    ],

    'sourcing': [
        { id: 'sourcing.view', label: 'Сорсинг харах' },
        { id: 'sourcing.update_status', label: 'Статус шинэчлэх' },
        { id: 'sourcing.add_tracking', label: 'Tracking нэмэх' },
        { id: 'sourcing.view_cost', label: 'Сорсинг өртөг харах' },
        { id: 'sourcing.mark_fulfilled', label: 'Биелсэн тэмдэглэх' },
        { id: 'sourcing.configure', label: 'Сорсинг тохиргоо' },
    ],

    'branches': [
        { id: 'branches.view', label: 'Салбар харах' },
        { id: 'branches.create', label: 'Салбар нэмэх' },
        { id: 'branches.edit', label: 'Салбар засах' },
        { id: 'branches.view_reports', label: 'Салбарын тайлан' },
    ],

    'audit-inventory': [
        { id: 'audit_inv.start', label: 'Тооллого эхлүүлэх' },
        { id: 'audit_inv.count', label: 'Тоолж бүртгэх' },
        { id: 'audit_inv.approve', label: 'Тооллого баталгаажуулах' },
        { id: 'audit_inv.view_discrepancy', label: 'Зөрүү харах' },
    ],

    'warranty': [
        { id: 'warranty.view', label: 'Баталгаа харах' },
        { id: 'warranty.create', label: 'Баталгаа бүртгэх' },
        { id: 'warranty.process_claim', label: 'Нэхэмжлэл шийдвэрлэх' },
    ],

    'wms': [
        { id: 'wms.view_zones', label: 'Бүс/тавиур харах' },
        { id: 'wms.manage_zones', label: 'Бүс/тавиур удирдах' },
        { id: 'wms.assign_location', label: 'Байрлал зааж өгөх' },
    ],

    'drop-shipping': [
        { id: 'dropship.view', label: 'Шууд нийлүүлэлт харах' },
        { id: 'dropship.create', label: 'Нийлүүлэлт үүсгэх' },
        { id: 'dropship.manage_vendors', label: 'Нийлүүлэгч удирдах' },
    ],

    'cross-docking': [
        { id: 'crossdock.view', label: 'Түгээлт харах' },
        { id: 'crossdock.create', label: 'Түгээлт үүсгэх' },
        { id: 'crossdock.assign', label: 'Жолооч хуваарилах' },
    ],

    'rma': [
        { id: 'rma.view', label: 'Буцаалт харах' },
        { id: 'rma.create', label: 'Буцаалт үүсгэх' },
        { id: 'rma.approve', label: 'Буцаалт зөвшөөрөх' },
        { id: 'rma.process', label: 'Буцаалт гүйцэтгэх' },
    ],

    'quality-control': [
        { id: 'qc.inspect', label: 'Шалгалт хийх' },
        { id: 'qc.approve', label: 'Чанар баталгаажуулах' },
        { id: 'qc.reject', label: 'Бараа буцаах' },
        { id: 'qc.view_reports', label: 'Чанарын тайлан' },
    ],

    'inventory-forecast': [
        { id: 'forecast.view', label: 'Таамаглал харах' },
        { id: 'forecast.configure', label: 'Таамаглал тохируулах' },
    ],

    'pricing-rules': [
        { id: 'pricing.view', label: 'Үнийн бодлого харах' },
        { id: 'pricing.create', label: 'Дүрэм нэмэх' },
        { id: 'pricing.edit', label: 'Дүрэм засах' },
        { id: 'pricing.delete', label: 'Дүрэм устгах' },
    ],

    'product-variants': [
        { id: 'variants.view', label: 'Хувилбар харах' },
        { id: 'variants.manage', label: 'Хувилбар удирдах' },
    ],

    'b2b-portal': [
        { id: 'b2b.view_orders', label: 'Бөөний захиалга харах' },
        { id: 'b2b.manage_buyers', label: 'Худалдан авагч удирдах' },
        { id: 'b2b.set_pricing', label: 'Бөөний үнэ тохируулах' },
    ],

    'packaging': [
        { id: 'packaging.view', label: 'Савлагаа харах' },
        { id: 'packaging.manage', label: 'Савлагаа удирдах' },
    ],

    'serial-tracking': [
        { id: 'serial.view', label: 'Сериал мөрдөлт харах' },
        { id: 'serial.register', label: 'Сериал бүртгэх' },
        { id: 'serial.transfer', label: 'Сериал шилжүүлэх' },
    ],

    // ═══════════════════════════════════════
    // FINANCE (21-36)
    // ═══════════════════════════════════════
    'finance': [
        { id: 'finance.view_transactions', label: 'Гүйлгээ харах' },
        { id: 'finance.manage_accounts', label: 'Данс удирдах' },
        { id: 'finance.view_account_balance', label: 'Дансны үлдэгдэл' },
        { id: 'finance.manage_currencies', label: 'Валют/ханш удирдах' },
        { id: 'finance.view_debts', label: 'Авлага/өглөг харах' },
        { id: 'finance.write_off_debt', label: 'Авлага хасалт (PIN)' },
        { id: 'finance.view_reports', label: 'Санхүүгийн тайлан' },
    ],

    'payments': [
        { id: 'payments.view', label: 'Төлбөр тооцоо харах' },
        { id: 'payments.record', label: 'Төлбөр бүртгэх' },
        { id: 'payments.cancel', label: 'Төлбөр цуцлах' },
        { id: 'payments.view_debts', label: 'Авлага/өглөг харах' },
        { id: 'payments.manage_refunds', label: 'Буцаалт удирдах' },
    ],

    'invoices': [
        { id: 'invoices.view', label: 'Нэхэмжлэл харах' },
        { id: 'invoices.create', label: 'Нэхэмжлэл үүсгэх' },
        { id: 'invoices.edit', label: 'Нэхэмжлэл засах' },
        { id: 'invoices.send', label: 'Нэхэмжлэл илгээх' },
        { id: 'invoices.void', label: 'Нэхэмжлэл цуцлах' },
    ],

    'ebarimt': [
        { id: 'ebarimt.view', label: 'И-Баримт харах' },
        { id: 'ebarimt.issue', label: 'Баримт олгох' },
        { id: 'ebarimt.void', label: 'Баримт цуцлах' },
        { id: 'ebarimt.configure', label: 'И-Баримт тохиргоо' },
    ],

    'expenses': [
        { id: 'expenses.view', label: 'Зардал харах' },
        { id: 'expenses.create', label: 'Зардал бүртгэх' },
        { id: 'expenses.approve', label: 'Зардал зөвшөөрөх' },
        { id: 'expenses.delete', label: 'Зардал устгах' },
        { id: 'expenses.view_reports', label: 'Зардлын тайлан' },
    ],

    'assets': [
        { id: 'assets.view', label: 'Хөрөнгө харах' },
        { id: 'assets.create', label: 'Хөрөнгө бүртгэх' },
        { id: 'assets.dispose', label: 'Хөрөнгө актлах' },
        { id: 'assets.depreciate', label: 'Элэгдэл тооцох' },
    ],

    'loans': [
        { id: 'loans.view', label: 'Зээл харах' },
        { id: 'loans.create', label: 'Зээл олгох' },
        { id: 'loans.collect', label: 'Зээл цуглуулах' },
        { id: 'loans.write_off', label: 'Зээл хасах (PIN)' },
        { id: 'loans.manage_interest', label: 'Хүү тохируулах' },
    ],

    'budgeting': [
        { id: 'budgeting.view', label: 'Төсөв харах' },
        { id: 'budgeting.create', label: 'Төсөв үүсгэх' },
        { id: 'budgeting.approve', label: 'Төсөв батлах' },
        { id: 'budgeting.track', label: 'Гүйцэтгэл хянах' },
    ],

    'multi-currency': [
        { id: 'multicurrency.view', label: 'Ханш харах' },
        { id: 'multicurrency.manage', label: 'Ханш тохируулах' },
        { id: 'multicurrency.convert', label: 'Валют хөрвүүлэх' },
    ],

    'bank-sync': [
        { id: 'banksync.view', label: 'Холболт харах' },
        { id: 'banksync.configure', label: 'Холболт тохируулах' },
        { id: 'banksync.reconcile', label: 'Гүйлгээ нийлүүлэх' },
    ],

    'sms-income-sync': [
        { id: 'smsincome.view', label: 'SMS орлого харах' },
        { id: 'smsincome.configure', label: 'SMS тохиргоо' },
        { id: 'smsincome.match', label: 'Захиалгатай холбох' },
    ],

    'factoring': [
        { id: 'factoring.view', label: 'Факторинг харах' },
        { id: 'factoring.create', label: 'Факторинг үүсгэх' },
        { id: 'factoring.manage', label: 'Факторинг удирдах' },
    ],

    'petty-cash': [
        { id: 'pettycash.view', label: 'Бэлэн касс харах' },
        { id: 'pettycash.transact', label: 'Гүйлгээ хийх' },
        { id: 'pettycash.reconcile', label: 'Тооцоо нийлүүлэх' },
    ],

    'inter-company': [
        { id: 'interco.view', label: 'Компани хоорондын харах' },
        { id: 'interco.transact', label: 'Гүйлгээ хийх' },
        { id: 'interco.reconcile', label: 'Тооцоо нийлүүлэх' },
    ],

    'consolidations': [
        { id: 'consolidation.view', label: 'Нэгтгэсэн тайлан' },
        { id: 'consolidation.generate', label: 'Тайлан үүсгэх' },
    ],

    'crypto-payments': [
        { id: 'crypto.view', label: 'Крипто төлбөр харах' },
        { id: 'crypto.accept', label: 'Крипто хүлээж авах' },
        { id: 'crypto.configure', label: 'Крипто тохиргоо' },
    ],

    // ═══════════════════════════════════════
    // STAFF (37-51)
    // ═══════════════════════════════════════
    'employees': [
        { id: 'employees.view', label: 'Ажилтнууд харах' },
        { id: 'employees.create', label: 'Ажилтан нэмэх' },
        { id: 'employees.edit', label: 'Ажилтан засах' },
        { id: 'employees.deactivate', label: 'Ажилтан идэвхгүйжүүлэх' },
        { id: 'employees.view_salary', label: 'Цалин харах' },
    ],

    'attendance': [
        { id: 'attendance.view', label: 'Ирц харах' },
        { id: 'attendance.check_in', label: 'Ирц бүртгэх' },
        { id: 'attendance.edit', label: 'Ирц засах' },
        { id: 'attendance.view_reports', label: 'Ирцийн тайлан' },
        { id: 'attendance.manage_rules', label: 'Ирцийн дүрэм' },
    ],

    'payroll': [
        { id: 'payroll.view', label: 'Цалин харах' },
        { id: 'payroll.calculate', label: 'Цалин тооцох' },
        { id: 'payroll.approve', label: 'Цалин батлах' },
        { id: 'payroll.pay', label: 'Цалин олгох' },
        { id: 'payroll.view_reports', label: 'Цалингийн тайлан' },
        { id: 'payroll.manage_rules', label: 'Цалингийн дүрэм' },
    ],

    'recruitment': [
        { id: 'recruitment.view', label: 'Сонгон шалгаруулалт харах' },
        { id: 'recruitment.create_job', label: 'Ажлын зар нийтлэх' },
        { id: 'recruitment.review', label: 'Өргөдөл шүүх' },
        { id: 'recruitment.interview', label: 'Ярилцлага товлох' },
        { id: 'recruitment.hire', label: 'Ажилд авах' },
    ],

    'leave': [
        { id: 'leave.view', label: 'Чөлөө/амралт харах' },
        { id: 'leave.request', label: 'Чөлөө хүсэх' },
        { id: 'leave.approve', label: 'Чөлөө зөвшөөрөх' },
        { id: 'leave.manage_policy', label: 'Амралтын бодлого' },
    ],

    'performance': [
        { id: 'performance.view_own', label: 'Өөрийн үнэлгээ харах' },
        { id: 'performance.view_all', label: 'Бүх үнэлгээ харах' },
        { id: 'performance.evaluate', label: 'Үнэлгээ өгөх' },
        { id: 'performance.set_kpi', label: 'KPI тодорхойлох' },
    ],

    'training': [
        { id: 'training.view', label: 'Сургалт харах' },
        { id: 'training.create', label: 'Сургалт үүсгэх' },
        { id: 'training.assign', label: 'Сургалтад оноох' },
        { id: 'training.view_results', label: 'Үр дүн харах' },
    ],

    'shifts': [
        { id: 'shifts.view', label: 'Ээлжийн хуваарь харах' },
        { id: 'shifts.create', label: 'Хуваарь үүсгэх' },
        { id: 'shifts.swap', label: 'Ээлж солих' },
        { id: 'shifts.approve_swap', label: 'Солилцоог зөвшөөрөх' },
    ],

    'benefits': [
        { id: 'benefits.view', label: 'Урамшуулал харах' },
        { id: 'benefits.manage', label: 'Урамшуулал удирдах' },
        { id: 'benefits.enroll', label: 'Бүртгүүлэх' },
    ],

    'surveys': [
        { id: 'surveys.view', label: 'Судалгаа харах' },
        { id: 'surveys.create', label: 'Судалгаа үүсгэх' },
        { id: 'surveys.respond', label: 'Судалгаанд хариулах' },
        { id: 'surveys.view_results', label: 'Үр дүн харах' },
    ],

    'offboarding': [
        { id: 'offboarding.view', label: 'Гарах үйл явц харах' },
        { id: 'offboarding.initiate', label: 'Гарах үйл явц эхлүүлэх' },
        { id: 'offboarding.approve', label: 'Хүлээлцэх батлах' },
    ],

    'timesheets': [
        { id: 'timesheets.view', label: 'Цагийн лог харах' },
        { id: 'timesheets.log', label: 'Цаг бүртгэх' },
        { id: 'timesheets.approve', label: 'Цаг батлах' },
    ],

    'remote-tracker': [
        { id: 'remote.view', label: 'Зайны хяналт харах' },
        { id: 'remote.track', label: 'Ажилтан мөрдөх' },
        { id: 'remote.configure', label: 'Хяналт тохируулах' },
    ],

    'expenses-claim': [
        { id: 'expclaim.view', label: 'Нэхэмжлэл харах' },
        { id: 'expclaim.submit', label: 'Нэхэмжлэл илгээх' },
        { id: 'expclaim.approve', label: 'Нэхэмжлэл зөвшөөрөх' },
    ],

    'freelancer-mgt': [
        { id: 'freelancer.view', label: 'Гэрээт ажилтан харах' },
        { id: 'freelancer.create', label: 'Гэрээт ажилтан нэмэх' },
        { id: 'freelancer.manage_contracts', label: 'Гэрээ удирдах' },
        { id: 'freelancer.pay', label: 'Төлбөр хийх' },
    ],

    'online-presence': [
        { id: 'online.view', label: 'Онлайн төлөв харах' },
        { id: 'online.view_history', label: 'Идэвхжилтийн түүх харах' },
    ],

    // ═══════════════════════════════════════
    // SALES/CRM (52-55)
    // ═══════════════════════════════════════
    'customers': [
        { id: 'customers.view', label: 'Харилцагч харах' },
        { id: 'customers.create', label: 'Харилцагч нэмэх' },
        { id: 'customers.edit', label: 'Харилцагч засах' },
        { id: 'customers.delete', label: 'Харилцагч устгах' },
        { id: 'customers.view_history', label: 'Захиалгын түүх' },
        { id: 'customers.view_financials', label: 'Тооцоо харах' },
        { id: 'customers.manage_credit', label: 'Зээл удирдах' },
        { id: 'customers.manage_tags', label: 'Шошго удирдах' },
        { id: 'customers.export', label: 'Экспортлох' },
    ],

    'messenger': [
        { id: 'messenger.view', label: 'Чаат харах' },
        { id: 'messenger.reply', label: 'Хариулах' },
        { id: 'messenger.manage_channels', label: 'Суваг удирдах' },
    ],

    'campaigns': [
        { id: 'campaigns.view', label: 'Кампанит ажил харах' },
        { id: 'campaigns.create', label: 'Кампанит ажил үүсгэх' },
        { id: 'campaigns.send', label: 'Илгээх' },
        { id: 'campaigns.view_analytics', label: 'Статистик харах' },
    ],

    'loyalty': [
        { id: 'loyalty.view', label: 'Лоялти харах' },
        { id: 'loyalty.manage_programs', label: 'Хөтөлбөр удирдах' },
        { id: 'loyalty.award_points', label: 'Оноо олгох' },
        { id: 'loyalty.redeem_points', label: 'Оноо хэрэглэх' },
    ],
};

/**
 * Get active permissions for a business based on installed modules
 */
export function getActivePermissions(activeModuleIds: string[]): { group: string; permissions: ModulePermission[] }[] {
    const groups: { group: string; permissions: ModulePermission[] }[] = [
        ...CORE_PERMISSIONS,
    ];

    // Import module list to get display names
    // We need to lazily resolve to avoid circular imports
    for (const moduleId of activeModuleIds) {
        const perms = MODULE_PERMISSIONS[moduleId];
        if (perms && perms.length > 0) {
            // Use module ID as group name — will be resolved to display name in UI
            groups.push({
                group: moduleId,
                permissions: perms,
            });
        }
    }

    return groups;
}

/**
 * Get ALL permissions (for backward compatibility)
 * Returns flat Record<string, { label: string; group: string }>
 */
export function getAllPermissionsFlat(activeModuleIds?: string[]): Record<string, { label: string; group: string }> {
    const result: Record<string, { label: string; group: string }> = {};

    // Core permissions
    for (const group of CORE_PERMISSIONS) {
        for (const perm of group.permissions) {
            result[perm.id] = { label: perm.label, group: group.group };
        }
    }

    // Module permissions
    const moduleIds = activeModuleIds || Object.keys(MODULE_PERMISSIONS);
    for (const moduleId of moduleIds) {
        const perms = MODULE_PERMISSIONS[moduleId];
        if (perms) {
            for (const perm of perms) {
                result[perm.id] = { label: perm.label, group: moduleId };
            }
        }
    }

    return result;
}
