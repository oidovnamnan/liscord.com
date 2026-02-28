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
// const DeliveryPage = lazy(() => import('./pages/Delivery/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const PackagesPage = lazy(() => import('./pages/Cargo/Packages/PackagesPage').then(m => ({ default: m.PackagesPage })));
const InventoryPage = lazy(() => import('./pages/Inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ProcurementPage = lazy(() => import('./pages/Inventory/ProcurementPage').then(m => ({ default: m.ProcurementPage })));
const LeadsPage = lazy(() => import('./pages/CRM/LeadsPage').then(m => ({ default: m.LeadsPage })));
const QuotesPage = lazy(() => import('./pages/CRM/QuotesPage').then(m => ({ default: m.QuotesPage })));
const CampaignsPage = lazy(() => import('./pages/Marketing/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const LoyaltyPage = lazy(() => import('./pages/CRM/LoyaltyPage').then(m => ({ default: m.LoyaltyPage })));
const InvoicesPage = lazy(() => import('./pages/Finance/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const ExpensesPage = lazy(() => import('./pages/Finance/ExpensesPage').then(m => ({ default: m.ExpensesPage })));

const PettyCashPage = lazy(() => import('./pages/Finance/PettyCashPage').then(m => ({ default: m.PettyCashPage })));

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
const MRPPage = lazy(() => import('./pages/Manufacturing/MRPPage').then(m => ({ default: m.MRPPage })));
const EquipmentPage = lazy(() => import('./pages/Manufacturing/EquipmentPage').then(m => ({ default: m.EquipmentPage })));
const JobOrdersPage = lazy(() => import('./pages/Manufacturing/JobOrdersPage').then(m => ({ default: m.JobOrdersPage })));
const BOMPage = lazy(() => import('./pages/Manufacturing/BOMPage').then(m => ({ default: m.BOMPage })));
const QAPage = lazy(() => import('./pages/Manufacturing/QAPage').then(m => ({ default: m.QAPage })));
const MilestonesPage = lazy(() => import('./pages/Manufacturing/MilestonesPage').then(m => ({ default: m.MilestonesPage })));
const GanttChartPage = lazy(() => import('./pages/Manufacturing/GanttChartPage').then(m => ({ default: m.GanttChartPage })));
const TimesheetBillingPage = lazy(() => import('./pages/Manufacturing/TimesheetBillingPage').then(m => ({ default: m.TimesheetBillingPage })));
const ConstructionPage = lazy(() => import('./pages/Manufacturing/ConstructionPage').then(m => ({ default: m.ConstructionPage })));
const ArchitectureDesignPage = lazy(() => import('./pages/Manufacturing/ArchitectureDesignPage').then(m => ({ default: m.ArchitectureDesignPage })));

// Workspace Hub Pages
const DocumentsPage = lazy(() => import('./pages/Workspace/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const ESignPage = lazy(() => import('./pages/Workspace/ESignPage').then(m => ({ default: m.ESignPage })));
const InternalChatPage = lazy(() => import('./pages/Workspace/InternalChatPage').then(m => ({ default: m.InternalChatPage })));
const ApprovalsPage = lazy(() => import('./pages/Workspace/ApprovalsPage').then(m => ({ default: m.ApprovalsPage })));
const CalendarPage = lazy(() => import('./pages/Workspace/CalendarPage').then(m => ({ default: m.CalendarPage })));
const NotesPage = lazy(() => import('./pages/Workspace/NotesPage').then(m => ({ default: m.NotesPage })));
const PassManagerPage = lazy(() => import('./pages/Workspace/PassManagerPage').then(m => ({ default: m.PassManagerPage })));
const VideoMeetingsPage = lazy(() => import('./pages/Workspace/VideoMeetingsPage').then(m => ({ default: m.VideoMeetingsPage })));
const WhiteboardPage = lazy(() => import('./pages/Workspace/WhiteboardPage').then(m => ({ default: m.WhiteboardPage })));
const AnnouncementsPage = lazy(() => import('./pages/Workspace/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const RecruitmentPage = lazy(() => import('./pages/Staff/RecruitmentPage').then(m => ({ default: m.RecruitmentPage })));
const LeavePage = lazy(() => import('./pages/Staff/LeavePage').then(m => ({ default: m.LeavePage })));
const PerformancePage = lazy(() => import('./pages/Staff/PerformancePage').then(m => ({ default: m.PerformancePage })));
const TasksPage = lazy(() => import('./pages/Manufacturing/TasksPage').then(m => ({ default: m.TasksPage })));
const PLMPage = lazy(() => import('./pages/Manufacturing/PLMPage').then(m => ({ default: m.PLMPage })));
const SubContractingPage = lazy(() => import('./pages/Manufacturing/SubContractingPage').then(m => ({ default: m.SubContractingPage })));
const WarrantyPage = lazy(() => import('./pages/Inventory/WarrantyPage').then(m => ({ default: m.WarrantyPage })));
const RMAPage = lazy(() => import('./pages/Inventory/RMAPage').then(m => ({ default: m.RMAPage })));
const QualityControlPage = lazy(() => import('./pages/Inventory/QualityControlPage').then(m => ({ default: m.QualityControlPage })));
const InventoryAuditPage = lazy(() => import('./pages/Inventory/InventoryAuditPage').then(m => ({ default: m.InventoryAuditPage })));
const AIAgentPage = lazy(() => import('./pages/AIAgent/AIAgentPage').then(m => ({ default: m.AIAgentPage })));
const FleetPage = lazy(() => import('./pages/Fleet/FleetPage').then(m => ({ default: m.FleetPage })));
const ImportCostPage = lazy(() => import('./pages/Inventory/ImportCostPage').then(m => ({ default: m.ImportCostPage })));
const DispatchPage = lazy(() => import('./pages/Logistics/DispatchPage').then(m => ({ default: m.DispatchPage })));
const FreightPage = lazy(() => import('./pages/Cargo/FreightPage').then(m => ({ default: m.FreightPage })));
const PackingPage = lazy(() => import('./pages/Logistics/PackingPage').then(m => ({ default: m.PackingPage })));
const VendorRatingPage = lazy(() => import('./pages/Inventory/VendorRatingPage').then(m => ({ default: m.VendorRatingPage })));
const RouteOptimizePage = lazy(() => import('./pages/Logistics/RouteOptimizePage').then(m => ({ default: m.RouteOptimizePage })));
const SalesCommissionsPage = lazy(() => import('./pages/CRM/SalesCommissionsPage').then(m => ({ default: m.SalesCommissionsPage })));
const EmailBuilderPage = lazy(() => import('./pages/CRM/EmailBuilderPage').then(m => ({ default: m.EmailBuilderPage })));
const SocialListeningPage = lazy(() => import('./pages/CRM/SocialListeningPage').then(m => ({ default: m.SocialListeningPage })));
const CustomerPortalPage = lazy(() => import('./pages/CRM/CustomerPortalPage').then(m => ({ default: m.CustomerPortalPage })));
const FieldSalesPage = lazy(() => import('./pages/CRM/FieldSalesPage').then(m => ({ default: m.FieldSalesPage })));
const POSPage = lazy(() => import('./pages/Retail/POSPage').then(m => ({ default: m.POSPage })));
const EcommercePage = lazy(() => import('./pages/Retail/EcommercePage').then(m => ({ default: m.EcommercePage })));
const DeliveryAppPage = lazy(() => import('./pages/Retail/DeliveryAppPage').then(m => ({ default: m.DeliveryAppPage })));
const VouchersPage = lazy(() => import('./pages/Retail/VouchersPage').then(m => ({ default: m.VouchersPage })));
const FranchisePage = lazy(() => import('./pages/Retail/FranchisePage').then(m => ({ default: m.FranchisePage })));
const RestaurantPOSPage = lazy(() => import('./pages/Industry/RestaurantPOSPage').then(m => ({ default: m.RestaurantPOSPage })));
const KDSPage = lazy(() => import('./pages/Industry/KDSPage').then(m => ({ default: m.KDSPage })));
const TableBookingPage = lazy(() => import('./pages/Industry/TableBookingPage').then(m => ({ default: m.TableBookingPage })));
const DigitalMenuPage = lazy(() => import('./pages/Industry/DigitalMenuPage').then(m => ({ default: m.DigitalMenuPage })));
const FoodCostingPage = lazy(() => import('./pages/Industry/FoodCostingPage').then(m => ({ default: m.FoodCostingPage })));
const SelfCheckoutPage = lazy(() => import('./pages/Industry/SelfCheckoutPage').then(m => ({ default: m.SelfCheckoutPage })));
const WeightScalePage = lazy(() => import('./pages/Industry/WeightScalePage').then(m => ({ default: m.WeightScalePage })));
const VendingPage = lazy(() => import('./pages/Industry/VendingPage').then(m => ({ default: m.VendingPage })));
const PoleDisplayPage = lazy(() => import('./pages/Industry/PoleDisplayPage').then(m => ({ default: m.PoleDisplayPage })));
const MarketplaceSyncPage = lazy(() => import('./pages/Industry/MarketplaceSyncPage').then(m => ({ default: m.MarketplaceSyncPage })));
const DentalClinicPage = lazy(() => import('./pages/Industry/DentalClinicPage').then(m => ({ default: m.DentalClinicPage })));
const PharmacyPage = lazy(() => import('./pages/Industry/PharmacyPage').then(m => ({ default: m.PharmacyPage })));
const GymFitnessPage = lazy(() => import('./pages/Industry/GymFitnessPage').then(m => ({ default: m.GymFitnessPage })));
const SalonSpaPage = lazy(() => import('./pages/Industry/SalonSpaPage').then(m => ({ default: m.SalonSpaPage })));
const RealEstatePage = lazy(() => import('./pages/Industry/RealEstatePage').then(m => ({ default: m.RealEstatePage })));
const AutoRepairPage = lazy(() => import('./pages/Industry/AutoRepairPage').then(m => ({ default: m.AutoRepairPage })));
const RentalPage = lazy(() => import('./pages/Industry/RentalPage').then(m => ({ default: m.RentalPage })));
const Logistics3PLPage = lazy(() => import('./pages/Industry/Logistics3PLPage').then(m => ({ default: m.Logistics3PLPage })));
// const FleetManagementPage = lazy(() => import('./pages/Industry/FleetManagementPage').then(m => ({ default: m.FleetManagementPage })));
const WarehouseManagementPage = lazy(() => import('./pages/Inventory/WarehouseManagementPage').then(m => ({ default: m.WarehouseManagementPage })));
const DropShippingPage = lazy(() => import('./pages/Inventory/DropShippingPage').then(m => ({ default: m.DropShippingPage })));
const CrossDockingPage = lazy(() => import('./pages/Inventory/CrossDockingPage').then(m => ({ default: m.CrossDockingPage })));
const InventoryForecastPage = lazy(() => import('./pages/Inventory/InventoryForecastPage').then(m => ({ default: m.InventoryForecastPage })));
const PricingRulesPage = lazy(() => import('./pages/Inventory/PricingRulesPage').then(m => ({ default: m.PricingRulesPage })));
const ProductVariantsPage = lazy(() => import('./pages/Inventory/ProductVariantsPage').then(m => ({ default: m.ProductVariantsPage })));
const BarcodeLabelsPage = lazy(() => import('./pages/Inventory/BarcodeLabelsPage').then(m => ({ default: m.BarcodeLabelsPage })));
const IoTSensorsPage = lazy(() => import('./pages/Manufacturing/IoTSensorsPage').then(m => ({ default: m.IoTSensorsPage })));
const MultiWarehousePage = lazy(() => import('./pages/Inventory/MultiWarehousePage').then(m => ({ default: m.MultiWarehousePage })));
const PackagingPage = lazy(() => import('./pages/Inventory/PackagingPage').then(m => ({ default: m.PackagingPage })));
const SerialTrackingPage = lazy(() => import('./pages/Inventory/SerialTrackingPage').then(m => ({ default: m.SerialTrackingPage })));

const EBarimtPage = lazy(() => import('./pages/Finance/EBarimtPage').then(m => ({ default: m.EBarimtPage })));
const AssetsPage = lazy(() => import('./pages/Finance/AssetsPage').then(m => ({ default: m.AssetsPage })));
const BudgetingPage = lazy(() => import('./pages/Finance/BudgetingPage').then(m => ({ default: m.BudgetingPage })));
const MultiCurrencyPage = lazy(() => import('./pages/Finance/MultiCurrencyPage').then(m => ({ default: m.MultiCurrencyPage })));
const BankSyncPage = lazy(() => import('./pages/Finance/BankSyncPage').then(m => ({ default: m.BankSyncPage })));
const FactoringPage = lazy(() => import('./pages/Finance/FactoringPage').then(m => ({ default: m.FactoringPage })));
const InterCompanyPage = lazy(() => import('./pages/Finance/InterCompanyPage').then(m => ({ default: m.InterCompanyPage })));
const ConsolidationsPage = lazy(() => import('./pages/Finance/ConsolidationsPage').then(m => ({ default: m.ConsolidationsPage })));
const CryptoPaymentsPage = lazy(() => import('./pages/Finance/CryptoPaymentsPage').then(m => ({ default: m.CryptoPaymentsPage })));

const TrainingPage = lazy(() => import('./pages/HR/TrainingPage').then(m => ({ default: m.TrainingPage })));
const ShiftsPage = lazy(() => import('./pages/HR/ShiftsPage').then(m => ({ default: m.ShiftsPage })));
const BenefitsPage = lazy(() => import('./pages/HR/BenefitsPage').then(m => ({ default: m.BenefitsPage })));
const SurveysPage = lazy(() => import('./pages/HR/SurveysPage').then(m => ({ default: m.SurveysPage })));
const OffboardingPage = lazy(() => import('./pages/HR/OffboardingPage').then(m => ({ default: m.OffboardingPage })));
const TimesheetsPage = lazy(() => import('./pages/HR/TimesheetsPage').then(m => ({ default: m.TimesheetsPage })));
const RemoteTrackerPage = lazy(() => import('./pages/HR/RemoteTrackerPage').then(m => ({ default: m.RemoteTrackerPage })));
const ExpensesClaimPage = lazy(() => import('./pages/HR/ExpensesClaimPage').then(m => ({ default: m.ExpensesClaimPage })));
const FreelancerMgtPage = lazy(() => import('./pages/HR/FreelancerMgtPage').then(m => ({ default: m.FreelancerMgtPage })));

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
            <Route path="multi-warehouse" element={<ModuleGuard moduleId="multi-warehouse"><MultiWarehousePage /></ModuleGuard>} />
            <Route path="barcodes" element={<ModuleGuard moduleId="barcodes"><BarcodeLabelsPage /></ModuleGuard>} />
            <Route path="procurement" element={<ModuleGuard moduleId="procurement"><ProcurementPage /></ModuleGuard>} />
            <Route path="branches" element={<ModuleGuard moduleId="branches"><ShellPage title="Салбар Удирдлага" moduleId="branches" /></ModuleGuard>} />
            <Route path="audit-inventory" element={<ModuleGuard moduleId="audit-inventory"><InventoryAuditPage /></ModuleGuard>} />
            <Route path="warranty" element={<ModuleGuard moduleId="warranty"><WarrantyPage /></ModuleGuard>} />
            <Route path="wms" element={<ModuleGuard moduleId="wms"><WarehouseManagementPage /></ModuleGuard>} />
            <Route path="drop-shipping" element={<ModuleGuard moduleId="drop-shipping"><DropShippingPage /></ModuleGuard>} />
            <Route path="cross-docking" element={<ModuleGuard moduleId="cross-docking"><CrossDockingPage /></ModuleGuard>} />
            <Route path="rma" element={<ModuleGuard moduleId="rma"><RMAPage /></ModuleGuard>} />
            <Route path="quality-control" element={<ModuleGuard moduleId="quality-control"><QualityControlPage /></ModuleGuard>} />
            <Route path="inventory-forecast" element={<ModuleGuard moduleId="inventory-forecast"><InventoryForecastPage /></ModuleGuard>} />
            <Route path="pricing-rules" element={<ModuleGuard moduleId="pricing-rules"><PricingRulesPage /></ModuleGuard>} />
            <Route path="product-variants" element={<ModuleGuard moduleId="product-variants"><ProductVariantsPage /></ModuleGuard>} />
            <Route path="b2b-portal" element={<ModuleGuard moduleId="b2b-portal"><B2BMarketplacePage /></ModuleGuard>} />
            <Route path="packaging" element={<ModuleGuard moduleId="packaging"><PackagingPage /></ModuleGuard>} />
            <Route path="serial-tracking" element={<ModuleGuard moduleId="serial-tracking"><SerialTrackingPage /></ModuleGuard>} />
            <Route path="finance" element={<ModuleGuard moduleId="finance"><FinancePage /></ModuleGuard>} />
            <Route path="invoices" element={<ModuleGuard moduleId="invoices"><InvoicesPage /></ModuleGuard>} />
            <Route path="ebarimt" element={<ModuleGuard moduleId="ebarimt"><EBarimtPage /></ModuleGuard>} />
            <Route path="expenses" element={<ModuleGuard moduleId="expenses"><ExpensesPage /></ModuleGuard>} />
            <Route path="assets" element={<ModuleGuard moduleId="assets"><AssetsPage /></ModuleGuard>} />
            <Route path="loans" element={<ModuleGuard moduleId="loans"><LoansPage /></ModuleGuard>} />
            <Route path="budgeting" element={<ModuleGuard moduleId="budgeting"><BudgetingPage /></ModuleGuard>} />
            <Route path="multi-currency" element={<ModuleGuard moduleId="multi-currency"><MultiCurrencyPage /></ModuleGuard>} />
            <Route path="bank-sync" element={<ModuleGuard moduleId="bank-sync"><BankSyncPage /></ModuleGuard>} />
            <Route path="factoring" element={<ModuleGuard moduleId="factoring"><FactoringPage /></ModuleGuard>} />
            <Route path="petty-cash" element={<ModuleGuard moduleId="petty-cash"><PettyCashPage /></ModuleGuard>} />
            <Route path="inter-company" element={<ModuleGuard moduleId="inter-company"><InterCompanyPage /></ModuleGuard>} />
            <Route path="consolidations" element={<ModuleGuard moduleId="consolidations"><ConsolidationsPage /></ModuleGuard>} />
            <Route path="crypto-payments" element={<ModuleGuard moduleId="crypto-payments"><CryptoPaymentsPage /></ModuleGuard>} />
            <Route path="attendance" element={<ModuleGuard moduleId="attendance"><AttendancePage /></ModuleGuard>} />
            <Route path="payroll" element={<ModuleGuard moduleId="payroll"><PayrollPage /></ModuleGuard>} />
            <Route path="recruitment" element={<ModuleGuard moduleId="recruitment"><RecruitmentPage /></ModuleGuard>} />
            <Route path="leave" element={<ModuleGuard moduleId="leave"><LeavePage /></ModuleGuard>} />
            <Route path="performance" element={<ModuleGuard moduleId="performance"><PerformancePage /></ModuleGuard>} />
            <Route path="training" element={<ModuleGuard moduleId="training"><TrainingPage /></ModuleGuard>} />
            <Route path="shifts" element={<ModuleGuard moduleId="shifts"><ShiftsPage /></ModuleGuard>} />
            <Route path="benefits" element={<ModuleGuard moduleId="benefits"><BenefitsPage /></ModuleGuard>} />
            <Route path="surveys" element={<ModuleGuard moduleId="surveys"><SurveysPage /></ModuleGuard>} />
            <Route path="offboarding" element={<ModuleGuard moduleId="offboarding"><OffboardingPage /></ModuleGuard>} />
            <Route path="timesheets" element={<ModuleGuard moduleId="timesheets"><TimesheetsPage /></ModuleGuard>} />
            <Route path="remote-tracker" element={<ModuleGuard moduleId="remote-tracker"><RemoteTrackerPage /></ModuleGuard>} />
            <Route path="expenses-claim" element={<ModuleGuard moduleId="expenses-claim"><ExpensesClaimPage /></ModuleGuard>} />
            <Route path="freelancer-mgt" element={<ModuleGuard moduleId="freelancer-mgt"><FreelancerMgtPage /></ModuleGuard>} />
            <Route path="campaigns" element={<ModuleGuard moduleId="campaigns"><CampaignsPage /></ModuleGuard>} />
            <Route path="loyalty" element={<ModuleGuard moduleId="loyalty"><LoyaltyPage /></ModuleGuard>} />
            <Route path="leads" element={<ModuleGuard moduleId="leads"><LeadsPage /></ModuleGuard>} />
            <Route path="quotes" element={<ModuleGuard moduleId="quotes"><QuotesPage /></ModuleGuard>} />
            <Route path="affiliate" element={<ModuleGuard moduleId="affiliate"><ShellPage title="Түншийн Шагнал" moduleId="affiliate" /></ModuleGuard>} />
            <Route path="telemarketing" element={<ModuleGuard moduleId="telemarketing"><ShellPage title="IP Утас CRM" moduleId="telemarketing" /></ModuleGuard>} />
            <Route path="helpdesk" element={<ModuleGuard moduleId="helpdesk"><SupportPage /></ModuleGuard>} />
            <Route path="subscriptions" element={<ModuleGuard moduleId="subscriptions"><ShellPage title="Захиалгат Төлбөр" moduleId="subscriptions" /></ModuleGuard>} />
            <Route path="sales-commissions" element={<ModuleGuard moduleId="sales-commissions"><SalesCommissionsPage /></ModuleGuard>} />
            <Route path="email-builder" element={<ModuleGuard moduleId="email-builder"><EmailBuilderPage /></ModuleGuard>} />
            <Route path="social-listening" element={<ModuleGuard moduleId="social-listening"><SocialListeningPage /></ModuleGuard>} />
            <Route path="customer-portal" element={<ModuleGuard moduleId="customer-portal"><CustomerPortalPage /></ModuleGuard>} />
            <Route path="field-sales" element={<ModuleGuard moduleId="field-sales"><FieldSalesPage /></ModuleGuard>} />
            <Route path="pos" element={<ModuleGuard moduleId="pos"><POSPage /></ModuleGuard>} />
            <Route path="e-commerce" element={<ModuleGuard moduleId="e-commerce"><EcommercePage /></ModuleGuard>} />
            <Route path="delivery-app" element={<ModuleGuard moduleId="delivery-app"><DeliveryAppPage /></ModuleGuard>} />
            <Route path="vouchers" element={<ModuleGuard moduleId="vouchers"><VouchersPage /></ModuleGuard>} />
            <Route path="franchise" element={<ModuleGuard moduleId="franchise"><FranchisePage /></ModuleGuard>} />
            <Route path="restaurant-pos" element={<ModuleGuard moduleId="restaurant-pos"><RestaurantPOSPage /></ModuleGuard>} />
            <Route path="kds" element={<ModuleGuard moduleId="kds"><KDSPage /></ModuleGuard>} />
            <Route path="table-booking" element={<ModuleGuard moduleId="table-booking"><TableBookingPage /></ModuleGuard>} />
            <Route path="digital-menu" element={<ModuleGuard moduleId="digital-menu"><DigitalMenuPage /></ModuleGuard>} />
            <Route path="food-costing" element={<ModuleGuard moduleId="food-costing"><FoodCostingPage /></ModuleGuard>} />
            <Route path="self-checkout" element={<ModuleGuard moduleId="self-checkout"><SelfCheckoutPage /></ModuleGuard>} />
            <Route path="weight-scale" element={<ModuleGuard moduleId="weight-scale"><WeightScalePage /></ModuleGuard>} />
            <Route path="vending-machine" element={<ModuleGuard moduleId="vending-machine"><VendingPage /></ModuleGuard>} />
            <Route path="pole-display" element={<ModuleGuard moduleId="pole-display"><PoleDisplayPage /></ModuleGuard>} />
            <Route path="omni-sync" element={<ModuleGuard moduleId="omni-sync"><MarketplaceSyncPage /></ModuleGuard>} />
            <Route path="appointments" element={<ModuleGuard moduleId="appointments"><AppointmentsPage /></ModuleGuard>} />
            <Route path="dental-clinic" element={<ModuleGuard moduleId="healthcare"><DentalClinicPage /></ModuleGuard>} />
            <Route path="pharmacy" element={<ModuleGuard moduleId="pharmacy"><PharmacyPage /></ModuleGuard>} />
            <Route path="gym-fitness" element={<ModuleGuard moduleId="fitness"><GymFitnessPage /></ModuleGuard>} />
            <Route path="salon-spa" element={<ModuleGuard moduleId="salon"><SalonSpaPage /></ModuleGuard>} />
            <Route path="real-estate" element={<ModuleGuard moduleId="real-estate"><RealEstatePage /></ModuleGuard>} />
            <Route path="auto-repair" element={<ModuleGuard moduleId="repair-shop"><AutoRepairPage /></ModuleGuard>} />
            <Route path="rental" element={<ModuleGuard moduleId="rentals"><RentalPage /></ModuleGuard>} />
            <Route path="logistics-3pl" element={<ModuleGuard moduleId="cargo"><Logistics3PLPage /></ModuleGuard>} />
            <Route path="fleet-mgt" element={<ModuleGuard moduleId="fleet"><FleetPage /></ModuleGuard>} />
            <Route path="packing" element={<ModuleGuard moduleId="packing"><PackingPage /></ModuleGuard>} />
            <Route path="dispatch" element={<ModuleGuard moduleId="dispatch"><DispatchPage /></ModuleGuard>} />
            <Route path="import-cost" element={<ModuleGuard moduleId="import-cost"><ImportCostPage /></ModuleGuard>} />
            <Route path="freight" element={<ModuleGuard moduleId="freight"><FreightPage /></ModuleGuard>} />
            <Route path="vendor-rating" element={<ModuleGuard moduleId="vendor-rating"><VendorRatingPage /></ModuleGuard>} />
            <Route path="route-optimize" element={<ModuleGuard moduleId="route-optimize"><RouteOptimizePage /></ModuleGuard>} />
            <Route path="customs" element={<ModuleGuard moduleId="customs"><ShellPage title="Гааль & Мэдүүлэг" moduleId="customs" /></ModuleGuard>} />
            <Route path="travel-agency" element={<ModuleGuard moduleId="travel-agency"><ShellPage title="Аялал Жуулчлал" moduleId="travel-agency" /></ModuleGuard>} />
            <Route path="hotel-mgt" element={<ModuleGuard moduleId="hotel-mgt"><ShellPage title="Зочид Буудал" moduleId="hotel-mgt" /></ModuleGuard>} />
            <Route path="event-planning" element={<ModuleGuard moduleId="event-planning"><ShellPage title="Эвент Зохион Байгуулалт" moduleId="event-planning" /></ModuleGuard>} />
            <Route path="ticketing" element={<ModuleGuard moduleId="ticketing"><ShellPage title="Тасалбар & Reservation" moduleId="ticketing" /></ModuleGuard>} />
            <Route path="school-mgt" element={<ModuleGuard moduleId="school-mgt"><ShellPage title="Сургууль, Цэцэрлэг" moduleId="school-mgt" /></ModuleGuard>} />
            <Route path="e-learning" element={<ModuleGuard moduleId="e-learning"><ShellPage title="Онлайн Сургалт" moduleId="e-learning" /></ModuleGuard>} />
            <Route path="tutor" element={<ModuleGuard moduleId="tutor"><ShellPage title="Давтлага & Ментор" moduleId="tutor" /></ModuleGuard>} />
            <Route path="library" element={<ModuleGuard moduleId="library"><ShellPage title="Номын Сан" moduleId="library" /></ModuleGuard>} />
            <Route path="manufacturing-erp" element={<ModuleGuard moduleId="manufacturing-erp"><ShellPage title="Үйлдвэрлэл (BOM)" moduleId="manufacturing-erp" /></ModuleGuard>} />
            <Route path="maintenance" element={<ModuleGuard moduleId="maintenance"><ShellPage title="Тоног Төхөөрөмж (CMMS)" moduleId="maintenance" /></ModuleGuard>} />
            <Route path="quality-assurance" element={<ModuleGuard moduleId="quality-assurance"><ShellPage title="Чанарын Баталгаажуулалт" moduleId="quality-assurance" /></ModuleGuard>} />
            <Route path="milestones" element={<ModuleGuard moduleId="milestones"><MilestonesPage /></ModuleGuard>} />
            <Route path="iot-sensors" element={<ModuleGuard moduleId="iot-sensors"><IoTSensorsPage /></ModuleGuard>} />
            <Route path="law-firm" element={<ModuleGuard moduleId="law-firm"><ShellPage title="Хуулийн Фирм" moduleId="law-firm" /></ModuleGuard>} />
            <Route path="accounting-firm" element={<ModuleGuard moduleId="accounting-firm"><ShellPage title="Нягтлангийн Үйлчилгээ" moduleId="accounting-firm" /></ModuleGuard>} />
            <Route path="consulting" element={<ModuleGuard moduleId="consulting"><ShellPage title="Зөвлөх Үйлчилгээ" moduleId="consulting" /></ModuleGuard>} />
            <Route path="insurance" element={<ModuleGuard moduleId="insurance"><ShellPage title="Даатгал" moduleId="insurance" /></ModuleGuard>} />
            <Route path="cleaning" element={<ModuleGuard moduleId="cleaning"><ShellPage title="Цэвэрлэгээ үйлчилгээ" moduleId="cleaning" /></ModuleGuard>} />
            <Route path="laundry" element={<ModuleGuard moduleId="laundry"><ShellPage title="Хими Цэвэрлэгээ" moduleId="laundry" /></ModuleGuard>} />
            <Route path="print-shop" element={<ModuleGuard moduleId="print-shop"><ShellPage title="Хэвлэх Үйлдвэр" moduleId="print-shop" /></ModuleGuard>} />
            <Route path="tailor" element={<ModuleGuard moduleId="tailor"><ShellPage title="Оёдол, Эсгүүр" moduleId="tailor" /></ModuleGuard>} />
            <Route path="subscription-box" element={<ModuleGuard moduleId="subscription-box"><ShellPage title="Сар бүрийн Багц" moduleId="subscription-box" /></ModuleGuard>} />
            <Route path="auction" element={<ModuleGuard moduleId="auction"><ShellPage title="Дуудлага Худалдаа" moduleId="auction" /></ModuleGuard>} />
            <Route path="classifieds" element={<ModuleGuard moduleId="classifieds"><ShellPage title="Зар Мэдээ" moduleId="classifieds" /></ModuleGuard>} />
            <Route path="affiliate-marketing" element={<ModuleGuard moduleId="affiliate-marketing"><ShellPage title="Affiliate Сүлжээ" moduleId="affiliate-marketing" /></ModuleGuard>} />
            <Route path="influencer" element={<ModuleGuard moduleId="influencer"><ShellPage title="Инфлюэнсер CRM" moduleId="influencer" /></ModuleGuard>} />
            <Route path="seo-tools" element={<ModuleGuard moduleId="seo-tools"><ShellPage title="SEO Үнэлгээ" moduleId="seo-tools" /></ModuleGuard>} />
            <Route path="content-mgt" element={<ModuleGuard moduleId="content-mgt"><ShellPage title="Контент Төлөвлөгөө" moduleId="content-mgt" /></ModuleGuard>} />
            <Route path="workflow-automation" element={<ModuleGuard moduleId="workflow-automation"><ShellPage title="Ухаалаг Урсгал" moduleId="workflow-automation" /></ModuleGuard>} />
            <Route path="document-mgt" element={<ModuleGuard moduleId="document-mgt"><ShellPage title="Бичиг Баримт (EDM)" moduleId="document-mgt" /></ModuleGuard>} />
            <Route path="whatsapp-api" element={<ModuleGuard moduleId="whatsapp-api"><ShellPage title="WhatsApp Бизнес" moduleId="whatsapp-api" /></ModuleGuard>} />
            <Route path="sms-gateway" element={<ModuleGuard moduleId="sms-gateway"><ShellPage title="SMS Платформ" moduleId="sms-gateway" /></ModuleGuard>} />
            <Route path="voip-pbx" element={<ModuleGuard moduleId="voip-pbx"><ShellPage title="Дуудлагын Төв (VoIP)" moduleId="voip-pbx" /></ModuleGuard>} />
            <Route path="chatbot-ai" element={<ModuleGuard moduleId="chatbot-ai"><ShellPage title="AI Чатбот" moduleId="chatbot-ai" /></ModuleGuard>} />
            <Route path="image-gen" element={<ModuleGuard moduleId="image-gen"><ShellPage title="Бүтээгдэхүүн Зураг AI" moduleId="image-gen" /></ModuleGuard>} />
            <Route path="text-analytics" element={<ModuleGuard moduleId="text-analytics"><ShellPage title="Сэтгэл Зүйн Анализ" moduleId="text-analytics" /></ModuleGuard>} />
            <Route path="property-mgt" element={<ModuleGuard moduleId="property-mgt"><ShellPage title="СӨХ & Хөрөнгө" moduleId="property-mgt" /></ModuleGuard>} />
            <Route path="energy-mgt" element={<ModuleGuard moduleId="energy-mgt"><ShellPage title="Эрчим Хүч хяналт" moduleId="energy-mgt" /></ModuleGuard>} />
            <Route path="animal-clinic" element={<ModuleGuard moduleId="animal-clinic"><ShellPage title="Мал Эмнэлэг" moduleId="animal-clinic" /></ModuleGuard>} />
            <Route path="farm-mgt" element={<ModuleGuard moduleId="farm-mgt"><ShellPage title="Фермийн Удирдлага" moduleId="farm-mgt" /></ModuleGuard>} />
            <Route path="butchery" element={<ModuleGuard moduleId="butchery"><ShellPage title="Мал Төхөөрөх Үйлдвэр" moduleId="butchery" /></ModuleGuard>} />
            <Route path="mining" element={<ModuleGuard moduleId="mining"><ShellPage title="Уул Уурхай" moduleId="mining" /></ModuleGuard>} />
            <Route path="micro-finance" element={<ModuleGuard moduleId="micro-finance"><ShellPage title="Бичил Санхүү (ББСБ)" moduleId="micro-finance" /></ModuleGuard>} />
            <Route path="stock-broker" element={<ModuleGuard moduleId="stock-broker"><ShellPage title="Хувьцаа & Арилжаа" moduleId="stock-broker" /></ModuleGuard>} />
            <Route path="crowdfunding" element={<ModuleGuard moduleId="crowdfunding"><ShellPage title="Хамтын Санхүүжилт" moduleId="crowdfunding" /></ModuleGuard>} />
            <Route path="hris" element={<ModuleGuard moduleId="hris"><ShellPage title="Нэгдсэн Ажилтан (HRIS)" moduleId="hris" /></ModuleGuard>} />
            <Route path="okr-tracker" element={<ModuleGuard moduleId="okr-tracker"><ShellPage title="OKR & Зорилт" moduleId="okr-tracker" /></ModuleGuard>} />
            <Route path="whistleblower" element={<ModuleGuard moduleId="whistleblower"><ShellPage title="Ёс Зүй & Гомдол" moduleId="whistleblower" /></ModuleGuard>} />
            <Route path="game-server" element={<ModuleGuard moduleId="game-server"><ShellPage title="Тоглоомын Сервер" moduleId="game-server" /></ModuleGuard>} />
            <Route path="cinema-pos" element={<ModuleGuard moduleId="cinema-pos"><ShellPage title="Кино Театр" moduleId="cinema-pos" /></ModuleGuard>} />
            <Route path="karaoke" element={<ModuleGuard moduleId="karaoke"><ShellPage title="Караоке систем" moduleId="karaoke" /></ModuleGuard>} />
            <Route path="night-club" element={<ModuleGuard moduleId="night-club"><ShellPage title="Шөнийн Клуб" moduleId="night-club" /></ModuleGuard>} />
            <Route path="billiards" element={<ModuleGuard moduleId="billiards"><ShellPage title="Биллярд & Снукер" moduleId="billiards" /></ModuleGuard>} />
            <Route path="pc-gaming" element={<ModuleGuard moduleId="pc-gaming"><ShellPage title="PC Тоглоомын Газар" moduleId="pc-gaming" /></ModuleGuard>} />
            <Route path="lotto" element={<ModuleGuard moduleId="lotto"><ShellPage title="Сугалаа Тэмцээн" moduleId="lotto" /></ModuleGuard>} />
            <Route path="donation" element={<ModuleGuard moduleId="donation"><ShellPage title="Хандив & ТББ" moduleId="donation" /></ModuleGuard>} />
            <Route path="volunteer" element={<ModuleGuard moduleId="volunteer"><ShellPage title="Сайн Дурынхан" moduleId="volunteer" /></ModuleGuard>} />
            <Route path="membership-club" element={<ModuleGuard moduleId="membership-club"><ShellPage title="Клуб Гишүүнчлэл" moduleId="membership-club" /></ModuleGuard>} />
            <Route path="church" element={<ModuleGuard moduleId="church"><ShellPage title="Сүм Хийд" moduleId="church" /></ModuleGuard>} />
            <Route path="cemetery" element={<ModuleGuard moduleId="cemetery"><ShellPage title="Оршуулгын Газар" moduleId="cemetery" /></ModuleGuard>} />
            <Route path="car-wash" element={<ModuleGuard moduleId="car-wash"><ShellPage title="Авто Угаалга" moduleId="car-wash" /></ModuleGuard>} />
            <Route path="valet" element={<ModuleGuard moduleId="valet"><ShellPage title="Валет Паркинг" moduleId="valet" /></ModuleGuard>} />
            <Route path="ride-hailing" element={<ModuleGuard moduleId="ride-hailing"><ShellPage title="Дуудлагын Жолооч" moduleId="ride-hailing" /></ModuleGuard>} />
            <Route path="delivery-partner" element={<ModuleGuard moduleId="delivery-partner"><ShellPage title="Хүргэлтийн Түнш" moduleId="delivery-partner" /></ModuleGuard>} />
            <Route path="laundry-locker" element={<ModuleGuard moduleId="laundry-locker"><ShellPage title="Локер Пасс" moduleId="laundry-locker" /></ModuleGuard>} />
            <Route path="water-delivery" element={<ModuleGuard moduleId="water-delivery"><ShellPage title="Ус Хүргэлт" moduleId="water-delivery" /></ModuleGuard>} />
            <Route path="gas-station" element={<ModuleGuard moduleId="gas-station"><ShellPage title="Штац & ШТС" moduleId="gas-station" /></ModuleGuard>} />
            <Route path="ev-charging" element={<ModuleGuard moduleId="ev-charging"><ShellPage title="EV Цэнэглэгч" moduleId="ev-charging" /></ModuleGuard>} />
            <Route path="bakery" element={<ModuleGuard moduleId="bakery"><ShellPage title="Талх Нарийн Боов" moduleId="bakery" /></ModuleGuard>} />
            <Route path="butchery-pos" element={<ModuleGuard moduleId="butchery-pos"><ShellPage title="Махны Дэлгүүр" moduleId="butchery-pos" /></ModuleGuard>} />
            <Route path="jewelry" element={<ModuleGuard moduleId="jewelry"><ShellPage title="Үнэт Эдлэл" moduleId="jewelry" /></ModuleGuard>} />
            <Route path="flower-shop" element={<ModuleGuard moduleId="flower-shop"><ShellPage title="Цэцгийн Дэлгүүр" moduleId="flower-shop" /></ModuleGuard>} />
            <Route path="bookstore" element={<ModuleGuard moduleId="bookstore"><ShellPage title="Номын Дэлгүүр" moduleId="bookstore" /></ModuleGuard>} />
            <Route path="pharmacy-b2b" element={<ModuleGuard moduleId="pharmacy-b2b"><ShellPage title="Эмийн Бөөний" moduleId="pharmacy-b2b" /></ModuleGuard>} />
            <Route path="fmcg-distro" element={<ModuleGuard moduleId="fmcg-distro"><ShellPage title="FMCG Дистрибьютер" moduleId="fmcg-distro" /></ModuleGuard>} />
            <Route path="import-export" element={<ModuleGuard moduleId="import-export"><ShellPage title="Импорт & Экспорт" moduleId="import-export" /></ModuleGuard>} />
            <Route path="software-reseller" element={<ModuleGuard moduleId="software-reseller"><ShellPage title="IT Reseller" moduleId="software-reseller" /></ModuleGuard>} />
            <Route path="ad-agency" element={<ModuleGuard moduleId="ad-agency"><ShellPage title="Медиа Агентлаг" moduleId="ad-agency" /></ModuleGuard>} />
            <Route path="translation" element={<ModuleGuard moduleId="translation"><ShellPage title="Орчуулгын Товчоо" moduleId="translation" /></ModuleGuard>} />
            <Route path="photo-studio" element={<ModuleGuard moduleId="photo-studio"><ShellPage title="Зургийн Студи" moduleId="photo-studio" /></ModuleGuard>} />
            <Route path="architect" element={<ModuleGuard moduleId="architect"><ShellPage title="Архитектур" moduleId="architect" /></ModuleGuard>} />
            <Route path="interior" element={<ModuleGuard moduleId="interior"><ShellPage title="Интерьер Дизайн" moduleId="interior" /></ModuleGuard>} />
            <Route path="security-guard" element={<ModuleGuard moduleId="security-guard"><ShellPage title="Харуул Хамгаалалт" moduleId="security-guard" /></ModuleGuard>} />
            <Route path="credit-score" element={<ModuleGuard moduleId="credit-score"><ShellPage title="Зээлийн Мэдээлэл" moduleId="credit-score" /></ModuleGuard>} />
            <Route path="collection" element={<ModuleGuard moduleId="collection"><ShellPage title="Авлага Барагдуулах" moduleId="collection" /></ModuleGuard>} />
            <Route path="wallet" element={<ModuleGuard moduleId="wallet"><ShellPage title="Цахим Хэтэвч" moduleId="wallet" /></ModuleGuard>} />
            <Route path="payment-gateway" element={<ModuleGuard moduleId="payment-gateway"><ShellPage title="Пэймэнт Гэйтвэй" moduleId="payment-gateway" /></ModuleGuard>} />
            <Route path="tax-compliance" element={<ModuleGuard moduleId="tax-compliance"><ShellPage title="Татварын Тайлан" moduleId="tax-compliance" /></ModuleGuard>} />
            <Route path="rooms" element={<ModuleGuard moduleId="rooms"><RoomsPage /></ModuleGuard>} />
            <Route path="queue" element={<ModuleGuard moduleId="queue"><QueuePage /></ModuleGuard>} />
            <Route path="rentals" element={<ModuleGuard moduleId="rentals"><ShellPage title="Түрээсийн Удирдлага" moduleId="rentals" /></ModuleGuard>} />
            <Route path="property-mgt" element={<ModuleGuard moduleId="property-mgt"><ShellPage title="СӨХ Хураамж" moduleId="property-mgt" /></ModuleGuard>} />
            <Route path="cleaning" element={<ModuleGuard moduleId="cleaning"><ShellPage title="Цэвэрлэгээ" moduleId="cleaning" /></ModuleGuard>} />
            <Route path="salon" element={<ModuleGuard moduleId="salon"><ShellPage title="Гоо Сайхан & Салон" moduleId="salon" /></ModuleGuard>} />
            <Route path="fitness" element={<ModuleGuard moduleId="fitness"><ShellPage title="Фитнес & Клуб" moduleId="fitness" /></ModuleGuard>} />
            <Route path="laundry" element={<ModuleGuard moduleId="laundry"><ShellPage title="Хими Цэвэрлэгээ" moduleId="laundry" /></ModuleGuard>} />
            <Route path="spa-wellness" element={<ModuleGuard moduleId="spa-wellness"><ShellPage title="Спа & Массаж" moduleId="spa-wellness" /></ModuleGuard>} />
            <Route path="event-tickets" element={<ModuleGuard moduleId="event-tickets"><TicketsPage /></ModuleGuard>} />
            <Route path="field-service" element={<ModuleGuard moduleId="field-service"><ShellPage title="Гадуур Засвар" moduleId="field-service" /></ModuleGuard>} />
            <Route path="repair-shop" element={<ModuleGuard moduleId="repair-shop"><ShellPage title="Засварын Газар" moduleId="repair-shop" /></ModuleGuard>} />
            <Route path="membership" element={<ModuleGuard moduleId="membership"><ShellPage title="VIP Гишүүнчлэл" moduleId="membership" /></ModuleGuard>} />
            <Route path="facility-mgt" element={<ModuleGuard moduleId="facility-mgt"><ShellPage title="Барилга Засвар" moduleId="facility-mgt" /></ModuleGuard>} />
            <Route path="manufacturing" element={<ModuleGuard moduleId="manufacturing"><ManufacturingPage /></ModuleGuard>} />
            <Route path="mrp" element={<ModuleGuard moduleId="mrp"><MRPPage /></ModuleGuard>} />
            <Route path="equipment" element={<ModuleGuard moduleId="equipment"><EquipmentPage /></ModuleGuard>} />
            <Route path="job-orders" element={<ModuleGuard moduleId="job-orders"><JobOrdersPage /></ModuleGuard>} />
            <Route path="projects" element={<ModuleGuard moduleId="projects"><ProjectsPage /></ModuleGuard>} />
            <Route path="tasks" element={<ModuleGuard moduleId="tasks"><TasksPage /></ModuleGuard>} />
            <Route path="plm" element={<ModuleGuard moduleId="plm"><PLMPage /></ModuleGuard>} />
            <Route path="sub-contracting" element={<ModuleGuard moduleId="sub-contracting"><SubContractingPage /></ModuleGuard>} />
            <Route path="bom" element={<ModuleGuard moduleId="bom"><BOMPage /></ModuleGuard>} />
            <Route path="qa" element={<ModuleGuard moduleId="qa"><QAPage /></ModuleGuard>} />
            <Route path="milestones" element={<ModuleGuard moduleId="milestones"><MilestonesPage /></ModuleGuard>} />
            <Route path="gantt-chart" element={<ModuleGuard moduleId="gantt-chart"><GanttChartPage /></ModuleGuard>} />
            <Route path="timesheet-billing" element={<ModuleGuard moduleId="timesheet-billing"><TimesheetBillingPage /></ModuleGuard>} />
            <Route path="construction" element={<ModuleGuard moduleId="construction"><ConstructionPage /></ModuleGuard>} />
            <Route path="architecture-design" element={<ModuleGuard moduleId="architecture-design"><ArchitectureDesignPage /></ModuleGuard>} />
            <Route path="education" element={<ModuleGuard moduleId="education"><ShellPage title="Сургалт & Курс" moduleId="education" /></ModuleGuard>} />
            <Route path="healthcare" element={<ModuleGuard moduleId="healthcare"><ShellPage title="Эмнэлэг & Клиник" moduleId="healthcare" /></ModuleGuard>} />
            <Route path="pharmacy" element={<ModuleGuard moduleId="pharmacy"><ShellPage title="Эмийн Сан" moduleId="pharmacy" /></ModuleGuard>} />
            <Route path="microfinance" element={<ModuleGuard moduleId="microfinance"><ShellPage title="ББСБ / Ломбард" moduleId="microfinance" /></ModuleGuard>} />
            <Route path="real-estate" element={<ModuleGuard moduleId="real-estate"><ShellPage title="Үл Хөдлөх Хөрөнгө" moduleId="real-estate" /></ModuleGuard>} />
            <Route path="vehicles" element={<ModuleGuard moduleId="vehicles"><VehiclesPage /></ModuleGuard>} />
            <Route path="fleet" element={<ModuleGuard moduleId="fleet"><FleetPage /></ModuleGuard>} />
            <Route path="import-cost" element={<ModuleGuard moduleId="import-cost"><ImportCostPage /></ModuleGuard>} />
            <Route path="freight" element={<ModuleGuard moduleId="freight"><FreightPage /></ModuleGuard>} />
            <Route path="vendor-rating" element={<ModuleGuard moduleId="vendor-rating"><VendorRatingPage /></ModuleGuard>} />
            <Route path="route-optimize" element={<ModuleGuard moduleId="route-optimize"><RouteOptimizePage /></ModuleGuard>} />
            <Route path="agriculture" element={<ModuleGuard moduleId="agriculture"><ShellPage title="Газар Тариалан" moduleId="agriculture" /></ModuleGuard>} />
            <Route path="veterinary" element={<ModuleGuard moduleId="veterinary"><ShellPage title="Мал Эмнэлэг" moduleId="veterinary" /></ModuleGuard>} />
            <Route path="mining" element={<ModuleGuard moduleId="mining"><ShellPage title="Уул Уурхай" moduleId="mining" /></ModuleGuard>} />
            <Route path="legal" element={<ModuleGuard moduleId="legal"><ShellPage title="Хуульч & Өмгөөлөгч" moduleId="legal" /></ModuleGuard>} />
            <Route path="ngo" element={<ModuleGuard moduleId="ngo"><ShellPage title="ТББ & Сан" moduleId="ngo" /></ModuleGuard>} />
            <Route path="printing" element={<ModuleGuard moduleId="printing"><ShellPage title="Хэвлэлийн Үйлдвэр" moduleId="printing" /></ModuleGuard>} />
            <Route path="car-rental" element={<ModuleGuard moduleId="car-rental"><ShellPage title="Автомашин Түрээс" moduleId="car-rental" /></ModuleGuard>} />
            <Route path="driving-school" element={<ModuleGuard moduleId="driving-school"><ShellPage title="Жолооны Курс" moduleId="driving-school" /></ModuleGuard>} />
            <Route path="parking" element={<ModuleGuard moduleId="parking"><ShellPage title="Зогсоол" moduleId="parking" /></ModuleGuard>} />
            <Route path="library" element={<ModuleGuard moduleId="library"><ShellPage title="Номын Сан" moduleId="library" /></ModuleGuard>} />
            <Route path="tour-operator" element={<ModuleGuard moduleId="tour-operator"><ShellPage title="Аялал Жуулчлал" moduleId="tour-operator" /></ModuleGuard>} />
            <Route path="documents" element={<ModuleGuard moduleId="documents"><DocumentsPage /></ModuleGuard>} />
            <Route path="e-sign" element={<ModuleGuard moduleId="e-sign"><ESignPage /></ModuleGuard>} />
            <Route path="internal-chat" element={<ModuleGuard moduleId="internal-chat"><InternalChatPage /></ModuleGuard>} />
            <Route path="approvals" element={<ModuleGuard moduleId="approvals"><ApprovalsPage /></ModuleGuard>} />
            <Route path="calendar" element={<ModuleGuard moduleId="calendar"><CalendarPage /></ModuleGuard>} />
            <Route path="notes" element={<ModuleGuard moduleId="notes"><NotesPage /></ModuleGuard>} />
            <Route path="pass-manager" element={<ModuleGuard moduleId="pass-manager"><PassManagerPage /></ModuleGuard>} />
            <Route path="video-meetings" element={<ModuleGuard moduleId="video-meetings"><VideoMeetingsPage /></ModuleGuard>} />
            <Route path="whiteboard" element={<ModuleGuard moduleId="whiteboard"><WhiteboardPage /></ModuleGuard>} />
            <Route path="announcements" element={<ModuleGuard moduleId="announcements"><AnnouncementsPage /></ModuleGuard>} />
            <Route path="recruitment" element={<ModuleGuard moduleId="recruitment"><RecruitmentPage /></ModuleGuard>} />
            <Route path="leave" element={<ModuleGuard moduleId="leave"><LeavePage /></ModuleGuard>} />
            <Route path="performance" element={<ModuleGuard moduleId="performance"><PerformancePage /></ModuleGuard>} />
            <Route path="automations" element={<ModuleGuard moduleId="automations"><ShellPage title="RPA Автомат" moduleId="automations" /></ModuleGuard>} />
            <Route path="api-webhooks" element={<ModuleGuard moduleId="api-webhooks"><ShellPage title="API & Webhook" moduleId="api-webhooks" /></ModuleGuard>} />
            <Route path="ocr-scanner" element={<ModuleGuard moduleId="ocr-scanner"><ShellPage title="AI Текст Уншигч" moduleId="ocr-scanner" /></ModuleGuard>} />
            <Route path="audit-trail" element={<ModuleGuard moduleId="audit-trail"><ShellPage title="Үйлдлийн Лог" moduleId="audit-trail" /></ModuleGuard>} />
            <Route path="data-migration" element={<ModuleGuard moduleId="data-migration"><ShellPage title="Дата Импорт" moduleId="data-migration" /></ModuleGuard>} />
            <Route path="custom-reports" element={<ModuleGuard moduleId="custom-reports"><ShellPage title="Тайлан Зохиогч" moduleId="custom-reports" /></ModuleGuard>} />
            <Route path="cctv-sync" element={<ModuleGuard moduleId="cctv-sync"><ShellPage title="Камер AI Ирц" moduleId="cctv-sync" /></ModuleGuard>} />
            <Route path="ai-forecaster" element={<ModuleGuard moduleId="ai-forecaster"><ShellPage title="AI Таамаглагч" moduleId="ai-forecaster" /></ModuleGuard>} />
            <Route path="ai-chatbot" element={<ModuleGuard moduleId="ai-chatbot"><ShellPage title="AI Чатбот" moduleId="ai-chatbot" /></ModuleGuard>} />
            <Route path="gdpr-compliance" element={<ModuleGuard moduleId="gdpr-compliance"><ShellPage title="GDPR Нийцлэл" moduleId="gdpr-compliance" /></ModuleGuard>} />
            <Route path="data-backup" element={<ModuleGuard moduleId="data-backup"><ShellPage title="Автомат Нөөцлөлт" moduleId="data-backup" /></ModuleGuard>} />
            <Route path="ip-whitelist" element={<ModuleGuard moduleId="ip-whitelist"><ShellPage title="IP Хязгаарлалт" moduleId="ip-whitelist" /></ModuleGuard>} />
            <Route path="two-factor-auth" element={<ModuleGuard moduleId="two-factor-auth"><ShellPage title="2FA Баталгаажуулалт" moduleId="two-factor-auth" /></ModuleGuard>} />
            <Route path="role-manager" element={<ModuleGuard moduleId="role-manager"><ShellPage title="Эрхийн Удирдлага" moduleId="role-manager" /></ModuleGuard>} />
            <Route path="session-manager" element={<ModuleGuard moduleId="session-manager"><ShellPage title="Сессийн Хяналт" moduleId="session-manager" /></ModuleGuard>} />
            <Route path="document-encryption" element={<ModuleGuard moduleId="document-encryption"><ShellPage title="Баримт Шифрлэлт" moduleId="document-encryption" /></ModuleGuard>} />
            <Route path="sso" element={<ModuleGuard moduleId="sso"><ShellPage title="Single Sign-On" moduleId="sso" /></ModuleGuard>} />
            <Route path="access-policy" element={<ModuleGuard moduleId="access-policy"><ShellPage title="Хандалтын Бодлого" moduleId="access-policy" /></ModuleGuard>} />
            <Route path="pen-test-report" element={<ModuleGuard moduleId="pen-test-report"><ShellPage title="Аюулгүй Байдалын Тайлан" moduleId="pen-test-report" /></ModuleGuard>} />
            <Route path="tax-reporting" element={<ModuleGuard moduleId="tax-reporting"><ShellPage title="Татварын Тайлан" moduleId="tax-reporting" /></ModuleGuard>} />
            <Route path="customs-declaration" element={<ModuleGuard moduleId="customs-declaration"><ShellPage title="Гаалийн Мэдүүлэг" moduleId="customs-declaration" /></ModuleGuard>} />
            <Route path="labor-compliance" element={<ModuleGuard moduleId="labor-compliance"><ShellPage title="Хөдөлмөрийн Хууль" moduleId="labor-compliance" /></ModuleGuard>} />
            <Route path="anti-fraud" element={<ModuleGuard moduleId="anti-fraud"><ShellPage title="Залилангийн Илрүүлэлт" moduleId="anti-fraud" /></ModuleGuard>} />
            <Route path="contract-compliance" element={<ModuleGuard moduleId="contract-compliance"><ShellPage title="Гэрээний Нийцлэл" moduleId="contract-compliance" /></ModuleGuard>} />
            <Route path="insurance" element={<ModuleGuard moduleId="insurance"><ShellPage title="Даатгалын Удирдлага" moduleId="insurance" /></ModuleGuard>} />
            <Route path="risk-assessment" element={<ModuleGuard moduleId="risk-assessment"><ShellPage title="Эрсдэлийн Үнэлгээ" moduleId="risk-assessment" /></ModuleGuard>} />
            <Route path="environmental" element={<ModuleGuard moduleId="environmental"><ShellPage title="Байгаль Орчин" moduleId="environmental" /></ModuleGuard>} />
            <Route path="health-safety" element={<ModuleGuard moduleId="health-safety"><ShellPage title="ХАБЭА" moduleId="health-safety" /></ModuleGuard>} />
            <Route path="whistleblower" element={<ModuleGuard moduleId="whistleblower"><ShellPage title="Нууц Гомдол" moduleId="whistleblower" /></ModuleGuard>} />
            <Route path="data-retention" element={<ModuleGuard moduleId="data-retention"><ShellPage title="Өгөгдөл Хадгалалт" moduleId="data-retention" /></ModuleGuard>} />
            <Route path="vendor-compliance" element={<ModuleGuard moduleId="vendor-compliance"><ShellPage title="Нийлүүлэгч Шалгалт" moduleId="vendor-compliance" /></ModuleGuard>} />
            <Route path="export-control" element={<ModuleGuard moduleId="export-control"><ShellPage title="Экспортын Хяналт" moduleId="export-control" /></ModuleGuard>} />
            <Route path="energy-audit" element={<ModuleGuard moduleId="energy-audit"><ShellPage title="Эрчим Хүчний Аудит" moduleId="energy-audit" /></ModuleGuard>} />
            <Route path="food-safety" element={<ModuleGuard moduleId="food-safety"><ShellPage title="Хүнсний Аюулгүй Байдал" moduleId="food-safety" /></ModuleGuard>} />
            <Route path="qpay-integration" element={<ModuleGuard moduleId="qpay-integration"><ShellPage title="QPay Холболт" moduleId="qpay-integration" /></ModuleGuard>} />
            <Route path="socialpay" element={<ModuleGuard moduleId="socialpay"><ShellPage title="SocialPay Холболт" moduleId="socialpay" /></ModuleGuard>} />
            <Route path="khan-bank-api" element={<ModuleGuard moduleId="khan-bank-api"><ShellPage title="Хаан Банк API" moduleId="khan-bank-api" /></ModuleGuard>} />
            <Route path="golomt-api" element={<ModuleGuard moduleId="golomt-api"><ShellPage title="Голомт Банк API" moduleId="golomt-api" /></ModuleGuard>} />
            <Route path="ebarimt-api" element={<ModuleGuard moduleId="ebarimt-api"><ShellPage title="И-Баримт API" moduleId="ebarimt-api" /></ModuleGuard>} />
            <Route path="facebook-shop" element={<ModuleGuard moduleId="facebook-shop"><ShellPage title="Facebook Дэлгүүр" moduleId="facebook-shop" /></ModuleGuard>} />
            <Route path="instagram-api" element={<ModuleGuard moduleId="instagram-api"><ShellPage title="Instagram API" moduleId="instagram-api" /></ModuleGuard>} />
            <Route path="tiktok-shop" element={<ModuleGuard moduleId="tiktok-shop"><ShellPage title="TikTok Shop" moduleId="tiktok-shop" /></ModuleGuard>} />
            <Route path="google-analytics" element={<ModuleGuard moduleId="google-analytics"><ShellPage title="Google Analytics" moduleId="google-analytics" /></ModuleGuard>} />
            <Route path="sms-gateway" element={<ModuleGuard moduleId="sms-gateway"><ShellPage title="SMS Илгээгч" moduleId="sms-gateway" /></ModuleGuard>} />
            <Route path="email-smtp" element={<ModuleGuard moduleId="email-smtp"><ShellPage title="Email SMTP" moduleId="email-smtp" /></ModuleGuard>} />
            <Route path="push-notifications" element={<ModuleGuard moduleId="push-notifications"><ShellPage title="Push Мэдэгдэл" moduleId="push-notifications" /></ModuleGuard>} />
            <Route path="iot-sensors" element={<ModuleGuard moduleId="iot-sensors"><ShellPage title="IoT Мэдрэгч" moduleId="iot-sensors" /></ModuleGuard>} />
            <Route path="cold-storage" element={<ModuleGuard moduleId="cold-storage"><ShellPage title="Хүйтэн Агуулах" moduleId="cold-storage" /></ModuleGuard>} />
            <Route path="smart-lock" element={<ModuleGuard moduleId="smart-lock"><ShellPage title="Ухаалаг Түгжээ" moduleId="smart-lock" /></ModuleGuard>} />
            <Route path="rfid-tracking" element={<ModuleGuard moduleId="rfid-tracking"><ShellPage title="RFID Мөрдөлт" moduleId="rfid-tracking" /></ModuleGuard>} />
            <Route path="gps-tracking" element={<ModuleGuard moduleId="gps-tracking"><ShellPage title="GPS Хяналт" moduleId="gps-tracking" /></ModuleGuard>} />
            <Route path="biometric" element={<ModuleGuard moduleId="biometric"><ShellPage title="Биометрик Төхөөрөмж" moduleId="biometric" /></ModuleGuard>} />
            <Route path="receipt-printer" element={<ModuleGuard moduleId="receipt-printer"><ShellPage title="Тасалбар Хэвлэгч" moduleId="receipt-printer" /></ModuleGuard>} />
            <Route path="cash-drawer" element={<ModuleGuard moduleId="cash-drawer"><ShellPage title="Мөнгөний Хайрцаг" moduleId="cash-drawer" /></ModuleGuard>} />
            <Route path="label-printer" element={<ModuleGuard moduleId="label-printer"><ShellPage title="Шошго Хэвлэгч" moduleId="label-printer" /></ModuleGuard>} />
            <Route path="scanner-gun" element={<ModuleGuard moduleId="scanner-gun"><ShellPage title="Скан Буу" moduleId="scanner-gun" /></ModuleGuard>} />
            <Route path="kitchen-printer" element={<ModuleGuard moduleId="kitchen-printer"><ShellPage title="Гал Тогооны Принтер" moduleId="kitchen-printer" /></ModuleGuard>} />
            <Route path="customer-display" element={<ModuleGuard moduleId="customer-display"><ShellPage title="Хэрэглэгчийн Дэлгэц" moduleId="customer-display" /></ModuleGuard>} />
            <Route path="marketplace-hub" element={<ModuleGuard moduleId="marketplace-hub"><ShellPage title="Marketplace Hub" moduleId="marketplace-hub" /></ModuleGuard>} />
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
