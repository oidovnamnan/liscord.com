# ⏰ LISCORD — ЦАГ БҮРТГЭЛ, ЦАЛИН & УРАМШУУЛАЛ (HR МОДУЛЬ)

> **Зарчим:** Ажилтны цаг бүртгэл → гүйцэтгэл → цалин → татвар → урамшуулал
> бүгд автомат уялдана. Бизнес эзэн нэг дэлгэцээс бүгдийг удирдана.
> Бүрэн динамик — формулыг өөрчилвөл бүгд автомат дахин тооцоологдоно.

---

## 1. ⏰ ЦАГ БҮРТГЭЛ (Time Tracking)

### 1.1 Бүртгэлийн аргууд

| # | Арга | Тайлбар |
|---|------|---------|
| 1 | **Апп дээр товших** | Ажилтан "Ирсэн" / "Гарсан" товчлуур дарна |
| 2 | **Автомат (нэвтрэлт)** | Нэвтрэхэд ирсэн, гарахад гарсан (тохируулж болно) |
| 3 | **GPS баталгаа** | Тодорхой байршилд л "Ирсэн" дарж болно (тохируулж болно) |
| 4 | **Гараар оруулах** | Менежер/эзэн гараар оруулна |

### 1.2 Ажилтны цагийн дэлгэц

```
┌──────────────────────────────────────────┐
│  ⏰ Цаг бүртгэл                         │
│                                          │
│  Өнөөдөр: 2026.02.22 (Ням)              │
│  Статус: 🟢 Ажиллаж байна               │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Ирсэн:  09:02  ✅                │  │
│  │  Завсарлага: 12:30 - 13:15 (45м)  │  │
│  │  Одоо:   15:31                     │  │
│  │  Ажилласан: 5 цаг 44 мин          │  │
│  │                                    │  │
│  │  [🔴 Гарсан бүртгэх]              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ── Энэ 7 хоног ────────────────────── │
│  Даваа    09:00 - 18:30   8ц 45м  ✅   │
│  Мягмар   09:15 - 18:00   8ц 00м  ✅   │
│  Лхагва   --:-- - --:--   Чөлөөтэй 🟡 │
│  Пүрэв    08:50 - 19:00   9ц 25м  ✅   │
│  Баасан   09:02 - ??:??   5ц 44м  🔵   │
│  ─────────────────────────────────────  │
│  Нийт:                    31ц 54м       │
│  Илүү цаг:                1ц 54м ⏳    │
│                                          │
│  ── Энэ сар ─────────────────────────── │
│  Ажлын өдөр: 18/22 (82%)               │
│  Нийт цаг: 148ц 30м / 176ц            │
│  Илүү цаг: 8ц 30м ⏳                   │
│  Хоцорсон: 2 удаа ⚠️                   │
│  Чөлөөтэй: 2 өдөр                      │
│  Өвчтэй: 0 өдөр                        │
└──────────────────────────────────────────┘
```

### 1.3 Цагийн бүтэц

```javascript
// Firestore: businesses/{bizId}/timeRecords/{recordId}
{
  id: "tr_abc",
  employeeId: "user_dorj",
  employeeName: "Дорж",
  positionName: "Менежер",
  date: "2026-02-22",                    // YYYY-MM-DD
  
  // Цаг
  clockIn: Timestamp,                    // 09:02
  clockOut: Timestamp,                   // 18:30
  
  // Завсарлага
  breaks: [
    { start: Timestamp, end: Timestamp, duration: 45 }  // минут
  ],
  totalBreakMinutes: 45,
  
  // Тооцоо
  grossMinutes: 568,                     // Нийт (ирсэн → гарсан)
  breakMinutes: 45,                      // Завсарлага
  netMinutes: 523,                       // Цэвэр ажилласан = 8ц 43м
  overtimeMinutes: 43,                   // 8 цагаас илүү хэсэг
  lateMinutes: 2,                        // Хоцорсон (09:00 → 09:02)
  earlyLeaveMinutes: 0,                  // Эрт гарсан
  
  // Төрөл
  type: "regular",                       // "regular" | "overtime" | "holiday" | "leave" | "sick" | "remote"
  
  // Баталгаажуулалт
  method: "app_button",                  // "app_button" | "auto_login" | "gps" | "manual"
  gpsLocation: null,                     // GPS бол координат
  verifiedBy: null,                      // Гараар оруулсан бол хэн
  
  isApproved: true,                      // Менежер зөвшөөрсөн
  approvedBy: "user_bat",
  
  note: "",
  createdAt: Timestamp,
}
```

### 1.4 Чөлөө, амралт, өвчтэй

```javascript
// Firestore: businesses/{bizId}/leaveRequests/{requestId}
{
  id: "lr_abc",
  employeeId: "user_dorj",
  employeeName: "Дорж",
  
  type: "annual_leave",                  // Доорх жагсаалтаас
  startDate: "2026-03-01",
  endDate: "2026-03-03",
  days: 3,
  
  reason: "Гэр бүлийн шалтгаан",
  
  status: "approved",                    // "pending" | "approved" | "rejected"
  approvedBy: "user_bat",
  approvedAt: Timestamp,
  
  createdAt: Timestamp,
}
```

| # | Төрөл | Label | Цалинтай юу | Жилд хэдэн хоног |
|---|-------|-------|-------------|-------------------|
| 1 | `annual_leave` | Ээлжийн амралт | ✅ Тийм | Тохируулна (15) |
| 2 | `sick_leave` | Өвчтэй | ✅ Тийм | Тохируулна (5) |
| 3 | `unpaid_leave` | Цалингүй чөлөө | ❌ Үгүй | Хязгааргүй |
| 4 | `personal_leave` | Хувийн чөлөө | Тохируулна | Тохируулна (3) |
| 5 | `maternity` | Жирэмсний | ✅ Тийм | Хуулиар |
| 6 | `remote` | Зайнаас ажиллах | ✅ Тийм | Хязгааргүй |

---

## 2. 💰 ЦАЛИНГИЙН ТОХИРГОО

### 2.1 Цалингийн бүтэц (Бизнес тохируулна)

```javascript
// businesses/{bizId}/settings → payroll
{
  payroll: {
    enabled: true,
    
    // Цалингийн мөчлөг
    payPeriod: "monthly",                // "monthly" | "biweekly" | "weekly"
    payDay: 1,                           // Сарын хэднээ
    
    // Ажлын цагийн тохиргоо
    workSchedule: {
      regularHoursPerDay: 8,             // Ердийн ажлын цаг
      regularDaysPerWeek: 5,             // Ажлын өдрүүд
      regularHoursPerMonth: 176,         // Сарын ердийн цаг (22 × 8)
      
      workDays: ["mon", "tue", "wed", "thu", "fri"],
      workStartTime: "09:00",
      workEndTime: "18:00",
      breakDuration: 60,                 // Завсарлага (минут)
      
      lateThreshold: 10,                 // 10 минут хүртэл хоцрохыг зөвшөөрнө
    },
    
    // Илүү цагийн тохиргоо
    overtime: {
      enabled: true,
      rate: 1.5,                         // ×1.5 (150%)
      weekendRate: 2.0,                  // Амралтын өдөр ×2
      holidayRate: 2.5,                  // Баярын өдөр ×2.5
      maxPerMonth: 40,                   // Сард 40 цагаас ихгүй
      requireApproval: true,             // Эзний зөвшөөрөл
    },
    
    // Татвар (улсын тохиргооноос автомат)
    tax: {
      incomeTax: {
        enabled: true,
        // Монгол: Шатлалт татвар
        brackets: [
          { min: 0, max: 10000000, rate: 10 },
          { min: 10000001, max: null, rate: 20 },
        ],
        // Хөдөлмөрийн хөлснөөс чөлөөлөгдөх доод хэмжээ
        taxFreeThreshold: 0,
      },
      socialInsurance: {
        enabled: true,
        employeeRate: 11,                // Ажилтны хувь: 11%
        employerRate: 12.5,              // Ажил олгогчийн: 12.5%
        ceiling: 6000000,                // ₮6M-аас дээш тооцохгүй
      },
      healthInsurance: {
        enabled: true,
        rate: 2,                         // 2%
      }
    },
    
    // Суутгалын тохиргоо
    deductions: {
      lateDeductionPerMinute: 0,         // Хоцорсон минут бүрт хасалт (тохируулна)
      absentDeductionPerDay: 0,          // Ирээгүй өдрийн хасалт
    },
  }
}
```

### 2.2 Ажилтан бүрийн цалингийн тохиргоо

```javascript
// businesses/{bizId}/employees/{empId} → salary
{
  salary: {
    type: "monthly",                     // "monthly" | "hourly" | "per_order" | "mixed"
    
    // Сарын тогтмол цалин
    baseSalary: 1500000,                 // ₮1,500,000
    
    // Эсвэл цагийн
    hourlyRate: null,                    // ₮15,000/цаг
    
    // Эсвэл захиалгаар
    perOrderRate: null,                  // ₮5,000/захиалга
    
    // Тогтмол нэмэгдэл
    allowances: [
      { name: "Унааны", amount: 100000, taxable: false },
      { name: "Хоолны", amount: 150000, taxable: false },
      { name: "Утасны", amount: 50000, taxable: false },
    ],
    
    // Банкны мэдээлэл
    bankAccount: {
      bank: "khan",
      accountNumber: "5000123456",
      accountName: "Дорж",
    },
  }
}
```

---

## 3. 🎯 УРАМШУУЛАЛ & ШИЙТГЭЛ (Динамик)

### 3.1 Урамшууллын тохиргоо (Бизнес эзэн тохируулна)

```javascript
// businesses/{bizId}/settings → incentives
{
  incentives: {
    enabled: true,
    
    rules: [
      // ═══ БОРЛУУЛАЛТЫН УРАМШУУЛАЛ ═══
      {
        id: "inc_sales_target",
        name: "Борлуулалтын зорилт",
        type: "sales_target",
        isActive: true,
        
        conditions: {
          metric: "totalSales",          // Нийт борлуулалт
          period: "monthly",
          target: 10000000,              // ₮10M зорилт
        },
        reward: {
          type: "fixed",                 // "fixed" | "percent" | "tiered"
          amount: 200000,                // ₮200,000 урамшуулал
        },
        appliesTo: "all",               // "all" | "position:менежер" | "specific:user_dorj"
      },
      
      // ═══ ШАТЛАЛТ УРАМШУУЛАЛ ═══
      {
        id: "inc_sales_tiered",
        name: "Борлуулалтын шатлал",
        type: "sales_target",
        isActive: true,
        
        conditions: { metric: "totalSales", period: "monthly" },
        reward: {
          type: "tiered",
          tiers: [
            { min: 5000000,  max: 10000000, amount: 100000 },   // ₮5-10M → ₮100K
            { min: 10000001, max: 20000000, amount: 300000 },   // ₮10-20M → ₮300K
            { min: 20000001, max: null,     amount: 500000 },   // ₮20M+ → ₮500K
          ],
        },
        appliesTo: "all",
      },
      
      // ═══ ЗАХИАЛГЫН ТООНЫ УРАМШУУЛАЛ ═══
      {
        id: "inc_order_count",
        name: "Олон захиалга",
        type: "order_count",
        isActive: true,
        
        conditions: { metric: "orderCount", period: "monthly", target: 50 },
        reward: { type: "fixed", amount: 100000 },
        appliesTo: "all",
      },
      
      // ═══ ХҮРГЭЛТИЙН УРАМШУУЛАЛ ═══
      {
        id: "inc_delivery",
        name: "Хүргэлт бүрт",
        type: "per_unit",
        isActive: true,
        
        conditions: { metric: "deliveriesCompleted", period: "monthly" },
        reward: { type: "per_unit", amountPerUnit: 3000 },      // Хүргэлт бүрт ₮3,000
        appliesTo: "position:хүргэгч",
      },
      
      // ═══ ЦАГИЙН МӨРДӨЛТИЙН УРАМШУУЛАЛ ═══
      {
        id: "inc_attendance",
        name: "Төгс ирц",
        type: "attendance",
        isActive: true,
        
        conditions: {
          metric: "attendanceRate",
          period: "monthly",
          target: 100,                   // 100% ирц
          maxLateMinutes: 0,             // 0 минут хоцорсон
        },
        reward: { type: "fixed", amount: 100000 },
        appliesTo: "all",
      },
      
      // ═══ ХОЦРОЛТЫН ШИЙТГЭЛ ═══
      {
        id: "pen_late",
        name: "Хоцролтын хасалт",
        type: "penalty",
        isActive: true,
        
        conditions: { metric: "lateMinutes", period: "monthly", threshold: 30 },
        penalty: {
          type: "per_minute",
          amountPerMinute: 1000,          // Минут бүрт ₮1,000 (30 мин-аас дээш)
          maxAmount: 100000,              // Хамгийн ихдээ ₮100,000
        },
        appliesTo: "all",
      },
      
      // ═══ ГОМДОЛГҮЙ АЖИЛЛАГАА ═══
      {
        id: "inc_no_complaints",
        name: "Гомдолгүй сар",
        type: "quality",
        isActive: true,
        
        conditions: { metric: "complaintsReceived", period: "monthly", target: 0 },
        reward: { type: "fixed", amount: 50000 },
        appliesTo: "all",
      },
    ],
  }
}
```

### 3.2 Урамшууллын тооцоолох Engine

```
АЖИЛТАН: Дорж (Менежер) — 2026 оны 2-р сар

Автомат тооцоо:
├── Борлуулалт: ₮32,500,000
│   └── Шатлал: ₮20M+ → ₮500,000 урамшуулал ✅
│
├── Захиалгын тоо: 45
│   └── Зорилт: 50 → Хүрэхгүй ❌
│
├── Ирц: 18/22 өдөр (82%)
│   └── Төгс ирц: Үгүй ❌
│
├── Хоцролт: 35 минут (30-аас дээш)
│   └── Шийтгэл: 5 × ₮1,000 = -₮5,000 ⚠️
│
├── Гомдол: 2 удаа
│   └── Гомдолгүй: Үгүй ❌
│
└── НИЙТ УРАМШУУЛАЛ: +₮500,000 - ₮5,000 = +₮495,000
```

---

## 4. 📊 ЦАЛИНГИЙН ТООЦООЛОЛ (Payslip)

### 4.1 Автомат цалин тооцоолох

```
┌──────────────────────────────────────────┐
│  💰 ЦАЛИНГИЙН ХУУДАС                    │
│  Дорж (Менежер) • 2026 оны 2-р сар      │
│                                          │
│  ═══ ОЛГОЛТ ═══════════════════════════ │
│                                          │
│  Үндсэн цалин:              ₮1,500,000 │
│  Унааны нэмэгдэл:           +₮100,000  │
│  Хоолны нэмэгдэл:           +₮150,000  │
│  Утасны нэмэгдэл:           +₮50,000   │
│                                          │
│  Илүү цагийн:    8.5ц × ₮12,784 × 1.5  │
│                              +₮163,012  │
│                                          │
│  Амралтын өдөр:  4ц × ₮12,784 × 2.0    │
│                              +₮102,273  │
│                                          │
│  ── Урамшуулал ──────────────────────── │
│  Борлуулалтын шатлал (₮20M+): +₮500,000│
│                                          │
│  ── НИЙТ ОЛГОЛТ ─────────────────────── │
│                              ₮2,565,285 │
│                                          │
│  ═══ СУУТГАЛ ═════════════════════════= │
│                                          │
│  Хоцролтын хасалт:           -₮5,000   │
│                                          │
│  ── Татвар ──────────────────────────── │
│  ХАСАГДАХ НИЙТ (татвартай):  ₮2,265,285│
│  (Нэмэгдэлүүд: ₮300,000 татваргүй)     │
│                                          │
│  НД шимтгэл (11%):          -₮249,181  │
│  ЭМД (2%):                  -₮45,306   │
│  ХХОАТ (10%): ₮1,970,798 × 10%         │
│                              -₮197,080  │
│                                          │
│  ── НИЙТ СУУТГАЛ ────────────────────── │
│                              -₮496,567  │
│                                          │
│  ═══════════════════════════════════════ │
│  💵 ГАРТ ОЛГОХ:             ₮2,068,718 │
│  ═══════════════════════════════════════ │
│                                          │
│  Банк: Хаан банк 5000123456             │
│  Олгох огноо: 2026.03.01               │
│                                          │
│  [📥 PDF татах] [✅ Батлах] [✏️ Засах]  │
└──────────────────────────────────────────┘
```

### 4.2 Мэдээллийн бүтэц

```javascript
// Firestore: businesses/{bizId}/payrolls/{payrollId}
{
  id: "pay_2026_02",
  period: { year: 2026, month: 2 },
  status: "draft",                       // "draft" | "approved" | "paid"
  
  employees: [
    {
      employeeId: "user_dorj",
      employeeName: "Дорж",
      positionName: "Менежер",
      
      // ── ОЛГОЛТ ──
      earnings: {
        baseSalary: 1500000,
        allowances: [
          { name: "Унааны", amount: 100000, taxable: false },
          { name: "Хоолны", amount: 150000, taxable: false },
          { name: "Утасны", amount: 50000, taxable: false },
        ],
        overtime: {
          regularHours: 8.5,
          regularAmount: 163012,
          weekendHours: 4,
          weekendAmount: 102273,
          holidayHours: 0,
          holidayAmount: 0,
        },
        incentives: [
          { ruleId: "inc_sales_tiered", name: "Борлуулалтын шатлал", amount: 500000 },
        ],
        totalEarnings: 2565285,
      },
      
      // ── СУУТГАЛ ──
      deductions: {
        penalties: [
          { ruleId: "pen_late", name: "Хоцролт", amount: 5000 },
        ],
        tax: {
          taxableIncome: 2265285,
          socialInsurance: 249181,        // 11%
          healthInsurance: 45306,         // 2%
          incomeTax: 197080,              // ХХОАТ
        },
        otherDeductions: [],
        totalDeductions: 496567,
      },
      
      // ── ЦАГ ──
      attendance: {
        workDays: 18,
        totalDays: 22,
        totalHours: 148.5,
        overtimeHours: 12.5,
        lateDays: 2,
        lateMinutes: 35,
        absentDays: 2,
        leaveType: "annual_leave",
      },
      
      // ── ГҮЙЦЭТГЭЛ ──
      performance: {
        totalSales: 32500000,
        orderCount: 45,
        complaintsReceived: 2,
      },
      
      // ── ЭЦСИЙН ──
      netPay: 2068718,                   // Гарт олгох
      bankAccount: { bank: "khan", number: "5000123456" },
    },
    // ... бусад ажилтнууд
  ],
  
  // Нэгтгэл
  summary: {
    totalEmployees: 5,
    totalGrossPay: 8500000,
    totalDeductions: 1800000,
    totalNetPay: 6700000,
    totalEmployerTax: 1062500,           // Ажил олгогчийн НД (12.5%)
  },
  
  approvedBy: null,
  approvedAt: null,
  paidAt: null,
  createdAt: Timestamp,
}
```

---

## 5. 📊 ЭЗНИЙ ЦАЛИНГИЙН DASHBOARD

```
┌──────────────────────────────────────────┐
│  💰 Цалин > 2026 оны 2-р сар            │
│  Статус: 📝 Ноорог                       │
│                                          │
│  ┌────────┐┌────────┐┌────────┐┌────────┐│
│  │ 👥 5   ││ 💰     ││ 📊     ││ 🏦     ││
│  │Ажилтан ││₮8.5M   ││₮1.8M   ││₮6.7M   ││
│  │        ││Нийт    ││Суутгал ││Олгох   ││
│  └────────┘└────────┘└────────┘└────────┘│
│                                          │
│  ── Ажилтан бүрийн тойм ─────────────  │
│                                          │
│  │ Ажилтан    │ Үндсэн  │ Ур.шуул │ Олгох    │
│  │────────────│─────────│─────────│──────────│
│  │ Бат (Эзэн) │₮2,500K │+₮700K  │₮2,650K  │
│  │ Дорж (Мен.) │₮1,500K │+₮500K  │₮2,069K  │
│  │ Сараа (Нрв) │₮1,200K │+₮100K  │₮1,120K  │
│  │ Оюуна (Хүр) │₮800K  │+₮90K   │₮760K    │
│  │ Баатар (Хүр)│₮800K  │+₮120K  │₮795K    │
│  │─────────────│─────────│─────────│──────────│
│  │  НИЙТ       │₮6,800K │+₮1,510K│₮6,700K  │
│                                          │
│  [✅ Батлах]  [📥 Excel]  [🖨️ Хэвлэх]  │
└──────────────────────────────────────────┘
```

---

## 6. 🔄 БҮРЭН ДИНАМИК ТООЦОО

### Юу өөрчлөгдөхөд юу автомат дахин тооцоологдох:

```
Цагийн бүртгэл өөрчлөгдөхөд:
├── → Ажилласан цаг дахин тооцоологдоно
├── → Илүү цагийн мөнгө дахин тооцоологдоно
├── → Ирцийн хувь дахин тооцоологдоно
├── → Хоцролтын хасалт дахин тооцоологдоно
├── → Ирцийн урамшуулал дахин шалгагдана
└── → Цалин дахин тооцоологдоно

Захиалга/борлуулалт өөрчлөгдөхөд:
├── → Борлуулалтын урамшуулал дахин шалгагдана
├── → Захиалгын тооны урамшуулал дахин шалгагдана
└── → Цалин дахин тооцоологдоно

Урамшууллын дүрэм өөрчлөгдөхөд:
├── → Бүх ажилтны урамшуулал дахин тооцоологдоно
└── → Цалин дахин тооцоологдоно

Татварын хувь өөрчлөгдөхөд:
├── → Бүх ажилтны татвар дахин тооцоологдоно
└── → Цалин дахин тооцоологдоно

Ажилтны үндсэн цалин өөрчлөгдөхөд:
├── → Цагийн дүн дахин тооцоологдоно
├── → Илүү цагийн дүн дахин тооцоологдоно
└── → Цалин бүхэлдээ дахин тооцоологдоно
```

---

## 7. 🔑 ЭРХҮҮД & FEATURE TOGGLE

### Эрхүүд

| ID | Нэр | Тайлбар |
|----|-----|---------|
| `hr.view_own_time` | Өөрийн цаг | Өөрийн бүртгэл |
| `hr.view_all_time` | Бүх ажилтны цаг | Менежер+ |
| `hr.manage_time` | Цаг засах | Гараар засах |
| `hr.view_own_payslip` | Өөрийн цалин | Өөрийн хуудас |
| `hr.view_all_payroll` | Бүх цалин | Эзэн/менежер |
| `hr.manage_payroll` | Цалин удирдах | Тохируулах, батлах |
| `hr.manage_incentives` | Урамшуулал | Дүрэм тохируулах |
| `hr.approve_leave` | Чөлөө зөвшөөрөх | Менежер+ |
| `hr.approve_overtime` | Илүү цаг зөвшөөрөх | Менежер+ |

### Feature Toggle

```javascript
features: {
  timeTracking:      true,     // Цаг бүртгэл
  payroll:           true,     // Цалингийн тооцоо
  incentives:        true,     // Урамшуулал/шийтгэл
  leaveManagement:   true,     // Чөлөө удирдлага
  overtimeTracking:  true,     // Илүү цаг
  gpsClockIn:        false,    // GPS-ээр ирц
  autoClockIn:       false,    // Нэвтрэхэд автомат
  payslipExport:     true,     // PDF экспорт
}
```

---

*Энэ модуль цаг → гүйцэтгэл → цалин → татвар бүгдийг нэг дор, динамикаар удирдана.*
