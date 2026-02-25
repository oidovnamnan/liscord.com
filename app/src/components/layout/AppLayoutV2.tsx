import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalBanner } from '../common/GlobalBanner';
import { useUIStore } from '../../store';
import './AppLayoutV2.css';

export function AppLayoutV2() {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="app-v2">
            <GlobalBanner />
            <div className={`app-v2-container ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <Sidebar />
                <main className="app-v2-main">
                    <Outlet />
                </main>
            </div>

            {/* Background decorative elements for V2 Pro Max */}
            <div className="v2-bg-glow glow-1" />
            <div className="v2-bg-glow glow-2" />
        </div>
    );
}
