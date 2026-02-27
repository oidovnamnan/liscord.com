import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store';
import { ImpersonationBanner } from '../common/ImpersonationBanner';
import { GlobalBanner } from '../common/GlobalBanner';
import { useDynamicTheme } from '../../hooks/useDynamicTheme';
import './AppLayout.css';

export function AppLayout() {
    const { sidebarCollapsed } = useUIStore();
    useDynamicTheme(); // Phase 40: Apply dynamic theme

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <div className="app-banners">
                <GlobalBanner />
                <ImpersonationBanner />
            </div>
            <div className="app-container">
                <Sidebar />
                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
