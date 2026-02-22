import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store';
import { ImpersonationBanner } from '../common/ImpersonationBanner';
import './AppLayout.css';

export function AppLayout() {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <ImpersonationBanner />
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}
