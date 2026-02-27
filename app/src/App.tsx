import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { userService, businessService } from './services/db';
import { useAuthStore, useBusinessStore } from './store';
import { Loader2 } from 'lucide-react';

// Layouts
const AppLayout = lazy(() => import('./components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const AppLayoutV2 = lazy(() => import('./components/layout/AppLayoutV2').then(m => ({ default: m.AppLayoutV2 })));
const SuperAdminLayout = lazy(() => import('./components/layout/SuperAdminLayout').then(m => ({ default: m.SuperAdminLayout })));

// Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/Landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage').then(m => ({ default: m.OrdersPage })));
const CustomersPage = lazy(() => import('./pages/Customers/CustomersPage').then(m => ({ default: m.CustomersPage })));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage').then(m => ({ default: m.ProductsPage })));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const EmployeesPage = lazy(() => import('./pages/Employees/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage').then(m => ({ default: m.ReportsPage })));
const PaymentsPage = lazy(() => import('./pages/Payments/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const DeliveryPage = lazy(() => import('./pages/Delivery/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const PackagesPage = lazy(() => import('./pages/Cargo/Packages/PackagesPage').then(m => ({ default: m.PackagesPage })));
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ContractsPage = lazy(() => import('./pages/Contracts/ContractsPage').then(m => ({ default: m.ContractsPage })));

// --- Advanced Modules ---
const AppointmentsPage = lazy(() => import('./pages/Appointments/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })));
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const RoomsPage = lazy(() => import('./pages/Rooms/RoomsPage').then(m => ({ default: m.RoomsPage })));
const VehiclesPage = lazy(() => import('./pages/Vehicles/VehiclesPage').then(m => ({ default: m.VehiclesPage })));
const TicketsPage = lazy(() => import('./pages/Tickets/TicketsPage').then(m => ({ default: m.TicketsPage })));
const LoansPage = lazy(() => import('./pages/Loans/LoansPage').then(m => ({ default: m.LoansPage })));
const QueuePage = lazy(() => import('./pages/Queue/QueuePage').then(m => ({ default: m.QueuePage })));
const AttendancePage = lazy(() => import('./pages/Attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const PayrollPage = lazy(() => import('./pages/Payroll/PayrollPage').then(m => ({ default: m.PayrollPage })));
const FinancePage = lazy(() => import('./pages/Finance/FinancePage').then(m => ({ default: m.FinancePage })));
const SupportPage = lazy(() => import('./pages/Support/SupportPage').then(m => ({ default: m.SupportPage })));
const B2BMarketplacePage = lazy(() => import('./pages/B2B/B2BMarketplacePage').then(m => ({ default: m.B2BMarketplacePage })));
const B2BProviderDashboard = lazy(() => import('./pages/B2B/B2BProviderDashboard').then(m => ({ default: m.B2BProviderDashboard })));
const ChatPage = lazy(() => import('./pages/Chat/ChatPage').then(m => ({ default: m.ChatPage })));
const ManufacturingPage = lazy(() => import('./pages/Manufacturing/ManufacturingPage').then(m => ({ default: m.ManufacturingPage })));
const AIAgentPage = lazy(() => import('./pages/AIAgent/AIAgentPage').then(m => ({ default: m.AIAgentPage })));

// Super Admin
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminBusinesses = lazy(() => import('./pages/SuperAdmin/SuperAdminBusinesses').then(m => ({ default: m.SuperAdminBusinesses })));
const SuperAdminUsers = lazy(() => import('./pages/SuperAdmin/SuperAdminUsers').then(m => ({ default: m.SuperAdminUsers })));
const SuperAdminSettings = lazy(() => import('./pages/SuperAdmin/SuperAdminSettings').then(m => ({ default: m.SuperAdminSettings })));
const SuperAdminCategories = lazy(() => import('./pages/SuperAdmin/SuperAdminCategories').then(m => ({ default: m.SuperAdminCategories })));
const SuperAdminFinance = lazy(() => import('./pages/SuperAdmin/SuperAdminFinance').then(m => ({ default: m.SuperAdminFinance })));
const SuperAdminAudit = lazy(() => import('./pages/SuperAdmin/SuperAdminAudit').then(m => ({ default: m.SuperAdminAudit })));
const SuperAdminGlobalSettings = lazy(() => import('./pages/SuperAdmin/SuperAdminGlobalSettings').then(m => ({ default: m.SuperAdminGlobalSettings })));
const SuperAdminRequests = lazy(() => import('./pages/SuperAdmin/SuperAdminRequests').then(m => ({ default: m.SuperAdminRequests })));
const SuperAdminAppStore = lazy(() => import('./pages/SuperAdmin/SuperAdminAppStore').then(m => ({ default: m.SuperAdminAppStore })));

// Storefront
const StorefrontWrapper = lazy(() => import('./pages/Storefront/StorefrontWrapper').then(m => ({ default: m.StorefrontWrapper })));
const StoreCatalog = lazy(() => import('./pages/Storefront/StoreCatalog').then(m => ({ default: m.StoreCatalog })));
const StoreCheckout = lazy(() => import('./pages/Storefront/StoreCheckout').then(m => ({ default: m.StoreCheckout })));

// Components
import { BusinessWizard } from './components/auth/BusinessWizard';
import { ModuleGuard } from './components/auth/ModuleGuard';
import { ShellPage } from './pages/Common/ShellPage';

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const { business } = useBusinessStore();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.activeBusiness && !business) return <PageLoader />;
  if (!user.activeBusiness) return <BusinessWizard />;

  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Super Admin Route wrapper
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return <PageLoader />;
  if (!user || !user.isSuperAdmin) return <Navigate to="/app" replace />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Layout Switcher Route wrapper
function DynamicAppLayout() {
  const { user } = useAuthStore();
  return user?.uiVersion === 'v2' ? <AppLayoutV2 /> : <AppLayout />;
}

const AppStorePage = lazy(() => import('./pages/AppStore/AppStorePage').then(m => ({ default: m.AppStorePage })));

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const { setBusiness, setEmployee, clear } = useBusinessStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setLoading(true);
          const profile = await userService.getUser(firebaseUser.uid);
          if (profile) {
            setUser({ ...profile, uid: firebaseUser.uid });
            if (profile.activeBusiness) {
              const [biz, emp] = await Promise.all([
                businessService.getBusiness(profile.activeBusiness),
                businessService.getEmployeeProfile(profile.activeBusiness, firebaseUser.uid)
              ]);
              setBusiness(biz);
              setEmployee(emp);
            }
          } else {
            setUser({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber, email: firebaseUser.email, displayName: firebaseUser.displayName || '', photoURL: firebaseUser.photoURL, businessIds: [], activeBusiness: null, language: 'mn', createdAt: new Date() });
          }
        } else {
          setUser(null);
          clear();
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [setUser, setLoading, setBusiness, setEmployee, clear]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/s/:slug" element={<StorefrontWrapper />}>
            <Route index element={<StoreCatalog />} />
            <Route path="checkout" element={<StoreCheckout />} />
          </Route>

          <Route path="/app" element={<ProtectedRoute><DynamicAppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />

            {/* --- Core Modules (Always Accessible) --- */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="app-store" element={<AppStorePage />} />
            <Route path="analytics" element={<ReportsPage />} />
            <Route path="messenger" element={<ChatPage />} />
            <Route path="cargo" element={<PackagesPage />} />
            <Route path="ai-agent" element={<AIAgentPage />} />

            {/* --- Dynamic Modules (Access Controlled) --- */}
            <Route path="multi-warehouse" element={<ModuleGuard moduleId="multi-warehouse"><ShellPage title="Олон Агуулах" /></ModuleGuard>} />
            <Route path="barcodes" element={<ModuleGuard moduleId="barcodes"><ShellPage title="Баркод & Шошго" /></ModuleGuard>} />
            <Route path="procurement" element={<ModuleGuard moduleId="procurement"><ShellPage title="Худалдан Авалт" /></ModuleGuard>} />
            <Route path="branches" element={<ModuleGuard moduleId="branches"><ShellPage title="Салбар Удирдлага" /></ModuleGuard>} />
            <Route path="audit-inventory" element={<ModuleGuard moduleId="audit-inventory"><ShellPage title="Агуулахын Тооллого" /></ModuleGuard>} />
            <Route path="warranty" element={<ModuleGuard moduleId="warranty"><ShellPage title="Баталгаат Хугацаа" /></ModuleGuard>} />
            <Route path="wms" element={<ModuleGuard moduleId="wms"><ShellPage title="Агуулахын Бүсчлэл" /></ModuleGuard>} />
            <Route path="drop-shipping" element={<ModuleGuard moduleId="drop-shipping"><ShellPage title="Шууд Нийлүүлэлт" /></ModuleGuard>} />
            <Route path="cross-docking" element={<ModuleGuard moduleId="cross-docking"><ShellPage title="Хурдан Түгээлт" /></ModuleGuard>} />
            <Route path="rma" element={<ModuleGuard moduleId="rma"><ShellPage title="Буцаалтын Акт" /></ModuleGuard>} />
            <Route path="quality-control" element={<ModuleGuard moduleId="quality-control"><ShellPage title="Чанарын Хяналт" /></ModuleGuard>} />
            <Route path="inventory-forecast" element={<ModuleGuard moduleId="inventory-forecast"><ShellPage title="AI Таамаглал" /></ModuleGuard>} />
            <Route path="pricing-rules" element={<ModuleGuard moduleId="pricing-rules"><ShellPage title="Үнийн Бодлого" /></ModuleGuard>} />
            <Route path="product-variants" element={<ModuleGuard moduleId="product-variants"><ShellPage title="Хувилбарт Бараа" /></ModuleGuard>} />
            <Route path="b2b-portal" element={<ModuleGuard moduleId="b2b-portal"><B2BMarketplacePage /></ModuleGuard>} />
            <Route path="packaging" element={<ModuleGuard moduleId="packaging"><ShellPage title="Савлагаа" /></ModuleGuard>} />
            <Route path="serial-tracking" element={<ModuleGuard moduleId="serial-tracking"><ShellPage title="Сериал Мөрдөлт" /></ModuleGuard>} />
            <Route path="finance" element={<ModuleGuard moduleId="finance"><FinancePage /></ModuleGuard>} />
            <Route path="invoices" element={<ModuleGuard moduleId="invoices"><ShellPage title="Нэхэмжлэх" /></ModuleGuard>} />
            <Route path="ebarimt" element={<ModuleGuard moduleId="ebarimt"><ShellPage title="И-Баримт (НӨАТ)" /></ModuleGuard>} />
            <Route path="expenses" element={<ModuleGuard moduleId="expenses"><ShellPage title="Зардлын Хяналт" /></ModuleGuard>} />
            <Route path="assets" element={<ModuleGuard moduleId="assets"><ShellPage title="Үндсэн Хөрөнгө" /></ModuleGuard>} />
            <Route path="loans" element={<ModuleGuard moduleId="loans"><LoansPage /></ModuleGuard>} />
            <Route path="budgeting" element={<ModuleGuard moduleId="budgeting"><ShellPage title="Төсвийн Хяналт" /></ModuleGuard>} />
            <Route path="multi-currency" element={<ModuleGuard moduleId="multi-currency"><ShellPage title="Олон Валют" /></ModuleGuard>} />
            <Route path="bank-sync" element={<ModuleGuard moduleId="bank-sync"><ShellPage title="Банкны Холболт" /></ModuleGuard>} />
            <Route path="factoring" element={<ModuleGuard moduleId="factoring"><ShellPage title="Факторинг" /></ModuleGuard>} />
            <Route path="petty-cash" element={<ModuleGuard moduleId="petty-cash"><ShellPage title="Бэлэн Касс" /></ModuleGuard>} />
            <Route path="inter-company" element={<ModuleGuard moduleId="inter-company"><ShellPage title="Компани Хоорондын" /></ModuleGuard>} />
            <Route path="consolidations" element={<ModuleGuard moduleId="consolidations"><ShellPage title="Нэгтгэсэн Тайлан" /></ModuleGuard>} />
            <Route path="crypto-payments" element={<ModuleGuard moduleId="crypto-payments"><ShellPage title="Крипто Төлбөр" /></ModuleGuard>} />
            <Route path="attendance" element={<ModuleGuard moduleId="attendance"><AttendancePage /></ModuleGuard>} />
            <Route path="payroll" element={<ModuleGuard moduleId="payroll"><PayrollPage /></ModuleGuard>} />
            <Route path="recruitment" element={<ModuleGuard moduleId="recruitment"><ShellPage title="Сонгон Шалгаруулалт" /></ModuleGuard>} />
            <Route path="leave" element={<ModuleGuard moduleId="leave"><ShellPage title="Чөлөө & Амралт" /></ModuleGuard>} />
            <Route path="performance" element={<ModuleGuard moduleId="performance"><ShellPage title="Гүйцэтгэлийн Үнэлгээ" /></ModuleGuard>} />
            <Route path="training" element={<ModuleGuard moduleId="training"><ShellPage title="Дотоод Сургалт (LMS)" /></ModuleGuard>} />
            <Route path="shifts" element={<ModuleGuard moduleId="shifts"><ShellPage title="Ээлжийн Хуваарь" /></ModuleGuard>} />
            <Route path="benefits" element={<ModuleGuard moduleId="benefits"><ShellPage title="Урамшууллын Багц" /></ModuleGuard>} />
            <Route path="surveys" element={<ModuleGuard moduleId="surveys"><ShellPage title="Санал Асуулга" /></ModuleGuard>} />
            <Route path="offboarding" element={<ModuleGuard moduleId="offboarding"><ShellPage title="Ажлаас Гарах" /></ModuleGuard>} />
            <Route path="timesheets" element={<ModuleGuard moduleId="timesheets"><ShellPage title="Цагийн Лог" /></ModuleGuard>} />
            <Route path="remote-tracker" element={<ModuleGuard moduleId="remote-tracker"><ShellPage title="Зайны Хяналт" /></ModuleGuard>} />
            <Route path="expenses-claim" element={<ModuleGuard moduleId="expenses-claim"><ShellPage title="Зардлын Нэхэмжлэл" /></ModuleGuard>} />
            <Route path="freelancer-mgt" element={<ModuleGuard moduleId="freelancer-mgt"><ShellPage title="Гэрээт Ажилтан" /></ModuleGuard>} />
            <Route path="campaigns" element={<ModuleGuard moduleId="campaigns"><ShellPage title="Маркетинг" /></ModuleGuard>} />
            <Route path="loyalty" element={<ModuleGuard moduleId="loyalty"><ShellPage title="Лоялти & Оноо" /></ModuleGuard>} />
            <Route path="leads" element={<ModuleGuard moduleId="leads"><ShellPage title="Борлуулалтын Pipeline" /></ModuleGuard>} />
            <Route path="quotes" element={<ModuleGuard moduleId="quotes"><ShellPage title="Үнийн Санал" /></ModuleGuard>} />
            <Route path="affiliate" element={<ModuleGuard moduleId="affiliate"><ShellPage title="Түншийн Шагнал" /></ModuleGuard>} />
            <Route path="telemarketing" element={<ModuleGuard moduleId="telemarketing"><ShellPage title="IP Утас CRM" /></ModuleGuard>} />
            <Route path="helpdesk" element={<ModuleGuard moduleId="helpdesk"><SupportPage /></ModuleGuard>} />
            <Route path="subscriptions" element={<ModuleGuard moduleId="subscriptions"><ShellPage title="Захиалгат Төлбөр" /></ModuleGuard>} />
            <Route path="sales-commissions" element={<ModuleGuard moduleId="sales-commissions"><ShellPage title="Борлуулалтын Шагнал" /></ModuleGuard>} />
            <Route path="email-builder" element={<ModuleGuard moduleId="email-builder"><ShellPage title="Имэйл Загвар" /></ModuleGuard>} />
            <Route path="social-listening" element={<ModuleGuard moduleId="social-listening"><ShellPage title="Сошиал Мониторинг" /></ModuleGuard>} />
            <Route path="customer-portal" element={<ModuleGuard moduleId="customer-portal"><ShellPage title="Харилцагчийн Портал" /></ModuleGuard>} />
            <Route path="field-sales" element={<ModuleGuard moduleId="field-sales"><ShellPage title="Хээрийн Борлуулалт" /></ModuleGuard>} />
            <Route path="pos" element={<ModuleGuard moduleId="pos"><ShellPage title="ПОС / Касс" /></ModuleGuard>} />
            <Route path="e-commerce" element={<ModuleGuard moduleId="e-commerce"><ShellPage title="Онлайн Дэлгүүр" /></ModuleGuard>} />
            <Route path="delivery-app" element={<ModuleGuard moduleId="delivery-app"><DeliveryPage /></ModuleGuard>} />
            <Route path="vouchers" element={<ModuleGuard moduleId="vouchers"><ShellPage title="Бэлгийн Карт" /></ModuleGuard>} />
            <Route path="franchise" element={<ModuleGuard moduleId="franchise"><ShellPage title="Франчайз" /></ModuleGuard>} />
            <Route path="restaurant-pos" element={<ModuleGuard moduleId="restaurant-pos"><ShellPage title="Рестораны ПОС" /></ModuleGuard>} />
            <Route path="kds" element={<ModuleGuard moduleId="kds"><ShellPage title="Гал Тогооны Дэлгэц" /></ModuleGuard>} />
            <Route path="table-booking" element={<ModuleGuard moduleId="table-booking"><ShellPage title="Ширээ Захиалга" /></ModuleGuard>} />
            <Route path="digital-menu" element={<ModuleGuard moduleId="digital-menu"><ShellPage title="QR Цэс" /></ModuleGuard>} />
            <Route path="food-costing" element={<ModuleGuard moduleId="food-costing"><ShellPage title="Хоолны Өртөг" /></ModuleGuard>} />
            <Route path="self-checkout" element={<ModuleGuard moduleId="self-checkout"><ShellPage title="Өөрөө Төлөх" /></ModuleGuard>} />
            <Route path="weight-scale" element={<ModuleGuard moduleId="weight-scale"><ShellPage title="Жинлүүр Холболт" /></ModuleGuard>} />
            <Route path="vending-machine" element={<ModuleGuard moduleId="vending-machine"><ShellPage title="Автомат Машин" /></ModuleGuard>} />
            <Route path="pole-display" element={<ModuleGuard moduleId="pole-display"><ShellPage title="2-р Дэлгэц" /></ModuleGuard>} />
            <Route path="omni-sync" element={<ModuleGuard moduleId="omni-sync"><ShellPage title="Marketplace Sync" /></ModuleGuard>} />
            <Route path="appointments" element={<ModuleGuard moduleId="appointments"><AppointmentsPage /></ModuleGuard>} />
            <Route path="rooms" element={<ModuleGuard moduleId="rooms"><RoomsPage /></ModuleGuard>} />
            <Route path="queue" element={<ModuleGuard moduleId="queue"><QueuePage /></ModuleGuard>} />
            <Route path="rentals" element={<ModuleGuard moduleId="rentals"><ShellPage title="Түрээсийн Удирдлага" /></ModuleGuard>} />
            <Route path="property-mgt" element={<ModuleGuard moduleId="property-mgt"><ShellPage title="СӨХ Хураамж" /></ModuleGuard>} />
            <Route path="cleaning" element={<ModuleGuard moduleId="cleaning"><ShellPage title="Цэвэрлэгээ" /></ModuleGuard>} />
            <Route path="salon" element={<ModuleGuard moduleId="salon"><ShellPage title="Гоо Сайхан & Салон" /></ModuleGuard>} />
            <Route path="fitness" element={<ModuleGuard moduleId="fitness"><ShellPage title="Фитнес & Клуб" /></ModuleGuard>} />
            <Route path="laundry" element={<ModuleGuard moduleId="laundry"><ShellPage title="Хими Цэвэрлэгээ" /></ModuleGuard>} />
            <Route path="spa-wellness" element={<ModuleGuard moduleId="spa-wellness"><ShellPage title="Спа & Массаж" /></ModuleGuard>} />
            <Route path="event-tickets" element={<ModuleGuard moduleId="event-tickets"><TicketsPage /></ModuleGuard>} />
            <Route path="field-service" element={<ModuleGuard moduleId="field-service"><ShellPage title="Гадуур Засвар" /></ModuleGuard>} />
            <Route path="repair-shop" element={<ModuleGuard moduleId="repair-shop"><ShellPage title="Засварын Газар" /></ModuleGuard>} />
            <Route path="membership" element={<ModuleGuard moduleId="membership"><ShellPage title="VIP Гишүүнчлэл" /></ModuleGuard>} />
            <Route path="facility-mgt" element={<ModuleGuard moduleId="facility-mgt"><ShellPage title="Барилга Засвар" /></ModuleGuard>} />
            <Route path="manufacturing" element={<ModuleGuard moduleId="manufacturing"><ManufacturingPage /></ModuleGuard>} />
            <Route path="mrp" element={<ModuleGuard moduleId="mrp"><ShellPage title="Материал Төлөвлөлт" /></ModuleGuard>} />
            <Route path="equipment" element={<ModuleGuard moduleId="equipment"><ShellPage title="Тоног Төхөөрөмж (CMMS)" /></ModuleGuard>} />
            <Route path="job-orders" element={<ModuleGuard moduleId="job-orders"><ShellPage title="Ажлын Даалгавар" /></ModuleGuard>} />
            <Route path="projects" element={<ModuleGuard moduleId="projects"><ProjectsPage /></ModuleGuard>} />
            <Route path="tasks" element={<ModuleGuard moduleId="tasks"><ShellPage title="Ажил Үүрэг (To-Do)" /></ModuleGuard>} />
            <Route path="plm" element={<ModuleGuard moduleId="plm"><ShellPage title="Бүтээгдэхүүн Хөгжүүлэлт" /></ModuleGuard>} />
            <Route path="sub-contracting" element={<ModuleGuard moduleId="sub-contracting"><ShellPage title="Туслан Гүйцэтгэгч" /></ModuleGuard>} />
            <Route path="bom" element={<ModuleGuard moduleId="bom"><ShellPage title="Жорын Бүрдэл (BOM)" /></ModuleGuard>} />
            <Route path="qa" element={<ModuleGuard moduleId="qa"><ShellPage title="Чанарын Баталгаажуулалт" /></ModuleGuard>} />
            <Route path="milestones" element={<ModuleGuard moduleId="milestones"><ShellPage title="Төслийн Шатлал" /></ModuleGuard>} />
            <Route path="gantt-chart" element={<ModuleGuard moduleId="gantt-chart"><ShellPage title="Гантт Диаграм" /></ModuleGuard>} />
            <Route path="timesheet-billing" element={<ModuleGuard moduleId="timesheet-billing"><ShellPage title="Цагийн Нэхэмжлэл" /></ModuleGuard>} />
            <Route path="construction" element={<ModuleGuard moduleId="construction"><ShellPage title="Барилга" /></ModuleGuard>} />
            <Route path="architecture-design" element={<ModuleGuard moduleId="architecture-design"><ShellPage title="Зураг Төсөл" /></ModuleGuard>} />
            <Route path="education" element={<ModuleGuard moduleId="education"><ShellPage title="Сургалт & Курс" /></ModuleGuard>} />
            <Route path="healthcare" element={<ModuleGuard moduleId="healthcare"><ShellPage title="Эмнэлэг & Клиник" /></ModuleGuard>} />
            <Route path="pharmacy" element={<ModuleGuard moduleId="pharmacy"><ShellPage title="Эмийн Сан" /></ModuleGuard>} />
            <Route path="microfinance" element={<ModuleGuard moduleId="microfinance"><ShellPage title="ББСБ / Ломбард" /></ModuleGuard>} />
            <Route path="real-estate" element={<ModuleGuard moduleId="real-estate"><ShellPage title="Үл Хөдлөх Хөрөнгө" /></ModuleGuard>} />
            <Route path="vehicles" element={<ModuleGuard moduleId="vehicles"><VehiclesPage /></ModuleGuard>} />
            <Route path="fleet" element={<ModuleGuard moduleId="fleet"><ShellPage title="GPS Парк Хяналт" /></ModuleGuard>} />
            <Route path="freight" element={<ModuleGuard moduleId="freight"><ShellPage title="Олон Улсын Тээвэр" /></ModuleGuard>} />
            <Route path="agriculture" element={<ModuleGuard moduleId="agriculture"><ShellPage title="Газар Тариалан" /></ModuleGuard>} />
            <Route path="veterinary" element={<ModuleGuard moduleId="veterinary"><ShellPage title="Мал Эмнэлэг" /></ModuleGuard>} />
            <Route path="mining" element={<ModuleGuard moduleId="mining"><ShellPage title="Уул Уурхай" /></ModuleGuard>} />
            <Route path="legal" element={<ModuleGuard moduleId="legal"><ShellPage title="Хуульч & Өмгөөлөгч" /></ModuleGuard>} />
            <Route path="ngo" element={<ModuleGuard moduleId="ngo"><ShellPage title="ТББ & Сан" /></ModuleGuard>} />
            <Route path="printing" element={<ModuleGuard moduleId="printing"><ShellPage title="Хэвлэлийн Үйлдвэр" /></ModuleGuard>} />
            <Route path="car-rental" element={<ModuleGuard moduleId="car-rental"><ShellPage title="Автомашин Түрээс" /></ModuleGuard>} />
            <Route path="driving-school" element={<ModuleGuard moduleId="driving-school"><ShellPage title="Жолооны Курс" /></ModuleGuard>} />
            <Route path="parking" element={<ModuleGuard moduleId="parking"><ShellPage title="Зогсоол" /></ModuleGuard>} />
            <Route path="library" element={<ModuleGuard moduleId="library"><ShellPage title="Номын Сан" /></ModuleGuard>} />
            <Route path="tour-operator" element={<ModuleGuard moduleId="tour-operator"><ShellPage title="Аялал Жуулчлал" /></ModuleGuard>} />
            <Route path="documents" element={<ModuleGuard moduleId="documents"><ContractsPage /></ModuleGuard>} />
            <Route path="e-sign" element={<ModuleGuard moduleId="e-sign"><ShellPage title="Тоон Гарын Үсэг" /></ModuleGuard>} />
            <Route path="internal-chat" element={<ModuleGuard moduleId="internal-chat"><ShellPage title="Дотоод Чаат" /></ModuleGuard>} />
            <Route path="approvals" element={<ModuleGuard moduleId="approvals"><ShellPage title="Зөвшөөрлийн Урсгал" /></ModuleGuard>} />
            <Route path="calendar" element={<ModuleGuard moduleId="calendar"><ShellPage title="Дундын Календарь" /></ModuleGuard>} />
            <Route path="notes" element={<ModuleGuard moduleId="notes"><ShellPage title="Тэмдэглэл" /></ModuleGuard>} />
            <Route path="pass-manager" element={<ModuleGuard moduleId="pass-manager"><ShellPage title="Нууц Үгийн Менежер" /></ModuleGuard>} />
            <Route path="video-meetings" element={<ModuleGuard moduleId="video-meetings"><ShellPage title="Видео Хурал" /></ModuleGuard>} />
            <Route path="whiteboard" element={<ModuleGuard moduleId="whiteboard"><ShellPage title="Ухаалаг Самбар" /></ModuleGuard>} />
            <Route path="announcements" element={<ModuleGuard moduleId="announcements"><ShellPage title="Зарлал" /></ModuleGuard>} />
            <Route path="automations" element={<ModuleGuard moduleId="automations"><ShellPage title="RPA Автомат" /></ModuleGuard>} />
            <Route path="api-webhooks" element={<ModuleGuard moduleId="api-webhooks"><ShellPage title="API & Webhook" /></ModuleGuard>} />
            <Route path="ocr-scanner" element={<ModuleGuard moduleId="ocr-scanner"><ShellPage title="AI Текст Уншигч" /></ModuleGuard>} />
            <Route path="audit-trail" element={<ModuleGuard moduleId="audit-trail"><ShellPage title="Үйлдлийн Лог" /></ModuleGuard>} />
            <Route path="data-migration" element={<ModuleGuard moduleId="data-migration"><ShellPage title="Дата Импорт" /></ModuleGuard>} />
            <Route path="custom-reports" element={<ModuleGuard moduleId="custom-reports"><ShellPage title="Тайлан Зохиогч" /></ModuleGuard>} />
            <Route path="cctv-sync" element={<ModuleGuard moduleId="cctv-sync"><ShellPage title="Камер AI Ирц" /></ModuleGuard>} />
            <Route path="ai-forecaster" element={<ModuleGuard moduleId="ai-forecaster"><ShellPage title="AI Таамаглагч" /></ModuleGuard>} />
            <Route path="ai-chatbot" element={<ModuleGuard moduleId="ai-chatbot"><ShellPage title="AI Чатбот" /></ModuleGuard>} />
            <Route path="gdpr-compliance" element={<ModuleGuard moduleId="gdpr-compliance"><ShellPage title="GDPR Нийцлэл" /></ModuleGuard>} />
            <Route path="data-backup" element={<ModuleGuard moduleId="data-backup"><ShellPage title="Автомат Нөөцлөлт" /></ModuleGuard>} />
            <Route path="ip-whitelist" element={<ModuleGuard moduleId="ip-whitelist"><ShellPage title="IP Хязгаарлалт" /></ModuleGuard>} />
            <Route path="two-factor-auth" element={<ModuleGuard moduleId="two-factor-auth"><ShellPage title="2FA Баталгаажуулалт" /></ModuleGuard>} />
            <Route path="role-manager" element={<ModuleGuard moduleId="role-manager"><ShellPage title="Эрхийн Удирдлага" /></ModuleGuard>} />
            <Route path="session-manager" element={<ModuleGuard moduleId="session-manager"><ShellPage title="Сессийн Хяналт" /></ModuleGuard>} />
            <Route path="document-encryption" element={<ModuleGuard moduleId="document-encryption"><ShellPage title="Баримт Шифрлэлт" /></ModuleGuard>} />
            <Route path="sso" element={<ModuleGuard moduleId="sso"><ShellPage title="Single Sign-On" /></ModuleGuard>} />
            <Route path="access-policy" element={<ModuleGuard moduleId="access-policy"><ShellPage title="Хандалтын Бодлого" /></ModuleGuard>} />
            <Route path="pen-test-report" element={<ModuleGuard moduleId="pen-test-report"><ShellPage title="Аюулгүй Байдалын Тайлан" /></ModuleGuard>} />
            <Route path="tax-reporting" element={<ModuleGuard moduleId="tax-reporting"><ShellPage title="Татварын Тайлан" /></ModuleGuard>} />
            <Route path="customs-declaration" element={<ModuleGuard moduleId="customs-declaration"><ShellPage title="Гаалийн Мэдүүлэг" /></ModuleGuard>} />
            <Route path="labor-compliance" element={<ModuleGuard moduleId="labor-compliance"><ShellPage title="Хөдөлмөрийн Хууль" /></ModuleGuard>} />
            <Route path="anti-fraud" element={<ModuleGuard moduleId="anti-fraud"><ShellPage title="Залилангийн Илрүүлэлт" /></ModuleGuard>} />
            <Route path="contract-compliance" element={<ModuleGuard moduleId="contract-compliance"><ShellPage title="Гэрээний Нийцлэл" /></ModuleGuard>} />
            <Route path="insurance" element={<ModuleGuard moduleId="insurance"><ShellPage title="Даатгалын Удирдлага" /></ModuleGuard>} />
            <Route path="risk-assessment" element={<ModuleGuard moduleId="risk-assessment"><ShellPage title="Эрсдэлийн Үнэлгээ" /></ModuleGuard>} />
            <Route path="environmental" element={<ModuleGuard moduleId="environmental"><ShellPage title="Байгаль Орчин" /></ModuleGuard>} />
            <Route path="health-safety" element={<ModuleGuard moduleId="health-safety"><ShellPage title="ХАБЭА" /></ModuleGuard>} />
            <Route path="whistleblower" element={<ModuleGuard moduleId="whistleblower"><ShellPage title="Нууц Гомдол" /></ModuleGuard>} />
            <Route path="data-retention" element={<ModuleGuard moduleId="data-retention"><ShellPage title="Өгөгдөл Хадгалалт" /></ModuleGuard>} />
            <Route path="vendor-compliance" element={<ModuleGuard moduleId="vendor-compliance"><ShellPage title="Нийлүүлэгч Шалгалт" /></ModuleGuard>} />
            <Route path="export-control" element={<ModuleGuard moduleId="export-control"><ShellPage title="Экспортын Хяналт" /></ModuleGuard>} />
            <Route path="energy-audit" element={<ModuleGuard moduleId="energy-audit"><ShellPage title="Эрчим Хүчний Аудит" /></ModuleGuard>} />
            <Route path="food-safety" element={<ModuleGuard moduleId="food-safety"><ShellPage title="Хүнсний Аюулгүй Байдал" /></ModuleGuard>} />
            <Route path="qpay-integration" element={<ModuleGuard moduleId="qpay-integration"><ShellPage title="QPay Холболт" /></ModuleGuard>} />
            <Route path="socialpay" element={<ModuleGuard moduleId="socialpay"><ShellPage title="SocialPay Холболт" /></ModuleGuard>} />
            <Route path="khan-bank-api" element={<ModuleGuard moduleId="khan-bank-api"><ShellPage title="Хаан Банк API" /></ModuleGuard>} />
            <Route path="golomt-api" element={<ModuleGuard moduleId="golomt-api"><ShellPage title="Голомт Банк API" /></ModuleGuard>} />
            <Route path="ebarimt-api" element={<ModuleGuard moduleId="ebarimt-api"><ShellPage title="И-Баримт API" /></ModuleGuard>} />
            <Route path="facebook-shop" element={<ModuleGuard moduleId="facebook-shop"><ShellPage title="Facebook Дэлгүүр" /></ModuleGuard>} />
            <Route path="instagram-api" element={<ModuleGuard moduleId="instagram-api"><ShellPage title="Instagram API" /></ModuleGuard>} />
            <Route path="tiktok-shop" element={<ModuleGuard moduleId="tiktok-shop"><ShellPage title="TikTok Shop" /></ModuleGuard>} />
            <Route path="google-analytics" element={<ModuleGuard moduleId="google-analytics"><ShellPage title="Google Analytics" /></ModuleGuard>} />
            <Route path="sms-gateway" element={<ModuleGuard moduleId="sms-gateway"><ShellPage title="SMS Илгээгч" /></ModuleGuard>} />
            <Route path="email-smtp" element={<ModuleGuard moduleId="email-smtp"><ShellPage title="Email SMTP" /></ModuleGuard>} />
            <Route path="push-notifications" element={<ModuleGuard moduleId="push-notifications"><ShellPage title="Push Мэдэгдэл" /></ModuleGuard>} />
            <Route path="iot-sensors" element={<ModuleGuard moduleId="iot-sensors"><ShellPage title="IoT Мэдрэгч" /></ModuleGuard>} />
            <Route path="cold-storage" element={<ModuleGuard moduleId="cold-storage"><ShellPage title="Хүйтэн Агуулах" /></ModuleGuard>} />
            <Route path="smart-lock" element={<ModuleGuard moduleId="smart-lock"><ShellPage title="Ухаалаг Түгжээ" /></ModuleGuard>} />
            <Route path="rfid-tracking" element={<ModuleGuard moduleId="rfid-tracking"><ShellPage title="RFID Мөрдөлт" /></ModuleGuard>} />
            <Route path="gps-tracking" element={<ModuleGuard moduleId="gps-tracking"><ShellPage title="GPS Хяналт" /></ModuleGuard>} />
            <Route path="biometric" element={<ModuleGuard moduleId="biometric"><ShellPage title="Биометрик Төхөөрөмж" /></ModuleGuard>} />
            <Route path="receipt-printer" element={<ModuleGuard moduleId="receipt-printer"><ShellPage title="Тасалбар Хэвлэгч" /></ModuleGuard>} />
            <Route path="cash-drawer" element={<ModuleGuard moduleId="cash-drawer"><ShellPage title="Мөнгөний Хайрцаг" /></ModuleGuard>} />
            <Route path="label-printer" element={<ModuleGuard moduleId="label-printer"><ShellPage title="Шошго Хэвлэгч" /></ModuleGuard>} />
            <Route path="scanner-gun" element={<ModuleGuard moduleId="scanner-gun"><ShellPage title="Скан Буу" /></ModuleGuard>} />
            <Route path="kitchen-printer" element={<ModuleGuard moduleId="kitchen-printer"><ShellPage title="Гал Тогооны Принтер" /></ModuleGuard>} />
            <Route path="customer-display" element={<ModuleGuard moduleId="customer-display"><ShellPage title="Хэрэглэгчийн Дэлгэц" /></ModuleGuard>} />
            <Route path="marketplace-hub" element={<ModuleGuard moduleId="marketplace-hub"><ShellPage title="Marketplace Hub" /></ModuleGuard>} />
            <Route path="b2b-provider" element={<ModuleGuard moduleId="b2b-provider"><B2BProviderDashboard /></ModuleGuard>} />
          </Route>

          <Route path="/super" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="businesses" element={<SuperAdminBusinesses />} />
            <Route path="users" element={<SuperAdminUsers />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="categories" element={<SuperAdminCategories />} />
            <Route path="finance" element={<SuperAdminFinance />} />
            <Route path="audit" element={<SuperAdminAudit />} />
            <Route path="requests" element={<SuperAdminRequests />} />
            <Route path="global-settings" element={<SuperAdminGlobalSettings />} />
            <Route path="app-store" element={<SuperAdminAppStore />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
