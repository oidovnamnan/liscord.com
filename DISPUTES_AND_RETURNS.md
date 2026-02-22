# 🔙 LISCORD — БУЦААЛТ, ГОМДОЛ & МАРГААН ШИЙДВЭРЛЭХ МОДУЛЬ

> **Контекст:** Liscord = бизнесийн хэрэгсэл. Маргааныг бизнес **ӨӨРӨӨ** шийднэ.
> Liscord нь бизнест маргааныг зохион байгуулах хэрэгсэл, систем **өгнө**,
> гэхдээ маргаанд **оролцохгүй**.

---

## 1. ЕРӨНХИЙ ТОГТОЛЦОО

```
Эцсийн хэрэглэгчийн гомдол:
│
├── 📋 1. Гомдол бүртгэх
│   └── Ажилтан/эзэн бүртгэнэ (утас, биечлэн, мессеж)
│
├── 🔍 2. Шалгах / Шинжлэх
│   └── Шалтгааныг тогтоох
│
├── 🛠️ 3. Шийдвэрлэх
│   ├── 🔄 Солих (бараа солих)
│   ├── 🔧 Засах (баталгаат засвар)
│   ├── 💰 Буцаалт (бүрэн / хэсэгчлэн)
│   ├── 🎁 Нөхөн олговор (хөнгөлөлт, нэмэлт)
│   └── ❌ Татгалзах (шалтгаантай)
│
├── ✅ 4. Хаах
│   └── Үр дүнг бүртгэх
│
└── 📊 5. Тайлагнах
    └── Гомдлын статистик, чанарын хяналт
```

---

## 2. 📋 ГОМДОЛ / САНАЛ ХҮСЭЛТ (Tickets)

### 2.1 Гомдлын төрлүүд

| # | Төрөл ID | Нэр | Icon | Тайлбар |
|---|----------|-----|------|---------|
| 1 | `defective_product` | Гэмтэлтэй бараа | 🔨 | Бараа эвдэрсэн, ажиллахгүй |
| 2 | `wrong_product` | Буруу бараа | 📦 | Захиалснаас өөр бараа ирсэн |
| 3 | `missing_product` | Дутуу бараа | ❓ | Захиалгын зарим бараа ирээгүй |
| 4 | `quality_issue` | Чанарын асуудал | ⚠️ | Барааны чанар хангалтгүй |
| 5 | `late_delivery` | Хоцорсон хүргэлт | ⏰ | Хугацаандаа хүргэгдээгүй |
| 6 | `wrong_price` | Буруу үнэ | 💰 | Тохиролцсоноос өөр үнэ |
| 7 | `damaged_delivery` | Хүргэлтэнд гэмтсэн | 📭 | Хүргэлтийн явцад эвдэрсэн |
| 8 | `service_complaint` | Үйлчилгээний гомдол | 😤 | Ажилтны харилцаа, хандлага |
| 9 | `warranty_claim` | Баталгаат засвар | 🔧 | Баталгааны хугацаанд эвдэрсэн |
| 10 | `refund_request` | Буцаалтын хүсэлт | 💸 | Мөнгө буцаах хүсэлт |
| 11 | `exchange_request` | Солилцох хүсэлт | 🔄 | Бараа солих хүсэлт |
| 12 | `suggestion` | Санал | 💡 | Сайжруулах санал |
| 13 | `other` | Бусад | 📝 | Бусад |

### 2.2 Гомдлын статус (Workflow)

```
┌────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐
│  Шинэ  │ →  │ Хянаж буй│ →  │ Шийдвэр- │ →  │ Хаагдсан│
│  (new)  │    │(reviewing)│    │лэж буй   │    │(closed) │
└────────┘    └───────────┘    │(resolving)│    └─────────┘
                               └──────────┘
                                    │
                                    ├── Шийдвэрлэсэн (resolved) → Хаагдсан
                                    ├── Харилцагч татгалзсан → Дахин хянах
                                    └── Удирдлагад шилжүүлсэн (escalated)

Нэмэлт:
  ⏸️ Хүлээгдэж буй (waiting) — Харилцагч/нийлүүлэгчийн хариу хүлээж буй
  ♻️ Дахин нээгдсэн (reopened) — Хаагдсаныг дахин нээсэн
```

### 2.3 Гомлдын мэдээллийн бүтэц

```javascript
// Firestore: businesses/{bizId}/tickets/{ticketId}
{
  id: "tkt_abc123",
  ticketNumber: "TKT-0015",             // Автомат дугаар
  
  // Төрөл, ач холбогдол
  type: "defective_product",             // Дээрх жагсаалтаас
  typeLabel: "Гэмтэлтэй бараа",
  priority: "high",                      // "low" | "medium" | "high" | "urgent"
  
  // Холбогдох захиалга
  order: {
    id: "ord_xyz",
    orderNumber: "ORD-0042",
  },
  
  // Харилцагч
  customer: {
    id: "cust_123",
    name: "Болд",
    phone: "+97688001234",
  },
  
  // Тайлбар
  description: "iPhone 15 Pro дэлгэцийн зураас гарч ирсэн. Авснаас хойш 3 хоног.",
  
  // Холбогдох бараа
  relatedItems: [
    {
      productId: "prod_123",
      productName: "iPhone 15 Pro",
      quantity: 1,
      unitPrice: 4500000,
    }
  ],
  
  // Нотлох баримт
  evidence: {
    photos: [
      { url: "https://storage.../photo1.jpg", caption: "Дэлгэцийн зураас" },
      { url: "https://storage.../photo2.jpg", caption: "Ойроос" },
    ],
    videos: [],
    notes: "Харилцагч биечлэн ирж үзүүлсэн."
  },
  
  // Статус
  status: "reviewing",
  statusHistory: [
    { status: "new", at: Timestamp, by: "user_sara", note: "Бүртгэсэн" },
    { status: "reviewing", at: Timestamp, by: "user_dorj", note: "Шалгаж байна" },
  ],
  
  // Шийдвэр (шийдвэрлэсний дараа)
  resolution: {
    type: null,                          // "refund" | "exchange" | "repair" | "compensation" | "rejected"
    description: null,
    resolvedAt: null,
    resolvedBy: null,
  },
  
  // Хуваарилалт
  assignedTo: "user_dorj",
  assignedToName: "Дорж",
  
  // Хугацаа
  deadline: Timestamp,                   // Шийдвэрлэх хугацаа
  isOverdue: false,
  
  // Мета
  createdBy: "user_sara",
  createdByName: "Сараа",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  closedAt: null,
  
  // Харилцагчийн сэтгэл ханамж (хаагдсаны дараа)
  satisfaction: {
    rating: null,                        // 1-5
    comment: null,
  },
}
```

---

## 3. 🔄 БАРАА СОЛИЛЦОО (Exchange)

### 3.1 Солилцооны flow

```
Харилцагч: "Энэ iPhone-ий дэлгэц согогтой, солиод өгнө үү"
│
├── 1. Гомдол бүртгэх (ticket)
│   └── Төрөл: defective_product
│   └── Нотлох: Гэрэл зураг, биет шалгалт
│
├── 2. Шалгах
│   └── Бараа үнэхээр согогтой юу?
│   └── Баталгааны хугацаанд юу? (хэрэв бий бол)
│
├── 3. Шийдвэр: Солих
│   ├── Солих бараа нөөцөд байна уу?
│   │   ├── ✅ Байна → Шууд солих
│   │   └── ❌ Байхгүй → Дуусах хүлээх / Өөр бараа / Буцаалт
│   │
│   ├── Үнийн зөрүү?
│   │   ├── Ижил үнэтэй → Зөрүүгүй
│   │   ├── Шинэ нь илүү үнэтэй → Зөрүү төлөх
│   │   └── Шинэ нь хямд → Зөрүү буцаах
│   │
│   └── Хуучин бараа буцаагдсан уу?
│       ├── ✅ Буцааж авсан → Нөөцөд нэмэх / Гэмтэлтэй тэмдэглэх
│       └── ❌ Буцаагаагүй → Шалтгаан бичих
│
└── 4. Бүртгэл
    ├── Хуучин бараа: -1 (буцсан / гэмтэлтэй)
    ├── Шинэ бараа: -1 (нөөцөөс)
    ├── Гүйлгээ: Зөрүү (хэрэв бий бол)
    └── Аудит лог: Солилцооны бүрэн бүртгэл
```

### 3.2 Солилцооны мэдээлэл

```javascript
// Firestore: businesses/{bizId}/exchanges/{exchangeId}
{
  id: "exc_abc",
  ticketId: "tkt_abc123",               // Гомдолтой холбоос
  orderId: "ord_xyz",
  orderNumber: "ORD-0042",
  customerId: "cust_123",
  customerName: "Болд",
  
  // Буцаагдаж буй бараа
  returnedItem: {
    productId: "prod_123",
    productName: "iPhone 15 Pro (Гэмтэлтэй)",
    quantity: 1,
    unitPrice: 4500000,
    condition: "defective",              // "good" | "defective" | "damaged"
    returnedToStock: false,              // Нөөцөд буцсан уу
    returnReason: "Дэлгэцийн зураас",
  },
  
  // Шинээр олгож буй бараа
  replacementItem: {
    productId: "prod_123",
    productName: "iPhone 15 Pro (Шинэ)",
    quantity: 1,
    unitPrice: 4500000,
    fromStock: true,
  },
  
  // Үнийн зөрүү
  priceDifference: 0,                   // Шинэ - Хуучин
  additionalPayment: null,              // Нэмж төлсөн бол
  refundAmount: null,                   // Буцаасан бол
  
  // Мета
  reason: "Дэлгэцийн зураас — үйлдвэрийн согог",
  notes: "",
  photos: [],
  
  createdBy: "user_dorj",
  createdAt: Timestamp,
}
```

---

## 4. 🔧 БАТАЛГААТ ЗАСВАР (Warranty)

### 4.1 Баталгааны тохиргоо (Бизнес тохируулна)

```javascript
// businesses/{bizId}/settings → warranty
{
  warranty: {
    enabled: true,                       // Feature toggle
    
    // Default баталгааны хугацаа
    defaultPeriod: 30,                   // 30 хоног
    defaultPeriodUnit: "days",           // "days" | "months" | "years"
    
    // Бараа бүрт тусдаа тохируулж болно
    // products/{prodId}.warranty = { period: 365, unit: "days" }
    
    // Баталгааны нөхцөл
    coverageTypes: [
      { id: "manufacturer", name: "Үйлдвэрийн согог", covered: true },
      { id: "workmanship", name: "Гар ажиллагааны алдаа", covered: true },
      { id: "material", name: "Материалын алдаа", covered: true },
      { id: "accidental", name: "Осол", covered: false },
      { id: "misuse", name: "Буруу ашиглалт", covered: false },
      { id: "water", name: "Усанд норсон", covered: false },
      { id: "modification", name: "Өөрчлөлт хийсэн", covered: false },
    ],
  }
}
```

### 4.2 Баталгаат засварын бүртгэл

```javascript
// Firestore: businesses/{bizId}/warrantyClaims/{claimId}
{
  id: "wc_abc",
  claimNumber: "WC-0008",
  ticketId: "tkt_abc123",
  orderId: "ord_xyz",
  customerId: "cust_123",
  customerName: "Болд",
  
  // Бараа
  product: {
    id: "prod_123",
    name: "iPhone 15 Pro",
    serialNumber: "SN12345678",
    purchaseDate: Timestamp,             // Авсан огноо
    warrantyExpiry: Timestamp,           // Баталгааны хугацаа дуусах
  },
  
  // Баталгааны шалгалт
  warrantyCheck: {
    isWithinWarranty: true,              // Хугацаанд байна уу
    daysRemaining: 45,                   // Хэдэн хоног үлдсэн
    issueType: "manufacturer",           // Ямар төрлийн поблем
    isCovered: true,                     // Баталгаа хамарч байна уу
    checkNote: "Үйлдвэрийн дэлгэцийн согог. Баталгаанд хамрагдана.",
  },
  
  // Засварын мэдээлэл
  repair: {
    status: "in_progress",              // "pending" | "in_progress" | "completed" | "cannot_repair"
    startedAt: Timestamp,
    estimatedCompletion: Timestamp,
    completedAt: null,
    repairNote: "Дэлгэц сольж байна",
    cost: 0,                             // Харилцагчид төлбөргүй (баталгааны)
    internalCost: 150000,                // Дотоод зардал
    
    // Ашигласан сэлбэг
    partsUsed: [
      { name: "iPhone 15 Pro Display", cost: 120000, quantity: 1 }
    ],
  },
  
  // Хэрэв засварлах боломжгүй бол
  alternativeResolution: null,           // "exchange" | "refund" | null
  
  // Зургууд
  photoBefore: ["url1", "url2"],         // Засварын өмнө
  photoAfter: [],                        // Засварын дараа
  
  createdBy: "user_dorj",
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 4.3 Баталгаат засварын UI

```
┌──────────────────────────────────────────┐
│  🔧 Баталгаат засвар > #WC-0008         │
│                                          │
│  📱 iPhone 15 Pro                        │
│  SN: SN12345678                          │
│  Авсан: 2026.01.15                       │
│  Баталгаа: 2027.01.15 хүртэл ✅ (45 хоног)│
│                                          │
│  Харилцагч: Болд (+976 8800-1234)        │
│  Захиалга: #ORD-0042                     │
│                                          │
│  ── Асуудал ─────────────────────────── │
│  Төрөл: 🔨 Үйлдвэрийн согог             │
│  Тайлбар: Дэлгэцийн зураас              │
│  Баталгаа хамрах: ✅ Тийм                │
│  Төлбөр: ₮0 (Баталгааны)                │
│                                          │
│  📸 Засварын өмнөх зураг:                │
│  [🖼️] [🖼️]                              │
│                                          │
│  ── Засвар ──────────────────────────── │
│  Статус: 🔧 Засварлаж байна              │
│  Эхэлсэн: 02.20                         │
│  Дуусах (таамаг): 02.23                  │
│                                          │
│  Ашигласан сэлбэг:                      │
│  • iPhone 15 Pro Display — ₮120,000     │
│                                          │
│  Тэмдэглэл: Дэлгэц сольж байна         │
│                                          │
│  [📸 Дараах зураг нэмэх]                │
│  [✅ Засвар дуусгах]                     │
│  [❌ Засварлах боломжгүй → Солих/Буцаах]│
└──────────────────────────────────────────┘
```

---

## 5. 💰 БУЦААЛТЫН НАРИЙВЧИЛСАН FLOW

### 5.1 Буцаалтын нөхцөл (Бизнес тохируулна)

```javascript
// businesses/{bizId}/settings → refundPolicy
{
  refundPolicy: {
    enabled: true,
    
    // Буцаалтын цонх
    refundWindow: 14,                    // Авснаас хойш 14 хоного дотор
    refundWindowUnit: "days",
    
    // Буцаах нөхцөл
    requireReceipt: true,                // Баримт заавал
    requireOriginalPackaging: false,     // Анхны сав баглаа
    requireUnused: false,                // Ашиглаагүй байх
    requirePhotos: true,                 // Зураг заавал
    
    // Буцаалтын төрөл
    allowFullRefund: true,               // Бүрэн буцаалт
    allowPartialRefund: true,            // Хэсэгчлэн
    allowStoreCredit: true,              // Дэлгүүрийн кредит (баланс)
    
    // Хязгаарлалт
    maxRefundWithoutApproval: 500000,    // ₮500K хүртэл зөвшөөрөлгүй
    requireApprovalAbove: 500000,        // Дээш → эзний зөвшөөрөл
    requirePin: true,                    // PIN шаардах
    
    // Буцаалтын шимтгэл (restocking fee)
    restockingFee: {
      enabled: false,
      percent: 10,                       // 10% шимтгэл
      waiveForDefective: true,           // Согогтой бол шимтгэлгүй
    },
  }
}
```

### 5.2 Буцаалтын төрлүүд

```
1. БҮРЭН БУЦААЛТ — Захиалгын бүх дүнг буцаана
   └── Шалтгаан: Бүх бараа согогтой / Буруу захиалга

2. ХЭСЭГЧЛЭН БУЦААЛТ — Захиалгын зарим дүнг буцаана
   └── Шалтгаан: Зарим бараа согогтой / Зарим нь дутуу / Үнийн зөрүү

3. БАРААНЫ БУЦААЛТ — Тодорхой бараа(нууд)ыг буцаана
   └── Шалтгаан: Тухайн бараа согогтой / Буруу бараа
   └── Тоо: 5-оос 2-ыг буцааж буй

4. БАЛАНСАД НЭМЭХ — Мөнгө буцаахын оронд дэлгүүрийн кредит +
   └── Шалтгаан: Харилцагч дараагийн удаад ашиглахыг сонгосон
   └── Давуу тал: Бизнест мөнгө гарахгүй

5. НӨХӨН ОЛГОВОР — Бараа буцаахгүй, нэмэлт зүйл санал болгох
   └── Хөнгөлөлтийн купон
   └── Нэмэлт бараа үнэгүй
   └── Дараагийн захиалгад X% хөнгөлөлт
```

### 5.3 Буцаалтын бүрэн бүртгэл

```javascript
// Firestore: businesses/{bizId}/refunds/{refundId}
{
  id: "ref_abc",
  refundNumber: "REF-0005",
  ticketId: "tkt_abc123",                // Гомдолтой холбоос (хэрэв бий бол)
  orderId: "ord_xyz",
  orderNumber: "ORD-0042",
  customerId: "cust_123",
  customerName: "Болд",
  
  // Буцаалтын төрөл
  type: "item_return",                   // "full" | "partial" | "item_return" | "store_credit" | "compensation"
  
  // Шалтгаан
  reason: {
    category: "defective_product",
    description: "Дэлгэцийн зураас — үйлдвэрийн согог",
    isWithinPolicy: true,                // Буцаалтын бодлогод нийцэж буй
  },
  
  // Буцааж буй бараа
  items: [
    {
      productId: "prod_123",
      productName: "iPhone 15 Pro",
      quantity: 1,
      unitPrice: 4500000,
      refundAmount: 4500000,
      condition: "defective",
      returnedToStock: false,            // Согогтой → нөөцөд нэмэхгүй
    }
  ],
  
  // Мөнгөн тооцоо
  financials: {
    itemsTotal: 4500000,                 // Буцааж буй барааны дүн
    restockingFee: 0,                    // Шимтгэл (согогтой → 0)
    refundAmount: 4500000,               // Бодит буцаалт дүн
    
    // Хаашаа буцаах
    refundMethod: "original_payment",    // "original_payment" | "different_account" | "store_credit" | "cash"
    refundAccount: {
      id: "pa_khan",
      name: "Хаан банк",
      type: "bank_khan",
    },
    
    // Хэрэв store credit бол
    storeCreditAmount: null,
  },
  
  // Нотлох баримт
  evidence: {
    photos: ["url1", "url2"],
    receiptPhoto: "url3",                // Анхны баримтын зураг
    returnFormPhoto: null,               // Буцаалтын хуудас
  },
  
  // Хянагч / зөвшөөрөл
  approval: {
    required: false,                     // ₮500K-аас доош → зөвшөөрөлгүй
    approvedBy: null,
    approvedAt: null,
  },
  
  // Статус
  status: "completed",                   // "pending_approval" | "approved" | "processing" | "completed" | "rejected"
  
  // Гүйлгээтэй холбоос
  transactionId: "txn_refund_abc",       // transactions collection дахь бүртгэл
  
  // PIN
  pinUsed: true,
  
  createdBy: "user_dorj",
  createdByName: "Дорж",
  createdAt: Timestamp,
  completedAt: Timestamp,
}
```

---

## 6. 📊 ГОМДЛЫН DASHBOARD & ТАЙЛАН

### 6.1 Гомдлын тойм

```
┌──────────────────────────────────────────┐
│  📊 Гомдол & Буцаалт > Тойм             │
│  Хугацаа: [Энэ сар ▾]                   │
│                                          │
│  ┌────────┐┌────────┐┌────────┐┌────────┐│
│  │ 📋 12  ││ ⏳ 3   ││ ✅ 8   ││ ❌ 1   ││
│  │Нийт    ││Нээлттэй││Шийдсэн ││Татгалз.││
│  └────────┘└────────┘└────────┘└────────┘│
│                                          │
│  ┌────────┐┌────────┐┌────────┐┌────────┐│
│  │ 💰     ││ 🔧     ││ 🔄     ││ ⭐     ││
│  │₮4.5M   ││ 2      ││ 3      ││ 4.2    ││
│  │Буцаалт ││Засвар  ││Солилцоо││Сэтгэл  ││
│  │нийт дүн││хийсэн  ││хийсэн  ││ханамж  ││
│  └────────┘└────────┘└────────┘└────────┘│
│                                          │
│  ── Гомдлын төрлөөр ────────────────── │
│  🔨 Гэмтэлтэй бараа:  5  ████████      │
│  📦 Буруу бараа:       3  █████         │
│  ⏰ Хоцорсон хүргэлт:  2  ███           │
│  😤 Үйлчилгээ:         1  ██            │
│  💸 Буцаалт хүсэлт:    1  ██            │
│                                          │
│  ── Бараагаар ──────────────────────── │
│  iPhone 15 Pro:    3 гомдол  ← ⚠️       │
│  Galaxy S24:       2 гомдол              │
│  AirPods Pro:      1 гомдол              │
│                                          │
│  ── Дундаж шийдвэрлэх хугацаа ──────── │
│  Энэ сар: 2.5 хоног                     │
│  Өмнөх сар: 3.1 хоног                   │
│  ↓ 19% сайжирсан ✅                     │
│                                          │
│  ── Сэтгэл ханамж ─────────────────── │
│  ⭐⭐⭐⭐☆ 4.2 / 5                     │
│  ████████████████████░░░░  84%           │
│                                          │
└──────────────────────────────────────────┘
```

### 6.2 Чанарын хяналтын дохио

| # | Дохио | Нөхцөл | Мэдэгдэл |
|---|-------|--------|----------|
| 1 | ⚠️ Бараанд олон гомдол | 1 бараанд 3+ гомдол / сар | "iPhone 15 Pro-д 3 гомдол — нийлүүлэгч шалгах" |
| 2 | ⚠️ Буцаалтын хэмжээ | Борлуулалтын 10%+ буцаалт | "Буцаалт 12% — анхаарна уу" |
| 3 | ⚠️ Шийдвэрлэх хугацаа | Дундаж 5+ хоног | "Гомдол удаан шийдвэрлэгдэж байна" |
| 4 | 🔴 Хугацаа хэтэрсэн | Ticket 7+ хоног нээлттэй | "TKT-0015 7 хоногоос дээш!" |
| 5 | ⚠️ Сэтгэл ханамж бага | Дундаж 3.0-аас доош | "Сэтгэл ханамж буурч байна" |
| 6 | ⚠️ Ажилтанд олон гомдол | 1 ажилтанд 3+ гомдол / сар | "Дорж-д 3 гомдол — ярилцах" |

---

## 7. ⚙️ FEATURE TOGGLES (Нэмэлт)

```javascript
// businesses/{bizId}/features → Нэмэгдэх toggle-ууд
{
  features: {
    // Гомдол
    ticketSystem:           true,        // Гомдлын систем on/off
    customerSatisfaction:   true,        // Сэтгэл ханамж үнэлгээ
    
    // Буцаалт
    refundEnabled:          true,
    storeCredit:            true,        // Дэлгүүрийн кредит
    restockingFee:          false,       // Шимтгэл
    
    // Баталгаа
    warrantyTracking:       false,       // Баталгаат засвар
    
    // Солилцоо
    exchangeEnabled:        true,
  }
}
```

## 8. 🔑 ШИНЭ ЭРХҮҮД

| ID | Нэр | Тайлбар |
|----|-----|---------|
| `tickets.view` | Гомдол харах | Жагсаалт |
| `tickets.create` | Гомдол бүртгэх | Шинэ гомдол |
| `tickets.manage` | Гомдол удирдах | Статус, хуваарилалт |
| `tickets.close` | Гомдол хаах | Шийдвэрлэсэн |
| `refunds.create` | Буцаалт хийх | PIN |
| `refunds.approve` | Буцаалт зөвшөөрөх | Тодорхой дүнгээс дээш |
| `refunds.view_report` | Буцаалтын тайлан | Тайлан хуудас |
| `exchanges.create` | Солилцоо хийх | Бараа солих |
| `warranty.manage` | Баталгаат засвар | Бүртгэх, удирдах |

---

*Энэ модуль бизнесийн чанарыг тасралтгүй сайжруулах суурь.*
