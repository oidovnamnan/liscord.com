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
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { ChatPage } from './pages/Chat/ChatPage';
import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard';
import { SuperAdminBusinesses } from './pages/SuperAdmin/SuperAdminBusinesses';
import { SuperAdminUsers } from './pages/SuperAdmin/SuperAdminUsers';

// Components
import { BusinessWizard } from './components/auth/BusinessWizard';

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
            if (profile.email === 'oidovnamnan7@gmail.com' && !profile.isSuperAdmin) {
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


        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Super Admin routes */}
        <Route
          path="/super"
          element={
            <SuperAdminRoute>
              <AppLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="businesses" element={<SuperAdminBusinesses />} />
          <Route path="users" element={<SuperAdminUsers />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
