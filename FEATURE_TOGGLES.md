# ⚙️ LISCORD — БИЗНЕСИЙН ТОХИРГОО & FEATURE TOGGLE СИСТЕМ

> **Зарчим:** Бизнес эзэн өөрийн платформыг бүрэн удирдана.
> Шаардлагагүй функцуудыг OFF болговол UI-аас алга болно, хялбарчлагдана.
> Шаардлагатай функцуудыг ON болговол шинэ боломж нээгдэнэ.

---

## 1. 🎛️ FEATURE TOGGLE ТОЙМ

Бизнес эзэн **Тохиргоо → Ерөнхий** хэсэгт доорх бүх функцуудыг on/off удирдана.

```
┌──────────────────────────────────────────┐
│  ⚙️ Тохиргоо > Ерөнхий                  │
│                                          │
│  ── 💰 Санхүү ──────────────────────── │
│                                          │
│  📋 НӨАТ (Татвар)                        │
│  Захиалгын дүнд НӨАТ нэмэх             │
│  [████████░░] ON                         │
│  ├── НӨАТ хувь: [10] %                  │
│  ├── Үнэд шингэсэн:  (●) Тийм ( ) Үгүй│
│  └── НӨАТ бүртгэлийн №: [__________]    │
│                                          │
│  💵 Олон валют                            │
│  Гадаад валютаар тооцоо хийх             │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  📊 Ашгийн тооцоо                        │
│  Өртөг оруулж ашиг тооцоолох             │
│  [████████░░] ON                         │
│                                          │
│  💳 Хуваан төлөлт                        │
│  Нэг захиалга олон аргаар төлөх          │
│  [████████░░] ON                         │
│                                          │
│  📈 Авлага / Зээлийн удирдлага           │
│  Харилцагчид зээлээр бараа олгох         │
│  [████████░░] ON                         │
│  └── Зээлийн хязгаар: [████████░░] ON   │
│                                          │
│  ── 📦 Захиалга ────────────────────── │
│                                          │
│  🔢 Автомат дугаарлалт                   │
│  Захиалгын дугаар автомат үүсгэх         │
│  [████████░░] ON                         │
│  └── Угтвар: [ORD]                      │
│                                          │
│  🔒 PIN баталгаажуулалт                  │
│  Устгах, буцаалтанд PIN шаардах          │
│  [████████░░] ON                         │
│  └── PIN: [••••]  [Өөрчлөх]             │
│                                          │
│  📝 Дотоод тэмдэглэл                    │
│  Захиалганд дотоод тэмдэглэл нэмэх      │
│  [████████░░] ON                         │
│                                          │
│  📎 Файл хавсаргах                       │
│  Захиалганд зураг, файл хавсаргах        │
│  [████████░░] ON                         │
│                                          │
│  🏷️ Хөнгөлөлт                           │
│  Захиалганд хөнгөлөлт олгох боломж      │
│  [████████░░] ON                         │
│  ├── Max хөнгөлөлт (ажилтан): [10] %   │
│  └── Зөвшөөрөл шаардах: [15] %-аас дээш│
│                                          │
│  🚚 Хүргэлт удирдлага                   │
│  Хүргэлтийн мэдээлэл бүртгэх            │
│  [████████░░] ON                         │
│  ├── Хүргэлтийн төлбөр:  [████████░░] ON│
│  └── Хүргэлт хуваарилах: [████████░░] ON│
│                                          │
│  📋 Захиалга хуваарилалт                 │
│  Захиалгыг ажилтанд оноох               │
│  [████████░░] ON                         │
│                                          │
│  🔄 Bulk үйлдлүүд                       │
│  Олон захиалга зэрэг удирдах            │
│  [████████░░] ON                         │
│                                          │
│  ── 🛍️ Бараа ──────────────────────── │
│                                          │
│  📦 Нөөц хяналт (Inventory)             │
│  Барааны нөөцийн тоо хөтлөх             │
│  [████████░░] ON                         │
│  ├── Нөөц бага анхааруулга: [████████░░]│
│  └── Доод хязгаар: [3] ширхэг           │
│                                          │
│  📂 Барааны ангилал                      │
│  Барааг ангилалд хуваах                  │
│  [████████░░] ON                         │
│                                          │
│  🎨 Барааны хувилбар (Variant)           │
│  Өнгө, размер зэрэг хувилбар            │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  🏷️ Шатлал үнэ (Tier Pricing)           │
│  Тоо ширхэгээс хамаарсан үнэ            │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  📸 Барааны зураг                        │
│  Бараанд зураг хавсаргах                 │
│  [████████░░] ON                         │
│                                          │
│  🔖 Barcode / SKU                        │
│  Баркод, SKU бүртгэх                     │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  ── 👥 Харилцагч ──────────────────── │
│                                          │
│  🏷️ Харилцагчийн шошго                  │
│  VIP, wholesale гэх мэт шошго           │
│  [████████░░] ON                         │
│                                          │
│  📝 Харилцагчийн тэмдэглэл             │
│  Дотоод тэмдэглэл                       │
│  [████████░░] ON                         │
│                                          │
│  🏢 Компанийн мэдээлэл                  │
│  Компанийн нэр, РД бүртгэх              │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  ── 👥 Баг ────────────────────────── │
│                                          │
│  🕐 Ажлын цагийн хязгаарлалт            │
│  Тодорхой цагт л нэвтрэх                │
│  [░░░░░░░░░░] OFF                        │
│  ├── Эхлэх: [09:00]                     │
│  └── Дуусах: [20:00]                    │
│                                          │
│  📱 Төхөөрөмжийн хязгаарлалт            │
│  Нэг ажилтан max хэдэн төхөөрөмж        │
│  [░░░░░░░░░░] OFF                        │
│  └── Max: [2] төхөөрөмж                 │
│                                          │
│  ✅ Зөвшөөрлийн систем                   │
│  Хөнгөлөлт/буцаалтанд эзний зөвшөөрөл   │
│  [████████░░] ON                         │
│                                          │
│  👁️ Ажилтны идэвхжилийн лог             │
│  Бүх үйлдлийг бүртгэх                   │
│  [████████░░] ON  🔒 (үргэлж ON)        │
│                                          │
│  🟢 Онлайн статус                        │
│  Ажилтны онлайн/офлайн харах             │
│  [████████░░] ON                         │
│                                          │
│  📊 Ажилтны гүйцэтгэлийн тайлан        │
│  KPI, бүтээмж хянах                      │
│  [████████░░] ON                         │
│                                          │
│  ── 🔗 Интеграци ──────────────────── │
│                                          │
│  🔗 B2B Интеграци                        │
│  Бусад бизнестэй холбогдох              │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  🚚 Хүргэлтийн интеграци                │
│  Хүргэлтийн компанитай холбогдох         │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  📦 Карго интеграци                      │
│  Карго компанитай холбогдох              │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  ── 📊 Тайлан ─────────────────────── │
│                                          │
│  📈 Борлуулалтын тайлан                  │
│  [████████░░] ON                         │
│                                          │
│  💰 Орлогын тайлан                       │
│  [████████░░] ON                         │
│                                          │
│  📦 Нөөцийн тайлан                      │
│  [████████░░] ON                         │
│                                          │
│  📊 Дансны хөдөлгөөн тайлан             │
│  [████████░░] ON                         │
│                                          │
│  📉 Авлагын насжилт тайлан              │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  ── 🔔 Мэдэгдэл ──────────────────── │
│                                          │
│  📱 Push Notification                    │
│  [████████░░] ON                         │
│                                          │
│  📧 И-мэйл мэдэгдэл                    │
│  [░░░░░░░░░░] OFF                        │
│                                          │
│  📲 SMS мэдэгдэл                        │
│  [░░░░░░░░░░] OFF                        │
│                                          │
└──────────────────────────────────────────┘
```

---

## 2. 💰 ТАТВАРЫН (НӨАТ) МОДУЛЬ

### 2.1 Татварын тохиргоо

```javascript
// businesses/{bizId} → settings.tax
{
  tax: {
    enabled: true,                       // ON / OFF toggle
    
    // НӨАТ тохиргоо
    vat: {
      rate: 10,                          // НӨАТ хувь (Монгол: 10%)
      registrationNumber: "1234567",     // НӨАТ бүртгэлийн дугаар
      companyName: "Эрээн Карго ХХК",
      
      // Үнэд шингэсэн эсэх
      priceInclusive: true,
      // true  → ₮11,000 = ₮10,000 + ₮1,000 НӨАТ (үнэд шингэсэн)
      // false → ₮10,000 + ₮1,000 НӨАТ = ₮11,000 (НӨАТ нэмэгддэг)
    },
    
    // Нэмэлт татвар (шаардлагатай бол)
    additionalTaxes: [
      // { name: "Онцгой татвар", rate: 5, applicableTo: "alcohol" }
    ],
    
    // НӨАТ чөлөөлөгдсөн бараа
    exemptCategories: [],                // Тодорхой ангилалын бараа НӨАТ-гүй
    
    // Баримт
    showOnReceipt: true,                 // Баримтанд НӨАТ тусдаа харуулах
    showOnInvoice: true                  // Нэхэмжлэлд НӨАТ харуулах
  }
}
```

### 2.2 Татвартай захиалгын тооцоо

```
НӨАТ шингэсэн (priceInclusive: true):
┌────────────────────────────────────┐
│ iPhone 15 Pro x2     ₮9,000,000   │
│ Galaxy S24 x1        ₮3,200,000   │
│ ──────────────────────────────     │
│ Дүн:                 ₮12,200,000  │
│ Хөнгөлөлт (5%):     -₮610,000   │
│ Хүргэлт:            +₮5,000     │
│ ──────────────────────────────     │
│ НИЙТ:               ₮11,595,000  │
│ (Үүнээс НӨАТ:       ₮1,054,091) │ ← Мэдээлэл
│                                    │
│ НӨАТ = 11,595,000 / 1.10 × 0.10  │
└────────────────────────────────────┘

НӨАТ нэмэгддэг (priceInclusive: false):
┌────────────────────────────────────┐
│ iPhone 15 Pro x2     ₮9,000,000   │
│ Galaxy S24 x1        ₮3,200,000   │
│ ──────────────────────────────     │
│ Дүн:                 ₮12,200,000  │
│ Хөнгөлөлт (5%):     -₮610,000   │
│ Хүргэлт:            +₮5,000     │
│ Дүн (НӨАТ-гүй):     ₮11,595,000 │
│ НӨАТ (10%):         +₮1,159,500 │ ← Нэмэгдэнэ
│ ──────────────────────────────     │
│ НИЙТ:               ₮12,754,500  │
└────────────────────────────────────┘

НӨАТ OFF (enabled: false):
┌────────────────────────────────────┐
│ НИЙТ:               ₮11,595,000  │
│ (НӨАТ харагдахгүй)               │
└────────────────────────────────────┘
```

### 2.3 Татварын мэдээлэл захиалганд

```javascript
// orders/{orderId} → financials.tax
{
  financials: {
    subtotal: 12200000,
    discount: { type: "percent", value: 5, amount: 610000 },
    deliveryFee: 5000,
    
    // НӨАТ (toggle ON бол)
    tax: {
      enabled: true,
      rate: 10,
      priceInclusive: true,
      taxableAmount: 11595000,
      taxAmount: 1054091,                // НӨАТ дүн
    },
    
    totalAmount: 11595000,               // priceInclusive бол НӨАТ шингэсэн
    // totalAmount: 12754500,            // priceInclusive: false бол НӨАТ нэмэгдсэн
  }
}
```

---

## 3. 🗄️ FEATURE TOGGLE — МЭДЭЭЛЛИЙН БҮТЭЦ

```javascript
// businesses/{bizId} → features
{
  features: {
    // --- Санхүү ---
    tax:                    true,     // НӨАТ
    multiCurrency:          false,    // Олон валют
    profitTracking:         true,     // Ашгийн тооцоо
    splitPayment:           true,     // Хуваан төлөлт
    creditManagement:       true,     // Авлага/зээл
    creditLimit:            true,     // Зээлийн хязгаар
    
    // --- Захиалга ---
    autoNumbering:          true,     // Автомат дугаарлалт
    pinProtection:          true,     // PIN баталгаажуулалт
    internalNotes:          true,     // Дотоод тэмдэглэл
    attachments:            true,     // Файл хавсаргах
    discounts:              true,     // Хөнгөлөлт
    delivery:               true,     // Хүргэлт
    deliveryFee:            true,     // Хүргэлтийн төлбөр
    deliveryAssignment:     true,     // Хүргэлт хуваарилах
    orderAssignment:        true,     // Захиалга хуваарилах
    bulkActions:            true,     // Бөөнөөр үйлдэл
    
    // --- Бараа ---
    inventory:              true,     // Нөөц хяналт
    lowStockAlert:          true,     // Нөөц бага анхааруулга
    productCategories:      true,     // Барааны ангилал
    productVariants:        false,    // Хувилбарууд (өнгө, размер)
    tierPricing:            false,    // Шатлал үнэ
    productImages:          true,     // Барааны зураг
    barcode:                false,    // Баркод / SKU
    
    // --- Харилцагч ---
    customerTags:           true,     // Шошго
    customerNotes:          true,     // Тэмдэглэл
    companyInfo:            false,    // Компанийн мэдээлэл
    
    // --- Баг ---
    workHourRestriction:    false,    // Ажлын цагийн хязгаар
    deviceRestriction:      false,    // Төхөөрөмжийн хязгаар
    approvalSystem:         true,     // Зөвшөөрлийн систем
    activityLog:            true,     // Идэвхжилийн лог (🔒 заавал ON)
    onlinePresence:         true,     // Онлайн статус
    performanceReports:     true,     // Гүйцэтгэлийн тайлан
    
    // --- Интеграци ---
    b2bIntegration:         false,    // B2B
    deliveryIntegration:    false,    // Хүргэлтийн интеграци
    cargoIntegration:       false,    // Карго интеграци
    
    // --- Тайлан ---
    salesReport:            true,
    revenueReport:          true,
    inventoryReport:        true,
    accountReport:          true,
    debtAgingReport:        false,
    
    // --- Мэдэгдэл ---
    pushNotification:       true,
    emailNotification:      false,
    smsNotification:        false,
  }
}
```

---

## 4. FEATURE TOGGLE-ИЙН UI НӨЛӨӨ

### 4.1 Toggle OFF → UI-аас юу алга болох

| Feature | OFF болоход алга болох |
|---------|----------------------|
| `tax` | Захиалгын тооцоонд НӨАТ мөр, тохиргоонд НӨАТ хэсэг |
| `multiCurrency` | Валют сонгох dropdown, ханшийн тохиргоо |
| `profitTracking` | Өртгийн үнэ талбар, ашгийн тайлан |
| `splitPayment` | "Хуваан төлөх" товчлуур |
| `creditManagement` | Авлагын хуудас, зээлийн мэдээлэл, авлагын тайлан |
| `discounts` | Хөнгөлөлтийн талбар (захиалга үүсгэхэд) |
| `delivery` | Хүргэлтийн хэсэг бүхэлдээ |
| `orderAssignment` | "Хуваарилах" dropdown |
| `bulkActions` | Checkbox, "Бөөнөөр" товчлуур |
| `inventory` | Нөөцийн тоо, +/- товчлуур, нөөцийн тайлан |
| `productVariants` | Хувилбар (өнгө, размер) хэсэг |
| `tierPricing` | Шатлал үнийн хүснэгт |
| `productImages` | Зураг upload хэсэг |
| `barcode` | Баркод, SKU талбарууд |
| `customerTags` | Шошго хэсэг |
| `companyInfo` | Компанийн нэр, РД талбар |
| `approvalSystem` | Зөвшөөрлийн хүсэлт, мэдэгдэл |
| `onlinePresence` | Sidebar дэх "Хэн онлайн" хэсэг |
| `b2bIntegration` | Интеграцийн бүх хуудас, товчлуурууд |

### 4.2 Кодын хэрэгжүүлэлт

```tsx
// hooks/useFeature.ts
function useFeature(featureName: string): boolean {
  const { activeBusiness } = useBusiness();
  return activeBusiness?.features?.[featureName] ?? false;
}

// Хэрэглээ:
function OrderCreate() {
  const hasTax = useFeature('tax');
  const hasDiscount = useFeature('discounts');
  const hasDelivery = useFeature('delivery');
  const hasAttachments = useFeature('attachments');
  
  return (
    <form>
      {/* Үндсэн талбарууд — заавал */}
      <CustomerSection />
      <ItemsSection />
      
      {/* НӨАТ — toggle ON бол л харагдана */}
      {hasTax && <TaxSection />}
      
      {/* Хөнгөлөлт — toggle ON бол */}
      {hasDiscount && <DiscountSection />}
      
      {/* Хүргэлт — toggle ON бол */}
      {hasDelivery && <DeliverySection />}
      
      {/* Файл — toggle ON бол */}
      {hasAttachments && <AttachmentsSection />}
      
      <PriceSummary showTax={hasTax} />
    </form>
  );
}
```

```tsx
// FeatureGate компонент (PermissionGate-тэй адил)
function FeatureGate({ feature, children }: { feature: string; children: ReactNode }) {
  const enabled = useFeature(feature);
  if (!enabled) return null;
  return <>{children}</>;
}

// Хэрэглээ:
<FeatureGate feature="inventory">
  <StockManagement />
</FeatureGate>

<FeatureGate feature="b2bIntegration">
  <IntegrationPage />
</FeatureGate>
```

---

## 5. АНГИЛАЛ БҮРИЙН АНХДАГЧ TOGGLE

Бизнес шинээр үүсэхэд ангилалаас хамааран зарим feature автомат ON/OFF болно:

| Feature | 📦Карго | 🏪Бөөний | 📱Онлайн | 🍔Хоол | 🔧Засвар | 🖨️Хэвлэл | 💐Цэцэг | 💊Эм | 🚗Авто | 📋Ерөнхий |
|---------|--------|---------|---------|-------|---------|---------|-------|------|-------|---------|
| tax | ON | ON | OFF | ON | OFF | ON | OFF | ON | OFF | OFF |
| multiCurrency | **ON** | OFF | OFF | OFF | OFF | OFF | OFF | OFF | OFF | OFF |
| profitTracking | ON | ON | ON | ON | OFF | ON | ON | ON | ON | OFF |
| splitPayment | ON | ON | ON | OFF | ON | ON | ON | ON | ON | OFF |
| creditManagement | ON | **ON** | OFF | OFF | OFF | ON | OFF | ON | ON | OFF |
| delivery | ON | ON | **ON** | **ON** | OFF | ON | **ON** | ON | OFF | OFF |
| inventory | OFF | **ON** | **ON** | ON | OFF | OFF | ON | **ON** | **ON** | OFF |
| productVariants | OFF | OFF | **ON** | OFF | OFF | OFF | OFF | OFF | OFF | OFF |
| tierPricing | OFF | **ON** | OFF | OFF | OFF | ON | OFF | ON | OFF | OFF |
| barcode | OFF | ON | ON | OFF | OFF | OFF | OFF | **ON** | ON | OFF |
| b2bIntegration | OFF | OFF | OFF | OFF | OFF | OFF | OFF | OFF | OFF | OFF |
| approvalSystem | ON | ON | OFF | OFF | ON | ON | OFF | ON | ON | OFF |

> **Тайлбар:** Эзэн хүссэн үедээ дурын toggle-ийг өөрчилж болно. Дээрх нь зөвхөн анхдагч утга.

---

## 6. 🔒 FEATURE + PERMISSION ХОСОЛСОН ХЯНАЛТ

Feature ON байсан ч Permission-гүй бол ажиллахгүй.

```
Feature toggle (features.discounts = ON)
  └── Бизнесийн түвшинд: Хөнгөлөлт боломжтой юу

Permission (orders.apply_discount)
  └── Ажилтны түвшинд: Энэ ажилтан хөнгөлөлт олгож чадах уу

Хоёулаа TRUE → Хөнгөлөлтийн талбар ХАРАГДАНА
Аль нэг FALSE → ХАРАГДАХГҮЙ
```

```tsx
// Хосолсон шалгалт
function FeaturePermissionGate({ 
  feature, permission, children 
}: { feature: string; permission: string; children: ReactNode }) {
  const featureEnabled = useFeature(feature);
  const { hasPermission } = usePermission();
  
  if (!featureEnabled || !hasPermission(permission)) return null;
  return <>{children}</>;
}

// Хэрэглээ:
<FeaturePermissionGate feature="discounts" permission="orders.apply_discount">
  <DiscountField />
</FeaturePermissionGate>

<FeaturePermissionGate feature="creditManagement" permission="customers.manage_credit">
  <CreditLimitSettings />
</FeaturePermissionGate>
```

---

## 7. TOGGLE ТОХИРГУУЛАРЫН ЛОГ

Toggle өөрчлөхөд бас **аудит лог** бичигдэнэ:

```javascript
// Лог жишээ:
{
  action: "settings.feature_toggle",
  module: "settings",
  targetType: "feature",
  targetId: "tax",
  targetLabel: "НӨАТ",
  changes: [
    { field: "features.tax", oldValue: false, newValue: true }
  ],
  severity: "warning",
  userId: "user_owner",
  userName: "Бат-Эрдэнэ",
  createdAt: Timestamp
}
```

---

*Энэ модуль бизнес эзэнд өөрийн платформыг бүрэн удирдах эрхийг олгоно.*
