import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const StorefrontWrapper = lazy(() => import('./pages/Storefront/StorefrontWrapper').then(m => ({ default: m.StorefrontWrapper })));
const StoreCatalog = lazy(() => import('./pages/Storefront/StoreCatalog').then(m => ({ default: m.StoreCatalog })));
const StoreCheckout = lazy(() => import('./pages/Storefront/StoreCheckout').then(m => ({ default: m.StoreCheckout })));
const StoreMyOrders = lazy(() => import('./pages/Storefront/StoreMyOrders').then(m => ({ default: m.StoreMyOrders })));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#6c5ce7' }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/:slug" element={<StorefrontWrapper />}>
            <Route index element={<StoreCatalog />} />
            <Route path="checkout" element={<StoreCheckout />} />
            <Route path="my-orders" element={<StoreMyOrders />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
