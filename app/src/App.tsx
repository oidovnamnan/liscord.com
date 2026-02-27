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

            {/* Core & Active Modules with Guard */}
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="app-store" element={<AppStorePage />} />

            {/* Corrected Routes (Bug Fix Step 0) */}
            <Route path="analytics" element={<ReportsPage />} />
            <Route path="messenger" element={<ChatPage />} />
            <Route path="cargo" element={<PackagesPage />} />

            {/* Dynamic Modules with Access Control */}
            <Route path="finance" element={<ModuleGuard moduleId="finance"><FinancePage /></ModuleGuard>} />
            <Route path="support" element={<ModuleGuard moduleId="support"><SupportPage /></ModuleGuard>} />
            <Route path="b2b" element={<ModuleGuard moduleId="b2b"><B2BMarketplacePage /></ModuleGuard>} />
            <Route path="b2b-provider" element={<ModuleGuard moduleId="b2b-provider"><B2BProviderDashboard /></ModuleGuard>} />
            <Route path="manufacturing" element={<ModuleGuard moduleId="manufacturing"><ManufacturingPage /></ModuleGuard>} />
            <Route path="delivery" element={<ModuleGuard moduleId="delivery"><DeliveryPage /></ModuleGuard>} />
            <Route path="loans" element={<ModuleGuard moduleId="loans"><LoansPage /></ModuleGuard>} />
            <Route path="appointments" element={<ModuleGuard moduleId="appointments"><AppointmentsPage /></ModuleGuard>} />
            <Route path="projects" element={<ModuleGuard moduleId="projects"><ProjectsPage /></ModuleGuard>} />
            <Route path="rooms" element={<ModuleGuard moduleId="rooms"><RoomsPage /></ModuleGuard>} />
            <Route path="vehicles" element={<ModuleGuard moduleId="vehicles"><VehiclesPage /></ModuleGuard>} />
            <Route path="tickets" element={<ModuleGuard moduleId="tickets"><TicketsPage /></ModuleGuard>} />
            <Route path="contracts" element={<ModuleGuard moduleId="contracts"><ContractsPage /></ModuleGuard>} />
            <Route path="queue" element={<ModuleGuard moduleId="queue"><QueuePage /></ModuleGuard>} />
            <Route path="attendance" element={<ModuleGuard moduleId="attendance"><AttendancePage /></ModuleGuard>} />
            <Route path="payroll" element={<ModuleGuard moduleId="payroll"><PayrollPage /></ModuleGuard>} />

            {/* Shell Modules (New Expansion) */}
            <Route path="pos" element={<ModuleGuard moduleId="pos"><ShellPage title="ПОС / Касс" /></ModuleGuard>} />
            <Route path="barcodes" element={<ModuleGuard moduleId="barcodes"><ShellPage title="Баркод & Шошго" /></ModuleGuard>} />
            <Route path="procurement" element={<ModuleGuard moduleId="procurement"><ShellPage title="Худалдан Авалт" /></ModuleGuard>} />
            <Route path="branches" element={<ModuleGuard moduleId="branches"><ShellPage title="Салбар Удирдлага" /></ModuleGuard>} />
            <Route path="ebarimt" element={<ModuleGuard moduleId="ebarimt"><ShellPage title="И-Баримт" /></ModuleGuard>} />
            <Route path="invoices" element={<ModuleGuard moduleId="invoices"><ShellPage title="Нэхэмжлэх" /></ModuleGuard>} />
            <Route path="expenses" element={<ModuleGuard moduleId="expenses"><ShellPage title="Зардлын Хяналт" /></ModuleGuard>} />
            <Route path="assets" element={<ModuleGuard moduleId="assets"><ShellPage title="Үндсэн Хөрөнгө" /></ModuleGuard>} />
            <Route path="campaigns" element={<ModuleGuard moduleId="campaigns"><ShellPage title="Маркетинг" /></ModuleGuard>} />
            <Route path="loyalty" element={<ModuleGuard moduleId="loyalty"><ShellPage title="Лоялти" /></ModuleGuard>} />
            <Route path="website" element={<ModuleGuard moduleId="website"><ShellPage title="Вэбсайт" /></ModuleGuard>} />
            <Route path="recruitment" element={<ModuleGuard moduleId="recruitment"><ShellPage title="Сонгон Шалгаруулалт" /></ModuleGuard>} />
            <Route path="leave" element={<ModuleGuard moduleId="leave"><ShellPage title="Чөлөө" /></ModuleGuard>} />
            <Route path="performance" element={<ModuleGuard moduleId="performance"><ShellPage title="Гүйцэтгэл" /></ModuleGuard>} />
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
