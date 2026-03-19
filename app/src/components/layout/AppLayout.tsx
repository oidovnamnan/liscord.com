import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore, useBusinessStore } from '../../store';
import { ImpersonationBanner } from '../common/ImpersonationBanner';
import { GlobalBanner } from '../common/GlobalBanner';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Menu } from 'lucide-react';
import './AppLayout.css';

export function AppLayout() {
    const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
    const { business, employee } = useBusinessStore();
    useDynamicTheme(); // Phase 40: Apply dynamic theme

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
        </div>
    );
}
