# ☁️ LISCORD — CLOUD FUNCTIONS ЖАГСААЛТ

> Бүх серверийн логик, trigger, scheduled function-ий нэгтгэл.

---

## 1. FIRESTORE TRIGGERS

### 1.1 Захиалга (Orders)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 1 | `onOrderCreate` | orders.onCreate | Захиалгын дугаар автомат, stats шинэчлэх, мэдэгдэл |
| 2 | `onOrderUpdate` | orders.onUpdate | Статус лог, нөөц +/-, харилцагч stats, мэдэгдэл |
| 3 | `onOrderDelete` | orders.onDelete | Stats хасах, soft delete лог |
| 4 | `onOrderStatusChange` | orders.onUpdate (status changed) | Мэдэгдэл, и-мэйл, tracking шинэчлэх |

### 1.2 Төлбөр (Transactions)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 5 | `onTransactionCreate` | transactions.onCreate | Захиалгын paymentStatus шинэчлэх, данс balance, мэдэгдэл |
| 6 | `onRefundCreate` | transactions.onCreate (type=refund) | Нөөц буцаах, данс balance хасах |

### 1.3 Нөөц (Products/Stock)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 7 | `onStockChange` | products.onUpdate (stock changed) | Low stock шалгах → мэдэгдэл |
| 8 | `onReceivingCreate` | receivings.onCreate | Stock нэмэх, PO шинэчлэх, movement log |
| 9 | `onAdjustmentCreate` | stockAdjustments.onCreate | Stock тохируулах, movement log |

### 1.4 Харилцагч (Customers)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 10 | `onCustomerOrderUpdate` | orders (customer-тэй) | totalOrders, totalSpent, lastOrderAt шинэчлэх |

### 1.5 Баг (Employees)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 11 | `onEmployeeCreate` | employees.onCreate | stats.totalEmployees++ |
| 12 | `onEmployeeStatusChange` | employees.onUpdate | stats.activeEmployees шинэчлэх |

### 1.6 Чат (Messages)
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 13 | `onChatMessage` | messages.onCreate | Push мэдэгдэл, @mention мэдэгдэл, unread count |

### 1.7 HR
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 14 | `onClockIn` | timeEntries.onCreate | Хоцролт шалгах, мэдэгдэл |
| 15 | `onLeaveRequest` | leaveRequests.onCreate | Мэдэгдэл → Manager |

### 1.8 Хүргэлт
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 16 | `onDeliveryStatusChange` | deliveries.onUpdate | Захиалгын статус sync, мэдэгдэл, COD бүртгэл |

### 1.9 Буцаалт/Гомдол
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 17 | `onTicketCreate` | tickets.onCreate | Мэдэгдэл, auto-assign, SLA тоолж эхлэх |

### 1.10 Мэдэгдэл
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 18 | `onNotificationCreate` | notifications.onCreate | FCM push, email, SMS илгээх |

### 1.11 Аудит
| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 19 | `onAuditLogCreate` | auditLogs.onCreate | Тампер хамгаалалт, anomaly detection |

---

## 2. HTTPS CALLABLE FUNCTIONS

| # | Function | Зорилго |
|---|----------|---------|
| 20 | `createBusiness` | Бизнес үүсгэх (default positions, toggles, settings автомат) |
| 21 | `inviteEmployee` | Ажилтан урих (линк/код үүсгэх, SMS/Push) |
| 22 | `sendNotificationEmail` | И-мэйл илгээх (rate limit, template шалгалт) |
| 23 | `sendSMS` | SMS илгээх (OTP, мэдэгдэл) |
| 24 | `generatePDF` | PDF үүсгэх (нэхэмжлэл, баримт, цалин хуудас) |
| 25 | `exportData` | Мэдээлэл экспортлох (CSV/Excel/JSON) |
| 26 | `importData` | Мэдээлэл импортлох (CSV → Firestore) |
| 27 | `deleteBusinessData` | Бизнесийн бүх мэдээлэл устгах (GDPR) |
| 28 | `calculatePayroll` | Цалин тооцоолох (HR модуль) |
| 29 | `verifyBusiness` | Бизнес баталгаажуулах (Level 2+) |
| 30 | `reportAbuse` | Abuse report илгээх |
| 31 | `switchBusiness` | Бизнес солих (activeBusiness шинэчлэх) |
| 32 | `acceptTerms` | Гэрээ зөвшөөрөх |

---

## 3. SCHEDULED (CRON) FUNCTIONS

| # | Function | Хуваарь | Зорилго |
|---|----------|---------|---------|
| 33 | `dailyReportGenerate` | 00:00 өдөр бүр | Өдрийн тайлан pre-compute |
| 34 | `checkOverduePayments` | 09:00 өдөр бүр | Хугацаа хэтэрсэн авлага → мэдэгдэл |
| 35 | `checkExpiryDates` | 08:00 өдөр бүр | Дуусах хугацаа шалгах → мэдэгдэл |
| 36 | `cleanupExpiredInvites` | 00:00 өдөр бүр | Хугацаа дууссан invite устгах |
| 37 | `cleanupOldNotifications` | 00:00 7 хоног | 30+ хоногийн мэдэгдэл устгах |
| 38 | `resetDailyRateLimits` | 00:00 өдөр бүр | И-мэйл rate limit тоолуур reset |
| 39 | `checkSubscriptionExpiry` | 09:00 өдөр бүр | Багцын хугацаа → анхааруулга |
| 40 | `monthlyPayrollCalculate` | Сарын 25 | Цалин автомат тооцоолох |
| 41 | `anomalyDetection` | 6 цаг тутам | Spam, fraud, хэвийн бус pattern |
| 42 | `clockInReminder` | 08:45 ажлын өдөр | Цаг бүртгэх сануулга |
| 43 | `inactiveBusinessCheck` | Сарын 1 | 6+ сар идэвхгүй → анхааруулга |

---

## 4. STORAGE TRIGGERS

| # | Function | Trigger | Зорилго |
|---|----------|---------|---------|
| 44 | `onImageUpload` | Storage.onFinalize | Зураг шахах, thumbnail үүсгэх, WebP |
| 45 | `onFileDelete` | Storage.onDelete | Reference цэвэрлэх |

---

**Нийт: 45 Cloud Function**
- Firestore triggers: 19
- HTTPS callable: 13
- Scheduled (CRON): 11
- Storage triggers: 2
