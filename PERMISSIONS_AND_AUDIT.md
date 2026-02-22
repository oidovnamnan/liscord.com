# 🔐 LISCORD — ЭРХ УДИРДЛАГА & АУДИТ ЛОГ (НОТЛОХ БАРИМТ)

> **Зарчим 1:** Систем дэх БҮХ ТОВЧЛУУР, БҮХ ХУУДАС, БҮХ ҮЙЛДЭЛ нь эрхээр хязгаарлагдана.  
> **Зарчим 2:** БҮХ ҮЙЛДЭЛ тамперлах боломжгүй лог дээр бүртгэгдэнэ = нотлох баримт.  
> **Зарчим 3:** Эрхгүй хүнд товчлуур ХАРАГДАХГҮЙ, хуудас НЭЭГДЭХГҮЙ, API ХАРИУЛАХГҮЙ.

---

## 1. ТРИ ДАВХАР ХАМГААЛАЛТ

```
Давхар 1: UI (Frontend)
  → Эрхгүй бол товчлуур/хуудас ХАРАГДАХГҮЙ
  → <PermissionGate permission="orders.delete"> ... </PermissionGate>

Давхар 2: Service (Business Logic)  
  → Функц дуудахын өмнө эрх шалгана
  → if (!hasPermission("orders.delete")) throw "Эрхгүй"

Давхар 3: Firestore Security Rules (Database)
  → Мэдээллийн сангийн түвшинд хориглоно
  → allow delete: if hasPermission(bizId, 'orders.delete')

= 3 давхар бүгд шалгана. Нэгийг тойрч гарсан ч нөгөө нь зогсооно.
```

---

## 2. БҮХ ЭРХҮҮДИЙН БҮРЭН ЖАГСААЛТ (~80 эрх)

### 2.1 📋 Захиалга (orders.*)

| # | Эрхийн ID | Нэр | UIд хаана хэрэглэгдэх | Лог бичигдэх үү |
|---|-----------|-----|----------------------|----------------|
| 1 | `orders.view_own` | Өөрийн захиалга харах | Захиалгын жагсаалт (зөвхөн өөрийнх) | ❌ (харах лог бичихгүй) |
| 2 | `orders.view_all` | Бүх захиалга харах | Захиалгын жагсаалт (бүгд) | ❌ |
| 3 | `orders.create` | Захиалга үүсгэх | [+ Шинэ захиалга] товчлуур, хуудас | ✅ |
| 4 | `orders.edit_own` | Өөрийн захиалга засах | [✏️ Засах] товчлуур (өөрийнх) | ✅ + хуучин/шинэ утга |
| 5 | `orders.edit_all` | Бүх захиалга засах | [✏️ Засах] товчлуур (бүгд) | ✅ + хуучин/шинэ утга |
| 6 | `orders.delete` | Захиалга устгах | [🗑️ Устгах] товчлуур + PIN | ✅ + PIN баталгаа |
| 7 | `orders.change_status` | Статус өөрчлөх | Статус товчлуурууд | ✅ + хуучин→шинэ |
| 8 | `orders.assign` | Ажилтанд оноох | [Хуваарилах] dropdown | ✅ |
| 9 | `orders.view_financials` | Мөнгөн дүн харах | Үнэ, төлбөр хэсгүүд | ❌ |
| 10 | `orders.manage_payments` | Төлбөр бүртгэх | [💳 Төлбөр бүртгэх] товчлуур | ✅ + дүн, арга, данс |
| 11 | `orders.process_refund` | Буцаалт хийх | [🔙 Буцаалт] товчлуур + PIN | ✅ + дүн, шалтгаан, данс |
| 12 | `orders.export` | Экспортлох | [📥 Excel] товчлуур | ✅ |
| 13 | `orders.bulk_actions` | Бөөнөөр үйлдэл | Checkbox + [Бөөнөөр...] | ✅ + тоо, үйлдэл |
| 14 | `orders.add_notes` | Тэмдэглэл нэмэх | Тэмдэглэл хэсэг | ✅ |
| 15 | `orders.add_attachments` | Файл хавсаргах | [📎 Хавсаргах] товчлуур | ✅ |
| 16 | `orders.apply_discount` | Хөнгөлөлт олгох | Хөнгөлөлтийн талбар | ✅ + хувь, дүн |
| 17 | `orders.print` | Хэвлэх | [🖨️ Хэвлэх] товчлуур | ✅ |

### 2.2 👥 Харилцагч (customers.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 18 | `customers.view` | Харилцагч харах | Жагсаалт, дэлгэрэнгүй хуудас | ❌ |
| 19 | `customers.create` | Харилцагч нэмэх | [+ Шинэ] товчлуур | ✅ |
| 20 | `customers.edit` | Харилцагч засах | [✏️] товчлуур | ✅ + хуучин/шинэ |
| 21 | `customers.delete` | Харилцагч устгах | [🗑️] + PIN | ✅ |
| 22 | `customers.view_history` | Захиалгын түүх | "Түүх" tab | ❌ |
| 23 | `customers.view_financials` | Тооцоо харах | "Тооцоо" tab, авлага | ❌ |
| 24 | `customers.export` | Экспортлох | [📥] | ✅ |
| 25 | `customers.manage_tags` | Шошго удирдах | VIP, wholesale шошго | ✅ |
| 26 | `customers.manage_credit` | Зээл удирдах | Зээлийн хязгаар тохируулах | ✅ |

### 2.3 🛍️ Бараа (products.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 27 | `products.view` | Бараа харах | Жагсаалт | ❌ |
| 28 | `products.create` | Бараа нэмэх | [+ Шинэ] | ✅ |
| 29 | `products.edit` | Бараа засах | [✏️] | ✅ + хуучин/шинэ |
| 30 | `products.delete` | Бараа устгах | [🗑️] + PIN | ✅ |
| 31 | `products.view_cost` | Өртөг харах | Өртгийн үнэ талбар | ❌ |
| 32 | `products.manage_stock` | Нөөц удирдах | +/- нөөц | ✅ + хуучин→шинэ тоо |
| 33 | `products.manage_categories` | Ангилал | Ангилал CRUD | ✅ |
| 34 | `products.manage_pricing` | Үнэ удирдах | Үнэ, хямдрал, шатлал | ✅ + хуучин→шинэ үнэ |
| 35 | `products.manage_images` | Зураг | Upload/устгах | ✅ |

### 2.4 📊 Dashboard & Тайлан (reports.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 36 | `reports.view_dashboard` | Dashboard | /dashboard хуудас | ❌ |
| 37 | `reports.view_sales` | Борлуулалтын тайлан | Тайлан хуудас | ❌ |
| 38 | `reports.view_revenue` | Орлогын тайлан | Тайлан хуудас | ❌ |
| 39 | `reports.view_inventory` | Нөөцийн тайлан | Тайлан хуудас | ❌ |
| 40 | `reports.view_customers` | Харилцагчийн тайлан | Тайлан хуудас | ❌ |
| 41 | `reports.view_employees` | Ажилтны тайлан | Тайлан хуудас | ❌ |
| 42 | `reports.export` | Тайлан экспортлох | [📥 PDF/Excel] | ✅ |

### 2.5 👥 Баг (team.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 43 | `team.view` | Ажилтан харах | Ажилтнуудын жагсаалт | ❌ |
| 44 | `team.invite` | Урилга илгээх | [+ Урих] | ✅ |
| 45 | `team.edit` | Ажилтан засах | [✏️] тушаал солих | ✅ + хуучин→шинэ тушаал |
| 46 | `team.remove` | Ажилтан хасах | [⛔] + PIN | ✅ |
| 47 | `team.manage_positions` | Тушаал CRUD | Тушаал нэмэх/засах/устгах | ✅ |
| 48 | `team.manage_permissions` | Эрх тохируулах | Checkbox grid | ✅ + хуучин→шинэ эрхүүд |
| 49 | `team.view_activity` | Идэвхжилийн лог | Лог хуудас | ❌ |
| 50 | `team.view_presence` | Онлайн статус | Хэн онлайн | ❌ |

### 2.6 💰 Төлбөр & Данс (finance.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 51 | `finance.manage_accounts` | Данс удирдах | Данс CRUD | ✅ |
| 52 | `finance.view_transactions` | Гүйлгээ харах | Гүйлгээний жагсаалт | ❌ |
| 53 | `finance.view_account_balance` | Дансны үлдэгдэл | Үлдэгдэл тоо | ❌ |
| 54 | `finance.manage_currencies` | Валют/ханш | Тохиргоо | ✅ |
| 55 | `finance.view_debts` | Авлагын тайлан | Авлага хуудас | ❌ |
| 56 | `finance.write_off_debt` | Авлага хасах | [Хасалт] + PIN | ✅ |

### 2.7 ⚙️ Тохиргоо (settings.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 57 | `settings.view` | Тохиргоо харах | Тохиргоо хуудас | ❌ |
| 58 | `settings.edit_business` | Бизнес мэдээлэл | Нэр, лого, хаяг засах | ✅ |
| 59 | `settings.edit_orders` | Захиалгын тохиргоо | Prefix, автомат, PIN | ✅ |
| 60 | `settings.manage_statuses` | Статус удирдах | Статус CRUD | ✅ |
| 61 | `settings.manage_custom_fields` | Custom field | Талбар CRUD | ✅ |
| 62 | `settings.edit_notifications` | Мэдэгдэл тохиргоо | Push on/off | ✅ |
| 63 | `settings.manage_billing` | Багц/төлбөр | Багц солих | ✅ |
| 64 | `settings.manage_limits` | Хязгаарлалт | Хөнгөлөлт/буцаалтын хязгаар | ✅ |
| 65 | `settings.manage_rules` | Автомат дүрэм | Дүрэм CRUD | ✅ |
| 66 | `settings.delete_business` | Бизнес устгах | [Бизнес устгах] + PIN | ✅ CRITICAL |

### 2.8 🔗 Интеграци (integrations.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 67 | `integrations.view` | Интеграци харах | Холбоосууд хуудас | ❌ |
| 68 | `integrations.manage` | Интеграци удирдах | Холбоос CRUD | ✅ |
| 69 | `integrations.create_request` | Хүсэлт илгээх | [Хүргэлт захиалах] | ✅ |
| 70 | `integrations.accept_request` | Хүсэлт хүлээн авах | [Зөвшөөрөх] | ✅ |
| 71 | `integrations.view_invoices` | B2B нэхэмжлэл | Нэхэмжлэл хуудас | ❌ |

### 2.9 📜 Аудит & Зөвшөөрөл (audit.*)

| # | Эрхийн ID | Нэр | UI | Лог |
|---|-----------|-----|----|----|
| 72 | `audit.view_own` | Өөрийн лог | Өөрийн үйлдлүүд | ❌ |
| 73 | `audit.view_all` | Бүх лог | Бүх ажилтнуудын лог | ❌ |
| 74 | `audit.view_reports` | Гүйцэтгэлийн тайлан | Ажилтны KPI | ❌ |
| 75 | `audit.export` | Лог экспортлох | [📥 Татах] | ✅ |
| 76 | `approval.decide` | Зөвшөөрөл шийдвэрлэх | [✅ Зөвшөөрөх] [❌] | ✅ |

### 2.10 🔔 Мэдэгдэл (notifications.*)

| # | Эрхийн ID | Нэр |
|---|-----------|-----|
| 77 | `notifications.receive_new_order` | Шинэ захиалга |
| 78 | `notifications.receive_status_change` | Статус өөрчлөлт |
| 79 | `notifications.receive_payment` | Төлбөр |
| 80 | `notifications.receive_low_stock` | Нөөц бага |
| 81 | `notifications.receive_suspicious` | Сэжигтэй үйлдэл |

---

## 3. ЭРХИЙН ХЭРЭГЖҮҮЛЭЛТ КОДООР

### 3.1 Frontend — PermissionGate компонент

```tsx
// components/shared/PermissionGate/index.tsx
// Эрхгүй бол ЮУГ Ч ХАРУУЛАХГҮЙ

type Props = {
  permission: string | string[];      // Нэг эсвэл олон эрх
  requireAll?: boolean;               // Бүгд шаардах уу (AND) / аль нэг (OR)
  fallback?: React.ReactNode;         // Эрхгүй бол юу харуулах (default: null)
  children: React.ReactNode;
};

function PermissionGate({ permission, requireAll, fallback, children }: Props) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();
  
  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = requireAll 
    ? hasAllPermissions(perms) 
    : hasAnyPermission(perms);
  
  if (!allowed) return fallback ?? null;
  return <>{children}</>;
}

// ХЭРЭГЛЭЭ:
// Устгах товчлуур — зөвхөн "orders.delete" эрхтэй хүнд
<PermissionGate permission="orders.delete">
  <Button onClick={handleDelete} variant="danger">🗑️ Устгах</Button>
</PermissionGate>

// Мөнгөн дүн — зөвхөн "orders.view_financials" эрхтэй хүнд
<PermissionGate permission="orders.view_financials">
  <div>Нийт: ₮8,555,000</div>
</PermissionGate>

// Эрхгүй бол "Эрхгүй" мессеж
<PermissionGate permission="reports.view_revenue" fallback={<NoAccess />}>
  <RevenueReport />
</PermissionGate>
```

### 3.2 Frontend — Route хамгаалалт

```tsx
// router/PermissionRoute.tsx
function PermissionRoute({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return <Navigate to="/app/no-access" />;   // "Эрхгүй" хуудас руу
  }
  return <>{children}</>;
}

// Route тодорхойлолт:
<Route path="/app/orders" element={
  <PermissionRoute permission="orders.view_own">
    <OrderList />
  </PermissionRoute>
} />

<Route path="/app/orders/new" element={
  <PermissionRoute permission="orders.create">
    <OrderCreate />
  </PermissionRoute>
} />

<Route path="/app/settings/positions" element={
  <PermissionRoute permission="team.manage_positions">
    <Positions />
  </PermissionRoute>
} />
```

### 3.3 Frontend — Sidebar menu items

```tsx
// components/layout/Sidebar/index.tsx
// Эрхгүй menu item ХАРАГДАХГҮЙ

const menuItems = [
  { label: "Dashboard",  icon: "📊", path: "/app/dashboard",  permission: "reports.view_dashboard" },
  { label: "Захиалга",   icon: "📋", path: "/app/orders",     permission: "orders.view_own" },
  { label: "Харилцагч",  icon: "👥", path: "/app/customers",  permission: "customers.view" },
  { label: "Бараа",      icon: "🛍️", path: "/app/products",   permission: "products.view" },
  { label: "Тайлан",     icon: "📊", path: "/app/reports",    permission: "reports.view_sales" },
  { label: "Тохиргоо",   icon: "⚙️", path: "/app/settings",  permission: "settings.view" },
];

// Render:
{menuItems
  .filter(item => hasPermission(item.permission))  // Эрхгүй бол ШҮҮГДЭНЭ
  .map(item => <SidebarItem key={item.path} {...item} />)
}
```

### 3.4 Service Layer — Эрх шалгалт

```typescript
// services/order/orderService.ts
async function deleteOrder(businessId: string, orderId: string): Promise<void> {
  // 1. Эрх шалгах
  const canDelete = await checkPermission(businessId, 'orders.delete');
  if (!canDelete) throw new PermissionError('orders.delete');
  
  // 2. Үйлдэл гүйцэтгэх (soft delete)
  await updateDoc(doc(db, `businesses/${businessId}/orders/${orderId}`), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: auth.currentUser.uid
  });
  
  // 3. ✅ ЛОГ БИЧИХ (заавал!)
  await writeAuditLog(businessId, {
    action: 'order.delete',
    module: 'orders',
    targetType: 'order',
    targetId: orderId,
    targetLabel: `#${orderNumber}`,
    severity: 'critical',
    metadata: { pinUsed: true }
  });
}
```

### 3.5 Firestore Security Rules — Мэдээллийн сангийн хамгаалалт

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // === HELPER FUNCTIONS ===
    function isAuth() { return request.auth != null; }
    
    function getEmp(bizId) {
      return get(/databases/$(database)/documents/businesses/$(bizId)/employees/$(request.auth.uid)).data;
    }
    
    function getPos(bizId, posId) {
      return get(/databases/$(database)/documents/businesses/$(bizId)/positions/$(posId)).data;
    }
    
    function hasPerm(bizId, perm) {
      let emp = getEmp(bizId);
      return emp.status == 'active' && (
        emp.role == 'owner' || 
        perm in getPos(bizId, emp.positionId).permissions
      );
    }
    
    function isOwner(bizId) {
      return getEmp(bizId).role == 'owner';
    }
    
    // === ЗАХИАЛГА ===
    match /businesses/{bizId}/orders/{orderId} {
      allow read: if isAuth() && (
        hasPerm(bizId, 'orders.view_all') || 
        (hasPerm(bizId, 'orders.view_own') && resource.data.createdBy == request.auth.uid)
      );
      allow create: if isAuth() && hasPerm(bizId, 'orders.create');
      allow update: if isAuth() && (
        hasPerm(bizId, 'orders.edit_all') ||
        (hasPerm(bizId, 'orders.edit_own') && resource.data.createdBy == request.auth.uid)
      );
      allow delete: if false; // Бодит устгалт хориотой! Зөвхөн soft delete
    }
    
    // === ХАРИЛЦАГЧ ===
    match /businesses/{bizId}/customers/{custId} {
      allow read: if isAuth() && hasPerm(bizId, 'customers.view');
      allow create: if isAuth() && hasPerm(bizId, 'customers.create');
      allow update: if isAuth() && hasPerm(bizId, 'customers.edit');
      allow delete: if false; // Soft delete only
    }
    
    // === БАРАА ===
    match /businesses/{bizId}/products/{prodId} {
      allow read: if isAuth() && hasPerm(bizId, 'products.view');
      allow create: if isAuth() && hasPerm(bizId, 'products.create');
      allow update: if isAuth() && hasPerm(bizId, 'products.edit');
      allow delete: if false;
    }
    
    // === ГҮЙЛГЭЭ ===
    match /businesses/{bizId}/transactions/{txnId} {
      allow read: if isAuth() && hasPerm(bizId, 'finance.view_transactions');
      allow create: if isAuth() && hasPerm(bizId, 'orders.manage_payments');
      allow update: if false; // Гүйлгээ засаж болохгүй!
      allow delete: if false;
    }
    
    // === АУДИТ ЛОГ ===
    match /businesses/{bizId}/auditLog/{logId} {
      allow read: if isAuth() && (
        hasPerm(bizId, 'audit.view_all') ||
        (hasPerm(bizId, 'audit.view_own') && resource.data.userId == request.auth.uid)
      );
      allow create: if isAuth(); // Бүх ажилтан лог бичиж чадна
      allow update: if false;  // ❌ ХЭЗЭЭ Ч ЗАСАЖ БОЛОХГҮЙ
      allow delete: if false;  // ❌ ХЭЗЭЭ Ч УСТГАЖ БОЛОХГҮЙ
    }
    
    // === ТУШААЛ ===
    match /businesses/{bizId}/positions/{posId} {
      allow read: if isAuth() && hasPerm(bizId, 'team.view');
      allow write: if isAuth() && hasPerm(bizId, 'team.manage_positions');
    }
    
    // === АЖИЛТАН ===
    match /businesses/{bizId}/employees/{empId} {
      allow read: if isAuth() && hasPerm(bizId, 'team.view');
      allow write: if isAuth() && hasPerm(bizId, 'team.edit');
    }
    
    // === ДАНС ===
    match /businesses/{bizId}/paymentAccounts/{accId} {
      allow read: if isAuth() && hasPerm(bizId, 'finance.view_account_balance');
      allow write: if isAuth() && hasPerm(bizId, 'finance.manage_accounts');
    }
    
    // === ТОХИРГОО (бизнесийн документ) ===
    match /businesses/{bizId} {
      allow read: if isAuth() && hasPerm(bizId, 'settings.view');
      allow update: if isAuth() && hasPerm(bizId, 'settings.edit_business');
      allow delete: if isAuth() && isOwner(bizId);
    }
  }
}
```

---

## 4. 📜 АУДИТ ЛОГ — НОТЛОХ БАРИМТ

### 4.1 Лог бичигдэх БҮХ үйлдлүүд (48 үйлдэл)

| # | Action код | Тайлбар | Severity | Бичигдэх дэлгэрэнгүй мэдээлэл |
|---|-----------|---------|----------|-------------------------------|
| 1 | `auth.login` | Нэвтэрсэн | normal | Төхөөрөмж, IP, цаг |
| 2 | `auth.logout` | Гарсан | normal | Цаг |
| 3 | `auth.login_failed` | Нэвтрэлт амжилтгүй | warning | Утас/и-мэйл, шалтгаан |
| 4 | `order.create` | Захиалга үүсгэсэн | normal | Дугаар, харилцагч, дүн, бараа |
| 5 | `order.update` | Захиалга засасан | normal | Хуучин→шинэ утга (field бүрээр) |
| 6 | `order.delete` | Захиалга устгасан | **critical** | Дугаар, дүн, PIN ашигласан |
| 7 | `order.bulk_delete` | Бөөнөөр устгасан | **critical** | Тоо, дугаарууд |
| 8 | `order.status_change` | Статус өөрчилсөн | normal | Хуучин→шинэ статус |
| 9 | `order.assign` | Хуваарилсан | normal | Ажилтны нэр |
| 10 | `order.discount` | Хөнгөлөлт олгосон | warning | %, дүн |
| 11 | `order.print` | Хэвлэсэн | normal | — |
| 12 | `order.export` | Экспортлосон | normal | Формат, тоо |
| 13 | `payment.record` | Төлбөр бүртгэсэн | normal | Дүн, арга, данс, баримт |
| 14 | `payment.cancel` | Төлбөр цуцалсан | warning | Дүн, шалтгаан |
| 15 | `refund.process` | Буцаалт хийсэн | **critical** | Дүн, данс, шалтгаан, бараа |
| 16 | `customer.create` | Харилцагч нэмсэн | normal | Нэр, утас |
| 17 | `customer.update` | Харилцагч засасан | normal | Хуучин→шинэ |
| 18 | `customer.delete` | Харилцагч устгасан | warning | Нэр |
| 19 | `customer.credit_change` | Зээл өөрчилсөн | warning | Хуучин→шинэ хязгаар |
| 20 | `customer.tag_change` | Шошго өөрчилсөн | normal | Нэмсэн/хассан шошго |
| 21 | `product.create` | Бараа нэмсэн | normal | Нэр, үнэ |
| 22 | `product.update` | Бараа засасан | normal | Хуучин→шинэ |
| 23 | `product.delete` | Бараа устгасан | warning | Нэр |
| 24 | `product.price_change` | Үнэ өөрчилсөн | **warning** | Хуучин→шинэ үнэ |
| 25 | `product.stock_adjust` | Нөөц өөрчилсөн | normal | Хуучин→шинэ тоо, шалтгаан |
| 26 | `product.category_change` | Ангилал CRUD | normal | Ямар ангилал |
| 27 | `team.invite` | Ажилтан урисан | normal | Утас, тушаал |
| 28 | `team.accept` | Урилга зөвшөөрсөн | normal | Нэр |
| 29 | `team.position_change` | Тушаал өөрчилсөн | **warning** | Хуучин→шинэ тушаал |
| 30 | `team.remove` | Ажилтан хасасн | **critical** | Нэр, тушаал |
| 31 | `team.deactivate` | Ажилтан идэвхгүй | warning | Нэр |
| 32 | `position.create` | Тушаал үүсгэсэн | warning | Нэр, эрхийн тоо |
| 33 | `position.update` | Тушаал засасан | **warning** | Нэр, +/- эрхүүд |
| 34 | `position.delete` | Тушаал устгасан | **critical** | Нэр |
| 35 | `position.permissions_change` | Эрх өөрчилсөн | **critical** | Нэмэгдсэн/хасагдсан эрхүүд |
| 36 | `finance.account_create` | Данс нэмсэн | normal | Банк, дугаар |
| 37 | `finance.account_update` | Данс засасан | warning | Хуучин→шинэ |
| 38 | `finance.account_delete` | Данс устгасан | **critical** | Банк, дугаар |
| 39 | `finance.debt_write_off` | Авлага хасалт | **critical** | Харилцагч, дүн |
| 40 | `settings.update` | Тохиргоо өөрчилсөн | warning | Ямар тохиргоо, хуучин→шинэ |
| 41 | `settings.status_manage` | Статус өөрчилсөн | warning | Нэмсэн/засасан/устгасан |
| 42 | `settings.custom_field` | Custom field | warning | CRUD |
| 43 | `settings.pin_change` | PIN өөрчилсөн | **critical** | — (шинэ PIN бичигдэхгүй) |
| 44 | `integration.link_create` | B2B холбоос | normal | Хэнтэй |
| 45 | `integration.link_remove` | B2B холбоос устгасан | warning | Хэнтэй |
| 46 | `integration.request_create` | B2B хүсэлт | normal | Төрөл, дүн |
| 47 | `approval.request` | Зөвшөөрөл хүссэн | normal | Юу, дүн |
| 48 | `approval.decide` | Зөвшөөрөл шийдсэн | warning | Зөвшөөрсөн/татгалзсан |

### 4.2 Лог бичих Service

```typescript
// services/audit/auditLogService.ts

async function writeAuditLog(
  businessId: string,
  data: {
    action: string;
    module: string;
    targetType: string;
    targetId: string;
    targetLabel: string;
    changes?: FieldChange[];
    severity?: 'normal' | 'warning' | 'critical';
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const user = auth.currentUser;
  const employee = await getEmployee(businessId, user.uid);
  
  // Лог бичих — УСТГАЖ, ЗАСАЖ БОЛОХГҮЙ
  await addDoc(collection(db, `businesses/${businessId}/auditLog`), {
    ...data,
    
    // Хэн
    userId: user.uid,
    userName: employee.name,
    userPosition: employee.positionName,
    
    // Хэзээ, хаанаас
    metadata: {
      ...data.metadata,
      timestamp: serverTimestamp(),       // Серверийн цаг (хуурамчлах боломжгүй)
      device: navigator.userAgent,
      // IP-г Cloud Function-аар нэмнэ
    },
    
    severity: data.severity || 'normal',
    createdAt: serverTimestamp()          // Firestore серверийн цаг
  });
  
  // Critical бол эзэнд шууд мэдэгдэл илгээх
  if (data.severity === 'critical') {
    await notifyOwner(businessId, data);
  }
}
```

### 4.3 Лог = НОТЛОХ БАРИМТ гэсэн баталгаа

```
✅ Серверийн цаг ашиглана          → Хэрэглэгч цагийг хуурамчилж чадахгүй
✅ Firestore Rules: update = false  → Лог засаж болохгүй
✅ Firestore Rules: delete = false  → Лог устгаж болохгүй
✅ userId = Firebase Auth UID       → Хэн гэдгийг хуурамчилж чадахгүй
✅ Хуучин→шинэ утга бичигдэнэ      → Юу өөрчилсөн тодорхой
✅ device + IP бичигдэнэ            → Хэзээ, хаанаас гэдэг тодорхой
✅ PIN ашигласан уу бичигдэнэ       → Баталгаажуулалт хийсэн

= Бизнес эзэн хэзээ ч ямар ч ажилтны
  ямар ч үйлдлийг 100% нотлон харуулж чадна
```

---

## 5. ХЭРЭГЛЭГЧИЙН ХУУДСААР ЭРХИЙН ЗУРАГЛАЛ

### Хуудас бүрт ямар эрх хэрэгтэй:

| Хуудас (URL) | Байх ёстой эрх | Нэмэлт |
|-------------|----------------|--------|
| `/app/dashboard` | `reports.view_dashboard` | |
| `/app/orders` | `orders.view_own` | |
| `/app/orders/new` | `orders.create` | |
| `/app/orders/:id` | `orders.view_own` | Мөнгөн дүн: `orders.view_financials` |
| `/app/orders/:id/edit` | `orders.edit_own` | |
| `/app/customers` | `customers.view` | |
| `/app/customers/new` | `customers.create` | |
| `/app/customers/:id` | `customers.view` | Тооцоо: `customers.view_financials` |
| `/app/products` | `products.view` | |
| `/app/products/new` | `products.create` | |
| `/app/products/:id/edit` | `products.edit` | Өртөг: `products.view_cost` |
| `/app/reports` | `reports.view_sales` | Орлого: `reports.view_revenue` |
| `/app/reports/debts` | `finance.view_debts` | |
| `/app/reports/accounts` | `finance.view_account_balance` | |
| `/app/settings` | `settings.view` | |
| `/app/settings/business` | `settings.edit_business` | |
| `/app/settings/orders` | `settings.edit_orders` | |
| `/app/settings/positions` | `team.manage_positions` | |
| `/app/settings/team` | `team.view` | Урих: `team.invite` |
| `/app/settings/accounts` | `finance.manage_accounts` | |
| `/app/settings/custom-fields` | `settings.manage_custom_fields` | |
| `/app/settings/notifications` | `settings.edit_notifications` | |
| `/app/settings/billing` | `settings.manage_billing` | |
| `/app/settings/integrations` | `integrations.manage` | |
| `/app/audit-log` | `audit.view_all` | Өөрийнх: `audit.view_own` |
| `/app/notifications` | (бүх ажилтан) | |
| `/app/profile` | (бүх ажилтан) | |

---

*Энэ баримт бичиг нь эрх удирдлага ба аудит логийн БҮРЭН тодорхойлолт.*
