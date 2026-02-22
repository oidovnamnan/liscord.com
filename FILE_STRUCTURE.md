# 📁 LISCORD — Файлын Бүтэц (File Structure)

> **Зарчим:** Нэг файл = Нэг үүрэг. Файл бүр жижиг, ойлгомжтой, бие даасан.
> Ямар ч файл 200 мөрөөс хэтрэхгүй байхыг зорино. Том компонент бол
> жижиг дэд компонентуудад задарна.

---

## Бүтцийн дүрэм

1. **Нэг файл ≤ 150-200 мөр** — Хэтэрвэл задлах
2. **Нэг компонент = 1 хавтас** — `ComponentName/index.tsx` + `ComponentName.module.css`
3. **Feature-based бүтэц** — Хуудас бүрт дэд компонентууд нь дотроо байна
4. **Shared = дахин ашиглагдах** — 2+ газар ашиглагдах бол `shared/` руу
5. **Index файл = re-export** — Импорт товчлох

---

```
src/
├── main.tsx                          # Entry point (10 мөр)
├── App.tsx                           # Router + AuthProvider (40 мөр)
├── firebase.ts                       # Firebase config + init (30 мөр)
├── vite-env.d.ts                     # Vite types
│
│
│── 🎨 styles/                        # ═══ ГЛОБАЛ СТИЛҮҮД ═══
│   ├── index.css                     # CSS Reset + Variables (100 мөр)
│   ├── typography.css                # Font import + text styles (50 мөр)
│   ├── animations.css                # Keyframe animations (60 мөр)
│   └── utilities.css                 # Helper classes (.flex, .gap, .truncate) (80 мөр)
│
│
│── 📝 types/                         # ═══ TYPESCRIPT TYPES ═══
│   ├── index.ts                      # Re-export бүгд
│   ├── auth.ts                       # User, AuthState (30 мөр)
│   ├── business.ts                   # Business, BusinessCategory, Subscription (50 мөр)
│   ├── position.ts                   # Position, Permission (40 мөр)
│   ├── employee.ts                   # Employee, Invitation (40 мөр)
│   ├── order.ts                      # Order, OrderItem, OrderStatus (60 мөр)
│   ├── customer.ts                   # Customer (40 мөр)
│   ├── product.ts                    # Product, Category, Variant (50 мөр)
│   ├── payment.ts                    # Transaction, PaymentAccount, PaymentMethod (60 мөр)
│   ├── notification.ts               # Notification (30 мөр)
│   └── common.ts                     # Timestamp, Pagination, FilterParams (30 мөр)
│
│
│── 🔧 utils/                         # ═══ ТУСЛАХ ФУНКЦУУД ═══
│   ├── index.ts                      # Re-export
│   ├── formatters/
│   │   ├── currency.ts               # formatMoney("₮1,500,000"), parseMoney (30 мөр)
│   │   ├── date.ts                   # formatDate, formatTime, timeAgo (40 мөр)
│   │   ├── phone.ts                  # formatPhone("+976 9900 1234") (20 мөр)
│   │   └── number.ts                 # formatNumber, roundToThousand (20 мөр)
│   ├── validators/
│   │   ├── phone.ts                  # isValidPhone (15 мөр)
│   │   ├── email.ts                  # isValidEmail (10 мөр)
│   │   ├── password.ts               # isStrongPassword (15 мөр)
│   │   └── order.ts                  # validateOrder fields (30 мөр)
│   ├── helpers/
│   │   ├── permissions.ts            # hasPermission, canDo helper (40 мөр)
│   │   ├── orderNumber.ts            # generateOrderNumber (20 мөр)
│   │   ├── search.ts                 # fuzzySearch, filterByQuery (30 мөр)
│   │   ├── debounce.ts               # debounce, throttle (15 мөр)
│   │   └── storage.ts                # localStorage helpers (20 мөр)
│   └── constants/
│       ├── permissions.ts            # PERMISSIONS object + бүх эрхүүд (80 мөр)
│       ├── statuses.ts               # DEFAULT_STATUSES ангилал бүрээр (60 мөр)
│       ├── categories.ts             # BUSINESS_CATEGORIES жагсаалт (50 мөр)
│       ├── paymentMethods.ts         # PAYMENT_METHODS жагсаалт (40 мөр)
│       ├── banks.ts                  # BANKS жагсаалт (30 мөр)
│       └── defaultPositions.ts       # Ангилал бүрийн default positions (80 мөр)
│
│
│── 🔗 services/                      # ═══ FIREBASE CRUD ═══
│   ├── index.ts                      # Re-export
│   ├── auth/
│   │   ├── authService.ts            # login, register, logout, resetPassword (60 мөр)
│   │   └── otpService.ts             # sendOTP, verifyOTP (30 мөр)
│   ├── business/
│   │   ├── businessService.ts        # CRUD (create, get, update, delete) (50 мөр)
│   │   ├── businessSettingsService.ts # updateSettings (30 мөр)
│   │   └── subscriptionService.ts    # checkLimits, upgradePlan (40 мөр)
│   ├── team/
│   │   ├── positionService.ts        # CRUD positions (50 мөр)
│   │   ├── employeeService.ts        # CRUD employees (50 мөр)
│   │   └── invitationService.ts      # invite, accept, cancel (40 мөр)
│   ├── order/
│   │   ├── orderService.ts           # create, update, delete (60 мөр)
│   │   ├── orderQueryService.ts      # list, search, filter, paginate (50 мөр)
│   │   ├── orderStatusService.ts     # changeStatus, getStatusHistory (30 мөр)
│   │   └── orderExportService.ts     # exportCSV, exportExcel (40 мөр)
│   ├── customer/
│   │   ├── customerService.ts        # CRUD (50 мөр)
│   │   └── customerQueryService.ts   # search, filter, stats (40 мөр)
│   ├── product/
│   │   ├── productService.ts         # CRUD (50 мөр)
│   │   ├── categoryService.ts        # CRUD categories (30 мөр)
│   │   └── stockService.ts           # adjustStock, checkLowStock (30 мөр)
│   ├── payment/
│   │   ├── transactionService.ts     # recordPayment, recordRefund (60 мөр)
│   │   ├── paymentAccountService.ts  # CRUD accounts (40 мөр)
│   │   ├── refundService.ts          # processRefund (50 мөр)
│   │   └── debtService.ts            # getDebts, getCredits (40 мөр)
│   ├── notification/
│   │   ├── notificationService.ts    # create, markRead, getUnread (40 мөр)
│   │   └── pushService.ts            # FCM token, sendPush (30 мөр)
│   ├── report/
│   │   ├── salesReportService.ts     # getSalesReport (40 мөр)
│   │   ├── revenueReportService.ts   # getRevenueReport (40 мөр)
│   │   ├── accountReportService.ts   # getAccountMovements (40 мөр)
│   │   └── debtReportService.ts      # getAgingReport (30 мөр)
│   └── upload/
│       └── uploadService.ts          # uploadImage, deleteImage (30 мөр)
│
│
│── 🪝 hooks/                         # ═══ CUSTOM HOOKS ═══
│   ├── index.ts
│   ├── useAuth.ts                    # currentUser, login, logout (40 мөр)
│   ├── useBusiness.ts                # activeBusiness, switchBusiness (30 мөр)
│   ├── usePermission.ts             # hasPermission(perm) → boolean (25 мөр)
│   ├── useOrders.ts                  # orders list, real-time listener (40 мөр)
│   ├── useOrder.ts                   # single order detail (30 мөр)
│   ├── useCustomers.ts               # customers list (30 мөр)
│   ├── useProducts.ts                # products list (30 мөр)
│   ├── useEmployees.ts               # employees list (30 мөр)
│   ├── usePositions.ts               # positions list (25 мөр)
│   ├── usePaymentAccounts.ts         # accounts list (25 мөр)
│   ├── useTransactions.ts            # transactions list, filter (30 мөр)
│   ├── useNotifications.ts           # unread count, list (30 мөр)
│   ├── useDashboard.ts               # KPI stats (40 мөр)
│   ├── useDebounce.ts                # debounced value (15 мөр)
│   ├── useMediaQuery.ts              # isMobile, isDesktop (15 мөр)
│   └── useToast.ts                   # toast notifications (20 мөр)
│
│
│── 🗃️ store/                         # ═══ ZUSTAND STORES ═══
│   ├── authStore.ts                  # user, isAuthenticated (30 мөр)
│   ├── businessStore.ts              # activeBusiness, businesses (30 мөр)
│   ├── uiStore.ts                    # sidebar, modal, theme (25 мөр)
│   └── filterStore.ts                # order/customer/product filters (30 мөр)
│
│
│── 🧩 components/                    # ═══ ДАХИН АШИГЛАХ КОМПОНЕНТУУД ═══
│   │
│   ├── 🎨 ui/                        # --- Суурь UI компонентууд ---
│   │   ├── Button/
│   │   │   ├── index.tsx             # Button component (40 мөр)
│   │   │   └── Button.module.css     # Стиль (60 мөр)
│   │   ├── Input/
│   │   │   ├── index.tsx             # Text input (40 мөр)
│   │   │   └── Input.module.css
│   │   ├── Select/
│   │   │   ├── index.tsx             # Dropdown select (50 мөр)
│   │   │   └── Select.module.css
│   │   ├── Textarea/
│   │   │   ├── index.tsx
│   │   │   └── Textarea.module.css
│   │   ├── Checkbox/
│   │   │   ├── index.tsx
│   │   │   └── Checkbox.module.css
│   │   ├── Toggle/
│   │   │   ├── index.tsx             # On/Off toggle switch (30 мөр)
│   │   │   └── Toggle.module.css
│   │   ├── Modal/
│   │   │   ├── index.tsx             # Modal wrapper (50 мөр)
│   │   │   └── Modal.module.css
│   │   ├── Drawer/
│   │   │   ├── index.tsx             # Side drawer (мобайл) (50 мөр)
│   │   │   └── Drawer.module.css
│   │   ├── Badge/
│   │   │   ├── index.tsx             # Status badge, count badge (30 мөр)
│   │   │   └── Badge.module.css
│   │   ├── Avatar/
│   │   │   ├── index.tsx             # User avatar (25 мөр)
│   │   │   └── Avatar.module.css
│   │   ├── Card/
│   │   │   ├── index.tsx             # Card container (25 мөр)
│   │   │   └── Card.module.css
│   │   ├── Tabs/
│   │   │   ├── index.tsx             # Tab navigation (40 мөр)
│   │   │   └── Tabs.module.css
│   │   ├── SearchInput/
│   │   │   ├── index.tsx             # Search with debounce (35 мөр)
│   │   │   └── SearchInput.module.css
│   │   ├── EmptyState/
│   │   │   ├── index.tsx             # "Мэдээлэл байхгүй" (25 мөр)
│   │   │   └── EmptyState.module.css
│   │   ├── LoadingSpinner/
│   │   │   ├── index.tsx             # Loading indicator (15 мөр)
│   │   │   └── LoadingSpinner.module.css
│   │   ├── Toast/
│   │   │   ├── index.tsx             # Toast notification (35 мөр)
│   │   │   └── Toast.module.css
│   │   ├── ConfirmDialog/
│   │   │   ├── index.tsx             # "Итгэлтэй байна уу?" (35 мөр)
│   │   │   └── ConfirmDialog.module.css
│   │   ├── PinModal/
│   │   │   ├── index.tsx             # PIN оруулах modal (50 мөр)
│   │   │   └── PinModal.module.css
│   │   ├── ImageUpload/
│   │   │   ├── index.tsx             # Зураг upload + preview (50 мөр)
│   │   │   └── ImageUpload.module.css
│   │   ├── FileUpload/
│   │   │   ├── index.tsx             # Файл upload (40 мөр)
│   │   │   └── FileUpload.module.css
│   │   ├── Pagination/
│   │   │   ├── index.tsx             # Хуудаслалт (30 мөр)
│   │   │   └── Pagination.module.css
│   │   ├── DatePicker/
│   │   │   ├── index.tsx             # Огноо сонгогч (50 мөр)
│   │   │   └── DatePicker.module.css
│   │   ├── DateRangePicker/
│   │   │   ├── index.tsx             # Огнооны хүрээ (50 мөр)
│   │   │   └── DateRangePicker.module.css
│   │   ├── MoneyInput/
│   │   │   ├── index.tsx             # Мөнгөн дүн оруулах + формат (40 мөр)
│   │   │   └── MoneyInput.module.css
│   │   ├── PhoneInput/
│   │   │   ├── index.tsx             # Утасны дугаар +976 формат (35 мөр)
│   │   │   └── PhoneInput.module.css
│   │   └── index.ts                  # UI бүгдийг re-export
│   │
│   ├── 🏗️ layout/                    # --- Layout компонентууд ---
│   │   ├── AppLayout/
│   │   │   ├── index.tsx             # Sidebar + content wrapper (40 мөр)
│   │   │   └── AppLayout.module.css
│   │   ├── Sidebar/
│   │   │   ├── index.tsx             # Desktop sidebar nav (50 мөр)
│   │   │   ├── SidebarItem.tsx       # Нэг menu item (20 мөр)
│   │   │   └── Sidebar.module.css
│   │   ├── BottomNav/
│   │   │   ├── index.tsx             # Mobile bottom navigation (40 мөр)
│   │   │   └── BottomNav.module.css
│   │   ├── Header/
│   │   │   ├── index.tsx             # Top header (40 мөр)
│   │   │   ├── BusinessSwitcher.tsx  # Бизнес солигч dropdown (40 мөр)
│   │   │   ├── NotificationBell.tsx  # Мэдэгдлийн хонх (30 мөр)
│   │   │   ├── UserMenu.tsx          # Профайл dropdown (30 мөр)
│   │   │   └── Header.module.css
│   │   └── PublicLayout/
│   │       ├── index.tsx             # Landing page layout (25 мөр)
│   │       └── PublicLayout.module.css
│   │
│   └── 🔀 shared/                    # --- Shared business компонентууд ---
│       ├── StatusBadge/
│       │   ├── index.tsx             # Өнгөтэй статус badge (25 мөр)
│       │   └── StatusBadge.module.css
│       ├── PaymentStatusBadge/
│       │   ├── index.tsx             # Төлбөрийн статус badge (25 мөр)
│       │   └── PaymentStatusBadge.module.css
│       ├── CustomerPicker/
│       │   ├── index.tsx             # Харилцагч хайх + сонгох (50 мөр)
│       │   ├── CustomerPickerItem.tsx # Нэг харилцагчийн мөр (20 мөр)
│       │   ├── NewCustomerForm.tsx   # Шинэ харилцагч шууд нэмэх (40 мөр)
│       │   └── CustomerPicker.module.css
│       ├── ProductPicker/
│       │   ├── index.tsx             # Бараа хайх + сонгох (50 мөр)
│       │   ├── ProductPickerItem.tsx # Нэг бараа (20 мөр)
│       │   └── ProductPicker.module.css
│       ├── OrderCard/
│       │   ├── index.tsx             # Захиалгын карт (жагсаалтанд) (40 мөр)
│       │   └── OrderCard.module.css
│       ├── CustomerCard/
│       │   ├── index.tsx             # Харилцагчийн карт (30 мөр)
│       │   └── CustomerCard.module.css
│       ├── ProductCard/
│       │   ├── index.tsx             # Барааны карт (30 мөр)
│       │   └── ProductCard.module.css
│       ├── PaymentRecordModal/
│       │   ├── index.tsx             # Төлбөр бүртгэх modal (60 мөр)
│       │   ├── AccountSelector.tsx   # Данс сонгогч (30 мөр)
│       │   ├── MethodSelector.tsx    # Төлбөрийн арга сонгогч (30 мөр)
│       │   ├── SplitPayment.tsx      # Хуваан төлөх (50 мөр)
│       │   └── PaymentRecordModal.module.css
│       ├── RefundModal/
│       │   ├── index.tsx             # Буцаалт хийх modal (50 мөр)
│       │   ├── RefundItemSelector.tsx # Бараа сонгох (буцаалт) (30 мөр)
│       │   └── RefundModal.module.css
│       ├── TransactionList/
│       │   ├── index.tsx             # Гүйлгээний жагсаалт (35 мөр)
│       │   ├── TransactionItem.tsx   # Нэг гүйлгээ (25 мөр)
│       │   └── TransactionList.module.css
│       ├── PermissionGate/
│       │   └── index.tsx             # Эрхгүй бол нуух wrapper (15 мөр)
│       ├── CategoryFields/
│       │   ├── index.tsx             # Ангилалын тусгай талбарууд renderer (40 мөр)
│       │   ├── CargoFields.tsx       # Карго тусгай талбарууд (40 мөр)
│       │   ├── WholesaleFields.tsx   # Бөөний тусгай талбарууд (35 мөр)
│       │   ├── OnlineShopFields.tsx  # Онлайн тусгай талбарууд (35 мөр)
│       │   ├── FoodFields.tsx        # Хоол тусгай талбарууд (35 мөр)
│       │   ├── RepairFields.tsx      # Засвар тусгай талбарууд (35 мөр)
│       │   ├── PrintFields.tsx       # Хэвлэл тусгай талбарууд (30 мөр)
│       │   ├── FurnitureFields.tsx   # Тавилга тусгай талбарууд (30 мөр)
│       │   ├── FlowerFields.tsx      # Цэцэг тусгай талбарууд (30 мөр)
│       │   ├── PharmacyFields.tsx    # Эм тусгай талбарууд (25 мөр)
│       │   ├── AutoPartsFields.tsx   # Авто тусгай талбарууд (25 мөр)
│       │   └── CategoryFields.module.css
│       ├── CustomFields/
│       │   ├── index.tsx             # Custom fields renderer (40 мөр)
│       │   ├── CustomFieldInput.tsx  # Нэг custom field (30 мөр)
│       │   └── CustomFields.module.css
│       └── KPICard/
│           ├── index.tsx             # Dashboard KPI карт (25 мөр)
│           └── KPICard.module.css
│
│
│── 📄 pages/                         # ═══ ХУУДАСНУУД ═══
│   │
│   ├── 🌐 Landing/                   # --- liscord.com нүүр хуудас ---
│   │   ├── index.tsx                 # Landing page (30 мөр)
│   │   ├── HeroSection.tsx           # Hero banner (40 мөр)
│   │   ├── FeaturesSection.tsx       # Функцуудын танилцуулга (50 мөр)
│   │   ├── CategoriesSection.tsx     # Бизнесийн ангилалууд (40 мөр)
│   │   ├── ComparisonSection.tsx     # Google Sheets vs Liscord (40 мөр)
│   │   ├── PricingSection.tsx        # Үнийн багцууд (50 мөр)
│   │   ├── FAQSection.tsx            # Түгээмэл асуултууд (40 мөр)
│   │   ├── FooterSection.tsx         # Footer (30 мөр)
│   │   └── Landing.module.css
│   │
│   ├── 🔐 Auth/                      # --- Нэвтрэлт ---
│   │   ├── Login/
│   │   │   ├── index.tsx             # Login page (40 мөр)
│   │   │   ├── LoginForm.tsx         # Login form (50 мөр)
│   │   │   └── Login.module.css
│   │   ├── Register/
│   │   │   ├── index.tsx             # Register page (30 мөр)
│   │   │   ├── Step1PersonalInfo.tsx # Алхам 1: Хувийн мэдээлэл (50 мөр)
│   │   │   ├── Step2OTP.tsx          # Алхам 2: OTP баталгаажуулалт (40 мөр)
│   │   │   ├── Step3CreateBusiness.tsx # Алхам 3: Бизнес үүсгэх (50 мөр)
│   │   │   └── Register.module.css
│   │   ├── ForgotPassword/
│   │   │   ├── index.tsx             # Нууц үг сэргээх (40 мөр)
│   │   │   └── ForgotPassword.module.css
│   │   └── AcceptInvite/
│   │       ├── index.tsx             # Урилга хүлээн авах (40 мөр)
│   │       └── AcceptInvite.module.css
│   │
│   ├── 📊 Dashboard/                 # --- Хяналтын самбар ---
│   │   ├── index.tsx                 # Dashboard page (40 мөр)
│   │   ├── KPICards.tsx              # 4 KPI карт (35 мөр)
│   │   ├── OrderChart.tsx            # Захиалгын график (40 мөр)
│   │   ├── StatusSummary.tsx         # Статусын тойм (30 мөр)
│   │   ├── RecentOrders.tsx          # Сүүлийн захиалгууд (30 мөр)
│   │   ├── TopProducts.tsx           # Топ бараа (25 мөр)
│   │   ├── TopCustomers.tsx          # Топ харилцагч (25 мөр)
│   │   ├── LowStockAlert.tsx         # Нөөц бага анхааруулга (25 мөр)
│   │   ├── DebtSummary.tsx           # Авлагын тойм (бөөний) (30 мөр)
│   │   └── Dashboard.module.css
│   │
│   ├── 📋 Orders/                    # --- Захиалга ---
│   │   ├── OrderList/
│   │   │   ├── index.tsx             # Жагсаалт page (40 мөр)
│   │   │   ├── OrderListHeader.tsx   # Хайлт + шүүлтүүр (35 мөр)
│   │   │   ├── OrderStatusTabs.tsx   # Статусаар tab (25 мөр)
│   │   │   ├── OrderFilters.tsx      # Нэмэлт шүүлтүүр (огноо, төлбөр) (40 мөр)
│   │   │   ├── OrderListItems.tsx    # Жагсаалтын items (30 мөр)
│   │   │   ├── BulkActions.tsx       # Олноор сонгох + үйлдэл (35 мөр)
│   │   │   └── OrderList.module.css
│   │   ├── OrderCreate/
│   │   │   ├── index.tsx             # Шинэ захиалга page (40 мөр)
│   │   │   ├── CustomerSection.tsx   # Харилцагч сонгох хэсэг (35 мөр)
│   │   │   ├── ItemsSection.tsx      # Бараа нэмэх хэсэг (40 мөр)
│   │   │   ├── OrderItemRow.tsx      # Нэг бараа мөр (30 мөр)
│   │   │   ├── PriceSummary.tsx      # Тооцоо нэгтгэл (30 мөр)
│   │   │   ├── DeliverySection.tsx   # Хүргэлтийн мэдээлэл (30 мөр)
│   │   │   ├── NotesSection.tsx      # Тэмдэглэл (15 мөр)
│   │   │   └── OrderCreate.module.css
│   │   └── OrderDetail/
│   │       ├── index.tsx             # Дэлгэрэнгүй page (40 мөр)
│   │       ├── OrderHeader.tsx       # Дугаар + статус + үйлдлүүд (35 мөр)
│   │       ├── OrderInfo.tsx         # Үндсэн мэдээлэл (30 мөр)
│   │       ├── OrderItems.tsx        # Барааны жагсаалт (30 мөр)
│   │       ├── OrderPayments.tsx     # Төлбөрийн мэдээлэл + гүйлгээ (40 мөр)
│   │       ├── OrderTimeline.tsx     # Статусын түүх timeline (30 мөр)
│   │       ├── OrderNotes.tsx        # Тэмдэглэлүүд (25 мөр)
│   │       ├── OrderActions.tsx      # Статус солих + устгах + хэвлэх (35 мөр)
│   │       └── OrderDetail.module.css
│   │
│   ├── 👥 Customers/                 # --- Харилцагч ---
│   │   ├── CustomerList/
│   │   │   ├── index.tsx             # Жагсаалт (35 мөр)
│   │   │   ├── CustomerListHeader.tsx
│   │   │   ├── CustomerListItems.tsx
│   │   │   └── CustomerList.module.css
│   │   ├── CustomerCreate/
│   │   │   ├── index.tsx             # Шинэ харилцагч (40 мөр)
│   │   │   └── CustomerCreate.module.css
│   │   └── CustomerDetail/
│   │       ├── index.tsx             # Дэлгэрэнгүй (35 мөр)
│   │       ├── CustomerInfo.tsx      # Мэдээлэл (30 мөр)
│   │       ├── CustomerOrders.tsx    # Захиалгын түүх (30 мөр)
│   │       ├── CustomerFinancials.tsx # Тооцоо, авлага (35 мөр)
│   │       └── CustomerDetail.module.css
│   │
│   ├── 🛍️ Products/                  # --- Бараа ---
│   │   ├── ProductList/
│   │   │   ├── index.tsx
│   │   │   ├── ProductListHeader.tsx
│   │   │   ├── ProductGrid.tsx       # Grid view (30 мөр)
│   │   │   ├── CategoryFilter.tsx    # Ангилалаар шүүх (25 мөр)
│   │   │   └── ProductList.module.css
│   │   ├── ProductCreate/
│   │   │   ├── index.tsx
│   │   │   ├── ProductForm.tsx       # Нэр, үнэ, ангилал (50 мөр)
│   │   │   ├── ProductImages.tsx     # Зураг upload (35 мөр)
│   │   │   ├── ProductVariants.tsx   # Хувилбарууд (онлайн) (40 мөр)
│   │   │   ├── ProductPricing.tsx    # Үнэ, өртөг, шатлал (40 мөр)
│   │   │   └── ProductCreate.module.css
│   │   └── Categories/
│   │       ├── index.tsx             # Ангилал удирдах (30 мөр)
│   │       ├── CategoryItem.tsx      # Нэг ангилал (25 мөр)
│   │       └── Categories.module.css
│   │
│   ├── ⚙️ Settings/                  # --- Тохиргоо ---
│   │   ├── index.tsx                 # Settings layout + nav (30 мөр)
│   │   ├── BusinessProfile/
│   │   │   ├── index.tsx             # Бизнес мэдээлэл засах (40 мөр)
│   │   │   └── BusinessProfile.module.css
│   │   ├── OrderSettings/
│   │   │   ├── index.tsx             # Захиалгын тохиргоо (40 мөр)
│   │   │   ├── StatusManager.tsx     # Статус нэмэх/засах/drag (50 мөр)
│   │   │   ├── PinSettings.tsx       # PIN тохируулах (30 мөр)
│   │   │   └── OrderSettings.module.css
│   │   ├── Positions/
│   │   │   ├── index.tsx             # Тушаалын жагсаалт (35 мөр)
│   │   │   ├── PositionForm.tsx      # Тушаал нэмэх/засах (40 мөр)
│   │   │   ├── PermissionGrid.tsx    # Эрхийн checkbox grid (50 мөр)
│   │   │   ├── PermissionGroup.tsx   # Нэг бүлэг эрхүүд (30 мөр)
│   │   │   └── Positions.module.css
│   │   ├── Team/
│   │   │   ├── index.tsx             # Ажилтнуудын жагсаалт (35 мөр)
│   │   │   ├── InviteModal.tsx       # Ажилтан урих modal (40 мөр)
│   │   │   ├── EmployeeCard.tsx      # Нэг ажилтан (25 мөр)
│   │   │   └── Team.module.css
│   │   ├── PaymentAccounts/
│   │   │   ├── index.tsx             # Данс жагсаалт (35 мөр)
│   │   │   ├── AccountForm.tsx       # Данс нэмэх/засах modal (50 мөр)
│   │   │   ├── AccountCard.tsx       # Нэг данс (25 мөр)
│   │   │   └── PaymentAccounts.module.css
│   │   ├── CustomFields/
│   │   │   ├── index.tsx             # Custom field удирдах (35 мөр)
│   │   │   ├── FieldForm.tsx         # Талбар нэмэх modal (40 мөр)
│   │   │   └── CustomFields.module.css
│   │   ├── CurrencySettings/
│   │   │   ├── index.tsx             # Валют, ханш тохируулах (35 мөр)
│   │   │   └── CurrencySettings.module.css
│   │   ├── Notifications/
│   │   │   ├── index.tsx             # Мэдэгдэл тохиргоо (30 мөр)
│   │   │   └── Notifications.module.css
│   │   └── Billing/
│   │       ├── index.tsx             # Багц, төлбөр (40 мөр)
│   │       ├── PlanCard.tsx          # Нэг багц (25 мөр)
│   │       └── Billing.module.css
│   │
│   ├── 📊 Reports/                   # --- Тайлан ---
│   │   ├── index.tsx                 # Reports nav (25 мөр)
│   │   ├── SalesReport/
│   │   │   ├── index.tsx             # Борлуулалтын тайлан (40 мөр)
│   │   │   └── SalesReport.module.css
│   │   ├── RevenueReport/
│   │   │   ├── index.tsx             # Орлогын тайлан (40 мөр)
│   │   │   └── RevenueReport.module.css
│   │   ├── AccountReport/
│   │   │   ├── index.tsx             # Дансны хөдөлгөөн (40 мөр)
│   │   │   └── AccountReport.module.css
│   │   └── DebtReport/
│   │       ├── index.tsx             # Авлагын тайлан (40 мөр)
│   │       ├── AgingChart.tsx        # Насжилтын график (30 мөр)
│   │       └── DebtReport.module.css
│   │
│   ├── 🔔 Notifications/             # --- Мэдэгдэл ---
│   │   ├── index.tsx                 # Мэдэгдлийн жагсаалт (35 мөр)
│   │   ├── NotificationItem.tsx      # Нэг мэдэгдэл (25 мөр)
│   │   └── Notifications.module.css
│   │
│   ├── 👤 Profile/                   # --- Профайл ---
│   │   ├── index.tsx                 # Хувийн мэдээлэл засах (40 мөр)
│   │   └── Profile.module.css
│   │
│   └── 🌐 PublicTracking/            # --- Нийтийн tracking ---
│       ├── index.tsx                 # Tracking хуудас (30 мөр)
│       ├── TrackingResult.tsx        # Хайлтын үр дүн (30 мөр)
│       └── PublicTracking.module.css
│
│
│── 🧭 router/                        # ═══ ROUTING ═══
│   ├── index.tsx                     # Route definitions (50 мөр)
│   ├── ProtectedRoute.tsx            # Auth шалгах wrapper (20 мөр)
│   ├── PermissionRoute.tsx           # Эрх шалгах wrapper (20 мөр)
│   └── routes.ts                     # Route paths constants (30 мөр)
│
│
└── 📦 assets/                        # ═══ STATIC ASSETS ═══
    ├── images/
    │   ├── logo.svg                  # Liscord лого
    │   ├── logo-icon.svg             # Лого icon
    │   └── empty-state.svg           # Empty state зураг
    ├── icons/
    │   └── (SVG icons шаардлагатай бол)
    └── fonts/
        └── (local fonts шаардлагатай бол)
```

---

## 📊 ТООН НЭГТГЭЛ

| Хэсэг | Хавтас | Файл тоо | Дундаж мөр |
|--------|--------|----------|-----------|
| Types | `types/` | 11 | ~40 |
| Utils | `utils/` | 15 | ~30 |
| Services | `services/` | 20 | ~40 |
| Hooks | `hooks/` | 17 | ~30 |
| Stores | `store/` | 4 | ~30 |
| UI Components | `components/ui/` | 22 comp × 2 файл | ~35 |
| Layout | `components/layout/` | 5 comp, ~10 файл | ~35 |
| Shared | `components/shared/` | 14 comp, ~30 файл | ~30 |
| Pages | `pages/` | 12 section, ~80 файл | ~35 |
| Router | `router/` | 4 | ~30 |
| Styles | `styles/` | 4 | ~70 |
| **НИЙТ** | | **~250 файл** | **~35 мөр** |

---

## 🔑 ИМПОРТ ЖИШЭЭ

```typescript
// Цэвэрхэн import — index.ts re-export ашигласан
import { Button, Input, Modal, Badge } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { OrderCard, StatusBadge, PaymentRecordModal } from '@/components/shared';
import { useAuth, useOrders, usePermission } from '@/hooks';
import { formatMoney, formatDate, timeAgo } from '@/utils';
import { hasPermission } from '@/utils/helpers/permissions';
import { orderService } from '@/services/order';
import type { Order, Customer, Product } from '@/types';
```

---

## ⚡ VITE PATH ALIAS

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
```

---

*Энэ бүтэц нь хөгжүүлэлтийн явцад шаардлагаар нэмэгдэж болно, гэхдээ 1 файл = 1 үүрэг зарчмыг баримтална.*
