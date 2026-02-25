import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { updateDoc, doc } from 'firebase/firestore';
import { auth, messaging, db } from './services/firebase';
import { userService, businessService } from './services/db';
import { useAuthStore, useBusinessStore } from './store';
import type { User } from './types';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { OrdersPage } from './pages/Orders/OrdersPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { EmployeesPage } from './pages/Employees/EmployeesPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import { DeliveryPage } from './pages/Delivery/DeliveryPage';
import { PackagesPage } from './pages/Cargo/Packages/PackagesPage';
// --- New Generic Modules ---
import { AppointmentsPage } from './pages/Appointments/AppointmentsPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { RoomsPage } from './pages/Rooms/RoomsPage';
import { VehiclesPage } from './pages/Vehicles/VehiclesPage';
import { TicketsPage } from './pages/Tickets/TicketsPage';
import { LoansPage } from './pages/Loans/LoansPage';
import { QueuePage } from './pages/Queue/QueuePage';
import { AttendancePage } from './pages/Attendance/AttendancePage';
import { PayrollPage } from './pages/Payroll/PayrollPage';
// --- App Store Expansion ---
import { FinancePage } from './pages/Finance/FinancePage';
import { SupportPage } from './pages/Support/SupportPage';
import { B2BPage } from './pages/B2B/B2BPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { ManufacturingPage } from './pages/Manufacturing/ManufacturingPage';
// ---------------------------------
import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard';
import { SuperAdminBusinesses } from './pages/SuperAdmin/SuperAdminBusinesses';
import { SuperAdminUsers } from './pages/SuperAdmin/SuperAdminUsers';
import { SuperAdminSettings } from './pages/SuperAdmin/SuperAdminSettings';
import { SuperAdminCategories } from './pages/SuperAdmin/SuperAdminCategories';
import { SuperAdminFinance } from './pages/SuperAdmin/SuperAdminFinance';
import { SuperAdminAudit } from './pages/SuperAdmin/SuperAdminAudit';
import { SuperAdminGlobalSettings } from './pages/SuperAdmin/SuperAdminGlobalSettings';

// Storefront Pages
import { StorefrontWrapper } from './pages/Storefront/StorefrontWrapper';
import { StoreCatalog } from './pages/Storefront/StoreCatalog';
import { StoreCheckout } from './pages/Storefront/StoreCheckout';

// Components
import { BusinessWizard } from './components/auth/BusinessWizard';
import { AppLayoutV2 } from './components/layout/AppLayoutV2';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const { business } = useBusinessStore();

  if (loading) return <div className="loading-screen">Уншиж байна...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Wait for business data if user has an active business
  if (user.activeBusiness && !business) {
    return <div className="loading-screen">Бизнесийн мэдээлэл ачаалж байна...</div>;
  }

  // If user is logged in but has no business setup, show Wizard
  if (!user.activeBusiness) {
    return <BusinessWizard />;
  }

  return <>{children}</>;
}

// Super Admin Route wrapper
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="loading-screen">Уншиж байна...</div>;
  if (!user || !user.isSuperAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
}

// Layout Switcher Route wrapper
function DynamicAppLayout() {
  const { user } = useAuthStore();
  if (user?.uiVersion === 'v2') {
    return <AppLayoutV2 />;
  }
  return <AppLayout />;
}

export default function App() {

  const { setUser, setLoading } = useAuthStore();
  const { setBusiness, setEmployee, clear } = useBusinessStore();

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'B...' // Replace with real VAPID key in production
        });
        if (token) {
          console.log('FCM Token:', token);
          // In real implementation, store this in user profile in Firestore
        }
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  };

  useEffect(() => {
    // Request permission on app load if user is logged in
    if (Notification.permission === 'default') {
      requestPermission();
    }

    // Handle foreground messages
    const unsubscribeMessaging = onMessage(messaging, (payload) => {
      toast.success(payload.notification?.title || 'Мэдэгдэл ирлээ');
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setLoading(true);
          const profile = await userService.getUser(firebaseUser.uid);
          if (profile) {
            // Temporary: Grant Super Admin to the user
            const userEmail = profile.email || firebaseUser.email;
            if (userEmail === 'oidovnamnan7@gmail.com' && !profile.isSuperAdmin) {
              console.log('Granting Super Admin...');
              await updateDoc(doc(db, 'users', firebaseUser.uid), { isSuperAdmin: true });
              profile.isSuperAdmin = true;
            }

            // Fix: Ensure UID is present in the profile object for usePermissions hook
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
            // Half-reg state
            const newUser: User = {
              uid: firebaseUser.uid,
              phone: firebaseUser.phoneNumber,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL,
              businessIds: [],
              activeBusiness: null,
              language: 'mn',
              createdAt: new Date(),
            };
            setUser(newUser);
          }
        } else {
          setUser(null);
          clear();
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);
        if (error.code === 'failed-precondition') {
          toast.error('Firestore индекс үүсгэх шаардлагатай. Консол дээрх холбоос дээр дарна уу.');
        } else {
          toast.error('Нэвтрэхэд алдаа гарлаа');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeMessaging();
      unsubscribeAuth();
    };
  }, [setUser, setLoading, setBusiness, setEmployee, clear]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Storefront Routes */}
        <Route path="/s/:slug" element={<StorefrontWrapper />}>
          <Route index element={<StoreCatalog />} />
          <Route path="checkout" element={<StoreCheckout />} />
        </Route>


        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DynamicAppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="packages" element={<PackagesPage />} />
          {/* --- New Modules --- */}
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="payroll" element={<PayrollPage />} />

          {/* --- App Store Expansion --- */}
          <Route path="finance" element={<FinancePage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="b2b" element={<B2BPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="manufacturing" element={<ManufacturingPage />} />
          {/* -------------------------------------- */}

          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Super Admin routes */}
        <Route
          path="/super"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="businesses" element={<SuperAdminBusinesses />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="categories" element={<SuperAdminCategories />} />
          <Route path="finance" element={<SuperAdminFinance />} />
          <Route path="audit" element={<SuperAdminAudit />} />
          <Route path="global-settings" element={<SuperAdminGlobalSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
