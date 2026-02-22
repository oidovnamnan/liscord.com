# 🗄️ LISCORD — ДАТАБААЗЫН БҮРЭН ЗОХИОН БАЙГУУЛАЛТ (Firestore)

> **Зарчим:** 100,000+ бизнес, сая сая захиалга, олон мянган зэрэгцээ хэрэглэгч
> ажиллахад бүрэн бэлэн, хурдан, хямд, найдвартай.

---

## 1. MULTI-TENANT ТУСГААРЛАЛТ

```
Firestore Root
│
├── 📁 users/{userId}                    ← Глобал хэрэглэгч (бүх бизнесээс тусдаа)
│
├── 📁 businesses/{businessId}           ← Бизнес бүр = тусдаа "Ертөнц"
│   │
│   ├── 📁 orders/{orderId}              ← Тухайн бизнесийн захиалга
│   ├── 📁 customers/{customerId}
│   ├── 📁 products/{productId}
│   ├── 📁 categories/{categoryId}
│   ├── 📁 transactions/{txnId}          ← Төлбөрийн гүйлгээ
│   ├── 📁 paymentAccounts/{accountId}
│   ├── 📁 positions/{positionId}
│   ├── 📁 employees/{employeeId}
│   ├── 📁 invitations/{inviteId}
│   ├── 📁 notifications/{notifId}
│   ├── 📁 auditLog/{logId}             ← Тамперын хамгаалалттай
│   ├── 📁 customFields/{fieldId}
│   ├── 📁 approvalRequests/{reqId}
│   └── 📁 counters/{counterId}          ← Тоолуур (атомар)
│
├── 📁 businessLinks/{linkId}            ← B2B холбоос (2 бизнес хооронд)
├── 📁 serviceRequests/{requestId}       ← B2B хүсэлт
├── 📁 businessInvoices/{invoiceId}      ← B2B нэхэмжлэл
│
└── 📁 platform/{docId}                  ← Платформын тохиргоо
    ├── config                           ← Ерөнхий тохиргоо
    ├── countries                        ← Улсуудын мэдээлэл
    └── stats                            ← Платформын статистик
```

### Яагаад ийм бүтэц?
```
✅ Бизнес бүр бие биеийнхээ өгөгдлийг ХАРЖ ЧАДАХГҮЙ
   → businesses/biz_A/orders/ ≠ businesses/biz_B/orders/
   
✅ Firestore Security Rules бизнес ID-аар тусгаарлана
   → match /businesses/{bizId}/orders/{orderId} { ... }
   
✅ Query бизнес дотроо л ажиллана → ХУРДАН
   → collection("businesses/biz_A/orders").where(...)
   
✅ Бизнес устгахад collection бүхэлдээ устгана → ЦЭВЭРХЭН
```

---

## 2. COLLECTION БҮРИЙН БҮРЭН SCHEMA

### 2.1 users/{userId}

```javascript
{
  // Document ID = Firebase Auth UID
  uid: "firebase_auth_uid",
  
  // Хувийн мэдээлэл
  name: "Бат-Эрдэнэ",                  // string, indexed
  phone: "+97699001234",                 // string, unique, indexed
  email: "bat@email.com",               // string, indexed
  avatar: "https://storage.../a.jpg",
  
  // Бизнесүүд (олон бизнест хамаарч болно)
  businessIds: ["biz_abc", "biz_xyz"],   // array — бизнесүүдийн ID
  activeBusiness: "biz_abc",             // string — одоо идэвхтэй
  
  // Тохиргоо
  language: "mn",                        // string — хэл
  theme: "dark",                         // "dark" | "light"
  
  createdAt: Timestamp,                  // Firestore Timestamp
  lastLoginAt: Timestamp,
  
  // 🔍 INDEX: phone (unique query)
  // 🔍 INDEX: email (query)
  // 🔍 INDEX: businessIds (array-contains query)
}
// Хэмжээ: ~0.5KB/doc
// Уншилт: Нэвтрэхэд 1 удаа → кэшлэнэ
```

### 2.2 businesses/{businessId}

```javascript
{
  id: "biz_abc123",                      // Auto-generated
  name: "Эрээн Карго",                   // string, indexed
  category: "cargo_import",              // string, indexed
  
  // Улс & хэл
  country: "MN",
  language: "mn",
  timezone: "Asia/Ulaanbaatar",
  currency: { code: "MNT", symbol: "₮", decimals: 0 },
  
  // Профайл
  profile: {
    logo: "url",
    phone: "+97677001234",
    email: "info@cargo.mn",
    address: { /* улсаас хамаарсан */ },
    description: "",
  },
  
  // Тохиргоо (нэг document-д)
  settings: {
    order: {
      prefix: "ORD",
      nextNumber: 1,                     // ⚠️ Атомар тоолуур ашиглана (доор)
      autoNumber: true,
      requirePin: true,
      pinHash: "hashed_pin",
    },
    notifications: { /* ... */ },
  },
  
  // Feature toggles
  features: { /* FEATURE_TOGGLES.md-д тодорхойлсон */ },
  
  // Татвар
  tax: { enabled: true, rate: 10, name: "НӨАТ", priceInclusive: true },
  
  // Ажилтны хязгаарлалт
  employeeLimits: { /* EMPLOYEE_CONTROL.md-д */ },
  
  // Багц
  subscription: { plan: "free", expiresAt: null, maxEmployees: 1 },
  
  // Эзэн
  ownerId: "user_xyz",
  
  // Статистик (denormalized — Cloud Function-ээр шинэчлэгдэнэ)
  stats: {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalEmployees: 0,
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true,
  
  // 🔍 INDEX: ownerId
  // 🔍 INDEX: category
  // 🔍 INDEX: country
  // 🔍 INDEX: isActive
}
// Хэмжээ: ~2-4KB/doc
// Уншилт: Нэвтрэхэд 1 удаа → кэшлэнэ
// Бичилт: Тохиргоо өөрчлөхөд л
```

### 2.3 orders/{orderId} — ⚡ ХАМГИЙН ЧУХАЛ

```javascript
{
  id: "ord_abc123",                      // Auto-generated
  orderNumber: "ORD-0042",              // string, indexed, бизнес дотор unique
  
  // Статус — ХАМГИЙН ИХ QUERY ХИЙГДДЭГ
  status: "confirmed",                   // string, indexed
  paymentStatus: "partial",              // string, indexed
  
  // Харилцагч (DENORMALIZED — customer doc-оос хуулсан)
  customer: {
    id: "cust_xyz",                      // Reference, indexed
    name: "Болд",                        // Хайлтанд ашиглагдана
    phone: "+97688001234",               // Хайлтанд ашиглагдана
  },
  
  // Бараанууд (Embedded array — тусдаа subcollection биш)
  items: [
    {
      productId: "prod_123",
      name: "iPhone 15 Pro",
      quantity: 2,
      unitPrice: 4500000,
      totalPrice: 9000000,
      // variant, weight гэх мэт → ангилалаас хамаарна
    }
  ],
  // ⚠️ items array хамгийн ихдээ 50 бараа (Firestore doc = max 1MB)
  // 50+ бол subcollection ашиглана
  
  // Мөнгөн тооцоо
  financials: {
    subtotal: 9000000,
    discountAmount: 450000,
    deliveryFee: 5000,
    taxAmount: 0,
    totalAmount: 8555000,
    paidAmount: 5000000,
    remainingAmount: 3555000,
    refundedAmount: 0,
  },
  
  // Хүргэлт
  delivery: {
    method: "delivery",
    address: "БЗД...",
    district: "БЗД",                    // indexed (хайлтанд)
  },
  
  // Ангилалын тусгай талбарууд
  categoryFields: { /* dynamic */ },
  
  // Custom fields
  customFields: { /* dynamic */ },
  
  // Хуваарилалт
  assignedTo: "emp_dorj",               // indexed
  assignedToName: "Дорж",
  
  // Шошго
  tags: ["urgent"],                      // array, array-contains query
  
  // Мета
  notes: "",
  createdBy: "user_1",                   // indexed
  createdByName: "Бат",
  createdAt: Timestamp,                  // indexed (эрэмбэлэхэд)
  updatedAt: Timestamp,
  isDeleted: false,                      // indexed (soft delete шүүлт)
  
  // COMPOSITE INDEXES:
  // 🔍 status + createdAt DESC           → Статусаар + огноогоор
  // 🔍 paymentStatus + createdAt DESC    → Төлбөрөөр + огноогоор
  // 🔍 status + paymentStatus + createdAt → Хос шүүлт
  // 🔍 customer.id + createdAt DESC      → Харилцагчийн захиалга
  // 🔍 assignedTo + status + createdAt   → Ажилтны захиалга
  // 🔍 isDeleted + status + createdAt    → Устгагдаагүй + статус
  // 🔍 createdBy + createdAt DESC        → Өөрийн захиалга
  // 🔍 tags (array-contains) + createdAt → Шошгоор
}
// Хэмжээ: ~2-5KB/doc (items тоогоос хамаарна)
// Уншилт: Жагсаалт 20 doc/page, Дэлгэрэнгүй 1 doc
// Бичилт: Үүсгэх 1, Статус солих 1, Засах 1
```

### 2.4 customers/{customerId}

```javascript
{
  id: "cust_xyz",
  name: "Болд",                          // indexed (хайлт)
  phone: "+97688001234",                 // indexed (хайлт, unique шалгалт)
  email: "",
  address: { /* улсаас хамаарна */ },
  
  categoryFields: {},                    // Ангилалд тусгай
  customFields: {},
  tags: ["vip"],                         // array-contains
  notes: "",
  
  // Denormalized статистик
  stats: {
    totalOrders: 25,
    totalSpent: 15000000,
    totalDebt: 500000,
    lastOrderAt: Timestamp,
  },
  
  createdBy: "user_1",
  createdAt: Timestamp,                  // indexed
  updatedAt: Timestamp,
  isDeleted: false,
  
  // 🔍 INDEX: name (хайлт)
  // 🔍 INDEX: phone (хайлт)
  // 🔍 INDEX: tags (array-contains)
  // 🔍 INDEX: isDeleted + createdAt
  // 🔍 INDEX: stats.totalOrders DESC     → Топ харилцагч
  // 🔍 INDEX: stats.totalDebt DESC       → Авлагатай
}
// Хэмжээ: ~1KB/doc
```

### 2.5 products/{productId}

```javascript
{
  id: "prod_123",
  name: "iPhone 15 Pro",                 // indexed
  categoryId: "cat_phones",              // indexed
  categoryName: "Гар утас",
  
  pricing: {
    retailPrice: 4500000,
    costPrice: 3800000,                  // Нууц (products.view_cost)
    wholesalePrice: 4200000,
    salePrice: null,
    isOnSale: false,
  },
  
  stock: {
    quantity: 15,                         // indexed (нөөц бага хайлт)
    lowStockThreshold: 3,
    trackStock: true,
  },
  
  images: [{ url: "...", isPrimary: true }],
  
  sku: "",
  barcode: "",
  unitType: "ширхэг",
  categoryFields: {},
  
  isActive: true,                        // indexed
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isDeleted: false,
  
  // 🔍 INDEX: categoryId + name
  // 🔍 INDEX: isActive + name
  // 🔍 INDEX: isDeleted + isActive + name
  // 🔍 INDEX: stock.quantity ASC (нөөц бага)
}
// Хэмжээ: ~1-2KB/doc
```

### 2.6 transactions/{txnId}

```javascript
{
  id: "txn_abc",
  type: "payment",                       // indexed
  orderId: "ord_xyz",                    // indexed
  orderNumber: "ORD-0042",
  customerId: "cust_123",               // indexed
  customerName: "Болд",
  
  amount: 5000000,
  accountId: "pa_khan",                  // indexed
  accountName: "Хаан банк",
  accountType: "bank_khan",
  paymentMethod: "bank_transfer",        // indexed
  
  verification: { status: "verified", receiptImage: "..." },
  exchange: null,
  refund: null,
  
  note: "",
  createdBy: "user_1",
  createdByName: "Бат",
  createdAt: Timestamp,                  // indexed
  isDeleted: false,
  
  // 🔍 INDEX: orderId + createdAt         → Захиалгын гүйлгээ
  // 🔍 INDEX: accountId + createdAt DESC  → Дансны хөдөлгөөн
  // 🔍 INDEX: type + createdAt DESC       → Төрлөөр
  // 🔍 INDEX: customerId + createdAt      → Харилцагчийн тооцоо
  // 🔍 INDEX: paymentMethod + createdAt   → Аргаар
  // ❌ ALLOW UPDATE: false                 → Засаж болохгүй!
  // ❌ ALLOW DELETE: false                 → Устгаж болохгүй!
}
// Хэмжээ: ~1KB/doc
```

### 2.7 auditLog/{logId}

```javascript
{
  id: "log_abc",
  action: "order.delete",               // indexed
  module: "orders",                      // indexed
  severity: "critical",                  // indexed
  
  userId: "user_dorj",                   // indexed
  userName: "Дорж",
  userPosition: "Менежер",
  
  targetType: "order",
  targetId: "ord_xyz",
  targetLabel: "#ORD-0042",
  
  changes: [{ field: "status", oldValue: "new", newValue: "confirmed" }],
  metadata: { device: "...", pinUsed: true },
  
  createdAt: Timestamp,                  // indexed, серверийн цаг
  
  // 🔍 INDEX: userId + createdAt DESC     → Ажилтны лог
  // 🔍 INDEX: module + createdAt DESC     → Модулаар
  // 🔍 INDEX: severity + createdAt DESC   → Чухлаар
  // 🔍 INDEX: action + createdAt DESC     → Үйлдлээр
  // ❌ ALLOW UPDATE: false
  // ❌ ALLOW DELETE: false
}
// Хэмжээ: ~0.5-1KB/doc
// ⚠️ RETENTION: 1 жилийн дараа архивлах (Cloud Function)
```

### 2.8 Бусад collections (товч)

```javascript
// positions/{positionId} — ~0.5KB — Ховор уншигдана, кэшлэнэ
// employees/{employeeId} — ~0.5KB — Ховор уншигдана, кэшлэнэ
// invitations/{inviteId} — ~0.3KB — Маш ховор
// notifications/{notifId} — ~0.3KB — Олон уншигдана, paginate
// paymentAccounts/{accountId} — ~0.3KB — Ховор, кэшлэнэ
// categories/{categoryId} — ~0.2KB — Маш ховор, кэшлэнэ
// customFields/{fieldId} — ~0.3KB — Маш ховор, кэшлэнэ
// counters/{counterId} — ~0.1KB — Атомар increment (доор)
```

---

## 3. ⚡ ГҮЙЦЭТГЭЛИЙН ОНОВЧЛОЛ

### 3.1 Denormalization стратеги

**Зарчим:** Firestore = NoSQL. JOIN байхгүй. Түгээмэл хэрэглэгддэг мэдээллийг хуулж хадгална.

| Эх collection | Хуулагдах газар | Хуулагдах талбарууд | Хэзээ шинэчлэгдэх |
|---------------|----------------|--------------------|--------------------|
| `customers` | `orders.customer` | name, phone | Харилцагч засахад → бүх захиалганд |
| `employees` | `orders.assignedToName` | name | Ажилтан нэр засахад |
| `employees` | `auditLog.userName` | name, position | Бичигдэх үед (дараа өөрчлөхгүй) |
| `positions` | `employees.positionName` | name | Тушаал нэр засахад |
| `orders (count)` | `customers.stats` | totalOrders, totalSpent | Захиалга үүсэхэд (Cloud Function) |
| `orders (count)` | `businesses.stats` | totalOrders, totalRevenue | Cloud Function |
| `products` | `orders.items[].name` | name, price | Бичигдэх үед (дараа өөрчлөхгүй) |

### 3.2 Атомар тоолуур (Counters)

Firestore-д `count()` query үнэтэй. Тоолуурыг **атомар increment** ашиглана.

```javascript
// businesses/{bizId}/counters/orderCounter
{
  value: 42,  // Одоогийн дугаар
  // FieldValue.increment(1) ашиглана — race condition байхгүй
}

// businesses/{bizId}/counters/stats
{
  totalOrders: 1542,
  totalRevenue: 45000000,
  totalCustomers: 320,
  todayOrders: 24,
  todayRevenue: 8500000,
  monthOrders: 450,
  monthRevenue: 125000000,
}

// Шинэ захиалга үүсэхэд:
const batch = writeBatch(db);
batch.set(orderRef, orderData);
batch.update(counterRef, {
  "totalOrders": increment(1),
  "totalRevenue": increment(orderTotal),
  "todayOrders": increment(1),
  "todayRevenue": increment(orderTotal),
  "monthOrders": increment(1),
  "monthRevenue": increment(orderTotal),
});
await batch.commit();
// = 1 атомар бичилт, бүх тоолуур зөв
```

### 3.3 Pagination (Хуудаслалт)

```javascript
// ❌ БУРУУ — бүх document унших
const allOrders = await getDocs(collection(db, `businesses/${bizId}/orders`));

// ✅ ЗӨВВ — Cursor-based pagination
const PAGE_SIZE = 20;

// Эхний хуудас
const firstPage = await getDocs(
  query(
    collection(db, `businesses/${bizId}/orders`),
    where("isDeleted", "==", false),
    where("status", "==", "new"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  )
);

// Дараагийн хуудас
const lastDoc = firstPage.docs[firstPage.docs.length - 1];
const nextPage = await getDocs(
  query(
    collection(db, `businesses/${bizId}/orders`),
    where("isDeleted", "==", false),
    where("status", "==", "new"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(PAGE_SIZE)
  )
);
```

### 3.4 Real-time Listener оновчлол

```javascript
// ❌ БУРУУ — бүх захиалга сонсох (шинэ бүр trigger хийнэ)
onSnapshot(collection(db, `businesses/${bizId}/orders`), ...);

// ✅ ЗӨВВ — Зөвхөн өнөөдрийн + идэвхтэй захиалга сонсох
const today = startOfDay(new Date());
onSnapshot(
  query(
    collection(db, `businesses/${bizId}/orders`),
    where("isDeleted", "==", false),
    where("createdAt", ">=", today),
    orderBy("createdAt", "desc"),
    limit(50)
  ),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") { /* Шинэ захиалга */ }
      if (change.type === "modified") { /* Статус өөрчлөгдсөн */ }
    });
  }
);
```

### 3.5 Кэшийн стратеги

```
Кэшлэх (ховор өөрчлөгддөг):          Кэшлэхгүй (байнга өөрчлөгддөг):
├── businesses/{bizId}     → Zustand    ├── orders (real-time listener)
├── positions[]            → Zustand    ├── notifications (listener)
├── employees[]            → Zustand    └── auditLog (query бүрт)
├── paymentAccounts[]      → Zustand
├── categories[]           → Zustand
├── customFields[]         → Zustand
└── Хэрэглэгчийн settings → Zustand

Firestore persistence: enableIndexedDbPersistence(db)
→ Офлайн горимд кэшлэгдсэн өгөгдөл ашиглана
```

---

## 4. 🔍 COMPOSITE INDEX-ИЙН БҮРЭН ЖАГСААЛТ

```
// firestore.indexes.json

{
  "indexes": [
    // === ORDERS ===
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "paymentStatus", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "customer.id", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "assignedTo", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "createdBy", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // === TRANSACTIONS ===
    {
      "collectionGroup": "transactions",
      "fields": [
        { "fieldPath": "orderId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "fields": [
        { "fieldPath": "accountId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // === AUDIT LOG ===
    {
      "collectionGroup": "auditLog",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLog",
      "fields": [
        { "fieldPath": "severity", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    
    // === CUSTOMERS ===
    {
      "collectionGroup": "customers",
      "fields": [
        { "fieldPath": "isDeleted", "order": "ASCENDING" },
        { "fieldPath": "stats.totalDebt", "order": "DESCENDING" }
      ]
    },
    
    // === NOTIFICATIONS ===
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "recipientIds", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 5. 📊 QUERY ЗАГВАР → INDEX ЗУРАГЛАЛ

| # | Query (юуг хайж байна) | Ашиглагдах index |
|---|----------------------|-----------------|
| 1 | Статусаар захиалга, огноогоор | `isDeleted + status + createdAt DESC` |
| 2 | Төлбөрийн статусаар | `isDeleted + paymentStatus + createdAt DESC` |
| 3 | Тухайн харилцагчийн захиалга | `isDeleted + customer.id + createdAt DESC` |
| 4 | Тухайн ажилтанд оногдсон | `isDeleted + assignedTo + createdAt DESC` |
| 5 | Миний үүсгэсэн захиалга | `isDeleted + createdBy + createdAt DESC` |
| 6 | Тухайн захиалгын гүйлгээ | `orderId + createdAt` |
| 7 | Тухайн дансны хөдөлгөөн | `accountId + createdAt DESC` |
| 8 | Тухайн ажилтны лог | `userId + createdAt DESC` |
| 9 | Нөөц бага бараа | `isDeleted=false + stock.quantity ASC` |
| 10 | Авлагатай харилцагч | `isDeleted=false + stats.totalDebt DESC` |
| 11 | Захиалга бараа нэрээр хайх | ❌ Firestore → Full-text search байхгүй → **Client-side filter** |

---

## 6. 💰 ЗАРДЛЫН ОНОВЧЛОЛ

### 6.1 Firestore зардлын тооцоо

| Үйлдэл | Үнэ (USD) | Бидний стратеги |
|---------|----------|----------------|
| Read | $0.06 / 100K | Кэш + listener (дахин уншихгүй) |
| Write | $0.18 / 100K | Batch write, тоолуур |
| Delete | $0.02 / 100K | Soft delete (бодит устгахгүй) |
| Storage | $0.18 / GB/сар | Document жижиг байлгах |

### 6.2 Жишээ тооцоо (1 бизнес, 1 сар)

```
Захиалга:
  Үүсгэх: 500 × 2 write (order + counter) = 1,000 writes
  Статус: 500 × 3 дундаж = 1,500 writes
  Жагсаалт: 500 × 10 удаа харах × 20 doc = 100,000 reads
  Дэлгэрэнгүй: 200 × 2 reads = 400 reads

Харилцагч: ~500 reads, ~50 writes
Бараа: ~1,000 reads, ~100 writes
Төлбөр: ~500 reads, ~500 writes
Лог: ~2,000 writes, ~500 reads

НИЙТ/сар: ~102,000 reads + ~5,150 writes
Зардал: ~$0.07 + ~$0.01 = ~$0.08/сар/бизнес

1,000 бизнес = ~$80/сар
10,000 бизнес = ~$800/сар
100,000 бизнес = ~$8,000/сар ← Firebase Blaze plan
```

---

## 7. 🛡️ ӨГӨГДЛИЙН БҮРЭН БҮТЭН БАЙДАЛ

### 7.1 Batch Write (Атомар олон бичилт)

```javascript
// Захиалга үүсгэхэд 1 атомар бичилт:
const batch = writeBatch(db);

// 1. Захиалга үүсгэх
batch.set(orderRef, orderData);

// 2. Дугаарын тоолуур нэмэх
batch.update(counterRef, { value: increment(1) });

// 3. Бизнесийн статистик шинэчлэх
batch.update(bizStatsRef, {
  totalOrders: increment(1),
  totalRevenue: increment(totalAmount)
});

// 4. Нөөц хасах (бараа бүрт)
orderData.items.forEach(item => {
  if (item.productId) {
    batch.update(productRef(item.productId), {
      "stock.quantity": increment(-item.quantity)
    });
  }
});

// 5. Харилцагч статистик
batch.update(customerRef, {
  "stats.totalOrders": increment(1),
  "stats.totalSpent": increment(totalAmount),
  "stats.lastOrderAt": serverTimestamp()
});

// 6. Аудит лог
batch.set(logRef, auditLogData);

// Бүгд эсвэл юу ч — амжилтгүй бол бүгд буцна
await batch.commit();
```

### 7.2 Soft Delete (Бодит устгахгүй)

```javascript
// ❌ ХЭЗЭЭ Ч ХИЙХГҮЙ
await deleteDoc(orderRef);

// ✅ ЗААВАЛ ИЙНХҮҮ
await updateDoc(orderRef, {
  isDeleted: true,
  deletedAt: serverTimestamp(),
  deletedBy: auth.currentUser.uid
});
// Бүх query-д where("isDeleted", "==", false) нэмнэ
// 30 хоногийн дараа Cloud Function-ээр бодит устгана (optional)
```

---

## 8. 📋 ХЯЗГААРЛАЛТУУД

| Хязгаар | Утга | Бидний стратеги |
|---------|------|----------------|
| Document хэмжээ | 1 MB | Items array ≤ 50, том бичвэр хасах |
| Subcollection гүн | 100 | Бид 2 (businesses/X/orders/Y) |
| Batch write | 500 operations | Bulk action ≤ 500 |
| Transaction | 25 writes | Нэг захиалга ≤ 10 write |
| Query `in` | 30 утга | Олон статус шүүхэд limit |
| `array-contains` | 1 per query | Нэг query-д 1 tag |
| Index | 200 composite | Бид ~15 composite |
| Real-time listeners | 1,000/client | Бид ~3-5 listener |

---

*Энэ бүтэц 100,000+ бизнес, сая сая захиалгатай ажиллахад бэлэн.*
