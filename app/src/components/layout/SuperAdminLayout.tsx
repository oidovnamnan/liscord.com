import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { useUIStore } from '../../store';
import { GlobalBanner } from '../common/GlobalBanner';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import './AppLayout.css';

export function SuperAdminLayout() {
    const { sidebarCollapsed } = useUIStore();
    useDynamicTheme(); // Phase 40: Apply dynamic theme

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <GlobalBanner />
            <SuperAdminSidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
