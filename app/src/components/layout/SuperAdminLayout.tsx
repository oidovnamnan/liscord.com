import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { useUIStore } from '../../store';
import { GlobalBanner } from '../common/GlobalBanner';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import './AppLayout.css';

export function SuperAdminLayout() {
    const { sidebarCollapsed, theme } = useUIStore();
    useDynamicTheme(); // Phase 40: Apply dynamic theme

    // Resolve system theme if needed
    const resolvedTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    return (
        <div
            className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}
            data-theme={resolvedTheme}
        >
            <div className="app-banners">
                <GlobalBanner />
            </div>
            <div className="app-container">
                <SuperAdminSidebar />
                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
