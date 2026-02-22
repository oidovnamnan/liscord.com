# 🌍 LISCORD — ОЛОН УЛС, ОЛОН ХЭЛ (i18n & Localization)

> **Зарчим:** Liscord нь зөвхөн Монголд бус, дэлхийн аль ч улсад ажиллана.
> Бүртгүүлэхдээ улс сонговол — хэл, валют, татвар, утасны формат, хаягийн
> формат, огнооны формат бүгд тухайн улсын стандартаар автомат тохируулагдана.

---

## 1. БҮРТГҮҮЛЭХ ҮЕД УЛС СОНГОХ

```
Алхам 1: Хувийн мэдээлэл
Алхам 2: OTP
Алхам 3: Бизнес үүсгэх
  ┌──────────────────────────────────┐
  │   🏢 Бизнесийнхээ нэрийг оруулна│
  │   [Эрээн Карго                 ] │
  │                                  │
  │   🌍 Улс сонгох: *              │
  │   ┌────────────────────────────┐ │
  │   │ 🇲🇳 Монгол               │ │
  │   │ 🇰🇷 Өмнөд Солонгос       │ │
  │   │ 🇺🇸 АНУ                  │ │
  │   │ 🇬🇧 Их Британи           │ │
  │   │ 🇨🇳 Хятад                │ │
  │   │ 🇯🇵 Япон                 │ │
  │   │ 🇷🇺 ОХУ                  │ │
  │   │ 🇩🇪 Герман               │ │
  │   │ 🇹🇷 Турк                 │ │
  │   │ 🇰🇿 Казакстан            │ │
  │   │ 🇦🇺 Австрали             │ │
  │   │ 🇨🇦 Канад                │ │
  │   │ ...                        │ │
  │   └────────────────────────────┘ │
  │                                  │
  │   → Улс сонгоход доорх бүгд     │
  │     АВТОМАТ тохируулагдана:      │
  │   ✅ Хэл: Монгол               │
  │   ✅ Валют: ₮ (MNT)            │
  │   ✅ Татвар: НӨАТ 10%          │
  │   ✅ Утас: +976               │
  │   ✅ Цагийн бүс: UTC+8         │
  │                                  │
  │   Бизнесийн ангилал: [▾ Сонгох] │
  │                                  │
  │   [       Үргэлжлүүлэх        ] │
  └──────────────────────────────────┘
```

---

## 2. УЛСЫН ТОХИРГОО (Country Config)

```javascript
// src/utils/constants/countries.ts

export const COUNTRIES = {
  MN: {
    code: "MN",
    name: { en: "Mongolia", mn: "Монгол", ko: "몽골", zh: "蒙古", ru: "Монголия" },
    flag: "🇲🇳",
    languages: ["mn", "en"],
    defaultLanguage: "mn",
    
    // Валют
    currency: {
      code: "MNT",
      symbol: "₮",
      name: { en: "Tugrik", mn: "Төгрөг" },
      decimals: 0,                       // Монголд бутархай байхгүй
      position: "before",                // ₮1,500,000
      thousandSeparator: ",",
      decimalSeparator: "."
    },
    
    // Татвар
    tax: {
      name: { en: "VAT", mn: "НӨАТ" },
      defaultRate: 10,
      registrationRequired: true,
      registrationLabel: { en: "VAT Registration №", mn: "НӨАТ бүртгэлийн №" }
    },
    
    // Утас
    phone: {
      code: "+976",
      format: "XXXX-XXXX",              // 9900-1234
      length: 8,
      example: "9900 1234"
    },
    
    // Хаяг
    address: {
      fields: ["district", "khoroo", "street", "building", "apartment"],
      labels: {
        mn: { district: "Дүүрэг", khoroo: "Хороо", street: "Гудамж", building: "Байр", apartment: "Тоот" },
        en: { district: "District", khoroo: "Khoroo", street: "Street", building: "Building", apartment: "Apt" }
      },
      districts: ["БЗД", "ХУД", "СБД", "ЧД", "БГД", "СХД", "НД", "ХАД", "БНД"]
    },
    
    // Огноо, цаг
    dateFormat: "YYYY.MM.DD",            // 2026.02.22
    timeFormat: "HH:mm",                 // 23:45
    timezone: "Asia/Ulaanbaatar",
    firstDayOfWeek: 1,                   // Даваа гараг
    
    // Төлбөрийн арга
    paymentMethods: [
      "cash", "bank_transfer", "qpay", "socialpay", "monpay",
      "hipay", "card_pos", "storepay", "lendmn"
    ],
    banks: [
      { id: "khan", name: { mn: "Хаан банк", en: "Khan Bank" } },
      { id: "golomt", name: { mn: "Голомт банк", en: "Golomt Bank" } },
      { id: "tdb", name: { mn: "ХХБ", en: "TDB" } },
      { id: "xac", name: { mn: "Хас банк", en: "Xac Bank" } },
      { id: "state", name: { mn: "Төрийн банк", en: "State Bank" } },
    ],
  },

  KR: {
    code: "KR",
    name: { en: "South Korea", mn: "Өмнөд Солонгос", ko: "대한민국" },
    flag: "🇰🇷",
    languages: ["ko", "en"],
    defaultLanguage: "ko",
    
    currency: {
      code: "KRW",
      symbol: "₩",
      name: { en: "Won", ko: "원" },
      decimals: 0,
      position: "before",
      thousandSeparator: ",",
      decimalSeparator: "."
    },
    
    tax: {
      name: { en: "VAT", ko: "부가가치세" },
      defaultRate: 10,
      registrationRequired: true,
      registrationLabel: { en: "Business Registration №", ko: "사업자등록번호" }
    },
    
    phone: {
      code: "+82",
      format: "XXX-XXXX-XXXX",
      length: 10,
      example: "010-1234-5678"
    },
    
    address: {
      fields: ["province", "city", "district", "street", "detail"],
      labels: {
        ko: { province: "시/도", city: "시/군/구", district: "동/읍/면", street: "도로명", detail: "상세주소" },
        en: { province: "Province", city: "City", district: "District", street: "Street", detail: "Detail" }
      }
    },
    
    dateFormat: "YYYY.MM.DD",
    timeFormat: "HH:mm",
    timezone: "Asia/Seoul",
    firstDayOfWeek: 0,                   // Ням
    
    paymentMethods: [
      "cash", "bank_transfer", "card_pos", "kakaopay", "naverpay", "toss"
    ],
    banks: [
      { id: "kb", name: { ko: "국민은행", en: "KB Bank" } },
      { id: "shinhan", name: { ko: "신한은행", en: "Shinhan Bank" } },
      { id: "woori", name: { ko: "우리은행", en: "Woori Bank" } },
      { id: "hana", name: { ko: "하나은행", en: "Hana Bank" } },
    ],
  },

  US: {
    code: "US",
    name: { en: "United States" },
    flag: "🇺🇸",
    languages: ["en", "es"],
    defaultLanguage: "en",
    
    currency: {
      code: "USD",
      symbol: "$",
      name: { en: "Dollar" },
      decimals: 2,                       // $1,500.00
      position: "before",
      thousandSeparator: ",",
      decimalSeparator: "."
    },
    
    tax: {
      name: { en: "Sales Tax" },
      defaultRate: 0,                    // Мужаас хамаарна
      registrationRequired: false,
      registrationLabel: { en: "Tax ID (EIN)" },
      // АНУ-д муж бүрт өөр татвар
      stateRates: {
        "CA": 7.25, "NY": 8, "TX": 6.25, "FL": 6,
        "WA": 6.5, "OR": 0, "MT": 0, "NH": 0
      }
    },
    
    phone: {
      code: "+1",
      format: "(XXX) XXX-XXXX",
      length: 10,
      example: "(212) 555-1234"
    },
    
    address: {
      fields: ["line1", "line2", "city", "state", "zipCode"],
      labels: {
        en: { line1: "Address Line 1", line2: "Line 2", city: "City", state: "State", zipCode: "ZIP Code" }
      }
    },
    
    dateFormat: "MM/DD/YYYY",            // 02/22/2026
    timeFormat: "h:mm A",               // 11:45 PM
    timezone: "America/New_York",
    firstDayOfWeek: 0,
    
    paymentMethods: [
      "cash", "bank_transfer", "card_pos", "apple_pay", "google_pay",
      "venmo", "zelle", "paypal"
    ],
    banks: [
      { id: "chase", name: { en: "Chase" } },
      { id: "bofa", name: { en: "Bank of America" } },
      { id: "wells", name: { en: "Wells Fargo" } },
    ],
  },

  CN: {
    code: "CN",
    name: { en: "China", zh: "中国", mn: "Хятад" },
    flag: "🇨🇳",
    languages: ["zh", "en"],
    defaultLanguage: "zh",
    
    currency: {
      code: "CNY", symbol: "¥",
      name: { en: "Yuan", zh: "元" },
      decimals: 2, position: "before",
      thousandSeparator: ",", decimalSeparator: "."
    },
    
    tax: {
      name: { en: "VAT", zh: "增值税" },
      defaultRate: 13,
      registrationRequired: true,
      registrationLabel: { en: "Tax Registration №", zh: "税务登记号" }
    },
    
    phone: { code: "+86", format: "XXX XXXX XXXX", length: 11, example: "138 1234 5678" },
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    timezone: "Asia/Shanghai",
    firstDayOfWeek: 1,
    
    paymentMethods: ["cash", "bank_transfer", "wechat_pay", "alipay", "card_pos"],
    banks: [
      { id: "icbc", name: { zh: "工商银行", en: "ICBC" } },
      { id: "ccb", name: { zh: "建设银行", en: "CCB" } },
    ],
  },

  JP: {
    code: "JP",
    name: { en: "Japan", ja: "日本" },
    flag: "🇯🇵",
    languages: ["ja", "en"],
    defaultLanguage: "ja",
    currency: { code: "JPY", symbol: "¥", decimals: 0, position: "before", thousandSeparator: ",", decimalSeparator: "." },
    tax: { name: { en: "Consumption Tax", ja: "消費税" }, defaultRate: 10 },
    phone: { code: "+81", format: "XXX-XXXX-XXXX", length: 10 },
    dateFormat: "YYYY/MM/DD",
    timeFormat: "HH:mm",
    timezone: "Asia/Tokyo",
    firstDayOfWeek: 0,
    paymentMethods: ["cash", "bank_transfer", "card_pos", "paypay", "linepay"],
  },

  RU: {
    code: "RU",
    name: { en: "Russia", ru: "Россия", mn: "ОХУ" },
    flag: "🇷🇺",
    languages: ["ru", "en"],
    defaultLanguage: "ru",
    currency: { code: "RUB", symbol: "₽", decimals: 2, position: "after", thousandSeparator: " ", decimalSeparator: "," },
    tax: { name: { en: "VAT", ru: "НДС" }, defaultRate: 20 },
    phone: { code: "+7", format: "XXX XXX-XX-XX", length: 10 },
    dateFormat: "DD.MM.YYYY",
    timeFormat: "HH:mm",
    timezone: "Europe/Moscow",
    firstDayOfWeek: 1,
    paymentMethods: ["cash", "bank_transfer", "card_pos", "sberpay", "yoomoney"],
  },

  GB: {
    code: "GB",
    name: { en: "United Kingdom" },
    flag: "🇬🇧",
    languages: ["en"],
    defaultLanguage: "en",
    currency: { code: "GBP", symbol: "£", decimals: 2, position: "before", thousandSeparator: ",", decimalSeparator: "." },
    tax: { name: { en: "VAT" }, defaultRate: 20 },
    phone: { code: "+44", format: "XXXX XXX XXXX", length: 10 },
    dateFormat: "DD/MM/YYYY",
    timeFormat: "HH:mm",
    timezone: "Europe/London",
    firstDayOfWeek: 1,
    paymentMethods: ["cash", "bank_transfer", "card_pos", "apple_pay", "google_pay"],
  },

  // ... Бусад улсууд нэмэгдэнэ (Турк, Казакстан, Австрали, Канад г.м.)
};
```

---

## 3. 🌐 ХЭЛНИЙ СИСТЕМ (i18n)

### 3.1 Дэмжих хэлүүд (Эхний хувилбар)

| # | Код | Нэр | Тайлбар |
|---|-----|-----|---------|
| 1 | `mn` | Монгол | Үндсэн хэл |
| 2 | `en` | English | Олон улсын |
| 3 | `ko` | 한국어 | Солонгос |
| 4 | `zh` | 中文 | Хятад |
| 5 | `ru` | Русский | Орос |
| 6 | `ja` | 日本語 | Япон |

### 3.2 Орчуулгын файлын бүтэц

```
src/
└── locales/
    ├── mn/
    │   ├── common.json          # Нийтлэг (Хадгалах, Цуцлах, Засах...)
    │   ├── auth.json            # Нэвтрэх, Бүртгүүлэх
    │   ├── orders.json          # Захиалга
    │   ├── customers.json       # Харилцагч
    │   ├── products.json        # Бараа
    │   ├── payments.json        # Төлбөр
    │   ├── settings.json        # Тохиргоо
    │   ├── dashboard.json       # Dashboard
    │   └── errors.json          # Алдааны мэдэгдлүүд
    ├── en/
    │   ├── common.json
    │   ├── auth.json
    │   └── ...
    ├── ko/
    │   └── ...
    └── zh/
        └── ...
```

### 3.3 Орчуулгын файлын жишээ

```json
// locales/mn/common.json
{
  "save": "Хадгалах",
  "cancel": "Цуцлах",
  "edit": "Засах",
  "delete": "Устгах",
  "search": "Хайх",
  "filter": "Шүүлтүүр",
  "back": "Буцах",
  "next": "Үргэлжлүүлэх",
  "confirm": "Баталгаажуулах",
  "yes": "Тийм",
  "no": "Үгүй",
  "loading": "Ачааллаж байна...",
  "noData": "Мэдээлэл байхгүй",
  "success": "Амжилттай",
  "error": "Алдаа гарлаа",
  "required": "Заавал бөглөнө",
  "today": "Өнөөдөр",
  "yesterday": "Өчигдөр",
  "thisWeek": "Энэ долоо хоног",
  "thisMonth": "Энэ сар",
  "all": "Бүгд",
  "total": "Нийт",
  "amount": "Дүн",
  "status": "Төлөв",
  "date": "Огноо",
  "time": "Цаг",
  "name": "Нэр",
  "phone": "Утас",
  "email": "И-мэйл",
  "address": "Хаяг",
  "note": "Тэмдэглэл",
  "actions": "Үйлдлүүд"
}
```

```json
// locales/en/common.json
{
  "save": "Save",
  "cancel": "Cancel",
  "edit": "Edit",
  "delete": "Delete",
  "search": "Search",
  "filter": "Filter",
  "back": "Back",
  "next": "Continue",
  "confirm": "Confirm",
  "yes": "Yes",
  "no": "No",
  "loading": "Loading...",
  "noData": "No data available",
  "success": "Success",
  "error": "An error occurred"
}
```

```json
// locales/mn/orders.json
{
  "title": "Захиалгууд",
  "newOrder": "Шинэ захиалга",
  "orderNumber": "Захиалгын дугаар",
  "customer": "Харилцагч",
  "items": "Бараанууд",
  "addItem": "Бараа нэмэх",
  "quantity": "Тоо ширхэг",
  "unitPrice": "Нэгж үнэ",
  "totalPrice": "Нийт үнэ",
  "subtotal": "Дүн",
  "discount": "Хөнгөлөлт",
  "deliveryFee": "Хүргэлтийн төлбөр",
  "tax": "Татвар",
  "grandTotal": "НИЙТ",
  "paymentStatus": "Төлбөрийн байдал",
  "unpaid": "Төлөөгүй",
  "partial": "Хэсэгчлэн",
  "paid": "Төлсөн",
  "status": {
    "new": "Шинэ",
    "confirmed": "Баталсан",
    "preparing": "Бэлтгэж байна",
    "ready": "Бэлэн",
    "delivering": "Хүргэж байна",
    "delivered": "Хүргэгдсэн",
    "completed": "Дууссан",
    "cancelled": "Цуцалсан"
  },
  "deleteConfirm": "Энэ захиалгыг устгахдаа итгэлтэй байна уу?",
  "enterPin": "PIN оруулна уу"
}
```

```json
// locales/en/orders.json
{
  "title": "Orders",
  "newOrder": "New Order",
  "orderNumber": "Order Number",
  "customer": "Customer",
  "items": "Items",
  "addItem": "Add Item",
  "quantity": "Quantity",
  "unitPrice": "Unit Price",
  "totalPrice": "Total Price",
  "subtotal": "Subtotal",
  "discount": "Discount",
  "deliveryFee": "Delivery Fee",
  "tax": "Tax",
  "grandTotal": "TOTAL",
  "status": {
    "new": "New",
    "confirmed": "Confirmed",
    "preparing": "Preparing",
    "ready": "Ready",
    "delivering": "Delivering",
    "delivered": "Delivered",
    "completed": "Completed",
    "cancelled": "Cancelled"
  }
}
```

### 3.4 Кодын хэрэгжүүлэлт

```tsx
// hooks/useTranslation.ts
function useTranslation(namespace?: string) {
  const { language } = useAuth();    // Хэрэглэгчийн хэл
  
  function t(key: string, params?: Record<string, any>): string {
    // "orders.status.new" → locales/mn/orders.json → status.new → "Шинэ"
    let text = getTranslation(language, namespace, key);
    
    // Параметр орлуулах: t("orderCount", { count: 5 }) → "5 захиалга"
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }
  
  return { t, language };
}

// Хэрэглээ:
function OrderList() {
  const { t } = useTranslation('orders');
  
  return (
    <div>
      <h1>{t('title')}</h1>                    {/* "Захиалгууд" / "Orders" */}
      <Button>{t('newOrder')}</Button>          {/* "Шинэ захиалга" / "New Order" */}
      <Badge>{t('status.new')}</Badge>          {/* "Шинэ" / "New" */}
    </div>
  );
}
```

---

## 4. 💱 ВАЛЮТ ФОРМАТ (Улсад тохирсон)

```typescript
// utils/formatters/currency.ts
function formatMoney(amount: number, currencyConfig: CurrencyConfig): string {
  const { symbol, decimals, position, thousandSeparator, decimalSeparator } = currencyConfig;
  
  const formatted = amount.toFixed(decimals)
    .replace('.', decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return position === 'before' 
    ? `${symbol}${formatted}` 
    : `${formatted}${symbol}`;
}

// Жишээ:
// Монгол:     formatMoney(1500000, MN.currency) → "₮1,500,000"
// Солонгос:   formatMoney(1500000, KR.currency) → "₩1,500,000"
// АНУ:        formatMoney(1500.50, US.currency) → "$1,500.50"
// ОХУ:        formatMoney(1500.50, RU.currency) → "1 500,50₽"
// Хятад:      formatMoney(1500.50, CN.currency) → "¥1,500.50"
// Япон:       formatMoney(150000, JP.currency)  → "¥150,000"
// Англи:      formatMoney(1500.50, GB.currency) → "£1,500.50"
```

---

## 5. 📱 УТАСНЫ ФОРМАТ (Улсад тохирсон)

```
🇲🇳 Монгол:   +976 9900-1234
🇰🇷 Солонгос: +82 010-1234-5678
🇺🇸 АНУ:      +1 (212) 555-1234
🇨🇳 Хятад:    +86 138 1234 5678
🇷🇺 ОХУ:      +7 912 345-67-89
🇯🇵 Япон:     +81 090-1234-5678
🇬🇧 Англи:    +44 7911 123456
```

---

## 6. 📅 ОГНОО / ЦАГ ФОРМАТ

```
🇲🇳 Монгол:   2026.02.22  23:45
🇰🇷 Солонгос: 2026.02.22  23:45
🇺🇸 АНУ:      02/22/2026  11:45 PM
🇨🇳 Хятад:    2026-02-22  23:45
🇷🇺 ОХУ:      22.02.2026  23:45
🇯🇵 Япон:     2026/02/22  23:45
🇬🇧 Англи:    22/02/2026  23:45
```

---

## 7. 🏠 ХАЯГИЙН ФОРМАТ (Улсад тохирсон)

```
🇲🇳 Монгол:
  Дүүрэг: [▾ БЗД]
  Хороо:  [3-р хороо]
  Байр:   [45-р байр]
  Тоот:   [301]

🇰🇷 Солонгос:
  시/도:    [▾ 서울특별시]
  시/군/구: [강남구]
  도로명:   [테헤란로 123]
  상세주소: [4층 401호]

🇺🇸 АНУ:
  Address Line 1: [123 Main Street]
  Address Line 2: [Suite 400]
  City:           [New York]
  State:          [▾ NY]
  ZIP Code:       [10001]

🇷🇺 ОХУ:
  Город:   [Москва]
  Улица:   [ул. Ленина, д. 15]
  Квартира: [кв. 42]
  Индекс:  [101000]
```

---

## 8. 🏦 УЛСЫН ТӨЛБӨРИЙН АРГА

Улс бүрт зөвхөн тухайн улсын төлбөрийн аргууд харагдана:

| Арга | 🇲🇳 | 🇰🇷 | 🇺🇸 | 🇨🇳 | 🇯🇵 | 🇷🇺 | 🇬🇧 |
|------|-----|-----|-----|-----|-----|-----|-----|
| Бэлэн мөнгө | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Банкны шилжүүлэг | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Карт (POS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QPay | ✅ | | | | | | |
| SocialPay | ✅ | | | | | | |
| MonPay | ✅ | | | | | | |
| KakaoPay | | ✅ | | | | | |
| NaverPay | | ✅ | | | | | |
| Toss | | ✅ | | | | | |
| Apple Pay | | | ✅ | | | | ✅ |
| Google Pay | | | ✅ | | | | ✅ |
| Venmo | | | ✅ | | | | |
| PayPal | | | ✅ | | | | ✅ |
| WeChat Pay | | | | ✅ | | | |
| Alipay | | | | ✅ | | | |
| PayPay | | | | | ✅ | | |
| LinePay | | | | | ✅ | | |
| SberPay | | | | | | ✅ | |
| YooMoney | | | | | | ✅ | |

---

## 9. БИЗНЕСИЙН МЭДЭЭЛЭЛД НӨЛӨӨ

```javascript
// businesses/{bizId} — улсын мэдээлэл нэмэгдэнэ
{
  id: "biz_abc",
  name: "Эрээн Карго",
  category: "cargo_import",
  
  // 🌍 Улсын тохиргоо
  country: "MN",                         // Улсын код
  language: "mn",                        // Хэл
  timezone: "Asia/Ulaanbaatar",
  
  // Валют (улсаас автомат, гэхдээ өөрчилж болно)
  currency: {
    primary: "MNT",
    symbol: "₮",
    decimals: 0
  },
  
  // Татвар (улсаас автомат)
  tax: {
    enabled: true,
    rate: 10,
    name: "НӨАТ"
  },
  
  // ... бусад тохиргоо
}
```

---

## 10. ХЭЛ СОЛИХ UI

```
Хэрэглэгчийн профайл → Хэл сонгох:
┌──────────────────────────────────┐
│ 👤 Профайл > Хэл                │
│                                  │
│ Апп-ийн хэл:                    │
│ ┌────────────────────────────┐  │
│ │ 🇲🇳 Монгол          ← сонгосон│
│ │ 🇬🇧 English                │  │
│ │ 🇰🇷 한국어                  │  │
│ │ 🇨🇳 中文                    │  │
│ │ 🇷🇺 Русский                │  │
│ │ 🇯🇵 日本語                  │  │
│ └────────────────────────────┘  │
│                                  │
│ ℹ️ Бизнесийн мэдээлэл (захиалга,│
│ бараа нэр г.м.) орчуулагдахгүй. │
│ Зөвхөн UI орчуулагдана.         │
│                                  │
│ [    Хадгалах    ]               │
└──────────────────────────────────┘
```

---

*Энэ модуль Liscord-ийг дэлхийн аль ч улсад ажиллах боломжтой болгоно.*
