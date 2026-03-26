import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore, useBusinessStore } from '../../store';
import { ImpersonationBanner } from '../common/ImpersonationBanner';
import { GlobalBanner } from '../common/GlobalBanner';
import { QuickLookup } from '../common/QuickLookup';
import { QuickDashboard } from '../common/QuickDashboard';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Menu } from 'lucide-react';
import './AppLayout.css';

export function AppLayout() {
    const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
    const { business, employee } = useBusinessStore();
    const [showQuickLookup, setShowQuickLookup] = useState(false);
    const [showQuickDash, setShowQuickDash] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    useDynamicTheme(); // Phase 40: Apply dynamic theme

    // Global ⌘K / Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowQuickLookup(prev => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                setShowQuickDash(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Browser back button → stay within admin, navigate to dashboard
    const handlePopState = useCallback(() => {
        const path = window.location.pathname;
        if (path.startsWith('/app')) {
            // Already on dashboard → push state to prevent leaving
            if (path === '/app' || path === '/app/') {
                window.history.pushState(null, '', '/app');
            }
            // On sub-page → navigate to dashboard
            else {
                navigate('/app', { replace: true });
            }
        }
    }, [navigate]);

    useEffect(() => {
        // Push initial state so we have something to "go back" to
        window.history.pushState(null, '', location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handlePopState, location.pathname]);

    // Heartbeat: update employee's lastActiveAt every 60s
    useEffect(() => {
        if (!business?.id || !employee?.id) return;
        const bizId = business.id;
        const empId = employee.id;

        const sendHeartbeat = () => {
            try {
                updateDoc(doc(db, 'businesses', bizId, 'employees', empId), {
                    lastActiveAt: serverTimestamp(),
                });
            } catch { /* ignore */ }
        };

        // Send immediately
        sendHeartbeat();

        // Send every 60 seconds
        const interval = setInterval(sendHeartbeat, 60_000);

        // Send when tab becomes visible again
        const onVisibility = () => {
            if (document.visibilityState === 'visible') sendHeartbeat();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [business?.id, employee?.id]);

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <div className="app-banners">
                <GlobalBanner />
                <ImpersonationBanner />
            </div>
            <div className="app-container">
                <Sidebar />

                {/* Mobile hamburger button */}
                {!sidebarOpen && (
                    <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Цэс нээх">
                        <Menu size={22} />
                    </button>
                )}

                <main className="app-main">
                    <div className="app-main-scrolled">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Quick Lookup Spotlight (⌘K) */}
            <QuickLookup isOpen={showQuickLookup} onClose={() => setShowQuickLookup(false)} />
            <QuickDashboard isOpen={showQuickDash} onClose={() => setShowQuickDash(false)} />
        </div>
    );
}
